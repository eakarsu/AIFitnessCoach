# Apply Pass 5 — AIFitnessCoach

- **Date:** 2026-05-08
- **Audit source:** `_AUDIT/reports/batch_03.md` (#31)
- **Stack:** Node.js Express + CRA-React.
- **Action:** VERIFIED + small FE addition to surface previously orphaned BE endpoints.

## Verified-present (audit "missing AI counterparts")

| Recommended | Status | Path |
|---|---|---|
| `/nutrition-recommend` | DONE pre-pass5 | `server/routes/ai.js:270` |
| `/injury-prevent` | DONE pre-pass5 | `server/routes/ai.js:339` |
| `/motivation` | DONE pre-pass5 | `server/routes/ai.js:439` |
| `/form-correct` (text) | DONE pre-pass5 | `server/routes/ai.js:387` |
| Periodization, performance trend, injury-risk, nutrition plan, team challenge, performance projection | DONE pre-pass5 | `server/routes/aiNew.js` |

## Verified-present (audit "missing non-AI features")

| Recommended | Status | Path |
|---|---|---|
| Wearables (Apple Health/Fitbit/Garmin/Whoop) | STUBBED pre-pass5 | `server/routes/integrations.js` (env-gated, 503 on missing) |
| Stripe payments | STUBBED pre-pass5 | `server/routes/integrations.js /payments/checkout` |
| Coach marketplace | DONE pre-pass5 | `server/routes/marketplace.js /listings`, `/disputes` |
| Group challenges | DONE pre-pass5 | `server/routes/marketplace.js /challenges`, `/challenges/:id/leaderboard` |

## Implemented this pass (1 FE delta)

1. **FE wiring of integrations + marketplace** — `client/src/components/IntegrationsAndMarketplace.js`, route `/integrations-marketplace` (added in `client/src/App.js`).
   - Loads `/api/integrations/_/status` to discover wearable + Stripe creds presence.
   - Triggers wearable sync, surfaces 503 + missing-env messages cleanly.
   - Stripe checkout with amount/purpose; surfaces `missing: ['STRIPE_SECRET_KEY']`.
   - Marketplace listings + group challenges (load + create).

This was a pre-existing orphan: BE routes had been added by an earlier pass-5 wave but had no FE entry point. Now wired.

## Deferred

- **NEEDS-CREDS:** Real OAuth flows for each wearable provider; Stripe checkout session creation. Currently capability-discovery + 503 stubs.
- **NEEDS-PRODUCT-DECISION:** Full social feed + leaderboards UX — list + create endpoints exist, ranking + privacy controls outstanding.
- **NEEDS-PRODUCT-DECISION:** Coach dispute workflow (status states, admin review) — endpoint exists, lifecycle not modeled.
- **TOO-RISKY:** Real video form-correction (multi-modal). Out of scope.

## Smoke test

- `node --check server/routes/ai.js`, `aiNew.js`, `integrations.js`, `marketplace.js`, `index.js` — PASS (existing files).
- New FE component is JSX (CRA-built); App.js import + route additions match existing pattern.
- No new BE files this pass.

## Notes

`_AUDIT_NOTE.md` already records pass-2 + pass-4 work. The integrations + marketplace BE were added some time after pass-4; pass-5 closes the loop by giving them a FE.
