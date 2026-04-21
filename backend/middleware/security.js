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
        "https://izumi-e-learning-frontend.onrender.com",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5000",
      ].filter(Boolean).map(url => url.trim().replace(/\/$/, ""));
      
      // Allow if no origin (like mobile apps/Postman) or if in allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Range"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  }),
];

module.exports = securityMiddleware;
