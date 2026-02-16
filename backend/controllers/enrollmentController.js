// backend/controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const mongoose = require("mongoose");

// HELPER: Checks course completion status (Unchanged logic)
const checkCourseCompletion = async (courseId, enrollment) => {
  const course = await Course.findById(courseId).select("_id rootModule modules title");
  if (!course) return enrollment;

  const courseObjectId = course._id.toString();
  const rootModuleId = course.rootModule.id;

  const modulesValues = course.modules instanceof Map
      ? Array.from(course.modules.values())
      : Object.values(course.modules || {});

  const allModulesList = modulesValues
    .concat([course.rootModule])
    .filter((m) => m && m.id);

  const nonRootContentModules = allModulesList.filter(
    (m) => m.id !== rootModuleId && m.id !== courseObjectId,
  );
  const totalContentModules = nonRootContentModules.length;

  const completedModuleIds = enrollment.modules_status
    .filter((status) => status.completed)
    .map((status) => status.moduleId);

  const completedContentModules = nonRootContentModules.filter((m) =>
    completedModuleIds.includes(m.id),
  ).length;

  const quizModules = allModulesList.filter((m) => m.type === "quiz");
  const allQuizzesCompleted = quizModules.every((quiz) =>
    completedModuleIds.includes(quiz.id),
  );

  const COMPLETION_THRESHOLD = 70;
  const completionPercentage = totalContentModules > 0
      ? (completedContentModules / totalContentModules) * 100
      : 0;

  const meetsPercentage = completionPercentage >= COMPLETION_THRESHOLD;

  if (meetsPercentage && allQuizzesCompleted) {
    enrollment.completionStatus = "completed";
  } else {
    enrollment.completionStatus = "in-progress";
  }

  enrollment.moduleSnapshotCount = totalContentModules;
  return enrollment;
};

// 1. ENROLL: Calculate and set endDate based on course duration
exports.enroll = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Calculate endDate: Current Time + Duration (min to ms)
    const durationInMs = (course.duration || 0) * 60 * 1000;
    const endDate = new Date(Date.now() + durationInMs);

    const enrollment = await Enrollment.create({
      courseId,
      studentId: req.session.user.id,
      enrolledAt: new Date(),
      endDate: endDate // Persisting the expiration date
    });

    res.status(201).json(enrollment);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Already enrolled" });
    res.status(500).json({ error: err.message });
  }
};

// 2. GET ENROLLMENT: Deny access if endDate has passed
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      courseId: req.params.courseId,
      studentId: req.session.user.id,
    });

    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });

    // EXPIRATION CHECK
    const now = new Date();
    if (enrollment.endDate && now > new Date(enrollment.endDate)) {
      return res.status(403).json({ 
        message: "Enrollment expired", 
        expired: true,
        endDate: enrollment.endDate 
      });
    }

    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. GET MY ENROLLED COURSES: Flag expired courses for the frontend
// 3. GET MY ENROLLED COURSES: Only send active (non-expired) courses
exports.getMyEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.session.user.id,
    }).populate({
      path: "courseId",
      select: "title description subject teacherId rating rootModule modules duration",
      populate: { path: "teacherId", select: "name" },
    });

    const enrolledCoursesData = [];
    const now = new Date();

    for (const enrollment of enrollments) {
      const course = enrollment.courseId;
      if (!course || !course.teacherId) continue;

      // 1. EXPIRATION LOGIC
      const isExpired = enrollment.endDate ? now > new Date(enrollment.endDate) : false;

      // FIX: If the course is expired, do not add it to the list sent to the frontend
      if (isExpired) {
        continue; 
      }

      // 2. MODULE CALCULATION
      const modulesValuesLocal = course.modules instanceof Map
          ? Array.from(course.modules.values())
          : Object.values(course.modules || {});
          
      const allModulesLocal = modulesValuesLocal.concat([course.rootModule]).filter((m) => m && m.id);
      const nonRootContentModulesLocal = allModulesLocal.filter(
        (m) => m.id !== course.rootModule.id && m.id !== course._id.toString(),
      );
      const totalContentModules = nonRootContentModulesLocal.length;

      let updatedEnrollment = enrollment;

      // 3. COMPLETION LOGIC
      if ((enrollment.moduleSnapshotCount || 0) !== totalContentModules) {
        try {
          updatedEnrollment = await checkCourseCompletion(course._id, enrollment);
          updatedEnrollment.moduleSnapshotCount = totalContentModules;
          await updatedEnrollment.save();
        } catch (e) { /* ignore save errors */ }
      }

      const completedModulesCount = (updatedEnrollment.modules_status || [])
        .filter((s) => s.completed)
        .map((s) => s.moduleId)
        .filter((id) => nonRootContentModulesLocal.some((m) => m.id === id)).length;

      // 4. PUSH ONLY ACTIVE COURSES
      enrolledCoursesData.push({
        _id: course._id,
        courseTitle: course.title,
        description: course.description,
        subject: course.subject,
        rating: course.rating,
        instructorName: course.teacherId.name,
        completionStatus: updatedEnrollment.completionStatus,
        modules_status: updatedEnrollment.modules_status,
        totalContentModules: totalContentModules,
        completedContentModules: completedModulesCount,
        endDate: enrollment.endDate
      });
    }

    res.json(enrolledCoursesData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. UPDATE PROGRESS: Block updates for expired enrollments
exports.updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.session.user.id,
    });

    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    // EXPIRATION CHECK: Prevent progress tracking after endDate
    if (enrollment.endDate && new Date() > new Date(enrollment.endDate)) {
      return res.status(403).json({ message: "Cannot update progress: Enrollment expired." });
    }

    const { moduleId: rawModuleId, timeSpent, completed, quizScore } = req.body;
    const moduleId = String(rawModuleId);

    const moduleIndex = enrollment.modules_status.findIndex((m) => m.moduleId === moduleId);

    if (moduleIndex > -1) {
      if (timeSpent !== undefined) enrollment.modules_status[moduleIndex].timeSpent = timeSpent;
      if (completed !== undefined) enrollment.modules_status[moduleIndex].completed = completed;
      if (quizScore !== undefined && quizScore !== null) {
        enrollment.modules_status[moduleIndex].quizScore = quizScore;
      }
    } else {
      enrollment.modules_status.push({ moduleId, timeSpent, completed, quizScore });
    }

    const updatedEnrollment = await checkCourseCompletion(courseId, enrollment);
    await updatedEnrollment.save();
    res.json(updatedEnrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};