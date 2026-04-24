const express = require('express');
const router = express.Router();

// Get all running sessions (with search & pagination)
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM running_sessions';
    let countQuery = 'SELECT COUNT(*) FROM running_sessions';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' WHERE (name ILIKE $1 OR terrain ILIKE $1 OR weather ILIKE $1 OR notes ILIKE $1)';
      countQuery += ' WHERE (name ILIKE $1 OR terrain ILIKE $1 OR weather ILIKE $1 OR notes ILIKE $1)';
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
    console.error('Error fetching running sessions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('SELECT * FROM running_sessions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO running_sessions (user_id, name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [user_id || 1, name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE running_sessions SET name=$1, distance=$2, duration=$3, pace=$4, heart_rate_avg=$5, heart_rate_max=$6, elevation_gain=$7, calories=$8, terrain=$9, weather=$10, notes=$11 WHERE id=$12 RETURNING *',
      [name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('DELETE FROM running_sessions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
