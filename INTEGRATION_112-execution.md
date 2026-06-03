# INTEGRATION 112 — Clone → Run (Windows)

Monorepo folder: **`r-revenue-intelligence-monorepo`**

| Service | URL |
|---------|-----|
| UI | http://localhost:3000 |
| API | http://localhost:3001 |
| Postgres | `127.0.0.1:5433` |
| Redis | `127.0.0.1:6379` |

---

## Prerequisites

Install and verify:

```powershell
node -v          # 20+ recommended
pnpm -v          # backend
npm -v           # unified-ui
docker -v        # Docker Desktop running
```

---

## 1) Clone

```powershell
git clone <your-repo-url>
cd r-revenue-intelligence-monorepo
```

---

## 2) Environment files (required — not in git)

`.env` and `.env.local` are **gitignored**. Create them after clone.

### Root `.env` (single source of truth)

```powershell
copy .env.example .env
```

Edit **`r-revenue-intelligence-monorepo\.env`**. Minimum required:

```env
DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
DIRECT_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
M10_DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public

REDIS_URL=redis://localhost:6379
DISABLE_REDIS=false
DISABLE_MEILI=true
DISABLE_AI=true

AI_SERVICES_URL=http://localhost:8000
JWT_SECRET=local-dev-secret-change-me

# Optional — AI features (Engage rephrase, smart-call, etc.)
GROQ_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
ASSEMBLYAI_API_KEY=
OPENROUTER_API_KEY=
```

Sync to backend + UI:

```powershell
.\scripts\sync-env.ps1
```

This creates/updates:

| File | Purpose |
|------|---------|
| `boilerplate code\r-revenue-intelligence\.env` | Nest unified-api |
| `unified-ui\.env.local` | Next.js (API URL, demo tenant IDs, keys) |

**Do not commit** `.env` or `.env.local`.

---

## 3) First-time setup (once per machine)

From monorepo root:

```powershell
.\setup-first-time.ps1
```

What it does:

1. `docker compose up -d` → Postgres (`revenue_intel_db`) + Redis on **5433** / **6379**
2. `pnpm install` + **`pnpm run db:generate`** (Prisma client) in backend
3. `npm install` in `unified-ui`
4. **`db:push`** + seeds (M01 calls, M08 engage, M02 trackers, **M06 forecasting**)

---

## 4) Run the demo (every day)

```powershell
cd r-revenue-intelligence-monorepo
.\start-demo.ps1
```

Opens two terminals: **API :3001** and **UI :3000**.

Open: http://localhost:3000/engage

Verify API:

```powershell
.\verify-demo-apis.ps1
```

Stop:

```powershell
.\stop-demo.ps1
```

Stop Docker (optional):

```powershell
docker stop revenue_intel_db revenue_intel_redis
```

Wipe DB volume (fresh start):

```powershell
docker compose down -v
```

---

## 5) Manual commands (when needed)

All paths from monorepo root unless noted.

### Docker

```powershell
docker compose up -d              # start Postgres + Redis
docker compose ps               # check status
docker compose down             # stop containers (keep data)
docker compose down -v          # stop + delete data
```

### Prisma (backend folder)

```powershell
cd "boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"

pnpm run db:generate            # regenerate Prisma client (stop API first if EPERM)
pnpm --filter database run db:push   # sync schema to Postgres
pnpm run db:migrate             # if db:push fails
```

### Seeds

```powershell
# Full demo seed (recommended)
.\scripts\seed-demo-data.ps1

# M06 only — AI Revenue Predictor + Forecast Boards
.\seed-m06.ps1
```

Or from backend:

```powershell
cd "boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm run seed:m06
pnpm run seed:m01
pnpm run seed:m08
pnpm run seed:m02-trackers
```

### Run API / UI manually

```powershell
# API
cd "boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
$env:UNIFIED_API_PORT="3001"
pnpm run dev:unified-api

# UI (separate terminal)
cd unified-ui
npm run dev
```

---

## 6) Demo logins & roles

| User | Email | Password |
|------|-------|----------|
| Manager | manager@example.com | password123 |
| Rep | rep@example.com | password123 |

Switch role in browser console:

```js
// Manager — AI Revenue Predictor, call reviews, analytics
document.cookie = "user_role=sales_manager; path=/"; location.reload();

// Rep — Forecast Boards, training, AI call reviewer
document.cookie = "user_role=sales_rep; path=/"; location.reload();
```

| Feature | Route | Role |
|---------|-------|------|
| Engage | `/engage` | both |
| Forecast Boards | `/forecast-boards` | rep |
| AI Revenue Predictor | `/ai-revenue-predictor` | manager |
| Call reviews | `/calls/reviews` | manager |

Demo tenant ID (seeded in DB): `00000000-0000-0000-0000-000000000001`

---

## 7) Troubleshooting

| Problem | Fix |
|---------|-----|
| **AI Revenue Predictor / Forecast Boards empty** | `.\seed-m06.ps1` then hard-refresh browser |
| **Prisma EPERM on db:generate** | `.\stop-demo.ps1` then retry `pnpm run db:generate` |
| **Port 3000/3001 in use** | `.\stop-demo.ps1` or `.\free-ui-ports.ps1` |
| **Postgres connection refused** | `docker compose up -d` and wait ~10s |
| **Missing .env** | `copy .env.example .env` then `.\scripts\sync-env.ps1` |
| **Forecast API 404** | Ensure unified-api running; run `.\seed-m06.ps1` |
| **HMR / stale chunk errors** | Hard reload (Ctrl+Shift+R) or restart UI dev server |
| **Prisma client module not found** | Run `pnpm run db:generate` in `boilerplate code\r-revenue-intelligence` |
| **Next.js Turbopack build parsing/token errors** | Check for duplicate/unclosed `div` tags in TSX pages (like `results/page.tsx` or `manage/page.tsx`). |

Test forecast API (no auth headers needed — UI proxy injects tenant):

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/forecasting/periods
Invoke-RestMethod "http://localhost:3000/api/v1/forecasting/team/board?periodId=current"
```

---

## Quick reference (clone → running)

```powershell
git clone <repo>
cd r-revenue-intelligence-monorepo
copy .env.example .env          # edit keys if needed
.\scripts\sync-env.ps1
.\setup-first-time.ps1          # once
.\start-demo.ps1                # every session
```

Open http://localhost:3000/engage
