const express = require('express');
const router = express.Router();

// Get all recovery plans (with search & pagination)
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM recovery_plans';
    let countQuery = 'SELECT COUNT(*) FROM recovery_plans';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' WHERE (name ILIKE $1 OR recovery_type ILIKE $1 OR intensity ILIKE $1 OR notes ILIKE $1)';
      countQuery += ' WHERE (name ILIKE $1 OR recovery_type ILIKE $1 OR intensity ILIKE $1 OR notes ILIKE $1)';
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
    console.error('Error fetching recovery plans:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('SELECT * FROM recovery_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, recovery_type, duration, intensity, activities, nutrition, sleep_hours, notes, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO recovery_plans (user_id, name, recovery_type, duration, intensity, activities, nutrition, sleep_hours, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [user_id || 1, name, recovery_type, duration, intensity, JSON.stringify(activities), JSON.stringify(nutrition), sleep_hours, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, recovery_type, duration, intensity, activities, nutrition, sleep_hours, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE recovery_plans SET name=$1, recovery_type=$2, duration=$3, intensity=$4, activities=$5, nutrition=$6, sleep_hours=$7, notes=$8 WHERE id=$9 RETURNING *',
      [name, recovery_type, duration, intensity, JSON.stringify(activities), JSON.stringify(nutrition), sleep_hours, notes, req.params.id]
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
    const result = await pool.query('DELETE FROM recovery_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
