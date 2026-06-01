-- Live Call Assist tables (Postgres — replaces Supabase live_call_sessions / live_call_summaries)

CREATE TABLE IF NOT EXISTS live_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  session_name TEXT,
  sales_rep_name TEXT DEFAULT 'Sales Rep',
  client_name TEXT DEFAULT 'Client',
  contact_id TEXT,
  deal_id TEXT,
  deal_company TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  final_summary TEXT,
  total_segments INT NOT NULL DEFAULT 0,
  transcript JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_call_sessions(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  key_topics TEXT[] NOT NULL DEFAULT '{}',
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  competitors_mentioned TEXT[] NOT NULL DEFAULT '{}',
  raw_transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_call_sessions_tenant_status ON live_call_sessions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_live_call_summaries_session ON live_call_summaries(session_id, chunk_index);
