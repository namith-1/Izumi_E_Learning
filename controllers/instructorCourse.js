const path = require("path");
const model = require("../models/instructorCourseModel"); // Import the Mongoose-based model
const mongoose = require("mongoose");
const { Instructor ,CourseStat, Course } = require("../required/db");
exports.getCourseDetails_moduleTree = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // Validate ObjectId format early
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid Course ID format' });
    }

    // Fetch the course
    const course = await model.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Fetch the modules for the course (robust to failures)
    let modules = [];
    try {
      modules = await model.getModulesByCourseId(courseId);
    } catch (modErr) {
      console.warn(`getModulesByCourseId failed for ${courseId}:`, modErr);
      modules = [];
    }
    console.log(`getCourseDetails_moduleTree: Fetched ${modules.length} modules for course ${courseId}`);
    
    // Helper function to build module hierarchy
    const buildHierarchy = (parentId = null) => {
      // console.log(`Building hierarchy for parent: ${parentId}`);
      return modules
        .filter((m) => {
          if (parentId === null) {
            return !m.parent_id;
          }
          return m.parent_id && m.parent_id.toString() === parentId.toString();
        })
        .map((m) => ({
          id: m._id?.toString(),
          title: m.title || "",
          text: m.text || "",
          url: m.url || "",
          type: m.type || "lesson",
          quizData: m.quizData || null,
          subModules: buildHierarchy(m._id.toString()),
        }));
    };

    const tree = buildHierarchy(null);
    console.log(`getCourseDetails_moduleTree: Built tree with ${tree.length} root nodes`);
    if (tree.length > 0) {
       console.log(`Root 0 submodules: ${tree[0].subModules ? tree[0].subModules.length : 0}`);
    }

    // Respond with course details and module hierarchy
    res.json({ 
      ...course.toObject(), // Return all course fields
      modules: tree 
    });
  } catch (err) {
    // Handle errors, either DB errors or unexpected
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: 'Invalid Course ID format' });
    }
    console.error('getCourseDetails_moduleTree error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
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

  const { title, modules, price, overview, tagline, whatYouWillLearn, subject, thumbnail } = req.body;
  const instructorId = req.session.instructor;

  try {
    // Validate and normalize modules payload
    const normalizedModules = Array.isArray(modules) ? modules : [];
    console.log("[create] Root modules count:", normalizedModules.length);
    normalizedModules.forEach((m, i) => {
      const childCount = Array.isArray(m.subModules) ? m.subModules.length : 0;
      console.log(`[create] Root ${i} title: ${m.title} children: ${childCount}`);
    });

    // Pass separate strings, not an object
    const courseId = await model.insertCourse(
      title,
      instructorId,
      overview,
      tagline,
      subject,
      whatYouWillLearn,
      thumbnail
    );

    await CourseStat.create({
      course_id: courseId,
      enrolled_count: 0,
      avg_rating: 4.5,
      avg_completion_time: 120,
      price,
      review_count: 2,
    });

    // Recursively insert modules
    const insertModuleRecursive = async (mod, parentId = null) => {
      const children = Array.isArray(mod.subModules) ? mod.subModules : [];
      const moduleId = await model.insertModule(
        courseId,
        parentId,
        mod.title,
        mod.text,
        mod.url,
        mod.type,
        mod.quizData
      );
      if (children.length > 0) {
        for (const sub of children) {
          await insertModuleRecursive(sub, moduleId);
        }
      }
    };

    if (normalizedModules.length) {
      for (const mod of normalizedModules) {
        await insertModuleRecursive(mod);
      }
    }

    // Verify and return the rebuilt tree so UI can sync
    const savedModules = await model.getModulesByCourseId(courseId);
    const buildHierarchy = (parentId = null) => {
      return savedModules
        .filter((m) => {
          if (parentId === null) return !m.parent_id;
          return m.parent_id && m.parent_id.toString() === parentId.toString();
        })
        .map((m) => ({
          id: m._id?.toString(),
          title: m.title || "",
          text: m.text || "",
          url: m.url || "",
          type: m.type || "lesson",
          quizData: m.quizData || null,
          subModules: buildHierarchy(m._id.toString()),
        }));
    };

    const tree = buildHierarchy(null);
    res.json({ message: "Course saved successfully!", courseId, modules: tree });
  } catch (error) {
    console.error("Error saving course:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.saveCourseChanges = async (req, res) => {
  if (!req.session.instructor)
    return res.status(403).json({ error: "Unauthorized." });

  const { title, modules, overview, tagline, whatYouWillLearn, subject, thumbnail } = req.body;
  // Check both query and body for courseId
  const courseId = req.query.courseId || req.body.courseId;
  const instructorId = req.session.instructor;

  console.log("saveCourseChanges called for courseId:", courseId);
  if (modules && modules.length > 0) {
     console.log("Root modules count:", modules.length);
     modules.forEach((m, i) => {
         console.log(`Module ${i} title: ${m.title}, subModules count:`, m.subModules ? m.subModules.length : 0);
         if (m.subModules && m.subModules.length > 0) {
             m.subModules.forEach((sub, j) => {
                 console.log(`  SubModule ${j} title: ${sub.title}, subModules count:`, sub.subModules ? sub.subModules.length : 0);
             });
         }
     });
  } else {
      console.log("No modules provided in request body");
  }

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
    const updateData = { title };
    if (overview !== undefined) updateData.overview = overview;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (subject !== undefined) updateData.subject = subject;
    if (whatYouWillLearn !== undefined) updateData.whatYouWillLearn = whatYouWillLearn;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

    await model.updateCourseDetails(courseId, updateData);
    
    // Update price in CourseStat
    if (req.body.price !== undefined) {
      await model.updateCoursePrice(courseId, req.body.price);
    }

    try {
      await Course.findByIdAndUpdate(courseId, {
        overview: overview || "",
        tagline: tagline || "",
        whatYouWillLearn: Array.isArray(whatYouWillLearn)
          ? whatYouWillLearn
          : [],
        subject: req.body.subject || "" // Also update subject
      }).exec();
    } catch (e) {
      console.warn("Could not update course metadata:", e.message || e);
    }

    console.log("Deleting existing modules for course:", courseId);
    await model.deleteModulesByCourse(courseId);

    const insertModuleRecursive = async (mod, parentId = null) => {
      // console.log(`Inserting module: ${mod.title}, parentId: ${parentId}`);
      const moduleId = await model.insertModule(
        courseId,
        parentId,
        mod.title,
        mod.text,
        mod.url,
        mod.type,
        mod.quizData
      );
      // console.log(`Inserted module ${mod.title}, new ID: ${moduleId}`);
      
      if (mod.subModules && Array.isArray(mod.subModules) && mod.subModules.length > 0) {
        // console.log(`Recursing for ${mod.subModules.length} submodules of ${mod.title}`);
        // Wait for all submodules to be inserted before continuing
        for (const sub of mod.subModules) {
          await insertModuleRecursive(sub, moduleId);
        }
      }
    };

    if (modules && modules.length > 0) {
      // Use a loop with await to ensure sequential insertion
      for (const mod of modules) {
        await insertModuleRecursive(mod);
      }
    }
    
    // Fetch the newly saved hierarchy to verify and return authoritative tree
    const savedModules = await model.getModulesByCourseId(courseId);
    console.log(`Verification: Saved ${savedModules.length} modules for course ${courseId}`);

    const buildHierarchy = (parentId = null) => {
      return savedModules
        .filter((m) => {
          if (parentId === null) return !m.parent_id;
          return m.parent_id && m.parent_id.toString() === parentId.toString();
        })
        .map((m) => ({
          id: m._id?.toString(),
          title: m.title || "",
          text: m.text || "",
          url: m.url || "",
          type: m.type || "lesson",
          quizData: m.quizData || null,
          subModules: buildHierarchy(m._id.toString()),
        }));
    };

    const tree = buildHierarchy(null);

    res.json({ message: "Course updated successfully!", courseId, modules: tree });
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
