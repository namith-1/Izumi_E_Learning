const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    
    // --- NEW FIELD ---
    subject: { type: String, required: true, index: true }, 
    // -----------------
    
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    rating: { type: Number, default: 0 },
    whatULearning: [String],
    
    // Recursive structure
    rootModule: { type: Object, required: true },
    
    price: { type: Number, default: 0 },
    // Flat map for lookups
    duration: { type: Number, default: 0 }, // Total duration in minutes

    modules: { type: Map, of: Object, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);