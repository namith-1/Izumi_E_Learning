const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { isAuthenticated, isReviewer } = require("../middleware/authMiddleware");

// ── Instructor endpoints (any authenticated teacher) ──────────────────
/** @swagger
 * /api/review/submit/{courseId}:
 *   post:
 *     summary: Submit course for review
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Submitted }
 */
router.post("/submit/:courseId", isAuthenticated, reviewController.submitForReview);
/** @swagger
 * /api/review/my-status:
 *   get:
 *     summary: Get current instructor course review statuses
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Status list }
 */
router.get("/my-status", isAuthenticated, reviewController.getMyCoursesStatus);
/** @swagger
 * /api/review/instructor-note/{courseId}:
 *   post:
 *     summary: Add instructor note to review thread
 *     tags: [Review]
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
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200: { description: Note saved }
 */
router.post("/instructor-note/:courseId", isAuthenticated, reviewController.addInstructorNote);

// ── Reviewer-only endpoints ───────────────────────────────────────────
/** @swagger
 * /api/review/queue:
 *   get:
 *     summary: Get reviewer queue
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Queue list }
 */
router.get("/queue", isReviewer, reviewController.getReviewQueue);
/** @swagger
 * /api/review/history:
 *   get:
 *     summary: Get reviewer history
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: History list }
 */
router.get("/history", isReviewer, reviewController.getReviewHistory);
/** @swagger
 * /api/review/stats:
 *   get:
 *     summary: Get reviewer stats
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Review stats }
 */
router.get("/stats", isReviewer, reviewController.getReviewStats);
/** @swagger
 * /api/review/course/{id}:
 *   get:
 *     summary: Get course details for review
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course review detail }
 */
router.get("/course/:id", isReviewer, reviewController.getCourseForReview);
/** @swagger
 * /api/review/course/{id}/approve:
 *   post:
 *     summary: Approve course
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Approved }
 */
router.post("/course/:id/approve", isReviewer, reviewController.approveCourse);
/** @swagger
 * /api/review/course/{id}/reject:
 *   post:
 *     summary: Reject course
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rejected }
 */
router.post("/course/:id/reject", isReviewer, reviewController.rejectCourse);
/** @swagger
 * /api/review/course/{id}/request-revision:
 *   post:
 *     summary: Request revision for course
 *     tags: [Review]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Revision requested }
 */
router.post("/course/:id/request-revision", isReviewer, reviewController.requestRevision);

module.exports = router;
