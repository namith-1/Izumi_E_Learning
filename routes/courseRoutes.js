const express = require("express");
const courseController = require("../controllers/courseViewC");

const router = express.Router();

// Legacy routes
router.get("/view_course", courseController.viewCourse);
router.get("/module_complete_page", courseController.moduleCompletePage);
router.get("/course/about/:courseId", courseController.getCourseDetails);
router.get("/course-edit", courseController.editCourse);
router.get("/courses-list", courseController.listCourses);

// API routes for React frontend
router.get("/api/courses", courseController.getAllCourses);
router.get("/api/student/courses", courseController.getStudentCourses);
router.get("/api/courses/:courseId", courseController.getCourseDetails);

module.exports = router;

