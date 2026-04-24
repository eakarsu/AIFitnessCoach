const express = require('express');
const router = express.Router();

// Get all workouts (with search & pagination)
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM workouts';
    let countQuery = 'SELECT COUNT(*) FROM workouts';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' WHERE (name ILIKE $1 OR type ILIKE $1 OR difficulty ILIKE $1)';
      countQuery += ' WHERE (name ILIKE $1 OR type ILIKE $1 OR difficulty ILIKE $1)';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single workout
router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('SELECT * FROM workouts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Workout not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching workout:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create workout
router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, type, difficulty, duration, calories, exercises, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO workouts (user_id, name, type, difficulty, duration, calories, exercises) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id || 1, name, type, difficulty, duration, calories, JSON.stringify(exercises)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating workout:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update workout
router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, type, difficulty, duration, calories, exercises } = req.body;
  try {
    const result = await pool.query(
      'UPDATE workouts SET name = $1, type = $2, difficulty = $3, duration = $4, calories = $5, exercises = $6 WHERE id = $7 RETURNING *',
      [name, type, difficulty, duration, calories, JSON.stringify(exercises), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Workout not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating workout:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete workout
router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('DELETE FROM workouts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Workout not found' });
    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error('Error deleting workout:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
