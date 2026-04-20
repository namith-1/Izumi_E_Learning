const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const courseRoutes = require("../../routes/courseRoutes");
const Course = require("../../models/Course");
const Teacher = require("../../models/Teacher");

let mongoServer;
let app;
let testTeacher;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  
  // Mock session middleware
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  app.use((req, res, next) => {
    // Automatically log in as the test teacher for all requests in this suite
    if (testTeacher) {
      req.session.user = {
        id: testTeacher._id.toString(),
        role: "teacher",
        name: testTeacher.name,
        email: testTeacher.email
      };
    }
    next();
  });

  app.use("/api/courses", courseRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Course.deleteMany({});
  await Teacher.deleteMany({});
  
  testTeacher = await Teacher.create({
    name: "Instructor Joe",
    email: "joe@izumi.com",
    password: "password123"
  });
});

describe("Course API", () => {
  test("POST /api/courses - should create a new course", async () => {
    const res = await request(app)
      .post("/api/courses")
      .send({
        courseTitle: "Unit Testing 101",
        courseDescription: "Learn how to test code",
        subject: "Computer Science",
        price: 0,
        rootModule: { title: "Root" },
        modules: {
          m1: { type: "text", title: "Intro", content: "Hello" }
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Unit Testing 101");
    expect(res.body.teacherId).toBe(testTeacher._id.toString());
  });

  test("POST /api/courses - should fail if subject is missing", async () => {
    const res = await request(app)
      .post("/api/courses")
      .send({
        courseTitle: "Broken Course"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Subject is required");
  });

  test("GET /api/courses - should return a list of courses", async () => {
    await Course.create({
      title: "Existing Course",
      description: "Already here",
      subject: "Misc",
      teacherId: testTeacher._id,
      approvalStatus: "approved",
      rootModule: { title: "Root" },
      modules: { m1: { type: "text", title: "Intro" } }
    });

    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    // Note: The getAllCourses controller uses aggregation with lookups,
    // so we verify that it returns at least one course with instructor name.
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Existing Course");
    expect(res.body[0].instructorName).toBe("Instructor Joe");
  });
});
