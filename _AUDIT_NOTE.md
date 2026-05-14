# Audit Apply Notes — AIFitnessCoach

Audit source: `_AUDIT/reports/batch_03.md` (#31). Verdict: partial-build (18 routes, 5 AI endpoints).

## Original recommendations

Missing AI counterparts:
- `/nutrition-recommend`
- `/injury-prevent`
- `/motivation`
- `/form-correct` (video — not mechanical without vision pipeline)

Missing non-AI: wearables integrations, social, nutrition tracking, meal planning, coach marketplace, payments.

## Implementations applied

Added three AI endpoints to `server/routes/ai.js`:

1. `POST /api/ai/nutrition/recommend` — daily nutrition plan (kcal/macros/meals/hydration/disclaimer). Best-effort persistence to a `nutrition_plans` table; graceful when table absent.
2. `POST /api/ai/injury/prevent` — sport-specific injury-prevention plan with screening tests, mobility, load management, red flags.
3. `POST /api/ai/motivation` — short motivational message + 3 actionable steps, body-neutral.

All match existing `callOpenRouter` style and protected by `authenticateToken` (rate-limited via existing `app.use('/api/ai', aiLimiter)`). Syntax-checked with `node --check`.

## Backlog (prioritized)

### Mechanical (later passes)
- `/form-correct` text version — accept exercise + symptoms text and return form cues (vision out of scope).

### Needs creds / external
- Apple Watch / Fitbit / Garmin / Whoop integrations.
- Stripe for coach marketplace payments.

### Needs product decision
- Coach marketplace economics (commission, ratings, dispute).
- Social features architecture (challenges, leaderboards).

### Custom features (larger)
- Video form-correction pipeline (multi-modal model).
- Predictive performance projections from wearable data.
- Group challenges + leaderboards.

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- `client/src/components/AIInsights.js` exposes the 5 aiNew endpoints (periodization, performance-trend, injury-risk, nutrition-plan, team-challenge).
- `client/src/components/AICoachAdvisor.js` exposes the 3 pass-2 endpoints (`/api/ai/nutrition/recommend`, `/api/ai/injury/prevent`, `/api/ai/motivation`).
- Both routed in `client/src/App.js` (`/ai-insights`, `/ai-coach-advisor`). JWT handled via the shared `services/api` instance.
- No FE files modified.

## Apply pass 4 (mechanical backlog)

Implemented the one remaining mechanical backlog item from "Mechanical (later passes)":

- `POST /api/ai/form-correct` — text-mode form correction. Accepts `exercise`, `experience_level`, `symptoms`, `self_description`, `equipment`, `notes`; returns structured cues, corrective drills, and red flags via `callOpenRouter`. Emits `503` with `error: 'AI provider not configured'` when `OPENROUTER_API_KEY` is missing (matches the helper's exception text). Other failures continue to 500. (`server/routes/ai.js`).
- `client/src/components/AICoachAdvisor.js` — added a fourth tab (`Form Correct (Text)`) using the same `form-row` / `btn-ai` / `ai-analysis` styling and the existing JWT-bearing `services/api` axios instance.

Smoke test: started server on alt port 3911 with `OPENROUTER_API_KEY=""`, logged in as `demo@aifitness.com`, `POST /api/ai/form-correct` returned `503 {"error":"AI provider not configured", ...}`. Server then stopped.

No new dependencies. `node --check` and Babel JSX parse both clean.
