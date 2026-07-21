CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_active
  ON password_reset_tokens(user_id, used, expires_at DESC);

CREATE TABLE IF NOT EXISTS coaching_intakes (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_event_id VARCHAR(160) NOT NULL,
  goal JSONB NOT NULL,
  constraints JSONB NOT NULL,
  consent JSONB NOT NULL,
  provenance JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, client_event_id)
);

CREATE TABLE IF NOT EXISTS coaching_plans (
  id BIGSERIAL PRIMARY KEY,
  intake_id BIGINT NOT NULL UNIQUE REFERENCES coaching_intakes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ruleset_version VARCHAR(120) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft','professional_review_required','emergency_boundary','user_accepted','coach_approved','rejected','paused')),
  professional_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  decision JSONB NOT NULL,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching_session_logs (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES coaching_plans(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_event_id VARCHAR(160) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  feedback JSONB NOT NULL,
  adaptation JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, client_event_id)
);

CREATE TABLE IF NOT EXISTS coaching_audit_events (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id BIGINT REFERENCES coaching_plans(id),
  action VARCHAR(80) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_plans_owner_status ON coaching_plans(user_id, status, created_at DESC);
