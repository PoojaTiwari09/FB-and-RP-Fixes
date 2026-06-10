# Standalone module run commands

> **Canonical copy:** [`docs/reference/RUNBOOK.md`](../../reference/RUNBOOK.md)

Cross-module data flow: see app ARCHITECTURE.md

API documentation (frontend team): [api-docs/README.md](../api-docs/README.md)

Run each module **individually** (separate backend + frontend).

Repo root: `docker compose up -d`

App folder (all `pnpm` commands): monorepo root

```powershell
cd "<repo-root>"
pnpm install
```

Postgres (most modules):

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
```

Demo tenant (when using header auth):

```text
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002
```

---

## Quick reference — ports

| Module | Name | Backend port | Frontend port | Backend command | Frontend command |
|--------|------|--------------|---------------|-----------------|------------------|
| **M01** | Capture & Transcription | 3001 | 5174 | `pnpm run dev:m01-api` | `pnpm run dev:m01-web` |
| **M02** | Conversation Intelligence | 3002 | 5175 | `pnpm run dev:m02-api` | `pnpm run dev:m02-web` |
| **M03** | AI Summaries & GenAI | 4010 | 5177 | `pnpm run dev:m03-api` | `pnpm run dev:m03-web` |
| **M05** | Account Intelligence | 4012 | 5179 | `pnpm run dev:m05-api` | `pnpm run dev:m05-web` |
| **M07** | Revenue Dashboards | 4013 | 5180 | `pnpm run dev:m07-api` | `pnpm run dev:m07-web` |
| **M09** | Coaching & Training | 4009 | 5176 | `pnpm run dev:m09-api` | `pnpm run dev:m09-web` |
| **M10** | Data & Compliance | 4011 | 5178 | `pnpm run dev:m10-api` | `pnpm run dev:m10-web` |

Optional AI service (M03/M05 AI features):

| Service | Port | Command |
|---------|------|---------|
| Python AI | 8000 | `pnpm run dev:ai-services` |

---

## M01 — Capture & Transcription

| | URL |
|--|-----|
| **Frontend** | http://localhost:5174 |
| **Backend** | http://localhost:3001 |
| **API base** | http://localhost:3001/api/v1 |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m01-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m01-web
```

**Both (one line)**

```powershell
pnpm run dev:m01-m02
```

*(starts M01 + M02 APIs and webs — use only when running M01+M02 together)*

**Free ports:** `.\scripts\free_ports_m01_m02.ps1`

**Docs:** [INTEGRATION-M01-M02.md](./INTEGRATION-M01-M02.md)

---

## M02 — Conversation Intelligence

| | URL |
|--|-----|
| **Frontend** | http://localhost:5175 |
| **Backend** | http://localhost:3002 |
| **API base** | http://localhost:3002/api/v1 |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m02-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m02-web
```

**Free ports:** `.\scripts\free_ports_m01_m02.ps1`

**Docs:** [INTEGRATION-M01-M02.md](./INTEGRATION-M01-M02.md)

---

## M03 — AI Summaries & GenAI

| | URL |
|--|-----|
| **Frontend** | http://localhost:5177 |
| **Backend** | http://localhost:4010 |
| **API base** | http://localhost:4010/api/v1/ai-summaries-genai |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m03-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m03-web
```

**Both**

```powershell
pnpm run dev:m03
```

**Seed CRM data (accounts/deals for workspace UI)**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
node scripts/seed_m03_crm.cjs
```

Or (after API restart):

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4010/api/v1/ai-summaries-genai/test/seed-crm"
```

**Free ports:** `.\scripts\free_ports_m03.ps1`

**Docs:** `INTEGRATION-M03.md`

---

## M05 — Account Intelligence

| | URL |
|--|-----|
| **Frontend** | http://localhost:5179 |
| **Demo board** | http://localhost:5179/board/demo |
| **Backend** | http://localhost:4012 |
| **API base** | http://localhost:4012/api/v1/account-intelligence |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m05-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m05-web
```

**Both**

```powershell
pnpm run dev:m05
```

**Health check**

```powershell
Invoke-RestMethod -Uri "http://localhost:4012/api/v1/account-intelligence/test/health"
```

**Free ports:** `.\scripts\free_ports_m05.ps1`

**Docs:** [INTEGRATION-M05.md](./INTEGRATION-M05.md)

**Reload demo seed + verification matrix**

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4012/api/v1/account-intelligence/test/seed"
Invoke-RestMethod -Uri "http://localhost:4012/api/v1/account-intelligence/test/verification"
```

Boards: http://localhost:5179/board/demo (4 accounts, 3 tabs) · http://localhost:5179/board/commercial

**Feature verification table:** `M05-VERIFICATION.md`

**HubSpot live data:** set `HUBSPOT_ACCESS_TOKEN` + `HUBSPOT_PORTAL_ID` in `.env`, restart API, role **admin** → **Sync now** in UI. See [INTEGRATION-M05.md](./INTEGRATION-M05.md).

**Cross-module (M10):** board header → **Data & Compliance (M10)** · **Revenue Graph** (opens http://localhost:5178). Env: `VITE_M10_WEB_URL` in `apps/web/src/modules/m05-account-intelligence/.env.development`.

---

## M07 — Revenue Dashboards

| | URL |
|--|-----|
| **Frontend** | http://localhost:5180 |
| **Dashboard builder** | http://localhost:5180/dashboards |
| **Datasets** | http://localhost:5180/datasets |
| **Backend** | http://localhost:4013 |
| **API base** | http://localhost:4013/api/v1/revenue-dashboards |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m07-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m07-web
```

**Both**

```powershell
pnpm run dev:m07
```

**Seed tenant + user (Postgres, for saved dashboards)**

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:5180/api/seed"
```

**Health check**

```powershell
Invoke-RestMethod -Uri "http://localhost:4013/api/v1/revenue-dashboards/test/health"
```

**Free ports:** `.\scripts\free_ports_m07.ps1`

**Note:** M07 UI uses Next.js API routes on port **5180** (`/api/dashboards`, etc.). Nest API on **4013** serves KPIs, sample dashboards, and widget catalog when wired via `NEXT_PUBLIC_API_URL`.

**Prisma 500 (`@prisma/client did not initialize`):** stop `dev:m07-web`, then:

```powershell
.\scripts\free_ports_m07.ps1
pnpm run db:generate
pnpm run dev:m07-web
```

**`EPERM` on `prisma generate`:** another Node process has the query engine locked. Stop M07 (and any other dev servers), run `.\scripts\free_ports_m07.ps1`, then `pnpm run db:generate`. You only need generate once unless the schema changed — `dev:m07-web` no longer runs it automatically.

---

## M09 — Coaching & Training

| | URL |
|--|-----|
| **Frontend** | http://localhost:5176 |
| **Login** | http://localhost:5176/login |
| **Backend** | http://localhost:4009 |
| **API base** | http://localhost:4009/api/v1/coaching-training |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m09-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m09-web
```

**Both**

```powershell
pnpm run dev:m09
```

**Demo login** (auto-seed on API boot)

| Email | Password |
|-------|----------|
| manager@example.com | password123 |
| rep@example.com | password123 |

**Free ports:** `.\scripts\free_ports_m09.ps1`

**Docs:** [INTEGRATION-M09.md](./INTEGRATION-M09.md)

---

## M10 — Data & Compliance

| | URL |
|--|-----|
| **Frontend** | http://localhost:5178 |
| **Backend** | http://localhost:4011 |
| **API base** | http://localhost:4011/api/v1/m10-data-compliance |

**Terminal 1 — backend**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m10-api
```

**Terminal 2 — frontend**

```powershell
pnpm run dev:m10-web
```

**Both**

```powershell
pnpm run dev:m10
```

**Seed Revenue Graph + Data Cloud (Postgres)**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run seed:m10
```

Or:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4011/api/v1/m10-data-compliance/test/seed"
```

**Health check**

```powershell
Invoke-RestMethod -Uri "http://localhost:4011/api/v1/m10-data-compliance/test/health"
```

**Free ports:** `.\scripts\free_ports_m10.ps1`

**Docs:** [INTEGRATION-M10.md](./INTEGRATION-M10.md)

**Cross-module (M05):** top nav → **Account Intelligence (M05)** (http://localhost:5179/board/demo). Data Cloud deep link: `http://localhost:5178/?view=data-cloud`. Env: `VITE_M05_WEB_URL` in `apps/web/src/modules/m10-data-compliance/.env.development`.

---

## Common issues

### `EADDRINUSE` (port already in use)

Another instance is already running. Either use the existing URL, or free ports:

```powershell
.\scripts\free_ports_all.ps1       # all module ports (recommended)
.\scripts\free_ports_m01_m02.ps1   # 3001, 3002, 5174, 5175
.\scripts\free_ports_m03.ps1       # 4010, 5177
.\scripts\free_ports_m05.ps1       # 4012, 5179
.\scripts\free_ports_m07.ps1       # 4013, 5180
.\scripts\free_ports_m09.ps1       # 4009, 5176
.\scripts\free_ports_m10.ps1       # 4011, 5178
```

### Blank white page (M05)

Restart **m05-api** after pulling latest code, then hard-refresh http://localhost:5179/board/demo

### M03 shows only calls, no accounts

Run `node scripts/seed_m03_crm.cjs` or POST `.../test/seed-crm` (API must be restarted to expose route).

---

## Cross-module links (UI)

Configured in standalone Vite env files:

| From | Link | Target |
|------|------|--------|
| M02 header | Capture & transcript | http://localhost:5174 |
| M02 header | Revenue Intelligence | http://localhost:5176/login |
| M02 header | AI assist | http://localhost:5177 |
| M01 call detail | conversational_intelligence | http://localhost:5175 |
| M01 call detail | data and compliance | http://localhost:5178 |

---

## Per-module detail docs

| Module | File |
|--------|------|
| M01 + M02 | [INTEGRATION-M01-M02.md](./INTEGRATION-M01-M02.md) |
| M03 | [INTEGRATION-M03.md](./INTEGRATION-M03.md) |
| M05 | [INTEGRATION-M05.md](./INTEGRATION-M05.md), [M05-VERIFICATION.md](./M05-VERIFICATION.md) |
| M09 | [INTEGRATION-M09.md](./INTEGRATION-M09.md) |
| M10 | [INTEGRATION-M10.md](./INTEGRATION-M10.md) |
