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
  findByEmail: async (email) => {
    return await Student.findOne({ email });
  },

  findActiveByEmail: async (email) => {
    return await Student.findOne({ email, is_deleted: 0 });
  },

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

  findById: async (id) => {
    return await Student.findById(id);
  },

  updateField: async (id, field, value) => {
    const allowedFields = ["name", "email", "contact", "address"];
    if (!allowedFields.includes(field)) {
      throw new Error("Invalid field");
    }
    try {
      const result = await Student.updateOne(
        { _id: id },
        { [field]: value }
      ).exec();
      return result; // Return the full result
    } catch (error) {
      throw new Error("Error updating field: " + error.message); // Wrap the error
    }
  },

  softDelete: async (id) => {
    await Student.updateOne({ _id: id }, { is_deleted: 1 });
  },

  restoreAccount: async (email) => {
    await Student.updateOne({ email: email }, { is_deleted: 0 });
  },

  isEnrolled: async (studentId, courseId) => {
    const enrollment = await Enrollment.findOne({
      student_id: studentId,
      course_id: courseId,
    });
    return !!enrollment;
  },

  enroll: async (studentId, courseId) => {
    try {
      const enrollment = new Enrollment({
        student_id: studentId,
        course_id: courseId,
      });
      await enrollment.save();

      // Increment the CourseStat enrolled_count for the course (upsert if necessary)
      await CourseStat.findOneAndUpdate(
        { course_id: courseId },
        { $inc: { enrolled_count: 1 } },
        { new: true, upsert: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error code
        throw new Error("Student is already enrolled in this course.");
      }
      throw error;
    }
  },

  getStudentCourseProgress: async (studentId) => {
    return await Enrollment.aggregate([
      { $match: { student_id: studentId } },
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
          let: { studentId: studentId, courseId: "$course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$student_id", "$$studentId"] },
                    { $in: ["$module_id", "$modules._id"] },
                    { $eq: ["$is_completed", 1] },
                  ],
                },
              },
            },
          ],
          as: "completedModules",
        },
      },
      {
        $project: {
          course_id: "$courseInfo._id",
          title: "$courseInfo.title",
          total_modules: { $size: "$modules" },
          completed_modules: { $size: "$completedModules" },
          _id: 0,
        },
      },
    ]);
  },

  getCompletedModules: async (studentId, courseId) => {
    // Validate courseId before using it in queries
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      // Return empty list if invalid courseId to avoid CastError
      return [];
    }

    const moduleIds = await Module.find({ course_id: courseId }).distinct(
      "_id"
    );
    const completedModules = await StudentModule.find({
      student_id: studentId,
      module_id: { $in: moduleIds },
      is_completed: 1,
    }).select("module_id -_id");
    return completedModules.map((m) => m.module_id);
  },

  getStudentById: async (id) => {
    return await Student.findById(id).select("_id name email contact address");
  },

  markModuleAsComplete: async (studentId, moduleId) => {
    await StudentModule.updateOne(
      { student_id: studentId, module_id: moduleId },
      { is_completed: 1 },
      { upsert: true } // Creates a new document if it doesn't exist
    );
    return { changes: 1 }; //  Consistent return
  },
};

module.exports = StudentModel;
