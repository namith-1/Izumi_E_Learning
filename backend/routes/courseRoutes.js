// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { isAuthenticated, isTeacher } = require('../middleware/authMiddleware');

router.get('/', courseController.getAllCourses); // Public catalog
router.get('/analytics', isAuthenticated, isTeacher, courseController.getCourseAnalytics); // NEW ROUTE
router.get('/:id', isAuthenticated, courseController.getCourseById);
router.post('/', isAuthenticated, isTeacher, courseController.createCourse);
router.put('/:id', isAuthenticated, isTeacher, courseController.updateCourse);

module.exports = router;