# M07 Scalability Report

**Date:** 2026-05-27

## Current architecture limits

| Layer | Bottleneck | Threshold estimate |
|-------|------------|-------------------|
| Widget query | `deal.findMany` + JS aggregation | Degrades ~10k+ deals/tenant |
| Dashboard GET | Full deal list + config parse | Same |
| Snapshot cache | Per-widget snapshot rows | Good for repeat loads |
| Refresh storm | Unguarded parallel widget POSTs | Rate-limit at gateway |

## Caching strategy (now)

1. **DashboardSnapshot** — pre-computed widget metrics (primary win)
2. **Layout JSON** — single row per user (`DashboardConfig`)
3. No Redis layer in M07 module today

## PostgreSQL scaling (recommended before ClickHouse)

- Add composite indexes: `(tenantId, quarter)`, `(tenantId, closeDate)`
- Move aggregations to Prisma `groupBy` / raw SQL
- Paginate deal feeds for table widgets
- Materialized views for executive KPIs (align with M06 snapshot pattern)

## ClickHouse

Deferred per `m07_clickhouse_architecture_decision.md`. Revisit when:

- p95 widget latency > SLO with optimized Postgres
- Event volume warrants columnar store + CDC

## Frontend

- Virtualize large tables in `dashboard-client`
- Debounce filter changes to reduce API churn

## Status

**Adequate for pilot/demo scale** on PostgreSQL. Documented path to SQL optimization then optional OLAP.
