// backend/routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { isAuthenticated, isTeacher } = require("../middleware/authMiddleware");
const courseUpload = require("../middleware/courseUpload");

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get course catalog
 *     tags: [Courses]
 *     responses:
 *       200: { description: Courses list }
 */
router.get("/", courseController.getAllCourses); // Public catalog
/**
 * @swagger
 * /api/courses/analytics:
 *   get:
 *     summary: Get instructor course analytics
 *     tags: [Courses]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Instructor analytics }
 */
router.get(
  "/analytics",
  isAuthenticated,
  isTeacher,
  courseController.getCourseAnalytics,
); // NEW ROUTE
/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by id
 *     tags: [Courses]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course detail }
 */
router.get("/:id", isAuthenticated, courseController.getCourseById);
/**
 * @swagger
 * /api/courses/upload-image:
 *   post:
 *     summary: Upload course image
 *     tags: [Courses]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Uploaded image URL }
 */
router.post(
  "/upload-image",
  isAuthenticated,
  isTeacher,
  courseUpload.single("image"),
  courseController.uploadCourseImage,
);
/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create course
 *     tags: [Courses]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       201: { description: Course created }
 */
router.post("/", isAuthenticated, isTeacher, courseController.createCourse);
/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course by id
 *     tags: [Courses]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course updated }
 */
router.put("/:id", isAuthenticated, isTeacher, courseController.updateCourse);
router.use('/', require('./mediaUpload')); // Mount media upload routes

module.exports = router;
