// backend/controllers/reviewController.js
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

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

    // Check modules
    const modulesValues =
        course.modules instanceof Map
            ? Array.from(course.modules.values())
            : Object.values(course.modules || {});

    const contentModules = modulesValues.filter(
        (m) => m && m.type !== "folder" && m.id !== course.rootModule?.id,
    );

    if (contentModules.length === 0) {
        issues.push("Course must have at least one content module (text, video, or quiz).");
    }

    // Check quiz modules have questions
    const quizModules = contentModules.filter((m) => m.type === "quiz");
    for (const quiz of quizModules) {
        if (!quiz.questions || quiz.questions.length === 0) {
            issues.push(`Quiz module "${quiz.title}" has no questions.`);
        }
    }

    return issues;
};

// ──────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

// POST /api/review/submit/:courseId — Instructor submits course for review
exports.submitForReview = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacherId: req.session.user.id,
        });

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

        course.approvalStatus = "pending";
        course.submittedAt = new Date();
        await course.save();

        res.json({ message: "Course submitted for review.", course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/my-status — Instructor sees approval status of their courses
exports.getMyCoursesStatus = async (req, res) => {
    try {
        const courses = await Course.find({ teacherId: req.session.user.id })
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

        const course = await Course.findOne({
            _id: req.params.courseId,
            teacherId: req.session.user.id,
        });
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
        const courses = await Course.find({ approvalStatus: "pending" })
            .select("title description subject teacherId submittedAt imageUrl reviewNotes")
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
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (course.approvalStatus !== "pending") {
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

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (course.approvalStatus !== "pending") {
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

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (course.approvalStatus !== "pending") {
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

        res.json({ message: "Revision requested.", course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/review/stats — Review statistics
exports.getReviewStats = async (req, res) => {
    try {
        const [pending, approved, rejected, revision] = await Promise.all([
            Course.countDocuments({ approvalStatus: "pending" }),
            Course.countDocuments({ approvalStatus: "approved" }),
            Course.countDocuments({ approvalStatus: "rejected" }),
            Course.countDocuments({ approvalStatus: "revision-requested" }),
        ]);
        res.json({ pending, approved, rejected, revisionRequested: revision });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
