const cors = require("cors");
const helmet = require("helmet");

// Create a function or array to apply both
const securityMiddleware = [
  helmet(), // Protects headers
  cors({
    origin:
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
];

module.exports = securityMiddleware;
