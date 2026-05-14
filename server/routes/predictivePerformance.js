// Predictive performance: project fitness improvements based on consistency.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/predictive-performance/projection?metric=run_5k&horizon_weeks=12
router.get('/projection', authenticateToken, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const metric = (req.query.metric || 'run_5k').toString();
    const horizon = Math.min(parseInt(req.query.horizon_weeks) || 12, 52);
    const r = await pool.query(
      `SELECT recorded_at AS ts, value FROM progress WHERE user_id = $1 AND metric = $2 ORDER BY recorded_at ASC LIMIT 60`,
      [req.user.id, metric]
    ).catch(() => ({ rows: [] }));
    if (r.rows.length < 3) return res.json({ metric, projection: [], note: 'need ≥3 data points' });
    const xs = r.rows.map((_, i) => i);
    const ys = r.rows.map(row => Number(row.value));
    const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const xm = mean(xs), ym = mean(ys);
    let num = 0, den = 0;
    for (let i = 0; i < xs.length; i++) { num += (xs[i] - xm) * (ys[i] - ym); den += Math.pow(xs[i] - xm, 2); }
    const slope = den ? num / den : 0;
    const intercept = ym - slope * xm;
    const projection = [];
    for (let w = 1; w <= horizon; w++) {
      const x = xs.length + w;
      projection.push({ week_ahead: w, projected: Math.round((intercept + slope * x) * 100) / 100 });
    }
    return res.json({ metric, slope: Math.round(slope * 1000) / 1000, projection });
  } catch (e) {
    return res.status(500).json({ error: 'projection failed' });
  }
});

module.exports = router;
