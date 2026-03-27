const cors = require('cors');
const helmet = require('helmet');

// Create a function or array to apply both
const securityMiddleware = [
    helmet(), // Protects headers
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
];

module.exports = securityMiddleware;