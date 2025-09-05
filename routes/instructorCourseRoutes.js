const express = require('express');
const router = express.Router();
const controller = require('../controllers/instructorCourse');

router.get("/course/:courseId", controller.getCourseDetails_moduleTree);

router.get('/courses_l', controller.getAllCourses);
router.get('/courses_l1', controller.getAllCourses); // Duplicate on purpose
router.get('/instructor-courses', controller.getInstructorCourses);
router.post('/save-course', controller.saveCourse);
router.post('/save-course-changes', controller.saveCourseChanges);
router.get('/courses_by', controller.getCoursesWithStats);
router.get('/my_course_info', controller.getStudentInfoView);

module.exports = router;
