# M07 Fix Log

**Date:** 2026-05-27

## Schema

| Fix | Files |
|-----|-------|
| Merged duplicate `dashboardconfigs` + `DashboardConfig` into single `DashboardConfig` → `dashboardconfigs` table | `packages/database/prisma/schema.prisma` |

## Backend

| Fix | Files |
|-----|-------|
| Removed fake ClickHouse timeout fallback | `modules/m07-revenue-dashboards/services/m07.service.ts` |
| Renamed `clickhouseLogs` → `queryLogs`; updated `sourceEngine` labels | `m07.service.ts` |
| Added PostgreSQL-first analytics engine doc | `analytics/analytics-query.engine.ts` |

## Frontend (Next API)

| Fix | Files |
|-----|-------|
| `prisma.dashboardconfigs` → `prisma.dashboardConfig` | `api/dashboards/route.ts`, `share/route.ts`, `metrics/route.ts` |
| CamelCase Prisma fields (`tenantId`, `userId`, `visibleWidgets`, `dateRangeDefault`) | Same |
| Preserved lowercase fields for `coachingsnapshots` | `route.ts` |

## Testing

| Fix | Files |
|-----|-------|
| Added M07 smoke harness | `test_case/testm7.py` |

## Audit artifacts

Nine reports under `_audit/m07_*.md`.

## Not changed (intentional)

- Platform-wide ClickHouse docs (Phase 2 architecture)
- `coachingsnapshots` model naming (separate reconciliation track)
- Root `schema.prisma` legacy `DashboardConfigs`
