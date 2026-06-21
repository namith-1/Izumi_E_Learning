const crypto = require("crypto");
const https = require("https");

const RAZORPAY_API_HOST = "api.razorpay.com";

const getGatewayConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
});

const isGatewayConfigured = () => {
  const { keyId, keySecret } = getGatewayConfig();
  return Boolean(keyId && keySecret);
};

// idempotencyKey: optional string. When provided, Razorpay deduplicates the
// request — if your server sends the same key twice (e.g. after a crash/retry),
// Razorpay returns the original response instead of executing it again.
// This is the industry standard to prevent double-charging / double-paying.
const requestRazorpay = (path, payload, idempotencyKey = null) => {
  const { keyId, keySecret } = getGatewayConfig();
  const body = JSON.stringify(payload);
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  };

  // Attach idempotency key when provided (critical for payouts)
  if (idempotencyKey) {
    headers["X-Payout-Idempotency"] = idempotencyKey;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: RAZORPAY_API_HOST,
        path,
        method: "POST",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch (err) {
            return reject(new Error("Razorpay returned an invalid response."));
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            return resolve(parsed);
          }

          const message =
            parsed?.error?.description ||
            parsed?.error?.reason ||
            "Razorpay request failed.";
          return reject(new Error(message));
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
};

const toSmallestCurrencyUnit = (amount) => Math.round(Number(amount || 0) * 100);

const createOrder = async ({ amount, currency, receipt, notes }) => {
  if (!isGatewayConfigured()) {
    const err = new Error("Razorpay keys are not configured.");
    err.code = "RAZORPAY_NOT_CONFIGURED";
    throw err;
  }

  return requestRazorpay("/v1/orders", {
    amount: toSmallestCurrencyUnit(amount),
    currency,
    receipt,
    notes,
    payment_capture: 1,
  });
};

// idempotencyKey should be globally unique per payout run, e.g.
// "payout-<teacherId>-<YYYY-MM>" so the worker can safely retry
// without ever double-paying the instructor.
const createPayout = async ({ fundAccountId, amount, currency, reference, notes, idempotencyKey }) => {
  if (!isGatewayConfigured() || !process.env.RAZORPAYX_ACCOUNT_NUMBER) {
    const err = new Error("RazorpayX payout credentials are not configured.");
    err.code = "RAZORPAYX_NOT_CONFIGURED";
    throw err;
  }

  if (!fundAccountId) {
    const err = new Error("Instructor Razorpay fund account is missing.");
    err.code = "RAZORPAYX_FUND_ACCOUNT_MISSING";
    throw err;
  }

  return requestRazorpay(
    "/v1/payouts",
    {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: toSmallestCurrencyUnit(amount),
      currency,
      mode: process.env.RAZORPAYX_PAYOUT_MODE || "IMPS",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: reference,
      narration: "Izumi weekly instructor payout",
      notes,
    },
    idempotencyKey || null,  // ← Golden Rule #1: Idempotency
  );
};

const verifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const { keySecret } = getGatewayConfig();
  if (!keySecret) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const actual = Buffer.from(razorpay_signature || "");
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actual);
};

module.exports = {
  createOrder,
  createPayout,
  getGatewayConfig,
  isGatewayConfigured,
  toSmallestCurrencyUnit,
  verifyPaymentSignature,
};
