-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Core Schema
-- Users, Boards, Deals — foundation tables used by all modules
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Roles enum ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('sales_rep','sales_manager','cro','revops','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          user_role_enum NOT NULL DEFAULT 'sales_rep',
  segment       VARCHAR(100),                          -- e.g. 'Mid-market AE', 'SMB AE'
  manager_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Boards ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_type    VARCHAR(50) NOT NULL DEFAULT 'pipeline',  -- pipeline | commit | early_stage
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id);

-- Board access permissions
CREATE TABLE IF NOT EXISTS board_permissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id       UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  principal_id   UUID NOT NULL,
  principal_type VARCHAR(20) NOT NULL DEFAULT 'user',   -- 'user' | 'team'
  permission     VARCHAR(20) NOT NULL DEFAULT 'read',   -- 'read' | 'write' | 'admin'
  UNIQUE (board_id, principal_id, principal_type)
);
CREATE INDEX IF NOT EXISTS idx_bperm_board ON board_permissions(board_id);
CREATE INDEX IF NOT EXISTS idx_bperm_principal ON board_permissions(principal_id);

-- ─── Deals ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE deal_status_enum AS ENUM ('open','won','lost','stale');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS deals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name          VARCHAR(255) NOT NULL,
  owner_id              UUID NOT NULL REFERENCES users(id),
  board_id              UUID REFERENCES boards(id) ON DELETE SET NULL,
  value                 NUMERIC(15,2),
  currency              CHAR(3) NOT NULL DEFAULT 'USD',
  stage                 VARCHAR(100),
  status                deal_status_enum NOT NULL DEFAULT 'open',
  estimated_close_date  DATE,
  crm_id                VARCHAR(255),               -- external CRM reference
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_board ON deals(board_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(estimated_close_date);

-- ─── Activities ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  type        VARCHAR(50) NOT NULL,   -- 'call','email','meeting','note'
  subject     VARCHAR(500),
  body        TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- ─── Next Steps ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS next_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  due_date    DATE,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nextsteps_deal ON next_steps(deal_id);

-- ─── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id),
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_deal ON comments(deal_id);

-- ─── Tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID REFERENCES deals(id) ON DELETE CASCADE,
  assignee_id  UUID REFERENCES users(id),
  title        VARCHAR(500) NOT NULL,
  due_date     DATE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_deal ON tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

-- ─── Teams ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  manager_id  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS team_members (
  team_id  UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

-- ─── Targets ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS targets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  period      VARCHAR(20) NOT NULL,   -- 'Q1-2026'
  amount      NUMERIC(15,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Escalations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escalations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  raised_by   UUID NOT NULL REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      VARCHAR(30) NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_escalations_deal ON escalations(deal_id);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(500),
  body        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ─── Playbook ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playbooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  stage       VARCHAR(100),
  steps       JSONB NOT NULL DEFAULT '[]',
  created_by  UUID REFERENCES users(id),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CRM Sync ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_sync_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm         VARCHAR(50) NOT NULL,   -- 'salesforce','hubspot'
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  crm_id      VARCHAR(255),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  error       TEXT,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── user last-used board (Deal Drivers helper) ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_last_used_board (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
