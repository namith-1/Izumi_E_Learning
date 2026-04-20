const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const enrollmentRoutes = require("../../routes/enrollmentRoutes");
const Enrollment = require("../../models/Enrollment");
const Course = require("../../models/Course");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const EnrollmentAnalytics = require("../../models/EnrollmentAnalytics");

let mongoServer;
let app;
let testStudent;
let testCourse;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  app.use((req, res, next) => {
    if (testStudent) {
      req.session.user = {
        id: testStudent._id.toString(),
        role: "student",
        name: testStudent.name,
        email: testStudent.email
      };
    }
    next();
  });
  app.use("/api/enrollment", enrollmentRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Enrollment.deleteMany({});
  await Course.deleteMany({});
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  await EnrollmentAnalytics.deleteMany({});
  
  testStudent = await Student.create({
    name: "Student A",
    email: "student@example.com",
    password: "password123"
  });

  const teacher = await Teacher.create({
    name: "Teacher T",
    email: "teacher@example.com",
    password: "password123"
  });

  testCourse = await Course.create({
    title: "How to Enroll",
    subject: "Meta",
    teacherId: teacher._id,
    rootModule: { id: "r1", title: "Root" },
    modules: { m1: { id: "m1", type: "text", title: "Intro" } }
  });
});

describe("Enrollment API", () => {
  test("POST /api/enrollment/enroll - should enroll a student", async () => {
    const res = await request(app)
      .post("/api/enrollment/enroll")
      .send({ courseId: testCourse._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body.courseId).toBe(testCourse._id.toString());
  });

  test("GET /api/enrollment/my-courses - should return student enrollments", async () => {
    await Enrollment.create({
      courseId: testCourse._id,
      studentId: testStudent._id,
      status: "enrolled",
      modules_status: [{ moduleId: "m1", completed: false }]
    });

    const res = await request(app).get("/api/enrollment/my-courses");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(testCourse._id.toString());
  });
});
