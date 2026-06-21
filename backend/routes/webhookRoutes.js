const express = require("express");
const router = express.Router();
const { handleRazorpayWebhook } = require("../controllers/webhookController");

/**
 * POST /api/webhook/razorpay
 *
 * This route is intentionally PUBLIC (no isAuthenticated middleware).
 * Razorpay calls it directly from their servers — they have no session.
 *
 * Security is handled by verifying the X-Razorpay-Signature header
 * using HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET inside the controller.
 *
 * IMPORTANT: express.json() must NOT run before this route.
 * We use express.raw() here to capture the raw request body bytes,
 * which is required for the HMAC signature to verify correctly.
 */
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }), // capture raw bytes
  (req, res, next) => {
    // Attach raw body string for signature verification
    req.rawBody = req.body;
    // Parse body so controller can access req.body.event etc.
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Invalid JSON payload." });
    }
    next();
  },
  handleRazorpayWebhook
);

module.exports = router;
