const StudentCourse = require("../models/studentModel");
const Course = require("../models/courseModel");
const CreditsModel = require("../models/creditsModel");
const mongoose = require("mongoose");
const { CourseStat } = require("../required/db");

exports.checkEnrollment = async (req, res) => {
  if (!req.session.student) return res.redirect("/");

  const courseId = req.query.courseId || req.params.courseId;
  const studentId = req.session.student || req.params.studentId;

  if (!courseId) return res.status(400).send("Missing course ID.");
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).send("Invalid Course ID.");
  }

  try {
    const enrolled = await StudentCourse.isEnrolled(studentId, courseId);
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

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: "Invalid Course ID." });
  }

  try {
    const alreadyEnrolled = await StudentCourse.isEnrolled(studentId, courseId);
    if (alreadyEnrolled) {
      const redirectUrl = `/view_course?courseID=${courseId}&studentID=${studentId}`;
      return res.send(
        `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><script>window.location.replace(${JSON.stringify(
          redirectUrl
        )});</script></body></html>`
      );
    }

    await StudentCourse.enroll(studentId, courseId);

    // Award enrollment bonus (non-blocking)
    try {
      if (CreditsModel && typeof CreditsModel.addCredits === "function") {
        await CreditsModel.addCredits(
          studentId,
          50,
          "bonus",
          courseId,
          "Course enrollment bonus!"
        );
      }
    } catch (creditError) {
      console.error("Error awarding enrollment credits:", creditError);
    }

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
  const studentId = req.session.student;

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
  const moduleId =
    req.body && req.body.moduleId ? req.body.moduleId : req.query.moduleId;
  const studentId = (req.body && req.body.studentId) || req.session.student;

  if (!moduleId) {
    return res.status(400).json({ error: "Module ID is required." });
  }

  try {
    const moduleIdStr = String(moduleId);

    if (!mongoose.Types.ObjectId.isValid(moduleIdStr)) {
      console.warn(
        "markModuleComplete called with non-ObjectId moduleId:",
        moduleId
      );
      return res.status(200).json({ status: "ok", message: "demo" });
    }

    if (!studentId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: student not logged in." });
    }

    const result = await StudentCourse.markModuleAsComplete(
      studentId,
      moduleIdStr
    );

    if (result && result.changes > 0) {
      try {
        let creditsAwarded = { total_credits: 0 };
        if (
          CreditsModel &&
          typeof CreditsModel.awardModuleCompletion === "function"
        ) {
          creditsAwarded = await CreditsModel.awardModuleCompletion(
            studentId,
            moduleIdStr
          );
        }

        const Module = require("../required/db").Module;
        const module = await Module.findById(moduleIdStr);
        if (module && module.course_id) {
          const allModules = await Module.find({ course_id: module.course_id });
          const completedModules = await StudentCourse.getCompletedModules(
            studentId,
            module.course_id
          );

          if (allModules.length === completedModules.length) {
            if (
              CreditsModel &&
              typeof CreditsModel.awardCourseCompletion === "function"
            ) {
              await CreditsModel.awardCourseCompletion(
                studentId,
                module.course_id
              );
            }
            return res.status(200).json({
              status: "ok",
              message: "Module completed!",
              courseCompleted: true,
              creditsAwarded: creditsAwarded.total_credits,
            });
          }
        }

        return res.status(200).json({
          status: "ok",
          message: "Module completed!",
          creditsAwarded: creditsAwarded.total_credits,
        });
      } catch (creditError) {
        console.error("Error awarding module credits:", creditError);
        return res.status(200).json({ status: "ok" });
      }
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
