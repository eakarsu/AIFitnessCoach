// integrations.js — pass-5 backlog implementation for AIFitnessCoach.
//
// NEEDS-CREDS endpoints for wearable + payments integrations.  All routes
// gate on env vars and return 503 + `missing: <ENV>` when unset.
//
// Required env vars (at least one of the wearables + Stripe for payments):
//   APPLE_HEALTH_CLIENT_ID, APPLE_HEALTH_CLIENT_SECRET
//   FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET
//   GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET
//   WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET
//   STRIPE_SECRET_KEY  (for payments / coach marketplace)
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const WEARABLE_ENVS = {
  apple_health: ['APPLE_HEALTH_CLIENT_ID', 'APPLE_HEALTH_CLIENT_SECRET'],
  fitbit: ['FITBIT_CLIENT_ID', 'FITBIT_CLIENT_SECRET'],
  garmin: ['GARMIN_CONSUMER_KEY', 'GARMIN_CONSUMER_SECRET'],
  whoop: ['WHOOP_CLIENT_ID', 'WHOOP_CLIENT_SECRET'],
};

async function ensureTables(pool) {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wearable_sync_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      provider VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_intents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      amount_cents INTEGER NOT NULL,
      currency VARCHAR(8) NOT NULL DEFAULT 'usd',
      purpose VARCHAR(64),
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      provider_id VARCHAR(128),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}

// GET /api/integrations/_/status — capability discovery (no creds required)
router.get('/_/status', authenticateToken, (req, res) => {
  const wearables = Object.fromEntries(Object.entries(WEARABLE_ENVS).map(([k, envs]) => [
    k,
    {
      configured: envs.every(e => !!process.env[e]),
      missing: envs.filter(e => !process.env[e]),
    },
  ]));
  res.json({
    wearables,
    payments: {
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        missing: process.env.STRIPE_SECRET_KEY ? [] : ['STRIPE_SECRET_KEY'],
      },
    },
  });
});

// POST /api/integrations/wearable/sync — gate on chosen provider env vars
router.post('/wearable/sync', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  const { provider } = req.body || {};
  if (!provider || !WEARABLE_ENVS[provider]) {
    return res.status(400).json({ error: 'provider must be one of: ' + Object.keys(WEARABLE_ENVS).join(', ') });
  }
  const envs = WEARABLE_ENVS[provider];
  const missing = envs.filter(e => !process.env[e]);
  if (missing.length) {
    return res.status(503).json({ error: `${provider} not configured`, missing });
  }
  try {
    const r = await pool.query(
      `INSERT INTO wearable_sync_log (user_id, provider, status, details)
       VALUES ($1,$2,'queued',$3) RETURNING id, provider, status, created_at`,
      [req.user.id, provider, JSON.stringify({ note: 'Credentials present; sync queued (no outbound HTTP in stub)' })]
    );
    res.status(202).json({ success: true, sync: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/integrations/wearable/log — list syncs for current user
router.get('/wearable/log', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const r = await pool.query(
      `SELECT id, provider, status, created_at FROM wearable_sync_log
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/integrations/payments/checkout — Stripe-style checkout intent stub
// (also mounted at /api/payments/checkout via index.js for FE convenience).
router.post('/payments/checkout', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  await ensureTables(pool);
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured', missing: ['STRIPE_SECRET_KEY'] });
  }
  const { amount_cents, currency = 'usd', purpose = 'coach_session' } = req.body || {};
  if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive integer' });
  }
  try {
    const provider_id = `pi_stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const r = await pool.query(
      `INSERT INTO payment_intents (user_id, amount_cents, currency, purpose, status, provider_id)
       VALUES ($1,$2,$3,$4,'requires_payment_method',$5)
       RETURNING id, amount_cents, currency, purpose, status, provider_id, created_at`,
      [req.user.id, amount_cents, currency, purpose, provider_id]
    );
    // PRODUCT-DECISION: do NOT call Stripe directly here — return a stub
    // intent so the FE can render a checkout button.  Future delivery
    // worker will exchange this for a real Stripe PaymentIntent.
    res.status(202).json({
      success: true,
      intent: r.rows[0],
      note: 'Stub PaymentIntent — replace with real Stripe call in future delivery worker.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
