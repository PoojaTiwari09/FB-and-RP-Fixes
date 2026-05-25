# Implementation Plan — Revenue Intelligence Dashboard
## For: Antigravity Development Team

---

## Project Summary

A multi-role, CRM-synced account management dashboard inspired by Gong's Revenue Intelligence UI.
Enables Sales Reps, Managers, and Admins to view, filter, and interact with live account data
aggregated from HubSpot, with AI-powered briefs and Q&A grounded strictly on CRM data.

**Demo constraints:** No auth flow. Hardcoded roles. One-time HubSpot sync. Local environment only.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| State | Zustand + localStorage |
| Backend API | NestJS |
| AI Service | FastAPI + Groq SDK (llama-3.3-70b-versatile) |
| Database | Supabase (PostgreSQL, local via Supabase CLI) |
| CRM | HubSpot API (one-time seed + write-back) |

---

## Repository Structure

```
/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   └── api/                    # NestJS backend
├── services/
│   └── ai/                     # FastAPI AI service
├── scripts/
│   ├── seed-hubspot.ts         # Seeds HubSpot with companies, contacts, deals, activities
│   ├── seed-supabase.ts        # Seeds Supabase board config + supplementary data
│   └── sync-once.ts            # One-time HubSpot → Supabase sync
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── data/                       # Generated seed JSON files (gitignored in prod)
│   ├── seed-p1-foundation.json
│   ├── seed-p2-deals.json
│   ├── seed-p3-activities.json
│   ├── seed-p4-supplementary.json
│   └── hubspot-id-map.json     # Written by seed-hubspot.ts, read by seed-supabase.ts
└── .env.local                  # All environment variables
```

---

## Environment Variables

```env
# HubSpot
HUBSPOT_ACCESS_TOKEN=your_private_app_token
HUBSPOT_PORTAL_ID=your_portal_id

# Supabase (local)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# Groq
GROQ_API_KEY=your_groq_api_key

# App
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_URL=http://localhost:8000
NESTJS_PORT=3001
FASTAPI_PORT=8000
```

---

## Phase Completion Tracker

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Data Foundation | ⬜ Not Started |
| Phase 2 | NestJS API | ⬜ Not Started |
| Phase 3 | Core Board UI | ⬜ Not Started |
| Phase 4 | Slide-in Panel | ⬜ Not Started |
| Phase 5 | Inline Editing & Write-back | ⬜ Not Started |
| Phase 6 | AI Service | ⬜ Not Started |
| Phase 7 | Admin & Polish | ⬜ Not Started |

---

---

# PHASE 1 — Data Foundation

## ⚠️ Manual Actions Required Before Phase 1

- [ ] **HubSpot:** Create a Private App in HubSpot (Settings → Integrations → Private Apps).
      Required scopes: `crm.objects.companies.read`, `crm.objects.companies.write`,
      `crm.objects.contacts.read`, `crm.objects.contacts.write`,
      `crm.objects.deals.read`, `crm.objects.deals.write`,
      `crm.objects.owners.read`, `engagements.read`, `engagements.write`.
      Copy the access token to `.env.local`.

- [ ] **Supabase:** Install Supabase CLI locally. Run `supabase init` and `supabase start`
      in the project root. Copy the local URL and keys to `.env.local`.

- [ ] **Groq:** Obtain API key from console.groq.com. Copy to `.env.local`.

- [ ] **Seed JSON files:** Run the 4 data generation prompts (see `data-generation-prompts.md`).
      Save outputs as `data/seed-p1-foundation.json` through `data/seed-p4-supplementary.json`.

## Phase 1 Complete When:
- [ ] Supabase migration runs without errors
- [ ] `seed-hubspot.ts` completes and writes `data/hubspot-id-map.json`
- [ ] `seed-supabase.ts` completes without errors
- [ ] `sync-once.ts` populates all `crm_*` tables in Supabase
- [ ] Supabase Studio shows data in all tables

---

## 1.1 Supabase Schema

**File:** `supabase/migrations/001_initial_schema.sql`

```sql
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
```

---

## 1.2 HubSpot Seed Script

**File:** `scripts/seed-hubspot.ts`

This script:
1. Creates custom properties on HubSpot objects
2. Reads `data/seed-p1-foundation.json`, `seed-p2-deals.json`, `seed-p3-activities.json`
3. Creates HubSpot objects via API (companies → contacts → deals → engagements)
4. Writes `data/hubspot-id-map.json` mapping local IDs → HubSpot IDs

### HubSpot Custom Properties to Create

**On Company object** (`/crm/v3/properties/companies`):
```typescript
const companyCustomProperties = [
  { name: 'exit_arr', label: 'Exit ARR', type: 'number', fieldType: 'number', groupName: 'companyinformation' },
  { name: 'segment', label: 'Segment', type: 'enumeration', fieldType: 'select',
    groupName: 'companyinformation',
    options: [
      { label: 'Mid-Market', value: 'Mid-Market' },
      { label: 'Enterprise', value: 'Enterprise' },
      { label: 'SMB', value: 'SMB' }
    ]
  },
  { name: 'board_assignment', label: 'Board Assignment', type: 'string', fieldType: 'text', groupName: 'companyinformation' },
  { name: 'local_id', label: 'Local ID (Dev)', type: 'string', fieldType: 'text', groupName: 'companyinformation' },
];
```

**On Deal object** (`/crm/v3/properties/deals`):
```typescript
const dealCustomProperties = [
  { name: 'deal_type', label: 'Deal Type', type: 'enumeration', fieldType: 'select',
    groupName: 'dealinformation',
    options: [
      { label: 'New Business', value: 'New Business' },
      { label: 'Renewal', value: 'Renewal' },
      { label: 'Upsell', value: 'Upsell' },
      { label: 'Cross-sell', value: 'Cross-sell' }
    ]
  },
  { name: 'adjusted_amount', label: 'Adjusted Amount', type: 'number', fieldType: 'number', groupName: 'dealinformation' },
];
```

**On Engagement (Call)** — stored as metadata in call properties:
```typescript
// These are set as custom engagement properties on call objects
const callCustomProperties = [
  { name: 'rep_talk_pct', label: 'Rep Talk %', type: 'number', fieldType: 'number' },
  { name: 'client_talk_pct', label: 'Client Talk %', type: 'number', fieldType: 'number' },
];
```

### Seed Script Pseudocode

```typescript
// scripts/seed-hubspot.ts
import * as hubspot from '@hubspot/api-client';

const client = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

async function main() {
  const idMap: Record<string, string> = {};  // local_id → hubspot_id

  // Step 1: Create custom properties
  await createCustomProperties(client);

  // Step 2: Create companies
  for (const company of foundation.companies) {
    const result = await client.crm.companies.basicApi.create({
      properties: {
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        type: company.type,
        city: company.city,
        country: company.country,
        numberofemployees: String(company.employee_count),
        exit_arr: String(company.exit_arr),
        segment: company.segment,
        board_assignment: company.board,
        local_id: company.id,
      }
    });
    idMap[company.id] = result.id;
  }

  // Step 3: Create contacts and associate to companies
  for (const contact of foundation.contacts) {
    const result = await client.crm.contacts.basicApi.create({
      properties: {
        firstname: contact.first_name,
        lastname: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        jobtitle: contact.job_title,
      }
    });
    idMap[contact.id] = result.id;

    // Associate contact to company
    await client.crm.contacts.associationsApi.create(
      result.id, 'companies', idMap[contact.company_id],
      [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]
    );
  }

  // Step 4: Create deals
  for (const deal of deals.deals) {
    const result = await client.crm.deals.basicApi.create({
      properties: {
        dealname: deal.name,
        dealstage: mapDealStageToHubspot(deal.stage),
        amount: String(deal.amount),
        adjusted_amount: String(deal.adjusted_amount),
        deal_type: deal.deal_type,
        closedate: new Date(deal.close_date).getTime().toString(),
      }
    });
    idMap[deal.id] = result.id;

    // Associate deal to company
    await client.crm.deals.associationsApi.create(
      result.id, 'companies', idMap[deal.company_id],
      [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }]
    );
  }

  // Step 5: Create engagements (calls, emails, meetings)
  for (const activity of activities.activities) {
    const engagementData = buildEngagementPayload(activity, idMap);
    const result = await client.apiRequest({
      method: 'POST',
      path: '/engagements/v1/engagements',
      body: engagementData
    });
    idMap[activity.id] = result.engagement.id;
  }

  // Step 6: Write ID map
  fs.writeFileSync('data/hubspot-id-map.json', JSON.stringify(idMap, null, 2));
  console.log('✅ HubSpot seed complete. ID map written to data/hubspot-id-map.json');
}

// Call engagement payload shape:
function buildCallPayload(activity, idMap) {
  return {
    engagement: { type: 'CALL', timestamp: new Date(activity.timestamp).getTime() },
    associations: {
      companyIds: [idMap[activity.company_id]],
      contactIds: [idMap[activity.contact_id]],
    },
    metadata: {
      body: activity.body,
      durationMilliseconds: activity.duration_seconds * 1000,
      status: 'COMPLETED',
      disposition: mapOutcomeToHubspot(activity.outcome),
    },
    properties: [
      { name: 'rep_talk_pct', value: String(activity.rep_talk_pct) },
      { name: 'client_talk_pct', value: String(activity.client_talk_pct) },
    ]
  };
}
```

---

## 1.3 Supabase Seed Script

**File:** `scripts/seed-supabase.ts`

Reads `data/seed-p1-foundation.json`, `data/seed-p4-supplementary.json`, and `data/hubspot-id-map.json`.
Inserts board config, tabs, columns, permission profiles, and supplementary accounts.

```typescript
// scripts/seed-supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const idMap = JSON.parse(fs.readFileSync('data/hubspot-id-map.json', 'utf8'));
  const supplementary = JSON.parse(fs.readFileSync('data/seed-p4-supplementary.json', 'utf8'));

  // 1. Seed board_config
  await supabase.from('board_config').insert(supplementary.board_config.map(b => ({
    board_id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    default_sort_field: b.default_sort_field,
    default_sort_dir: b.default_sort_dir,
    date_filter_enabled: b.date_filter_enabled,
    ai_briefs_enabled: b.ai_briefs_enabled,
    created_by: b.created_by,
    created_at: b.created_at,
  })));

  // 2. Seed board_tabs
  await supabase.from('board_tabs').insert(supplementary.board_tabs.map(t => ({
    tab_id: t.id,
    board_id: t.board_id,
    label: t.label,
    order: t.order,
    filter_logic: t.filter_logic,
    is_default: t.is_default,
  })));

  // 3. Seed board_columns
  await supabase.from('board_columns').insert(supplementary.board_columns);

  // 4. Seed permission_profiles
  await supabase.from('permission_profiles').insert(supplementary.permission_profiles.map(p => ({
    role: p.role,
    can_view_all_reps: p.can_view_all_reps,
    can_edit_board_config: p.can_edit_board_config,
    can_edit_columns: p.can_edit_columns,
    can_inline_edit: p.can_inline_edit,
    can_view_ai_briefs: p.can_view_ai_briefs,
    can_trigger_sync: p.can_trigger_sync,
  })));

  // 5. Seed supplementary_accounts (requires HubSpot IDs from idMap)
  const foundation = JSON.parse(fs.readFileSync('data/seed-p1-foundation.json', 'utf8'));
  await supabase.from('supplementary_accounts').insert(
    supplementary.supplementary_accounts.map(s => {
      const company = foundation.companies.find(c => c.id === s.company_id);
      const hubspotId = idMap[s.company_id];
      return {
        company_hubspot_id: hubspotId,
        manager_note: s.manager_note,
        next_qbr_date: s.next_qbr_date,
        ai_risk_score: s.ai_risk_score,
        risk_label: s.risk_label,
        strategic_priority: s.strategic_priority,
        created_at: s.created_at,
      };
    })
  );

  console.log('✅ Supabase seed complete.');
}
```

---

## 1.4 One-Time Sync Script

**File:** `scripts/sync-once.ts`

Pulls all data from HubSpot API and writes to Supabase `crm_*` tables.
Uses the HubSpot list + batch APIs for pagination.

```typescript
// scripts/sync-once.ts
// Order of operations:
// 1. Sync companies → crm_companies
// 2. Sync contacts → crm_contacts (with company association)
// 3. Sync deals → crm_deals (with company association)
// 4. Sync engagements → crm_activities (calls, emails, meetings)
//    For calls: extract rep_talk_pct and client_talk_pct from custom properties

// Key HubSpot API calls:
// GET /crm/v3/objects/companies?properties=name,domain,industry,...&limit=100
// GET /crm/v3/objects/contacts?properties=...
// GET /crm/v3/objects/deals?properties=...
// GET /engagements/v1/engagements/paged?limit=100

// For each engagement, determine type and extract type-specific fields.
// Write to Supabase with upsert on hubspot_id.
```

---

---

# PHASE 2 — NestJS API

## ⚠️ Manual Actions Required Before Phase 2
- [ ] Phase 1 fully complete — Supabase populated, HubSpot seeded
- [ ] Run `npm install` in `apps/api/`
- [ ] Confirm `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HUBSPOT_ACCESS_TOKEN` in `.env.local`

## Phase 2 Complete When:
- [ ] All API routes return correct data from Supabase
- [ ] HubSpot write-back works for all 5 editable fields
- [ ] Account query with filters/sort/pagination works

---

## 2.1 NestJS Project Structure

```
apps/api/src/
├── main.ts
├── app.module.ts
├── config/
│   ├── supabase.ts              # Supabase client singleton
│   └── hubspot.ts               # HubSpot client singleton
├── boards/
│   ├── boards.module.ts
│   ├── boards.controller.ts     # GET /boards, GET /boards/:slug
│   └── boards.service.ts
├── accounts/
│   ├── accounts.module.ts
│   ├── accounts.controller.ts   # GET /accounts, GET /accounts/:hubspotId
│   └── accounts.service.ts      # filter engine, aggregation join
├── activities/
│   ├── activities.module.ts
│   ├── activities.controller.ts # GET /activities/:companyId
│   └── activities.service.ts
├── edits/
│   ├── edits.module.ts
│   ├── edits.controller.ts      # PATCH /edits/:companyId or /edits/deal/:dealId
│   └── edits.service.ts         # validation + HubSpot write-back + Supabase upsert
├── todos/
│   ├── todos.module.ts
│   ├── todos.controller.ts      # GET/POST/PATCH/DELETE /todos/:companyId
│   └── todos.service.ts
└── sync/
    ├── sync.module.ts
    └── sync.controller.ts       # POST /sync/trigger (admin only)
```

---

## 2.2 API Contract

### Boards

**GET /boards**
Returns all 3 board configs with their tabs.
```typescript
// Response
{
  boards: [{
    id: string,
    name: string,
    slug: string,
    tabs: [{
      id: string,
      label: string,
      order: number,
      is_default: boolean,
      filter_logic: FilterLogic
    }],
    columns: ColumnConfig[]
  }]
}
```

**GET /boards/:slug**
Returns single board config. Used on board navigation.

---

### Accounts

**GET /accounts**

Query params:
```
board_slug: string           // required — "commercial" | "enterprise" | "smb"
tab_id?: string              // applies tab filter_logic on top of base query
rep_id?: string              // filter by assigned rep (manager view: comma-separated)
period?: string              // "last_quarter" | "last_month" | "all_time" | custom range
sort_field?: string          // column field_key
sort_dir?: "asc" | "desc"
page?: number                // default 1
page_size?: number           // 10 | 20 | 50, default 20
```

Response shape:
```typescript
{
  total: number,
  page: number,
  page_size: number,
  summary: {                           // drives the summary strip
    all_count: number,
    all_arr: number,
    tab_counts: Record<tab_id, { count: number, arr: number }>
  },
  accounts: [{
    hubspot_id: string,
    local_id: string,
    name: string,
    domain: string,
    segment: string,
    industry: string,
    type: string,
    exit_arr: number,
    contacts_count: number,
    assigned_rep: { id: string, name: string },
    last_activity_date: string | null,
    last_activity_days: number | null,
    zero_activity_flag: boolean,
    manager_note: string | null,
    next_qbr_date: string | null,
    ai_risk_score: number,
    risk_label: string,
    strategic_priority: boolean,
    open_deals_summary: {
      count: number,
      total_amount: number
    },
    renewal_date: string | null,       // earliest open renewal deal close_date
    activities_21d: ActivityDot[]      // for timeline rendering — see spec below
  }]
}
```

**ActivityDot shape** (one per activity in last 21 days):
```typescript
{
  id: string,
  type: "CALL" | "EMAIL" | "MEETING",
  direction: "OUTBOUND" | "INBOUND" | "N/A",
  timestamp: string,           // ISO datetime
  days_ago: number,            // 0–21, used for x-position
  rep_talk_pct?: number,       // calls only
  client_talk_pct?: number,    // calls only
  duration_seconds?: number,   // calls + meetings
  outcome?: string,            // calls only
  subject?: string,            // emails only
  is_future: boolean,          // true if timestamp > now (scheduled activities)
}
```

**GET /accounts/:hubspotId**
Full account detail. Returns everything above plus:
- Full contact list
- Full deal list (open + recently closed within 90 days)
- All activities (not just 21d) for the Activity Timeline tab
- Supplementary data

---

### Edits (Write-back)

**PATCH /edits/company/:hubspotId**

Editable company fields: `type`, `account_type`

```typescript
// Request body
{ field: "type", value: "Customer", role: "manager" }

// Response
{ success: true, hubspot_updated: true, supabase_updated: true }
// OR on validation failure:
{ success: false, error: "Invalid value for field 'type'", hubspot_updated: false }
```

**PATCH /edits/deal/:dealId**

Editable deal fields: `stage`, `close_date`

```typescript
// Request body
{ field: "stage", value: "Contract Negotiation", role: "rep" }
```

**PATCH /edits/supplementary/:companyHubspotId**

Fields: `manager_note`, `next_qbr_date` (Supabase only, no HubSpot write-back)

```typescript
// Request body
{ field: "manager_note", value: "Follow up re: renewal before Dec 20", role: "manager" }
```

**Validation rules in edits.service.ts:**
- `stage` must be one of the valid HubSpot deal stages
- `close_date` must be a valid future or present date (ISO string)
- `type` must be "Customer" or "New Business"
- `manager_note` max 500 chars
- All writes are audited: log `{ field, old_value, new_value, role, timestamp }` to console (no audit table needed for demo)

---

### Activities

**GET /activities/:companyHubspotId**

Query params:
```
type?: "CALL" | "EMAIL" | "MEETING"   // optional filter
limit?: number                          // default 50
```

Returns full activity log for the Activity Timeline tab.

---

### Todos & Notes

**GET /todos/:companyHubspotId** — returns all todos + notes for this account

**POST /todos/:companyHubspotId** — create todo or note
```typescript
{ type: "todo" | "note", content: string, role: string }
```

**PATCH /todos/:todoId** — toggle completed, update content

**DELETE /todos/:todoId** — delete

---

### Sync (Admin)

**POST /sync/trigger** — re-runs sync-once logic (admin role only, returns job status)

---

## 2.3 Tab Filter Engine

The tab `filter_logic` JSON is evaluated in `accounts.service.ts` by translating conditions to Supabase query clauses:

```typescript
// accounts.service.ts
function applyTabFilter(query: PostgrestFilterBuilder, filterLogic: FilterLogic) {
  const { operator, conditions } = filterLogic;

  // For AND: chain .filter() calls
  // For OR: use .or() with comma-separated filters

  for (const condition of conditions) {
    switch (condition.field) {
      case 'deal_type':
        // JOIN crm_deals and filter by deal_type
        break;
      case 'last_activity_days':
        // Use engagement_aggregates view
        break;
      case 'ai_risk_score':
        // JOIN supplementary_accounts
        break;
      case 'zero_activity_flag':
        // Use engagement_aggregates view
        break;
    }
  }
}
```

---

---

# PHASE 3 — Core Board UI

## ⚠️ Manual Actions Required Before Phase 3
- [ ] Phase 2 API running at `http://localhost:3001`
- [ ] Run `npm install` in `apps/web/`

## Phase 3 Complete When:
- [ ] Board table renders with real data from API
- [ ] Activity timeline dots render correctly for all activity types
- [ ] Dual call bubbles sized by talk % render correctly
- [ ] Summary strip shows correct ARR totals and filters table on click
- [ ] Role switcher changes visible data
- [ ] Pagination works

---

## 3.1 Next.js Project Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx                        # Root layout, role switcher header
│   ├── page.tsx                          # Redirects to /board/commercial
│   └── board/
│       └── [slug]/
│           ├── page.tsx                  # Main board page
│           └── loading.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx                    # Board selector + role switcher + search
│   │   └── Sidebar.tsx                   # Gong-style left nav (Revenue → Accounts)
│   ├── board/
│   │   ├── BoardView.tsx                 # Orchestrator — renders strip + table
│   │   ├── SummaryStrip.tsx              # 4-tab summary cards (ARR + count)
│   │   ├── FilterBar.tsx                 # Team + Period + Add Filter
│   │   ├── AccountTable.tsx              # Table wrapper with sort/pagination
│   │   ├── AccountRow.tsx                # Single table row
│   │   └── ActivityTimeline.tsx          # ⭐ Core visual — see spec below
│   ├── panel/
│   │   ├── AccountPanel.tsx              # Slide-in panel container
│   │   ├── tabs/
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── ActivityTimelineTab.tsx
│   │   │   ├── AIBriefsTab.tsx
│   │   │   ├── TodosTab.tsx
│   │   │   ├── NotesTab.tsx
│   │   │   └── CRMSyncTab.tsx
│   │   └── AISummaryGenerator.tsx
│   ├── admin/
│   │   └── BoardWizard.tsx               # 4-step admin config wizard
│   └── ui/
│       ├── InlineEdit.tsx                # Click-to-edit field component
│       └── Toast.tsx                     # Success/error toasts
├── store/
│   ├── useSessionStore.ts                # Zustand: role, activeBoard, filters, sort, pageSize
│   └── usePanelStore.ts                  # Zustand: open panel, active tab, selected account
├── lib/
│   ├── api.ts                            # Typed fetch wrappers for NestJS endpoints
│   └── utils.ts                          # Date formatting, ARR formatting
└── types/
    └── index.ts                          # Shared TypeScript types
```

---

## 3.2 Zustand Store Slices

```typescript
// store/useSessionStore.ts
interface SessionState {
  role: 'rep' | 'manager' | 'admin';
  setRole: (role: Role) => void;
  activeBoard: string;                   // board slug
  setActiveBoard: (slug: string) => void;
  activeTabId: string | null;
  setActiveTabId: (id: string) => void;
  selectedRepIds: string[];              // for manager view
  setSelectedRepIds: (ids: string[]) => void;
  period: string;
  setPeriod: (p: string) => void;
  customFilters: FilterCondition[];
  setCustomFilters: (f: FilterCondition[]) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  setSortField: (f: string) => void;
  setSortDir: (d: 'asc' | 'desc') => void;
  pageSize: 10 | 20 | 50;
  setPageSize: (n: 10 | 20 | 50) => void;
  page: number;
  setPage: (n: number) => void;
}

// Persist to localStorage:
// { role, activeBoard, activeTabId, period, sortField, sortDir, pageSize }
// Restore on app load via zustand/persist middleware

// store/usePanelStore.ts
interface PanelState {
  isOpen: boolean;
  selectedAccountId: string | null;      // hubspot_id
  activeTab: PanelTab;                   // 'overview' | 'timeline' | 'briefs' | 'todos' | 'notes' | 'crm'
  openPanel: (accountId: string) => void;
  closePanel: () => void;
  setActiveTab: (tab: PanelTab) => void;
}
```

---

## 3.3 Activity Timeline Component — Detailed Spec

**File:** `components/board/ActivityTimeline.tsx`

This is the most important visual component. Renders a 21-day dot timeline per account row.

### Layout
- Fixed width container (matches `activity_timeline` column width: 320px)
- X-axis: 21 days, left = oldest, right = most recent (today)
- Each day maps to a pixel position: `x = (21 - days_ago) / 21 * containerWidth`
- No visible axis labels in the table row (kept clean)

### Dot Rendering Rules

```typescript
interface DotConfig {
  cx: number;          // x position in SVG
  cy: number;          // y center — 20px (single row height)
  r: number;           // radius
  fill: string;        // color
  stroke?: string;     // for hollow dots
  icon?: 'phone';      // for call dots
}

const COLORS = {
  rep: '#7C3AED',          // purple — rep/outbound
  client: '#EC4899',       // pink — client/inbound
  meeting: '#9CA3AF',      // gray
};

const BASE_RADIUS = 5;
const MAX_RADIUS = 12;
const CALL_MAX_DIAMETER = 22;  // max diameter for talk% bubble

function getCallBubbleRadius(talk_pct: number): number {
  // Diameter ∝ √(talk_pct) × maxDiameter
  return (Math.sqrt(talk_pct / 100) * CALL_MAX_DIAMETER) / 2;
}
```

### Per Activity Type

**EMAIL (outbound):**
- Single solid purple dot, radius `BASE_RADIUS` (5px)
- Fill: `#7C3AED`

**EMAIL (inbound):**
- Single hollow pink ring, radius `BASE_RADIUS`
- Fill: transparent, stroke: `#EC4899`, strokeWidth: 1.5

**MEETING:**
- Single solid gray dot, radius 7px
- Fill: `#9CA3AF`

**CALL (past, talk% known):**
- TWO dots side by side at the same x position, 3px gap between them
- Left dot: rep (purple), radius = `getCallBubbleRadius(rep_talk_pct)`
- Right dot: client (pink), radius = `getCallBubbleRadius(client_talk_pct)`
- Both solid filled
- Each has a tiny phone icon overlay (SVG path centered in dot)

**CALL (future/scheduled):**
- Same as call above but both dots are hollow (fill: transparent, stroke colored)

**CALL (talk% unknown / Left Voicemail / No Answer):**
- Single purple dot, radius `BASE_RADIUS`, with phone icon

### Collision handling
If two activities fall on the same day, offset their y positions:
- First activity: cy = 20
- Second: cy = 10
- Third: cy = 30
- (Max 3 visible per day slot in the row view; overflow hidden)

### Tooltip
On hover over any dot cluster, show a small tooltip:
- Date + time
- Type + direction
- For calls: "Rep: 55% | Client: 45%" + duration
- For emails: subject line
- For meetings: title + duration

---

## 3.4 Summary Strip Component

```typescript
// SummaryStrip.tsx
// Renders 4 clickable cards above the table
// Data comes from GET /accounts response.summary.tab_counts

interface SummaryCard {
  tab_id: string;
  label: string;         // "Accounts", "Renewal", "Upsell", "At Risk"
  arr: number;           // formatted as "$920,000"
  count: number;         // shown in parentheses
  is_active: boolean;    // highlighted when this tab is selected
}

// Clicking a card → setActiveTabId(tab_id) in useSessionStore
// Active card: purple left border, slightly elevated background
```

---

---

# PHASE 4 — Slide-in Panel

## ⚠️ Manual Actions Required Before Phase 4
- [ ] Phase 3 board renders correctly end-to-end

## Phase 4 Complete When:
- [ ] Clicking any row opens the panel with correct account data
- [ ] All 6 tabs render with real data
- [ ] "Go to CRM profile" link opens HubSpot company in new tab
- [ ] To-dos can be created, completed, and deleted

---

## 4.1 Panel Architecture

The panel slides in from the right, overlapping (not pushing) the table.
Width: 520px. Backdrop does not dim the table.
Closing: X button or pressing Escape.

**Data loading strategy:**
- On panel open: `GET /accounts/:hubspotId` (full detail)
- Panel keeps its own local loading state
- Each tab lazy-fetches only what it needs (AI briefs, todos loaded when tab clicked)

### Overview Tab Data

Sections rendered in order:
1. **Account Details** (2-column grid)
   - Last Activity Date | Account Owner
   - Account Type (inline editable → PATCH /edits/company) | Industry
   - Next QBR Date (inline editable → PATCH /edits/supplementary) | AI Risk Score badge

2. **Open & Recently Closed Deals** (list)
   - Each deal: name, stage (inline editable → PATCH /edits/deal), close date (inline editable), amount
   - Stage shown as colored badge; click to open dropdown

3. **AI Summary Generator**
   - Scope dropdown: "Entire Account" | "Deals Only"
   - Period dropdown: "90 days" | "180 days" | "All time"
   - "Generate" button → POST to FastAPI `/ai/summary`
   - Shows loading spinner then renders structured brief
   - Brief sections: Status, Key Risks, Recommended Next Steps (with cited activities)

### Activity Timeline Tab

Full chronological list of all activities (not just 21 days).
- Filterable by type (All / Calls / Emails / Meetings)
- Each row: icon + date/time + direction + body summary
- For calls: show talk% bar (purple/pink split bar showing rep vs client %)
- Rep attribution shown on each activity

### AI Briefs Tab

Same as Summary Generator but pre-loaded with last generated brief.
Scope + period selectors + regenerate button.
Brief rendered as structured sections with citation footnotes.

### To-dos Tab

Simple task list:
- Each todo: checkbox + text + delete button
- Add todo: inline text input at bottom (press Enter to save)
- Completed todos shown struck-through
- Count badge on tab label (only uncompleted)

### Notes Tab

Single textarea for manager notes.
Auto-saves on blur → PATCH /edits/supplementary (manager_note field).
Timestamp of last save shown below.

### CRM Sync Tab

Read-only sync status display:
- Last synced: timestamp
- Per-field sync status table (field name | HubSpot value | Supabase value | In sync: ✅/⚠️)
- "Go to CRM profile" button: opens `https://app.hubspot.com/contacts/{portalId}/company/{hubspotId}`
- "Re-sync this account" button (admin only) → POST /sync/trigger

---

---

# PHASE 5 — Inline Editing & Write-back

## ⚠️ Manual Actions Required Before Phase 5
- [ ] None — all automated

## Phase 5 Complete When:
- [ ] All 5 editable fields can be edited inline
- [ ] Changes reflect in HubSpot within 5 seconds of save
- [ ] Optimistic update reverts correctly on API failure
- [ ] Toast notifications appear for success and error

---

## 5.1 InlineEdit Component

```typescript
// components/ui/InlineEdit.tsx
// Generic component handling all inline edit UX

interface InlineEditProps {
  value: string | null;
  fieldKey: string;
  displayType: 'text' | 'date' | 'select';
  options?: { label: string; value: string }[];    // for select type
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

// Behavior:
// 1. Renders value as styled text (with subtle edit pencil icon on hover)
// 2. Click → switches to input/select/datepicker
// 3. On confirm (Enter or blur): call onSave(newValue)
// 4. While saving: show spinner, keep optimistic value displayed
// 5. On success: show success toast, keep new value
// 6. On error: show error toast, revert to original value
```

## 5.2 Write-back Flow

```
User edits field
  → InlineEdit.onSave(newValue) called
  → Optimistic update: local state immediately shows newValue
  → PATCH /edits/{type}/{id} { field, value, role }
  → NestJS edits.service:
      → Validate field + value
      → If HubSpot field: client.crm.*.basicApi.update(hubspotId, { properties: { [field]: value } })
      → If Supabase-only field: supabase.from('supplementary_accounts').update(...)
      → Return { success, hubspot_updated, supabase_updated }
  → If success: show "Saved" toast (green, 2s)
  → If error: revert optimistic update, show error toast (red, 4s) with error message
```

---

---

# PHASE 6 — AI Service

## ⚠️ Manual Actions Required Before Phase 6
- [ ] `GROQ_API_KEY` set in `.env.local`
- [ ] Run `pip install fastapi uvicorn groq` in `services/ai/`

## Phase 6 Complete When:
- [ ] Ask AI chat returns grounded answers with citations
- [ ] AI Summary Generator returns structured brief
- [ ] Response cache works (second request for same scope/period returns cached result)
- [ ] Fallback message shown if account has fewer than 2 activities

---

## 6.1 FastAPI Structure

```
services/ai/
├── main.py
├── routers/
│   ├── summary.py          # POST /ai/summary
│   └── chat.py             # POST /ai/chat
├── services/
│   ├── context_builder.py  # Fetches account data from Supabase for grounding
│   ├── groq_client.py      # Groq SDK wrapper
│   └── cache.py            # In-memory cache (dict keyed by company+scope+period)
└── models/
    └── schemas.py          # Pydantic request/response models
```

## 6.2 Endpoints

**POST /ai/summary**
```python
# Request
{
  "company_hubspot_id": str,
  "scope": "entire_account" | "deals_only",
  "period_days": 90 | 180 | 0   # 0 = all time
}

# Response
{
  "brief": {
    "status": "string",                   # 1-2 sentence executive status
    "key_risks": ["string"],              # 2-3 bullet risks
    "recommended_steps": ["string"],      # 2-3 actionable next steps
    "citations": [                        # activities cited in the brief
      { "activity_id": str, "type": str, "date": str, "summary": str }
    ]
  },
  "generated_at": str,
  "cached": bool,
  "data_period": str,
  "insufficient_data": bool              # true if < 2 activities found
}
```

**POST /ai/chat**
```python
# Request
{
  "company_hubspot_id": str,
  "message": str,
  "conversation_history": [             # prior turns for context retention
    { "role": "user" | "assistant", "content": str }
  ]
}

# Response
{
  "reply": str,
  "citations": [
    { "activity_id": str, "type": str, "date": str, "summary": str }
  ],
  "insufficient_data": bool
}
```

## 6.3 Context Builder

```python
# services/context_builder.py
# Fetches from Supabase and constructs the grounding context string

def build_account_context(company_hubspot_id: str, scope: str, period_days: int) -> str:
    # 1. Fetch company details from crm_companies + supplementary_accounts
    # 2. Fetch deals from crm_deals (filter by scope)
    # 3. Fetch activities from crm_activities (filter by period_days)
    # 4. Format into structured text block:

    context = f"""
ACCOUNT: {company.name}
INDUSTRY: {company.industry} | SEGMENT: {company.segment}
EXIT ARR: ${company.exit_arr:,.0f} | RISK SCORE: {supp.ai_risk_score} ({supp.risk_label})
LAST ACTIVITY: {aggregates.last_activity_date}

OPEN DEALS:
{format_deals(deals)}

RECENT ACTIVITIES ({period_label}):
{format_activities(activities)}
    """
    return context
```

## 6.4 Groq Prompt Templates

**Summary prompt:**
```python
SUMMARY_SYSTEM_PROMPT = """
You are a revenue intelligence assistant. You analyze CRM and sales activity data to generate executive-level account briefs.

STRICT RULES:
1. ONLY use the data provided in the context. Do not infer, assume, or add external knowledge.
2. If the data contains fewer than 2 meaningful interactions, respond with insufficient_data: true and a brief explanation.
3. Every claim in your brief must be traceable to a specific activity or deal in the context.
4. Return ONLY valid JSON matching the required schema. No markdown, no preamble.
5. Citations must reference the exact activity IDs provided in the context.

Required JSON schema:
{
  "status": "string",
  "key_risks": ["string", "string"],
  "recommended_steps": ["string", "string"],
  "citations": [{"activity_id": "string", "type": "string", "date": "string", "summary": "string"}],
  "insufficient_data": false
}
"""

def build_summary_user_prompt(context: str) -> str:
    return f"""
Generate an executive account brief based STRICTLY on this data:

{context}

Return JSON only.
"""
```

---

---

# PHASE 7 — Admin Wizard & Polish

## ⚠️ Manual Actions Required Before Phase 7
- [ ] None — all automated

## Phase 7 Complete When:
- [ ] Admin wizard can create/edit a board and tabs (saves to Supabase)
- [ ] Session persists correctly across page refreshes
- [ ] Multi-board switching works with state restoration
- [ ] UI matches the Gong-style reference screenshots

---

## 7.1 Admin Board Config Wizard

4-step modal wizard accessible when role = "admin" via an "Edit" button in the board header.

**Step 1 — Details:** Board name, description, date filter toggle, AI briefs toggle
**Step 2 — Tabs:** Add/edit/delete tabs. Each tab: label + filter logic builder (field/operator/value rows). Max 8 tabs.
**Step 3 — Columns:** Drag-to-reorder columns. Toggle visibility per role. Mark editable.
**Step 4 — AI Briefs:** Default scope, default period, enable/disable per tab.

On Save: PUT /boards/:slug (NestJS endpoint that upserts board_config, board_tabs, board_columns).

## 7.2 Session Persistence Behavior

On app load:
1. Read Zustand store (hydrated from localStorage by persist middleware)
2. Restore: `role`, `activeBoard`, `activeTabId`, `period`, `sortField`, `sortDir`, `pageSize`
3. Fetch board data with restored filters
4. If no stored state → use defaults: role=rep, board=commercial, first default tab

On board switch:
- Save current board state to `user_board_preferences` via PATCH /preferences
- Load stored preferences for new board (or defaults if first visit)

---

---

# Appendix A — HubSpot Field Mapping

| Local Field | HubSpot Object | HubSpot Property |
|---|---|---|
| name | Company | `name` |
| domain | Company | `domain` |
| industry | Company | `industry` |
| type | Company | `type` |
| employee_count | Company | `numberofemployees` |
| exit_arr | Company | `exit_arr` (custom) |
| segment | Company | `segment` (custom) |
| board | Company | `board_assignment` (custom) |
| deal.name | Deal | `dealname` |
| deal.stage | Deal | `dealstage` |
| deal.amount | Deal | `amount` |
| deal.adjusted_amount | Deal | `adjusted_amount` (custom) |
| deal.deal_type | Deal | `deal_type` (custom) |
| deal.close_date | Deal | `closedate` |
| activity.body | Engagement | `metadata.body` |
| activity.duration_seconds | Engagement (Call) | `metadata.durationMilliseconds` / 1000 |
| activity.rep_talk_pct | Engagement (Call) | custom property `rep_talk_pct` |
| activity.client_talk_pct | Engagement (Call) | custom property `client_talk_pct` |
| activity.outcome | Engagement (Call) | `metadata.disposition` |
| activity.subject | Engagement (Email) | `metadata.subject` |

---

# Appendix B — Run Order

```bash
# 1. Start Supabase locally
supabase start

# 2. Run schema migration
supabase db push

# 3. Seed HubSpot (run once)
npx ts-node scripts/seed-hubspot.ts

# 4. Seed Supabase (run once, after step 3)
npx ts-node scripts/seed-supabase.ts

# 5. Run one-time sync
npx ts-node scripts/sync-once.ts

# 6. Start NestJS API
cd apps/api && npm run start:dev

# 7. Start FastAPI AI service
cd services/ai && uvicorn main:app --reload --port 8000

# 8. Start Next.js frontend
cd apps/web && npm run dev

# App available at http://localhost:3000
# API at http://localhost:3001
# AI service at http://localhost:8000
# Supabase Studio at http://localhost:54323
```

---

# Appendix C — Demo Boards Reference

| Board | Slug | Tabs | Target Companies |
|---|---|---|---|
| Commercial — Getting to Power | commercial | All Accounts / Renewal / Upsell / At Risk | Acme Corp, BitForge, Cyberdyne Systems, Exemplar |
| Enterprise — Renewals | enterprise | All Accounts / Renewal / Churn Risk / No Activity | Fusion Connect, Legend Homes, Parker Smith, Technology Pacific |
| SMB — New Business | smb | All Accounts / Active Deals / Stalled / Closed Won | Southern Provider, NovaTech Solutions, Meridian Analytics, Apex Dynamics |

---

*Last updated: Phase 0 (Pre-implementation). Update phase tracker as each phase completes.*
