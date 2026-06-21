const mongoose = require("mongoose");

const payoutBatchSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    transactionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required: true,
      },
    ],
    grossAmount: { type: Number, required: true, min: 0 },
    instructorAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    status: {
      type: String,
      enum: ["created", "processing", "released", "failed"],
      default: "created",
      index: true,
    },
    payoutMethod: {
      type: String,
      enum: ["manual", "razorpayx"],
      default: "manual",
    },
    scheduledFor: { type: Date, required: true, index: true },
    releasedAt: { type: Date, default: null },
    razorpayPayoutId: { type: String, default: "", index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

payoutBatchSchema.index({ teacherId: 1, scheduledFor: 1 });

module.exports = mongoose.model("PayoutBatch", payoutBatchSchema);
