const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Enrollment = require("../models/Enrollment");
const EnrollmentAnalytics = require("../models/EnrollmentAnalytics");
const cacheService = require("../services/cacheService");

// ─── Signature Verification ──────────────────────────────────────────────────
// Razorpay signs every webhook POST with:
//   X-Razorpay-Signature: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)
// We MUST use the raw body bytes (not parsed JSON) for this to work.
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature || "");
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(expBuf, sigBuf);
};

// ─── Shared helper: enroll student after confirmed payment ────────────────────
const createEnrollmentIfNeeded = async (transaction) => {
  const existing = await Enrollment.findOne({
    courseId: transaction.courseId,
    studentId: transaction.studentId,
  });
  if (existing) return existing;

  const enrollment = await Enrollment.create({
    courseId: transaction.courseId,
    studentId: transaction.studentId,
  });

  await cacheService.del(`student:enrollments:${transaction.studentId}`);

  await EnrollmentAnalytics.create({
    courseId: transaction.courseId,
    studentId: transaction.studentId,
    price: transaction.amount || 0,
  });

  return enrollment;
};

// ─── Main Webhook Handler ────────────────────────────────────────────────────
exports.handleRazorpayWebhook = async (req, res) => {
  // 1. Verify the signature first — reject anything that doesn't match
  const signature = req.headers["x-razorpay-signature"];
  const isValid = verifyWebhookSignature(req.rawBody, signature);

  if (!isValid) {
    console.warn("[Webhook] Invalid Razorpay signature — request rejected.");
    return res.status(400).json({ message: "Invalid webhook signature." });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`[Webhook] Received event: ${event}`);

  try {
    // ── payment.captured ──────────────────────────────────────────────────
    // Fires when Razorpay successfully captures the payment from the student.
    // This is the PRIMARY enrollment trigger — reliable even if the browser closes.
    if (event === "payment.captured") {
      const payment = payload?.payment?.entity;
      if (!payment) return res.status(400).json({ message: "Missing payment entity." });

      const { order_id, id: paymentId, method, signature: paySignature } = payment;

      // Find the pending transaction by Razorpay order ID
      const transaction = await Transaction.findOne({
        gatewayOrderId: order_id,
        gateway: "razorpay",
      });

      if (!transaction) {
        // Could be a duplicate webhook or a test event — respond 200 so Razorpay doesn't retry
        console.warn(`[Webhook] payment.captured: No transaction found for order ${order_id}`);
        return res.status(200).json({ message: "Transaction not found — ignored." });
      }

      // Idempotent: if already paid (e.g. frontend verify already ran), just enroll
      if (transaction.status !== "paid") {
        transaction.status = "paid";
        transaction.payoutStatus = "pending";
        transaction.gatewayPaymentId = paymentId;
        transaction.gatewaySignature = paySignature || "";
        transaction.paymentMethod = normaliseMethod(method);
        transaction.notes = `${transaction.notes || ""} Confirmed via webhook.`.trim();
        await transaction.save();
      }

      await createEnrollmentIfNeeded(transaction);
      console.log(`[Webhook] ✅ Enrolled student ${transaction.studentId} in course ${transaction.courseId}`);
      return res.status(200).json({ message: "payment.captured handled." });
    }

    // ── payment.failed ────────────────────────────────────────────────────
    // Fires when the payment attempt fails (wrong OTP, insufficient funds, etc.)
    if (event === "payment.failed") {
      const payment = payload?.payment?.entity;
      if (!payment) return res.status(400).json({ message: "Missing payment entity." });

      const { order_id, error_description, error_reason } = payment;

      const transaction = await Transaction.findOne({
        gatewayOrderId: order_id,
        gateway: "razorpay",
      });

      if (!transaction) {
        return res.status(200).json({ message: "Transaction not found — ignored." });
      }

      // Only update if still pending (don't overwrite an already-paid transaction)
      if (transaction.status === "pending") {
        transaction.status = "failed";
        transaction.payoutStatus = "on-hold";
        transaction.notes =
          `${transaction.notes || ""} Failed via webhook: ${error_description || error_reason || "unknown"}.`.trim();
        await transaction.save();
        console.log(`[Webhook] ❌ Payment failed for order ${order_id}`);
      }

      return res.status(200).json({ message: "payment.failed handled." });
    }

    // ── Unhandled events — respond 200 so Razorpay doesn't keep retrying ─
    console.log(`[Webhook] Unhandled event type: ${event} — ignored.`);
    return res.status(200).json({ message: `Event ${event} not handled.` });

  } catch (err) {
    console.error("[Webhook] Error processing event:", err.message);
    // Return 500 so Razorpay retries the webhook later
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const METHOD_MAP = {
  card: "card",
  upi: "upi",
  wallet: "wallet",
  netbanking: "netbanking",
  "bank_transfer": "bank-transfer",
};
const normaliseMethod = (method) => METHOD_MAP[method] || "other";
