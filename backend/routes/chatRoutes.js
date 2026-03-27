const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Auth guard — reuse session check
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    next();
};

router.use(requireAuth);

// GET /api/chat/unread-count
router.get("/unread-count", chatController.getUnreadCount);

// GET /api/chat/:courseId/messages?otherUserId=xxx&before=...&limit=50
router.get("/:courseId/messages", chatController.getMessages);

// GET /api/chat/:courseId/conversations (instructor only)
router.get("/:courseId/conversations", chatController.getConversations);

module.exports = router;
