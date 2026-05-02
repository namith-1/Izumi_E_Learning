const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const authRoutes = require("../../routes/authRoutes");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Reviewer = require("../../models/Reviewer");

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({
    secret: "auth_test_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
  app.use("/api/auth", authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  await Reviewer.deleteMany({});
});

describe("Authentication & Profile API (Comprehensive)", () => {
  
  describe("Registration", () => {
    test("POST /api/auth/register - Successfully register as student", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Student User", email: "s@test.com", password: "password123", role: "student" });
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Registration successful");
      expect(res.body.user.role).toBe("student");
    });

    test("POST /api/auth/register - Successfully register as teacher", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Teacher User", email: "t@test.com", password: "password123", role: "teacher" });
      
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("teacher");
    });

    test("POST /api/auth/register - Fail on duplicate email", async () => {
      await Student.create({ name: "Exist", email: "dup@test.com", password: "hashed_password" });
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "New", email: "dup@test.com", password: "password123", role: "student" });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email already exists");
    });

    test("POST /api/auth/register - Fail on invalid role", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Invalid", email: "inv@test.com", password: "password123", role: "superuser" });
      
      expect(res.status).toBe(500); // Controller crashes on invalid role model lookup
    });

    test("POST /api/auth/register - Verify auto-login session creation", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/register")
        .send({ name: "Auto Login", email: "auto@test.com", password: "password123", role: "student" });

      const meRes = await agent.get("/api/auth/me");
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe("auto@test.com");
    });
  });

  describe("Login & Lockout", () => {
    test("POST /api/auth/login - Success: Hardcoded Admin", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@izumi.com", password: "admipass", role: "admin" });
      
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("admin");
    });

    test("POST /api/auth/login - Success: Student", async () => {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("secure123", 10);
      await Student.create({ name: "S1", email: "s1@test.com", password: hashedPassword });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "s1@test.com", password: "secure123", role: "student" });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged in successfully");
    });

    test("POST /api/auth/login - Fail: Invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "ghost@test.com", password: "wrong", role: "student" });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });

    test("POST /api/auth/login - Lockout after 5 failed attempts", async () => {
      const email = "lock@test.com";
      // Ensure user exists
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("p1", 10);
      await Student.create({ name: "L", email, password: hashedPassword });

      // 5 Failed attempts
      for(let i=0; i<5; i++) {
        await request(app).post("/api/auth/login").send({ email, password: "w", role: "student" });
      }

      // 6th attempt should be blocked (429)
      const res = await request(app).post("/api/auth/login").send({ email, password: "w", role: "student" });
      expect(res.status).toBe(429);
      expect(res.body.message).toContain("Too many attempts");
    });
  });

  describe("Profile & Session Management", () => {
    let agent;

    beforeEach(async () => {
      agent = request.agent(app);
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("pass123", 10);
      await Student.create({ name: "Static User", email: "static@test.com", password: hashedPassword });
      
      await agent.post("/api/auth/login").send({ email: "static@test.com", password: "pass123", role: "student" });
    });

    test("GET /api/auth/me - Should return current user", async () => {
      const res = await agent.get("/api/auth/me");
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Static User");
    });

    test("PUT /api/auth/profile - Successfully update name", async () => {
      const res = await agent
        .put("/api/auth/profile")
        .send({ name: "Updated Name", currentPassword: "pass123" });
      
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");
    });

    test("PUT /api/auth/profile - Successfully change password", async () => {
      const res = await agent
        .put("/api/auth/profile")
        .send({ currentPassword: "pass123", newPassword: "newpassword456" });
      
      expect(res.status).toBe(200);
      
      // Verify new password works
      await agent.post("/api/auth/logout");
      const loginRes = await agent.post("/api/auth/login").send({ email: "static@test.com", password: "newpassword456", role: "student" });
      expect(loginRes.status).toBe(200);
    });

    test("PUT /api/auth/profile - Fail on wrong current password", async () => {
      const res = await agent
        .put("/api/auth/profile")
        .send({ name: "Hacker", currentPassword: "wrong" });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid current password.");
    });

    test("POST /api/auth/logout - Successfully clear session", async () => {
      const logoutRes = await agent.post("/api/auth/logout");
      expect(logoutRes.status).toBe(200);

      const meRes = await agent.get("/api/auth/me");
      expect(meRes.status).toBe(401);
    });
  });

  describe("Teacher Queries", () => {
    test("GET /api/auth/teachers - Returns list of instructors", async () => {
      await Teacher.create({ name: "Instructor 1", email: "i1@test.com", password: "h" });
      await Teacher.create({ name: "Instructor 2", email: "i2@test.com", password: "h" });

      const res = await request(app).get("/api/auth/teachers");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty("name");
    });
  });

});
