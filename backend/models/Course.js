const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    subject: { type: String, required: true, index: true },
    imageUrl: { type: String },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    rating: { type: Number, default: 0 },
    whatULearning: [String],

    // Recursive structure (each module node may carry: weight, passingScore, isGraded, maxAttempts, isMandatory, timeLimitSeconds, failureFeedback)
    rootModule: { type: Object, required: true },

    // Flat map for O(1) lookups
    modules: { type: Map, of: Object, required: true },

    // ── Grading / Passing Policy (set by instructor) ────────────────────────
    passingPolicy: {
      // "threshold" → student must complete ≥ passingThreshold % of content modules (legacy default)
      // "weighted"  → weighted average of graded quiz scores must reach minimumWeightedScore
      // "all-pass"  → every graded module with a passingScore must be individually passed
      mode: {
        type: String,
        enum: ["threshold", "weighted", "all-pass"],
        default: "threshold",
      },
      // Used when mode === "threshold"
      passingThreshold: { type: Number, default: 70, min: 0, max: 100 },
      // Used when mode === "weighted"
      minimumWeightedScore: { type: Number, default: 60, min: 0, max: 100 },
    },
    // ────────────────────────────────────────────────────────────────────────
  },
  { timestamps: true },
);

module.exports = mongoose.model("Course", courseSchema);
