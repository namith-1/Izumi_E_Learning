const path = require("path");
const CourseModel = require("../models/courseModel"); // helper model
const { Course, Instructor } = require("../required/db.js");

exports.viewCourse = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "view_course.html"));
};

// Render the server-side course page with enriched courseData
exports.getCourseDetails = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // Attempt to load lightweight aggregated info first
    let courseInfo = await CourseModel.getCourseInfo(courseId);

    // If aggregation didn't find the course, try to load the raw Course doc
    if (!courseInfo) {
      const rawCourse = await Course.findById(courseId).lean().exec();
      if (!rawCourse) return res.status(404).send("Course not found");
      courseInfo = {
        id: rawCourse._id,
        title: rawCourse.title,
        enrolled_count: 0,
        avg_rating: 0,
        review_count: 0,
        raw: rawCourse,
      };
    }

    // Load instructor info if available
    let instructor = {
      name: "TBA",
      title: "",
      bio: "",
      avatarUrl: "/images/default-avatar.png",
    };
    try {
      if (courseInfo.raw && courseInfo.raw.instructor_id) {
        const inst = await Instructor.findById(courseInfo.raw.instructor_id)
          .lean()
          .exec();
        if (inst) {
          instructor = {
            name: inst.name || "TBA",
            title: inst.title || "",
            bio: inst.bio || "",
            avatarUrl: inst.avatarUrl || "/images/default-avatar.png",
          };
        }
      }
    } catch (e) {
      // non-fatal - leave instructor as fallback
      console.warn("Could not load instructor details:", e.message || e);
    }

    // Compose courseData with fields used by the template
    const details =
      courseInfo.raw && courseInfo.raw.details ? courseInfo.raw.details : {};
    const courseData = {
      id: String(courseInfo.id || courseInfo._id),
      title: courseInfo.title || "Untitled Course",
      overview: details.overview || courseInfo.overview || "",
      whatYouWillLearn: Array.isArray(details.whatYouWillLearn)
        ? details.whatYouWillLearn
        : Array.isArray(courseInfo.whatYouWillLearn)
        ? courseInfo.whatYouWillLearn
        : [],
      tagline: details.tagline || courseInfo.tagline || "",
      enrollmentCount: Number(courseInfo.enrolled_count || 0),
      rating: Number(courseInfo.avg_rating || 0),
      reviewsCount: Number(courseInfo.review_count || 0),
      avgCompletionTime: courseInfo.avg_completion_time || null,
      instructor,
      details,
      raw: courseInfo.raw || {},
    };

    // Nav links may be used by client-side; keep compatibility
    const navLinks = [
      { href: "overview", text: "Overview" },
      { href: "curriculum", text: "Curriculum" },
      { href: "reviews", text: "Reviews" },
      { href: "faq", text: "FAQ" },
    ];

    res.render("course.ejs", {
      course: courseInfo,
      courseData,
      navLinks,
      courseId: String(courseData.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Database error: " + error.message);
  }
};

exports.editCourse = (req, res) => {
  // if (!req.session.instructor) return res.status(403).send("Unauthorized.");
  res.sendFile(path.join(__dirname, "../views/public", "course.html"));
};

exports.listCourses = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "course_search.html"));
};

exports.moduleCompletePage = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "module_complete.html"));
};
