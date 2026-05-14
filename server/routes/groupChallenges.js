// Group challenges: fitness challenges with leaderboards, team competitions.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// POST /api/group-challenges/create { name, metric, target, end_date, member_ids:[] }
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, metric, target, end_date, member_ids = [] } = req.body || {};
    if (!name || !metric || !target || !end_date) return res.status(400).json({ error: 'name, metric, target, end_date required' });
    const pool = req.app.locals.pool;
    try {
      const r = await pool.query(`INSERT INTO group_challenges (name, metric, target, end_date, owner_id, members, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`, [name, metric, Number(target), new Date(end_date), req.user.id, JSON.stringify(member_ids)]);
      return res.json({ id: r.rows[0].id, name, metric, target });
    } catch (e) {
      return res.status(500).json({ error: 'group_challenges table missing' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'create failed' });
  }
});

// GET /api/group-challenges/:id/leaderboard
router.get('/:id/leaderboard', authenticateToken, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const r = await pool.query(`SELECT user_id, SUM(value) AS total FROM challenge_contributions WHERE challenge_id = $1 GROUP BY user_id ORDER BY total DESC LIMIT 50`, [req.params.id]).catch(() => ({ rows: [] }));
    return res.json({ challenge_id: req.params.id, leaderboard: r.rows });
  } catch (e) {
    return res.status(500).json({ error: 'leaderboard failed' });
  }
});

module.exports = router;
