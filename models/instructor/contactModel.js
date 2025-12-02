const mongoose = require("mongoose");

const contactAdminSchema = new mongoose.Schema({
    instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null }, // null = general
    message: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
    token_number: { type: String, required: true }, // unique token identifier
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    notes: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date }
});

module.exports = mongoose.model("ContactAdmin", contactAdminSchema);
