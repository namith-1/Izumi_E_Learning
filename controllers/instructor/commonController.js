const { TransactionsInstructor, InstituteMail, CourseStatus } = require("../../models/instructor/commonModel.js");

// =======================
// Transactions Instructor
// =======================
exports.createTransaction = async (req, res) => {
  try {
    const transaction = await TransactionsInstructor.create(req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const data = await TransactionsInstructor.find().populate("instructor_id");
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================
// Institute Mail
// =======================
exports.createInstituteMail = async (req, res) => {
  try {
    const mail = await InstituteMail.create(req.body);
    res.status(201).json({ success: true, data: mail });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getInstituteMails = async (req, res) => {
  try {
    const data = await InstituteMail.find().populate("i_id");
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================
// Course Status
// =======================
exports.createCourseStatus = async (req, res) => {
  try {
    const courseStatus = await CourseStatus.create(req.body);
    res.status(201).json({ success: true, data: courseStatus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCourseStatuses = async (req, res) => {
  try {
    const data = await CourseStatus.find().populate("course_id");
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
