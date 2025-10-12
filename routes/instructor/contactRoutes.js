const express = require("express");
const router = express.Router();
const contactAdminController = require("../../controllers/instructor/contactController.js");

// Send a new message
router.post("/send-message", contactAdminController.sendMessage);

// Get instructor's messages
router.get("/messages", contactAdminController.getMessages);

module.exports = router;
