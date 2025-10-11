const StudentCourse = require("../models/studentModel"); // Import the Mongoose model
const Course = require("../models/courseModel"); // Use the Mongoose model

const mongoose = require("mongoose");

const { CourseStat } = require("../required/db");

exports.checkEnrollment = async (req, res) => {
  if (!req.session.student) return res.redirect("/");

  // Accept params from either query (/?courseId=...) or path (/is_enrolled/:studentId/:courseId)
  const courseId = req.query.courseId || req.params.courseId;
  // Prefer session student when available, else allow path param for API calls from the client
  const studentId = req.session.student || req.params.studentId;

  if (!courseId) return res.status(400).send("Missing course ID.");
  // Validate courseId early to avoid passing invalid IDs to Mongoose
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).send("Invalid Course ID.");
  }

  try {
    const enrolled = await StudentCourse.isEnrolled(studentId, courseId);
    // If request came from an AJAX fetch (path-style with explicit studentId), return JSON
    if (req.params.studentId || req.xhr) {
      return res.json({ enrolled, courseId });
    }

    if (enrolled) {
      res.redirect(`/view_course?courseID=${courseId}&studentID=${studentId}`);
    } else {
      res.redirect(`/course/about/${courseId}`);
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).send("Database error: " + error.message);
  }
};

exports.enrollStudent = async (req, res) => {
  if (!req.session.student) return res.redirect("/login");

  const studentId = req.session.student;
  const courseId = req.query.courseId;

  if (!studentId || !courseId) {
    return res
      .status(400)
      .json({ message: "Student ID and Course ID are required" });
  }

  // Validate courseId before attempting to enroll
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: "Invalid Course ID." });
  }

  try {
    // If already enrolled, redirect to course view instead of enrolling again
    const alreadyEnrolled = await StudentCourse.isEnrolled(studentId, courseId);
    if (alreadyEnrolled) {
      const redirectUrl = `/view_course?courseID=${courseId}&studentID=${studentId}`;
      // Replace current history entry (enroll URL) with course view so Back won't return to enroll URL
      return res.send(
        `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><script>window.location.replace(${JSON.stringify(
          redirectUrl
        )});</script></body></html>`
      );
    }

    // Create enrollment and increment course stats inside the Student model
    await StudentCourse.enroll(studentId, courseId);

    // NOTE: avoid calling Course.updateCourseEnrollment here to prevent duplicate creation
    // and double-incrementing enrolled_count. StudentCourse.enroll handles increment.

    const redirectUrl = `/view_course?courseID=${courseId}&studentID=${studentId}`;
    return res.send(
      `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><script>window.location.replace(${JSON.stringify(
        redirectUrl
      )});</script></body></html>`
    );
  } catch (error) {
    console.error("Enrollment error:", error);
    return res
      .status(500)
      .json({ message: "Error enrolling student: " + error.message });
  }
};

exports.fetchStudentProgress = async (req, res) => {
  const studentId = req.params.studentId;
  console.log("Fetching progress for student:", studentId);

  try {
    const rows = await StudentCourse.getStudentCourseProgress(studentId);
    const progressRows = rows.map((row) => ({
      ...row,
      progress:
        row.total_modules > 0
          ? ((row.completed_modules / row.total_modules) * 100).toFixed(2)
          : "0",
    }));
    res.json(progressRows);
  } catch (error) {
    console.error("Error fetching student progress:", error);
    return res
      .status(500)
      .json({ error: "Error fetching student progress: " + error.message });
  }
};

exports.getCompletedModules = async (req, res) => {
  const { studentId, courseId } = req.query;

  if (!studentId || !courseId) {
    return res.status(400).send("Student ID and Course ID are required.");
  }

  // Validate courseId is a proper ObjectId to avoid Mongoose CastError
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).send("Invalid Course ID.");
  }

  try {
    const rows = await StudentCourse.getCompletedModules(studentId, courseId);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching completed modules:", error);
    return res
      .status(500)
      .send("Error fetching completed modules: " + error.message);
  }
};

exports.redirectToProgressView = (req, res) => {
  if (!req.session.student) {
    return res.redirect("/login");
  }

  const studentId = req.session.student;
  res.redirect(`/views/studentProgress.html?studentId=${studentId}`);
};

exports.markModuleComplete = async (req, res) => {
  // Accept moduleId from body (recommended) or query for backward compatibility
  const moduleId =
    req.body && req.body.moduleId ? req.body.moduleId : req.query.moduleId;
  // studentId can come from session or body (when called from client with studentId param)
  const studentId = (req.body && req.body.studentId) || req.session.student;

  if (!moduleId) {
    return res.status(400).json({ error: "Module ID is required." });
  }

  try {
    // Coerce to string to avoid mongoose treating numeric input oddly
    const moduleIdStr = String(moduleId);

    // If moduleId is not a valid ObjectId, return success for demo/sample ids (avoid CastError)
    if (!mongoose.Types.ObjectId.isValid(moduleIdStr)) {
      console.warn(
        "markModuleComplete called with non-ObjectId moduleId:",
        moduleId
      );
      return res.status(200).json({ status: "ok", message: "demo" });
    }

    if (!studentId) {
      // If we don't have a studentId, return 401 to indicate auth required
      return res
        .status(401)
        .json({ error: "Unauthorized: student not logged in." });
    }

    const result = await StudentCourse.markModuleAsComplete(
      studentId,
      moduleIdStr
    );
    if (result && result.changes > 0) {
      return res.status(200).json({ status: "ok" });
    }

    return res
      .status(404)
      .json({ error: "Module not found or student does not exist." });
  } catch (error) {
    console.error("Error marking module as complete:", error);
    return res
      .status(500)
      .json({ error: "Error updating module completion: " + error.message });
  }
};
