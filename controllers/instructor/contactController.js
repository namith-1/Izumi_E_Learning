const ContactAdmin = require("../../models/instructor/contactModel.js");
const { nanoid } = require("nanoid"); // for generating token numbers

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { courseId, message, priority } = req.body;
        const instructorId = req.session.instructor; // from session
        if (!instructorId) return res.status(401).json({ error: "Not logged in" });

        if (!message) return res.status(400).json({ error: "Message is required" });

        // Normalize priority values from the frontend to the stored enum.
        // Frontend uses: Low, Normal, High, Urgent
        // DB enum expects: low, medium, high, critical
        const priorityMap = {
            low: 'low',
            Low: 'low',
            normal: 'medium',
            Normal: 'medium',
            medium: 'medium',
            high: 'high',
            High: 'high',
            urgent: 'critical',
            Urgent: 'critical',
            critical: 'critical',
            Critical: 'critical'
        };

        const mappedPriority = priorityMap[priority] || 'low';

        const token = nanoid(8); // 8-character token

        const newMessage = await ContactAdmin.create({
            instructor_id: instructorId,
            course_id: courseId || null, // null = general
            message: message.trim(),
            priority: mappedPriority,
            token_number: token,
            status: "Pending"
        });

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get all messages for instructor
exports.getMessages = async (req, res) => {
    try {
        const instructorId = req.session.instructor;
        if (!instructorId) return res.status(401).json({ error: "Not logged in" });

        const messages = await ContactAdmin.find({ instructor_id: instructorId })
            .populate("course_id", "title") // get course title if exists
            .sort({ created_at: -1 });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};
