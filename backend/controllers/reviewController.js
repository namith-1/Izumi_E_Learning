const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Teacher = require("../models/Teacher");
const emailService = require("../services/emailService");

// ──────────────────────────────────────────────────────────────────────────────
// AUTOMATED PRE-CHECKS — runs before a course can be submitted for review
// ──────────────────────────────────────────────────────────────────────────────
const runPreChecks = (course) => {
    const issues = [];

    if (!course.title || course.title.trim().length < 3) {
        issues.push("Course title must be at least 3 characters.");
    }
    if (!course.description || course.description.trim().length < 10) {
        issues.push("Course description must be at least 10 characters.");
    }
    if (!course.subject || course.subject.trim().length === 0) {
        issues.push("Subject is required.");
    }

    return issues;
};

// ──────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

// POST /api/review/submit/:courseId — Instructor submits course for review
exports.submitForReview = async (req, res) => {
    try {
        let query = { _id: req.params.courseId, teacherId: req.session.user.id };
        if (req.session.user.role === 'admin') {
            query = { _id: req.params.courseId }; 
        }
        const course = await Course.findOne(query);

        if (!course) {
            return res.status(404).json({ message: "Course not found or not yours." });
        }

        // Only allow submission from draft, rejected, or revision-requested states
        if (!["draft", "rejected", "revision-requested"].includes(course.approvalStatus)) {
            return res.status(400).json({
                message: `Cannot submit — course is currently "${course.approvalStatus}".`,
            });
        }

        // Run automated pre-checks
        const issues = runPreChecks(course);
        if (issues.length > 0) {
            return res.status(400).json({
                message: "Course did not pass pre-checks.",
                issues,
            });
        }

        // Optionally add an instructor note
        if (req.body.note) {
            course.reviewNotes.push({
                author: req.session.user.name,
                authorRole: "teacher",
                content: req.body.note,
            });
        }

        course.approvalStatus = "awaited";
        course.submittedAt = new Date();
        await course.save();

        // Notify admins/reviewers could be added here if needed

        res.json({ message: "Course submitted for review.", course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/my-status — Instructor sees approval status of their courses
exports.getMyCoursesStatus = async (req, res) => {
    try {
        let query = { teacherId: req.session.user.id };
        if (req.session.user.role === 'admin' && req.query.instructorId) {
            query = { teacherId: req.query.instructorId };
        } else if (req.session.user.role === 'admin') {
            query = {}; // Admin sees all if no specific instructor selected
        }
        const courses = await Course.find(query)
            .select("title subject approvalStatus submittedAt reviewedAt reviewNotes")
            .sort({ updatedAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/review/instructor-note/:courseId — Instructor adds a comment
exports.addInstructorNote = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Note content is required." });
        }

        let query = { _id: req.params.courseId, teacherId: req.session.user.id };
        if (req.session.user.role === 'admin') {
            query = { _id: req.params.courseId };
        }
        const course = await Course.findOne(query);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        course.reviewNotes.push({
            author: req.session.user.name,
            authorRole: "teacher",
            content: content.trim(),
        });
        await course.save();

        res.json({ message: "Note added.", reviewNotes: course.reviewNotes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────────
// REVIEWER ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

// GET /api/review/queue — Pending courses awaiting review
exports.getReviewQueue = async (req, res) => {
    try {
        const courses = await Course.find({ approvalStatus: { $in: ["pending", "awaited"] } })
            .select("title description subject teacherId submittedAt imageUrl reviewNotes approvalStatus")
            .populate("teacherId", "name email")
            .sort({ submittedAt: 1 }); // oldest first (FIFO)
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/history — Courses reviewed by this reviewer
exports.getReviewHistory = async (req, res) => {
    try {
        const courses = await Course.find({
            reviewerId: req.session.user.id,
            approvalStatus: { $in: ["approved", "rejected", "revision-requested"] },
        })
            .select("title subject approvalStatus reviewedAt teacherId")
            .populate("teacherId", "name")
            .sort({ reviewedAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/course/:id — Full course detail for review
exports.getCourseForReview = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate("teacherId", "name email");
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/review/course/:id/approve
exports.approveCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate("teacherId", "name email");
        if (!course) return res.status(404).json({ message: "Course not found." });

        // Track if this was a re-submission (update) or a brand new course
        const wasUpdate = course.approvalStatus === "awaited" && 
            course.submittedAt && course.createdAt &&
            (new Date(course.submittedAt) - new Date(course.createdAt)) > 60000; // > 1 min gap means it's an update

        if (!["pending", "awaited"].includes(course.approvalStatus)) {
            return res.status(400).json({ message: "Course is not pending review." });
        }

        if (req.body.note) {
            course.reviewNotes.push({
                author: req.session.user.name,
                authorRole: "reviewer",
                content: req.body.note,
            });
        }

        course.approvalStatus = "approved";
        course.reviewerId = req.session.user.id;
        course.reviewedAt = new Date();
        await course.save();

        // Send Email Notification (with isUpdate flag)
        if (course.teacherId && course.teacherId.email) {
            emailService.sendCourseStatusEmail(
                course.teacherId.email,
                course.title,
                "approved",
                req.body.note,
                wasUpdate  // ← tells email service if this is a new approval or change acceptance
            );
        }

        res.json({ message: "Course approved!", course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/review/course/:id/reject
exports.rejectCourse = async (req, res) => {
    try {
        const { note } = req.body;
        if (!note || !note.trim()) {
            return res.status(400).json({ message: "Rejection reason is required." });
        }

        const course = await Course.findById(req.params.id).populate("teacherId", "name email");
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (!["pending", "awaited"].includes(course.approvalStatus)) {
            return res.status(400).json({ message: "Course is not pending review." });
        }

        course.reviewNotes.push({
            author: req.session.user.name,
            authorRole: "reviewer",
            content: note.trim(),
        });

        course.approvalStatus = "rejected";
        course.reviewerId = req.session.user.id;
        course.reviewedAt = new Date();
        await course.save();

        // Send Email Notification
        if (course.teacherId && course.teacherId.email) {
            emailService.sendCourseStatusEmail(
                course.teacherId.email,
                course.title,
                "rejected",
                note.trim()
            );
        }

        res.json({ message: "Course rejected.", course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/review/course/:id/request-revision
exports.requestRevision = async (req, res) => {
    try {
        const { note } = req.body;
        if (!note || !note.trim()) {
            return res.status(400).json({ message: "Revision details are required." });
        }

        const course = await Course.findById(req.params.id).populate("teacherId", "name email");
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (!["pending", "awaited"].includes(course.approvalStatus)) {
            return res.status(400).json({ message: "Course is not pending review." });
        }

        course.reviewNotes.push({
            author: req.session.user.name,
            authorRole: "reviewer",
            content: note.trim(),
        });

        course.approvalStatus = "revision-requested";
        course.reviewerId = req.session.user.id;
        course.reviewedAt = new Date();
        await course.save();

        // Send Email Notification
        if (course.teacherId && course.teacherId.email) {
            emailService.sendCourseStatusEmail(
                course.teacherId.email,
                course.title,
                "revision-requested",
                note.trim()
            );
        }

        res.json({ message: "Revision requested.", course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/stats — Review statistics
exports.getReviewStats = async (req, res) => {
    try {
        const [pending, approved, rejected, revision] = await Promise.all([
            Course.countDocuments({ approvalStatus: { $in: ["pending", "awaited"] } }),
            Course.countDocuments({ approvalStatus: "approved" }),
            Course.countDocuments({ approvalStatus: "rejected" }),
            Course.countDocuments({ approvalStatus: "revision-requested" }),
        ]);
        res.json({ pending, approved, rejected, revisionRequested: revision });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/teachers/pending — Pending instructor applications
exports.getPendingTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find({ applicationStatus: "pending" })
            .select("name email specialization resume linkedIn createdAt")
            .sort({ createdAt: 1 });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/review/teachers/:id/approve
exports.approveTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ message: "Instructor not found." });

        if (teacher.applicationStatus !== "pending") {
            return res.status(400).json({ message: "Instructor application is not pending." });
        }

        teacher.applicationStatus = "approved";
        await teacher.save();

        // Send Email Notification
        emailService.sendInstructorAcceptedEmail(teacher.email, teacher.name);

        res.json({ message: "Instructor approved!", teacher });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/review/teachers/:id/reject
exports.rejectTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ message: "Instructor not found." });

        if (teacher.applicationStatus !== "pending") {
            return res.status(400).json({ message: "Instructor application is not pending." });
        }

        teacher.applicationStatus = "rejected";
        await teacher.save();

        res.json({ message: "Instructor rejected.", teacher });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
