const mongoose = require("mongoose");

// ✅ TransactionsInstructor Schema
const transactionsInstructorSchema = new mongoose.Schema({
  t_id: { type: String, required: true },
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  amount: { type: Number, default: 0 },
}, { timestamps: true });


const instituteMailSchema = new mongoose.Schema({
  i_id: { type: String},
  email_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  status: { type: Number, default: 1 }, // 1 = active, 0 = inactive
}, { timestamps: true });



// ✅ CourseStatus Schema
const courseStatusSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course", unique: true },
  Disabled: { type: Number, default: 0 },
  Deleted: { type: Number, default: 0 },
}, { timestamps: true });

// ✅ Export Models
const TransactionsInstructor = mongoose.model("TransactionsInstructor", transactionsInstructorSchema);
const InstituteMail = mongoose.model("InstituteMail", instituteMailSchema);
const CourseStatus = mongoose.model("CourseStatus", courseStatusSchema);

module.exports = { TransactionsInstructor, InstituteMail, CourseStatus };
