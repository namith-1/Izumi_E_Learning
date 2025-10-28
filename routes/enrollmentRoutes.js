const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// NEW ROUTE: Fetch all enrolled courses for the dashboard
router.get('/my-courses', isAuthenticated, enrollmentController.getMyEnrolledCourses);

router.post('/enroll', isAuthenticated, enrollmentController.enroll);
// Route used by CourseViewer to check enrollment status
router.get('/:courseId', isAuthenticated, enrollmentController.getEnrollment); 
router.put('/:courseId/progress', isAuthenticated, enrollmentController.updateProgress);

module.exports = router;