const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Training Load Balance',
    summary: { athletesReviewed: 28, overloadRisk: 5, deloadRecommended: 4, recoveryGreen: 17 },
    loadBands: [
      { band: 'Acute spike', ratio: '1.45+', guidance: 'Reduce intensity and increase recovery monitoring' },
      { band: 'Productive load', ratio: '0.85-1.25', guidance: 'Maintain planned progression' },
      { band: 'Underloaded', ratio: '<0.75', guidance: 'Add low-risk volume or skill work' }
    ],
    athletes: [
      { name: 'Avery Stone', sport: 'Running', acuteChronicRatio: 1.52, risk: 'overload', action: 'Replace interval session with aerobic recovery' },
      { name: 'Mika Tan', sport: 'Golf', acuteChronicRatio: 1.18, risk: 'productive', action: 'Keep swing volume and add mobility block' },
      { name: 'Jordan Lee', sport: 'Team', acuteChronicRatio: 0.68, risk: 'underloaded', action: 'Add controlled acceleration work' }
    ]
  });
});

module.exports = router;
