// Biometric integration: stream HR, VO2 max, sleep from wearables.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// POST /api/biometric-ingest/samples { source, samples:[{ts, hr_bpm, vo2_max, sleep_minutes, hrv_ms}] }
router.post('/samples', authenticateToken, async (req, res) => {
  try {
    const { source = 'manual', samples = [] } = req.body || {};
    if (!Array.isArray(samples) || !samples.length) return res.status(400).json({ error: 'samples[] required' });
    // TODO: configure credentials — OURA_API_KEY / GARMIN_API_KEY / FITBIT_API_KEY for live pull
    const pool = req.app.locals.pool;
    let inserted = 0;
    for (const s of samples.slice(0, 1000)) {
      try {
        await pool.query(
          `INSERT INTO biometric_samples (user_id, source, ts, hr_bpm, vo2_max, sleep_minutes, hrv_ms) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [req.user.id, source, s.ts || new Date(), s.hr_bpm || null, s.vo2_max || null, s.sleep_minutes || null, s.hrv_ms || null]
        );
        inserted++;
      } catch { break; }
    }
    return res.json({ source, submitted: samples.length, inserted });
  } catch (e) {
    return res.status(500).json({ error: 'ingest failed' });
  }
});

// GET /api/biometric-ingest/recovery-score?days=7
router.get('/recovery-score', authenticateToken, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    const pool = req.app.locals.pool;
    const r = await pool.query(`SELECT AVG(hrv_ms) AS hrv, AVG(sleep_minutes) AS sleep FROM biometric_samples WHERE user_id = $1 AND ts > NOW() - INTERVAL '1 day' * $2`, [req.user.id, days]).catch(() => ({ rows: [{}] }));
    const hrv = Number(r.rows[0].hrv) || 0;
    const sleep = Number(r.rows[0].sleep) || 0;
    const score = Math.min(100, hrv * 1.2 + (sleep / 60) * 5);
    return res.json({ days, avg_hrv_ms: Math.round(hrv), avg_sleep_minutes: Math.round(sleep), recovery_score: Math.round(score) });
  } catch (e) {
    return res.status(500).json({ error: 'recovery failed' });
  }
});

module.exports = router;
