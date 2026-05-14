// Form analysis via video: upload exercise frames, detect form issues.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

async function analyseFrame(image_url, base64, exercise) {
  // TODO: configure credentials — OPENAI_API_KEY (vision)
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const content = [
    { type: 'text', text: `Inspect a ${exercise} form. Output JSON {"issues":["..."],"good_points":["..."],"correction_drill":"..."}.` },
    image_url ? { type: 'image_url', image_url: { url: image_url } } : { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
  ];
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content }], max_tokens: 400 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.choices?.[0]?.message?.content;
}

// POST /api/form-analysis/analyse { exercise, image_url? base64? }
router.post('/analyse', authenticateToken, async (req, res) => {
  try {
    const { exercise = 'squat', image_url, image_base64 } = req.body || {};
    if (!image_url && !image_base64) return res.status(400).json({ error: 'image required' });
    const raw = await analyseFrame(image_url, image_base64, exercise);
    if (!raw) return res.status(503).json({ error: 'Vision API not configured' });
    let parsed;
    try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    return res.json({ exercise, analysis: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'analyse failed' });
  }
});

module.exports = router;
