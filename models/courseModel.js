const mongoose = require("mongoose");
const { Course, CourseStat, Enrollment } = require("../required/db.js"); // Import Mongoose models

/**
 * Course Model with Mongoose and Promises
 */
const CourseModel = {
  getCourseInfo: async (courseId) => {
    try {
      const course = await Course.findById(courseId).lean().exec();

      if (!course) {
        return null;
      }

      const stats = await CourseStat.findOne({ course_id: courseId })
        .lean()
        .exec();

      const result = {
        id: course._id,
        title: course.title,
        enrolled_count: stats?.enrolled_count || 0,
        avg_rating: stats?.avg_rating || 0,
        avg_completion_time: stats?.avg_completion_time || 0,
        review_count: stats?.review_count || 0,
      };
      return result;
    } catch (err) {
      throw err;
    }
  },

  getCourseInfoPromise: async (courseId) => {
    try {
      const results = await Course.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(courseId) },
        },
        {
          $lookup: {
            from: "coursestats",
            localField: "_id",
            foreignField: "course_id",
            as: "stats",
          },
        },
        {
          $unwind: {
            path: "$stats",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            title: 1,
            enrolled_count: { $ifNull: ["$stats.enrolled_count", 0] },
            avg_rating: { $ifNull: ["$stats.avg_rating", 0] },
            avg_completion_time: { $ifNull: ["$stats.avg_completion_time", 0] },
            review_count: { $ifNull: ["$stats.review_count", 0] },
          },
        },
      ]).exec();

      return results.length > 0 ? results[0] : null;
    } catch (err) {
      throw err;
    }
  },

  getCoursesWithStatsPromise: async (filters = {}) => {
    try {
      return await Course.aggregate([
        { $match: filters },
        {
          $lookup: {
            from: "coursestats",
            localField: "_id",
            foreignField: "course_id",
            as: "stats",
          },
        },
        {
          $unwind: {
            path: "$stats",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            title: 1,
            subject: 1,
            instructor_id: 1,
            enrolled_count: { $ifNull: ["$stats.enrolled_count", 0] },
            avg_rating: { $ifNull: ["$stats.avg_rating", 0] },
            avg_completion_time: { $ifNull: ["$stats.avg_completion_time", 0] },
            review_count: { $ifNull: ["$stats.review_count", 0] },
            price: { $ifNull: ["$stats.price", 0] },
          },
        },
      ]).exec();
    } catch (err) {
      throw err;
    }
  },

  updateCourseStats: async (courseId, statsUpdate) => {
    try {
      return await CourseStat.findOneAndUpdate(
        { course_id: courseId },
        { $set: statsUpdate },
        { upsert: true, new: true }
      ).exec();
    } catch (err) {
      throw err;
    }
  },

  updateCourseEnrollment: async (studentId, courseId) => {
    try {
      // Step 1: Check if the student is already enrolled in the course
      const existingEnrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId,
      });

      // Step 2: If already enrolled, just return the existing record
      if (existingEnrollment) {
        return {
          message: "Student is already enrolled in this course",
          enrollment: existingEnrollment,
        };
      }

      // Step 3: (Optional) Update CourseStat model
      // If there is no existing enrollment, create one and increment enrolled_count
      let updatedEnrollment = existingEnrollment;
      if (!existingEnrollment) {
        updatedEnrollment = new Enrollment({
          student_id: studentId,
          course_id: courseId,
        });
        await updatedEnrollment.save();

        await CourseStat.findOneAndUpdate(
          { course_id: courseId },
          { $inc: { enrolled_count: 1 } },
          { new: true, upsert: true }
        );
      }

      return {
        message: "Enrollment updated successfully",
        enrollment: updatedEnrollment,
      };
    } catch (err) {
      console.error("Error updating enrollment:", err);
      throw err;
    }
  },

  searchCourses: async (
    query = {},
    options = { page: 1, limit: 10, sort: { title: 1 } }
  ) => {
    try {
      const skip = (options.page - 11) * options.limit;

      const filter = {};
      if (query.title) filter.title = { $regex: query.title, $options: "i" };
      if (query.subject) filter.subject = query.subject;
      if (query.instructor_id) filter.instructor_id = query.instructor_id;

      const total = await Course.countDocuments(filter).exec();

      const courses = await Course.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "coursestats",
            localField: "_id",
            foreignField: "course_id",
            as: "stats",
          },
        },
        {
          $unwind: {
            path: "$stats",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "instructors",
            localField: "instructor_id",
            foreignField: "_id",
            as: "instructor",
          },
        },
        {
          $unwind: {
            path: "$instructor",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            title: 1,
            subject: 1,
            instructor_name: "$instructor.name",
            enrolled_count: { $ifNull: ["$stats.enrolled_count", 0] },
            avg_rating: { $ifNull: ["$stats.avg_rating", 0] },
            price: { $ifNull: ["$stats.price", 0] },
          },
        },
        { $sort: options.sort },
        { $skip: skip },
        { $limit: options.limit },
      ]).exec();

      return {
        courses,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(total / options.limit),
        },
      };
    } catch (err) {
      throw err;
    }
  },
};

module.exports = CourseModel;
