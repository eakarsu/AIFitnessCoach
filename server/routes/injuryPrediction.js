// Injury prediction: detect overtraining, load-management recommendations.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// POST /api/injury-prediction/scan { acute_load_7d, chronic_load_28d }
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { acute_load_7d, chronic_load_28d } = req.body || {};
    if (acute_load_7d == null || chronic_load_28d == null) return res.status(400).json({ error: 'acute_load_7d + chronic_load_28d required' });
    const acwr = Number(chronic_load_28d) > 0 ? Number(acute_load_7d) / (Number(chronic_load_28d) / 4) : 0;
    let risk = 'low';
    if (acwr > 1.5) risk = 'high';
    else if (acwr > 1.3) risk = 'elevated';
    else if (acwr < 0.8) risk = 'undertrained';
    return res.json({ acute_chronic_ratio: Math.round(acwr * 100) / 100, risk, recommendation: risk === 'high' ? 'reduce weekly load by 20%' : risk === 'elevated' ? 'maintain load, add recovery' : risk === 'undertrained' ? 'gradual ramp up' : 'optimal' });
  } catch (e) {
    return res.status(500).json({ error: 'scan failed' });
  }
});

module.exports = router;
