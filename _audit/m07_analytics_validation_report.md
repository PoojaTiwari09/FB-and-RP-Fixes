# M07 Analytics Validation Report

**Date:** 2026-05-27

## Widget query pipeline

```
Client → Nest M07 API / Next routes
  → M07DealAccountService.executeWidgetQuery()
    → (1) DashboardSnapshot cache hit → return cached metric
    → (2) Prisma deal/account findMany + in-memory GROUP BY
    → (3) Quarter target enrichment (mockTargetResolver)
```

## Validated behaviors

| Area | Status | Notes |
|------|--------|-------|
| Snapshot-first reads | OK | Avoids re-aggregation when snapshot exists |
| PostgreSQL aggregation | OK | No fake ClickHouse failure path |
| Tenant filter | OK | `where: { tenantId }` on deal/account queries |
| Dataset routing | OK | `REVENUE_DEALS` vs accounts branch |
| Aggregations | OK | COUNT, SUM, AVG, MIN, MAX in memory |
| Time axis | OK | Quarter backfill Q1–Q4 |

## API surfaces

| Endpoint family | Engine |
|-----------------|--------|
| `GET/POST .../revenue-dashboards/kpis` | Prisma + role-scoped filters |
| Workspace query | Prisma |
| Next `/api/dashboards` | `dashboardConfig` + `deal` + `coachingsnapshots` |

## Issues fixed

- Misleading ClickHouse fallback removed
- `queryLogs` / `sourceEngine` labels aligned with actual engine

## Remaining optimizations (non-blocking)

- Replace in-memory aggregation with SQL `groupBy` for large tenants
- Index review on `Deal(tenantId, quarter, closeDate)`
- Batch widget queries to avoid N parallel `findMany`

## Status

**PASS** for correctness; scale hardening deferred until volume requires SQL/OLAP.
