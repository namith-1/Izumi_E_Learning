const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");

// Only Admins can run tests
router.get("/", isAuthenticated, isAdmin, testController.listTests);
router.post("/run", isAuthenticated, isAdmin, testController.runTest);

module.exports = router;
