const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Import isAuthenticated

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

// NEW ROUTE: Update Profile (Protected)
router.put('/profile', isAuthenticated, authController.updateProfile);

router.get('/teachers', authController.getAllTeachers);

module.exports = router;