# Environment Variables Registry — M7 R-Revenue Dashboards

This file documents environment variables used by the **M7 R-Revenue Dashboards** module.  
The focus is on dashboard APIs, snapshot refresh behavior, ClickHouse connectivity, PostgreSQL fallback, and observability.

> Note: Naming is illustrative; align final names with your platform-wide env naming conventions.

---

## 1. Service Identity and Basic Config

These are generic service-level variables that still affect M7 behavior.

| Variable                         | Required | Default            | Description |
|----------------------------------|----------|--------------------|-------------|
| `SERVICE_NAME`                   | Yes      | `m7-revenue-dashboards` | Logical service name for logs and metrics. |
| `NODE_ENV` (or `APP_ENV`)        | Yes      | `development`      | Environment: `development`, `staging`, `production`. Controls log verbosity and some safety checks. |
| `PORT`                           | Yes      | `3000`             | HTTP port where the dashboards API server listens. |
| `API_GATEWAY_BASE_URL`          | No       |                    | Base URL of API Gateway if the service needs to construct absolute links or callbacks. |

---

## 2. PostgreSQL Configuration

M7 uses PostgreSQL for **config tables** (`dashboards` schema) and as the **fallback analytics store** when ClickHouse is unavailable.

### 2.1 Core Postgres Connection

| Variable                    | Required | Default | Description |
|-----------------------------|----------|---------|-------------|
| `PG_HOST`                   | Yes      |         | PostgreSQL hostname (for all module schemas, including `dashboards`). |
| `PG_PORT`                   | Yes      | `5432`  | PostgreSQL port. |
| `PG_DATABASE`               | Yes      |         | Database name containing all module schemas. |
| `PG_USER`                   | Yes      |         | Username for PostgreSQL. |
| `PG_PASSWORD`               | Yes      |         | Password for PostgreSQL. |
| `PG_SSL_MODE`              | No       | `require` in prod | SSL mode (`disable`, `require`, etc.) depending on environment. |

### 2.2 Dashboards Schema and Connection Behavior

| Variable                                   | Required | Default       | Description |
|--------------------------------------------|----------|---------------|-------------|
| `M7_DASHBOARDS_SCHEMA`                     | No       | `dashboards`  | Schema name for dashboard tables (`dashboard_configs`, `dashboard_snapshots`, `custom_metrics`). |
| `M7_PG_POOL_MAX`                           | No       | `10`          | Max connections in the Postgres pool for M7. |
| `M7_PG_STATEMENT_TIMEOUT_MS`               | No       | `10000`       | Statement timeout for M7 queries, especially fallback aggregations. |
| `M7_PG_FALLBACK_MAX_DAYS`                  | No       | `90`          | Max number of days allowed in a date range for Postgres fallback queries (caps heavy scans). |
| `M7_PG_FALLBACK_MAX_ROWS`                  | No       | `500000`      | Upper bound on rows Postgres queries should scan in fallback mode; used for safety guards. |

---

## 3. ClickHouse Configuration

ClickHouse is the primary analytics store for heavy aggregations in Revenue Dashboards.

### 3.1 ClickHouse Connection

| Variable                             | Required | Default | Description |
|--------------------------------------|----------|---------|-------------|
| `CLICKHOUSE_HOST`                    | Yes      |         | ClickHouse hostname. |
| `CLICKHOUSE_PORT`                    | Yes      | `9000` (native) or `8123` (HTTP) | ClickHouse port, depending on driver. |
| `CLICKHOUSE_DATABASE`                | Yes      |         | ClickHouse database used for analytics tables. |
| `CLICKHOUSE_USER`                    | Yes      |         | ClickHouse username. |
| `CLICKHOUSE_PASSWORD`                | Yes      |         | ClickHouse password. |
| `CLICKHOUSE_SECURE`                  | No       | `false` | Enable TLS/HTTPS for ClickHouse connection. |

### 3.2 ClickHouse Query Behavior

| Variable                                     | Required | Default  | Description |
|----------------------------------------------|----------|----------|-------------|
| `M7_CLICKHOUSE_ENABLED`                      | No       | `true`   | Master flag to enable/disable ClickHouse usage for dashboards (useful for local dev or troubleshooting). |
| `M7_CLICKHOUSE_QUERY_TIMEOUT_MS`             | No       | `5000`   | Timeout for ClickHouse aggregation queries. |
| `M7_CLICKHOUSE_MAX_CONCURRENT_QUERIES`       | No       | `20`     | Limit concurrent ClickHouse queries issued by M7 to protect the cluster. |
| `M7_CLICKHOUSE_HEALTHCHECK_INTERVAL_SEC`     | No       | `30`     | Interval for health checks to verify ClickHouse availability. |

---

## 4. Fallback and Degraded Mode Controls

When ClickHouse is down, dashboards must still be available using PostgreSQL.

### 4.1 Fallback Toggle and Behavior

| Variable                                   | Required | Default  | Description |
|--------------------------------------------|----------|----------|-------------|
| `M7_FALLBACK_ENABLED`                      | No       | `true`   | If `false`, do not fall back to Postgres; instead fail requests (use only for debugging, not production). |
| `M7_FALLBACK_FORCE_POSTGRES`               | No       | `false`  | If `true`, **always** use Postgres for metric queries (for testing Postgres path even when ClickHouse is fine). |
| `M7_FALLBACK_LOG_LEVEL`                    | No       | `warn`   | Log level for fallback events (`info` or `warn`). |
| `M7_FALLBACK_ALERT_THRESHOLD_PERCENT`      | No       | `5`      | Alert when > X% of dashboard requests in a window use fallback (e.g., 5%). |

### 4.2 Performance Safeguards in Fallback

| Variable                                      | Required | Default | Description |
|-----------------------------------------------|----------|---------|-------------|
| `M7_FALLBACK_MAX_WIDGETS_PER_REQUEST`         | No       | `20`    | Cap number of widgets that can be computed in one request when using Postgres. |
| `M7_FALLBACK_MAX_DATERANGE_DAYS`             | No       | `90`    | Hard cap on date range (in days) allowed in fallback mode to avoid full historical scans. |

---

## 5. Dashboard Snapshot Refresh Settings

Snapshots in `dashboards.dashboard_snapshots` store pre-computed metrics for performance.

### 5.1 Snapshot Scheduling

| Variable                                 | Required | Default                 | Description |
|------------------------------------------|----------|-------------------------|-------------|
| `M7_SNAPSHOT_REFRESH_ENABLED`           | No       | `true`                  | Master flag to turn snapshot refresh jobs on/off. |
| `M7_SNAPSHOT_REFRESH_CRON`              | No       | `0 */1 * * *`           | Cron expression for snapshot refresh (e.g., hourly). |
| `M7_SNAPSHOT_REFRESH_TIMEZONE`          | No       | `UTC`                   | Timezone used for interpreting the cron expression. |
| `M7_SNAPSHOT_MAX_LOOKBACK_DAYS`         | No       | `365`                   | How far back snapshots should be computed (e.g., 12 months). |

### 5.2 Snapshot Behavior and Limits

| Variable                                    | Required | Default | Description |
|---------------------------------------------|----------|---------|-------------|
| `M7_SNAPSHOT_STALENESS_THRESHOLD_MINUTES`   | No       | `60`    | If a snapshot is older than this, it is considered stale and will be recomputed when requested. |
| `M7_SNAPSHOT_MAX_METRICS_PER_JOB`           | No       | `200`   | Max metrics processed per refresh job run. |
| `M7_SNAPSHOT_JOB_CONCURRENCY`               | No       | `2`     | Number of snapshot refresh workers running in parallel. |

---

## 6. Dashboard API Behavior and Defaults

These variables control how the dashboard APIs behave (e.g., default ranges, maximum load).

### 6.1 Date Range and Filter Defaults

| Variable                              | Required | Default          | Description |
|---------------------------------------|----------|------------------|-------------|
| `M7_DEFAULT_DASHBOARD_DATERANGE`     | No       | `LAST_30_DAYS`   | Default date range when no user-specific config exists. |
| `M7_ALLOWED_DATERANGES`              | No       | `LAST_7_DAYS,LAST_30_DAYS,LAST_90_DAYS,THIS_QUARTER,THIS_YEAR` | Allowed preset ranges for dashboards. |
| `M7_MAX_CUSTOM_DATERANGE_DAYS`       | No       | `365`            | Max allowed length (in days) for a custom date range. |

### 6.2 Pagination and Widget Limits

| Variable                               | Required | Default | Description |
|----------------------------------------|----------|---------|-------------|
| `M7_MAX_WIDGETS_PER_DASHBOARD`         | No       | `30`    | Max number of widgets a single user dashboard can have. |
| `M7_MAX_WIDGETS_PER_REQUEST`           | No       | `30`    | Safety cap for widget count per API response. |
| `M7_DEFAULT_PAGE_SIZE_WIDGET_TABLE`    | No       | `50`    | Default page size for table-type widgets. |
| `M7_MAX_PAGE_SIZE_WIDGET_TABLE`        | No       | `200`   | Max page size allowed for table-type widgets. |

---

## 7. Observability and Logging

M7 participates in the global observability stack for logs, metrics, and traces.

### 7.1 Logging

| Variable                     | Required | Default  | Description |
|------------------------------|----------|----------|-------------|
| `LOG_LEVEL`                  | No       | `info`   | Log level: `debug`, `info`, `warn`, `error`. |
| `JSON_LOGS`                  | No       | `true`   | Emit logs in JSON format for centralized logging systems. |
| `LOG_REQUEST_BODY_SAMPLES`   | No       | `false`  | When `true`, log sampled request bodies for debugging (never enable in production for PII-heavy data). |

### 7.2 Metrics and Tracing

| Variable                                  | Required | Default | Description |
|-------------------------------------------|----------|---------|-------------|
| `METRICS_EXPORTER_ENABLED`               | No       | `true`  | Enable export of metrics (Prometheus/OTEL). |
| `METRICS_EXPORTER_ENDPOINT`             | No       |         | Metrics endpoint (e.g., Prometheus scrape path or OTEL collector endpoint). |
| `TRACING_ENABLED`                        | No       | `true`  | Enable distributed tracing for dashboard requests. |
| `TRACING_EXPORTER_ENDPOINT`             | No       |         | OTEL/Jaeger collector endpoint. |
| `TRACING_SAMPLE_RATE`                   | No       | `0.1`   | Fraction of requests sampled for tracing (0.0–1.0). |

### 7.3 Alerting

| Variable                                       | Required | Default | Description |
|------------------------------------------------|----------|---------|-------------|
| `M7_ALERT_ON_FALLBACK_RATE`                    | No       | `true`  | Whether to emit alerts when fallback usage gets high. |
| `M7_ALERT_ON_DASHBOARD_LATENCY_P95_MS`         | No       | `2000`  | Alert threshold for p95 dashboard latency. |
| `M7_ALERT_ON_SNAPSHOT_JOB_FAILURES`            | No       | `true`  | Whether to alert when snapshot jobs repeatedly fail. |

---

## 8. Security and Auth Integration

Authentication and tenant scoping come from the platform’s shared auth system.

| Variable                               | Required | Default | Description |
|----------------------------------------|----------|---------|-------------|
| `AUTH_JWT_PUBLIC_KEY`                  | Yes      |         | Public key / JWKS URL to verify JWT tokens from gateway/auth provider. |
| `AUTH_ISSUER`                          | Yes      |         | Expected issuer for tokens. |
| `AUTH_AUDIENCE`                        | Yes      |         | Expected audience for tokens (API identifier). |
| `TENANT_HEADER_NAME`                   | No       | `X-Tenant-Id` | Header name used by gateway to pass tenant ID to M7. |
| `USER_HEADER_NAME`                     | No       | `X-User-Id`   | Header name used by gateway to pass user ID to M7. |

---

## 9. Feature Flags and Experimental Controls

Some M7 features may be rolled out gradually via feature flags.

| Variable                                  | Required | Default | Description |
|-------------------------------------------|----------|---------|-------------|
| `M7_FEATURE_CUSTOM_METRICS_ENABLED`      | No       | `true`  | Enable custom metric definitions via `custom_metrics`. |
| `M7_FEATURE_MULTIPLE_DASHBOARDS_ENABLED` | No       | `false` | Enable support for multiple named dashboards per user (future). |
| `M7_FEATURE_ADVANCED_FILTERS_ENABLED`    | No       | `true`  | Enable advanced filters (e.g., product line, segment) on dashboards. |

---

## 10. Local Development Notes

For local dev, you can often set:

- `M7_CLICKHOUSE_ENABLED=false`
- `M7_FALLBACK_FORCE_POSTGRES=true`

to avoid running a local ClickHouse instance and still exercise the full dashboard behavior against PostgreSQL.  
In staging and production, ClickHouse must be enabled, and fallback is only used as a **temporary degraded mode**, not the default.