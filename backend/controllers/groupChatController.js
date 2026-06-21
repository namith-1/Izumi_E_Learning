// backend/controllers/groupChatController.js
const CourseGroupMessage = require("../models/CourseGroupMessage");
const Enrollment         = require("../models/Enrollment");
const Course             = require("../models/Course");

const verifyAccess = async (courseId, userId, role) => {
  if (role === "student") {
    const enrolled = await Enrollment.findOne({ courseId, studentId: userId }).lean();
    return !!enrolled;
  }
  if (role === "teacher") {
    const course = await Course.findOne({ _id: courseId, teacherId: userId }).lean();
    return !!course;
  }
  return false; // reviewers not in course chat
};

// GET /api/group-chat/:courseId/messages?before=<ISO>&limit=50
exports.getMessages = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { before, limit = 50 } = req.query;
    const { id: userId, role } = req.session.user;

    const allowed = await verifyAccess(courseId, userId, role);
    if (!allowed) return res.status(403).json({ message: "Access denied" });

    const query = { courseId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await CourseGroupMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100))
      .lean();

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/group-chat/:courseId/messages
exports.postMessage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content }  = req.body;
    const { id: userId, role, name: sessionName } = req.session.user;

    if (!content?.trim()) return res.status(400).json({ message: "Content required" });

    const allowed = await verifyAccess(courseId, userId, role);
    if (!allowed) return res.status(403).json({ message: "Access denied" });

    // Parse @mentions and #tags from content
    const mentions = [...content.matchAll(/@\[([^\]]+)\]\(([^)]+)\)/g)].map(m => m[2]); // @[Name](userId)
    const tags     = [...content.matchAll(/#(\w[\w-]*)/g)].map(m => m[1]);

    // Resolve sender name from DB if not in session
    let senderName = sessionName;
    if (!senderName) {
      if (role === "student") {
        const Student = require("../models/Student");
        const s = await Student.findById(userId).select("name").lean();
        senderName = s?.name || "Student";
      } else {
        const Teacher = require("../models/Teacher");
        const t = await Teacher.findById(userId).select("name").lean();
        senderName = t?.name || "Instructor";
      }
    }

    const msg = await CourseGroupMessage.create({
      courseId, senderId: userId, senderName, senderRole: role,
      content: content.trim(), mentions, tags,
    });

    // Emit via Socket.IO
    const io = req.app.get("io");
    if (io) io.to(`course-chat-${courseId}`).emit("group-message", msg);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/group-chat/:courseId/members — who can be @mentioned
exports.getMembers = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { id: userId, role } = req.session.user;

    const allowed = await verifyAccess(courseId, userId, role);
    if (!allowed) return res.status(403).json({ message: "Access denied" });

    const Student = require("../models/Student");
    const Teacher = require("../models/Teacher");
    const course  = await Course.findById(courseId).select("teacherId title").lean();

    const enrollments = await Enrollment.find({ courseId }).select("studentId").lean();
    const studentIds  = enrollments.map(e => e.studentId);
    const students    = await Student.find({ _id: { $in: studentIds } }).select("name _id").lean();
    const teacher     = course?.teacherId
      ? await Teacher.findById(course.teacherId).select("name _id").lean()
      : null;

    const members = students.map(s => ({ id: s._id.toString(), name: s.name, role: "student" }));
    if (teacher) members.unshift({ id: teacher._id.toString(), name: teacher.name, role: "teacher" });

    res.json({ members, course: { title: course?.title } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
