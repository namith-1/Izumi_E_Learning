// backend/controllers/chatController.js
const Message = require("../models/Message");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const mongoose = require("mongoose");

// ——— GET DM HISTORY ————————————————————————————————————————
// GET /api/chat/:courseId/messages?otherUserId=xxx&before=timestamp&limit=50
exports.getMessages = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { otherUserId, before, limit = 50 } = req.query;
        const userId = req.session.user.id;

        if (!otherUserId) {
            return res.status(400).json({ message: "otherUserId is required" });
        }

        // Verify access
        const role = req.session.user.role;
        if (role === "student") {
            const enrolled = await Enrollment.findOne({ courseId, studentId: userId });
            if (!enrolled) return res.status(403).json({ message: "Not enrolled" });
        } else if (role === "teacher") {
            const course = await Course.findOne({ _id: courseId, teacherId: userId });
            if (!course) return res.status(403).json({ message: "Not your course" });
        }

        // Build query: messages between these two users in this course
        const query = {
            courseId,
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(limit), 100))
            .lean();

        // Return in chronological order
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ——— GET CONVERSATIONS LIST (Instructor Only) ———————————————
// GET /api/chat/:courseId/conversations
// Returns list of students who have chatted, with last message + unread count
exports.getConversations = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.session.user.id;

        // Verify instructor owns this course
        const course = await Course.findOne({ _id: courseId, teacherId: userId });
        if (!course) {
            return res.status(403).json({ message: "Not your course" });
        }

        const courseObjId = new mongoose.Types.ObjectId(courseId);
        const teacherObjId = new mongoose.Types.ObjectId(userId);

        // Aggregate: find all unique students who have messaged or been messaged
        const conversations = await Message.aggregate([
            { $match: { courseId: courseObjId } },
            {
                $addFields: {
                    // The "other" user from the instructor's POV
                    studentId: {
                        $cond: [
                            { $eq: ["$senderId", teacherObjId] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$studentId",
                    lastMessage: { $first: "$content" },
                    lastMessageAt: { $first: "$createdAt" },
                    lastSenderRole: { $first: "$senderRole" },
                    senderName: { $first: "$senderName" },
                    // Count unread messages sent TO the teacher
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiverId", teacherObjId] },
                                        { $eq: ["$read", false] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { lastMessageAt: -1 } },
        ]);

        // Populate student names
        const Student = require("../models/Student");
        const studentIds = conversations.map((c) => c._id);
        const students = await Student.find({ _id: { $in: studentIds } })
            .select("name email")
            .lean();

        const studentMap = {};
        for (const s of students) {
            studentMap[s._id.toString()] = s;
        }

        const result = conversations.map((c) => ({
            studentId: c._id,
            studentName: studentMap[c._id.toString()]?.name || c.senderName || "Unknown",
            studentEmail: studentMap[c._id.toString()]?.email || "",
            lastMessage: c.lastMessage,
            lastMessageAt: c.lastMessageAt,
            lastSenderRole: c.lastSenderRole,
            unreadCount: c.unreadCount,
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ——— GET UNREAD COUNT FOR CURRENT USER ———————————————————————
// GET /api/chat/unread-count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const count = await Message.countDocuments({
            receiverId: userId,
            read: false,
        });
        res.json({ unreadCount: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
