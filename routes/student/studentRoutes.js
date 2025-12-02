const express = require("express");
const studentController = require("../../controllers/student/studentController");

const router = express.Router();

// Support both query-style (/is_enrolled?courseId=...) and path-style (/is_enrolled/:studentId/:courseId)
router.get("/is_enrolled", studentController.checkEnrollment);
router.get("/is_enrolled/:studentId/:courseId", studentController.checkEnrollment);
router.get("/enroll", studentController.enrollStudent);
router.put("/module_complete", studentController.markModuleComplete);

router.get("/student-progress", studentController.fetchStudentProgress);
router.get("/completed_modules", studentController.getCompletedModules);
router.get("/progress", studentController.getDashboard);

// New route for v1 progress tracking (quiz scores, etc.)
router.post("/progress/:courseId", studentController.updateProgress);

module.exports = router;
