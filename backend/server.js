require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server: SocketIO } = require("socket.io");
const connectDB = require("./config/db");
const path = require("path");
const passport = require('./config/passport');

// Swagger setup
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Izumi E-Learning Platform API',
    version: '1.0.0',
    description: 'API documentation for the Izumi E-Learning platform',
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication endpoints',
    },
    {
      name: 'Courses',
      description: 'Course management endpoints',
    },
    {
      name: 'Enrollment',
      description: 'Enrollment and progress endpoints',
    },
    {
      name: 'Admin',
      description: 'Admin management endpoints',
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints',
    },
    {
      name: 'Chat',
      description: 'Chat and messaging endpoints',
    },
    {
      name: 'Review',
      description: 'Course review and approval endpoints',
    },
    {
      name: 'Payments',
      description: 'Student and teacher payment transaction endpoints',
    },
  ],
  components: {
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60c728362d294d1f88c88888',
          },
          role: {
            type: 'string',
            enum: ['student', 'teacher', 'reviewer', 'admin'],
            example: 'student',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          profilePic: {
            type: 'string',
            example: '/uploads/profiles/image.jpg',
          },
        },
      },
      Course: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60c728362d294d1f88c88888',
          },
          title: {
            type: 'string',
            example: 'Introduction to Programming',
          },
          description: {
            type: 'string',
            example: 'Learn the basics of programming',
          },
          subject: {
            type: 'string',
            example: 'Computer Science',
          },
          price: {
            type: 'number',
            example: 99.99,
          },
          teacher: {
            type: 'string',
            example: '60c728362d294d1f88c88889',
          },
          modules: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Module',
            },
          },
          status: {
            type: 'string',
            enum: ['draft', 'pending', 'approved', 'rejected'],
            example: 'approved',
          },
        },
      },
      Module: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['text', 'video', 'quiz'],
            example: 'video',
          },
          title: {
            type: 'string',
            example: 'Introduction Video',
          },
          content: {
            type: 'string',
            example: 'Video content URL or text',
          },
          quiz: {
            $ref: '#/components/schemas/Quiz',
          },
        },
      },
      Quiz: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  example: 'What is 2+2?',
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['3', '4', '5', '6'],
                },
                correctAnswer: {
                  type: 'number',
                  example: 1,
                },
              },
            },
          },
        },
      },
      Enrollment: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60c728362d294d1f88c88888',
          },
          student: {
            type: 'string',
            example: '60c728362d294d1f88c88889',
          },
          course: {
            type: 'string',
            example: '60c728362d294d1f88c88890',
          },
          progress: {
            type: 'object',
            properties: {
              completedModules: {
                type: 'array',
                items: {
                  type: 'string',
                },
                example: ['module1', 'module2'],
              },
              percentage: {
                type: 'number',
                example: 50,
              },
            },
          },
          enrolledAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00.000Z',
          },
        },
      },
    },
  },
  security: [
    {
      sessionAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJSDoc(options);

// ... after sessionMiddleware
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
app.use(passport.initialize());
app.use(passport.session());

// Attach auth attempt info before logging so morgan can include it
const authAttemptInfo = require("./middleware/authAttemptInfo");
app.use(authAttemptInfo);

// 3. Logging
setupLogging(app);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 4. Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/enrollment", require("./routes/enrollmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
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
