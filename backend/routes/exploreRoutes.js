const express = require("express");
const router  = express.Router();
const { getFeed } = require("../controllers/exploreController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// GET /api/explore/feed — personalised video + article feed
router.get("/feed", isAuthenticated, getFeed);

module.exports = router;
