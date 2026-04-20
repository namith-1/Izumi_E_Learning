const mongoose = require('mongoose');

//new congig/db.js
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected successfully');
    } catch (err) {
        console.error('CRITICAL DATABASE ERROR:', err.message);
        console.error('Check if MONGO_URI is correctly set in your Render dashboard.');
        process.exit(1);
    }
};

module.exports = connectDB;
