require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server: SocketIO } = require("socket.io");
const connectDB = require("./config/db");
const path = require("path");

// Import Custom Middlewares
const setupLogging = require("./middleware/logger");
const sessionMiddleware = require("./middleware/session");
const securityMiddleware = require("./middleware/security");
const errorHandler = require("./middleware/errorMiddleware");

// Socket handler
const registerChatHandlers = require("./sockets/chatSocket");

const app = express();
const server = http.createServer(app);

// Determine frontend base URL (env override or sensible default for Vite)
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  `http://localhost:${process.env.FRONTEND_PORT || 5173}`;

// ——— Socket.IO setup ————————————————————————————————————————
const io = new SocketIO(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});

// Share express-session with Socket.IO so sockets can read req.session
io.engine.use(sessionMiddleware);

// Attach session to socket.request (Socket.IO v4 engine middleware)
io.use((socket, next) => {
  const req = socket.request;
  if (req.session && req.session.user) {
    next();
  } else {
    next(new Error("Unauthorized"));
  }
});

// Register chat socket handlers
registerChatHandlers(io);

// 1. Database
connectDB();

// 2. Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);
app.use(sessionMiddleware);

// Attach auth attempt info before logging so morgan can include it
const authAttemptInfo = require("./middleware/authAttemptInfo");
app.use(authAttemptInfo);

// 3. Logging
setupLogging(app);

// 4. Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/enrollment", require("./routes/enrollmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Your existing static line
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 5. Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend Admin Login: ${FRONTEND_URL}/admin-login`);
  console.log(`Socket.IO ready on port ${PORT}`);
});
