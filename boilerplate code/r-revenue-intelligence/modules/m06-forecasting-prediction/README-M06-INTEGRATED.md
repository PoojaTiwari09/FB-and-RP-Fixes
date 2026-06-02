# M06 — Forecasting & Prediction (Integrated Monorepo Guide)

> **This document** covers **AI Revenue Predictor** and **Forecast Boards** in the **integrated** environment (M01–M10 on shared `apps/api` + `apps/web`).  
> The original module-only guide remains in [`README.md`](./README.md) (unchanged).

---

## 1. How M06 runs in the monorepo

| Layer | Location | Port (default) |
|--------|-----------|----------------|
| **Backend** | `modules/m06-forecasting-prediction/` imported by **`apps/api`** | **3001** |
| **Frontend** | `apps/web/src/modules/m06-forecasting-prediction/` via **`apps/web`** | **3005** |
| **Database** | `packages/database` (Prisma) | PostgreSQL **5433** (Docker) |
| **Queue** | BullMQ `m06-queue` (Redis **6379**) | Optional (`DISABLE_REDIS=true` to skip workers) |
| **Python AI** | `modules/m06-forecasting-prediction/python-service/` | **8000** (optional) |

M06 does **not** have a separate `m06-api` process in the integrated setup. It is a **NestJS module** mounted in the shared monolith (`AppModule` imports `M06ForecastingPredictionModule`).

---

## 2. API surfaces (two prefixes)

After Forecast Boards integration there are **two** HTTP prefixes on the **same** port (`3001`):

### 2.1 Forecast Boards (TDD — canonical)

**Prefix:** `/api/v1/m06-forecasting-prediction`  
**Controller:** `controllers/forecast-periods.controller.ts` (`ForecastPeriodsController`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/periods` | List forecast periods |
| `GET` | `/periods/:id/board` | Board grid (AI snapshot, coverage, submissions) |
| `POST` | `/periods/:id/submit` | Manual forecast submit (**201**), append-only versioning |

**Headers:** `X-Tenant-ID` (required), `X-User-ID` (required on submit), `Idempotency-Key` (optional)

### 2.2 AI Revenue Predictor (extended / legacy UI)

**Prefix:** `/api/v1/forecasting`  
**Controllers:** `m06.controller.ts`, `executive.controller.ts`

Includes AI prediction, rep/manager/CRO dashboards, submissions workflow, quotas, HubSpot sync helpers, auth, etc.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/periods/:id/ai-prediction` | AI projection + explainability |
| `POST` | `/periods/:id/ai-prediction/run` | Enqueue prediction job |
| `GET` | `/periods/:id/board` | Rich rep board (legacy shape) |
| `GET` | `/team/board` | Manager team rollup |
| `GET` | `/executive/board` | CRO dashboard |
| … | See Swagger | Full list under tag **M6 — AI Revenue Predictor** |

### 2.3 HubSpot (M06-owned)

**Prefix:** `/api/v1/hubspot` — `hubspot.controller.ts`

---

## 3. Swagger / OpenAPI

Swagger is enabled on the **integrated API** (`apps/api`), not on a standalone M06 process.

| Item | Value |
|------|--------|
| **Swagger UI** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) |
| **OpenAPI JSON** | [http://localhost:3001/api/docs-json](http://localhost:3001/api/docs-json) |

Filter by tags:

- **M6 — Forecast Boards (TDD)** — canonical three routes  
- **M6 — AI Revenue Predictor** — `/api/v1/forecasting/*`

In Swagger, add headers **X-Tenant-ID** (`demo-tenant-01`) and **X-User-ID** (`rep-01`) for submit tests.

---

## 4. Frontend routes (`apps/web`)

| URL | Role | Component |
|-----|------|-----------|
| `/login` | Auth | `apps/web/src/app/login/page.tsx` |
| `/signup` | Register | `apps/web/src/app/signup/page.tsx` |
| `/forecasting` | Rep / Manager / CRO | `apps/web/src/app/forecasting/page.tsx` → routes by `localStorage.m6_user.role` |

**Module UI files:** `apps/web/src/modules/m06-forecasting-prediction/`

| File | Purpose |
|------|---------|
| `page.tsx` | Sales rep — Forecast Board (TDD) + AI dashboard |
| `ManagerDashboard.tsx` | Manager team board |
| `CroDashboard.tsx` | Executive view |
| `components/ForecastBoard.tsx` | TDD collaborative board |
| `components/PipelineCoverageCard.tsx` | Coverage metrics card |
| `api.ts` | API client (uses Next rewrites in browser) |

---

## 5. Proxy / API base URL (integrated web)

The web app proxies M06 calls to the monolith via **`apps/web/next.config.mjs`** rewrites:

- `/api/v1/m06-forecasting-prediction/*` → `http://localhost:3001/...`
- `/api/v1/forecasting/*` → `http://localhost:3001/...`
- `/api/v1/hubspot/*` → `http://localhost:3001/...`

The M06 client (`api.ts`) uses **relative URLs in the browser** (empty origin) so requests hit Next.js and are rewritten — avoids CORS issues.

Override backend host:

```env
NEXT_PUBLIC_M06_API_URL=http://localhost:3001
```

---

## 6. Prerequisites

- **Node.js** 20+  
- **pnpm** 9+ (repo uses `packageManager: pnpm@10.14.0`)  
- **Docker** — PostgreSQL + Redis (`docker compose` at monorepo root)  
- **Optional:** Python 3.12 for `python-service` on port 8000  

---

## 7. Environment variables

Copy env from repo root and `modules/m06-forecasting-prediction/.env` template.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres (`127.0.0.1:5433`, schema `public`) |
| `DIRECT_URL` | Yes | Prisma migrations |
| `PORT` | No | API port (default **3001**) |
| `REDIS_URL` / `REDIS_HOST` | For workers | BullMQ |
| `DISABLE_REDIS` | No | `true` = skip queue workers |
| `DISABLE_AI` | No | Skip external AI HTTP calls |
| `HUBSPOT_CLIENT_ID` / `SECRET` | For CRM sync | HubSpot OAuth |
| `NEXT_PUBLIC_M06_API_URL` | Web | API host for SSR (default `http://localhost:3001`) |
| `JWT_SECRET` | Platform auth | Local dev placeholder |

---

## 8. Database setup & seed

From repo root (`boilerplate code/r-revenue-intelligence`):

```powershell
docker compose up -d
pnpm db:generate
pnpm db:migrate
```

Apply M06 TDD columns if needed (committed deals + idempotency):

```powershell
# Included in packages/database migration 20260530120000_m06_forecast_submission_tdd_fields
```

Seed demo data (tenant `demo-tenant-01`, reps, periods, deals, AI snapshots):

```powershell
cd modules/m06-forecasting-prediction
pnpm exec tsx seeds/historical-seed.ts
```

---

## 9. Startup (full monorepo — M06 included)

From `boilerplate code/r-revenue-intelligence`:

```powershell
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm exec tsx modules/m06-forecasting-prediction/seeds/historical-seed.ts
pnpm dev
```

`pnpm dev` runs **in parallel**:

- `apps/api` → [http://localhost:3001](http://localhost:3001)  
- `apps/web` → [http://localhost:3005](http://localhost:3005)  

**Do not** run `m01-api` on 3001 at the same time (port conflict). See `ARCHITECTURE.md`.

Open M06 UI: [http://localhost:3005/forecasting](http://localhost:3005/forecasting)  
Login examples: `rahul@demo.com` / `rep123`, `manager@demo.com` / `manager123`, `cro@demo.com` / `cro123`

---

## 10. Manual API testing (curl)

```powershell
# Forecast Boards — list periods
curl http://localhost:3001/api/v1/m06-forecasting-prediction/periods -H "X-Tenant-ID: demo-tenant-01"

# Board hydrate
curl "http://localhost:3001/api/v1/m06-forecasting-prediction/periods/current/board" -H "X-Tenant-ID: demo-tenant-01" -H "X-User-ID: rep-01"

# Submit (201)
curl -X POST "http://localhost:3001/api/v1/m06-forecasting-prediction/periods/{periodId}/submit" `
  -H "X-Tenant-ID: demo-tenant-01" -H "X-User-ID: rep-01" -H "Content-Type: application/json" `
  -d "{\"submittedAmount\":980000,\"committedDealIds\":[]}"

# AI prediction
curl "http://localhost:3001/api/v1/forecasting/periods/current/ai-prediction" -H "X-Tenant-ID: demo-tenant-01"
```

Or use **Swagger**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 11. Module folder structure (backend)

```
modules/m06-forecasting-prediction/
├── controllers/
│   ├── forecast-periods.controller.ts   # TDD Forecast Boards
│   ├── m06.controller.ts                # AI Revenue Predictor + rep/manager APIs
│   ├── executive.controller.ts
│   └── hubspot.controller.ts
├── services/
│   ├── forecast-boards.service.ts
│   └── m06.service.ts
├── repositories/
│   ├── forecast-boards.repository.ts
│   └── m06.repository.ts
├── schemas/
│   ├── forecast-boards.schema.ts
│   └── m06.schema.ts
├── interfaces/
│   └── forecast-boards.types.ts
├── events/
│   └── forecast-submitted.event.ts
├── listeners/
├── workers/
├── database/
├── seeds/
└── m06-forecasting-prediction.module.ts
```

---

## 12. Automated tests

### Backend (Jest)

```powershell
pnpm run test:m06
pnpm --filter @r-revenue/m06-forecasting-prediction run test:coverage
pnpm --filter @r-revenue/m06-forecasting-prediction run test:forecast-boards
```

Tests live under `services/__tests__/` and `controllers/__tests__/`.

### Frontend (Vitest)

```powershell
pnpm run test:m06:web
pnpm --filter @rri/web run test:coverage
```

Tests: `apps/web/src/modules/m06-forecasting-prediction/__tests__/`

### All M06 tests

```powershell
pnpm run test:m06:all
```

---

## 13. Frontend styling (Tailwind)

M06 UI is built with **Tailwind CSS** utility classes. Tailwind is configured at **`apps/web`** (not inside the module folder):

- `apps/web/tailwind.config.ts` — scans `src/app/**` and `src/modules/**`
- `apps/web/postcss.config.mjs`
- `apps/web/src/app/globals.css` — `@tailwind` directives

If the UI looked “broken” (unstyled layout, no spacing/colors), the usual cause was **Tailwind not installed on `apps/web`** while M06 components already used Tailwind classes.

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| API connection refused on 3001 | `apps/api` not running | `pnpm dev` or `pnpm --filter api dev` |
| Empty board / 404 period | DB not seeded | Run `historical-seed.ts` |
| Submit 403 | Period locked | Use open period or unlock in DB |
| UI unstyled | Tailwind missing | `pnpm install` in `apps/web`, restart `pnpm dev` |
| CORS errors | Bypassing Next rewrite | Use relative `/api/v1/...` URLs (see `api.ts`) |
| Swagger 404 | Old API build | Restart `apps/api` after pulling |
| Redis errors | Redis down | `docker compose up -d` or `DISABLE_REDIS=true` |
| Port 3001 in use | m01-api conflict | Stop other API on 3001 |

---

## 15. Related documents

| Document | Purpose |
|----------|---------|
| [`README.md`](./README.md) | Original AI-only module guide (preserved) |
| [`VALIDATION-CHECKLIST-M06.md`](./VALIDATION-CHECKLIST-M06.md) | Pre-release checklist |
| [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) | Monorepo module map & ports |
| TDD: `doc/reference/M6 Forecasting & Prediction/TDD/TDD-Forecast Boards.md` | Forecast Boards spec |

---

**Module workspace:** `modules/m06-forecasting-prediction/`  
**Integrated API:** `http://localhost:3001`  
**Integrated Web:** `http://localhost:3005/forecasting`  
**Swagger:** `http://localhost:3001/api/docs`
