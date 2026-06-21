// backend/models/CourseGroupMessage.js
const mongoose = require("mongoose");

const courseGroupMessageSchema = new mongoose.Schema(
  {
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    senderId:    { type: String, required: true },   // user._id as string
    senderName:  { type: String, required: true },
    senderRole:  { type: String, enum: ["student", "teacher", "reviewer"], default: "student" },
    content:     { type: String, required: true, maxlength: 2000 },
    // Parsed tags stored for quick lookup
    mentions:    [{ type: String }],  // userIds mentioned via @
    tags:        [{ type: String }],  // course slugs/names tagged via #
  },
  { timestamps: true }
);

courseGroupMessageSchema.index({ courseId: 1, createdAt: -1 });

module.exports = mongoose.model("CourseGroupMessage", courseGroupMessageSchema);
