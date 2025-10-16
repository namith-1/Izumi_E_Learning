const path = require("path");
const model = require("../models/instructorCourseModel"); // Import the Mongoose-based model
const mongoose = require("mongoose");
const { Instructor ,CourseStat, Course } = require("../required/db");
exports.getCourseDetails_moduleTree = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // Fetch the course
    const course = await model.getCourseById(courseId);
    // Fetch the modules for the course
    const modules = await model.getModulesByCourseId(courseId);
    // Helper function to build module hierarchy
    const buildHierarchy = (parentId = null) =>
      modules
        .filter((m) => {
          return parentId === null
            ? m.parent_id === null
            : m.parent_id?.toString() === parentId;
        })
        .map((m) => ({
          id: m._id,
          title: m.title || "",
          text: m.text || "",
          url: m.url || "",
          subModules: buildHierarchy(m._id),
        }));

    // Respond with course details and module hierarchy
    res.json({ title: course.title, modules: buildHierarchy() });
  } catch (err) {
    // Handle errors, either course not found or DB errors
    res.status(500).json({ error: err.message });
  }
};


exports.getAllCourses = async (req, res) => {
  try {
    // Fetch all courses
    const courses = await model.getAllCourses();

    // Fetch all instructors (only _id and name fields)
    const instructors = await Instructor.find({}, "_id name").lean();

    // Create a map of instructor_id -> name
    const instructorMap = {};
    for (const inst of instructors) {
      instructorMap[inst._id.toString()] = inst.name;
    }

    // Deduplicate and attach instructor name
    const seen = new Set();
    const uniqueCourses = [];

    for (const c of courses) {
      const key = `${c.title}::${c.instructor_id}`;
      if (!seen.has(key)) {
        seen.add(key);

        // Normalize instructor_id to string for consistent lookup
        const instructorIdStr =
          c.instructor_id?.toString?.() || String(c.instructor_id);

        uniqueCourses.push({
          _id: c._id,
          title: c.title,
          subject: c.subject,
          instructor_id: c.instructor_id,
          name: instructorMap[instructorIdStr] || "Unknown", // Attach instructor name
        });
      }
    }

    // Send the response
    res.json(uniqueCourses);
  } catch (error) {
    console.error("Error fetching all courses:", error);
    res.status(500).json({ error: error.message });
  }
};



exports.getInstructorCourses = async (req, res) => {
  if (!req.session.instructor)
    return res.status(403).json({ error: "Unauthorized." });

  try {
    const courses = await model.getInstructorCourses(req.session.instructor);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveCourse = async (req, res) => {
  if (!req.session.instructor)
    return res.status(403).json({ error: "Unauthorized." });
  const { title, modules, price, overview, tagline, whatYouWillLearn } =
    req.body;
  const instructorId = req.session.instructor;

  try {
    const courseId = await model.insertCourse(title, instructorId, {
      overview,
      tagline,
      whatYouWillLearn,
    });
    const stat = await CourseStat.create({
      course_id: courseId,
      enrolled_count: 0,
      avg_rating: 4.5,
      avg_completion_time: 120,
      price: price,
      review_count: 2,
    });

    const insertModuleRecursive = async (mod, parentId = null) => {
      const moduleId = await model.insertModule(
        courseId,
        parentId,
        mod.title,
        mod.text,
        mod.url
      );
      if (mod.subModules?.length) {
        for (const sub of mod.subModules) {
          await insertModuleRecursive(sub, moduleId);
        }
      }
    };

    if (modules?.length) {
      for (const mod of modules) {
        await insertModuleRecursive(mod);
      }
    }
    res.json({ message: "Course saved successfully!", courseId });
  } catch (error) {
    console.error("Error saving course:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.saveCourseChanges = async (req, res) => {
  if (!req.session.instructor)
    return res.status(403).json({ error: "Unauthorized." });

  const { courseId } = req.query;
  const { title, modules, overview, tagline, whatYouWillLearn } = req.body;
  const instructorId = req.session.instructor;

  try {
    // Check for valid courseId
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid courseId" });
    }

    const course = await model.findCourseByIdAndInstructor(
      courseId,
      instructorId
    );
    if (!course)
      return res
        .status(404)
        .json({ error: "Course not found or unauthorized." });

    // Update title and optional metadata on the Course document
    await model.updateCourseTitle(courseId, title);
    try {
      await Course.findByIdAndUpdate(courseId, {
        overview: overview || "",
        tagline: tagline || "",
        whatYouWillLearn: Array.isArray(whatYouWillLearn)
          ? whatYouWillLearn
          : [],
      }).exec();
    } catch (e) {
      console.warn("Could not update course metadata:", e.message || e);
    }

    await model.deleteModulesByCourse(courseId);

    const insertModuleRecursive = async (mod, parentId = null) => {
      const moduleId = await model.insertModule(
        courseId,
        parentId,
        mod.title,
        mod.text,
        mod.url
      );
      if (mod.subModules?.length) {
        for (const sub of mod.subModules) {
          await insertModuleRecursive(sub, moduleId);
        }
      }
    };

    if (modules?.length) {
      for (const mod of modules) {
        await insertModuleRecursive(mod);
      }
    }
    res.json({ message: "Course updated successfully!", courseId });
  } catch (error) {
    console.error("Error saving course changes:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCoursesWithStats = async (req, res) => {
  if (!req.session.instructor)
    return res.status(401).json({ error: "Unauthorized." });

  try {
    const coursesWithStats = await model.getCoursesWithStats(
      req.session.instructor
    );
    res.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses with stats:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentInfoView = (req, res) => {
  if (!req.session.instructor) return res.status(403).send("Unauthorized.");
  res.sendFile(
    path.join(__dirname, "../views/instructor", "student-info.html")
  );
};
