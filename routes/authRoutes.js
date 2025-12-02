const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// API endpoints for frontend
router.post('/api/auth/signup', authController.signup);
router.post('/api/auth/login', authController.login);
router.get('/api/auth/me', authController.getCurrentUser);
router.post('/api/auth/logout', authController.logout);

// Legacy endpoints (for backward compatibility)
router.post('/signup', authController.signup);
router.post('/login', authController.loginStudent);
router.get('/load_user_info', authController.getCurrentUser);

const getAuthController = require('../controllers/getAuthController');
router.get('/', getAuthController.home);
router.get('/login', getAuthController.login);
router.get('/signup', getAuthController.signup);
router.get('/login_i', getAuthController.loginInstructor);
router.get('/signup_i', getAuthController.signupInstructor);
router.get('/home', getAuthController.studentHome);

// Friendly routes matching client-side paths
router.get('/student/login', getAuthController.login);
router.get('/instructor/login', getAuthController.loginInstructor);


module.exports = router;
