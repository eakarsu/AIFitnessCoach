const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { feedbackValidation } = require('../middleware/validate');

// Get all feedback for user
router.get('/', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM feedback WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM feedback WHERE user_id = $1';
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (search) {
      query += ' AND (subject ILIKE $2 OR message ILIKE $2)';
      countQuery += ' AND (subject ILIKE $2 OR message ILIKE $2)';
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
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create feedback
router.post('/', authenticateToken, feedbackValidation.create, async (req, res) => {
  const pool = req.app.locals.pool;
  const { type, subject, message } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO feedback (user_id, type, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, type, subject, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating feedback:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete feedback
router.delete('/:id', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    await pool.query('DELETE FROM feedback WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
