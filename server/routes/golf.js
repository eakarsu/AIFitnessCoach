const express = require('express');
const router = express.Router();

// Get all golf swings (with search & pagination)
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM golf_swings';
    let countQuery = 'SELECT COUNT(*) FROM golf_swings';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' WHERE (name ILIKE $1 OR club_type ILIKE $1 OR notes ILIKE $1)';
      countQuery += ' WHERE (name ILIKE $1 OR club_type ILIKE $1 OR notes ILIKE $1)';
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
    console.error('Error fetching golf swings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('SELECT * FROM golf_swings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Golf swing not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO golf_swings (user_id, name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [user_id || 1, name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE golf_swings SET name=$1, club_type=$2, swing_speed=$3, ball_speed=$4, launch_angle=$5, spin_rate=$6, carry_distance=$7, total_distance=$8, notes=$9 WHERE id=$10 RETURNING *',
      [name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes, req.params.id]
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
    const result = await pool.query('DELETE FROM golf_swings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
