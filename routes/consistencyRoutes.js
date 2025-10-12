const express = require("express");
const router = express.Router();
const consistencyController = require("../controllers/consistencyController");

// GET /api/consistency?studentId=...
router.get("/", consistencyController.listDates);
// POST /api/consistency { date }
router.post("/", consistencyController.addDate);
// DELETE /api/consistency { date }
router.delete("/", consistencyController.removeDate);

module.exports = router;
