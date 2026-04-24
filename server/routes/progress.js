const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get workout frequency (workouts per week)
router.get('/workouts', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      `SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as count,
              SUM(duration) as total_duration, SUM(calories) as total_calories
       FROM workouts WHERE user_id = $1 AND created_at > NOW() - INTERVAL '3 months'
       GROUP BY week ORDER BY week`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get running progress
router.get('/running', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      `SELECT id, name, distance, duration, pace, heart_rate_avg, calories, created_at
       FROM running_sessions WHERE user_id = $1
       ORDER BY created_at ASC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get golf progress
router.get('/golf', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      `SELECT id, name, club_type, swing_speed, ball_speed, carry_distance, total_distance, created_at
       FROM golf_swings WHERE user_id = $1
       ORDER BY created_at ASC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get overall stats
router.get('/stats', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [workouts, runs, golf, teams, recovery] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, SUM(duration) as total_duration, SUM(calories) as total_calories FROM workouts WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) as count, SUM(distance) as total_distance, SUM(calories) as total_calories FROM running_sessions WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) as count, AVG(swing_speed) as avg_speed, AVG(total_distance) as avg_distance FROM golf_swings WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) as count FROM team_formations WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) as count FROM recovery_plans WHERE user_id = $1', [req.user.id])
    ]);

    res.json({
      workouts: workouts.rows[0],
      running: runs.rows[0],
      golf: golf.rows[0],
      teams: teams.rows[0],
      recovery: recovery.rows[0]
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
