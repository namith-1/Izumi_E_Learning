// backend/models/Subject.js
// Hierarchical subject/topic taxonomy for Izumi E-Learning
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    slug:  { type: String, required: true, unique: true, lowercase: true },
    emoji: { type: String, default: "📚" },
    // Hierarchy — null means this is a root (level-0) subject
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
      index: true,
    },
    // Materialised path for efficient subtree queries e.g. "computer-science.programming.web-dev"
    path: { type: String, default: "" },
    // 0 = root domain, 1 = major subject, 2 = sub-topic
    level: { type: Number, default: 0 },

    // ── Approval workflow ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
      index: true,
    },
    // null for seed data; ObjectId of Teacher who proposed it
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    proposedByName: { type: String, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reviewer",
      default: null,
    },
    reviewNote: { type: String, default: "" },
    // ─────────────────────────────────────────────────────────────────────
  },
  { timestamps: true }
);

subjectSchema.index({ path: 1 });
subjectSchema.index({ status: 1, parentId: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
