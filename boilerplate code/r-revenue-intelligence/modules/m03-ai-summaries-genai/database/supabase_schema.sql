-- ============================================================
-- M3 AI Deep Researcher — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. ORGS (multi-tenant root)
-- ============================================================
CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'pro',
  features JSONB DEFAULT '{"briefs": true, "ask_anything": true, "research": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 2. TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  feature_flags JSONB DEFAULT '{"briefs": true, "ask_anything": true, "research": true}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(org_id);

-- ============================================================
-- 3. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'SALES_REP',
  crm_user_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_email ON users(org_id, email);
CREATE INDEX IF NOT EXISTS idx_users_org_team ON users(org_id, team_id);

-- ============================================================
-- 4. ACCOUNTS (CRM accounts/companies)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  segment VARCHAR(50) DEFAULT 'Mid-Market',
  region VARCHAR(50) DEFAULT 'West',
  owner_user_id UUID REFERENCES users(id),
  crm_account_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accounts_org ON accounts(org_id);

-- ============================================================
-- 5. DEALS (CRM deals/opportunities)
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  stage VARCHAR(100) DEFAULT 'Discovery',
  status VARCHAR(50) DEFAULT 'OPEN',
  amount NUMERIC(12,2),
  close_date DATE,
  crm_deal_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(org_id);
CREATE INDEX IF NOT EXISTS idx_deals_account ON deals(account_id);

-- ============================================================
-- 6. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role_title VARCHAR(100),
  crm_contact_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);

-- ============================================================
-- 7. CALLS (recorded sales calls with transcripts)
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  transcript TEXT,
  transcript_status VARCHAR(20) DEFAULT 'COMPLETED',
  sentiment_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calls_org ON calls(org_id);
CREATE INDEX IF NOT EXISTS idx_calls_deal ON calls(deal_id);
CREATE INDEX IF NOT EXISTS idx_calls_account ON calls(account_id);
CREATE INDEX IF NOT EXISTS idx_calls_owner ON calls(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_started ON calls(org_id, started_at DESC);

-- ============================================================
-- 8. EMAILS
-- ============================================================
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  sender_user_id UUID REFERENCES users(id),
  subject VARCHAR(500),
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  thread_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emails_org ON emails(org_id);
CREATE INDEX IF NOT EXISTS idx_emails_deal ON emails(deal_id);

-- ============================================================
-- 9. RESEARCH JOBS (async job tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  query TEXT NOT NULL,
  context_type VARCHAR(20) NOT NULL DEFAULT 'ACCOUNT',
  context_id UUID,
  scope VARCHAR(50) NOT NULL DEFAULT 'ENTIRE_ACCOUNT',
  period_days INTEGER NOT NULL DEFAULT 60,
  filters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  progress_pct INTEGER DEFAULT 0,
  progress_stage VARCHAR(100) DEFAULT 'Initializing',
  error_message TEXT,
  sub_queries JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_research_jobs_org_user ON research_jobs(org_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_jobs_status ON research_jobs(status);

-- ============================================================
-- 10. RESEARCH REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES research_jobs(id) ON DELETE CASCADE,
  generated_by_user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(500),
  query TEXT NOT NULL,
  scope VARCHAR(50) NOT NULL,
  period_days INTEGER NOT NULL,
  filters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  sections JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  parent_report_id UUID REFERENCES research_reports(id),
  share_token VARCHAR(255),
  share_expires_at TIMESTAMPTZ,
  model_used VARCHAR(100) DEFAULT 'llama-3.3-70b-versatile',
  tokens_used JSONB DEFAULT '{"prompt": 0, "completion": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_job ON research_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_user ON research_reports(org_id, generated_by_user_id, created_at DESC);

-- ============================================================
-- 11. CITATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  report_id UUID REFERENCES research_reports(id) ON DELETE CASCADE,
  section_id VARCHAR(100) NOT NULL,
  bullet_id VARCHAR(100) NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  source_id VARCHAR(255),
  source_ref JSONB NOT NULL DEFAULT '{}',
  display_label VARCHAR(255) NOT NULL,
  source_url TEXT,
  context_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_citations_report ON citations(report_id, section_id);

-- ============================================================
-- 12. FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  report_id UUID REFERENCES research_reports(id) ON DELETE CASCADE,
  bullet_id VARCHAR(100),
  section_id VARCHAR(100),
  feedback_type VARCHAR(30) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_report ON feedback(report_id);
CREATE INDEX IF NOT EXISTS idx_feedback_org ON feedback(org_id, created_at DESC);

-- ============================================================
-- 13. PERMISSION POLICIES
-- ============================================================
CREATE TABLE IF NOT EXISTS permission_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (org_id, team_id, feature)
);

-- ============================================================
-- 14. QUERY SESSIONS (Ask Anything)
-- ============================================================
CREATE TABLE IF NOT EXISTS query_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  context_type VARCHAR(20),
  context_id UUID,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes')
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON query_sessions(user_id, last_active_at DESC);

-- ============================================================
-- 15. QUERY ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS query_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  query_type VARCHAR(30) NOT NULL,
  context_type VARCHAR(20),
  context_id UUID,
  prompt_hash VARCHAR(64),
  model_used VARCHAR(100),
  tokens_prompt INTEGER DEFAULT 0,
  tokens_completion INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  retrieved_chunk_count INTEGER DEFAULT 0,
  grounding_pass_rate NUMERIC(4,3) DEFAULT 1.000,
  cache_hit BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_org ON query_analytics(org_id, created_at DESC);

-- ============================================================
-- 16. EMBEDDING CHUNKS (for semantic search)
-- ============================================================
CREATE TABLE IF NOT EXISTS embedding_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  source_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  embedding_status VARCHAR(20) DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  UNIQUE(org_id, source_type, source_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_embedding_scope ON embedding_chunks(org_id, source_type, source_id);

-- ============================================================
-- 17. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID,
  event_type VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100),
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id, created_at DESC);

-- ============================================================
-- 18. AI CHAT HISTORY (Ask Anything)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. TRANSCRIPT CHUNKS (Ask Anything RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS transcript_chunks (
  id BIGSERIAL PRIMARY KEY,
  call_id TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_call ON transcript_chunks(call_id);

-- ============================================================
-- 20. SEMANTIC SEARCH RPC (Ask Anything)
-- ============================================================
CREATE OR REPLACE FUNCTION match_transcript_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  p_deal_id text DEFAULT NULL,
  p_account_id text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  call_id text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.call_id,
    tc.chunk_text,
    1 - (tc.embedding <=> query_embedding) AS similarity
  FROM transcript_chunks tc
  WHERE 1 - (tc.embedding <=> query_embedding) > match_threshold
  ORDER BY tc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ============================================================
-- 21. AI SMART SUMMARIES TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  speaker VARCHAR(255),
  timestamp_ms INTEGER,
  sentiment VARCHAR(50) DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  note_text TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brief_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- call, deal, account, contact
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brief_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES brief_templates(id) ON DELETE CASCADE,
  section_name VARCHAR(255) NOT NULL,
  ai_question TEXT NOT NULL,
  instructions TEXT,
  section_order INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT TRUE,
  required BOOLEAN DEFAULT FALSE,
  data_sources JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  brief_type VARCHAR(50) NOT NULL CHECK (brief_type IN ('call', 'deal', 'account', 'contact')),
  entity_id UUID NOT NULL,
  generated_summary JSONB DEFAULT '{}',
  source_references JSONB DEFAULT '[]',
  llm_model VARCHAR(100),
  generation_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_briefs_entity ON ai_briefs(brief_type, entity_id);

-- Templates table
CREATE TABLE IF NOT EXISTS brief_templates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name  TEXT        NOT NULL,
  entity_type    TEXT        NOT NULL,
  description    TEXT,
  is_active      BOOLEAN     DEFAULT true,
  version_number INTEGER     DEFAULT 1,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  metadata       JSONB
);

-- Template sections table
CREATE TABLE IF NOT EXISTS brief_template_sections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    UUID        NOT NULL REFERENCES brief_templates(id) ON DELETE CASCADE,
  section_name   TEXT        NOT NULL,
  ai_question    TEXT        NOT NULL,
  instructions   TEXT,
  section_order  INTEGER     DEFAULT 1,
  enabled        BOOLEAN     DEFAULT true,
  required       BOOLEAN     DEFAULT false,
  data_sources   JSONB       DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brief_templates_entity
  ON brief_templates(entity_type, is_active);

CREATE INDEX IF NOT EXISTS idx_brief_template_sections_template
  ON brief_template_sections(template_id, section_order);

ALTER TABLE brief_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_template_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_brief_templates"
  ON brief_templates FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_brief_templates"
  ON brief_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_brief_template_sections"
  ON brief_template_sections FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_brief_template_sections"
  ON brief_template_sections FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS brief_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT        NOT NULL,
  entity_id        TEXT        NOT NULL,
  brief_type       TEXT        NOT NULL,
  version_number   INTEGER     NOT NULL DEFAULT 1,
  generated_summary JSONB      NOT NULL,
  source_ids       JSONB,
  model_used       TEXT,
  prompt_version   TEXT        DEFAULT '1.0',
  generated_by     TEXT        DEFAULT 'system',
  session_id       TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brief_history_entity
  ON brief_history(entity_id, brief_type);

CREATE INDEX IF NOT EXISTS idx_brief_history_created
  ON brief_history(created_at DESC);

ALTER TABLE brief_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_brief_history" ON brief_history;
DROP POLICY IF EXISTS "service_write_brief_history" ON brief_history;

CREATE POLICY "anon_read_brief_history"
  ON brief_history FOR SELECT TO anon USING (true);

CREATE POLICY "service_write_brief_history"
  ON brief_history FOR INSERT TO service_role WITH CHECK (true);

CREATE TABLE IF NOT EXISTS brief_feedback (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID REFERENCES orgs(id) ON DELETE CASCADE,
  entity_type      TEXT,
  entity_id        TEXT,
  brief_type       TEXT,
  section_name     TEXT,
  bullet_id        TEXT,
  bullet_text      TEXT,
  feedback_type    TEXT        NOT NULL,
  feedback_reason  TEXT,
  feedback_comment TEXT,
  user_id          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  metadata         JSONB
);

CREATE INDEX IF NOT EXISTS idx_brief_feedback_entity
  ON brief_feedback(entity_id, brief_type);

CREATE INDEX IF NOT EXISTS idx_brief_feedback_type
  ON brief_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_brief_feedback_bullet
  ON brief_feedback(bullet_id);

CREATE INDEX IF NOT EXISTS idx_brief_feedback_created
  ON brief_feedback(created_at DESC);

ALTER TABLE brief_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_brief_feedback"     ON brief_feedback;
DROP POLICY IF EXISTS "service_write_brief_feedback" ON brief_feedback;

CREATE POLICY "anon_read_brief_feedback"
  ON brief_feedback FOR SELECT TO anon USING (true);

CREATE POLICY "service_write_brief_feedback"
  ON brief_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS shared_briefs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT        NOT NULL,
  entity_id        TEXT        NOT NULL,
  brief_type       TEXT        NOT NULL,
  share_token      TEXT        UNIQUE NOT NULL,
  access_type      TEXT        DEFAULT 'read_only',
  created_by       TEXT,
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN     DEFAULT true,
  snapshot_summary JSONB       NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  metadata         JSONB
);

CREATE INDEX IF NOT EXISTS idx_shared_briefs_token
  ON shared_briefs(share_token);

CREATE INDEX IF NOT EXISTS idx_shared_briefs_entity
  ON shared_briefs(entity_id, brief_type);

ALTER TABLE shared_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_shared_briefs"     ON shared_briefs;
DROP POLICY IF EXISTS "service_write_shared_briefs" ON shared_briefs;

CREATE POLICY "anon_read_shared_briefs"
  ON shared_briefs FOR SELECT TO anon USING (true);

CREATE POLICY "service_write_shared_briefs"
  ON shared_briefs FOR ALL TO service_role USING (true) WITH CHECK (true);
