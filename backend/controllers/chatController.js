// backend/controllers/chatController.js
const Message = require("../models/Message");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const mongoose = require("mongoose");

// ——— GET DM HISTORY ————————————————————————————————————————
exports.getMessages = async (req, res) => {
    console.time("DB_Chat_History");
    try {
        const { courseId } = req.params;
        const { otherUserId, before, limit = 50 } = req.query;
        const userId = req.session.user.id;

        if (!otherUserId) {
            console.timeEnd("DB_Chat_History");
            return res.status(400).json({ message: "otherUserId is required" });
        }

        // Verify access
        const role = req.session.user.role;
        if (role === "student") {
            const enrolled = await Enrollment.findOne({ courseId, studentId: userId }).lean();
            if (!enrolled) {
                console.timeEnd("DB_Chat_History");
                return res.status(403).json({ message: "Not enrolled" });
            }
        } else if (role === "teacher") {
            const course = await Course.findOne({ _id: courseId, teacherId: userId }).lean();
            if (!course) {
                console.timeEnd("DB_Chat_History");
                return res.status(403).json({ message: "Not your course" });
            }
        }

        // Build query
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
        console.timeEnd("DB_Chat_History");

        // Return in chronological order
        res.json(messages.reverse());
    } catch (err) {
        console.timeEnd("DB_Chat_History");
        res.status(500).json({ error: err.message });
    }
};

// ——— GET CONVERSATIONS LIST (Instructor Only) ———————————————
exports.getConversations = async (req, res) => {
    console.time("DB_Conversations_Link");
    try {
        const { courseId } = req.params;
        const userId = req.session.user.id;

        const course = await Course.findOne({ _id: courseId, teacherId: userId }).lean();
        if (!course) {
            console.timeEnd("DB_Conversations_Link");
            return res.status(403).json({ message: "Not your course" });
        }

        const courseObjId = new mongoose.Types.ObjectId(courseId);
        const teacherObjId = new mongoose.Types.ObjectId(userId);

        const conversations = await Message.aggregate([
            { $match: { courseId: courseObjId } },
            {
                $addFields: {
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

        const studentIds = conversations.map((c) => c._id);
        const Student = require("../models/Student");
        const students = await Student.find({ _id: { $in: studentIds } })
            .select("name email")
            .lean();

        console.timeEnd("DB_Conversations_Link");

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
        console.timeEnd("DB_Conversations_Link");
        res.status(500).json({ error: err.message });
    }
};

// ——— GET UNREAD COUNT ————————————————————————————————————————
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
