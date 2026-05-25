// backend/routes/subjectRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/subjectController");
const { isAuthenticated, isReviewer } = require("../middleware/authMiddleware");

// Public — anyone can browse the approved subject tree
router.get("/", ctrl.getTree);
router.get("/flat", ctrl.getFlat);

// Instructor — propose a new topic (must be authenticated)
router.post("/propose", isAuthenticated, ctrl.propose);

// Reviewer only
router.get("/pending", isAuthenticated, isReviewer, ctrl.getPending);
router.put("/:id/review", isAuthenticated, isReviewer, ctrl.review);

module.exports = router;
