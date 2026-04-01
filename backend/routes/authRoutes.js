const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware"); // Import isAuthenticated
const upload = require("../middleware/uploadMiddleware");

// Use upload.single('profileImage') to handle the "profileImage" field from frontend FormData
router.put("/profile", isAuthenticated, upload.single('profileImage'), authController.updateProfile);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authController.me);

// NEW ROUTE: Update Profile (Protected)
// router.put("/profile", isAuthenticated, authController.updateProfile);

router.get("/teachers", authController.getAllTeachers);

const passport = require('passport');

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
