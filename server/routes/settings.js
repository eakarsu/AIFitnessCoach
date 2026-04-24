const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

// Get settings
router.get('/', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [req.user.id]);
      const newResult = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
      return res.json(newResult.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { theme, language, notifications_enabled, email_notifications, units, timezone } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, units, timezone, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       theme = COALESCE($2, user_settings.theme),
       language = COALESCE($3, user_settings.language),
       notifications_enabled = COALESCE($4, user_settings.notifications_enabled),
       email_notifications = COALESCE($5, user_settings.email_notifications),
       units = COALESCE($6, user_settings.units),
       timezone = COALESCE($7, user_settings.timezone),
       updated_at = NOW()
       RETURNING *`,
      [req.user.id, theme, language, notifications_enabled, email_notifications, units, timezone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, user.rows[0].password);

    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM user_settings WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM feedback WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM file_uploads WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM workouts WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM golf_swings WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM running_sessions WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM team_formations WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM recovery_plans WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
