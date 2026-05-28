# M06 Prisma Consolidation Report

**Date:** 2026-05-27  
**Status:** Complete (central schema + runtime cutover)

## Before

- Module-local `prisma/schema.prisma` + `generated/prisma-client`
- 3 isolated migrations under `modules/m06-forecasting-prediction/prisma/migrations/`
- `PrismaService` imported `../generated/prisma-client`
- `@rri/database` declared but unused

## After

| Item | Location |
|------|----------|
| Canonical schema | `packages/database/prisma/schema.prisma` |
| Client import | `@rri/database` in `database/prisma.service.ts` |
| Local schema | Stub pointer only (`modules/m06-forecasting-prediction/prisma/schema.prisma`) |
| Migration | `packages/database/prisma/migrations/20260527160000_m06_forecast_tables/` |
| npm scripts | `db:generate` / `db:migrate` → `@rri/database` |

## Models migrated

- `ForecastPeriod`, `AiForecastSnapshot`, `ForecastSubmission`, `ForecastAuditLog`
- `PipelineCoverageMetrics`, `HistoricalConversionRate`, `CrmDeal`, `ForecastUser` (@@map users), `Quota`
- **New:** `ForecastExecutiveSnapshot`, `M06PredictionJob`

## Naming note

M06 CRM users use model **`ForecastUser`** (table `users`) to avoid collision with platform `User`.

## Validation

- `npx prisma validate` on `packages/database` — **PASS**

## Cleanup (recommended)

- Remove `modules/m06-forecasting-prediction/generated/prisma-client/` from builds
- Do not run module-local `prisma generate`
