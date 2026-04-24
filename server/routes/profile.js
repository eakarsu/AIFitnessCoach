const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { profileValidation } = require('../middleware/validate');

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      'SELECT p.*, u.name, u.email FROM user_profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      // Create default profile if doesn't exist
      await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [req.user.id]);
      const newResult = await pool.query(
        'SELECT p.*, u.name, u.email FROM user_profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1',
        [req.user.id]
      );
      return res.json(newResult.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', authenticateToken, profileValidation.update, async (req, res) => {
  const pool = req.app.locals.pool;
  const { height, weight, age, fitness_level, gender, goals, injuries, avatar_url, onboarding_complete } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO user_profiles (user_id, height, weight, age, fitness_level, gender, goals, injuries, avatar_url, onboarding_complete, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       height = COALESCE($2, user_profiles.height),
       weight = COALESCE($3, user_profiles.weight),
       age = COALESCE($4, user_profiles.age),
       fitness_level = COALESCE($5, user_profiles.fitness_level),
       gender = COALESCE($6, user_profiles.gender),
       goals = COALESCE($7, user_profiles.goals),
       injuries = COALESCE($8, user_profiles.injuries),
       avatar_url = COALESCE($9, user_profiles.avatar_url),
       onboarding_complete = COALESCE($10, user_profiles.onboarding_complete),
       updated_at = NOW()
       RETURNING *`,
      [req.user.id, height, weight, age, fitness_level, gender, goals, injuries, avatar_url, onboarding_complete]
    );

    // Also update name if provided
    if (req.body.name) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [req.body.name, req.user.id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
