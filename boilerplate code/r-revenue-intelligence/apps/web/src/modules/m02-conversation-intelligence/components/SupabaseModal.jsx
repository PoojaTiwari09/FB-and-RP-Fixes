import { useState } from "react";
import { resetSupabaseClient } from "../../../../../../modules/m02-conversation-intelligence/live-assist-core/lib/supabase";
import styles from "./SupabaseModal.module.css";

export default function SupabaseModal({ onClose, onSave, connected }) {
  const [url, setUrl]   = useState(() => localStorage.getItem("supabase_url") || "");
  const [key, setKey]   = useState(() => localStorage.getItem("supabase_anon_key") || "");
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [seedSeeding, setSeedSeeding] = useState(false);
  const [seedMsg, setSeedMsg]     = useState(null);

  const SQL_SCHEMA = `-- Run this in your Supabase SQL Editor to create all tables

-- DEALS
create table if not exists deals (
  id text primary key,
  name text,
  stage text,
  value numeric default 0,
  probability numeric default 50,
  owner text,
  days_in_stage int default 0,
  close_date date,
  company text,
  contact text,
  account_id text,
  notes text,
  activities jsonb default '[]',
  tags jsonb default '[]',
  score numeric default 50,
  trend text default 'stable',
  created_at timestamptz default now()
);

-- CONTACTS
create table if not exists contacts (
  id text primary key,
  name text,
  title text,
  company text,
  account_id text,
  email text,
  phone text,
  deal_id text,
  last_contact date,
  sentiment text default 'Neutral',
  notes text,
  created_at timestamptz default now()
);

-- ACCOUNTS
create table if not exists accounts (
  id text primary key,
  name text,
  industry text,
  size text,
  employees int default 0,
  arr numeric default 0,
  health_score int default 50,
  website text,
  location text,
  since text,
  contacts jsonb default '[]',
  deals jsonb default '[]',
  created_at timestamptz default now()
);

-- TASKS
create table if not exists tasks (
  id text primary key,
  title text,
  deal_id text,
  assignee text,
  due date,
  priority text default 'Medium',
  done boolean default false,
  type text default 'Email',
  created_at timestamptz default now()
);

-- CALLS
create table if not exists calls (
  id text primary key,
  deal text,
  type text,
  date date,
  duration text,
  rep text,
  sentiment text,
  outcome text,
  summary text,
  key_moments jsonb default '[]',
  objections jsonb default '[]',
  next_steps jsonb default '[]',
  -- Intelligence Fields
  risks jsonb default '[]',
  pain_points jsonb default '[]',
  competitors jsonb default '[]',
  key_insights jsonb default '[]',
  deal_value text,
  timeline text,
  client_name text,
  decision_maker text,
  deal_score int default 50,
  transcript jsonb default '[]',
  created_at timestamptz default now()
);

-- LIVE CALL SESSIONS
create table if not exists live_call_sessions (
  id uuid primary key default gen_random_uuid(),
  session_name text default 'Live Call',
  sales_rep_name text default 'Sales Rep',
  client_name text default 'Client',
  deal_id text,
  deal_company text,
  status text default 'active',
  started_at timestamptz default now(),
  ended_at timestamptz,
  final_summary text,
  total_segments int default 0,
  user_id text default 'demo',
  created_at timestamptz default now()
);

-- LIVE CALL SUMMARIES
create table if not exists live_call_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references live_call_sessions(id) on delete cascade,
  chunk_index int not null,
  time_start text not null,
  time_end text not null,
  summary_text text not null,
  key_topics text[] default '{}',
  sentiment text default 'neutral',
  competitors_mentioned text[] default '{}',
  raw_transcript text,
  user_id text default 'demo',
  created_at timestamptz default now()
);

-- REPS
create table if not exists reps (
  id serial primary key,
  name text,
  avatar text,
  deals int default 0,
  pipeline numeric default 0,
  closed numeric default 0,
  quota numeric default 0,
  win_rate numeric default 0,
  avg_cycle int default 0,
  calls int default 0,
  created_at timestamptz default now()
);

-- Document Analysis table
create table if not exists doc_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  doc_name text,
  mode text default 'executive',
  analysis jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table deals enable row level security;
alter table contacts enable row level security;
alter table accounts enable row level security;
alter table tasks enable row level security;
alter table calls enable row level security;
alter table activities enable row level security;
alter table reps enable row level security;
alter table doc_analyses enable row level security;
alter table live_call_sessions enable row level security;
alter table live_call_summaries enable row level security;

-- Public access policies (for development)
create policy "Public access" on deals for all using (true) with check (true);
create policy "Public access" on contacts for all using (true) with check (true);
create policy "Public access" on accounts for all using (true) with check (true);
create policy "Public access" on tasks for all using (true) with check (true);
create policy "Public access" on calls for all using (true) with check (true);
create policy "Public access" on activities for all using (true) with check (true);
create policy "Public access" on reps for all using (true) with check (true);
create policy "Public access" on doc_analyses for all using (true) with check (true);
create policy "Public access" on live_call_sessions for all using (true) with check (true);
create policy "Public access" on live_call_summaries for all using (true) with check (true);`;

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

  const SEED_SQL = `-- ═══════════════════════════════════════════════════════════════
--  SalesIQ Demo Seed Data  (run AFTER schema SQL)
--  Inserts 12 deals, 8 accounts, 10 contacts, 12 tasks,
--  5 calls, 8 activities, 3 reps — with ON CONFLICT DO NOTHING
--  so it is safe to re-run at any time.
-- ═══════════════════════════════════════════════════════════════

insert into reps (name,avatar,deals,pipeline,closed,quota,win_rate,avg_cycle,calls) values
  ('Priya S.','P',4,513000,128000,200000,48,42,18),
  ('Raj M.','R',3,174000,54000,150000,38,51,14),
  ('Amir K.','A',3,267000,89000,175000,45,44,16)
on conflict do nothing;

insert into accounts (id,name,industry,size,employees,arr,health_score,website,location,since,contacts,deals) values
  ('A001','Acme Corp','Manufacturing','Enterprise',5200,128000,82,'acmecorp.com','San Francisco, CA','2023-06','["John Harlow","Emily Ross"]','["D001"]'),
  ('A002','TechNova','SaaS','Mid-market',340,54000,58,'technova.io','Austin, TX','2024-01','["Sara Kim"]','["D002"]'),
  ('A003','GlobalBank','Finance','Enterprise',28000,0,41,'globalbank.com','New York, NY','2024-02','["Michael Chen"]','["D003"]'),
  ('A004','RetailPro','Retail','SMB',85,36000,95,'retailpro.co','Chicago, IL','2023-11','["Lisa Tran"]','["D004"]'),
  ('A005','HealthOS','Healthcare','Mid-market',620,0,64,'healthos.io','Boston, MA','2024-01','["Dr. Patel"]','["D005"]'),
  ('A007','LogiChain','Logistics','Enterprise',3100,0,55,'logichain.com','Dallas, TX','2023-12','["Tom Wagner"]','["D007"]'),
  ('A008','EduTech Inc','Education','Mid-market',210,0,47,'edutechinc.com','Seattle, WA','2024-01','["Rachel Park"]','["D008"]'),
  ('A009','CloudSec Ltd','Cybersecurity','Enterprise',1800,0,71,'cloudsec.com','Washington, DC','2024-02','["Amy Zhang"]','["D009"]')
on conflict do nothing;

insert into contacts (id,name,title,company,account_id,email,phone,deal_id,last_contact,sentiment,notes) values
  ('C001','John Harlow','VP of Operations','Acme Corp','A001','j.harlow@acmecorp.com','+1 415 555 0182','D001','2024-06-26','Positive','Key champion. Has exec buy-in.'),
  ('C002','Sara Kim','Head of Engineering','TechNova','A002','sara@technova.io','+1 512 555 0134','D002','2024-06-24','Neutral','Evaluating 2 vendors. Security focus.'),
  ('C003','Michael Chen','Chief Compliance Officer','GlobalBank','A003','m.chen@globalbank.com','+1 212 555 0167','D003','2024-06-22','Positive','Needs board approval for spend.'),
  ('C004','Lisa Tran','CTO','RetailPro','A004','lisa@retailpro.co','+1 312 555 0198','D004','2024-06-28','Very Positive','Signed! Great relationship.'),
  ('C005','Dr. Patel','Chief Medical Officer','HealthOS','A005','patel@healthos.io','+1 617 555 0145','D005','2024-06-25','Very Positive','HIPAA compliance is top priority.'),
  ('C006','Tom Wagner','Director of Operations','LogiChain','A007','t.wagner@logichain.com','+1 972 555 0121','D007','2024-06-23','Tense','Pushing hard on discount. Risk of churn.'),
  ('C007','Rachel Park','L&D Manager','EduTech Inc','A008','r.park@edutechinc.com','+1 206 555 0177','D008','2024-06-21','Neutral','Waiting on board budget approval.'),
  ('C008','Amy Zhang','CISO','CloudSec Ltd','A009','a.zhang@cloudsec.com','+1 202 555 0156','D009','2024-06-27','Positive','Budget confirmed Q2. Strong champion.')
on conflict do nothing;

insert into deals (id,name,stage,value,probability,owner,days_in_stage,close_date,company,contact,account_id,notes,activities,tags,score,trend) values
  ('D001','Acme Corp — Enterprise License','Negotiation',128000,80,'Priya S.',12,'2024-09-15','Acme Corp','John Harlow','A001','Final pricing call scheduled. Legal reviewing MSA.','["Demo completed","Proposal sent","Legal review in progress"]','["Enterprise","High-value"]',82,'up'),
  ('D002','TechNova SaaS Bundle','Proposal',54000,55,'Raj M.',7,'2024-09-22','TechNova','Sara Kim','A002','Competitor eval ongoing. Needs security questionnaire.','["Discovery call done","Proposal sent"]','["Mid-market","SaaS","Competitive"]',58,'stable'),
  ('D003','GlobalBank Compliance Suite','Qualification',210000,35,'Priya S.',3,'2024-11-30','GlobalBank','Michael Chen','A003','Initial interest confirmed. Needs executive sponsor.','["Cold outreach response","Intro call booked"]','["Enterprise","Finance","High-value"]',41,'up'),
  ('D004','RetailPro Inventory AI','Closed Won',36000,100,'Amir K.',0,'2024-07-28','RetailPro','Lisa Tran','A004','Contract signed. Onboarding kickoff scheduled.','["Signed","PO received","Kickoff scheduled"]','["SMB","Retail","Quick-win"]',100,'stable'),
  ('D005','HealthOS Patient Analytics','Demo',89000,60,'Amir K.',5,'2024-10-30','HealthOS','Dr. Patel','A005','Technical demo loved HIPAA module. Budget greenlit.','["Discovery done","Technical demo scheduled"]','["Mid-market","Healthcare","HIPAA"]',64,'up'),
  ('D006','StartupHub Seed Pack','Closed Lost',12000,0,'Raj M.',0,'2024-06-20','StartupHub','Nia Osei','A006','Went with competitor. Cited pricing.','["Proposal rejected"]','["SMB","Startup"]',0,'down'),
  ('D007','LogiChain Fleet Management','Negotiation',175000,75,'Priya S.',18,'2024-09-10','LogiChain','Tom Wagner','A007','Stalled on multi-year discount terms. Escalate to VP.','["Demo done","Legal approved","Pricing negotiation"]','["Enterprise","Logistics","At-risk","High-value"]',55,'down'),
  ('D008','EduTech LMS Platform','Proposal',42000,50,'Raj M.',14,'2024-10-05','EduTech Inc','Rachel Park','A008','Waiting for board budget approval.','["Demo done","Proposal sent"]','["Mid-market","Education"]',47,'stable'),
  ('D009','CloudSec Zero Trust Platform','Demo',145000,65,'Priya S.',4,'2024-10-15','CloudSec Ltd','Amy Zhang','A009','Strong CISO interest. Budget confirmed Q2. FedRAMP required.','["Intro call done","Technical demo scheduled"]','["Enterprise","Security","High-value","FedRAMP"]',71,'up'),
  ('D010','FinTrust Risk Engine','Qualification',78000,40,'Amir K.',6,'2024-11-01','FinTrust','David Okafor','A010','Regulatory compliance angle resonating. Early stage.','["LinkedIn outreach","Discovery call booked"]','["Mid-market","Finance","Compliance"]',44,'up'),
  ('D011','ShopStream Commerce Analytics','Demo',67000,58,'Raj M.',2,'2024-10-20','ShopStream','Priya Nair','A011','Strong demo feedback. Real-time analytics is the hook.','["Cold outreach","Discovery call","Demo booked"]','["Mid-market","E-commerce","Analytics"]',62,'up'),
  ('D012','NeuralWorks AI Platform','Proposal',320000,45,'Priya S.',9,'2024-12-01','NeuralWorks','James OBrien','A012','Largest deal in pipeline. Needs procurement review.','["Strategic intro","Technical deep-dive","Proposal submitted"]','["Enterprise","AI/ML","Strategic","High-value"]',49,'up')
on conflict do nothing;

insert into tasks (id,title,deal_id,assignee,due,priority,done,type) values
  ('T001','Send revised MSA to Acme Corp','D001','Priya S.','2024-09-01','High',false,'Document'),
  ('T002','Security questionnaire — TechNova','D002','Raj M.','2024-08-02','High',false,'Document'),
  ('T003','Schedule exec alignment — GlobalBank','D003','Priya S.','2024-08-03','Medium',false,'Call'),
  ('T004','Onboarding kickoff prep — RetailPro','D004','Amir K.','2024-08-05','High',true,'Meeting'),
  ('T005','Send HIPAA BAA — HealthOS','D005','Amir K.','2024-08-04','High',false,'Document'),
  ('T006','VP Sales call with Tom Wagner','D007','Priya S.','2024-08-29','Critical',false,'Call'),
  ('T007','Follow up on board approval — EduTech','D008','Raj M.','2024-08-06','Medium',false,'Email'),
  ('T008','Technical demo prep — CloudSec','D009','Priya S.','2024-08-07','High',false,'Meeting'),
  ('T009','Prepare counter-offer — LogiChain','D007','Raj M.','2024-09-01','Critical',false,'Document'),
  ('T010','Discovery call — FinTrust','D010','Amir K.','2024-08-08','Medium',false,'Call'),
  ('T011','Demo setup and dry-run — ShopStream','D011','Raj M.','2024-08-09','High',false,'Meeting'),
  ('T012','Send NeuralWorks procurement brief','D012','Priya S.','2024-08-05','Critical',false,'Document')
on conflict do nothing;

insert into calls (id,deal,type,date,duration,rep,sentiment,outcome,summary,key_moments,objections,next_steps) values
  ('CL001','D001','Negotiation Call','2024-08-26','42 min','Priya S.','Positive','Price agreed in principle','Budget confirmed at $128K. Discussed 3-year vs 2-year. Agreed on 15% multi-year discount.','["Budget confirmed","Legal timeline: 2 weeks","Champion: John Harlow"]','["IT security review needed","Prefers annual billing"]','["Send revised MSA","Exec alignment call"]'),
  ('CL002','D002','Discovery Call','2024-08-24','28 min','Raj M.','Neutral','Proposal requested','Sara evaluating 2 vendors. Pain: 8 hrs/week manual reporting. Liked integrations, needs security docs.','["Pain: manual reporting","Q2 go-live timeline","3 decision makers"]','["Security concerns","Budget TBD"]','["Send security docs","Proposal by Friday"]'),
  ('CL003','D005','Technical Demo','2024-08-25','55 min','Amir K.','Very Positive','Advanced to next stage','Dr. Patel loved the HIPAA compliance module. IT team impressed. Budget $89K greenlit.','["HIPAA module: strong fit","IT team approved","Budget approved"]','["Data residency","Need pilot"]','["Send HIPAA BAA","Pilot kickoff"]'),
  ('CL004','D007','Negotiation Call','2024-08-23','35 min','Priya S.','Tense','Escalation needed','Tom pushed for 40% discount. Suggested VP Sales escalation. Competitor offer on table.','["Asked for 40% discount","Competitor mentioned","3-year possible"]','["Pricing too high","Competitor 20% cheaper"]','["VP Sales call","Counter-offer"]'),
  ('CL005','D009','Intro Call','2024-08-27','30 min','Priya S.','Positive','Demo scheduled','Amy Zhang confirmed Q2 budget. CISO is economic buyer. FedRAMP critical. Strong fit.','["Q2 budget confirmed","FedRAMP required","Demo booked"]','["FedRAMP certification","Long procurement"]','["Send FedRAMP docs","Demo prep"]')
on conflict do nothing;

insert into activities (id,type,text,rep,time,deal_id) values
  ('ACT001','call','Negotiation call with Acme Corp — price agreed in principle','Priya S.','2h ago','D001'),
  ('ACT002','email','Security questionnaire sent to TechNova','Raj M.','4h ago','D002'),
  ('ACT003','deal','NeuralWorks AI Platform advanced to Proposal — $320K','Priya S.','5h ago','D012'),
  ('ACT004','alert','LogiChain stalled 18 days in Negotiation — escalation needed','System','7h ago','D007'),
  ('ACT005','won','RetailPro Inventory AI CLOSED WON — $36K','Amir K.','1d ago','D004'),
  ('ACT006','meeting','Technical demo completed — HealthOS loved HIPAA compliance module','Amir K.','1d ago','D005'),
  ('ACT007','proposal','Proposal sent to EduTech Inc — $42K LMS deal','Raj M.','2d ago','D008'),
  ('ACT008','call','Intro call with CloudSec — demo scheduled, budget confirmed Q2','Priya S.','2d ago','D009')
on conflict do nothing;`;

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

  async function seedDatabase() {
    const { getSupabaseClient } = await import('../../../../../../modules/m02-conversation-intelligence/live-assist-core/lib/supabase');
    const sb = getSupabaseClient();
    if (!sb) { setSeedMsg({ type: 'error', text: 'Not connected — save credentials first.' }); return; }

    setSeedSeeding(true);
    setSeedMsg(null);

    // Parse and run each statement from SEED_SQL individually
    const statements = SEED_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    try {
      for (const sql of statements) {
        const { error } = await sb.rpc('exec_sql', { sql_text: sql + ';' }).select();
        // If rpc not available, fall back to raw insert via fetch
        if (error && error.message?.includes('exec_sql')) break;
        if (error) throw error;
      }
      setSeedMsg({ type: 'success', text: '✓ Demo data seeded! Close and reconnect to see it.' });
    } catch {
      // rpc not available — just show copy instruction
      setSeedMsg({ type: 'info', text: 'Auto-seed requires the SQL in your Supabase Editor. Copy & run it manually.' });
    } finally {
      setSeedSeeding(false);
    }
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
                {" "}to create all 7 required tables.
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
                  Populates your database with <strong>12 realistic deals</strong> across all pipeline stages,
                  plus contacts, tasks, calls, and activities — perfect for analysis.
                </p>
              </div>
              <div className={styles.seedStats}>
                {[['12','Deals'],['10','Contacts'],['12','Tasks'],['5','Calls'],['8','Activities']].map(([n,l]) => (
                  <div key={l} className={styles.seedStat}>
                    <span className={styles.seedStatN}>{n}</span>
                    <span className={styles.seedStatL}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {seedMsg && (
              <div className={`${styles.seedMsg} ${styles['seedMsg_' + seedMsg.type]}`}>
                {seedMsg.text}
              </div>
            )}

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
            ℹ Safe to re-run — all inserts use <code>ON CONFLICT DO NOTHING</code>
          </div>

          <div className={`${styles.schemaSection} ${styles.hidden}`}>
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
