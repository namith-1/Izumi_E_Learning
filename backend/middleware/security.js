const cors = require("cors");
const helmet = require("helmet");

// Create a function or array to apply both
const securityMiddleware = [
  helmet(), // Protects headers
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
        process.env.BACKEND_URL,
        "http://localhost:5173",
        "http://localhost:5000"
      ].filter(Boolean).map(url => url.replace(/\/$/, "")); // Strip trailing slashes
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }),
];

module.exports = securityMiddleware;
