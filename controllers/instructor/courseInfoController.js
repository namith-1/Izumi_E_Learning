// controllers/instructorCourseController.js
const { Course, CourseStat, Enrollment } = require('../../required/db.js');
const mongoose = require('mongoose');

exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.session.instructor; // current instructor ID

    if (!instructorId) {
      return res.status(401).json({ message: "Unauthorized: No instructor session" });
    }

    // Aggregate course data with stats
    const courses = await Course.aggregate([
      { $match: { instructor_id: new mongoose.Types.ObjectId(instructorId) } },
      {
        $lookup: {
          from: 'coursestats',
          localField: '_id',
          foreignField: 'course_id',
          as: 'stats'
        }
      },
      { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course_id',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          enrolled_count: { $size: "$enrollments" },
          revenue: { $multiply: [{ $size: "$enrollments" }, "$stats.price"] },
          avg_rating: "$stats.avg_rating",
          review_count: "$stats.review_count"
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          subject: 1,
          enrolled_count: 1,
          revenue: 1,
          avg_rating: 1,
          review_count: 1
        }
      }
    ]);

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📈 Get enrollment trend for selected course
exports.getCourseStatsOverTime = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { range = "7d" } = req.query; // e.g. 7d, 30d, 1y

    const now = new Date();
    let startDate = new Date();
    if (range.endsWith('d')) startDate.setDate(now.getDate() - parseInt(range));
    else if (range.endsWith('m')) startDate.setMonth(now.getMonth() - parseInt(range));
    else if (range.endsWith('y')) startDate.setFullYear(now.getFullYear() - parseInt(range));

    const data = await Enrollment.aggregate([
      { $match: { course_id: new mongoose.Types.ObjectId(courseId), date_enrolled: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date_enrolled" } },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching trend", error });
  }
};
