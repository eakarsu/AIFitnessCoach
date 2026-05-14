// Agentic fitness coach: long-term goal → personalised workout, nutrition,
// recovery plan with daily coaching.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../utils/openrouter');

// POST /api/agentic-coach/plan { goal, weeks, current_state }
router.post('/plan', authenticateToken, async (req, res) => {
  try {
    const { goal, weeks = 12, current_state = {} } = req.body || {};
    if (!goal) return res.status(400).json({ error: 'goal required' });
    const system = 'You are a personal training coach. Produce a weekly plan and daily coaching message template. Output JSON {"weeks":[{"week":int,"focus":"...","workouts_per_week":int,"nutrition_target":"...","recovery_target":"..."}],"daily_coaching_template":"..."}.';
    let parsed;
    try {
      const raw = await callOpenRouter(system, JSON.stringify({ goal, weeks, current_state }));
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }
    return res.json({ goal, weeks, plan: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'plan failed' });
  }
});

module.exports = router;
