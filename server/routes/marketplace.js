// marketplace.js — pass-5 backlog implementation for AIFitnessCoach.
//
// NEEDS-PRODUCT-DECISION: coach marketplace economics, social challenges.
// Defaults documented inline:
//   - Marketplace commission = 15 % platform fee, 85 % to coach
//   - Reviews use 1-5 star rating + free-text comment
//   - Disputes are an `open|resolved|escalated` state with no SLA enforcement
//   - Challenges support solo/group with leaderboard via SUM(progress_units)
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const PLATFORM_FEE_PCT = 15; // PRODUCT-DECISION: 15% platform fee

async function ensureTables(pool) {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_listings (
      id SERIAL PRIMARY KEY,
      coach_user_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      hourly_rate_cents INTEGER NOT NULL DEFAULT 0,
      specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_reviews (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER NOT NULL,
      reviewer_user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_disputes (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER,
      raised_by_user_id INTEGER NOT NULL,
      against_user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(16) DEFAULT 'open' CHECK (status IN ('open','resolved','escalated')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      owner_user_id INTEGER NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      mode VARCHAR(16) DEFAULT 'group' CHECK (mode IN ('solo','group')),
      goal_units INTEGER DEFAULT 0,
      starts_on DATE,
      ends_on DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS challenge_progress (
      id SERIAL PRIMARY KEY,
      challenge_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      units INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}

// ─── Listings ──────────────────────────────────────────────────────────────
router.get('/listings', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  try {
    const r = await pool.query(
      `SELECT cl.*,
              COALESCE(AVG(cr.rating)::numeric(3,2), NULL) AS avg_rating,
              COUNT(cr.id) AS review_count
       FROM coach_listings cl
       LEFT JOIN coach_reviews cr ON cr.listing_id = cl.id
       WHERE cl.active = TRUE
       GROUP BY cl.id
       ORDER BY cl.created_at DESC LIMIT 200`
    );
    res.json({ commission_pct: PLATFORM_FEE_PCT, listings: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/listings', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  const { title, description, hourly_rate_cents, specialties } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  try {
    const r = await pool.query(
      `INSERT INTO coach_listings (coach_user_id, title, description, hourly_rate_cents, specialties)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, title, description || null, parseInt(hourly_rate_cents || 0), Array.isArray(specialties) ? specialties : []]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Reviews ───────────────────────────────────────────────────────────────
router.post('/listings/:id/reviews', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  const { rating, comment } = req.body || {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer 1..5' });
  }
  try {
    const r = await pool.query(
      `INSERT INTO coach_reviews (listing_id, reviewer_user_id, rating, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, rating, comment || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Disputes ──────────────────────────────────────────────────────────────
router.post('/disputes', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  const { listing_id, against_user_id, reason } = req.body || {};
  if (!against_user_id || !reason) return res.status(400).json({ error: 'against_user_id and reason required' });
  try {
    const r = await pool.query(
      `INSERT INTO coach_disputes (listing_id, raised_by_user_id, against_user_id, reason)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [listing_id || null, req.user.id, against_user_id, reason]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Challenges ────────────────────────────────────────────────────────────
router.get('/challenges', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  try {
    const r = await pool.query(`SELECT * FROM challenges ORDER BY created_at DESC LIMIT 100`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/challenges', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  const { name, description, mode = 'group', goal_units = 0, starts_on, ends_on } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const r = await pool.query(
      `INSERT INTO challenges (owner_user_id, name, description, mode, goal_units, starts_on, ends_on)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name, description || null, mode, parseInt(goal_units || 0), starts_on || null, ends_on || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/challenges/:id/progress', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  const { units } = req.body || {};
  if (!Number.isInteger(units) || units <= 0) return res.status(400).json({ error: 'units must be positive integer' });
  try {
    const r = await pool.query(
      `INSERT INTO challenge_progress (challenge_id, user_id, units)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, units]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/challenges/:id/leaderboard', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  try {
    const r = await pool.query(
      `SELECT user_id, SUM(units)::int AS total_units, COUNT(*)::int AS log_entries
       FROM challenge_progress WHERE challenge_id = $1
       GROUP BY user_id ORDER BY total_units DESC LIMIT 100`,
      [req.params.id]
    );
    res.json({ challenge_id: req.params.id, leaderboard: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
