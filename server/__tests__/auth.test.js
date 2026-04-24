const request = require('supertest');

// Mock the pool before requiring the app
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock uuid (ESM module)
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}));

describe('Auth Routes', () => {
  let app;
  let pool;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    // We need to set up a minimal express app for testing
    const express = require('express');
    app = express();
    app.use(express.json());

    const { Pool } = require('pg');
    pool = new Pool();
    app.locals.pool = pool;

    const authRoutes = require('../routes/auth');
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it('should return 401 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'test123' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });
});
