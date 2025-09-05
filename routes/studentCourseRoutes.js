const express = require('express');
const studentCourseC = require('../controllers/studentCourseC');

const router = express.Router();

router.get('/is_enrolled', studentCourseC.checkEnrollment);
router.get('/enroll', studentCourseC.enrollStudent);
router.put("/module_complete", studentCourseC.markModuleComplete);

router.get('/student-progress/:studentId', studentCourseC.fetchStudentProgress);
router.get('/completed_modules',studentCourseC.getCompletedModules);
router.get('/progress',studentCourseC.redirectToProgressView);


module.exports = router;
