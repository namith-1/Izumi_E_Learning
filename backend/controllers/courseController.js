// backend/controllers/courseController.js
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const mongoose = require('mongoose'); // Need mongoose for ObjectId conversion

// Create Course
exports.createCourse = async (req, res) => {
    try {
        // 1. Extract 'subject' from the request body
        const { courseTitle, courseDescription, subject, rootModule, modules } = req.body;
        
        // Basic validation
        if (!subject) {
            return res.status(400).json({ message: "Subject is required" });
        }

        const newCourse = await Course.create({
            title: courseTitle,
            description: courseDescription,
            subject: subject, // 2. Save it to database
            rootModule,
            modules,
            teacherId: req.session.user.id
        });
        console.log(modules);
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get All Courses (Catalog) - MODIFIED TO USE AGGREGATION LOOKUP
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                // Join Course documents with the 'teachers' collection
                $lookup: {
                    from: 'teachers', // Name of the MongoDB collection for the Teacher model
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacherDetails' // Temporary field containing an array of matched teachers
                }
            },
            {
                // Deconstruct the teacherDetails array field from the input documents to output a document for each element.
                // Since each course has only one teacher, this effectively flattens the teacher object.
                $unwind: '$teacherDetails'
            },
            {
                // Select and rename the final fields for the client
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    subject: 1,
                    rating: 1,
                    createdAt: 1,
                    teacherId: 1, // Keep the ID
                    // Extract the name and put it at the root level of the document
                    instructorName: '$teacherDetails.name'
                }
            }
        ]);
        
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Single Course
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Course
exports.updateCourse = async (req, res) => {
    try {
        // 4. Allow updating the subject
        const { courseTitle, courseDescription, subject, rootModule, modules } = req.body;
        
        const updatedCourse = await Course.findOneAndUpdate(
            { _id: req.params.id, teacherId: req.session.user.id },
            { 
                title: courseTitle, 
                description: courseDescription,
                subject: subject, // Update subject
                rootModule, 
                modules 
            },
            { new: true }
        );

        if (!updatedCourse) return res.status(403).json({ message: 'Not authorized or course not found' });
        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

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
                    from: 'enrollments', // MongoDB collection name for Enrollment model
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'enrollments'
                }
            },
            
            // 3. Project/Calculate fields (intermediate step)
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subject: 1,
                    // Count total students enrolled
                    totalStudentsEnrolled: { $size: '$enrollments' },
                    
                    // Flatten module statuses from all enrollments into a single array for easier score calculation
                    allModuleStatuses: { $reduce: {
                        input: '$enrollments.modules_status',
                        initialValue: [],
                        in: { $concatArrays: ['$$value', '$$this'] }
                    }},
                    
                    // Filter enrollments created in the last 7 days for trend calculation
                    recentEnrollments: { $filter: {
                        input: '$enrollments',
                        as: 'enrollment',
                        cond: { $gte: ['$$enrollment.createdAt', sevenDaysAgo] }
                    }},
                }
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
                                input: { $filter: {
                                    input: '$allModuleStatuses',
                                    as: 'status',
                                    // Filter only modules that have a quizScore set (not null)
                                    cond: { $ne: ['$$status.quizScore', null] }
                                } },
                                as: 'quizModule',
                                in: '$$quizModule.quizScore'
                            }
                        }
                    },

                    // Calculate Enrollment Trend (enrollments grouped by creation date)
                    // Using $function allows flexible client-side date logic inside the aggregation pipeline
                    enrollmentTrend: {
                        $function: {
                            body: function(enrollments) {
                                // Maps the last 7 days to a count of enrollments created on that day
                                const trend = {};
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                for (let i = 0; i < 7; i++) {
                                    const date = new Date(today);
                                    date.setDate(today.getDate() - i);
                                    trend[date.toISOString().slice(0, 10)] = 0;
                                }

                                enrollments.forEach(e => {
                                    if (e.createdAt) {
                                        const dateStr = e.createdAt.toISOString().slice(0, 10);
                                        if (trend.hasOwnProperty(dateStr)) {
                                            trend[dateStr]++;
                                        }
                                    }
                                });
                                // Return sorted by date
                                return Object.keys(trend).sort().map(date => ({ date, count: trend[date] }));
                            },
                            args: ['$recentEnrollments'],
                            lang: 'js'
                        }
                    }
                }
            }
        ]);

        res.json(analytics);
    } catch (err) {
        console.error("Analytics aggregation error:", err);
        res.status(500).json({ error: err.message });
    }
};