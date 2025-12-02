const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// API endpoints for frontend
router.post('/api/auth/signup', authController.signup);
router.post('/api/auth/login', authController.login);
router.get('/api/auth/me', authController.getCurrentUser);
router.post('/api/auth/logout', authController.logout);

// Legacy endpoints (for backward compatibility)
router.post('/signup', (req, res) => {
  // Handle student signup with proper content-type for redirect logic
  console.log('Student signup via form:', req.headers['content-type']);
  authController.signup(req, res);
});
router.post('/login', (req, res) => {
  // Handle student login and redirect
  authController.loginStudent(req, res).then(() => {
    if (res.headersSent) return;
    res.redirect('/home');
  }).catch((error) => {
    console.error('Login error:', error);
    res.redirect('/student/login?error=login_failed');
  });
});
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
router.get('/instructor/dashboard', (req, res) => {
  if (req.session.instructor) {
    // Serve React app or redirect to client-side route
    const path = require('path');
    const fs = require('fs');
    const clientBuildPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
    if (fs.existsSync(clientBuildPath)) {
      res.sendFile(clientBuildPath);
    } else {
      res.redirect('/dashboard'); // Fallback to legacy route
    }
  } else {
    res.redirect('/instructor/login');
  }
});
router.get('/instructor/dashboard', (req, res) => {
  if (req.session.instructor) {
    // Serve React app or redirect to client-side route
    const clientBuildPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
    const fs = require('fs');
    if (fs.existsSync(clientBuildPath)) {
      res.sendFile(clientBuildPath);
    } else {
      res.redirect('/dashboard'); // Fallback to legacy route
    }
  } else {
    res.redirect('/instructor/login');
  }
});


module.exports = router;
