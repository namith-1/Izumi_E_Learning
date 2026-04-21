// backend/controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const mongoose = require("mongoose");
const EnrollmentAnalytics = require("../models/EnrollmentAnalytics");
const cacheService = require("../services/cacheService");

const recalculateCourseAverageRating = async (courseId) => {
  const stats = await Enrollment.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        rating: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$courseId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const nextRating =
    stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0;
  await Course.findByIdAndUpdate(courseId, { rating: nextRating });
  return nextRating;
};
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
      m.id !== rootModuleId && m.id !== courseObjectId && m.type !== "folder",
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE GRADING ENGINE
// MODIFIED: Accepts optional pre-fetched course object to avoid redundant DB calls
// ─────────────────────────────────────────────────────────────────────────────
const computeEnrollmentResult = async (courseId, enrollment, preFetchedCourse = null) => {
  // OPTIMIZATION: Use pre-fetched course if available to avoid DB round-trip
  const course = preFetchedCourse || await Course.findById(courseId).select(
    "_id rootModule modules title passingPolicy",
  ).lean();
  
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
  const normalise = totalAssignedWeight > 0 && totalAssignedWeight !== 100;

  // ── Per-module grading pass ───────────────────────────────────────────────
  for (const m of gradedModules) {
    const s = statusMap[m.id];
    if (!s) continue; // not attempted yet

    const rawScore = s.quizScore; // 0-100 or null
    const passingScore = m.passingScore ?? null;

    let modulePassed = null;
    if (rawScore !== null) {
      modulePassed = passingScore !== null ? rawScore >= passingScore : true;
    }

    const rawWeight = m.weight ?? 0;
    const effectiveWeight = normalise
      ? (rawWeight / totalAssignedWeight) * 100
      : rawWeight;

    const contribution =
      rawScore !== null ? (effectiveWeight / 100) * rawScore : 0;

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
    const completedCount = contentModules.filter((m) =>
      completedIds.includes(m.id),
    ).length;
    const completionPct =
      totalContentModules > 0
        ? (completedCount / totalContentModules) * 100
        : 0;

    const allGradedAttempted = gradedModules.every(
      (m) =>
        statusMap[m.id]?.quizScore !== null &&
        statusMap[m.id]?.quizScore !== undefined,
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
    const allAttempted = gradedModules.every(
      (m) =>
        statusMap[m.id]?.quizScore !== null &&
        statusMap[m.id]?.quizScore !== undefined,
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
    const allAttempted = gradedModules.every(
      (m) =>
        statusMap[m.id]?.quizScore !== null &&
        statusMap[m.id]?.quizScore !== undefined,
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

  enrollment.passStatus = passStatus;
  enrollment.weightedScore = weightedScore;
  enrollment.completionStatus =
    passStatus === "pass" ? "completed" : "in-progress";
  enrollment.moduleSnapshotCount = totalContentModules;

  return enrollment;
};

// Enroll in a course
exports.enroll = async (req, res) => {
  console.time("DB_Enroll_Course");
  try {
    const { courseId } = req.body;
    const studentId = req.session.user.id;

    const course = await Course.findById(courseId).lean();
    if (!course) {
        console.timeEnd("DB_Enroll_Course");
        return res.status(404).json({ message: "Course not found" });
    }

    const enrollment = await Enrollment.create({
      courseId,
      studentId,
    });

    await cacheService.del(`student:enrollments:${studentId}`);

    await EnrollmentAnalytics.create({
      courseId,
      studentId,
      price: course.price || 0,
    });

    console.timeEnd("DB_Enroll_Course");
    res.status(201).json(enrollment);
  } catch (err) {
    console.timeEnd("DB_Enroll_Course");
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }
    console.error("Enrollment Error:", err);
    res.status(500).json({ error: "An error occurred during enrollment." });
  }
};

// Get enrollment status
exports.getEnrollment = async (req, res) => {
  console.time("DB_Get_Enrollment");
  try {
    const enrollment = await Enrollment.findOne({
      courseId: req.params.courseId,
      studentId: req.session.user.id,
    }).lean();
    console.timeEnd("DB_Get_Enrollment");
    
    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });
    res.json(enrollment);
  } catch (err) {
    console.timeEnd("DB_Get_Enrollment");
    res.status(500).json({ error: err.message });
  }
};

// Get all enrolled courses (My Learning)
exports.getMyEnrolledCourses = async (req, res) => {
  const studentId = req.session.user.id;
  const cacheKey = `student:enrollments:${studentId}`;
  
  console.time("DB_Get_My_Courses");
  try {
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.timeEnd("DB_Get_My_Courses");
      return res.json(cachedData);
    }

    const enrollments = await Enrollment.find({
      studentId: studentId,
    })
      .populate({
        path: "courseId",
        select: "title description subject teacherId rating imageUrl rootModule modules passingPolicy",
        populate: { path: "teacherId", select: "name" },
      })
      .lean();
    console.timeEnd("DB_Get_My_Courses");

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
          // PASSING THE PRE-FETCHED COURSE OBJECT (Major Optimization)
          updatedEnrollment = await computeEnrollmentResult(
            course._id,
            enrollment,
            course
          );
          // Only save if it's an actual Mongoose doc (if we need persistence)
          // Since it's lean, we might need to findOne and update or skip saving if not critical
          // For simple display, in-memory is fine. If we MUST save:
          await Enrollment.findByIdAndUpdate(enrollment._id, {
            passStatus: updatedEnrollment.passStatus,
            weightedScore: updatedEnrollment.weightedScore,
            completionStatus: updatedEnrollment.completionStatus,
            moduleSnapshotCount: updatedEnrollment.moduleSnapshotCount
          });
        } catch (e) {
          console.error("Error recomputing result:", e);
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
        completionStatus: updatedEnrollment.completionStatus,
        passStatus: updatedEnrollment.passStatus,
        weightedScore: updatedEnrollment.weightedScore,
        passingPolicy: course.passingPolicy,
        modules_status: updatedEnrollment.modules_status,
        totalContentModules,
        completedContentModules: completedModulesCount,
      });
    }

    await cacheService.set(cacheKey, enrolledCoursesData, 600); // 10 minute cache
    res.json(enrolledCoursesData);
  } catch (err) {
    console.timeEnd("DB_Get_My_Courses");
    console.error("Error fetching enrolled courses:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Progress
exports.updateProgress = async (req, res) => {
  console.time("DB_Update_Progress");
  try {
    const { courseId } = req.params;
    const { moduleId: rawModuleId, timeSpent, completed, quizScore } = req.body;

    if (!rawModuleId) {
      console.timeEnd("DB_Update_Progress");
      return res.status(400).json({ message: "Module ID is required to update progress." });
    }
    const moduleId = String(rawModuleId);

    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.session.user.id,
    });
    if (!enrollment) {
        console.timeEnd("DB_Update_Progress");
        return res.status(404).json({ message: "Enrollment not found" });
    }

    const course = await Course.findById(courseId).select("modules rootModule passingPolicy").lean();
    const modulesValues = course?.modules instanceof Map ? Array.from(course.modules.values()) : Object.values(course?.modules || {});
    const allNodes = modulesValues.concat([course?.rootModule]).filter(Boolean);
    const moduleConfig = allNodes.find((m) => String(m.id) === moduleId) || {};
    const maxAttempts = moduleConfig.maxAttempts ?? null;

    const moduleIndex = enrollment.modules_status.findIndex((m) => m.moduleId === moduleId);

    if (moduleIndex > -1) {
      const existing = enrollment.modules_status[moduleIndex];
      if (quizScore !== undefined && quizScore !== null && maxAttempts !== null && (existing.attemptsUsed || 0) >= maxAttempts) {
        console.timeEnd("DB_Update_Progress");
        return res.status(403).json({
          message: `Maximum attempts (${maxAttempts}) reached for this module.`,
          attemptsUsed: existing.attemptsUsed,
          maxAttempts,
        });
      }

      if (timeSpent !== undefined) enrollment.modules_status[moduleIndex].timeSpent = timeSpent;
      if (completed !== undefined) enrollment.modules_status[moduleIndex].completed = completed;
      if (quizScore !== undefined && quizScore !== null) {
        const prevScore = existing.quizScore ?? -Infinity;
        enrollment.modules_status[moduleIndex].quizScore = Math.max(prevScore, quizScore);
        enrollment.modules_status[moduleIndex].attemptsUsed = (existing.attemptsUsed || 0) + 1;
      }
    } else {
      enrollment.modules_status.push({
        moduleId,
        timeSpent: timeSpent ?? 0,
        completed: completed ?? false,
        quizScore: quizScore ?? null,
        attemptsUsed: quizScore !== undefined && quizScore !== null ? 1 : 0,
      });
    }

    const updatedEnrollment = await computeEnrollmentResult(courseId, enrollment, course);
    await updatedEnrollment.save();
    await cacheService.del(`student:enrollments:${req.session.user.id}`);
    console.timeEnd("DB_Update_Progress");

    res.json(updatedEnrollment);
  } catch (err) {
    console.timeEnd("DB_Update_Progress");
    console.error("Error in updateProgress:", err);
    res.status(500).json({ error: err.message });
  }
};

// Submit Rating
exports.submitCourseRating = async (req, res) => {
  console.time("DB_Submit_Rating");
  try {
    const { courseId } = req.params;
    const numericRating = Number(req.body.rating);
    const review = typeof req.body.review === "string" ? req.body.review.trim() : "";

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      console.timeEnd("DB_Submit_Rating");
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.session.user.id,
    });

    if (!enrollment) {
      console.timeEnd("DB_Submit_Rating");
      return res.status(403).json({ message: "You must be enrolled to rate this course." });
    }

    enrollment.rating = numericRating;
    enrollment.ratingReview = review;
    enrollment.ratedAt = new Date();
    await enrollment.save();

    await recalculateCourseAverageRating(courseId);
    console.timeEnd("DB_Submit_Rating");

    res.json({ message: "Rating submitted successfully.", rating: numericRating });
  } catch (err) {
    console.timeEnd("DB_Submit_Rating");
    res.status(500).json({ error: err.message });
  }
};
