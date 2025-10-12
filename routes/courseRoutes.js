const express = require("express");
const courseController = require("../controllers/courseViewC");

const router = express.Router();

router.get("/view_course", courseController.viewCourse);
router.get("/module_complete_page", courseController.moduleCompletePage);
router.get("/course/about/:courseId", courseController.getCourseDetails);
router.get("/course-edit", courseController.editCourse);
router.get("/courses-list", courseController.listCourses);

module.exports = router;

