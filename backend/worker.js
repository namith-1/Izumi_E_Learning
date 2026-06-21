/**
 * worker.js — Background Payout Worker (Pillar 4)
 *
 * This is a SEPARATE process from server.js.
 * It does NOT listen to web traffic. Its only job is to run heavy,
 * slow financial tasks on a schedule.
 *
 * Run it alongside your main server:
 *   node worker.js
 *
 * Or via npm:
 *   npm run worker
 *
 * Architecture:
 *  ┌─────────────────┐      ┌──────────────────────────────────┐
 *  │   server.js     │      │          worker.js               │
 *  │  (web traffic)  │      │  (cron, no HTTP server)          │
 *  │  < 200ms resp.  │      │  runs on 1st & 15th of month     │
 *  │                 │      │  locks DB → calculates payouts   │
 *  │                 │      │  fires RazorpayX with idem. keys │
 *  └─────────────────┘      └──────────────────────────────────┘
 *        Both share the same MongoDB database
 */

require("dotenv").config();
const cron = require("node-cron");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Transaction = require("./models/Transaction");
const PayoutBatch = require("./models/PayoutBatch");
const Teacher = require("./models/Teacher");
const razorpayService = require("./services/razorpayService");

const money = (v) => parseFloat(Number(v || 0).toFixed(2));

// ─── DB-Level Lock ────────────────────────────────────────────────────────────
// Before running payouts, we check if another worker instance is already
// processing (prevents double payouts if you accidentally run two workers).
const isAlreadyRunning = async () => {
  const inProgress = await PayoutBatch.findOne({ status: "processing" });
  return !!inProgress;
};

// ─── Idempotency Key Builder ──────────────────────────────────────────────────
// Golden Rule #1: Every payout call to Razorpay must have a unique,
// deterministic key. Same key = same month = Razorpay rejects duplicates.
const buildIdempotencyKey = (teacherId, runDate) => {
  const month = runDate.toISOString().slice(0, 7); // "2026-06"
  return `payout-${teacherId}-${month}`;
};

// ─── Core Payout Logic ────────────────────────────────────────────────────────
const runPayouts = async () => {
  const runDate = new Date();
  console.log(`\n[Worker] ═══ Payout run started at ${runDate.toISOString()} ═══`);

  // ── Guard: prevent concurrent runs ─────────────────────────────────────────
  if (await isAlreadyRunning()) {
    console.warn("[Worker] Another payout run is already in progress. Skipping.");
    return;
  }

  // ── Find all transactions due for payout ────────────────────────────────────
  // State machine: only "paid" transactions with "pending" payoutStatus
  // that are past their hold period (payoutDueAt <= now) are eligible.
  const dueTransactions = await Transaction.find({
    status: "paid",                      // ← Golden Rule #3: status states
    payoutStatus: "pending",
    payoutDueAt: { $lte: runDate },
  });

  if (dueTransactions.length === 0) {
    console.log("[Worker] No payouts due. Exiting cleanly.");
    return;
  }

  console.log(`[Worker] Found ${dueTransactions.length} transactions due for payout.`);

  // ── Group by instructor ─────────────────────────────────────────────────────
  const grouped = dueTransactions.reduce((acc, txn) => {
    const key = String(txn.teacherId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(txn);
    return acc;
  }, {});

  const payoutMethod = process.env.PAYOUT_METHOD || "manual"; // "razorpayx" | "manual"
  let successCount = 0;
  let failCount = 0;

  // ── Process each instructor ─────────────────────────────────────────────────
  for (const [teacherIdStr, txns] of Object.entries(grouped)) {
    const teacherId = txns[0].teacherId;
    const transactionIds = txns.map((t) => t._id);
    const grossAmount = money(txns.reduce((s, t) => s + (t.amount || 0), 0));
    const instructorAmount = money(
      txns.reduce((s, t) => s + (t.instructorAmount ?? t.amount ?? 0), 0)
    );
    const currency = txns[0].currency || "INR";
    const reference = `PO-${Date.now()}-${teacherIdStr.slice(-4)}`;

    // ── Step 1: Create batch in "processing" state (our DB lock per instructor)
    // Golden Rule #3: We use status states, never delete. The audit trail
    // shows exactly what happened to every rupee.
    let batch;
    try {
      batch = await PayoutBatch.create({
        reference,
        teacherId,
        transactionIds,
        grossAmount,
        instructorAmount,
        currency,
        status: "processing",            // ← locked state
        payoutMethod,
        scheduledFor: runDate,
        notes: `Automated worker run — ${runDate.toISOString()}`,
      });
    } catch (err) {
      // Duplicate key = this instructor's batch was already created (idempotent)
      console.warn(`[Worker] Batch already exists for teacher ${teacherIdStr} — skipping.`);
      continue;
    }

    // ── Step 2: Fire RazorpayX payout (if configured) ───────────────────────
    let razorpayPayoutId = "";
    let finalStatus = "released"; // for manual method

    if (payoutMethod === "razorpayx") {
      try {
        const teacher = await Teacher.findById(teacherId).select("payoutProfile").lean();

        // Golden Rule #1: Idempotency Key — safe to retry if network drops
        const idempotencyKey = buildIdempotencyKey(teacherIdStr, runDate);

        const payout = await razorpayService.createPayout({
          fundAccountId: teacher?.payoutProfile?.razorpayFundAccountId,
          amount: instructorAmount,
          currency,
          reference,
          notes: {
            teacherId: teacherIdStr,
            transactionCount: String(transactionIds.length),
            workerRun: runDate.toISOString(),
          },
          idempotencyKey,               // ← Golden Rule #1
        });

        razorpayPayoutId = payout.id || "";
        finalStatus = payout.status === "processed" ? "released" : "processing";

        console.log(
          `[Worker] ✅ RazorpayX payout ${razorpayPayoutId} for teacher ${teacherIdStr} — ₹${instructorAmount}`
        );
      } catch (err) {
        // RazorpayX call failed — mark batch as failed, transactions stay "pending"
        // so the next cron run will retry them automatically
        await PayoutBatch.findByIdAndUpdate(batch._id, {
          status: "failed",
          notes: `${batch.notes} | RazorpayX error: ${err.message}`,
        });
        console.error(`[Worker] ❌ RazorpayX failed for teacher ${teacherIdStr}: ${err.message}`);
        failCount++;
        continue;
      }
    }

    // ── Step 3: Update batch to final state ──────────────────────────────────
    await PayoutBatch.findByIdAndUpdate(batch._id, {
      status: finalStatus,
      razorpayPayoutId,
      releasedAt: finalStatus === "released" ? new Date() : null,
    });

    // ── Step 4: Update all transactions in this batch ────────────────────────
    // Golden Rule #3: Move state from "pending" → "released". Never delete.
    await Transaction.updateMany(
      { _id: { $in: transactionIds }, payoutStatus: "pending" },
      {
        payoutStatus: finalStatus === "released" ? "released" : "on-hold",
        payoutReleasedAt: finalStatus === "released" ? new Date() : null,
        payoutBatchId: batch._id,
      }
    );

    console.log(
      `[Worker] ✅ Batch ${batch.reference} — ${transactionIds.length} txns, ₹${instructorAmount} → ${finalStatus}`
    );
    successCount++;
  }

  console.log(
    `[Worker] ═══ Run complete. Success: ${successCount} | Failed: ${failCount} ═══\n`
  );
};

// ─── Connect to DB then start cron ───────────────────────────────────────────
(async () => {
  await connectDB();
  console.log("[Worker] Connected to DB. Scheduling payout cron jobs...");

  /**
   * Cron Schedule: Runs on the 1st and 15th of every month at 02:00 AM IST.
   *
   * Format: "minute hour day-of-month month day-of-week"
   *   "0 2 1,15 * *"  →  2:00 AM on the 1st and 15th of every month
   *
   * Why 2 AM? Low traffic window. No students buying courses at 2 AM.
   */
  cron.schedule("0 2 1,15 * *", async () => {
    try {
      await runPayouts();
    } catch (err) {
      console.error("[Worker] Unhandled error in payout run:", err);
    }
  });

  console.log("[Worker] 🕐 Cron scheduled: payouts run at 2:00 AM on 1st & 15th of each month.");
  console.log("[Worker] Worker is alive and waiting...");

  // ── Run once immediately on startup (useful for testing / manual trigger) ──
  if (process.env.RUN_PAYOUTS_ON_START === "true") {
    console.log("[Worker] RUN_PAYOUTS_ON_START=true — running payouts now...");
    try {
      await runPayouts();
    } catch (err) {
      console.error("[Worker] Startup run failed:", err);
    }
  }
})();
