const express = require("express");
const studentCourseC = require("../controllers/studentCourseC");

const router = express.Router();

// Support both query-style (/is_enrolled?courseId=...) and path-style (/is_enrolled/:studentId/:courseId)
router.get("/is_enrolled", studentCourseC.checkEnrollment);
router.get("/is_enrolled/:studentId/:courseId", studentCourseC.checkEnrollment);
router.get("/enroll", studentCourseC.enrollStudent);
router.put("/module_complete", studentCourseC.markModuleComplete);

router.get("/student-progress", studentCourseC.fetchStudentProgress);
router.get("/completed_modules", studentCourseC.getCompletedModules);
router.get("/progress", studentCourseC.redirectToProgressView);

module.exports = router;
