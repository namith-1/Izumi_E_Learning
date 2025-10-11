const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  createInstituteMail,
  getInstituteMails,
  createCourseStatus,
  getCourseStatuses
} = require("../../controllers/instructor/commonController");

// ========== Transactions ==========
router.post("/transactions", createTransaction);
router.get("/transactions", getTransactions);

// ========== Institute Mail ==========
router.post("/institute-mails", createInstituteMail);
router.get("/institute-mails", getInstituteMails);

// ========== Course Status ==========
router.post("/course-status", createCourseStatus);
router.get("/course-status", getCourseStatuses);

module.exports = router;
