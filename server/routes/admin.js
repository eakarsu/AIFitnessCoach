const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [users, workouts, golf, running, teams, recovery, feedback] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM workouts'),
      pool.query('SELECT COUNT(*) as count FROM golf_swings'),
      pool.query('SELECT COUNT(*) as count FROM running_sessions'),
      pool.query('SELECT COUNT(*) as count FROM team_formations'),
      pool.query('SELECT COUNT(*) as count FROM recovery_plans'),
      pool.query("SELECT COUNT(*) as count FROM feedback WHERE status = 'open'")
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalWorkouts: parseInt(workouts.rows[0].count),
      totalGolfSwings: parseInt(golf.rows[0].count),
      totalRunningSessions: parseInt(running.rows[0].count),
      totalTeamFormations: parseInt(teams.rows[0].count),
      totalRecoveryPlans: parseInt(recovery.rows[0].count),
      openFeedback: parseInt(feedback.rows[0].count),
      uptime: `${Math.floor(process.uptime() / 60)}m`,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      'SELECT a.*, u.name as user_name, u.email as user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
