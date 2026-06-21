const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const PayoutBatch = require("../models/PayoutBatch");
const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const Enrollment = require("../models/Enrollment");
const EnrollmentAnalytics = require("../models/EnrollmentAnalytics");
const cacheService = require("../services/cacheService");
const razorpayService = require("../services/razorpayService");

const REF_PREFIX = "TXN";
const buildReference = () =>
  `${REF_PREFIX}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
const buildPayoutReference = () =>
  `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const money = (value) => parseFloat(Number(value || 0).toFixed(2));

const getPayoutDueAt = (fromDate = new Date()) => {
  const delayDays = Number(process.env.INSTRUCTOR_PAYOUT_DELAY_DAYS ?? 7);
  const due = new Date(fromDate);
  due.setDate(due.getDate() + delayDays);
  return due;
};

const toObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const deny = (res, message = "Access denied") =>
  res.status(403).json({ message });

const calculateRevenueSplit = (course) => {
  const totalAmount = money(course.price || 0);
  const sharePercent = course.instructorShare ?? 30;
  const instructorAmount = money((totalAmount * sharePercent) / 100);
  const platformAmount = money(totalAmount - instructorAmount);
  return { totalAmount, instructorAmount, platformAmount };
};

const createEnrollmentForPaidTransaction = async (transaction) => {
  const existingEnrollment = await Enrollment.findOne({
    courseId: transaction.courseId,
    studentId: transaction.studentId,
  });
  if (existingEnrollment) return existingEnrollment;

  const enrollment = await Enrollment.create({
    courseId: transaction.courseId,
    studentId: transaction.studentId,
  });

  await cacheService.del(`student:enrollments:${transaction.studentId}`);
  await EnrollmentAnalytics.create({
    courseId: transaction.courseId,
    studentId: transaction.studentId,
    price: transaction.amount || 0,
  });

  return enrollment;
};

exports.checkoutStudentPayment = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student") {
      return deny(res, "Students only.");
    }

    const {
      courseId,
      paymentMethod = "card",
      currency = "INR",
      notes = "",
    } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required." });

    const course = await Course.findById(courseId).select(
      "_id teacherId price instructorShare",
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

    // ── Revenue split calculation ────────────────────────────────────────
    const { totalAmount, instructorAmount, platformAmount } =
      calculateRevenueSplit(course);

    const transaction = await Transaction.create({
      reference: buildReference(),
      courseId: course._id,
      studentId,
      teacherId: course.teacherId,
      amount: totalAmount,
      instructorAmount,
      platformAmount,
      currency,
      paymentMethod,
      status: "paid",
      payoutStatus: "pending",
      payoutDueAt: getPayoutDueAt(),
      notes,
    });

    const enrollment = await createEnrollmentForPaidTransaction(transaction);

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

exports.createRazorpayOrder = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student") {
      return deny(res, "Students only.");
    }

    const { courseId, notes = "" } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required." });

    const course = await Course.findById(courseId).select(
      "_id title teacherId price instructorShare",
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

    const { totalAmount, instructorAmount, platformAmount } =
      calculateRevenueSplit(course);
    const currency = (req.body.currency || "INR").toUpperCase();

    if (totalAmount <= 0) {
      const transaction = await Transaction.create({
        reference: buildReference(),
        courseId: course._id,
        studentId,
        teacherId: course.teacherId,
        amount: 0,
        instructorAmount: 0,
        platformAmount: 0,
        currency,
        gateway: "manual",
        paymentMethod: "other",
        status: "paid",
        payoutStatus: "released",
        payoutDueAt: new Date(),
        payoutReleasedAt: new Date(),
        notes: notes || "Free course enrollment.",
      });
      const enrollment = await createEnrollmentForPaidTransaction(transaction);
      return res.status(201).json({ transaction, enrollment, free: true });
    }

    const reference = buildReference();
    const order = await razorpayService.createOrder({
      amount: totalAmount,
      currency,
      receipt: reference,
      notes: {
        courseId: String(course._id),
        studentId: String(studentId),
        teacherId: String(course.teacherId),
      },
    });

    const transaction = await Transaction.create({
      reference,
      courseId: course._id,
      studentId,
      teacherId: course.teacherId,
      amount: totalAmount,
      instructorAmount,
      platformAmount,
      currency,
      gateway: "razorpay",
      gatewayOrderId: order.id,
      gatewayReceipt: order.receipt || reference,
      paymentMethod: "other",
      status: "pending",
      payoutStatus: "on-hold",
      payoutDueAt: getPayoutDueAt(),
      notes,
    });

    const { keyId } = razorpayService.getGatewayConfig();
    return res.status(201).json({
      keyId,
      order,
      transaction,
      amount: razorpayService.toSmallestCurrencyUnit(totalAmount),
      currency,
    });
  } catch (err) {
    if (err.code === "RAZORPAY_NOT_CONFIGURED") {
      return res.status(503).json({
        message:
          "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate transaction/enrollment request." });
    }
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    if (req.session?.user?.role !== "student") {
      return deny(res, "Students only.");
    }

    const {
      transactionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = "other",
    } = req.body;

    if (
      !transactionId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message:
          "transactionId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
      });
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      studentId: req.session.user.id,
      gatewayOrderId: razorpay_order_id,
      gateway: "razorpay",
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    if (transaction.status === "paid") {
      const enrollment = await createEnrollmentForPaidTransaction(transaction);
      return res.json({ transaction, enrollment });
    }

    const signatureIsValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!signatureIsValid) {
      transaction.status = "failed";
      transaction.notes =
        `${transaction.notes || ""} Invalid Razorpay signature.`.trim();
      await transaction.save();
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    transaction.status = "paid";
    transaction.payoutStatus = "pending";
    transaction.gatewayPaymentId = razorpay_payment_id;
    transaction.gatewaySignature = razorpay_signature;
    transaction.paymentMethod = paymentMethod;
    transaction.payoutDueAt = transaction.payoutDueAt || getPayoutDueAt();
    await transaction.save();

    const enrollment = await createEnrollmentForPaidTransaction(transaction);
    return res.json({ transaction, enrollment });
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
    let teacherId = req.session.user.id;
    if (req.session?.user?.role === "admin" && req.query.instructorId) {
      teacherId = req.query.instructorId;
    } else if (req.session?.user?.role !== "teacher" && req.session?.user?.role !== "admin") {
      return deny(res, "Teachers only.");
    }
    const txns = await Transaction.find({ teacherId })
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
    let teacherId = req.session.user.id;
    if (req.session?.user?.role === "admin" && req.query.instructorId) {
      teacherId = req.query.instructorId;
    } else if (req.session?.user?.role !== "teacher" && req.session?.user?.role !== "admin") {
      return deny(res, "Teachers only.");
    }
    const txn = await Transaction.findOne({
      _id: req.params.id,
      teacherId,
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
    let teacherId = req.session.user.id;
    if (req.session?.user?.role === "admin" && req.query.instructorId) {
      teacherId = req.query.instructorId;
    } else if (req.session?.user?.role !== "teacher" && req.session?.user?.role !== "admin") {
      return deny(res, "Teachers only.");
    }
    const { payoutStatus, notes } = req.body;
    const update = {};
    if (payoutStatus) update.payoutStatus = payoutStatus;
    if (notes !== undefined) update.notes = notes;
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, teacherId },
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
    let teacherId = req.session.user.id;
    if (req.session?.user?.role === "admin" && req.query.instructorId) {
      teacherId = req.query.instructorId;
    } else if (req.session?.user?.role !== "teacher" && req.session?.user?.role !== "admin") {
      return deny(res, "Teachers only.");
    }
    const teacherObjectId = toObjectId(teacherId);
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
          instructorRevenue: { $sum: { $ifNull: ["$instructorAmount", "$amount"] } },
          platformRevenue: { $sum: { $ifNull: ["$platformAmount", 0] } },
          releasedPayouts: {
            $sum: {
              $cond: [{ $eq: ["$payoutStatus", "released"] }, { $ifNull: ["$instructorAmount", "$amount"] }, 0],
            },
          },
          pendingPayouts: {
            $sum: {
              $cond: [{ $eq: ["$payoutStatus", "pending"] }, { $ifNull: ["$instructorAmount", "$amount"] }, 0],
            },
          },
          nextPayoutDue: { $min: "$payoutDueAt" },
        },
      },
    ]);
    return res.json(
      summary || {
        totalTransactions: 0,
        grossRevenue: 0,
        instructorRevenue: 0,
        platformRevenue: 0,
        releasedPayouts: 0,
        pendingPayouts: 0,
        nextPayoutDue: null,
      },
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getWeeklyPayoutPreviewAdmin = async (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") return deny(res, "Admins only.");

    const dueBefore = req.query.dueBefore
      ? new Date(req.query.dueBefore)
      : new Date();

    const preview = await Transaction.aggregate([
      {
        $match: {
          status: "paid",
          payoutStatus: "pending",
          payoutDueAt: { $lte: dueBefore },
        },
      },
      {
        $group: {
          _id: "$teacherId",
          transactionCount: { $sum: 1 },
          grossAmount: { $sum: "$amount" },
          instructorAmount: {
            $sum: { $ifNull: ["$instructorAmount", "$amount"] },
          },
          currency: { $first: "$currency" },
          nextDueAt: { $min: "$payoutDueAt" },
        },
      },
      {
        $lookup: {
          from: "teachers",
          localField: "_id",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } },
      { $sort: { instructorAmount: -1 } },
    ]);

    return res.json(
      preview.map((row) => ({
        teacherId: row._id,
        teacherName: row.teacher?.name || "Instructor",
        teacherEmail: row.teacher?.email || "",
        transactionCount: row.transactionCount,
        grossAmount: money(row.grossAmount),
        instructorAmount: money(row.instructorAmount),
        currency: row.currency || "INR",
        nextDueAt: row.nextDueAt,
      })),
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.releaseWeeklyPayoutsAdmin = async (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") return deny(res, "Admins only.");

    const dueBefore = req.body.dueBefore
      ? new Date(req.body.dueBefore)
      : new Date();
    const payoutMethod =
      req.body.payoutMethod === "razorpayx" ? "razorpayx" : "manual";
    const notes = req.body.notes || "Weekly instructor payout.";
    let createdBatches = [];

    const dueTransactions = await Transaction.find({
      status: "paid",
      payoutStatus: "pending",
      payoutDueAt: { $lte: dueBefore },
    });

    const grouped = dueTransactions.reduce((acc, txn) => {
      const key = String(txn.teacherId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(txn);
      return acc;
    }, {});

    for (const teacherTransactions of Object.values(grouped)) {
      const teacherId = teacherTransactions[0].teacherId;
      const transactionIds = teacherTransactions.map((txn) => txn._id);
      const grossAmount = money(
        teacherTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0),
      );
      const instructorAmount = money(
        teacherTransactions.reduce(
          (sum, txn) => sum + (txn.instructorAmount ?? txn.amount ?? 0),
          0,
        ),
      );
      const currency = teacherTransactions[0].currency || "INR";
      let razorpayPayoutId = "";
      let batchStatus = "released";

      if (payoutMethod === "razorpayx") {
        const teacher = await Teacher.findById(teacherId).select("payoutProfile");
        const payout = await razorpayService.createPayout({
          fundAccountId: teacher?.payoutProfile?.razorpayFundAccountId,
          amount: instructorAmount,
          currency,
          reference: buildPayoutReference(),
          notes: {
            teacherId: String(teacherId),
            transactionCount: String(transactionIds.length),
          },
        });
        razorpayPayoutId = payout.id || "";
        batchStatus = payout.status === "processed" ? "released" : "processing";
      }

      const batch = await PayoutBatch.create({
        reference: buildPayoutReference(),
        teacherId,
        transactionIds,
        grossAmount,
        instructorAmount,
        currency,
        status: batchStatus,
        payoutMethod,
        scheduledFor: dueBefore,
        releasedAt: batchStatus === "released" ? new Date() : null,
        razorpayPayoutId,
        notes,
      });

      await Transaction.updateMany(
        { _id: { $in: transactionIds }, payoutStatus: "pending" },
        {
          payoutStatus: batchStatus === "released" ? "released" : "on-hold",
          payoutReleasedAt: batchStatus === "released" ? new Date() : null,
          payoutBatchId: batch._id,
        },
      );

      createdBatches.push(batch);
    }

    createdBatches = await PayoutBatch.find({
      _id: { $in: createdBatches.map((batch) => batch._id) },
    })
      .populate("teacherId", "name email payoutProfile")
      .sort({ createdAt: -1 });

    return res.status(201).json({
      message: "Weekly payouts released.",
      batches: createdBatches,
    });
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
    const allowed = ["status", "payoutStatus", "notes", "paymentMethod", "payoutDueAt"];
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
