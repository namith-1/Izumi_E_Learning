const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const courseRoutes = require("../../routes/courseRoutes");
const Course = require("../../models/Course");
const Teacher = require("../../models/Teacher");
const Enrollment = require("../../models/Enrollment");

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

  // Mock isAuthenticated and isTeacher middleware for these tests
  // Since we are mocking the session, we just need to ensure the route thinks we are authenticated.
  app.use("/api/courses", courseRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Course.deleteMany({});
  await Teacher.deleteMany({});
  await Enrollment.deleteMany({});
  
  testTeacher = await Teacher.create({
    name: "Instructor Joe",
    email: "joe@izumi.com",
    password: "password123"
  });
});

describe("Instructor API Actions", () => {
  test("GET /api/courses/analytics - should return analytics for instructor courses", async () => {
    // Create a course owned by the teacher
    const course = await Course.create({
      title: "Bio 101",
      subject: "Science",
      teacherId: testTeacher._id,
      rootModule: { title: "Root" },
      modules: { m1: { type: "text", title: "Intro" } }
    });

    // Add an enrollment for that course
    await Enrollment.create({
      courseId: course._id,
      studentId: new mongoose.Types.ObjectId(), // mock student
      status: "enrolled",
      modules_status: [{ moduleId: "m1", quizScore: 85 }]
    });

    const res = await request(app).get("/api/courses/analytics");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Bio 101");
    expect(res.body[0].totalStudentsEnrolled).toBe(1);
    expect(res.body[0].averageQuizScore).toBe(85);
  });

  test("PUT /api/courses/:id - instructor should be able to update their own course", async () => {
    const course = await Course.create({
      title: "Old Title",
      subject: "Science",
      teacherId: testTeacher._id,
      rootModule: { title: "Root" },
      modules: { m1: { type: "text", title: "Intro" } }
    });

    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .send({
        courseTitle: "New Title",
        courseDescription: "Fresh desc",
        subject: "Science"
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New Title");
  });

  test("PUT /api/courses/:id - instructor should NOT be able to update another instructor's course", async () => {
    const otherTeacher = await Teacher.create({
      name: "Other Teacher",
      email: "other@izumi.com",
      password: "password123"
    });

    const otherCourse = await Course.create({
      title: "Not Mine",
      subject: "Math",
      teacherId: otherTeacher._id,
      rootModule: { title: "Root" },
      modules: { m1: { type: "text", title: "Intro" } }
    });

    const res = await request(app)
      .put(`/api/courses/${otherCourse._id}`)
      .send({
        courseTitle: "Hacked Title"
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Not authorized or course not found");
  });
});
