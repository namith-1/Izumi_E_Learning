const path = require("path");
const mongoose = require("mongoose");
// Assuming your models are correctly exported from db.js
const { Course, Instructor, CourseStat } = require("../required/db.js"); 
// Note: If you have a separate models folder, adjust the require path accordingly.

exports.viewCourse = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "view_course.html"));
};

/**
 * Renders the server-side course page with enriched courseData.
 * This function is updated to work with your existing database schema.
 */
exports.getCourseDetails = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // 1. Fetch the main course and its instructor in a single, efficient query using populate()
    const course = await Course.findById(courseId)
      .populate("instructor_id") // Joins the Instructor collection
      .lean() // Returns a plain JavaScript object for performance
      .exec();

    // Handle case where the course does not exist
    if (!course) {
      return res.status(404).send("Course not found");
    }

    // 2. Fetch the course statistics separately
    let stats = await CourseStat.findOne({ course_id: courseId }).lean().exec();

    // If no stats document exists for the course, create a fallback object
    if (!stats) {
      stats = {
        enrolled_count: 0,
        avg_rating: 0,
        review_count: 0,
        avg_completion_time: null, // or 0
      };
    }

    // 3. Prepare the instructor object with fallbacks, including a default title
    const instructor = course.instructor_id
      ? {
          name: course.instructor_id.name || "TBA",
          title: course.instructor_id.title || "Instructor", // Added default title
          bio: course.instructor_id.bio || "No biography available.",
          avatarUrl: course.instructor_id.avatarUrl || "/images/default-avatar.png",
        }
      : {
          name: "TBA",
          title: "Instructor",
          bio: "No biography available.",
          avatarUrl: "/images/default-avatar.png",
        };

    // 4. **Crucial Step**: Manually construct the `courseData` object to match the EJS template's structure.
    const courseData = {
      id: String(course._id),
      title: course.title || "Untitled Course",
      // These fields come directly from the top-level of your Course schema
      tagline: course.tagline || "",
      overview: course.overview || "",
      whatYouWillLearn: course.whatYouWillLearn || [],
      
      // These fields come from the CourseStat schema
      enrollmentCount: stats.enrolled_count || 0,
      
      // Pass the prepared instructor object
      instructor,
      
      // The template expects a 'details' object for the top grid, so we build it here
      details: {
        rating: stats.avg_rating || 0,
        reviewsCount: stats.review_count || 0,
        // The following fields are not in your schema, so we provide safe fallbacks
        level: "Not specified",
        duration: "Not specified",
        flexibility: "Not specified",
        completionTimeEstimate: "Not specified",
      },

      // The 'sampleReviews' field is not in your schema, so we provide an empty array
      sampleReviews: [], 
    };
    
    // 5. Render the page with the correctly structured data
    // console.lo
    
    res.render("course.ejs", {
      courseData, // The EJS template is designed to use this object
      courseId: String(courseData.id),
    });

  } catch (error) {
    console.error("Error fetching course details:", error);
    // Handle specific error for invalid ObjectId format
    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).send("Invalid Course ID format.");
    }
    return res.status(500).send("Database error: " + error.message);
  }
};

// --- Other exports remain unchanged ---

exports.editCourse = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "course.html"));
};

exports.listCourses = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "course_search.html"));
};

exports.moduleCompletePage = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "module_complete.html"));
};