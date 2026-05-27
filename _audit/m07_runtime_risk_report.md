# M07 Runtime Risk Report

**Date:** 2026-05-27

## Resolved (this pass)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Duplicate Prisma dashboard models | HIGH | Single `DashboardConfig` canonical model |
| Fake ClickHouse path masking DB errors | MEDIUM | PostgreSQL-first execution |
| Stale `prisma.dashboardconfigs` after generate | HIGH | All routes updated to `dashboardConfig` |

## Open — medium

| Risk | Impact | Mitigation |
|------|--------|------------|
| In-memory aggregation on full deal lists | Latency at scale | SQL `groupBy`, pagination, CH when justified |
| Web Prisma import via nested `node_modules` | Broken CI paths | Export client from `@rri/database` |
| `coachingsnapshots` lowercase model drift | Type inconsistency | Future rename with `@map` pattern |
| Share GET scans all configs | Token leak surface in multi-tenant | Scope `findMany` by tenant when auth lands |

## Open — low

| Risk | Impact |
|------|--------|
| `prisma generate` EPERM on Windows | Dev friction — stop API before generate |
| Empty `dashboard_configs` table in some DBs | Confusion only if migrations mixed |
| JWT required for KPI but not sample-builder | Document dev vs prod guard policy |

## Tenant isolation

- Deal queries: `tenantId` filter enforced
- Dashboard config: compound unique per tenant+user
- Share route: **should** filter configs by tenant before token scan (follow-up)

## Status

Production blockers from duplicate schema and fake OLAP path are **cleared**. Scale and auth hardening tracked as follow-ups.
