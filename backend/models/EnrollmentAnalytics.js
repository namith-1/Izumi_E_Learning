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
      ref: "User", // Update this to "Student" if your user model is named differently
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    // Automatically adds 'createdAt' and 'updatedAt' fields
    timestamps: true 
  }
);

// This ensures a student can only enroll in a specific course once.
// If they try to enroll again, Mongoose throws the 11000 duplicate key error.
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

const EnrollmentAnalytics = mongoose.model("EnrollmentAnalytics", enrollmentSchema);

module.exports = EnrollmentAnalytics;