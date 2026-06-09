# Environment Variables Registry — M7 Revenue Dashboards

## 1. Document Control

- **Document Title:** Environment Variables Registry — M7 Revenue Dashboards
- **Module Name:** M7 Revenue Dashboards
- **Technical Workspace:** `modules/m07-revenue-dashboards/`
- **Owner:** Product Engineering — M7
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Core Module Enablement

These variables govern overall module activation and identity inside the platform service registry.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| **`M07_ENABLED`** | **Yes** | `true` | Master enablement flag for the M7 Revenue Dashboards module. When `false`, the API returns a standard `503 Service Unavailable` error and background workers are suspended. |
| `SERVICE_NAME` | Yes | `m07-revenue-dashboards` | Logical service name for logs and trace exporter correlation. |
| `PORT` | Yes | `3000` | HTTP port where the M7 dashboards API server listens. |

---

## 3. PostgreSQL Database Connections

M7 uses PostgreSQL for storing dashboard layout configurations and as a failover backup analytics store.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | | Standard PostgreSQL connection string used by Prisma. Resides under the schema namespace **`m07_revenue_dashboards`**. |
| `M07_PG_POOL_MAX` | No | `10` | Maximum connections allowed in the Postgres connection pool. |
| `M07_PG_STATEMENT_TIMEOUT_MS` | No | `10000` | Statement execution timeout for dashboard queries, especially heavy fallback aggregations. |

---

## 4. ClickHouse Analytical DB Connections

ClickHouse is the primary high-performance data store for all dashboard aggregations.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `CLICKHOUSE_HOST` | **Yes** | | ClickHouse server hostname (replicated analytics database). |
| `CLICKHOUSE_PORT` | **Yes** | `8123` | ClickHouse connection port (8123 for HTTP REST, 9000 for Native TCP). |
| `CLICKHOUSE_DATABASE` | **Yes** | `analytics` | Analytics database containing active activity, call, and deal event tracking tables. |
| `CLICKHOUSE_USER` | **Yes** | | ClickHouse database access username. |
| `CLICKHOUSE_PASSWORD` | **Yes** | | ClickHouse database access password. |
| `M07_CLICKHOUSE_ENABLED` | No | `true` | Master toggle to enable ClickHouse query dispatch. Set to `false` in local development to force PostgreSQL. |
| `M07_CLICKHOUSE_QUERY_TIMEOUT_MS` | No | `5000` | Absolute query timeout ceiling for ClickHouse aggregations. |
| `M07_CLICKHOUSE_HEALTHCHECK_INTERVAL_SEC` | No | `30` | Interval for background health checks validating ClickHouse node availability. |

---

## 5. Failover Fallback & Throttling Controls

These settings govern the degraded PostgreSQL query fallback path when ClickHouse is unavailable.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `M07_FALLBACK_ENABLED` | No | `true` | If `false`, dashboard queries fail immediately when ClickHouse is down rather than falling back to Postgres. |
| `M07_FALLBACK_FORCE_POSTGRES` | No | `false` | For testing only. Forces PostgreSQL read queries even when ClickHouse is healthy. |
| `M07_FALLBACK_ALERT_THRESHOLD_PERCENT` | No | `5` | Percentage of failed ClickHouse queries in a 5-minute window before dishing high-priority alerts to **Better Stack**. |
| `M07_FALLBACK_MAX_DATERANGE_DAYS` | No | `90` | Hard date range limit (in days) allowed in fallback mode to prevent massive table scans. |
| `M07_FALLBACK_THROTTLE_NON_ESSENTIAL` | No | `true` | When `true`, M7 automatically disables and throttles non-essential dashboard widgets (such as theme tables) during fallback. |

---

## 6. Dashboard Snapshot Cache Settings

Governs background caching inside `m07_revenue_dashboards.dashboard_snapshots` to optimize repeated load speeds.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `M07_SNAPSHOT_REFRESH_ENABLED` | No | `true` | Enables or disables background cron caching operations. |
| `M07_SNAPSHOT_REFRESH_CRON` | No | `0 */1 * * *` | Chron execution configuration for precalculated snapshots (defaults to hourly). |
| `M07_SNAPSHOT_STALENESS_THRESHOLD_MINUTES` | No | `60` | Age threshold in minutes. Snapshots older than this trigger asynchronous background recalculation. |
| `M07_SNAPSHOT_JOB_CONCURRENCY` | No | `2` | Number of concurrent BullMQ snapshot generation worker threads allowed. |

---

## 7. Custom Metric & Experimental Features

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `M07_FEATURE_CUSTOM_METRICS_ENABLED` | No | `true` | Enables custom metrics evaluations based on formulas inside `custom_metrics` table. |
| `M07_DEFAULT_DASHBOARD_DATERANGE` | No | `LAST_30_DAYS` | Fallback time window preset used when no user profile configuration exists. |
| `M07_MAX_WIDGETS_PER_DASHBOARD` | No | `30` | Absolute ceiling on layout widgets count allowed per dashboard configuration. |