-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007: Deal Drivers
-- New tables for the Deal Drivers feature (m04-deal-intelligence)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enum for period
DO $$ BEGIN
  CREATE TYPE deal_drivers_period_enum AS ENUM ('NOW', 'LAST_30_DAYS', 'LAST_90_DAYS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Deal boards for Deal Drivers ────────────────────────────────────────────
-- (Re-uses boards table from migration 002, adds deal_board_type and board_warnings)

-- Warning definitions (catalog)
CREATE TABLE IF NOT EXISTS deal_warning_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           VARCHAR(100) UNIQUE NOT NULL,    -- e.g. 'no_next_step'
  label         VARCHAR(255) NOT NULL,            -- e.g. 'No next step'
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dwd_key ON deal_warning_definitions(key);

-- Board ↔ Warning join (which warnings are enabled on a board)
CREATE TABLE IF NOT EXISTS board_warning_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  warning_id  UUID NOT NULL REFERENCES deal_warning_definitions(id) ON DELETE CASCADE,
  sort_order  INT NOT NULL DEFAULT 0,
  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (board_id, warning_id)
);

CREATE INDEX IF NOT EXISTS idx_bwc_board ON board_warning_config(board_id);

-- ─── Deal open/close tracking for denominator calculation ─────────────────────
-- Tracks when a deal was open (for ≥24h qualifying rule)
CREATE TABLE IF NOT EXISTS deal_lifecycle (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  rep_id      UUID NOT NULL REFERENCES users(id),
  board_id    UUID NOT NULL REFERENCES boards(id),
  opened_at   TIMESTAMPTZ NOT NULL,
  closed_at   TIMESTAMPTZ,                        -- NULL = still open
  UNIQUE (deal_id, rep_id, board_id, opened_at)  -- prevent dupes
);

CREATE INDEX IF NOT EXISTS idx_dl_deal ON deal_lifecycle(deal_id);
CREATE INDEX IF NOT EXISTS idx_dl_rep ON deal_lifecycle(rep_id);
CREATE INDEX IF NOT EXISTS idx_dl_board ON deal_lifecycle(board_id);
CREATE INDEX IF NOT EXISTS idx_dl_open ON deal_lifecycle(opened_at);
CREATE INDEX IF NOT EXISTS idx_dl_closed ON deal_lifecycle(closed_at);

-- ─── Deal reassignments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_reassignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_rep_id     UUID NOT NULL REFERENCES users(id),
  to_rep_id       UUID NOT NULL REFERENCES users(id),
  reassigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dr_deal ON deal_reassignments(deal_id);
CREATE INDEX IF NOT EXISTS idx_dr_from_rep ON deal_reassignments(from_rep_id);
CREATE INDEX IF NOT EXISTS idx_dr_reassigned_at ON deal_reassignments(reassigned_at);

-- ─── Warning activation events ────────────────────────────────────────────────
-- Append-only log: ACTIVE / RESOLVED transitions per deal × warning
CREATE TABLE IF NOT EXISTS deal_warning_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id       UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  warning_id    UUID NOT NULL REFERENCES deal_warning_definitions(id),
  status        VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'RESOLVED')),
  triggered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dwe_deal ON deal_warning_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_dwe_warning ON deal_warning_events(warning_id);
CREATE INDEX IF NOT EXISTS idx_dwe_deal_warning_time
  ON deal_warning_events(deal_id, warning_id, triggered_at ASC);

-- ─── Last used board per user ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_last_used_board (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Manager hierarchy ────────────────────────────────────────────────────────
-- Adds manager_id to users if not already present
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS segment VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id) WHERE manager_id IS NOT NULL;

-- ─── Seed: default warning definitions ───────────────────────────────────────
INSERT INTO deal_warning_definitions (key, label, description) VALUES
  ('no_next_step',    'No next step',      'Deal has no scheduled next step or follow-up action'),
  ('single_threaded', 'Single-threaded',   'Only one contact engaged at the prospect organisation'),
  ('no_close_plan',   'No close plan',     'No mutual close plan or success plan documented'),
  ('stale_14d',       'Stale >14d',        'No activity recorded in the last 14 days'),
  ('champion_left',   'Champion left',     'Primary champion has left the organisation'),
  ('no_discovery',    'No discovery',      'Key discovery questions unanswered (MEDDICC gap)')
ON CONFLICT (key) DO NOTHING;
