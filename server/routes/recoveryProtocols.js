// Recovery protocols: personalised recovery (ice bath, massage, stretching).
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const PROTOCOLS = {
  heavy_lifting: ['10min ice bath', '15min foam rolling', '8h sleep target', 'protein 30g within 60min'],
  high_intensity_cardio: ['10min cool down jog', 'static stretch 15min', 'electrolytes', '8h sleep target'],
  long_endurance: ['compression boots 30min', 'carb refill 1g/kg', '15min massage gun', 'magnesium 400mg'],
  technique: ['light mobility 20min', 'visualisation 10min'],
};

// POST /api/recovery-protocols/recommend { workout_type, duration_minutes, intensity_rpe }
router.post('/recommend', authenticateToken, (req, res) => {
  const { workout_type, duration_minutes = 0, intensity_rpe = 5 } = req.body || {};
  if (!workout_type) return res.status(400).json({ error: 'workout_type required' });
  const base = PROTOCOLS[workout_type] || PROTOCOLS.technique;
  const augmented = [...base];
  if (Number(intensity_rpe) >= 8) augmented.push('contrast bath ×3');
  if (Number(duration_minutes) >= 90) augmented.push('extra 30min nap');
  return res.json({ workout_type, recovery_steps: augmented });
});

module.exports = router;
