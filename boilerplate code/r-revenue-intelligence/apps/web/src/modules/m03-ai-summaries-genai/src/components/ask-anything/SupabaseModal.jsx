import { useState } from "react";
import { resetSupabaseClient } from "../../lib/supabase";
import styles from "./SupabaseModal.module.css";

export default function SupabaseModal({ onClose, onSave, connected }) {
  const [url, setUrl]   = useState(() => typeof window !== "undefined" ? (localStorage.getItem("supabase_url") || "") : "");
  const [key, setKey]   = useState(() => typeof window !== "undefined" ? (localStorage.getItem("supabase_anon_key") || "") : "");
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [seedSeeding, setSeedSeeding] = useState(false);
  const [seedMsg, setSeedMsg]     = useState(null);

  const SQL_SCHEMA = `-- Enable vector extension for semantic search
create extension if not exists vector;

-- 1. ACCOUNTS
create table if not exists accounts (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 2. DEALS
create table if not exists deals (
  id text primary key,
  name text not null,
  stage text default 'Qualification',
  account_id text references accounts(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. CONTACTS
create table if not exists contacts (
  id text primary key,
  name text not null,
  email text,
  account_id text references accounts(id) on delete cascade,
  created_at timestamptz default now()
);

-- 4. CALLS
create table if not exists calls (
  id text primary key,
  title text not null,
  transcript text not null,
  account_id text references accounts(id) on delete cascade,
  deal_id text references deals(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. TRANSCRIPT CHUNKS (For vector storage)
create table if not exists transcript_chunks (
  id bigint primary key generated always as identity,
  call_id text references calls(id) on delete cascade,
  chunk_text text not null,
  embedding vector(768),
  created_at timestamptz default now()
);

-- 6. AI CHAT HISTORY
create table if not exists ai_chat_history (
  id bigint primary key generated always as identity,
  user_id uuid,
  question text not null,
  answer text not null,
  citations jsonb default '[]',
  created_at timestamptz default now()
);

-- 7. PGVECTOR RAG SEARCH FUNCTION
create or replace function match_transcript_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_deal_id text default null,
  p_account_id text default null
)
returns table (
  id bigint,
  call_id text,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    tc.id,
    tc.call_id,
    tc.chunk_text,
    1 - (tc.embedding <=> query_embedding) as similarity
  from transcript_chunks tc
  join calls c on c.id = tc.call_id
  where 1 - (tc.embedding <=> query_embedding) > match_threshold
    and (p_deal_id is null or c.deal_id = p_deal_id)
    and (p_account_id is null or c.account_id = p_account_id)
  order by tc.embedding <=> query_embedding
  limit match_count;
$$;

-- Public Access Policies (RLS) for Development
alter table accounts enable row level security;
alter table deals enable row level security;
alter table contacts enable row level security;
alter table calls enable row level security;
alter table transcript_chunks enable row level security;
alter table ai_chat_history enable row level security;

create policy "Public read" on accounts for select using (true);
create policy "Public insert" on accounts for insert with check (true);
create policy "Public update" on accounts for update using (true);
create policy "Public delete" on accounts for delete using (true);

create policy "Public read" on deals for select using (true);
create policy "Public insert" on deals for insert with check (true);
create policy "Public update" on deals for update using (true);
create policy "Public delete" on deals for delete using (true);

create policy "Public read" on contacts for select using (true);
create policy "Public insert" on contacts for insert with check (true);
create policy "Public update" on contacts for update using (true);
create policy "Public delete" on contacts for delete using (true);

create policy "Public read" on calls for select using (true);
create policy "Public insert" on calls for insert with check (true);
create policy "Public update" on calls for update using (true);
create policy "Public delete" on calls for delete using (true);

create policy "Public read" on transcript_chunks for select using (true);
create policy "Public insert" on transcript_chunks for insert with check (true);
create policy "Public update" on transcript_chunks for update using (true);
create policy "Public delete" on transcript_chunks for delete using (true);

create policy "Public read" on ai_chat_history for select using (true);
create policy "Public insert" on ai_chat_history for insert with check (true);
create policy "Public update" on ai_chat_history for update using (true);
create policy "Public delete" on ai_chat_history for delete using (true);
`;

  const SEED_SQL = `-- ═══════════════════════════════════════════════════════════════
--  SalesIQ Simplified Seed Data  (run AFTER schema SQL)
--  Populates accounts, deals, contacts, and calls tables.
-- ═══════════════════════════════════════════════════════════════

insert into accounts (id, name) values
  ('A001', 'Acme Corp'),
  ('A002', 'TechNova'),
  ('A003', 'GlobalBank'),
  ('A004', 'RetailPro'),
  ('A005', 'HealthOS')
on conflict (id) do update set name = excluded.name;

insert into deals (id, name, stage, account_id) values
  ('D001', 'Acme Corp — Enterprise License', 'Negotiation', 'A001'),
  ('D002', 'TechNova SaaS Bundle', 'Proposal', 'A002'),
  ('D003', 'GlobalBank Compliance Suite', 'Qualification', 'A003'),
  ('D004', 'RetailPro Inventory AI', 'Closed Won', 'A004'),
  ('D005', 'HealthOS Patient Analytics', 'Demo', 'A005')
on conflict (id) do update set name = excluded.name, stage = excluded.stage, account_id = excluded.account_id;

insert into contacts (id, name, email, account_id) values
  ('C001', 'John Harlow', 'j.harlow@acmecorp.com', 'A001'),
  ('C002', 'Sara Kim', 'sara@technova.io', 'A002'),
  ('C003', 'Michael Chen', 'm.chen@globalbank.com', 'A003'),
  ('C004', 'Lisa Tran', 'lisa@retailpro.co', 'A004'),
  ('C005', 'Dr. Patel', 'patel@healthos.io', 'A005')
on conflict (id) do update set name = excluded.name, email = excluded.email, account_id = excluded.account_id;

insert into calls (id, title, transcript, account_id, deal_id) values
  ('CL001', 'Acme Price Negotiation Call', 'Priya: Let''s discuss pricing for Acme Enterprise License. John: Our budget is capped at $128K. Priya: If we do a 3-year commitment, we can offer a 15% discount. John: That works, but we need an IT security review first. Priya: Perfect, I will send the revised MSA today.', 'A001', 'D001'),
  ('CL002', 'TechNova Discovery Call', 'Raj: What is your main pain point? Sara: We spend 8 hours a week on manual reporting. We want to automate this. Raj: Understood. Our platform automates CRM sync. Sara: Excellent. Please send the security docs and a proposal by Friday.', 'A002', 'D002'),
  ('CL003', 'HealthOS Patient Analytics Demo', 'Amir: Here is the HIPAA compliance module audit trail. Dr. Patel: This looks exactly like what we need. Amir: Glad to hear it. Dr. Patel: The budget of $89K is greenlit internally. Let''s move to contract.', 'A005', 'D005'),
  ('CL004', 'LogiChain Stalled Call', 'Priya: Hi Tom, following up on the proposal. Tom: The price is too high. We need a 40% discount or we can''t sign. Competitor offer is 20% cheaper. Priya: I cannot support 40% but I can check with my VP. Let''s schedule a call.', 'A001', 'D001')
on conflict (id) do update set title = excluded.title, transcript = excluded.transcript, account_id = excluded.account_id, deal_id = excluded.deal_id;
`;

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem("supabase_url", url.trim());
    localStorage.setItem("supabase_anon_key", key.trim());
    resetSupabaseClient();
    setSaving(false);
    onSave();
    onClose();
  }

  function handleDisconnect() {
    localStorage.removeItem("supabase_url");
    localStorage.removeItem("supabase_anon_key");
    resetSupabaseClient();
    onSave();
    onClose();
  }

  function copySchema() {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copySeed() {
    navigator.clipboard.writeText(SEED_SQL);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2500);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.sbLogo}>
              <svg viewBox="0 0 109 113" fill="none" width="22" height="22">
                <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627H99.1934C107.386 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
                <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627H99.1934C107.386 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fillOpacity="0.2"/>
                <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83413C1.64038 72.2922 -2.92535 62.8321 2.16759 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#249361"/>
                    <stop offset="1" stopColor="#3ECF8E"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
                    <stop/>
                    <stop offset="1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Supabase Database</h2>
              <p className={styles.subtitle}>Connect your project to persist all data</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.statusBar}>
          <span className={`${styles.statusDot} ${connected ? styles.connected : styles.disconnected}`} />
          <span>{connected ? "Connected — live data active" : "Not connected — using demo data"}</span>
        </div>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.field}>
            <label>Project URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              id="sb-url-input"
            />
            <span className={styles.hint}>Found in: Supabase Dashboard → Settings → API → Project URL</span>
          </div>
          <div className={styles.field}>
            <label>Anon / Public Key</label>
            <input
              type="password"
              required
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              id="sb-key-input"
            />
            <span className={styles.hint}>Found in: Supabase Dashboard → Settings → API → anon public</span>
          </div>

          <div className={styles.schemaSection}>
            <div className={styles.schemaHead}>
              <p className={styles.schemaTitle}>🗄 Step 2 — Create Database Tables</p>
              <p className={styles.schemaDesc}>
                Copy the SQL below and run it in your{" "}
                <a
                  className={styles.sqlEditorLink}
                  href={url ? `${url.replace(/\/$/, "")}/project/default/sql` : "https://supabase.com"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Supabase SQL Editor ↗
                </a>
                {" "}to create all required tables and pgvector searches.
              </p>
            </div>
            <div className={styles.schemaPre}>
              <pre>{SQL_SCHEMA}</pre>
            </div>
            <button type="button" className={styles.copyBtn} onClick={copySchema}>
              {copied ? '✓ Copied!' : '📋 Copy Full SQL Schema'}
            </button>
          </div>

          {/* ── STEP 3: SEED DATA ── */}
          <div className={styles.seedSection}>
            <div className={styles.seedHead}>
              <div className={styles.seedLeft}>
                <p className={styles.seedTitle}>🌱 Step 3 — Seed Demo Data</p>
                <p className={styles.seedDesc}>
                  Populates your database with realistic deals, accounts, contacts, and calls.
                </p>
              </div>
            </div>

            <div className={styles.seedBtns}>
              <button type="button" className={styles.copySeedBtn} onClick={copySeed}>
                {copiedSeed ? '✓ Copied!' : '📋 Copy Seed SQL'}
              </button>
              <a
                className={styles.sqlEditorBtn}
                href={url ? `${url.replace(/\/$/, '')}/project/default/sql` : 'https://supabase.com'}
                target="_blank"
                rel="noreferrer"
              >
                Open SQL Editor ↗
              </a>
            </div>
          </div>

          <div className={styles.seedNote}>
            ℹ Safe to re-run — all inserts use <code>ON CONFLICT</code> update constraints.
          </div>

          <div className={styles.footer}>
            {connected && (
              <button type="button" className={styles.disconnectBtn} onClick={handleDisconnect}>
                Disconnect
              </button>
            )}
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Connecting…" : "Save & Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
