# Integration-105 — Monorepo execution commands

Run commands from this repository root unless noted. Branch **Integration-105** ships the **unified API** (`apps/unified-api`) exposing **M01**, **M02**, **M09**, and **M08 Engage** frontend bridges on a single port.

| Service | URL | Notes |
|---------|-----|--------|
| **Unified API** | http://localhost:3001 | M01 + M02 + M09 + M08 Engage |
| **Postgres** | `127.0.0.1:5433` | Docker `revenue_intel_db` |
| **Redis** | `127.0.0.1:6379` | Docker `revenue_intel_redis` |
| **Unified UI** (sibling repo) | http://localhost:3000 | `Revenue-Intelligence-UI/Revenue-Intelligence-UI` — points all `NEXT_PUBLIC_*_API_BASE_URL` at `:3001` |

---

## 0. Paths (Windows)

```text
MONOREPO_ROOT=C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo
APP_ROOT=%MONOREPO_ROOT%\boilerplate code\r-revenue-intelligence
UI_ROOT=C:\Users\Relanto\Downloads\final_product\Revenue-Intelligence-UI\Revenue-Intelligence-UI
```

---

## 1. Checkout branch

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo"
git fetch origin
git checkout Integration-105
git pull origin Integration-105
```

---

## 2. First time only

### 2.1 Docker (Postgres + Redis)

Start **Docker Desktop**, then from **monorepo root**:

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo"
docker compose up -d
docker ps
```

Expect containers: `revenue_intel_db`, `revenue_intel_redis`.

### 2.2 Install dependencies

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
pnpm install
```

### 2.3 Environment

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
copy "..\..\.env.example" .env
# Ensure DATABASE_URL uses port 5433 (not 5432)
```

Minimum `.env` values:

```env
DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
DIRECT_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
REDIS_URL=redis://localhost:6379
UNIFIED_API_PORT=3001
CORS_ORIGINS=http://localhost:3000
DISABLE_MEILI=true
DISABLE_AI=true
```

### 2.4 Prisma generate + migrate

Stop any running dev APIs first (avoids Windows `EPERM` on Prisma DLL):

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
.\scripts\free_ports_all.ps1
pnpm run db:generate
pnpm run db:migrate
```

### 2.5 M01 demo seed (calls + transcripts)

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm run seed:m01
```

M09 training seed runs automatically when unified API starts (`M09_AUTO_SEED` defaults to on).

### 2.6 Live Call Assist tables (Smart Call / Postgres persistence)

With API **stopped**, apply SQL once if `db:migrate` did not already include `20260601_live_call_assist`:

```powershell
Get-Content "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\packages\database\prisma\migrations\20260601_live_call_assist\migration.sql" | docker exec -i revenue_intel_db psql -U revenue_user -d revenue_intelligence
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
pnpm run db:generate
```

---

## 3. Daily start — unified API (Integration-105)

**Terminal 1 — backend**

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo"
docker start revenue_intel_db revenue_intel_redis
# Or first time: docker compose up -d

cd "boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
$env:UNIFIED_API_PORT="3001"
pnpm run dev:unified-api
```

**Terminal 2 — unified UI** (outside monorepo; required for full demo)

```powershell
cd "C:\Users\Relanto\Downloads\final_product\Revenue-Intelligence-UI\Revenue-Intelligence-UI"
pnpm install
pnpm dev
```

UI `.env.local` should match:

```env
NEXT_PUBLIC_M01_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_M02_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_M09_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_M08_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_BACKEND_ORG_ID=00000000-0000-0000-0000-000000000001
NEXT_PUBLIC_BACKEND_USER_ID=00000000-0000-0000-0000-000000000003
```

For **manager** Engage/tasks screens, use user id `00000000-0000-0000-0000-000000000002` or set role cookie `sales_manager` in the browser.

Smart Call (optional server keys in UI `.env.local`, not `NEXT_PUBLIC_`):

```env
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=optional
ASSEMBLYAI_API_KEY=optional_for_call_review_audio
```

---

## 4. Health checks

```powershell
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod "http://localhost:3001/api/calls?view=ai-reviewer&page=1&size=5" -Headers @{
  "x-tenant-id" = "00000000-0000-0000-0000-000000000001"
  "x-org-id"    = "00000000-0000-0000-0000-000000000001"
  "x-user-id"   = "00000000-0000-0000-0000-000000000003"
}
Invoke-RestMethod "http://localhost:3001/api/engage/dashboard" -Headers @{
  "x-tenant-id" = "00000000-0000-0000-0000-000000000001"
  "x-user-id"   = "00000000-0000-0000-0000-000000000003"
}
```

---

## 5. Unified UI routes (against :3001)

| Area | Route |
|------|-------|
| Engage (rep) | http://localhost:3000/engage |
| Engage (manager) | http://localhost:3000/engage (manager role) |
| AI Call Reviewer (rep) | http://localhost:3000/calls/ai-reviewer |
| AI Call Reviewer (manager) | http://localhost:3000/calls/reviews/list |
| Calls list / search | http://localhost:3000/calls/list , `/calls/search` |
| Smart Call | http://localhost:3000/smart-call |
| AI Trainer (rep) | http://localhost:3000/training |
| AI Trainer (manager) | http://localhost:3000/training/manage |

---

## 6. Stop

**Unified API:** `Ctrl+C` in the API terminal.

**Free module ports** (if legacy APIs were used):

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
.\scripts\free_ports_all.ps1
```

**Docker** (optional — keeps data):

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo"
docker stop revenue_intel_db revenue_intel_redis
```

**Full stack from `final_product` parent** (optional scripts):

```powershell
cd "C:\Users\Relanto\Downloads\final_product"
.\stop-all-demo.ps1
```

---

## 7. Legacy: separate M01 / M02 / M09 APIs (not required for Integration-105)

Use only when debugging a single module. Do **not** run `dev:m01-api` and `dev:unified-api` together — both default to port **3001**.

```powershell
cd "C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"

pnpm run dev:m01-api   # :3001
pnpm run dev:m02-api   # :3002
pnpm run dev:m09-api   # :4009
```

See [boilerplate code/r-revenue-intelligence/RUNBOOK.md](./boilerplate%20code/r-revenue-intelligence/RUNBOOK.md) for per-module Vite ports (5174–5180).

---

## 8. Integration-105 backend surface (unified-api)

| Module | Bridge prefix | Examples |
|--------|---------------|----------|
| M01 | `/api/calls`, `/api/coaching` | `GET /api/calls?view=ai-reviewer`, `GET /api/calls/:id/audio-url` |
| M02 | `/api/call-reviews`, `/api/search`, `/api/analytics` | `GET /api/call-reviews`, `GET /api/manager/calls` |
| M09 | `/api/trainings`, … | M09 coaching/training UI |
| M08 | `/api/engage/*`, `/api/tasks/*` | Engage rep + manager workspaces |

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` on 3001 | `.\scripts\free_ports_all.ps1` — stop `m01-api` if running |
| Prisma `EPERM` on generate | Stop all `pnpm run dev:*` → `free_ports_all.ps1` → `pnpm run db:generate` |
| UI “Failed to load calls” | Confirm `http://localhost:3001/health` and Docker DB; dev mode falls back to mocks if API is down |
| Audio “S3 / recording” error | API may point at missing `uploads/audio` files; unified API + UI fall back to demo S3 via `/api/calls/audio` on the UI |
| Engage 404 | Restart **unified-api** after pulling Integration-105 (M08 bridge registered in `apps/unified-api/src/app.module.ts`) |
| CORS from UI | Set `CORS_ORIGINS=http://localhost:3000` in app `.env` |

---

## 10. Related docs

| Doc | Location |
|-----|----------|
| Monorepo README | [README.md](./README.md) |
| Module ports (standalone) | [boilerplate code/r-revenue-intelligence/RUNBOOK.md](./boilerplate%20code/r-revenue-intelligence/RUNBOOK.md) |
| Full product demo (UI + scripts) | `../FINAL-EXECUTION.md` (parent `final_product` folder) |
| Frontend bridge contracts | [doc/execution/integration/](./doc/execution/integration/) |
