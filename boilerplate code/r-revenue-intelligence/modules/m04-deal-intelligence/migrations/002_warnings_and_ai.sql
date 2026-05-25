-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Warnings, AI, and Dataset Upload
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Warnings (generic deal warnings, pre-Deal Drivers) ───────────────────────
CREATE TABLE IF NOT EXISTS deal_warnings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  message     TEXT,
  severity    VARCHAR(20) NOT NULL DEFAULT 'medium',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_deal_warnings_deal ON deal_warnings(deal_id);

-- ─── AI / LLM call log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_call_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  model        VARCHAR(100) NOT NULL,
  prompt_hash  VARCHAR(64),
  tokens_in    INT,
  tokens_out   INT,
  latency_ms   INT,
  status       VARCHAR(20) NOT NULL DEFAULT 'ok',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Dataset Upload ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dataset_uploads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by  UUID NOT NULL REFERENCES users(id),
  filename     VARCHAR(500) NOT NULL,
  file_size    BIGINT,
  row_count    INT,
  status       VARCHAR(30) NOT NULL DEFAULT 'processing',
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
