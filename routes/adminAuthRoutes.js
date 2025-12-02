const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

// Apply middleware to protect admin routes
router.use(adminAuthMiddleware);

// Admin authentication routes
router.post('/signup', adminAuthController.signup);
router.post('/login', adminAuthController.login);
router.get('/me', adminAuthController.getCurrentAdmin);
router.post('/logout', adminAuthController.logout);

module.exports = router;
