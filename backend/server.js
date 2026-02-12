require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");

// Import Custom Middlewares
const setupLogging = require("./middleware/logger");
const sessionMiddleware = require("./middleware/session");
const securityMiddleware = require("./middleware/security");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// 1. Database
connectDB();

// 2. Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);
app.use(sessionMiddleware);

// 3. Logging
setupLogging(app);

// 4. Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/enrollment", require("./routes/enrollmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Your existing static line
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 5. Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Determine frontend base URL (env override or sensible default for Vite)
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  `http://localhost:${process.env.FRONTEND_PORT || 5173}`;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // console.log(`API base: http://localhost:${PORT}/api`);
  console.log(`Frontend Admin Login: ${FRONTEND_URL}/admin-login`);
});
