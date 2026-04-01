// backend/controllers/courseController.js
const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const mongoose = require("mongoose"); // Need mongoose for ObjectId conversion

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
    res.status(201).json({ ...newCourse.toObject(), weightWarning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/courses:
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

// Get All Courses (Catalog) - MODIFIED TO USE AGGREGATION LOOKUP
exports.getAllCourses = async (req, res) => {
  try {
    const pipeline = [];

    // Role-aware approval filter:
    // Teachers see ALL courses (MyCourses filters by teacherId on frontend)
    // Students/unauthenticated only see approved courses
    const userRole = req.session?.user?.role;
    if (userRole !== "teacher" && userRole !== "admin") {
      pipeline.push({
        $match: {
          $or: [
            { approvalStatus: "approved" },
            { approvalStatus: { $exists: false } },
          ],
        },
      });
    }

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
        $unwind: "$teacherDetails",
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          subject: 1,
          imageUrl: 1,
          rating: 1,
          createdAt: 1,
          teacherId: 1,
          approvalStatus: 1,
          instructorName: "$teacherDetails.name",
        },
      }
    );

    const courses = await Course.aggregate(pipeline);
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
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
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

    // Construct a publicly accessible URL for the uploaded file
    const imageUrl = `/uploads/courses/${req.file.filename}`;
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

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.session.user.id },
      updatePayload,
      { new: true },
    );

    if (!updatedCourse)
      return res
        .status(403)
        .json({ message: "Not authorized or course not found" });

    const weightWarning = checkWeightSum(modules);
    res.json({ ...updatedCourse.toObject(), weightWarning });
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

          // Calculate Enrollment Trend (enrollments grouped by creation date)
          // Using $function allows flexible client-side date logic inside the aggregation pipeline
          enrollmentTrend: {
            $function: {
              body: function (enrollments) {
                // Maps the last 7 days to a count of enrollments created on that day
                const trend = {};
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (let i = 0; i < 7; i++) {
                  const date = new Date(today);
                  date.setDate(today.getDate() - i);
                  trend[date.toISOString().slice(0, 10)] = 0;
                }

                enrollments.forEach((e) => {
                  if (e.createdAt) {
                    const dateStr = e.createdAt.toISOString().slice(0, 10);
                    if (trend.hasOwnProperty(dateStr)) {
                      trend[dateStr]++;
                    }
                  }
                });
                // Return sorted by date
                return Object.keys(trend)
                  .sort()
                  .map((date) => ({ date, count: trend[date] }));
              },
              args: ["$recentEnrollments"],
              lang: "js",
            },
          },
        },
      },
    ]);

    res.json(analytics);
  } catch (err) {
    console.error("Analytics aggregation error:", err);
    res.status(500).json({ error: err.message });
  }
};
