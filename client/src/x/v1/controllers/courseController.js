const Course = require('../models/Course');
const Teacher = require('../models/Teacher'); // Though not directly used, good practice to import if matching logic is manual

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