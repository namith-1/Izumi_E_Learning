// routes/instructorCourses.js
const express = require('express');
const router = express.Router();
const {
  getInstructorCourses,
  getCourseStatsOverTime
} = require('../../controllers/instructor/courseInfoController.js');

// Get all instructor courses + stats
router.get('/instructor/courses2', getInstructorCourses);

// Get enrollment trend for a specific course
router.get('/instructor/course2/:courseId/stats', getCourseStatsOverTime);

module.exports = router;
