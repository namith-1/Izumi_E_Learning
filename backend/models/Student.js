const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        // Only require password if googleId is NOT present
        required: function() {
            return !this.googleId;
        }
    },
    profilePic: { type: String, default: '' },
    googleId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);