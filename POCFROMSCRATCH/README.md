# Revenue Intelligence Dashboard

A multi-role, CRM-synced account management dashboard inspired by Gong's Revenue Intelligence UI. Powered by HubSpot, Supabase, NestJS, Next.js, and Groq AI.

---

## Architecture

```
POCFROMSCRATCH/
├── apps/
│   ├── web/          # Next.js 16 frontend (React + Zustand)
│   └── api/          # NestJS backend (REST API)
├── services/
│   └── ai/           # FastAPI AI service (Groq llama-3.3-70b)
├── scripts/
│   ├── seed-hubspot.ts   # Seeds HubSpot with companies/contacts/deals/engagements
│   ├── seed-supabase.ts  # Seeds Supabase with board config and supplementary data
│   └── sync-once.ts      # One-time HubSpot → Supabase sync
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 001_initial_schema.sql
├── data/             # Seed JSON files + generated hubspot-id-map.json
└── .env.local        # Environment variables (DO NOT COMMIT)
```

---

## Prerequisites

- **Node.js** v20+
- **Python** 3.11+
- **Supabase CLI** — `npm install -g supabase`
- **HubSpot account** with a Private App token
- **Groq API key** — [console.groq.com](https://console.groq.com)

---

## Setup

### 1. Environment Variables

Copy `.env.local` and fill in your values:

```env
HUBSPOT_ACCESS_TOKEN=your_private_app_token
HUBSPOT_PORTAL_ID=your_portal_id

SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

GROQ_API_KEY=your_groq_api_key

NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_URL=http://localhost:8000
NESTJS_PORT=3001
```

### 2. HubSpot Private App Setup

In your HubSpot portal, create a Private App with these scopes:
- `crm.objects.companies.read` / `.write`
- `crm.objects.contacts.read` / `.write`
- `crm.objects.deals.read` / `.write`
- `crm.schemas.companies.read` / `.write`
- `crm.schemas.deals.read` / `.write`
- `crm.schemas.contacts.read` / `.write`
- `crm.schemas.custom.read`
- `engagements` (legacy v1)
- `timeline`

### 3. Supabase Local Setup

```bash
supabase start
# Copy the anon key and service role key into .env.local

supabase db push
# Applies migrations/001_initial_schema.sql
```

### 4. Install Dependencies

```bash
# Root (scripts)
npm install

# NestJS API
cd apps/api && npm install

# Next.js frontend
cd apps/web && npm install

# Python AI service
cd services/ai && pip install -r requirements.txt
```

---

## Data Pipeline (Run Once)

```bash
# Step 1: Seed HubSpot (creates companies, contacts, deals, engagements)
npm run seed:hubspot
# → Writes data/hubspot-id-map.json

# Step 2: Sync HubSpot → Supabase (crm_* tables)
npm run sync

# Step 3: Seed Supabase (board config, tabs, columns, permissions, supplementary)
npm run seed:supabase
```

---

## Running Locally

Open 3 terminal windows:

```bash
# Terminal 1 — NestJS API (port 3001)
npm run dev:api

# Terminal 2 — Next.js frontend (port 3000)
npm run dev:web

# Terminal 3 — FastAPI AI service (port 8000)
npm run dev:ai
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Features by Role

| Feature | Rep | Manager | Admin |
|---|---|---|---|
| View own accounts | ✅ | ✅ | ✅ |
| View all reps' accounts | ❌ | ✅ | ✅ |
| Inline edit manager note | ❌ | ✅ | ✅ |
| AI Briefs + Chat | ✅ | ✅ | ✅ |
| Todos & Notes | ✅ | ✅ | ✅ |
| Board Wizard (Admin) | ❌ | ❌ | ✅ |
| Trigger HubSpot Sync | ❌ | ❌ | ✅ |

---

## Key Design Decisions

- **No auth flow** — Role is selected via a 3-button switcher in the sidebar and persisted to `localStorage` via Zustand.
- **One-time HubSpot sync** — `sync-once.ts` pulls all CRM data from HubSpot API and upserts into Supabase `crm_*` tables. No live webhooks.
- **AI Caching** — Groq briefs are cached in the `ai_briefs_cache` Supabase table for 24 hours per (company, scope, period) combination.
- **Write-back strategy** — Inline edits attempt to update both HubSpot (via API) and Supabase simultaneously. If HubSpot fails, Supabase still updates and the UI is kept consistent.
- **Tab filter engine** — The NestJS accounts service applies tab filter logic post-query, supporting cross-table conditions (deals, activities, supplementary fields).

---

## API Routes

### NestJS (`localhost:3001`)

| Method | Path | Description |
|---|---|---|
| GET | `/boards` | All board configs with tabs + columns |
| GET | `/boards/:slug` | Single board by slug |
| GET | `/boards/team` | Team members |
| GET | `/boards/permissions/:role` | Role permissions |
| PUT | `/boards/:slug` | Update board config (admin) |
| GET | `/accounts?board_slug=...` | Accounts list with filters |
| GET | `/accounts/:hubspotId` | Account detail |
| GET | `/activities/:companyHubspotId` | Activity timeline |
| PATCH | `/edits/company/:id` | Inline edit company field |
| PATCH | `/edits/deal/:id` | Inline edit deal field |
| PATCH | `/edits/supplementary/:id` | Inline edit supplementary field |
| GET | `/todos/:companyHubspotId` | Get todos/notes |
| POST | `/todos/:companyHubspotId` | Create todo/note |
| PATCH | `/todos/:todoId` | Update todo |
| DELETE | `/todos/:todoId` | Delete todo |
| POST | `/sync/trigger` | Trigger HubSpot sync (admin) |

### FastAPI (`localhost:8000`)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/ai/summary` | Generate account brief |
| POST | `/ai/chat` | Conversational Q&A |
