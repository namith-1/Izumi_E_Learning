const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const EnrollmentAnalytics = require("../models/EnrollmentAnalytics");

const REF_PREFIX = "TXN";
const buildReference = () =>
  `${REF_PREFIX}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const toObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const deny = (res, message = "Access denied") =>
  res.status(403).json({ message });

exports.checkoutStudentPayment = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student") {
      return deny(res, "Students only.");
    }

    const {
      courseId,
      paymentMethod = "card",
      currency = "USD",
      notes = "",
    } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required." });

    const course = await Course.findById(courseId).select(
      "_id teacherId price",
    );
    if (!course) return res.status(404).json({ message: "Course not found." });

    const studentId = req.session.user.id;
    const existingEnrollment = await Enrollment.findOne({
      courseId,
      studentId,
    });
    if (existingEnrollment)
      return res
        .status(400)
        .json({ message: "Already enrolled in this course." });

    const transaction = await Transaction.create({
      reference: buildReference(),
      courseId: course._id,
      studentId,
      teacherId: course.teacherId,
      amount: course.price || 0,
      currency,
      paymentMethod,
      status: "paid",
      payoutStatus: "pending",
      notes,
    });

    const enrollment = await Enrollment.create({ courseId, studentId });
    await EnrollmentAnalytics.create({
      courseId,
      studentId,
      price: course.price || 0,
    });

    return res.status(201).json({ transaction, enrollment });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate transaction/enrollment request." });
    }
    return res.status(500).json({ error: err.message });
  }
};

exports.getStudentTransactions = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student")
      return deny(res, "Students only.");
    const txns = await Transaction.find({ studentId: req.session.user.id })
      .populate("courseId", "title subject price")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });
    return res.json(txns);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getStudentTransactionById = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student")
      return deny(res, "Students only.");
    const txn = await Transaction.findOne({
      _id: req.params.id,
      studentId: req.session.user.id,
    }).populate("courseId", "title subject");
    if (!txn)
      return res.status(404).json({ message: "Transaction not found." });
    return res.json(txn);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateStudentTransaction = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student")
      return deny(res, "Students only.");
    const payload = {};
    if (req.body.notes !== undefined) payload.notes = req.body.notes;
    if (req.body.paymentMethod !== undefined)
      payload.paymentMethod = req.body.paymentMethod;

    const txn = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        studentId: req.session.user.id,
        status: { $in: ["pending", "paid"] },
      },
      payload,
      { new: true },
    );
    if (!txn)
      return res
        .status(404)
        .json({ message: "Transaction not found or cannot be updated." });
    return res.json(txn);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.cancelStudentTransaction = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student")
      return deny(res, "Students only.");
    const txn = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        studentId: req.session.user.id,
        status: { $in: ["pending", "paid"] },
      },
      { status: "cancelled", payoutStatus: "on-hold" },
      { new: true },
    );
    if (!txn)
      return res
        .status(404)
        .json({ message: "Transaction not found or cannot be cancelled." });
    return res.json({ message: "Transaction cancelled.", transaction: txn });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getStudentPaymentSummary = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student")
      return deny(res, "Students only.");
    const studentId = req.session.user.id;
    const studentObjectId = toObjectId(studentId);
    if (!studentObjectId) {
      return res.status(400).json({ message: "Invalid student id." });
    }
    const [summary] = await Transaction.aggregate([
      { $match: { studentId: studentObjectId } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalSpent: { $sum: "$amount" },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          refundCount: {
            $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
          },
        },
      },
    ]);
    return res.json(
      summary || {
        studentId,
        totalTransactions: 0,
        totalSpent: 0,
        paidCount: 0,
        refundCount: 0,
      },
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeacherTransactions = async (req, res) => {
  try {
    if (req.session?.user?.role !== "teacher")
      return deny(res, "Teachers only.");
    const txns = await Transaction.find({ teacherId: req.session.user.id })
      .populate("courseId", "title subject")
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });
    return res.json(txns);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeacherTransactionById = async (req, res) => {
  try {
    if (req.session?.user?.role !== "teacher")
      return deny(res, "Teachers only.");
    const txn = await Transaction.findOne({
      _id: req.params.id,
      teacherId: req.session.user.id,
    })
      .populate("courseId", "title subject")
      .populate("studentId", "name email");
    if (!txn)
      return res.status(404).json({ message: "Transaction not found." });
    return res.json(txn);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTeacherTransactionStatus = async (req, res) => {
  try {
    if (req.session?.user?.role !== "teacher")
      return deny(res, "Teachers only.");
    const { payoutStatus, notes } = req.body;
    const update = {};
    if (payoutStatus) update.payoutStatus = payoutStatus;
    if (notes !== undefined) update.notes = notes;
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.session.user.id },
      update,
      { new: true },
    );
    if (!txn)
      return res.status(404).json({ message: "Transaction not found." });
    return res.json(txn);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeacherPaymentSummary = async (req, res) => {
  try {
    if (req.session?.user?.role !== "teacher")
      return deny(res, "Teachers only.");
    const teacherObjectId = toObjectId(req.session.user.id);
    if (!teacherObjectId) {
      return res.status(400).json({ message: "Invalid teacher id." });
    }
    const [summary] = await Transaction.aggregate([
      { $match: { teacherId: teacherObjectId } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          grossRevenue: { $sum: "$amount" },
          releasedPayouts: {
            $sum: {
              $cond: [{ $eq: ["$payoutStatus", "released"] }, "$amount", 0],
            },
          },
          pendingPayouts: {
            $sum: {
              $cond: [{ $eq: ["$payoutStatus", "pending"] }, "$amount", 0],
            },
          },
        },
      },
    ]);
    return res.json(
      summary || {
        totalTransactions: 0,
        grossRevenue: 0,
        releasedPayouts: 0,
        pendingPayouts: 0,
      },
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllTransactionsAdmin = async (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") return deny(res, "Admins only.");
    const txns = await Transaction.find({})
      .populate("courseId", "title")
      .populate("studentId", "name email")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });
    return res.json(txns);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTransactionByIdAdmin = async (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") return deny(res, "Admins only.");
    const txn = await Transaction.findById(req.params.id)
      .populate("courseId", "title")
      .populate("studentId", "name email")
      .populate("teacherId", "name email");
    if (!txn)
      return res.status(404).json({ message: "Transaction not found." });
    return res.json(txn);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTransactionAdmin = async (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") return deny(res, "Admins only.");
    const allowed = ["status", "payoutStatus", "notes", "paymentMethod"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const txn = await Transaction.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!txn)
      return res.status(404).json({ message: "Transaction not found." });
    return res.json(txn);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteTransactionAdmin = async (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") return deny(res, "Admins only.");
    const txn = await Transaction.findByIdAndDelete(req.params.id);
    if (!txn)
      return res.status(404).json({ message: "Transaction not found." });
    return res.json({ message: "Transaction deleted." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
