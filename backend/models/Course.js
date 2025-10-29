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
    
    // Flat map for lookups
    modules: { type: Map, of: Object, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);