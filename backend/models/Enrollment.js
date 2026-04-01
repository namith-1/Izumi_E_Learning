const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Legacy field — kept for backward compatibility; mirrors passStatus
    completionStatus: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },

    // ── Per-module progress ─────────────────────────────────────────────────
    modules_status: [
      {
        moduleId: { type: String, required: true }, // String (frontend uses Date.now() + random)
        completed: { type: Boolean, default: false },
        timeSpent: { type: Number, default: 0 }, // seconds
        quizScore: { type: Number, default: null }, // raw score 0-100 (null = not attempted)
        // ── New grading fields ──
        passed: { type: Boolean, default: null }, // null = not yet graded, true/false after grading
        weightedContribution: { type: Number, default: 0 }, // (weight/100) × quizScore
        attemptsUsed: { type: Number, default: 0 }, // number of quiz attempts so far
      },
    ],
    // ────────────────────────────────────────────────────────────────────────

    // Snapshot of content-module count — avoids redundant recomputation
    moduleSnapshotCount: { type: Number, default: 0 },

    // ── Course-level computed results ───────────────────────────────────────
    // Weighted average 0-100 (null = not yet computed / no graded modules attempted)
    weightedScore: { type: Number, default: null },

    // Overall pass/fail verdict derived from passingPolicy
    passStatus: {
      type: String,
      enum: ["in-progress", "pass", "fail"],
      default: "in-progress",
    },
    // Student rating for this enrolled course (one rating per student per course)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    ratingReview: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    ratedAt: {
      type: Date,
      default: null,
    },
    // ────────────────────────────────────────────────────────────────────────
  },
  { timestamps: true },
);

// Prevent duplicate enrollments
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Fast student-level lookup
enrollmentSchema.index({ studentId: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
