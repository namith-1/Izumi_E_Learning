const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// NEW ROUTE: Fetch all enrolled courses for the dashboard
/**
 * @swagger
 * /api/enrollment/my-courses:
 *   get:
 *     summary: Get my enrolled courses
 *     tags: [Enrollment]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Enrolled courses list }
 */
router.get(
  "/my-courses",
  isAuthenticated,
  enrollmentController.getMyEnrolledCourses,
);

/**
 * @swagger
 * /api/enrollment/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollment]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId: { type: string }
 *     responses:
 *       201: { description: Enrolled }
 */
router.post("/enroll", isAuthenticated, enrollmentController.enroll);
// Route used by CourseViewer to check enrollment status
/**
 * @swagger
 * /api/enrollment/{courseId}:
 *   get:
 *     summary: Get enrollment status for a course
 *     tags: [Enrollment]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Enrollment detail }
 */
router.get("/:courseId", isAuthenticated, enrollmentController.getEnrollment);
/**
 * @swagger
 * /api/enrollment/{courseId}/progress:
 *   put:
 *     summary: Update enrollment progress
 *     tags: [Enrollment]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId]
 *             properties:
 *               moduleId: { type: string }
 *               timeSpent: { type: number }
 *               completed: { type: boolean }
 *               quizScore: { type: number }
 *     responses:
 *       200: { description: Progress updated }
 */
router.put(
  "/:courseId/progress",
  isAuthenticated,
  enrollmentController.updateProgress,
);

/**
 * @swagger
 * /api/enrollment/{courseId}/rating:
 *   put:
 *     summary: Submit/update rating for an enrolled course
 *     tags: [Enrollment]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               review: { type: string }
 *     responses:
 *       200: { description: Rating submitted }
 */
router.put(
  "/:courseId/rating",
  isAuthenticated,
  enrollmentController.submitCourseRating,
);

module.exports = router;
