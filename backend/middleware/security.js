const cors = require("cors");
const helmet = require("helmet");
const { getAllowedOrigins, isAllowedOrigin } = require("../config/allowedOrigins");

// Create a function or array to apply both
const securityMiddleware = [
  helmet(), // Protects headers
  cors({
    origin: (origin, callback) => {
      // Allow if no origin (like mobile apps/Postman) or if in allowed list
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        const allowedOrigins = getAllowedOrigins().concat("https://*.vercel.app");
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
