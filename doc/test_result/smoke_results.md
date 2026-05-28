# Backend Smoke Test Results

**Date:** 2026-05-26  
**API:** `http://localhost:3001`  
**Database:** Postgres `127.0.0.1:5433/revenue_intelligence`  
**Redis:** disabled (`DISABLE_REDIS=true`)

## Seeds executed

| Module | Script | Status |
|--------|--------|--------|
| M01 | `modules/m01-capture-transcription/seeds/seed.ts` | OK (3 calls + transcript) |
| M06 | `modules/m06-forecasting-prediction/seeds/historical-seed.ts` | OK (periods, deals, users) |
| M09 | `scripts/seed-m09-dashboards.ts` | Optional (dashboards.trainerscenarios) |

## Boot fixes applied

1. Removed 165 stale compiled `.js`/`.d.ts` files under `modules/` that shadowed TypeScript controllers.
2. Fixed M03 controller import paths (`../services`, `../guards`, `../config`).
3. Registered missing M01 providers: `PiiRedactionService`, `NextStepsRepository`.
4. Fixed M09 `JwtAuthGuard` DI (`Reflector` in module providers).
5. Prefixed M03/M05/M09 sub-controller routes under `api/v1/...`.
6. M06: applied SQL migrations for forecast tables; local Prisma client at `modules/m06-forecasting-prediction/generated/prisma-client`.
7. Graceful empty/mock fallbacks when Prisma models are missing (M02 trackers, M08 workflows/tasks).

## Smoke matrix (latest run — **22/22 PASS**)

Run: `powershell -ExecutionPolicy Bypass -File doc/test_result/smoke-backend.ps1`

```
Summary: 22 of 22 passed
```

| Module | Endpoint | Expected |
|--------|----------|----------|
| M01 | GET/POST `/api/v1/capture-transcription/calls` | 200/201 |
| M02 | GET `/api/v1/conversation-intelligence/conversations` | 200 |
| M03 | GET `/api/v1/ai-summaries-genai` | 200 |
| M04 | — | Skipped (disabled in AppModule) |
| M05 | GET `/api/v1/account-intelligence` | 200 |
| M06 | GET `/api/v1/forecasting/periods/{id}/ai-prediction` | 200 |
| M07 | GET `/api/v1/revenue-dashboards` | 200 |
| M08 | GET `/api/v1/m08-sales-engagement/workflows` | 200 (empty list if tables missing) |
| M09 | GET `/api/v1/coaching-training` | 200 |
| M10 | GET `/api/v1/data-compliance` | 200 |

## Known gaps vs full TDD feature set

- **M04:** Not mounted (TypeORM legacy; needs Prisma migration).
- **M02:** `m02Tracker` model not in unified `@rri/database` schema — trackers use in-memory fallback.
- **M08:** `workflow` / `task` models not in unified schema — APIs return `[]` until tables are added.
- **M09:** Repository expects legacy `trainingScenario` / `org_id` fields; needs alignment with `dashboards.trainerscenarios`.
- **M05:** HubSpot/Supabase paths may 500 without external services; core module root responds.

## Commands to reproduce

```powershell
cd "r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\apps\api"
.\dev-api.bat

# Seeds
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm exec tsx ..\..\modules\m01-capture-transcription\seeds\seed.ts
pnpm exec tsx ..\..\modules\m06-forecasting-prediction\seeds\historical-seed.ts

# Smoke
powershell -ExecutionPolicy Bypass -File ..\..\..\..\doc\test_result\smoke-backend.ps1
```
