const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("../../routes/authRoutes");
const Student = require("../../models/Student");

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use("/api/auth", authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Auth API", () => {
  test("POST /api/auth/register - success", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "student"
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("test@example.com");
  });

  test("POST /api/auth/login - failure (wrong password)", async () => {
    // First register directly in DB
    const hashedPassword = await require("bcryptjs").hash("correctpassword", 10);
    await Student.create({
      name: "Login User",
      email: "login@example.com",
      password: hashedPassword,
      role: "student"
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "wrongpassword",
        role: "student"
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});
