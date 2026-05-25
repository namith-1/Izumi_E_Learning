const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isAuthenticated } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/payments/student/checkout:
 *   post:
 *     summary: Checkout and enroll student
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId: { type: string }
 *               paymentMethod: { type: string, example: card }
 *               currency: { type: string, example: USD }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Payment successful and enrolled }
 */
router.post("/student/checkout", isAuthenticated, paymentController.checkoutStudentPayment);
/**
 * @swagger
 * /api/payments/student/transactions:
 *   get:
 *     summary: List student transactions
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Transactions list }
 */
router.get("/student/transactions", isAuthenticated, paymentController.getStudentTransactions);
/**
 * @swagger
 * /api/payments/student/transactions/{id}:
 *   get:
 *     summary: Get student transaction by ID
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Transaction detail }
 */
router.get("/student/transactions/:id", isAuthenticated, paymentController.getStudentTransactionById);
/**
 * @swagger
 * /api/payments/student/transactions/{id}:
 *   put:
 *     summary: Update student transaction
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *               paymentMethod: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put("/student/transactions/:id", isAuthenticated, paymentController.updateStudentTransaction);
/**
 * @swagger
 * /api/payments/student/transactions/{id}:
 *   delete:
 *     summary: Cancel student transaction
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cancelled }
 */
router.delete("/student/transactions/:id", isAuthenticated, paymentController.cancelStudentTransaction);
/**
 * @swagger
 * /api/payments/student/summary:
 *   get:
 *     summary: Get student payment summary
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Summary }
 */
router.get("/student/summary", isAuthenticated, paymentController.getStudentPaymentSummary);

// Teacher endpoints (4)
/**
 * @swagger
 * /api/payments/teacher/transactions:
 *   get:
 *     summary: List teacher transactions
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Transactions list }
 */
router.get("/teacher/transactions", isAuthenticated, paymentController.getTeacherTransactions);
/**
 * @swagger
 * /api/payments/teacher/transactions/{id}:
 *   get:
 *     summary: Get teacher transaction by ID
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Transaction detail }
 */
router.get("/teacher/transactions/:id", isAuthenticated, paymentController.getTeacherTransactionById);
/**
 * @swagger
 * /api/payments/teacher/transactions/{id}/status:
 *   put:
 *     summary: Update teacher payout status
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payoutStatus: { type: string, example: released }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put("/teacher/transactions/:id/status", isAuthenticated, paymentController.updateTeacherTransactionStatus);
/**
 * @swagger
 * /api/payments/teacher/summary:
 *   get:
 *     summary: Get teacher summary
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Summary }
 */
router.get("/teacher/summary", isAuthenticated, paymentController.getTeacherPaymentSummary);

// Admin endpoints (4)
/**
 * @swagger
 * /api/payments/admin/transactions:
 *   get:
 *     summary: Get all transactions (admin)
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     responses:
 *       200: { description: Transactions list }
 */
router.get("/admin/transactions", isAuthenticated, paymentController.getAllTransactionsAdmin);
/**
 * @swagger
 * /api/payments/admin/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID (admin)
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Transaction detail }
 */
router.get("/admin/transactions/:id", isAuthenticated, paymentController.getTransactionByIdAdmin);
/**
 * @swagger
 * /api/payments/admin/transactions/{id}:
 *   put:
 *     summary: Update transaction (admin)
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *               payoutStatus: { type: string }
 *               paymentMethod: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put("/admin/transactions/:id", isAuthenticated, paymentController.updateTransactionAdmin);
/**
 * @swagger
 * /api/payments/admin/transactions/{id}:
 *   delete:
 *     summary: Delete transaction (admin)
 *     tags: [Payments]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete("/admin/transactions/:id", isAuthenticated, paymentController.deleteTransactionAdmin);

module.exports = router;
