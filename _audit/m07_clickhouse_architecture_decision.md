# M07 ClickHouse Architecture Decision

**Date:** 2026-05-27  
**Decision:** **Option B — Remove dead ClickHouse runtime assumptions**

## Context

TDD and platform docs describe:

- ClickHouse as primary OLAP for dashboard widgets
- PostgreSQL fallback when ClickHouse is unavailable

**Actual codebase (before fix):**

- No `@clickhouse/client` or equivalent
- `M07DealAccountService.executeWidgetQuery()` **always threw** a fake ClickHouse timeout, then aggregated via Prisma
- Misleading `clickhouseLogs` field in API responses

## Analysis

| Factor | Assessment |
|--------|------------|
| Current data volume | Deal/account aggregates via Prisma `findMany` + in-memory grouping |
| Caching | `DashboardSnapshot` pre-computed metrics path exists |
| Operational cost | ClickHouse adds compose, CDC, tenant isolation, on-call surface |
| M07 maturity | Layout persistence on Postgres; Nest API not yet at CH scale |
| Platform phase | ClickHouse documented as Phase 2 / planned |

## Decision rationale

PostgreSQL + Prisma + snapshot cache is **sufficient and honest** for current M07 workloads. Shipping a fake fallback path is worse than a clear PostgreSQL-first engine.

## Implementation

1. Removed fake ClickHouse throw/fallback in `m07.service.ts`
2. Renamed `clickhouseLogs` → `queryLogs`; `sourceEngine` → `"PostgreSQL (Prisma)"`
3. Added `modules/m07-revenue-dashboards/analytics/analytics-query.engine.ts` documenting future OLAP gate: `M07_WIDGET_OLAP_ENABLED` + `CLICKHOUSE_URL`

## Future path (when justified)

Enable Option A only when:

- Widget query p95 exceeds Postgres budget at tenant scale
- CDC/stream to ClickHouse is operational
- Tenant-scoped CH tables + integration tests exist

Until then, platform-wide ClickHouse references in **M02/M10 docs** remain architectural intent, not M07 runtime dependency.

## Status

**RESOLVED** — no stale ClickHouse behavior in M07 execution path.
