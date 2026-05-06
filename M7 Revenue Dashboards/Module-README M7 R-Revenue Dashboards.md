# M7 — R-Revenue Dashboards

## 1. What This Module Is

M7 **R-Revenue Dashboards** is the module that provides customizable dashboards to visualize revenue growth and performance for reps, managers, and revenue leaders.  
Dashboards combine metrics and targets into widgets so teams can monitor and analyze business performance in one place, with fast reads from ClickHouse and PostgreSQL fallback when needed.

In the architecture, the Revenue Dashboards feature sits under **M-10 Coaching and Training** in the **Optimize** stage of the Revenue Intelligence Lifecycle, but is packaged as module **M7 R-Revenue Dashboards** in the product roadmap.

---

## 2. What This Module Owns

### 2.1 Responsibilities

M7 owns:

- The **Revenue Dashboard APIs** used by the frontend to load and configure performance dashboards.
- The **dashboards schema** in PostgreSQL, including configuration and snapshot tables.
- The logic for deciding when to use **ClickHouse** vs **PostgreSQL** for metric reads.
- Per-user, per-tenant dashboard layout and configuration, including date ranges and filters.

The module is responsible for **exposing read-optimized views of performance**; it does not own upstream data like deals, calls, or forecasts, but reads them via their owning modules or their replicated ClickHouse tables.

### 2.2 Database Ownership

M7 owns the `dashboards` schema with at least these tables:

- `dashboards.dashboard_configs`
  - Per-user Revenue Dashboard widget layout and configuration.
- `dashboards.custom_metrics`
  - Custom revenue metric definitions created by RevOps or admins.
- `dashboards.dashboard_snapshots`
  - Pre-computed dashboard metric values for fast UI loading.

All tables include `tenantid` and are protected by **row-level security (RLS)** for multi-tenant isolation.

---

## 3. Upstream Dependencies

M7 does **not** compute core business data itself; it reads from upstream modules and the shared analytics store.

### 3.1 Modules Read By M7

M7 reads:

- **M-03 Revenue Graph (Model)**
  - Deals: stage, value, close date, owner, outcome (won/lost).
  - Activities: calls, emails, meetings, engagement scores.
  - Accounts: ARR, segment, health, renewal signals.

- **M-04 Conversation Intelligence (Understand)**
  - Call scores and scorecards.
  - Topic and theme distributions per call, account, or segment.

- **M-09 Forecasting (Predict)**
  - Forecast periods and revenue targets.
  - Forecast submissions by reps/managers.
  - AI forecast snapshots, pipeline coverage metrics, historical conversion rates.

Most of this data is also replicated into **ClickHouse** as time-series tables (e.g., `call_events`, `activity_events`, `call_score_events`, `forecast_submission_events`) and used by the dashboards for fast aggregations.

### 3.2 External Services

M7 relies on:

- **PostgreSQL** as the primary system of record (core modules’ schemas plus `dashboards` schema).
- **ClickHouse** as the analytics store for heavy dashboard queries.
- Platform core components:
  - Auth (shared users/roles).
  - API Gateway / routing.
  - Observability stack (logging, metrics, tracing).

---

## 4. APIs Exposed by This Module

The SAD defines API endpoints for Coaching and Training that include Revenue Dashboards.  
M7 owns (at minimum) the following endpoints:

### 4.1 `GET /api/v1/coaching/dashboards`

**Purpose**: Return the current user’s Revenue Dashboard configuration plus computed widgets (metrics, charts, KPIs).  
**Used by**: Frontend dashboard page load and widget refresh.

High-level behavior:

- Resolves `tenantid` and `userid` from auth.
- Loads the user’s config from `dashboards.dashboard_configs` or creates a default config if missing.
- Builds metric requests for each widget.
- Reads snapshot values from `dashboards.dashboard_snapshots` where possible; otherwise queries ClickHouse and falls back to PostgreSQL if ClickHouse is unavailable.
- Returns a structured dashboard object (date range, filters, widgets with values).

### 4.2 `PATCH /api/v1/coaching/dashboards/config`

**Purpose**: Save or update the user’s dashboard layout and default configuration (widgets, positions, default filters, default date range).  
**Used by**: Frontend when the user rearranges widgets, toggles visibility, or updates default filters.

High-level behavior:

- Validates widget definitions and allowed metric types.
- Enforces RBAC: normal users edit only their own config; admins/RevOps may edit shared templates if implemented.
- Updates `dashboard_configs` with new layout and defaults.

> For detailed API contracts (payload structure, response JSON, error codes), see `tdd-revenue-dashboards.md`.

---

## 5. How User Layout Configuration Works

### 5.1 Per-Tenant, Per-User Configuration

Each user’s layout is stored per tenant in `dashboards.dashboard_configs`:

- `tenantid`: ensures multi-tenant isolation.
- `userid`: identifies the owner of the layout.
- `layout`: JSON defining widget placements and grid positions.
- `visiblewidgets`: list of widget IDs shown for this user.
- `daterangedefault`: default time range (e.g., `LAST_30_DAYS`).
- `filtersdefault`: default filters for team/region/segment, etc.

The **combination of `tenantid` + `userid` is unique**, so each user has exactly one config row per tenant.

### 5.2 Read Flow

On dashboard load:

1. Backend reads `dashboard_configs` for `(tenantid, userid)`.
2. If none exists:
   - Create a default layout for standard metrics (e.g., total revenue, win rate, forecast vs target) and insert it.
3. Use the stored layout and defaults to build metric queries for widgets.

### 5.3 Write Flow

When the user updates layout:

1. Frontend sends a `PATCH /api/v1/coaching/dashboards/config` request with new layout and defaults.
2. Backend validates:
   - Widget IDs/types.
   - Metric IDs (built-in or custom).
   - Limits such as max widgets.
3. Backend updates the `dashboard_configs` row for `(tenantid, userid)`.

---

## 6. ClickHouse Read Path and PostgreSQL Fallback

### 6.1 Normal Path: ClickHouse

For heavy aggregations, M7 reads from **ClickHouse**, which is fed by Debezium/Kafka CDC streams from PostgreSQL tables.

Typical tables:

- `call_events` (from call records).
- `activity_events` (from activities).
- `call_score_events` (from call scores).
- `forecast_submission_events` (from forecast submissions).

Dashboards use ClickHouse to compute:

- Revenue and pipeline metrics over time.
- Activity volumes per rep/team.
- Call scores and topic metrics.
- Forecast submission trends and accuracy.

### 6.2 Fallback Path: PostgreSQL

If ClickHouse is unavailable (connection failure, timeout, health check down):

- The dashboard service recomputes metrics by querying PostgreSQL tables directly:
  - `revenuegraph` schema for deals, activities, accounts.
  - `conversationintelligence` schema for call scores and topics.
  - `forecasting` schema for submissions and AI forecast snapshots.
- Fallback behavior is:
  - Maintain correctness of metrics.
  - Accept slower query performance.
  - Emit alerts so SREs know ClickHouse is down.

The SAD explicitly states that **Revenue Dashboards must remain available through PostgreSQL even when ClickHouse is down**, with alerting to highlight the degraded mode.

---

## 7. Observability and Monitoring

M7 participates in the platform’s observability strategy.

Key telemetry:

- **Metrics**
  - Dashboard load latency (p50, p95, p99) for `GET /api/v1/coaching/dashboards`.
  - Error rate per endpoint.
  - ClickHouse → PostgreSQL fallback rate.
  - Snapshot refresh job duration and failure counts.

- **Logs**
  - Request logs (tenant, user, endpoint, date range, widget count).
  - Warnings when using fallback.
  - Errors for failed queries, invalid configs, or broken upstream calls.

- **Alerts**
  - High fallback rate suggests ClickHouse outage.
  - Consistently high dashboard latency.
  - Snapshot job failures leading to stale data.

---

## 8. Security and RBAC

### 8.1 Multi-Tenancy

M7 follows the platform’s shared-PostgreSQL, RLS-based multi-tenant model:

- All tables (`dashboard_configs`, `custom_metrics`, `dashboard_snapshots`) have `tenantid`.
- RLS ensures a tenant can only see its own data.
- All queries must include `tenantid` filters; this is enforced in code and validated through automated tests.

### 8.2 Access Control

Roles (example mapping):

- **Rep**
  - Can read their own dashboard.
  - Can update their own layout and filters.
- **Manager**
  - Can read dashboards aggregated by their team.
  - May have access to team-level dashboards, depending on RBAC settings.
- **Admin / RevOps**
  - Can define `custom_metrics`.
  - Can manage organization-wide templates or defaults, if implemented in future versions.

API layer must check:

- User is authenticated and part of the requested tenant.
- User is authorized for the dashboard scope (self vs team vs org).

---

## 9. How to Work on This Module (For Engineers)

### 9.1 When You Touch M7

Typical tasks for engineers:

- Add a new widget type or new metric.
- Adjust default date ranges or filter behavior.
- Tune performance of dashboard queries (ClickHouse and fallback).
- Extend config schema (e.g., add support for multiple dashboards per user).

Before you start, you should:

1. Read `tdd-revenue-dashboards.md` for internal logic and contracts.
2. Review relevant sections of the System Architecture Document:
   - Module architecture and Revenue Graph.
   - Database architecture and ClickHouse replication.
   - Non-functional requirements (performance, availability).

### 9.2 Local Setup Checklist

To work on M7 locally, you typically need:

- PostgreSQL with:
  - `dashboards` schema.
  - Required upstream schemas (or at least sample tables/views from M-03, M-04, M-09).
- Optional but recommended:
  - Local ClickHouse or a mocked ClickHouse adapter.
- Required environment variables:
  - ClickHouse connection settings.
  - Flags/variables for fallback and snapshot behavior.
  - Observability (e.g., API keys/URLs for logging/monitoring).

The full variable list is in `docs/modules/m07/env-registry.md` (see that file for details).

---

## 10. Related Documents

For full understanding, pair this README with:

- **Feature TDD**
  - `docs/modules/m07/tdd-revenue-dashboards.md`
  - Deep dive into:
    - Widget definitions and catalog.
    - Data model (`dashboard_configs`, `custom_metrics`, `dashboard_snapshots`).
    - Date-range behavior and filter persistence.
    - Snapshot refresh and stale-data handling.
    - Detailed API contracts and test strategy.

- **Sequence diagrams**
  - `docs/modules/m07/sequence-dashboard-read-flow.md`
    - Dashboard page load flow (frontend → API → ClickHouse/PostgreSQL → response).
  - `docs/modules/m07/sequence-save-dashboard-config.md`
    - Save/update layout and config flow.
  - `docs/modules/m07/sequence-clickhouse-fallback.md`
    - Fallback behavior when ClickHouse is unavailable.

- **Env Registry**
  - `docs/modules/m07/env-registry.md`
  - All environment variables that influence M7 behavior (APIs, snapshot refresh, ClickHouse connectivity, PostgreSQL fallback, observability).

---

## 11. Quick Mental Model (For Freshers)

If you are new to this codebase, think of M7 as:

- A **read-heavy “reporting” module** that:
  - Reads from multiple upstream sources (deals, calls, forecasts).
  - Combines them into easy-to-understand widgets.
  - Stores only configuration and cached metrics for speed.

- A module that **never owns core transactional data** like deals or calls; it just reads those through stable APIs or analytics tables.

When in doubt:

1. Ask “who owns this data?” and call that module’s API or view instead of querying its tables directly.
2. Keep all layout and user-specific preferences inside `dashboard_configs`.
3. Use ClickHouse for heavy aggregations, and PostgreSQL only as a safe fallback.