// backend/controllers/courseController.js
const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const mongoose = require("mongoose");
const cacheService = require("../services/cacheService");
const searchService = require("../services/searchService");

// ─── Helper: validate that graded module weights sum to ~100 ────────────────
const checkWeightSum = (modules) => {
  if (!modules) return null;
  const values =
    modules instanceof Map
      ? Array.from(modules.values())
      : Object.values(modules);
  const graded = values.filter(
    (m) => m && m.isGraded !== false && (m.isGraded === true || m.type === "quiz"),
  );
  if (graded.length === 0) return null;
  const total = graded.reduce((s, m) => s + (m.weight ?? 0), 0);
  if (total === 0) return null; // weights not set at all — skip warning
  if (Math.abs(total - 100) > 0.01) {
    return `Graded module weights sum to ${total}, not 100. Scores will be auto-normalised.`;
  }
  return null;
};
exports.checkWeightSum = checkWeightSum;

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseTitle
 *               - courseDescription
 *               - subject
 *             properties:
 *               courseTitle:
 *                 type: string
 *                 example: "Introduction to Programming"
 *               courseDescription:
 *                 type: string
 *                 example: "Learn the basics of programming"
 *               subject:
 *                 type: string
 *                 example: "Computer Science"
 *               imageUrl:
 *                 type: string
 *                 example: "/uploads/courses/image.jpg"
 *               rootModule:
 *                 type: string
 *                 example: "Welcome to the course"
 *               price:
 *                 type: number
 *                 example: 99.99
 *               modules:
 *                 type: object
 *                 example: {"module1": {"type": "text", "title": "Intro", "content": "Content"}}
 *               passingPolicy:
 *                 type: object
 *                 properties:
 *                   minimumScore:
 *                     type: number
 *                     example: 70
 *                   requiredModules:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["quiz1", "quiz2"]
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Course'
 *                 - type: object
 *                   properties:
 *                     weightWarning:
 *                       type: string
 *                       example: "Graded module weights sum to 90, not 100. Scores will be auto-normalised."
 *       400:
 *         description: Subject is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subject is required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *   get:
 *     summary: Get all courses (catalog)
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60c728362d294d1f88c88888"
 *                   title:
 *                     type: string
 *                     example: "Introduction to Programming"
 *                   description:
 *                     type: string
 *                     example: "Learn the basics of programming"
 *                   subject:
 *                     type: string
 *                     example: "Computer Science"
 *                   imageUrl:
 *                     type: string
 *                     example: "/uploads/courses/image.jpg"
 *                   rating:
 *                     type: number
 *                     example: 4.5
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-01-01T00:00:00.000Z"
 *                   teacherId:
 *                     type: string
 *                     example: "60c728362d294d1f88c88889"
 *                   approvalStatus:
 *                     type: string
 *                     example: "approved"
 *                   instructorName:
 *                     type: string
 *                     example: "Dr. Smith"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Create Course
exports.createCourse = async (req, res) => {
  try {
    const {
      courseTitle,
      courseDescription,
      subject,
      imageUrl,
      rootModule,
      price,
      modules,
      passingPolicy,  // NEW: grading policy from instructor
    } = req.body;

    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }

    const newCourse = await Course.create({
      title: courseTitle,
      description: courseDescription,
      subject,
      imageUrl,
      rootModule,
      modules,
      price,
      passingPolicy: passingPolicy || undefined, // use schema defaults if not provided
      teacherId: req.session.user.id,
    });

    const weightWarning = checkWeightSum(modules);
    
    // Invalidate Kurs catalog cache
    await cacheService.delByPattern("courses:catalog:*");
    
    // Sync to Search Engine
    await searchService.syncCourse(newCourse);
    
    res.status(201).json({ ...newCourse.toObject(), weightWarning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Courses (Catalog) — supports optional ?subjects=Math,Science preference filter
exports.getAllCourses = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip  = (page - 1) * limit;

    // Optional preference filter: ?subjects=Math,Physics
    const subjectsParam = req.query.subjects;
    const subjectList   = subjectsParam
      ? subjectsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const userRole = req.session?.user?.role;
    const isPublic = userRole !== "teacher" && userRole !== "admin";

    // Cache key includes subjects so different preference sets are cached separately
    const subjectsKey = subjectList.length ? subjectList.sort().join("|") : "all";
    const cacheKey    = `courses:catalog:p${page}:l${limit}:s${subjectsKey}`;
    
    if (isPublic) {
      const cachedData  = await cacheService.get(cacheKey);
      if (cachedData) return res.json(cachedData);
    }

    const pipeline = [];

    // Universally filter out soft-deleted courses
    pipeline.push({
      $match: {
        isDeleted: { $ne: true },
      },
    });

    if (isPublic) {
      pipeline.push({
        $match: {
          $or: [
            { approvalStatus: "approved" },
            { approvalStatus: { $exists: false } },
          ],
        },
      });
    } else if (userRole === "teacher") {
      // Teachers should only see approved courses AND their own courses
      pipeline.push({
        $match: {
          $or: [
            { approvalStatus: "approved" },
            { approvalStatus: { $exists: false } },
            { teacherId: new mongoose.Types.ObjectId(req.session.user.id) }
          ]
        }
      });
    }

    // Apply subject filter if preferences were provided
    if (subjectList.length > 0) {
      pipeline.push({
        $match: {
          subject: { $in: subjectList.map((s) => new RegExp(`^${s}$`, "i")) },
        },
      });
    }

    pipeline.push({ $project: { modules: 0 } });

    pipeline.push(
      {
        $lookup: {
          from: "teachers",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacherDetails",
        },
      },
      {
        $unwind: { path: "$teacherDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1, title: 1, description: 1, subject: 1,
          imageUrl: 1, rating: 1, createdAt: 1, teacherId: 1,
          approvalStatus: 1,
          instructorName: { $ifNull: ["$teacherDetails.name", "Izumi Instructor"] },
          rootModule: 1, price: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const courses = await Course.aggregate(pipeline);
    if (isPublic) {
      await cacheService.set(cacheKey, courses, 600);
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60c728362d294d1f88c88888"
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Get Single Course
exports.getCourseById = async (req, res) => {
  const cacheKey = `course:detail:${req.params.id}`;
  console.time("DB_Get_Course_Detail");
  try {
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.timeEnd("DB_Get_Course_Detail");
      return res.json(cachedData);
    }

    // Always include modules; frontend components like CourseViewer/Learn require them.
    const course = await Course.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate("teacherId", "name email")
      .lean();
    console.timeEnd("DB_Get_Course_Detail");

    if (!course) return res.status(404).json({ message: "Course not found" });
    await cacheService.set(cacheKey, course);
    res.json(course);
  } catch (err) {
    console.timeEnd("DB_Get_Course_Detail");
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/courses/upload-image:
 *   post:
 *     summary: Upload course image
 *     tags: [Courses]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Course image file
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: "/uploads/courses/image.jpg"
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No file uploaded"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Upload Course Image
exports.uploadCourseImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Return the permanent Cloudinary URL
    const imageUrl = req.file.path;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60c728362d294d1f88c88888"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseTitle:
 *                 type: string
 *                 example: "Updated Course Title"
 *               courseDescription:
 *                 type: string
 *                 example: "Updated description"
 *               subject:
 *                 type: string
 *                 example: "Computer Science"
 *               imageUrl:
 *                 type: string
 *                 example: "/uploads/courses/image.jpg"
 *               rootModule:
 *                 type: string
 *                 example: "Welcome to the course"
 *               modules:
 *                 type: object
 *                 example: {"module1": {"type": "text", "title": "Intro", "content": "Content"}}
 *               price:
 *                 type: number
 *                 example: 99.99
 *               passingPolicy:
 *                 type: object
 *                 properties:
 *                   minimumScore:
 *                     type: number
 *                     example: 70
 *                   requiredModules:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["quiz1", "quiz2"]
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Course'
 *                 - type: object
 *                   properties:
 *                     weightWarning:
 *                       type: string
 *                       example: "Graded module weights sum to 90, not 100. Scores will be auto-normalised."
 *       403:
 *         description: Not authorized or course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not authorized or course not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Update Course
exports.updateCourse = async (req, res) => {
  try {
    const {
      courseTitle,
      courseDescription,
      subject,
      imageUrl,
      rootModule,
      modules,
      price,
      passingPolicy,  // NEW: grading policy update
    } = req.body;

    const updatePayload = {
      title: courseTitle,
      description: courseDescription,
      subject,
      imageUrl,
      price,
      rootModule,
      modules,
    };
    if (passingPolicy !== undefined) {
      updatePayload.passingPolicy = passingPolicy;
    }

    // Find the current course first to check its approval status
    const existingCourse = await Course.findOne({
      _id: req.params.id,
      teacherId: req.session.user.id,
    });

    if (!existingCourse) {
      return res.status(403).json({ message: "Not authorized or course not found" });
    }

    // If a previously approved course is being updated, mark it for re-review
    if (["approved"].includes(existingCourse.approvalStatus)) {
      updatePayload.approvalStatus = "awaited";
      updatePayload.submittedAt = new Date();
      updatePayload.reviewedAt = null;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true },
    );

    if (!updatedCourse)
      return res
        .status(403)
        .json({ message: "Not authorized or course not found" });

    const weightWarning = checkWeightSum(modules);
    
    // Invalidate caches
    await cacheService.delByPattern("courses:catalog:*");
    await cacheService.del(`course:detail:${req.params.id}`);
    
    // Sync to Search Engine
    await searchService.syncCourse(updatedCourse);
    
    const resubmitted = updatePayload.approvalStatus === "awaited";
    res.json({ 
      ...updatedCourse.toObject(), 
      weightWarning,
      resubmitted, // flag so frontend can show a notice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/courses/analytics:
 *   get:
 *     summary: Get course analytics for instructor
 *     tags: [Courses]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Course analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60c728362d294d1f88c88888"
 *                   title:
 *                     type: string
 *                     example: "Introduction to Programming"
 *                   subject:
 *                     type: string
 *                     example: "Computer Science"
 *                   totalStudentsEnrolled:
 *                     type: number
 *                     example: 25
 *                   averageQuizScore:
 *                     type: number
 *                     example: 85.5
 *                   enrollmentTrend:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         date:
 *                           type: string
 *                           format: date
 *                           example: "2023-01-01"
 *                         count:
 *                           type: number
 *                           example: 5
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// NEW: Get Course Analytics for Instructor's Courses
exports.getCourseAnalytics = async (req, res) => {
  console.time("DB_Instructor_Analytics");
  try {
    // Ensure to use the correct ObjectId type for comparison
    const instructorId = new mongoose.Types.ObjectId(req.session.user.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const analytics = await Course.aggregate([
      // 1. Filter by the current instructor's ID
      { $match: { teacherId: instructorId } },

      // 2. Lookup all enrollments for these courses
      {
        $lookup: {
          from: "enrollments", // MongoDB collection name for Enrollment model
          localField: "_id",
          foreignField: "courseId",
          as: "enrollments",
        },
      },

      // 3. Project/Calculate fields (intermediate step)
      {
        $project: {
          _id: 1,
          title: 1,
          subject: 1,
          // Count total students enrolled
          totalStudentsEnrolled: { $size: "$enrollments" },

          // Flatten module statuses from all enrollments into a single array for easier score calculation
          allModuleStatuses: {
            $reduce: {
              input: "$enrollments.modules_status",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },

          // Filter enrollments created in the last 7 days for trend calculation
          recentEnrollments: {
            $filter: {
              input: "$enrollments",
              as: "enrollment",
              cond: { $gte: ["$$enrollment.createdAt", sevenDaysAgo] },
            },
          },
        },
      },

      // 4. Calculate final metrics
      {
        $project: {
          _id: 1,
          title: 1,
          subject: 1,
          totalStudentsEnrolled: 1,

          // Calculate Average Quiz Score (across all valid quiz entries)
          averageQuizScore: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: "$allModuleStatuses",
                    as: "status",
                    // Filter only modules that have a quizScore set (not null)
                    cond: { $ne: ["$$status.quizScore", null] },
                  },
                },
                as: "quizModule",
                in: "$$quizModule.quizScore",
              },
            },
          },

          recentEnrollments: 1,
        },
      },
    ]);
    console.timeEnd("DB_Instructor_Analytics");

    // Post-process the analytics to calculate the enrollmentTrend in Node.js (much faster than $function in MongoDB)
    const finalAnalytics = analytics.map((course) => {
      const trend = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Initialize the last 7 days with 0
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        trend[date.toISOString().slice(0, 10)] = 0;
      }

      // Populate counts from recent enrollments
      (course.recentEnrollments || []).forEach((e) => {
        if (e.createdAt) {
          const dateStr = new Date(e.createdAt).toISOString().slice(0, 10);
          if (trend.hasOwnProperty(dateStr)) {
            trend[dateStr]++;
          }
        }
      });

      // Convert to array and sort
      const enrollmentTrend = Object.keys(trend)
        .sort()
        .map((date) => ({ date, count: trend[date] }));

      // Clean up the temporary array
      const result = { ...course, enrollmentTrend };
      delete result.recentEnrollments;
      return result;
    });

    res.json(finalAnalytics);
  } catch (err) {
    console.timeEnd("DB_Instructor_Analytics");
    console.error("Analytics aggregation error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/courses/search:
 *   get:
 *     summary: Search courses using Meilisearch
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
exports.searchCourses = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return res.json({ hits: [] });

  try {
    // Try Meilisearch first
    const results = await searchService.search(q, { limit: 1000, offset: 0 });

    if (results.hits && results.hits.length > 0) {
      return res.json(results);
    }

    // ── Meilisearch empty or unavailable → MongoDB regex fallback ───────────
    const regex = new RegExp(q.trim().split(/\s+/).join("|"), "i");

    const courses = await Course.aggregate([
      {
        $match: {
          $or: [
            { approvalStatus: "approved" },
            { approvalStatus: { $exists: false } },
          ],
          isDeleted: { $ne: true },
        },
      },
      {
        $lookup: {
          from: "teachers",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacherDetails",
        },
      },
      { $unwind: { path: "$teacherDetails", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { title:       { $regex: regex } },
            { description: { $regex: regex } },
            { subject:     { $regex: regex } },
            { "teacherDetails.name": { $regex: regex } },
          ],
        },
      },
      {
        $project: {
          _id: 1, title: 1, description: 1, subject: 1,
          imageUrl: 1, rating: 1, createdAt: 1, teacherId: 1,
          approvalStatus: 1,
          instructorName: { $ifNull: ["$teacherDetails.name", "Izumi Instructor"] },
          rootModule: 1,
          price: 1,
        },
      },
      { $sort: { rating: -1, createdAt: -1 } },
      { $limit: 100 },
    ]);

    // Return in same format as Meilisearch so frontend store works unchanged
    res.json({ hits: courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Course (Soft Delete)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      teacherId: req.session.user.id,
    });

    if (!course) {
      return res.status(403).json({ message: "Not authorized or course not found" });
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();

    // Invalidate caches
    await cacheService.delByPattern("courses:catalog:*");
    await cacheService.del(`course:detail:${req.params.id}`);

    // Remove from Search Engine
    await searchService.deleteCourse(course._id);

    res.json({ message: "Course deleted successfully", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
