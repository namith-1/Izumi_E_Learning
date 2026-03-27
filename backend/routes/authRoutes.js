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

module.exports = router;
