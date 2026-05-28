# Doc #18 — M4 Environment Variables Registry

**Workspace Registry Path:** `modules/m04-deal-intelligence/env-registry.md`  
**Reference Doc Path:** `/doc/reference/M4 Deal Intelligence/Environment Variables Registry-M4.md`

## 1. Document Control

- **Document Title:** M4 Environment Variables Registry
- **Module:** M4 Deal Intelligence
- **Owner:** Product Engineering — M4
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18
- **Review Cadence:** Every 3 months, or immediately after a major architecture, infrastructure, security, integration, or feature-boundary change.

---

## 2. Purpose

This document serves as the Single Source of Truth (SSOT) module-level registry for environment variables used by **M4 Deal Intelligence**. It ensures configuration clarity, security compliance, and consistency across local development, staging, and production environments.

For M4, this registry manages:
- Deals Boards column layout, sorting filters, and saved views.
- Deal Drivers analytics recomputation debouncing and snapshot TTL settings.
- CRM configuration read paths and downstream scoring thresholds.
- BullMQ queue prefixes and database connection pools.

---

## 3. Usage Rules

### Core Rules
- **Doppler for Secrets:** All secrets, keys, and credentials must be stored in Doppler and injected at runtime.
- **No Hardcoded Secrets:** Storing secrets in source repositories, committed `.env` files, or Docker images is strictly prohibited.
- **Tenant Context Security:** Tenant scope is extracted dynamically from Supabase JWT claims during API requests. Static process configurations must never be used to override or dictate tenant scopes.

### Configuration Rules
- **Fail Fast:** Required variables must fail Zod validation at startup if missing, preventing half-bootstrapped deployments.
- **Naming Stability:** Variable names must remain identical across all environments, with only their values varying.
- **API Boundary Compliance:** All cross-module read dependencies must utilize the standard public REST APIs (or approved read-models) rather than attempting direct cross-schema database queries.

---

## 4. Variable Registry Table

| Variable Name | Required | Example | Scope | Used By | Description |
|---|---|---|---|---|---|
| `NODE_ENV` | Yes | `production` | All Envs | API, Workers | Standard runtime mode selector (`development`, `staging`, `production`). |
| `APP_ENV` | Yes | `staging` | All Envs | API, Workers | Human-readable deployment environment name for telemetry and Sentry logging. |
| `M04_ENABLED` | Yes | `true` | All Envs | API Bootstrap | Master feature flag for M4 module enablement. |
| `M04_DEALS_BOARD_ENABLED` | Yes | `true` | All Envs | Deals Boards | Enables Deals Board UI rendering and backend endpoints. |
| `M04_DEAL_DRIVERS_ENABLED` | Yes | `true` | All Envs | Deal Drivers | Enables rep-level and board-scoped Deal Drivers analytics API endpoints. |
| `M04_SAVED_VIEWS_ENABLED` | No | `true` | All Envs | Saved Views | Enables customized board view configuration and view bookmarks. |
| `DATABASE_URL` | Yes | `postgresql://...` | All Envs | API, Workers | PostgreSQL connection string for M4-owned tables under schema `m04_deal_intelligence` (e.g. `deal_boards`, `deal_board_columns`, `deal_board_views`, `deal_drivers`). |
| `POSTGRES_POOL_MIN` | No | `2` | All Envs | API | Minimum database connection pool size for Prisma client (Default: `2`). |
| `POSTGRES_POOL_MAX` | No | `20` | All Envs | API | Maximum database connection pool size for Prisma client (Default: `20`). |
| `REDIS_URL` | Yes | `redis://redis:6379` | All Envs | BullMQ, Cache | Redis connection string for BullMQ queue state persistence. |
| `BULLMQ_PREFIX` | Yes | `rri` | All Envs | Workers | Queue namespace prefix to avoid multi-module or environment collisions. |
| `M04_HEALTH_THRESHOLD_CRITICAL`| Yes | `30` | All Envs | Deals Boards | Score threshold below which a deal health status is flagged as critical (Default: `30`). |
| `M04_HEALTH_THRESHOLD_WARNING` | Yes | `60` | All Envs | Deals Boards | Score threshold below which a deal health status is flagged as a warning (Default: `60`). |
| `M04_ENGAGEMENT_WINDOW_DAYS`   | No | `14` | All Envs | Deals Boards | Analysis window size in days used to evaluate activity recency (Default: `14` days). |
| `M04_BOARD_REFRESH_POLL_MS`    | No | `15000` | All Envs | Frontend | Polling interval in milliseconds for dashboard data validity checks (Default: `15000`ms / 15s). |
| `M04_DRIVER_SNAPSHOT_TTL_SEC`  | No | `300` | All Envs | Deal Drivers | Maximum cache age in seconds before a deal-driver snapshot is considered stale (Default: `300`s / 5m). |
| `M04_DRIVER_MAX_DEALS_LIMIT`   | No | `1000` | All Envs | Deal Drivers | Safety threshold restricting the maximum number of deals included in a single driver snapshot recompute. |
| `M04_DRIVER_DEFAULT_WINDOW_DAYS`| No | `30` | All Envs | Deal Drivers | Default rolling window in days for aggregating deal driver trends (Default: `30` days). |
| `M04_DRIVER_RECOMPUTE_DEBOUNCE_MS`| No | `60000` | All Envs | Workers | Debounce delay in milliseconds applied to batch concurrent snapshot recomputes (Default: `60000`ms / 1m). |
| `M10_REVENUE_GRAPH_API_URL`    | Yes | `http://api:3000/api/v1/m10-data-compliance` | All Envs | API | REST API endpoint used to query scoped transaction contexts from M10. |
| `M03_AI_SUMMARIES_API_URL`     | Yes | `http://api:3000/api/v1/m03-ai-summaries-genai` | All Envs | API | REST API endpoint used to query call summaries and briefs from M3. |
| `JWT_AUDIENCE` | Yes | `rri-api` | All Envs | Auth | Expected JWT audience string validated by middleware. |
| `SUPABASE_JWT_SECRET` | Yes | `***` | All Envs | Auth | JWT cryptographic validation signature secret managed through Doppler. |
| `SENTRY_DSN` | Yes | `https://...` | All Envs | Observability | Sentry integration endpoint for error diagnostics and trace collections. |
| `LOG_LEVEL` | Yes | `info` | All Envs | Observability | System logging depth selector (`debug`, `info`, `warn`, `error`). |
| `ENABLE_STRUCTURED_LOGGING` | Yes | `true` | All Envs | Observability | Forces application logs to be structured into JSON format (Default: `true`). |

---

## 5. Minimum Required Variables by Flow

### A. Deals Board Rendering & Read Flow
To successfully retrieve pipeline deals and board layouts, these variables must be present:
- `M04_ENABLED`
- `M04_DEALS_BOARD_ENABLED`
- `DATABASE_URL`
- `M10_REVENUE_GRAPH_API_URL`
- `JWT_AUDIENCE`
- `SUPABASE_JWT_SECRET`

### B. Asynchronous Health & Risk Recalculations
To process upstream meeting signals and recompute board row metrics:
- `DATABASE_URL`
- `REDIS_URL`
- `BULLMQ_PREFIX`
- `M04_HEALTH_THRESHOLD_CRITICAL`
- `M04_HEALTH_THRESHOLD_WARNING`
- `M03_AI_SUMMARIES_API_URL`

### C. Deal Drivers Analytics Snapshots
To compute and rank rep-level or board-scoped driver analyses:
- `M04_ENABLED`
- `M04_DEAL_DRIVERS_ENABLED`
- `DATABASE_URL`
- `REDIS_URL`
- `M04_DRIVER_SNAPSHOT_TTL_SEC`
- `M04_DRIVER_DEFAULT_WINDOW_DAYS`
- `M04_DRIVER_RECOMPUTE_DEBOUNCE_MS`

---

## 6. Verification Checklist

Before deploying variables, verify that:
- [ ] Variables exist in Doppler under the target environment configuration.
- [ ] The Zod config schema in `modules/m04-deal-intelligence/src/config/` is updated to validate new keys.
- [ ] `M04_ENABLED` is checked at startup during module bootstrap.
- [ ] No secrets or keys are committed to Git repositories or raw Dockerfiles.
