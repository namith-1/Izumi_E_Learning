const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

// Apply middleware to protect all admin routes
router.use(adminAuthMiddleware);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users
router.get('/users/data', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Courses
router.get('/courses/data', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Payments
router.get('/payments/data', adminController.getPayments);
router.put('/payments/:id/status', adminController.updatePaymentStatus);

// Requests
router.get('/requests/data', adminController.getRequests);
router.put('/requests/:id', adminController.updateRequest);
router.delete('/requests/:id', adminController.deleteRequest);

// Content
router.get('/content/data', adminController.getContent);
router.post('/content', adminController.createContent);
router.put('/content/:id', adminController.updateContent);
router.delete('/content/:id', adminController.deleteContent);

// Utility endpoints (kept for compatibility if needed)
router.get('/courses/list', async (req, res) => {
    const { Course } = require('../required/db');
    try {
        const courses = await Course.find().select('_id title').sort('title');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

router.get('/instructors', async (req, res) => {
    // Re-using logic from controller or keeping simple query
    const { Instructor } = require('../required/db');
    try {
        const instructors = await Instructor.find({ is_deleted: 0 })
            .select('_id name')
            .sort('name');
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching instructors' });
    }
});

module.exports = router;
