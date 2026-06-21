// Quick test script for all payment-related endpoints
const http = require("http");

const BASE = "http://localhost:5000";

const req = (method, path, body = null) =>
  new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on("error", (e) => resolve({ status: "ERROR", body: e.message }));
    if (data) r.write(data);
    r.end();
  });

(async () => {
  console.log("═══════════════════════════════════════");
  console.log("  Payment System — Server Test Report  ");
  console.log("═══════════════════════════════════════\n");

  // 1. Health check
  const health = await req("GET", "/api/health");
  console.log("1. Health Check");
  console.log("   Status :", health.status === 200 ? "✅ 200 OK" : `❌ ${health.status}`);
  console.log("   DB     :", health.body.database === "connected" ? "✅ MongoDB Connected" : `❌ ${health.body.database}`);
  console.log();

  // 2. Razorpay order (no session = should get 401)
  const order = await req("POST", "/api/payments/student/razorpay/order", { courseId: "test" });
  console.log("2. POST /api/payments/student/razorpay/order (no session)");
  console.log("   Status :", order.status === 401 ? "✅ 401 Unauthorized (correct, needs login)" : `⚠️  ${order.status}`);
  console.log("   Message:", order.body?.message || order.body);
  console.log();

  // 3. Verify endpoint (no session = should get 401)
  const verify = await req("POST", "/api/payments/student/razorpay/verify", {});
  console.log("3. POST /api/payments/student/razorpay/verify (no session)");
  console.log("   Status :", verify.status === 401 ? "✅ 401 Unauthorized (correct)" : `⚠️  ${verify.status}`);
  console.log("   Message:", verify.body?.message || verify.body);
  console.log();

  // 4. Webhook endpoint (no signature = should get 400)
  const webhook = await req("POST", "/api/webhook/razorpay", { event: "payment.captured", payload: {} });
  console.log("4. POST /api/webhook/razorpay (no signature header)");
  console.log("   Status :", webhook.status === 400 ? "✅ 400 Rejected (invalid signature, correct!)" : `⚠️  ${webhook.status}`);
  console.log("   Message:", webhook.body?.message || webhook.body);
  console.log();

  // 5. Admin payout preview (no session = should get 401)
  const preview = await req("GET", "/api/payments/admin/payouts/weekly");
  console.log("5. GET /api/payments/admin/payouts/weekly (no session)");
  console.log("   Status :", preview.status === 401 ? "✅ 401 Unauthorized (correct)" : `⚠️  ${preview.status}`);
  console.log("   Message:", preview.body?.message || preview.body);
  console.log();

  // 6. Student transactions (no session = should get 401)
  const txns = await req("GET", "/api/payments/student/transactions");
  console.log("6. GET /api/payments/student/transactions (no session)");
  console.log("   Status :", txns.status === 401 ? "✅ 401 Unauthorized (correct)" : `⚠️  ${txns.status}`);
  console.log("   Message:", txns.body?.message || txns.body);
  console.log();

  console.log("═══════════════════════════════════════");
  console.log("  Razorpay Keys Check");
  console.log("═══════════════════════════════════════");
  require("dotenv").config();
  const rp = require("./services/razorpayService");
  console.log("  KEY_ID configured  :", rp.isGatewayConfigured() ? "✅ YES" : "❌ NO");
  const { keyId } = rp.getGatewayConfig();
  console.log("  Mode               :", keyId?.startsWith("rzp_live") ? "🔴 LIVE" : "🟡 TEST");
  console.log("  WEBHOOK_SECRET set :", !!process.env.RAZORPAY_WEBHOOK_SECRET ? "✅ YES" : "❌ NO");
  console.log("  RAZORPAYX set      :", !!process.env.RAZORPAYX_ACCOUNT_NUMBER ? "✅ YES" : "⚠️  NO (payouts disabled)");
  console.log("═══════════════════════════════════════\n");
})();
