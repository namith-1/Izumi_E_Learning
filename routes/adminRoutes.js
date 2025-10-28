const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// Apply isAdmin middleware to all routes in this file
router.use(isAdmin); 

// --- Enrollment & Reporting ---
router.get('/enrollments', adminController.getAllEnrollments);
router.get('/enrollments/student/:email', adminController.getStudentEnrollmentByEmail); 

// --- User Management ---
router.get('/users', adminController.getAllUsers);
router.put('/users/:role/:id', adminController.updateUser);
router.delete('/users/:role/:id', adminController.deleteUser);

// NEW: Teacher Lookup
router.get('/teachers/courses/:email', adminController.getTeacherCoursesByEmail);

// --- Course Management ---
router.get('/courses', adminController.getAllCoursesAdmin);
router.put('/courses/:id', adminController.updateCourseAdmin);
router.delete('/courses/:id', adminController.deleteCourse);

module.exports = router;