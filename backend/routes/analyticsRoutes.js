const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { isAdmin } = require('../middleware/authMiddleware');

// ===== ADMIN ANALYTICS (Protected by isAdmin) =====
// Apply isAdmin middleware only to admin routes
router.get('/admin/overview', isAdmin, analyticsController.getAdminOverview);
router.get('/admin/growth-trends', isAdmin, analyticsController.getGrowthTrends);
router.get('/admin/subject-distribution', isAdmin, analyticsController.getSubjectDistribution);
router.get('/admin/top-courses', isAdmin, analyticsController.getTopCourses);
router.get('/admin/instructor-leaderboard', isAdmin, analyticsController.getInstructorLeaderboard);

// ===== COURSE ANALYTICS (Protected by isAdmin, but could be open to teachers if needed later) =====
router.get('/courses/enrollment-trends', isAdmin, analyticsController.getCourseEnrollmentTrends);
router.get('/courses/completion-analysis', isAdmin, analyticsController.getCompletionAnalysis);
router.get('/courses/rating-analysis', isAdmin, analyticsController.getRatingAnalysis);

// ===== INSTRUCTOR ANALYTICS (Protected by isTeacher) =====
const { isTeacher } = require('../middleware/authMiddleware');
router.get('/instructor/my-stats', isTeacher, analyticsController.getInstructorAnalytics);
router.get('/instructor/student-analytics', isTeacher, analyticsController.getInstructorStudentAnalytics);

module.exports = router;
