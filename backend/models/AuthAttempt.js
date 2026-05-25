const mongoose = require("mongoose");

const AuthAttemptSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    count: { type: Number, default: 0 },
    firstAt: { type: Date, default: Date.now },
    blockedUntil: { type: Date, default: null },
    ip: { type: String },
    lastAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuthAttempt", AuthAttemptSchema);
