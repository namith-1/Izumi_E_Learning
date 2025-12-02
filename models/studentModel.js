const {
  Student,
  Enrollment,
  Module,
  StudentModule,
  Course,
  CourseStat,
} = require("../required/db.js"); // Import the Mongoose models
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const StudentModel = {
  // ────────────────────────────────
  // 🔍 Basic Finders
  // ────────────────────────────────

  findByEmail: async (email) => {
    return await Student.findOne({ email });
  },

  findActiveByEmail: async (email) => {
    return await Student.findOne({ email, is_deleted: 0 });
  },

  findById: async (id) => {
    return await Student.findById(id);
  },

  getStudentById: async (id) => {
    return await Student.findById(id).select("_id name email contact address");
  },

  // ────────────────────────────────
  // 🧾 Account Operations
  // ────────────────────────────────

  create: async (name, email, contact, address, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({
      name,
      email,
      contact,
      address,
      hashed_password: hashedPassword,
    });
    return await student.save();
  },

  updateField: async (id, field, value) => {
    const allowedFields = ["name", "email", "contact", "address"];
    if (!allowedFields.includes(field)) {
      throw new Error("Invalid field");
    }

    try {
      const result = await Student.updateOne({ _id: id }, { [field]: value });
      return result;
    } catch (error) {
      throw new Error("Error updating field: " + error.message);
    }
  },

  softDelete: async (id) => {
    await Student.updateOne({ _id: id }, { is_deleted: 1 });
  },

  restoreAccount: async (email) => {
    await Student.updateOne({ email }, { is_deleted: 0 });
  },

  reactivate: async (name, email, contact, address, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await Student.findOneAndUpdate(
      { email },
      {
        name,
        contact,
        address,
        hashed_password: hashedPassword,
        is_deleted: 0
      },
      { new: true }
    );
  },

  // ────────────────────────────────
  // 🎓 Enrollment Logic
  // ────────────────────────────────

  isEnrolled: async (studentId, courseId) => {
    if (!mongoose.Types.ObjectId.isValid(courseId)) return false;
    const enrollment = await Enrollment.findOne({
      student_id: studentId,
      course_id: courseId,
    });
    return !!enrollment;
  },

  // ────────────────────────────────
  // 📈 Progress & Quiz Logic (From v1)
  // ────────────────────────────────

  updateProgress: async (studentId, courseId, moduleId, timeSpent, completed, quizScore) => {
    try {
        const enrollment = await Enrollment.findOne({
            course_id: courseId, 
            student_id: studentId
        });

        if (!enrollment) throw new Error('Enrollment not found');

        // Check if module exists in progress array
        const moduleIndex = enrollment.modules_status.findIndex(m => m.moduleId === moduleId.toString());

        if (moduleIndex > -1) {
            // Update existing
            if (timeSpent !== undefined) enrollment.modules_status[moduleIndex].timeSpent = timeSpent;
            if (completed !== undefined) enrollment.modules_status[moduleIndex].completed = completed;
            
            // Update quizScore ONLY if explicitly provided
            if (quizScore !== undefined && quizScore !== null) {
                 enrollment.modules_status[moduleIndex].quizScore = quizScore;
            }
        } else {
            // Add new
            enrollment.modules_status.push({ moduleId, timeSpent, completed, quizScore });
        }
        
        return await enrollment.save();
    } catch (error) {
        throw error;
    }
  },

  enroll: async (studentId, courseId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error("Invalid Course ID.");
      }

      const enrollment = new Enrollment({
        student_id: studentId,
        course_id: courseId,
      });
      await enrollment.save();

      // Increment enrolled_count
      await CourseStat.findOneAndUpdate(
        { course_id: courseId },
        { $inc: { enrolled_count: 1 } },
        { new: true, upsert: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Student is already enrolled in this course.");
      }
      throw error;
    }
  },

  // ────────────────────────────────
  // 📊 Course Progress Tracking
  // ────────────────────────────────

  /**
   * Get all courses with progress for a student
   */
  getStudentCourseProgress: async (studentId) => {
    if (!mongoose.Types.ObjectId.isValid(studentId)) return [];

    const studentObjId = new mongoose.Types.ObjectId(studentId);

    return await Enrollment.aggregate([
      { $match: { student_id: studentObjId } },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      {
        $lookup: {
          from: "modules",
          localField: "course_id",
          foreignField: "course_id",
          as: "modules",
        },
      },
      {
        $lookup: {
          from: "studentmodules",
          localField: "student_id",
          foreignField: "student_id",
          as: "studentModules",
        },
      },
      {
        $project: {
          course_id: "$courseInfo._id",
          title: "$courseInfo.title",
          total_modules: { $size: "$modules" },
          completed_modules: {
            $size: {
              $filter: {
                input: "$studentModules",
                as: "sm",
                cond: {
                  $and: [
                    { $eq: ["$$sm.is_completed", 1] },
                    { $in: ["$$sm.module_id", "$modules._id"] },
                  ],
                },
              },
            },
          },
          _id: 0,
        },
      },
    ]);
  },

  /**
   * Get completed modules for a specific course
   */
  getCompletedModules: async (studentId, courseId) => {
    if (!mongoose.Types.ObjectId.isValid(courseId)) return [];

    const studentObjId = new mongoose.Types.ObjectId(studentId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    const moduleIds = await Module.find({ course_id: courseObjId }).distinct(
      "_id"
    );

    const completedModules = await StudentModule.find({
      student_id: studentObjId,
      module_id: { $in: moduleIds },
      is_completed: 1,
    }).select("module_id -_id");

    return completedModules.map((m) => m.module_id);
  },

  /**
   * Mark a specific module as complete for a student
   */
  markModuleAsComplete: async (studentId, moduleId) => {
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new Error("Invalid Module ID");
    }

    const studentObjId = new mongoose.Types.ObjectId(studentId);
    const moduleObjId = new mongoose.Types.ObjectId(moduleId);

    await StudentModule.updateOne(
      { student_id: studentObjId, module_id: moduleObjId },
      { is_completed: 1 },
      { upsert: true }
    );

    return { changes: 1 };
  },
};

module.exports = StudentModel;
