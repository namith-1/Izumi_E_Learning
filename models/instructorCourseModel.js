const mongoose = require("mongoose");
const { Course, Module, Instructor, CourseStat } = require("../required/db"); // Import Mongoose models

const CourseModel = {
  getCourseById: async (courseId) => {
    try {
      const course = await Course.findById(courseId).lean().exec();
      if (!course) {
        throw new Error("Course not found");
      }
      return course;
    } catch (error) {
      throw error;
    }
  },

  getModulesByCourseId: async (courseId) => {
    try {
      return await Module.find({ course_id: courseId }).lean().exec();
    } catch (error) {
      throw error;
    }
  },

  getAllCourses: async () => {
    try {
      return await Course.find({}, "_id title instructor_id subject")
        .sort({ subject: 1, title: 1 })
        .lean()
        .exec();
    } catch (error) {
      throw error;
    }
  },

  getInstructorCourses: async (instructorId) => {
    try {
      return await Course.find({ instructor_id: instructorId }, "_id title")
        .lean()
        .exec();
    } catch (error) {
      throw error;
    }
  },

  insertCourse: async (
    title,
    instructorId,
    overview,
    tagline,
    subject,
    whatYouWillLearn,
    thumbnail
  ) => {
    try {
      const course = new Course({
        title,
        instructor_id: instructorId,
        overview,
        tagline,
        subject,
        whatYouWillLearn: whatYouWillLearn || [],
        thumbnail: thumbnail || ""
      });
      const savedCourse = await course.save();
      return savedCourse._id;
    } catch (error) {
      throw error;
    }
  },

  updateCourseTitle: async (courseId, title) => {
    try {
      await Course.findByIdAndUpdate(courseId, { title }).exec();
    } catch (error) {
      throw error;
    }
  },

  updateCourseDetails: async (courseId, updateData) => {
    try {
      await Course.findByIdAndUpdate(courseId, updateData).exec();
    } catch (error) {
      throw error;
    }
  },

  deleteModulesByCourse: async (courseId) => {
    try {
      await Module.deleteMany({ course_id: courseId }).exec();
    } catch (error) {
      throw error;
    }
  },

  insertModule: async (courseId, parentId, title, text, url, type, quizData) => {
    try {
      const module = new Module({
        course_id: courseId,
        parent_id: parentId || null,
        title,
        text: text || "",
        url: url || "",
        type: type || "lesson",
        quizData: quizData || null
      });
      const savedModule = await module.save();
      // console.log(`[DB] Inserted module ${savedModule._id} (Parent: ${parentId})`);
      return savedModule._id;
    } catch (error) {
      throw error;
    }
  },

  updateCoursePrice: async (courseId, price) => {
    try {
      await CourseStat.findOneAndUpdate(
        { course_id: courseId },
        { price: price },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      throw error;
    }
  },

  findCourseByIdAndInstructor: async (courseId, instructorId) => {
    try {
      // Check if courseId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error("Invalid Course ID");
      }
      const course = await Course.findOne(
        { _id: courseId, instructor_id: instructorId },
        "id"
      )
        .lean()
        .exec();
      return course;
    } catch (error) {
      throw error;
    }
  },

  getCoursesWithStats: async (instructorId) => {
    try {
      return Course.aggregate([
        {
          $match: { instructor_id: new mongoose.Types.ObjectId(instructorId) },
        },
        {
          $lookup: {
            from: "instructors",
            localField: "instructor_id",
            foreignField: "_id",
            as: "instructor",
          },
        },
        { $unwind: "$instructor" },
        {
          $lookup: {
            from: "coursestats",
            localField: "_id",
            foreignField: "course_id",
            as: "stats",
          },
        },
        {
          $project: {
            course_id: "$_id",
            course_title: "$title",
            instructor_name: "$instructor.name",
            enrolled_count: {
              $ifNull: [{ $arrayElemAt: ["$stats.enrolled_count", 0] }, 0],
            },
            price: {
              $ifNull: [{ $arrayElemAt: ["$stats.price", 0] }, 0],
            },
            revenue: {
              $multiply: [
                {
                  $ifNull: [{ $arrayElemAt: ["$stats.enrolled_count", 0] }, 0],
                },
                {
                  $ifNull: [{ $arrayElemAt: ["$stats.price", 0] }, 0],
                },
              ],
            },
          },
        },
      ]).exec();
    } catch (error) {
      throw error;
    }
  },
};

module.exports = CourseModel;
