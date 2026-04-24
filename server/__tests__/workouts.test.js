const request = require('supertest');

jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Workout Routes', () => {
  let app;
  let pool;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    const express = require('express');
    app = express();
    app.use(express.json());

    const { Pool } = require('pg');
    pool = new Pool();
    app.locals.pool = pool;

    const workoutRoutes = require('../routes/workouts');
    app.use('/api/workouts', workoutRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workouts', () => {
    it('should return paginated workouts', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Workout', type: 'Strength' }] });

      const res = await request(app).get('/api/workouts');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('should support search parameter', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'HIIT Blast' }] });

      const res = await request(app).get('/api/workouts?search=HIIT');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/workouts', () => {
    it('should create a workout', async () => {
      const workout = { name: 'New Workout', type: 'Strength', difficulty: 'Medium', duration: 45, calories: 300, exercises: [], user_id: 1 };
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...workout }] });

      const res = await request(app).post('/api/workouts').send(workout);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/workouts/:id', () => {
    it('should delete a workout', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const res = await request(app).delete('/api/workouts/1');
      expect(res.status).toBe(200);
    });
  });
});
