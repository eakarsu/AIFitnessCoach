const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const tableMap = {
  workouts: { table: 'workouts', columns: 'id, name, type, difficulty, duration, calories, created_at' },
  golf: { table: 'golf_swings', columns: 'id, name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes, created_at' },
  running: { table: 'running_sessions', columns: 'id, name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes, created_at' },
  team: { table: 'team_formations', columns: 'id, team_name, sport, formation, strategy, notes, created_at' },
  recovery: { table: 'recovery_plans', columns: 'id, name, recovery_type, duration, intensity, sleep_hours, notes, created_at' }
};

// Export data as JSON or CSV
router.get('/:type', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { type } = req.params;
  const format = req.query.format || 'json';

  const config = tableMap[type];
  if (!config) {
    return res.status(400).json({ error: 'Invalid export type. Use: workouts, golf, running, team, recovery' });
  }

  try {
    const result = await pool.query(
      `SELECT ${config.columns} FROM ${config.table} WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    if (format === 'csv') {
      const rows = result.rows;
      if (rows.length === 0) {
        return res.status(200).send('No data to export');
      }

      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(',')];

      for (const row of rows) {
        const values = headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"` : str;
        });
        csvLines.push(values.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
      return res.send(csvLines.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_export.json`);
    res.json({ type, exportedAt: new Date().toISOString(), count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
