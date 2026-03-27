const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Fast lookup for conversation history
messageSchema.index({ courseId: 1, senderId: 1, receiverId: 1, createdAt: -1 });

// Fast unread count
messageSchema.index({ receiverId: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
