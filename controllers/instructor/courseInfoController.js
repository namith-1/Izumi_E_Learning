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
    const { range = "7d" } = req.query;

    // --- 1. Calculate the date range ---
    const now = new Date();
    // Set to the end of the current day to include all of today's enrollments
    now.setHours(23, 59, 59, 999); 
    
    let startDate = new Date(now);
    const daysToSubtract = parseInt(range); // Works for '7d', '30d', etc.
    if (range.endsWith('y')) {
      // For '1y', we'll use 365 days for simplicity
      startDate.setDate(now.getDate() - 365);
    } else {
      startDate.setDate(now.getDate() - (daysToSubtract - 1)); // -1 to make it inclusive
    }
    // Set to the start of the day
    startDate.setHours(0, 0, 0, 0);


    // --- 2. Fetch data from the database ---
    const enrollmentsFromDB = await Enrollment.aggregate([
      { 
        $match: { 
          course_id: new mongoose.Types.ObjectId(courseId), 
          date_enrolled: { $gte: startDate, $lte: now } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date_enrolled" } },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // --- 3. Create a complete, gap-filled dataset ---
    // Create a map for quick lookups of enrollment data
    const enrollmentMap = new Map(enrollmentsFromDB.map(item => [item._id, item.enrollments]));

    const fullDataRange = [];
    // Loop from the start date to today
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0]; // Format as "YYYY-MM-DD"
        fullDataRange.push({
            _id: dateString,
            enrollments: enrollmentMap.get(dateString) || 0 // Use DB value or 0 if no enrollments
        });
    }

    res.json(fullDataRange);

  } catch (error) {
    console.error("Error in getCourseStatsOverTime:", error);
    res.status(500).json({ message: "Error fetching course statistics", error: error.message });
  }
};
