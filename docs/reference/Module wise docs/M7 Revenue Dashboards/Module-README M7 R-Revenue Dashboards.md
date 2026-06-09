# Module README — M7 Revenue Dashboards

## 1. Document Control

- **Document Title:** Module Specification README — M7 Revenue Dashboards
- **Module Name:** M7 Revenue Dashboards
- **Technical Workspace:** `modules/m07-revenue-dashboards/` at monorepo root
- **Platform Lifecycle Stage:** Stage 7 — `Optimize`
- **Owner:** Product Engineering — M7
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### What This Module Is
M7 **Revenue Dashboards** is the analytical visualization engine of the R-Revenue Intelligence platform. It provides role-based, customizable grid interfaces to visualize revenue growth, pipeline health, win rates, sales activities, and attainment metrics. 

By grouping raw analytical events into pre-rendered KPI blocks, time-series charts, and leaderboards, M7 enables sales teams to analyze business performance instantly. To guarantee high responsiveness under heavy data volumes, M7 implements a multi-tiered data retrieval model backed by high-performance **ClickHouse Columnar Storage** as the primary query path, and an automatic **PostgreSQL Failover Fallback** mechanism.

---

## 3. What This Module Owns

### 3.1 Responsibilities
M7 is strictly a **read-heavy reporting module**. It does **not** own core transactional write-paths for upstream entities (like deals, accounts, or forecast submissions); instead, it reads aggregated views of those entities to compose widgets.

M7 owns:
1. **The Revenue Dashboard APIs:** Serving user layouts, configurations, and widget calculations.
2. **Dashboard Configuration Schema:** Storing layout states, grid coordinate details, and custom metric definitions.
3. **The ClickHouse/PostgreSQL Query Dispatcher:** Dynamically resolving queries based on ClickHouse database availability.
4. **Dashboard Layout Persistence:** Managing per-user, per-tenant layout grids, date range defaults, and active filters.

### 3.2 Database Schema Ownership
M7 owns the `m07_revenue_dashboards` PostgreSQL schema containing three core tables:

- `m07_revenue_dashboards.dashboard_configs`: Stores per-user widget positions, grid layouts, default filters, and active configurations.
- `m07_revenue_dashboards.custom_metrics`: Stores custom metric formulas and filters created by RevOps or system administrators.
- `m07_revenue_dashboards.dashboard_snapshots`: Stores pre-computed metric values for fast loading and database load mitigation.

*Note: All tables include `tenant_id` and are strictly protected by PostgreSQL **Row-Level Security (RLS)**.*

---

## 4. Upstream Boundaries & Dependencies

M7 operates as a downstream consumer of the platform's transactional data. It consumes events and queries data from the following modules:

- **M10 Data & Compliance (Revenue Graph):**
  - Reads transactional deal entities (stage, close date, won/lost state), accounts (ARR, segments), and logged activities (calls, emails, meetings).
- **M2 Conversation Intelligence:**
  - Reads call scorecards, topic tagging volumes, and theme counts.
- **M6 Forecasting & Prediction:**
  - Reads forecast period quotas, rep manual submissions, and AI predictive snapshots.

*Most transactional data is replicated asynchronously into ClickHouse tables (e.g., `call_events`, `activity_events`, `call_score_events`, `forecast_submission_events`) to allow high-speed BI aggregations.*

---

## 5. APIs Exposed by This Module

All endpoints are hosted under the unified prefix: `/api/v1/m07-revenue-dashboards`.

### 5.1 GET /api/v1/m07-revenue-dashboards
- **Purpose:** Retrieve the current user's dashboard configuration and computed widget metrics.
- **Used by:** Frontend dashboard page load.
- **Behavior:**
  1. Resolves `tenant_id` and `user_id` from the JWT claims context.
  2. Queries `m07_revenue_dashboards.dashboard_configs` for layout properties.
  3. Translates widget items into metric queries.
  4. Attempts to load fresh precalculated results from `m07_revenue_dashboards.dashboard_snapshots`.
  5. If missing or stale, queries ClickHouse (preferred) or PostgreSQL (fallback).
  6. Returns a structured dashboard payload with widgets, grid layouts, and values.

### 5.2 PATCH /api/v1/m07-revenue-dashboards/config
- **Purpose:** Save or update the active user's dashboard grid layouts and default filters.
- **Used by:** Frontend drag-and-drop or widget configuration panel.
- **Behavior:**
  1. Validates layouts JSON schema and widget coordinate structures via Zod.
  2. Verifies that all metric references reside in the custom metrics registry or built-in models.
  3. Enforces RBAC checks (preventing standard sales reps from modifying organization or team layouts).
  4. Updates the configuration row inside `m07_revenue_dashboards.dashboard_configs`.

---

## 6. ClickHouse Primary Path & PostgreSQL Fallback

To protect operational database throughput and guarantee high performance:

### 6.1 Normal Path: ClickHouse
For high-volume analytical aggregations, M7 targets **ClickHouse** as the primary data engine. ClickHouse is fed via real-time Kafka/Debezium Change Data Capture (CDC) streams from PostgreSQL.
- **Queries Computed:** Total revenue trends, sales conversion funnels, activity leaderboards, and historical forecast accuracy charts.

### 6.2 Degraded Fallback: PostgreSQL
If the ClickHouse cluster becomes unavailable (due to timeouts, native driver failures, or healthcheck down alerts):
1. **Automatic Failover:** The dashboard query dispatcher intercepts the failure, switches active database queries to PostgreSQL, and recomputes the metrics using raw transactional schemas (`m10_data_compliance.*`, `m02_conversation_intelligence.*`, `m06_forecasting_prediction.*`).
2. **PII & Alert Logging:** The system instantly dispatches a high-priority, redacted warning alert to **Better Stack** notifying SREs of ClickHouse down status.
3. **DB Resource Protection (Throttling):** To prevent database starvation under fallback SQL loads:
   - Non-essential dashboard widget renderings (such as deep competitor theme trends or sub-metric tables) are automatically **throttled and disabled** (returning a `429 Too Many Requests` or simplified placeholder blocks).
   - Date range boundaries are truncated to a maximum of **90 days** to avoid heavy full table scans.

---

## 7. Security and RBAC

- **Multi-Tenancy:** All queries are parameterized with `tenant_id` and validated via application Prisma middleware and database-level RLS policies.
- **Access Control Roles:**
  - **Sales Reps:** Can view personal dashboards and edit their own private configs.
  - **Sales Managers:** Can view team-level aggregations and layout defaults.
  - **Admins & RevOps:** Can define new global `custom_metrics` formulas and publish shared dashboard templates.