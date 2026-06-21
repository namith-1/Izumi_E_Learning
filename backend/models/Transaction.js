const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    // Revenue split (recorded at time of purchase)
    instructorAmount: { type: Number, default: 0, min: 0 },
    platformAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    gateway: {
      type: String,
      enum: ["manual", "razorpay"],
      default: "manual",
      index: true,
    },
    gatewayOrderId: { type: String, default: "", index: true },
    gatewayPaymentId: { type: String, default: "", index: true },
    gatewaySignature: { type: String, default: "" },
    gatewayReceipt: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "upi", "netbanking", "bank-transfer", "other"],
      default: "card",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cancelled"],
      default: "paid",
      index: true,
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "released", "on-hold"],
      default: "pending",
      index: true,
    },
    payoutDueAt: { type: Date, default: null, index: true },
    payoutReleasedAt: { type: Date, default: null },
    payoutBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutBatch",
      default: null,
      index: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

transactionSchema.index({ createdAt: 1 });
transactionSchema.index({ teacherId: 1, payoutStatus: 1, payoutDueAt: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
