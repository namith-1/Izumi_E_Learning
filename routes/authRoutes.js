const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
router.post('/signup', authController.signup);
router.post('/login', authController.loginStudent);
router.get('/load_user_info', authController.loadUserInfo);

const getAuthController = require('../controllers/getAuthController');
router.get('/', getAuthController.home);
router.get('/login', getAuthController.login);
router.get('/signup', getAuthController.signup);
router.get('/login_i', getAuthController.loginInstructor);
router.get('/signup_i', getAuthController.signupInstructor);
router.get('/home', getAuthController.studentHome);


module.exports = router;
