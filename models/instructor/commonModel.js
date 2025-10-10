const mongoose = require("mongoose");

// ✅ TransactionsInstructor Schema
const transactionsInstructorSchema = new mongoose.Schema({
  t_id: { type: String, required: true },
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  amount: { type: Number, default: 0 },
}, { timestamps: true });

// ✅ InstituteMail Schema
const instituteMailSchema = new mongoose.Schema({
  i_id: { type: String },
  email_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  status: { type: Number, default: 1 }, // 1 = active, 0 = inactive
}, { timestamps: true });

// ✅ InstructorMail Schema
const instructorMailSchema = new mongoose.Schema({
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
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
const InstructorMail = mongoose.model("InstructorMail", instructorMailSchema);
const CourseStatus = mongoose.model("CourseStatus", courseStatusSchema);

module.exports = { TransactionsInstructor, InstituteMail, InstructorMail, CourseStatus };

// add the instructor mail schema and model here
// add the course status schema and model here
// add the transactions instructor schema and model here
// export all the models here
// module.exports = { TransactionsInstructor, InstituteMail, CourseStatus };

// Note: Ensure that the 'Instructor' and 'Course' models are defined elsewhere in your codebase, as they are referenced here.

