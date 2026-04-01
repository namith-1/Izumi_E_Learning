const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Student endpoints (6)
router.post("/student/checkout", isAuthenticated, paymentController.checkoutStudentPayment);
router.get("/student/transactions", isAuthenticated, paymentController.getStudentTransactions);
router.get("/student/transactions/:id", isAuthenticated, paymentController.getStudentTransactionById);
router.put("/student/transactions/:id", isAuthenticated, paymentController.updateStudentTransaction);
router.delete("/student/transactions/:id", isAuthenticated, paymentController.cancelStudentTransaction);
router.get("/student/summary", isAuthenticated, paymentController.getStudentPaymentSummary);

// Teacher endpoints (4)
router.get("/teacher/transactions", isAuthenticated, paymentController.getTeacherTransactions);
router.get("/teacher/transactions/:id", isAuthenticated, paymentController.getTeacherTransactionById);
router.put("/teacher/transactions/:id/status", isAuthenticated, paymentController.updateTeacherTransactionStatus);
router.get("/teacher/summary", isAuthenticated, paymentController.getTeacherPaymentSummary);

// Admin endpoints (4)
router.get("/admin/transactions", isAuthenticated, paymentController.getAllTransactionsAdmin);
router.get("/admin/transactions/:id", isAuthenticated, paymentController.getTransactionByIdAdmin);
router.put("/admin/transactions/:id", isAuthenticated, paymentController.updateTransactionAdmin);
router.delete("/admin/transactions/:id", isAuthenticated, paymentController.deleteTransactionAdmin);

module.exports = router;
