const express = require("express");
const router  = express.Router();
const gc      = require("../controllers/groupChatController");
const { isAuthenticated } = require("../middleware/authMiddleware");

router.use(isAuthenticated);

// GET  /api/group-chat/:courseId/messages
router.get("/:courseId/messages", gc.getMessages);
// POST /api/group-chat/:courseId/messages
router.post("/:courseId/messages", gc.postMessage);
// GET  /api/group-chat/:courseId/members
router.get("/:courseId/members", gc.getMembers);

module.exports = router;
