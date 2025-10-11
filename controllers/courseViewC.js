const path = require("path");
const Course = require("../models/courseModel"); // Use the Mongoose model

exports.viewCourse = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public", "view_course.html"));
};

exports.getCourseDetails = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const course = await Course.getCourseInfo(courseId);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    const navLinks = [
      { href: "overview", text: "Overview" },
      { href: "curriculum", text: "Curriculum" },
      { href: "reviews", text: "Reviews" },
      { href: "faq", text: "FAQ" },
    ];

    const sections = [
      { id: "overview", title: "Course Overview", content: "nothing" },
      {
        id: "curriculum",
        title: "Curriculum",
        content: "Detailed course modules will be listed here.",
      },
      {
        id: "reviews",
        title: "Student Reviews",
        content: `${course.review_count || 0} reviews available.`,
      },
      {
        id: "faq",
        title: "Frequently Asked Questions",
        content: "Common queries about this course.",
      },
    ];

    // Ensure a simple string courseId is passed to the view so client-side JS can use it
    res.render("course.ejs", {
      course,
      navLinks,
      sections,
      courseId: String(course.id),
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
