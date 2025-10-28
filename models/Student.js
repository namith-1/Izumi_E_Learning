const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // You can add profile pictures or bio here later
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);