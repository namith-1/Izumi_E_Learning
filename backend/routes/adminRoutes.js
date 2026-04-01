const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// Apply isAdmin middleware to all routes in this file
router.use(isAdmin);

// --- Enrollment & Reporting ---
/** @swagger
 * /api/admin/enrollments:
 *   get:
 *     summary: Get all enrollments (admin)
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Enrollment list }
 */
router.get('/enrollments', adminController.getAllEnrollments);
/** @swagger
 * /api/admin/enrollments/student/{email}:
 *   get:
 *     summary: Lookup student enrollments by email
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Student enrollment detail }
 */
router.get('/enrollments/student/:email', adminController.getStudentEnrollmentByEmail);

// --- User Management ---
/** @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin)
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: User list }
 */
router.get('/users', adminController.getAllUsers);
/** @swagger
 * /api/admin/users/{role}/{id}:
 *   put:
 *     summary: Update user by role/id
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema: { type: string, enum: [student, teacher, reviewer] }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: User updated }
 */
router.put('/users/:role/:id', adminController.updateUser);
/** @swagger
 * /api/admin/users/{role}/{id}:
 *   delete:
 *     summary: Delete user by role/id
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema: { type: string, enum: [student, teacher, reviewer] }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 */
router.delete('/users/:role/:id', adminController.deleteUser);

// NEW: Teacher Lookup
/** @swagger
 * /api/admin/teachers/courses/{email}:
 *   get:
 *     summary: Lookup teacher courses by email
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Teacher courses }
 */
router.get('/teachers/courses/:email', adminController.getTeacherCoursesByEmail);

// --- Course Management ---
/** @swagger
 * /api/admin/courses:
 *   get:
 *     summary: Get all courses (admin)
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Courses list }
 */
router.get('/courses', adminController.getAllCoursesAdmin);
/** @swagger
 * /api/admin/courses/{id}:
 *   put:
 *     summary: Update course (admin)
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Course updated }
 */
router.put('/courses/:id', adminController.updateCourseAdmin);
/** @swagger
 * /api/admin/courses/{id}:
 *   delete:
 *     summary: Delete course (admin)
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course deleted }
 */
router.delete('/courses/:id', adminController.deleteCourse);

// --- Reviewer Management ---
/** @swagger
 * /api/admin/reviewers:
 *   get:
 *     summary: Get all reviewers
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Reviewer list }
 */
router.get('/reviewers', adminController.getAllReviewers);
/** @swagger
 * /api/admin/reviewers:
 *   post:
 *     summary: Create reviewer account
 *     tags: [Admin]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               specialization: { type: string }
 *     responses:
 *       201: { description: Reviewer created }
 */
router.post('/reviewers', adminController.createReviewer);

module.exports = router;