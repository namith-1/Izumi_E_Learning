const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { isAdmin } = require('../middleware/authMiddleware');

// ===== ADMIN ANALYTICS (Protected by isAdmin) =====
// Apply isAdmin middleware only to admin routes
/** @swagger
 * /api/analytics/admin/overview:
 *   get:
 *     summary: Admin platform overview metrics
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, example: 30 }
 *     responses:
 *       200: { description: Overview metrics }
 */
router.get('/admin/overview', isAdmin, analyticsController.getAdminOverview);
/** @swagger
 * /api/analytics/admin/growth-trends:
 *   get:
 *     summary: Growth trends for users, courses, enrollments
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, example: 30 }
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *     responses:
 *       200: { description: Growth trend timeseries }
 */
router.get('/admin/growth-trends', isAdmin, analyticsController.getGrowthTrends);
/** @swagger
 * /api/analytics/admin/subject-distribution:
 *   get:
 *     summary: Subject-wise distribution
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Subject distribution }
 */
router.get('/admin/subject-distribution', isAdmin, analyticsController.getSubjectDistribution);
/** @swagger
 * /api/analytics/admin/top-courses:
 *   get:
 *     summary: Top courses
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, example: enrollments }
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *     responses:
 *       200: { description: Top courses list }
 */
router.get('/admin/top-courses', isAdmin, analyticsController.getTopCourses);
/** @swagger
 * /api/analytics/admin/instructor-leaderboard:
 *   get:
 *     summary: Instructor leaderboard
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Leaderboard }
 */
router.get('/admin/instructor-leaderboard', isAdmin, analyticsController.getInstructorLeaderboard);
/** @swagger
 * /api/analytics/admin/revenue-overview:
 *   get:
 *     summary: Revenue overview metrics
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Revenue overview }
 */
router.get('/admin/revenue-overview', isAdmin, analyticsController.getRevenueOverview);
/** @swagger
 * /api/analytics/admin/revenue-trend:
 *   get:
 *     summary: Revenue time series
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, month, year] }
 *     responses:
 *       200: { description: Revenue trend }
 */
router.get('/admin/revenue-trend', isAdmin, analyticsController.getRevenueTrend);
/** @swagger
 * /api/analytics/admin/transactions/status-distribution:
 *   get:
 *     summary: Transaction status distribution
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Status distribution }
 */
router.get('/admin/transactions/status-distribution', isAdmin, analyticsController.getTransactionStatusDistribution);
/** @swagger
 * /api/analytics/admin/revenue-by-teacher:
 *   get:
 *     summary: Revenue/profit by instructor
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Revenue by teacher }
 */
router.get('/admin/revenue-by-teacher', isAdmin, analyticsController.getRevenueByTeacher);
/** @swagger
 * /api/analytics/admin/revenue-by-student:
 *   get:
 *     summary: Revenue/profit by student
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Revenue by student }
 */
router.get('/admin/revenue-by-student', isAdmin, analyticsController.getRevenueByStudent);
/** @swagger
 * /api/analytics/admin/revenue-by-course:
 *   get:
 *     summary: Revenue/profit by course
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Revenue by course }
 */
router.get('/admin/revenue-by-course', isAdmin, analyticsController.getRevenueByCourse);

// ===== COURSE ANALYTICS (Protected by isAdmin, but could be open to teachers if needed later) =====
/** @swagger
 * /api/analytics/courses/enrollment-trends:
 *   get:
 *     summary: Course enrollment trends
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema: { type: string }
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Enrollment trends }
 */
router.get('/courses/enrollment-trends', isAdmin, analyticsController.getCourseEnrollmentTrends);
/** @swagger
 * /api/analytics/courses/completion-analysis:
 *   get:
 *     summary: Completion analysis
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Completion breakdown }
 */
router.get('/courses/completion-analysis', isAdmin, analyticsController.getCompletionAnalysis);
/** @swagger
 * /api/analytics/courses/rating-analysis:
 *   get:
 *     summary: Rating analysis
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Rating analysis }
 */
router.get('/courses/rating-analysis', isAdmin, analyticsController.getRatingAnalysis);
/** @swagger
 * /api/analytics/courses/price:
 *   get:
 *     summary: Course price/revenue timeline
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Course price timeline }
 */
router.get('/courses/price', isAdmin, analyticsController.getOverallTimeAnalytics);

// ===== INSTRUCTOR ANALYTICS (Protected by isTeacher) =====
const { isTeacher } = require('../middleware/authMiddleware');
/** @swagger
 * /api/analytics/instructor/my-stats:
 *   get:
 *     summary: Instructor analytics
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer }
 *       - in: query
 *         name: instructorId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Instructor stats }
 */
router.get('/instructor/my-stats', isTeacher, analyticsController.getInstructorAnalytics);
/** @swagger
 * /api/analytics/instructor/student-analytics:
 *   get:
 *     summary: Instructor student analytics
 *     tags: [Analytics]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Student analytics list }
 */
router.get('/instructor/student-analytics', isTeacher, analyticsController.getInstructorStudentAnalytics);

module.exports = router;
