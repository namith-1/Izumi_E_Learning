const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: [String], default: [] }, // Topic/subject expertise
    isLocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);