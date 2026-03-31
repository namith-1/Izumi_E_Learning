const request = require('supertest');
const app = require('../server'); // Adjust path if needed
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Set test environment
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/izumi_test';
process.env.NODE_ENV = 'test';

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/izumi_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await Student.deleteMany({});
    await Teacher.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'student'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.role).toBe('student');
      expect(response.body.user.name).toBe('Test Student');
      expect(response.body.user.email).toBe('student@test.com');
    });

    it('should register a new teacher', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Teacher',
          email: 'teacher@test.com',
          password: 'password123',
          role: 'teacher'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.user.role).toBe('teacher');
    });

    it('should not register with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'student'
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Student',
          email: 'student@test.com',
          password: 'password456',
          role: 'student'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should not register with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'user@test.com',
          password: 'password123',
          role: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'student'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123',
          role: 'student'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged in successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.role).toBe('student');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'wrongpassword',
          role: 'student'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
          role: 'student'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user session if logged in', async () => {
      // First register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'student'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123',
          role: 'student'
        });

      // Now test /me with session
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', loginResponse.headers['set-cookie']);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.role).toBe('student');
    });

    it('should return null if not logged in', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.user).toBe(null);
    });
  });

  describe('GET /api/auth/teachers', () => {
    beforeEach(async () => {
      // Register a teacher
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Teacher',
          email: 'teacher@test.com',
          password: 'password123',
          role: 'teacher'
        });
    });

    it('should return list of teachers', async () => {
      const response = await request(app)
        .get('/api/auth/teachers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('name');
    });
  });
});