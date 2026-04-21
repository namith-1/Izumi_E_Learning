const mongoose = require("mongoose");

const reviewerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        specialization: { type: String, default: "" }, // Subject-area expertise
        isLocked: { type: Boolean, default: false },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Reviewer", reviewerSchema);
