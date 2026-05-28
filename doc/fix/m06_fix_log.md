# M06 Fix Log

**Date:** 2026-05-27

| # | Issue | Fix |
|---|-------|-----|
| 1 | HIGH: Prisma fragmentation | Models → `packages/database`; `@rri/database` client |
| 2 | HIGH: duplicate AiForecast columns | Cleaned `doc/execution/database-tools/schema.prisma` §B2 duplicates |
| 3 | MEDIUM: blocking prediction | Queue + worker + job table; removed sync snapshot on createDeal |
| 4 | MEDIUM: HubSpot duplication | `HubSpotClientService` in platform-core; M06 sync uses it |
| 5 | LOW: executive direct compute | `ForecastExecutiveSnapshot` + event consumer |
| 6 | No queue producer | `M06PredictionQueueService` + listener + API enqueue |
| 7 | `prisma.user` vs platform User | Renamed to `ForecastUser` in central schema + service |
| 8 | API | `POST/GET ai-prediction/run|status` |
| 9 | Seeds | `forecastUser` in historical-seed.ts |

## Tests

- Jest: environment error (`clearMocksOnScope`) — pre-existing Jest 30/runtime mismatch; not regression from schema change
- Smoke: `doc/test_result/doc/test_result/doc/test_result/test_case/testm6.py` added

## Commands

```bash
pnpm --filter @rri/database db:generate
pnpm --filter @rri/database db:migrate
cd test_case && python testm6.py
```
