const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: [String], default: [] }, // Topic/subject expertise
    resume: { type: String }, // URL or path to resume
    linkedIn: { type: String }, // LinkedIn profile URL
    payoutProfile: {
        razorpayContactId: { type: String, default: "" },
        razorpayFundAccountId: { type: String, default: "" },
        upiId: { type: String, default: "" },
        accountHolderName: { type: String, default: "" },
        bankAccountLast4: { type: String, default: "" },
        ifsc: { type: String, default: "" },
        weeklyPayoutsEnabled: { type: Boolean, default: true },
    },
    applicationStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    isLocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
