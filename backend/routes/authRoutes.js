const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware"); // Import isAuthenticated
const upload = require("../middleware/uploadMiddleware");

// Use upload.single('profileImage') to handle the "profileImage" field from frontend FormData
/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               profileImage: { type: string, format: binary }
 *     responses:
 *       200: { description: Profile updated }
 */
router.put("/profile", isAuthenticated, upload.single('profileImage'), authController.updateProfile);
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [student, teacher] }
 *     responses:
 *       201: { description: Registered }
 */
router.post("/register", authController.register);
/** @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *     responses:
 *       200: { description: Logged in }
 */
router.post("/login", authController.login);
/** @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authController.logout);
/** @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current session user
 *     tags: [Authentication]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 */
router.get("/me", authController.me);

// NEW ROUTE: Update Profile (Protected)
// router.put("/profile", isAuthenticated, authController.updateProfile);

/** @swagger
 * /api/auth/teachers:
 *   get:
 *     summary: List teachers
 *     tags: [Authentication]
 *     responses:
 *       200: { description: Teachers list }
 */
router.get("/teachers", authController.getAllTeachers);

const passport = require('passport');

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend dashboard on success or login on failure
 */

// Route to start Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Auth Callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, set the session user object
    req.session.user = {
      id: req.user._id,
      role: 'student', // Defaulting to student for Google Sign-in
      name: req.user.name,
      email: req.user.email,
    };
    // Redirect to the frontend dashboard
    // Fallback to localhost if the env variable is missing
const redirectUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/student-dashboard';
res.redirect(redirectUrl);
  }
);
module.exports = router;
