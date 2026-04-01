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
/** @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get unread chat count
 *     tags: [Chat]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Unread counts }
 */
router.get("/unread-count", chatController.getUnreadCount);

// GET /api/chat/:courseId/messages?otherUserId=xxx&before=...&limit=50
/** @swagger
 * /api/chat/{courseId}/messages:
 *   get:
 *     summary: Get chat messages for course and participant
 *     tags: [Chat]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: otherUserId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200: { description: Message list }
 */
router.get("/:courseId/messages", chatController.getMessages);

// GET /api/chat/:courseId/conversations (instructor only)
/** @swagger
 * /api/chat/{courseId}/conversations:
 *   get:
 *     summary: Get conversation list for instructor in a course
 *     tags: [Chat]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Conversations list }
 */
router.get("/:courseId/conversations", chatController.getConversations);

module.exports = router;
