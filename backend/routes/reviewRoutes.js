const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { isAuthenticated, isReviewer } = require("../middleware/authMiddleware");

// ── Instructor endpoints (any authenticated teacher) ──────────────────
router.post("/submit/:courseId", isAuthenticated, reviewController.submitForReview);
router.get("/my-status", isAuthenticated, reviewController.getMyCoursesStatus);
router.post("/instructor-note/:courseId", isAuthenticated, reviewController.addInstructorNote);

// ── Reviewer-only endpoints ───────────────────────────────────────────
router.get("/queue", isReviewer, reviewController.getReviewQueue);
router.get("/history", isReviewer, reviewController.getReviewHistory);
router.get("/stats", isReviewer, reviewController.getReviewStats);
router.get("/course/:id", isReviewer, reviewController.getCourseForReview);
router.post("/course/:id/approve", isReviewer, reviewController.approveCourse);
router.post("/course/:id/reject", isReviewer, reviewController.rejectCourse);
router.post("/course/:id/request-revision", isReviewer, reviewController.requestRevision);

module.exports = router;
