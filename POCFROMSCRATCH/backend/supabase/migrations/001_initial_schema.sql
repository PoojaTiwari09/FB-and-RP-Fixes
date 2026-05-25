-- ============================================================
-- CRM TABLES (populated by sync-once.ts from HubSpot)
-- ============================================================

CREATE TABLE crm_companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id          TEXT UNIQUE NOT NULL,
  local_id            TEXT,                        -- comp_01 etc., for dev reference
  name                TEXT NOT NULL,
  domain              TEXT,
  industry            TEXT,
  type                TEXT,                        -- Customer | New Business
  city                TEXT,
  country             TEXT,
  employee_count      INT,
  exit_arr            NUMERIC(12,2),
  segment             TEXT,                        -- Mid-Market | Enterprise | SMB
  board               TEXT,                        -- commercial | enterprise | smb
  assigned_rep_id     TEXT,                        -- references team member local ID
  hubspot_owner_id    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id          TEXT UNIQUE NOT NULL,
  local_id            TEXT,
  company_hubspot_id  TEXT REFERENCES crm_companies(hubspot_id),
  first_name          TEXT,
  last_name           TEXT,
  email               TEXT,
  phone               TEXT,
  job_title           TEXT,
  is_primary          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id          TEXT UNIQUE NOT NULL,
  local_id            TEXT,
  company_hubspot_id  TEXT REFERENCES crm_companies(hubspot_id),
  name                TEXT,
  stage               TEXT,
  amount              NUMERIC(12,2),
  adjusted_amount     NUMERIC(12,2),
  deal_type           TEXT,                        -- New Business | Renewal | Upsell | Cross-sell
  close_date          DATE,
  created_at_crm      TIMESTAMPTZ,
  assigned_rep_id     TEXT,
  primary_contact_hubspot_id TEXT,
  synced_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_activities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id          TEXT UNIQUE NOT NULL,
  local_id            TEXT,
  company_hubspot_id  TEXT REFERENCES crm_companies(hubspot_id),
  contact_hubspot_id  TEXT,
  deal_hubspot_id     TEXT,
  assigned_rep_id     TEXT,
  type                TEXT NOT NULL,               -- CALL | EMAIL | MEETING
  direction           TEXT,                        -- OUTBOUND | INBOUND | N/A
  timestamp           TIMESTAMPTZ NOT NULL,
  body                TEXT,

  -- Call-specific
  duration_seconds    INT,
  rep_talk_pct        NUMERIC(5,2),
  client_talk_pct     NUMERIC(5,2),
  call_outcome        TEXT,

  -- Email-specific
  subject             TEXT,
  snippet             TEXT,

  -- Meeting-specific
  title               TEXT,
  attendee_contact_ids JSONB,                      -- array of hubspot contact IDs

  synced_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPPLEMENTARY (seeded directly, not from HubSpot)
-- ============================================================

CREATE TABLE supplementary_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_hubspot_id  TEXT UNIQUE REFERENCES crm_companies(hubspot_id),
  manager_note        TEXT,
  next_qbr_date       DATE,
  ai_risk_score       INT CHECK (ai_risk_score BETWEEN 0 AND 100),
  risk_label          TEXT,                        -- High | Medium | Low
  strategic_priority  BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE todos_notes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_hubspot_id  TEXT REFERENCES crm_companies(hubspot_id),
  created_by_role     TEXT,                        -- rep | manager | admin
  type                TEXT NOT NULL,               -- todo | note
  content             TEXT NOT NULL,
  completed           BOOLEAN DEFAULT false,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOARD CONFIGURATION
-- ============================================================

CREATE TABLE board_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id            TEXT UNIQUE NOT NULL,        -- board_01 | board_02 | board_03
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,         -- commercial | enterprise | smb
  description         TEXT,
  default_sort_field  TEXT DEFAULT 'exit_arr',
  default_sort_dir    TEXT DEFAULT 'desc',
  date_filter_enabled BOOLEAN DEFAULT true,
  ai_briefs_enabled   BOOLEAN DEFAULT true,
  created_by          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE board_tabs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id              TEXT UNIQUE NOT NULL,         -- tab_01 etc.
  board_id            TEXT REFERENCES board_config(board_id),
  label               TEXT NOT NULL,
  "order"             INT NOT NULL,
  filter_logic        JSONB NOT NULL,               -- {operator, conditions[]}
  is_default          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE board_columns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  col_id              TEXT UNIQUE NOT NULL,          -- col_01 etc.
  board_id            TEXT REFERENCES board_config(board_id),
  field_key           TEXT NOT NULL,
  label               TEXT NOT NULL,
  "order"             INT NOT NULL,
  width               INT DEFAULT 150,
  sortable            BOOLEAN DEFAULT true,
  editable            BOOLEAN DEFAULT false,
  visible_to_roles    JSONB DEFAULT '["rep","manager","admin"]',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permission_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role                TEXT UNIQUE NOT NULL,          -- rep | manager | admin
  can_view_all_reps   BOOLEAN DEFAULT false,
  can_edit_board_config BOOLEAN DEFAULT false,
  can_edit_columns    BOOLEAN DEFAULT false,
  can_inline_edit     BOOLEAN DEFAULT true,
  can_view_ai_briefs  BOOLEAN DEFAULT true,
  can_trigger_sync    BOOLEAN DEFAULT false
);

-- ============================================================
-- SESSION & USER PREFERENCES
-- ============================================================

CREATE TABLE user_board_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_role        TEXT NOT NULL,                -- rep | manager | admin
  board_id            TEXT REFERENCES board_config(board_id),
  active_tab_id       TEXT,
  filters             JSONB DEFAULT '{}',
  sort_field          TEXT,
  sort_dir            TEXT,
  page_size           INT DEFAULT 20,
  additional_columns  JSONB DEFAULT '[]',           -- user-added column field_keys
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_role, board_id)
);

-- ============================================================
-- AI CACHE
-- ============================================================

CREATE TABLE ai_briefs_cache (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_hubspot_id  TEXT REFERENCES crm_companies(hubspot_id),
  scope               TEXT NOT NULL,                -- entire_account | deals_only
  period_days         INT NOT NULL,                 -- 90 | 180 | 0 (all time)
  brief_json          JSONB NOT NULL,               -- structured brief with citations
  generated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_hubspot_id, scope, period_days)
);

-- ============================================================
-- ENGAGEMENT AGGREGATES (computed view)
-- ============================================================

CREATE VIEW engagement_aggregates AS
SELECT
  ca.company_hubspot_id,
  COUNT(*) FILTER (WHERE ca.timestamp >= NOW() - INTERVAL '21 days') AS activities_21d,
  COUNT(*) FILTER (WHERE ca.type = 'CALL' AND ca.timestamp >= NOW() - INTERVAL '21 days') AS calls_21d,
  COUNT(*) FILTER (WHERE ca.type = 'EMAIL' AND ca.timestamp >= NOW() - INTERVAL '21 days') AS emails_21d,
  COUNT(*) FILTER (WHERE ca.type = 'MEETING' AND ca.timestamp >= NOW() - INTERVAL '21 days') AS meetings_21d,
  MAX(ca.timestamp) AS last_activity_date,
  EXTRACT(EPOCH FROM (NOW() - MAX(ca.timestamp))) / 86400 AS last_activity_days,
  CASE WHEN MAX(ca.timestamp) < NOW() - INTERVAL '21 days' THEN true ELSE false END AS zero_activity_flag,
  AVG(ca.rep_talk_pct) FILTER (WHERE ca.type = 'CALL') AS avg_rep_talk_pct,
  AVG(ca.client_talk_pct) FILTER (WHERE ca.type = 'CALL') AS avg_client_talk_pct
FROM crm_activities ca
WHERE EXISTS (SELECT 1 FROM crm_companies cc WHERE cc.hubspot_id = ca.company_hubspot_id)
GROUP BY ca.company_hubspot_id;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_crm_companies_board ON crm_companies(board);
CREATE INDEX idx_crm_companies_rep ON crm_companies(assigned_rep_id);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_hubspot_id);
CREATE INDEX idx_crm_activities_timestamp ON crm_activities(timestamp DESC);
CREATE INDEX idx_crm_activities_type ON crm_activities(type);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_hubspot_id);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(close_date);
