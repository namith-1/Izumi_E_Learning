// backend/controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course"); // Needed for course structure access
const mongoose = require("mongoose"); // Needed for ObjectId conversion, even if indirectly via aggregation/save

// NEW HELPER FUNCTION TO CHECK COURSE COMPLETION STATUS (Unchanged from last successful version)
const checkCourseCompletion = async (courseId, enrollment) => {
  // 1. Fetch the full course structure to determine total modules and quiz modules
  const course = await Course.findById(courseId).select(
    "_id rootModule modules title"
  );
  if (!course) return enrollment;

  const courseObjectId = course._id.toString();

  // Retrieve the root module's unique ID/key
  const rootModuleId = course.rootModule.id;

  // Combine root and sub-modules, filtering out any corrupt entries (null/undefined/missing ID)
  const allModulesMap = {
    ...course.modules,
    [rootModuleId]: course.rootModule,
  };
  const allModulesList = Object.values(allModulesMap).filter((m) => m && m.id);

  // 2. Identify and count Non-Root Content Modules (Text, Video, Quiz)
  const nonRootContentModules = allModulesList.filter(
    (m) => m.id !== rootModuleId && m.id !== courseObjectId
  );
  const totalContentModules = nonRootContentModules.length;

  // 3. Get list of modules marked completed in the enrollment record
  const completedModuleIds = enrollment.modules_status
    .filter((status) => status.completed)
    .map((status) => status.moduleId);

  // Count how many of the actual content modules have been completed
  const completedContentModules = nonRootContentModules.filter((m) =>
    completedModuleIds.includes(m.id)
  ).length;

  // 4. Check mandatory completion conditions

  // Condition A: All quiz modules must be completed.
  const quizModules = allModulesList.filter((m) => m.type === "quiz");
  const allQuizzesCompleted = quizModules.every((quiz) =>
    completedModuleIds.includes(quiz.id)
  );

  // Condition B: Percentage of non-root modules completed >= 70%.
  const COMPLETION_THRESHOLD = 70;

  const completionPercentage =
    totalContentModules > 0
      ? (completedContentModules / totalContentModules) * 100
      : 0;

  const meetsPercentage = completionPercentage >= COMPLETION_THRESHOLD;

  // 5. Update status based on conditions
  if (meetsPercentage && allQuizzesCompleted) {
    enrollment.completionStatus = "completed";
  } else {
    enrollment.completionStatus = "in-progress";
  }

  // Diagnostic Logging (Optional, kept for debugging clarity)
  console.log("----------------------------------------------------");
  console.log(`[Completion Check] Course: ${course.title || courseId}`);
  console.log(`Total Content Modules (Non-Root): ${totalContentModules}`);
  console.log(`Completed Content Modules: ${completedContentModules}`);
  console.log(`Final Status: ${enrollment.completionStatus}`);
  console.log("----------------------------------------------------");

  return enrollment;
};

// Enroll in a course
exports.enroll = async (req, res) => {
  try {
    const { courseId } = req.body;
    const enrollment = await Enrollment.create({
      courseId,
      studentId: req.session.user.id,
    });
    console.log("New enrollment created:", enrollment);
    res.status(201).json(enrollment);
  } catch (err) {
    // Use consistent error handling for unique constraint violation (Error code 11000)
    if (err.code === 11000)
      return res.status(400).json({ message: "Already enrolled" });
    res.status(500).json({ error: err.message });
  }
};

// Get enrollment status (Load progress for CourseViewer)
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      courseId: req.params.courseId,
      studentId: req.session.user.id,
    });

    // Ensure 404 message matches frontend rejection handler in store.js
    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });

    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: Get all enrolled courses with details for the My Learning page
exports.getMyEnrolledCourses = async (req, res) => {
  try {
    // Find all enrollments for the current student
    const enrollments = await Enrollment.find({
      studentId: req.session.user.id,
    })
      // Deeply populate the Course details (need modules for correct completion count)
      .populate({
        path: "courseId",
        select: "title description subject teacherId rating rootModule modules", // Include modules and rootModule
        populate: {
          path: "teacherId",
          select: "name",
        },
      });

    // Map and flatten the results for a clean frontend response
    const enrolledCoursesData = enrollments
      .map((enrollment) => {
        const course = enrollment.courseId;

        if (!course || !course.teacherId) return null;

        // --- NEW PROGRESS CALCULATION ---
        const rootModuleId = course.rootModule.id;
        const allModulesMap = {
          ...course.modules,
          [rootModuleId]: course.rootModule,
        };
        const allModulesList = Object.values(allModulesMap).filter(
          (m) => m && m.id
        );

        // Count modules to be completed (excluding root module and corrupt entries)
        const nonRootContentModules = allModulesList.filter(
          (m) => m.id !== rootModuleId && m.id !== course._id.toString()
        );
        const totalContentModules = nonRootContentModules.length;

        const completedModulesCount = enrollment.modules_status
          .filter((s) => s.completed)
          .map((s) => s.moduleId)
          .filter((id) =>
            nonRootContentModules.some((m) => m.id === id)
          ).length; // Ensure completed ID is a real content module
        // ---------------------------------

        return {
          _id: course._id,
          courseTitle: course.title,
          description: course.description,
          subject: course.subject,
          rating: course.rating,
          instructorName: course.teacherId.name,
          completionStatus: enrollment.completionStatus,
          modules_status: enrollment.modules_status,
          // Pass accurate counts to the frontend:
          totalContentModules: totalContentModules,
          completedContentModules: completedModulesCount,
        };
      })
      .filter((item) => item !== null);

    res.json(enrolledCoursesData);
  } catch (err) {
    console.error("Error fetching enrolled courses:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Progress (Called when video completes or time updates/quiz submission)
exports.updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleId: rawModuleId, timeSpent, completed, quizScore } = req.body;

    // Validation and FIX: Ensure moduleId is a string for consistent comparisons
    if (!rawModuleId) {
      return res
        .status(400)
        .json({ message: "Module ID is required to update progress." });
    }
    const moduleId = String(rawModuleId); // Explicitly cast to String

    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.session.user.id,
    });

    if (!enrollment)
      return res.status(404).json({ message: "Enrollment not found" });

    // Check if module exists in progress array
    const moduleIndex = enrollment.modules_status.findIndex(
      (m) => m.moduleId === moduleId
    );

    if (moduleIndex > -1) {
      // Update existing
      if (timeSpent !== undefined)
        enrollment.modules_status[moduleIndex].timeSpent = timeSpent;
      if (completed !== undefined)
        enrollment.modules_status[moduleIndex].completed = completed;
      if (quizScore !== undefined && quizScore !== null) {
        enrollment.modules_status[moduleIndex].quizScore = quizScore;
      }
    } else {
      // Add new
      enrollment.modules_status.push({
        moduleId,
        timeSpent,
        completed,
        quizScore,
      });
    }

    // ** INTEGRATE NEW LOGIC: Check course completion status after module update **
    const updatedEnrollment = await checkCourseCompletion(courseId, enrollment);

    await updatedEnrollment.save();
    res.json(updatedEnrollment);
  } catch (err) {
    console.error("Error in updateProgress:", err);
    res.status(500).json({ error: err.message });
  }
};
