# M06 — Forecasting & Prediction Module

> **R-Revenue Intelligence Monorepo** · Team 7 · API prefix: `/api/v1/forecasting`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Environment Variables](#environment-variables)
8. [Execution Commands](#execution-commands)
9. [Running Tests](#running-tests)
10. [HubSpot Integration](#hubspot-integration)
11. [Personas & Role Flow](#personas--role-flow)
12. [Troubleshooting](#troubleshooting)

---

## Overview

M06 is the **AI Revenue Predictor & Forecasting Dashboard** module. It provides:

- Real-time AI revenue predictions sourced directly from live CRM deals
- Role-based dashboards for **Sales Reps**, **Managers**, and **CROs (Executives)**
- Immutable, append-only versioned forecast submissions with full audit trails
- Historical baseline switching (`avg_last_2`, `last_period`, `same_period_last_year`)
- Regional breakdown (Americas / EMEA / APAC) and LOB filtering
- HubSpot CRM OAuth integration for one-click deal sync
- Period locking with event emission via BullMQ
- Manager override with impact calculations
- Python FastAPI microservice for AI prediction scoring

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Web (apps/web)  :3000                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  /app/forecasting  →  modules/m06/page.tsx       │       │
│  │  /app/login        →  Login page                 │       │
│  │  /app/signup       →  Signup page                │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP  (X-Tenant-ID header)
┌────────────────────────▼────────────────────────────────────┐
│  NestJS API (apps/api)  :3001                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │  M06ForecastingPredictionController              │       │
│  │  M06ExecutiveController                          │       │
│  │  HubSpotController                               │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │  M06ForecastingPredictionService  (business logic)│      │
│  │  HubSpotService  (OAuth + deal sync)             │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │  PrismaService  →  PostgreSQL  :5432             │       │
│  │  BullMQ Worker  →  Redis       :6379             │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────────┐
│  Python FastAPI (modules/m06/python-service)  :8000         │
│  POST /predict  →  AI scoring for pipeline deals            │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
modules/m06-forecasting-prediction/
├── controllers/
│   ├── m06.controller.ts           # Main forecasting endpoints (rep + manager)
│   ├── executive.controller.ts     # CRO-only executive dashboard endpoints
│   ├── hubspot.controller.ts       # HubSpot OAuth + deal sync endpoints
│   └── __tests__/
│       └── m06.integration-spec.ts
│
├── services/
│   ├── m06.service.ts              # Core business logic (1300+ lines)
│   ├── hubspot.service.ts          # HubSpot API client + deduplication
│   └── __tests__/
│       ├── feature1-baseline.spec.ts
│       ├── feature2-region.spec.ts
│       ├── feature3-quota.spec.ts
│       ├── feature4-immutable.spec.ts
│       ├── feature5-6-lock-events.spec.ts
│       ├── feature10-14-executive-override.spec.ts
│       ├── feature12-at-risk-deals.spec.ts
│       ├── feature24-executive-trends.spec.ts
│       └── seed-verification.integration-spec.ts
│
├── repositories/
│   └── m06.repository.ts
│
├── database/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── guards/
│   ├── roles.guard.ts
│   └── roles.decorator.ts
│
├── schemas/
│   └── m06.schema.ts               # Zod DTOs for all request bodies
│
├── events/
│   └── forecast-submitted.event.ts
│
├── workers/
│   └── m06.worker.ts               # BullMQ worker for async jobs
│
├── prisma/
│   ├── schema.prisma               # 7 database models
│   └── migrations/
│       ├── 20260519072044_m6_migration/
│       ├── 20260519082010_add_crm_deals/
│       └── 20260519143500_add_users_and_manager_fields/
│
├── seeds/
│   └── historical-seed.ts          # Full demo data seed
│
├── scripts/
│   ├── check-deals.ts
│   ├── check-periods.ts
│   ├── check-subs.ts
│   ├── reset-deals.ts
│   ├── test-create-deal.ts
│   └── test-draft.ts
│
├── python-service/
│   ├── main.py                     # FastAPI prediction service
│   ├── requirements.txt
│   └── Dockerfile
│
├── m06-forecasting-prediction.module.ts
├── package.json
├── tsconfig.json
├── jest.config.json
├── jest-integration.json
├── .env                            # Module-level env vars
├── SDD.md
├── CHANGELOG.md
├── EXECUTION_STEPS.md
└── README.md                       ← you are here
```

---

## Database Schema

**7 models, all tenant-scoped:**

| Table | Purpose |
|---|---|
| `forecast_periods` | Quarter/period definitions with lock status |
| `ai_forecast_snapshots` | Idempotent AI prediction snapshots per period |
| `forecast_submissions` | Immutable append-only rep submissions (versioned) |
| `forecast_audit_log` | Full action history for every submission |
| `crm_deals` | Live CRM pipeline deals (source of truth for predictions) |
| `historical_conversion_rates` | Stage-based win rates per historical period |
| `pipeline_coverage_metrics` | Aggregated pipeline metrics per period |
| `users` | Sales reps, managers, CROs with role and region |
| `quotas` | Per-rep, per-period quota targets |

### Submission Status Flow

```
draft → submitted → approved
          ↓              ↓
       reopened ←── (manager action)
          ↓
      resubmitted → approved
```

---

## API Endpoints

All endpoints require header: `X-Tenant-ID: <tenant-uuid>`

### Sales Rep Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/forecasting/periods/:id/board` | Full dashboard for a rep |
| `GET` | `/api/v1/forecasting/periods/:id/ai-prediction` | AI prediction (supports `?baseline=`, `?region=`, `?repUserId=`) |
| `GET` | `/api/v1/forecasting/periods/:id/math` | See-the-math breakdown |
| `POST` | `/api/v1/forecasting/submissions` | Create/save a draft submission |
| `POST` | `/api/v1/forecasting/submissions/:id/submit` | Submit a forecast |
| `GET` | `/api/v1/forecasting/submissions/:id` | Get a submission |
| `GET` | `/api/v1/forecasting/submissions/:id/audit-log` | Full audit trail + versions |
| `GET` | `/api/v1/forecasting/submissions/:id/lifecycle` | Lifecycle tracker steps |
| `POST` | `/api/v1/forecasting/deals` | Create a CRM deal |

### Manager Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/forecasting/team/board` | Team rollup dashboard (supports `?baseline=`, `?region=`, `?periodId=`) |
| `GET` | `/api/v1/forecasting/team/reps/:repId` | Drill-down into a single rep |
| `GET` | `/api/v1/forecasting/team/at-risk-deals` | At-risk deals across the team |
| `POST` | `/api/v1/forecasting/submissions/:id/approve` | Approve a submission |
| `POST` | `/api/v1/forecasting/submissions/:id/reopen` | Reopen a submission |
| `POST` | `/api/v1/forecasting/submissions/:id/override` | Manager override with impact calc |
| `POST` | `/api/v1/forecasting/quotas` | Set/upsert rep quota |
| `GET` | `/api/v1/forecasting/quotas` | Get quotas for a period |
| `POST` | `/api/v1/forecasting/periods/:id/lock` | Lock a forecast period |

### Executive (CRO) Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/forecasting/executive/board` | CRO dashboard (all regions + AI prediction) |
| `GET` | `/api/v1/forecasting/executive/trends` | Historical performance trend data |

### Auth Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/forecasting/auth/register` | Register a new user |
| `POST` | `/api/v1/forecasting/auth/login` | Login (returns user object) |

### HubSpot Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/hubspot/auth-url` | Get OAuth authorization URL |
| `GET` | `/api/v1/hubspot/callback` | OAuth callback handler |
| `POST` | `/api/v1/hubspot/sync-deals` | Sync deals from HubSpot into CRM |

### Baseline Query Values

```
?baseline=avg_last_2           # Average of last 2 historical periods
?baseline=last_period          # Previous quarter only
?baseline=same_period_last_year # Same quarter, prior fiscal year
?baseline=current              # No baseline (live data only)
```

---

## Frontend Components

Located in `apps/web/src/modules/m06-forecasting-prediction/`:

| Component | Role | Description |
|---|---|---|
| `page.tsx` | Sales Rep | Main orchestrator page; loads board data, dispatches all API calls |
| `ForecastDashboard.tsx` | Sales Rep | AI projection card, pipeline chart, baseline switcher |
| `ForecastEntry.tsx` | Sales Rep | Commit/best-case input form with lock state handling |
| `AddDealModal.tsx` | Sales Rep | Modal to manually add a CRM deal |
| `HubSpotConnect.tsx` | Sales Rep | HubSpot OAuth connect + one-click deal sync |
| `AuditLog.tsx` | Sales Rep | Activity log sidebar |
| `SubmissionHistory.tsx` | Sales Rep | Immutable version history table |
| `MathDrawer.tsx` | Sales Rep | Slide-in "See the Math" breakdown drawer |
| `PeriodToggle.tsx` | All | Quarter period selector |
| `ManagerDashboard.tsx` | Manager | Team rollup with per-rep drill-down, override controls |
| `CroDashboard.tsx` | CRO | Executive view with region breakdown, bar/line charts |

The web app route is at: `http://localhost:3000/forecasting`

---

## Environment Variables

### Root `.env` (monorepo root)
```env
DATABASE_URL="postgresql://postgres:Marri@1234@localhost:5432/m6?schema=public"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="sk-dummy-openai-key-for-local-dev"
```

### Module `.env` (`modules/m06-forecasting-prediction/.env`)
```env
DATABASE_URL="postgresql://postgres:Marri@1234@localhost:5432/m6?schema=public"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="sk-dummy-openai-key-for-local-dev"
HUBSPOT_CLIENT_ID="your-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-hubspot-client-secret"
HUBSPOT_REDIRECT_URI="http://localhost:3001/api/v1/hubspot/callback"
```

---

## Execution Commands

> Run all commands from the **monorepo root** directory (`r-revenue-intelligence-monorepo`):

---

### Step 1 — Start Infrastructure (Docker)

```bash
# Start PostgreSQL + Redis in background
docker-compose up -d postgres redis
```

Wait ~10 seconds for containers to be ready.

```bash
# Verify containers are running
docker ps
```

---

### Step 2 — Install Dependencies

```bash
pnpm install
```

---

### Step 3 — Run Database Migration

```bash
pnpm --filter @r-revenue/m06-forecasting-prediction db:migrate
```

> Creates all 9 tables in your Postgres `m6` database.

---

### Step 4 — Generate Prisma Client

```bash
pnpm --filter @r-revenue/m06-forecasting-prediction db:generate
```

---

### Step 5 — Seed Demo Data

```bash
cd "modules/m06-forecasting-prediction"
npx ts-node --transpileOnly seeds/historical-seed.ts
cd ../..
```

> Populates: forecast periods, AI snapshots, historical conversion rates, CRM deals (real pipeline data for all reps and regions), users, and quotas.

---

### Step 6 — Start the API Server

```bash
pnpm --filter api dev
```

API runs at → **http://localhost:3001**

---

### Step 7 — Start the Web App (new terminal)

```bash
pnpm --filter web dev
```

Web app runs at → **http://localhost:3000**

---

### All-in-one (both servers in parallel)

```bash
pnpm dev
```

---

### Quick API Verification (cURL)

```bash
# 1. Health check — get the current period board
curl http://localhost:3001/api/v1/forecasting/periods/current/board \
  -H "X-Tenant-ID: demo-tenant-01"

# 2. AI prediction with baseline
curl "http://localhost:3001/api/v1/forecasting/periods/current/ai-prediction?baseline=avg_last_2&region=Americas" \
  -H "X-Tenant-ID: demo-tenant-01"

# 3. Team board (manager view)
curl "http://localhost:3001/api/v1/forecasting/team/board?periodId=current" \
  -H "X-Tenant-ID: demo-tenant-01"

# 4. Executive board (CRO view)
curl "http://localhost:3001/api/v1/forecasting/executive/board" \
  -H "X-Tenant-ID: demo-tenant-01"

# 5. Register a user
curl -X POST http://localhost:3001/api/v1/forecasting/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Sales","email":"john@demo.com","password":"test123","role":"sales_rep","tenantId":"demo-tenant-01","repId":"rep-01","region":"Americas"}'

# 6. Login
curl -X POST http://localhost:3001/api/v1/forecasting/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@demo.com","password":"test123"}'

# 7. Submit a forecast draft
curl -X POST http://localhost:3001/api/v1/forecasting/submissions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo-tenant-01" \
  -d '{"lob":"Enterprise Software","commitForecast":5000000,"bestCaseForecast":6500000,"notes":"Strong Q2","repUserId":"rep-01","status":"draft"}'
```

---

### Debug Scripts

```bash
cd "modules/m06-forecasting-prediction"

# Check what deals are in the DB
npx ts-node --transpileOnly scripts/check-deals.ts

# Check active forecast periods
npx ts-node --transpileOnly scripts/check-periods.ts

# Check submissions
npx ts-node --transpileOnly scripts/check-subs.ts

# Reset deals to clean state
npx ts-node --transpileOnly scripts/reset-deals.ts
```

---

## Running Tests

```bash
cd "modules/m06-forecasting-prediction"

# All unit tests
pnpm test

# Specific feature test
npx jest services/__tests__/feature1-baseline.spec.ts

# Integration tests (requires live DB)
pnpm test:integration

# Test with coverage report
npx jest --coverage
```

### Test Coverage Map

| Spec File | Features Tested |
|---|---|
| `feature1-baseline.spec.ts` | AI prediction, baseline switching, snapshot math |
| `feature2-region.spec.ts` | Regional filtering (Americas / EMEA / APAC) |
| `feature3-quota.spec.ts` | Quota upsert, attainment calculation |
| `feature4-immutable.spec.ts` | Append-only versioning, no UPDATE/DELETE |
| `feature5-6-lock-events.spec.ts` | Period locking, event emission via BullMQ |
| `feature10-14-executive-override.spec.ts` | Manager override with impact calculation |
| `feature12-at-risk-deals.spec.ts` | At-risk deal detection |
| `feature24-executive-trends.spec.ts` | Historical trend data for CRO |
| `seed-verification.integration-spec.ts` | Seed data integrity checks |
| `m06.integration-spec.ts` | Full HTTP integration test |

---

## HubSpot Integration

1. Set `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, and `HUBSPOT_REDIRECT_URI` in your `.env`
2. Call `GET /api/v1/hubspot/auth-url` with header `X-Tenant-ID` to get the OAuth URL
3. User completes OAuth in browser → redirected to callback
4. Call `POST /api/v1/hubspot/sync-deals` to pull open deals from HubSpot into `crm_deals`
5. Deals are deduplicated via `hubspotId` field — re-syncing is safe

---

## Personas & Role Flow

### Sales Rep
1. Navigate to `http://localhost:3000/forecasting`
2. View AI projection for current quarter
3. Switch baseline (`Avg of last 2`, `Last period`, etc.)
4. Add deals via manual form or HubSpot sync
5. Enter commit + best-case forecast → Save Draft → Submit

### Manager
1. View team board with all rep submissions rolled up
2. Drill into individual rep pipeline
3. Approve / Reopen / Override submissions
4. Set rep quotas

### CRO (Executive)
1. View company-wide executive dashboard
2. See regional breakdown (Americas / EMEA / APAC)
3. View historical trend charts
4. See at-risk deals across all regions

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Can't resolve 'recharts'` | Missing dependency | `pnpm install` from monorepo root after adding recharts to `apps/web/package.json` |
| `Prisma migration failed` | DB not running or wrong URL | `docker-compose up -d postgres` then check `DATABASE_URL` in `.env` |
| `MODULE_NOT_FOUND turbo` | Turbo not installed | `pnpm install` from monorepo root |
| `EADDRINUSE :3001` | Port already in use | `npx kill-port 3001` |
| `Redis connection refused` | Redis not running | `docker-compose up -d redis` |
| `Prediction pending` | No AI snapshot seeded | Run `seeds/historical-seed.ts` first |
| `Period not found` | No open period in DB | Seed creates Q2 FY26 as the open period |
| Hardcoded credential warning | docker-compose uses inline password | Set `DB_USER`, `DB_PASSWORD` in root `.env` and use env-var references |

---

## Tech Stack (M06)

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 14 |
| API | NestJS | 10 |
| ORM | Prisma | 5.x |
| Database | PostgreSQL + pgvector | 16 |
| Queue | Redis + BullMQ | 5.x |
| Charts | Recharts | 2.x |
| Validation | Zod | 3.x |
| AI Service | FastAPI (Python) | 0.110+ |
| Testing | Jest + Supertest | latest |
| Package Manager | pnpm | 10.x |
| Monorepo | Turborepo | 2.x |

---

*Module Owner: Team 7 · API Prefix: `/api/v1/forecasting` · Version: 1.0.0*
