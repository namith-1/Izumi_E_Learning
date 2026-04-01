// backend/controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const mongoose = require("mongoose");
const EnrollmentAnalytics = require("../models/EnrollmentAnalytics"); // Adjust the path as needed
// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build a flat list of all non-folder, non-root content module nodes
// ─────────────────────────────────────────────────────────────────────────────
const getContentModules = (course) => {
  const rootModuleId = course.rootModule?.id;
  const courseObjectId = course._id.toString();

  const modulesValues =
    course.modules instanceof Map
      ? Array.from(course.modules.values())
      : Object.values(course.modules || {});

  const all = modulesValues
    .concat([course.rootModule])
    .filter((m) => m && m.id);

  // Content modules = everything that is not the root, not the course doc, not a folder
  return all.filter(
    (m) =>
      m.id !== rootModuleId &&
      m.id !== courseObjectId &&
      m.type !== "folder",
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE GRADING ENGINE — replaces the old checkCourseCompletion()
//
// Modes (set per-course by instructor via passingPolicy.mode):
//   "threshold" — legacy: ≥ passingThreshold% of content modules must be
//                 completed AND all graded quiz modules must pass
//   "weighted"  — weighted average of graded quiz scores must reach
//                 minimumWeightedScore.  Weights are auto-normalised if they
//                 don't sum to 100.
//   "all-pass"  — every graded module with a passingScore must be individually
//                 passed; completion % is not checked.
//
// Per-module optional fields (set by instructor inside module node object):
//   weight         {Number 0-100}   contribution to total weighted score
//   passingScore   {Number 0-100}   minimum % score to pass this module
//   isGraded       {Boolean}        false → module skipped in grading
//   maxAttempts    {Number|null}    max quiz retakes; null = unlimited
// ─────────────────────────────────────────────────────────────────────────────
const computeEnrollmentResult = async (courseId, enrollment) => {
  const course = await Course.findById(courseId).select(
    "_id rootModule modules title passingPolicy",
  );
  if (!course) return enrollment;

  const policy = course.passingPolicy || {};
  const mode = policy.mode || "threshold";
  const passingThreshold = policy.passingThreshold ?? 70;
  const minimumWeightedScore = policy.minimumWeightedScore ?? 60;

  const contentModules = getContentModules(course);
  const totalContentModules = contentModules.length;

  // Build a quick lookup: moduleId string → status sub-doc
  const statusMap = {};
  for (const s of enrollment.modules_status) {
    statusMap[s.moduleId] = s;
  }

  // ── Identify graded modules ───────────────────────────────────────────────
  // A module is graded if isGraded !== false AND is a quiz (or explicitly marked graded)
  const gradedModules = contentModules.filter((m) => {
    if (m.isGraded === false) return false;
    if (m.isGraded === true) return true;
    return m.type === "quiz";
  });

  // ── Weight auto-normalisation ─────────────────────────────────────────────
  const totalAssignedWeight = gradedModules.reduce(
    (sum, m) => sum + (m.weight ?? 0),
    0,
  );
  // Proportionally scale weights so they effectively sum to 100
  const normalise = totalAssignedWeight > 0 && totalAssignedWeight !== 100;

  // ── Per-module grading pass ───────────────────────────────────────────────
  for (const m of gradedModules) {
    const s = statusMap[m.id];
    if (!s) continue; // not attempted yet

    const rawScore = s.quizScore; // 0-100 or null
    const passingScore = m.passingScore ?? null;

    // Determine per-module pass/fail
    let modulePassed = null;
    if (rawScore !== null) {
      modulePassed = passingScore !== null ? rawScore >= passingScore : true;
    }

    // Effective weight after optional normalisation
    const rawWeight = m.weight ?? 0;
    const effectiveWeight = normalise
      ? (rawWeight / totalAssignedWeight) * 100
      : rawWeight;

    const contribution =
      rawScore !== null ? (effectiveWeight / 100) * rawScore : 0;

    // Write back to the Mongoose sub-document
    s.passed = modulePassed;
    s.weightedContribution = parseFloat(contribution.toFixed(2));
  }

  // ── Course-level verdict ──────────────────────────────────────────────────
  let passStatus = "in-progress";
  let weightedScore = null;

  const completedIds = enrollment.modules_status
    .filter((s) => s.completed)
    .map((s) => s.moduleId);

  if (mode === "threshold") {
    // ── THRESHOLD MODE (legacy default) ──────────────────────────────────
    const completedCount = contentModules.filter((m) =>
      completedIds.includes(m.id),
    ).length;
    const completionPct =
      totalContentModules > 0
        ? (completedCount / totalContentModules) * 100
        : 0;

    const allGradedAttempted = gradedModules.every(
      (m) => statusMap[m.id]?.quizScore !== null && statusMap[m.id]?.quizScore !== undefined,
    );
    const anyGradedFailed = gradedModules.some(
      (m) => statusMap[m.id]?.passed === false,
    );
    const allGradedPassed = allGradedAttempted && !anyGradedFailed;

    if (completionPct >= passingThreshold && allGradedPassed) {
      passStatus = "pass";
    } else if (allGradedAttempted && anyGradedFailed) {
      passStatus = "fail";
    }

  } else if (mode === "weighted") {
    // ── WEIGHTED MODE ─────────────────────────────────────────────────────
    const allAttempted = gradedModules.every(
      (m) => statusMap[m.id]?.quizScore !== null && statusMap[m.id]?.quizScore !== undefined,
    );

    if (gradedModules.length > 0) {
      const earned = gradedModules.reduce(
        (sum, m) => sum + (statusMap[m.id]?.weightedContribution ?? 0),
        0,
      );
      weightedScore = parseFloat(earned.toFixed(2));

      if (allAttempted) {
        passStatus = weightedScore >= minimumWeightedScore ? "pass" : "fail";
      }
    }

  } else if (mode === "all-pass") {
    // ── ALL-PASS MODE ─────────────────────────────────────────────────────
    const allAttempted = gradedModules.every(
      (m) => statusMap[m.id]?.quizScore !== null && statusMap[m.id]?.quizScore !== undefined,
    );
    const allPassed = gradedModules.every(
      (m) => statusMap[m.id]?.passed === true,
    );
    const anyFailed = gradedModules.some(
      (m) => statusMap[m.id]?.passed === false,
    );

    if (allAttempted && allPassed) {
      passStatus = "pass";
    } else if (anyFailed) {
      passStatus = "fail";
    }
  }

  // ── Persist results ───────────────────────────────────────────────────────
  enrollment.passStatus = passStatus;
  enrollment.weightedScore = weightedScore;
  // Keep completionStatus in sync for backward-compat
  enrollment.completionStatus = passStatus === "pass" ? "completed" : "in-progress";
  enrollment.moduleSnapshotCount = totalContentModules;

  return enrollment;
};

// ─────────────────────────────────────────────────────────────────────────────
// Enroll in a course
// ─────────────────────────────────────────────────────────────────────────────
// exports.enroll = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const enrollment = await Enrollment.create({
//       courseId,
//       studentId: req.session.user.id,
//     });
//     res.status(201).json(enrollment);
//   } catch (err) {
//     if (err.code === 11000)
//       return res.status(400).json({ message: "Already enrolled" });
//     res.status(500).json({ error: err.message });
//   }
// };

// Make sure to import all three models at the top of your file


/**
 * @swagger
 * /api/enrollment/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollment]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: "60c728362d294d1f88c88888"
 *     responses:
 *       201:
 *         description: Enrollment successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Already enrolled or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Already enrolled in this course"
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

exports.enroll = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.session.user.id;

    // 1. Fetch the course to get its current price
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2. Create the primary Enrollment record
    const enrollment = await Enrollment.create({
      courseId,
      studentId,
    });

    // 3. Create the Analytics record, storing the exact price paid at this moment
    await EnrollmentAnalytics.create({
      courseId,
      studentId,
      price: course.price || 0, // Fallback to 0 if the course price is undefined
    });

    // 4. Send the successful response
    res.status(201).json(enrollment);

  } catch (err) {
    // 11000 is the MongoDB duplicate key error code
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }
    
    console.error("Enrollment Error:", err);
    res.status(500).json({ error: "An error occurred during enrollment." });
  }
};

/**
 * @swagger
 * /api/enrollment/{courseId}:
 *   get:
 *     summary: Get enrollment status for a course
 *     tags: [Enrollment]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         example: "60c728362d294d1f88c88888"
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Not enrolled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not enrolled"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// ─────────────────────────────────────────────────────────────────────────────
// Get enrollment / progress for CourseViewer
// ─────────────────────────────────────────────────────────────────────────────
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      courseId: req.params.courseId,
      studentId: req.session.user.id,
    });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/enrollment/my-courses:
 *   get:
 *     summary: Get my enrolled courses
 *     tags: [Enrollment]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60c728362d294d1f88c88888"
 *                   courseTitle:
 *                     type: string
 *                     example: "Introduction to Programming"
 *                   description:
 *                     type: string
 *                     example: "Learn the basics of programming"
 *                   subject:
 *                     type: string
 *                     example: "Computer Science"
 *                   imageUrl:
 *                     type: string
 *                     example: "/uploads/courses/image.jpg"
 *                   rating:
 *                     type: number
 *                     example: 4.5
 *                   instructorName:
 *                     type: string
 *                     example: "Dr. Smith"
 *                   teacherId:
 *                     type: string
 *                     example: "60c728362d294d1f88c88889"
 *                   completionStatus:
 *                     type: string
 *                     example: "completed"
 *                   passStatus:
 *                     type: string
 *                     example: "passed"
 *                   weightedScore:
 *                     type: number
 *                     example: 85.5
 *                   passingPolicy:
 *                     type: object
 *                     example: {"mode": "threshold", "passingThreshold": 70}
 *                   modules_status:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         moduleId:
 *                           type: string
 *                           example: "module1"
 *                         completed:
 *                           type: boolean
 *                           example: true
 *                         quizScore:
 *                           type: number
 *                           example: 90
 *                   totalContentModules:
 *                     type: number
 *                     example: 10
 *                   completedContentModules:
 *                     type: number
 *                     example: 8
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// ─────────────────────────────────────────────────────────────────────────────
// Get all enrolled courses with details (My Learning page)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.session.user.id,
    }).populate({
      path: "courseId",
      select:
        "title description subject teacherId rating imageUrl rootModule modules passingPolicy",
      populate: { path: "teacherId", select: "name" },
    });

    const enrolledCoursesData = [];
    for (const enrollment of enrollments) {
      const course = enrollment.courseId;
      if (!course || !course.teacherId) continue;

      const contentModules = getContentModules(course);
      const totalContentModules = contentModules.length;

      let updatedEnrollment = enrollment;

      // Recompute only if module count has changed since last snapshot
      if ((enrollment.moduleSnapshotCount || 0) !== totalContentModules) {
        try {
          updatedEnrollment = await computeEnrollmentResult(
            course._id,
            enrollment,
          );
          await updatedEnrollment.save();
        } catch (e) {
          // silent — use in-memory values
        }
      }

      const completedModulesCount = (updatedEnrollment.modules_status || [])
        .filter((s) => s.completed)
        .map((s) => s.moduleId)
        .filter((id) => contentModules.some((m) => m.id === id)).length;

      enrolledCoursesData.push({
        _id: course._id,
        courseTitle: course.title,
        description: course.description,
        subject: course.subject,
        imageUrl: course.imageUrl || null,
        rating: course.rating,
        instructorName: course.teacherId.name,
        teacherId: course.teacherId._id,
        // Legacy field
        completionStatus: updatedEnrollment.completionStatus,
        // New grading fields
        passStatus: updatedEnrollment.passStatus,
        weightedScore: updatedEnrollment.weightedScore,
        passingPolicy: course.passingPolicy,
        modules_status: updatedEnrollment.modules_status,
        totalContentModules,
        completedContentModules: completedModulesCount,
      });
    }

    res.json(enrolledCoursesData);
  } catch (err) {
    console.error("Error fetching enrolled courses:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/enrollment/{courseId}/progress:
 *   put:
 *     summary: Update progress in enrolled course
 *     tags: [Enrollment]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         example: "60c728362d294d1f88c88888"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moduleId
 *             properties:
 *               moduleId:
 *                 type: string
 *                 example: "module1"
 *               timeSpent:
 *                 type: number
 *                 example: 300
 *               completed:
 *                 type: boolean
 *                 example: true
 *               quizScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Module ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module ID is required to update progress."
 *       403:
 *         description: Maximum attempts reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Maximum attempts (3) reached for this module."
 *                 attemptsUsed:
 *                   type: number
 *                   example: 3
 *                 maxAttempts:
 *                   type: number
 *                   example: 3
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Enrollment not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// ─────────────────────────────────────────────────────────────────────────────
// Update Progress — called when video ends, text is marked read, or quiz submitted
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleId: rawModuleId, timeSpent, completed, quizScore } = req.body;

    if (!rawModuleId) {
      return res.status(400).json({ message: "Module ID is required to update progress." });
    }
    const moduleId = String(rawModuleId);

    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.session.user.id,
    });
    if (!enrollment)
      return res.status(404).json({ message: "Enrollment not found" });

    // ── Fetch module config for maxAttempts check ─────────────────────────
    const course = await Course.findById(courseId).select(
      "modules rootModule passingPolicy",
    );
    const modulesValues =
      course?.modules instanceof Map
        ? Array.from(course.modules.values())
        : Object.values(course?.modules || {});
    const allNodes = modulesValues
      .concat([course?.rootModule])
      .filter(Boolean);
    const moduleConfig = allNodes.find((m) => String(m.id) === moduleId) || {};
    const maxAttempts = moduleConfig.maxAttempts ?? null; // null = unlimited

    // ── Find or create the status entry for this module ───────────────────
    const moduleIndex = enrollment.modules_status.findIndex(
      (m) => m.moduleId === moduleId,
    );

    if (moduleIndex > -1) {
      const existing = enrollment.modules_status[moduleIndex];

      // Enforce maxAttempts before accepting a new quiz score
      if (
        quizScore !== undefined &&
        quizScore !== null &&
        maxAttempts !== null &&
        (existing.attemptsUsed || 0) >= maxAttempts
      ) {
        return res.status(403).json({
          message: `Maximum attempts (${maxAttempts}) reached for this module.`,
          attemptsUsed: existing.attemptsUsed,
          maxAttempts,
        });
      }

      if (timeSpent !== undefined)
        enrollment.modules_status[moduleIndex].timeSpent = timeSpent;
      if (completed !== undefined)
        enrollment.modules_status[moduleIndex].completed = completed;
      if (quizScore !== undefined && quizScore !== null) {
        // Keep the best score across attempts
        const prevScore = existing.quizScore ?? -Infinity;
        enrollment.modules_status[moduleIndex].quizScore = Math.max(
          prevScore,
          quizScore,
        );
        enrollment.modules_status[moduleIndex].attemptsUsed =
          (existing.attemptsUsed || 0) + 1;
      }
    } else {
      enrollment.modules_status.push({
        moduleId,
        timeSpent: timeSpent ?? 0,
        completed: completed ?? false,
        quizScore: quizScore ?? null,
        attemptsUsed:
          quizScore !== undefined && quizScore !== null ? 1 : 0,
      });
    }

    // ── Run the grading engine and save ───────────────────────────────────
    const updatedEnrollment = await computeEnrollmentResult(
      courseId,
      enrollment,
    );
    await updatedEnrollment.save();

    res.json(updatedEnrollment);
  } catch (err) {
    console.error("Error in updateProgress:", err);
    res.status(500).json({ error: err.message });
  }
};
