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
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "upi", "bank-transfer", "other"],
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
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

transactionSchema.index({ studentId: 1, courseId: 1 });
transactionSchema.index({ teacherId: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
