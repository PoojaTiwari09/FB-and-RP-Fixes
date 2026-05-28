# M03 AI Summaries & GenAI — standalone dev stack

Run M03 (AI Assist / Deep Research / Smart Summaries) without the monolith.

## Ports

| Service  | URL |
|----------|-----|
| m03-api  | http://localhost:4010 |
| m03-web  | http://localhost:5177 |
| Postgres | `DATABASE_URL` in monorepo `.env` (optional — dev uses in-memory workspace) |

API base (Vite proxy or direct):

`http://localhost:4010/api/v1/ai-summaries-genai`

## Prerequisites

From `boilerplate code/r-revenue-intelligence`:

```powershell
pnpm install
```

By default `M03_USE_LOCAL_FALLBACK=true` (in `apps/m03-api/.env`) — Ask Anything uses in-process mock answers without Python ai-services.

For live AI: run `pnpm run dev:ai-services` (port 8000), then set `M03_USE_LOCAL_FALLBACK=false` in `apps/m03-api/.env` and restart m03-api.

Optional: `GEMINI_API_KEY` or `GROQ_API_KEY` in monorepo `.env` when using ai-services.

Redis is optional (Bull queue uses lazy connect; worker is a stub).

## Start

**Terminal 1 — API**

```powershell
pnpm run dev:m03-api
```

**Terminal 2 — UI**

```powershell
pnpm run dev:m03-web
```

Or both:

```powershell
pnpm run dev:m03
```

## UI routes

| Page | URL |
|------|-----|
| Deep Research (default) | http://localhost:5177/research |
| Ask Anything | http://localhost:5177/ask-anything |
| Smart Summaries | http://localhost:5177/smart-summaries |

## Demo API headers

The UI sends these by default (see `m03Api.js`):

- `X-Org-Id`: `a0000000-0000-0000-0000-000000000001`
- `X-User-Id`: `c0000000-0000-0000-0000-000000000001`
- `X-Role`: `SALES_MANAGER`

## Health

- `GET http://localhost:4010/api/v1/ai-summaries-genai/test/health`
- `GET http://localhost:4010/api/v1/ai-summaries-genai/test/workspace-stats` — row counts per table
- Root info: http://localhost:4010/

## Postgres data (important)

M03 Smart Summaries reads:

| Tab | Postgres table |
|-----|----------------|
| Calls | `call_records` (+ `transcripts`) — populated by **M01** |
| Accounts | `Account` (public) — **not** created by M01 |
| Deals | `Deal` (public) — **not** created by M01 |
| Contacts | `m10_contacts` or call `participants` |

If you only ran M01, you will see **calls only** (expected). Check counts:

```powershell
node scripts/probe_m03_tables.cjs
```

Dev seed for Accounts + Deals (links existing calls):

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4010/api/v1/ai-summaries-genai/test/seed-crm"
```

Then refresh http://localhost:5177/smart-summaries.

## M02 navigation

In Conversation Intelligence (M02), **AI assist** in the header opens `http://localhost:5177` (configurable via `VITE_M03_WEB_URL`).

Full M01→M02→M03 data integration is separate — say **go** when ready.

## Free ports (Windows)

```powershell
.\scripts\free_ports_m03.ps1
```
