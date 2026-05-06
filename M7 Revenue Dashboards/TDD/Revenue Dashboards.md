# TDD — Revenue Dashboards (M7 R-Revenue Dashboards)

## 1. Purpose, Scope, Users, Entry Points

### 1.1 Purpose

Revenue Dashboards provide customizable, visual views of revenue performance, combining metrics and targets into widgets so teams can monitor and analyze business performance in one place.  
In the architecture, this feature lives in **M-10 Coaching and Training** in the Optimize stage and surfaces metrics such as revenue, win rates, activity levels, and performance versus targets.

### 1.2 Scope

In this TDD, “Revenue Dashboards” is treated as a **single feature package** for the product module **M7 R-Revenue Dashboards**.  
Scope includes the backend behavior for:

- Defining dashboard widgets and layouts.
- Loading metrics and snapshots for dashboards.
- Date-range and filter handling.
- Saving user-specific dashboard configuration.
- Handling ClickHouse read path and PostgreSQL fallback.
- Exposing public APIs used by the frontend.

Out of scope (covered in other TDDs):

- Forecast calculation logic (M-09).
- Deal and account board logic (M-07 deals/accounts).
- AI model internals for scores, topics, or forecasts.

### 1.3 Target Users

Primary user types:

- **Sales reps**: See personal performance, pipeline progress, and activity metrics.
- **Sales managers / frontline leaders**: Compare team performance, monitor goal attainment, track win rates.
- **RevOps and revenue leaders**: Create and configure dashboards, define custom metrics, and monitor revenue health at org level.

### 1.4 Entry Points

Main user entry points:

- Frontend route such as `/dashboards/revenue` or within a “Performance” or “Coaching” area.
- API calls from the frontend:
  - `GET /api/v1/coaching/dashboards`
  - `PATCH /api/v1/coaching/dashboards/config`.

---

## 2. High-Level Feature Overview

Revenue Dashboards act as an **Optimize-stage view** that reads from earlier stages (Capture → Model → Understand → Analyze → Execute → Predict) to provide a unified performance view.  
The dashboards are **configurable per user and per tenant**, using widget layouts stored in the `dashboards` schema and metrics computed from both PostgreSQL and ClickHouse.

At a high level, the flow is:

1. User opens Revenue Dashboard page.
2. Backend loads user layout from `dashboard_configs`.
3. Backend resolves widgets into metric queries.
4. Metrics are loaded via ClickHouse (preferred) or PostgreSQL (fallback).
5. Response is returned as a list of widgets with computed values and metadata.

---

## 3. Data Sources and Upstream Dependencies

### 3.1 Lifecycle Mapping

In the SAD, Revenue Dashboards are part of **M-10 Coaching and Training** and mapped to the **Optimize** stage.  
They depend on data produced by earlier modules:

- M-03 Revenue Graph (Model).
- M-04 Conversation Intelligence (Understand).
- M-09 Forecasting and Prediction (Predict).

### 3.2 Upstream Data Sources

Revenue Dashboards read the following logical data sets:

- **From M-03 Revenue Graph**
  - Deals and outcomes: closed-won / closed-lost status, amount, close date.
  - Activities: calls, emails, meetings logged per deal/account.
  - Accounts and contacts: segments, ARR, ownership.

- **From M-04 Conversation Intelligence**
  - Call score data: call reviews, scorecards, total scores.
  - Topic and theme data: topic distributions, themes aligned to calls.

- **From M-09 Forecasting**
  - Forecast periods and revenue targets.
  - Historical forecast submissions per rep and per period.
  - AI forecast snapshots and pipeline coverage metrics.

In the database, many of these are stored in their own schemas (e.g., `revenuegraph`, `conversationintelligence`, `forecasting`) and replicated into ClickHouse as time-series events for fast aggregation.

---

## 4. Data Model for Revenue Dashboards

### 4.1 Schema Ownership

The SAD defines a dedicated **`dashboards` schema** owned by M-10/M7 for storing dashboard-related configuration and snapshots.  
Key tables:

- `dashboards.dashboard_configs`
- `dashboards.custom_metrics`
- `dashboards.dashboard_snapshots`.

All tables include `tenantid` for multi-tenant isolation enforced through row-level security (RLS).

### 4.2 `dashboard_configs` — Per-User Layout and Settings

**Purpose**: Store per-user and per-tenant dashboard layout, widget configuration, and default filters.

Example columns (logical):

- `configid` (UUID, PK)
- `tenantid` (UUID, required)
- `userid` (UUID, user owning this layout)
- `layout` (JSONB; positions, grid size, etc.)
- `visiblewidgets` (JSONB or text array; list of widget IDs/types)
- `daterangedefault` (text; e.g., `LAST_30_DAYS`, `THIS_QUARTER`)
- `filtersdefault` (JSONB; default filters like team, region)
- `createdat`, `updatedat` (timestamps).

**Usage**:

- `GET /api/v1/coaching/dashboards`:
  - Reads this record for the current `tenantid` + `userid`.
- `PATCH /api/v1/coaching/dashboards/config`:
  - Updates layout, visible widgets, and default filters.

### 4.3 `custom_metrics` — Custom Metric Definitions

**Purpose**: Allow RevOps or admins to define custom revenue metrics used in widgets.

Example columns:

- `metricid` (UUID, PK)
- `tenantid` (UUID)
- `name` (string; human readable)
- `formula` (JSONB or DSL text)
- `basemetric` (enum; e.g., `REVENUE`, `WIN_RATE`, `ACTIVITY_COUNT`)
- `filters` (JSONB; static filters applied to this metric)
- `createdby`, `createdat`.

**Usage**:

- Widgets reference `metricid` and the backend evaluates `formula` by mapping it to the correct aggregation queries against ClickHouse/PostgreSQL.

### 4.4 `dashboard_snapshots` — Precomputed Metric Values

**Purpose**: Store pre-computed metric values for given periods and dimensions to speed up dashboard load.

Example columns:

- `snapshotid` (UUID, PK)
- `tenantid` (UUID)
- `period` (text or date range; e.g., `2026-Q2`, `2026-04-01..2026-04-30`)
- `metricname` (string; e.g., `total_revenue`, `win_rate`, `forecast_accuracy`)
- `dimension` (JSONB or string; e.g., `{"type": "rep", "id": "<uuid>"}`)
- `value` (numeric)
- `computedat` (timestamp).

**Usage**:

- Used on dashboard load for metrics that are expensive to compute from raw events.
- Refreshed periodically or via trigger when upstream data changes.

---

## 5. Widget Model and Catalog

### 5.1 Widget Definition (Logical Model)

A **widget** is a unit on the dashboard that represents one metric (or a small set of related metrics) in a visual form.

Logical structure (frontend-agnostic):

- `widgetId`: unique ID within the layout.
- `type`: e.g., `KPI_CARD`, `TIME_SERIES`, `BAR_CHART`, `TABLE`, `FUNNEL`.
- `title`: display name.
- `metricId` or `metricName`: link to `custom_metrics` or built-in metrics.
- `dimensions`: how data is grouped (e.g., by rep, by team, by region, by stage).
- `dateRange`: override or inherit from dashboard-level date range.
- `filters`: additional filters (e.g., pipeline stage = `Closed Won`, region = `APAC`).
- `targets`: optional target values or thresholds for comparison.

Widgets are stored in `dashboard_configs.layout` and/or `visiblewidgets` as JSON and interpreted by the backend when resolving metric queries.

### 5.2 Widget Types

Initial widget catalog (examples):

- **KPI Card**
  - Shows a single aggregated number (e.g., total revenue this quarter, win rate, forecast accuracy).
- **Time-Series Chart**
  - Revenue or activity over time (e.g., weekly closed-won revenue).
- **Leaderboard / Bar Chart**
  - Metric by rep or team (e.g., revenue by rep, calls per rep).
- **Funnel**
  - Simple stage progression rates (e.g., opportunity stage conversion).
- **Table**
  - Tabular view of metric breakdowns (e.g., account-level metrics).

Each widget type maps to a metric query template and a frontend visualization component.

### 5.3 Allowed Metric Types

Metric categories supported:

- **Revenue metrics**
  - Total closed-won revenue over period.
  - Pipeline value by stage.
  - Revenue by segment or region.

- **Win rate metrics**
  - Win rate by rep, team, or segment.
  - Average deal size, sales cycle length.

- **Activity metrics**
  - Number of calls, emails, meetings logged per rep/team.
  - Activity volume vs target.

- **Forecast metrics**
  - Forecast submitted vs target.
  - Forecast accuracy vs actual.
  - AI forecast vs human forecast.

- **Conversation quality metrics**
  - Average call score.
  - Coverage of key topics/themes.

Custom metrics extend these using `custom_metrics.formula`, referencing base metrics and filters.

---

## 6. Date Range Behavior and Filters

### 6.1 Supported Date Ranges

Supported date ranges include:

- Rolling windows: `LAST_7_DAYS`, `LAST_30_DAYS`, `LAST_90_DAYS`.
- Calendar periods: `THIS_WEEK`, `THIS_MONTH`, `THIS_QUARTER`, `THIS_YEAR`.
- Custom ranges: arbitrary `startDate` / `endDate` chosen in the UI.

Accepted values are part of a small enum in both backend and frontend to keep behavior consistent.

### 6.2 Default Date Range

Each user has a default date range:

- Stored in `dashboard_configs.daterangedefault`.
- If not set, fallback default is `LAST_30_DAYS` for most dashboards.
- Admins may define tenant-wide default that can be overridden at the user-level.

### 6.3 Filter Persistence

Filters are modeled at two levels:

- **Dashboard-level filters**
  - Stored in `dashboard_configs.filtersdefault`.
  - Example filters: team, region, product line, pipeline stage.
- **Widget-level filters**
  - Stored in each widget config in layout JSON.
  - Used when a widget must be scoped differently than the rest of the dashboard.

On page load:

1. Backend loads `dashboard_configs`.
2. Applies default date range and filters.
3. Applies widget-specific filters on top of dashboard-level filters for each widget.

---

## 7. Functional Flows

### 7.1 Dashboard Load Flow

**API**: `GET /api/v1/coaching/dashboards`.

Steps:

1. **Auth & Tenant Resolution**
   - Validate user session and derive `tenantid` and `userid`.
2. **Load User Config**
   - Query `dashboards.dashboard_configs` for `(tenantid, userid)`.
   - If not found, generate default config and insert it.
3. **Resolve Widgets**
   - Parse layout / visible widgets from the config.
   - For each widget, translate config into a `MetricRequest` (metric type, date range, filters, dimensions).
4. **Fetch Metrics**
   - For each `MetricRequest`, check if an appropriate record exists in `dashboards.dashboard_snapshots` for the requested period and dimension.
   - If snapshot exists and is fresh, use snapshot.
   - Otherwise, query ClickHouse for the raw aggregations; if ClickHouse unavailable, fall back to PostgreSQL.
5. **Assemble Response**
   - For each widget, attach computed metric values, targets, and metadata.
   - Return a single dashboard object containing widgets, filters, and date range.

Latency targets:

- P95 dashboard load time: e.g., ≤ 1.5–2.0 seconds for standard tenants.
- P99 dashboard load time when fallback to PostgreSQL: acceptable degradation but should remain < 3–4 seconds where possible.

### 7.2 Widget Refresh Flow

Triggered when user changes:

- Date range.
- Filters (e.g., team).
- Widget-specific settings.

Options:

1. **Partial refresh**:
   - Client requests metrics only for the changed widget(s).
   - Endpoint may be a parameterized `GET /api/v1/coaching/dashboards?widgetId=...` or a dedicated `GET /api/v1/coaching/dashboards/widgets/{id}`.
2. **Full refresh**:
   - If date range changes at dashboard level, backend re-fetches metrics for all widgets.

Behavior:

- Reuse snapshot if the snapshot period still matches; otherwise recompute.
- Ensure idempotent behavior; no changes to configuration during refresh.

### 7.3 Saved Layout Update Flow

**API**: `PATCH /api/v1/coaching/dashboards/config`.

Steps:

1. **Auth**:
   - Validate user and tenant.
2. **Validation**:
   - Validate payload: layout structure, widgets, allowed widget types, existing metric references.
   - Enforce per-tenant limits (e.g., max widgets per dashboard).
3. **RBAC**:
   - Normal users can only modify their own layout.
   - Admin/RevOps roles may modify default templates (if implemented).
4. **Persist**:
   - Update `dashboard_configs.layout`, `visiblewidgets`, `daterangedefault`, and `filtersdefault` as per payload.
   - Update `updatedat`.
5. **Response**:
   - Return updated config.

---

## 8. Metric Loading and Aggregation

### 8.1 ClickHouse Tables and Events

The SAD defines that ClickHouse receives write-through streams from PostgreSQL for time-series and aggregation-heavy data.  
Key ClickHouse tables relevant to dashboards:

- `call_events` (from ingestion calls).
- `activity_events` (from revenue graph activities).
- `call_score_events` (from conversation intelligence call scores).
- `trackerdetectionevents` (from smart tracking).
- `forecast_submission_events` (from forecasting submissions).

Dashboards use these to compute metrics such as:

- Volume of calls / activities per period and per rep.
- Average call scores.
- Number of competitor mentions or key topic mentions.
- Forecast submissions over time and forecast accuracy.

### 8.2 PostgreSQL Fallback Behavior

If ClickHouse is unavailable (connection error, timeout, health check failure):

- The dashboard service performs equivalent aggregation queries on the underlying PostgreSQL tables (e.g., `revenuegraph.deals`, `revenuegraph.activities`, `conversationintelligence.callscores`, `forecasting.forecastsubmissions`).
- Fallback queries are tuned to:
  - Respect limits (e.g., max time range).
  - Use appropriate indexes.
- A Sentry (or similar) alert is generated to notify that dashboards are running in fallback mode.

Rule from SAD:

> ClickHouse is used for dashboards because it scales better for aggregations; if ClickHouse is unavailable, dashboards must still remain available via PostgreSQL fallback, with slower performance and alerts.

### 8.3 Snapshot Refresh Rules

Snapshots in `dashboard_snapshots` are refreshed following rules:

- **Scheduled refresh**
  - Cron-based job that recomputes key metrics daily and/or hourly depending on metric type.
- **Event-driven refresh (optional)**
  - For certain metrics, events like `forecast.submitted` or `call.summary.generated` can signal that relevant metrics should be recomputed for affected periods and dimensions.

Staleness strategy:

- Snapshots contain `computedat`.
- If a dashboard request asks for a period where snapshot `computedat` is older than a threshold (e.g., > 60 minutes for daily metrics), the service recomputes metrics and updates the snapshot.

---

## 9. API Contracts

### 9.1 GET `/api/v1/coaching/dashboards`

**Purpose**: Returns the current user’s Revenue Dashboard configuration and computed widgets.

**Auth**: Requires authenticated user; uses `tenantid` & `userid` from auth context.

**Query parameters** (examples):

- `range`: optional date range override (e.g., `LAST_30_DAYS`).
- `from`, `to`: for custom ranges (ISO dates).
- `widgetId`: optional; if provided, return only a subset (for partial widget refresh).

**Response shape** (logical):

```json
{
  "dateRange": {
    "mode": "LAST_30_DAYS",
    "from": "2026-04-01",
    "to": "2026-04-30"
  },
  "filters": {
    "teamIds": ["..."],
    "regions": ["APAC"],
    "segments": ["Enterprise"]
  },
  "widgets": [
    {
      "id": "kpi-total-revenue",
      "type": "KPI_CARD",
      "title": "Total Closed-Won Revenue",
      "metric": "TOTAL_REVENUE",
      "value": 1234567.89,
      "delta": 0.12,
      "target": 2000000,
      "meta": {
        "currency": "USD"
      }
    }
  ]
}
```

Error responses:

- `401` if unauthenticated.
- `403` if user lacks permission to view dashboards.
- `500` for unexpected errors (with proper logging and tracing).

### 9.2 PATCH `/api/v1/coaching/dashboards/config`

**Purpose**: Saves or updates the user’s dashboard layout and configuration.

**Auth**: Requires authenticated user.

**Payload** (logical example):

```json
{
  "dateRangeDefault": "LAST_30_DAYS",
  "filtersDefault": {
    "teamIds": ["..."],
    "regions": ["APAC"]
  },
  "layout": {
    "grid": {
      "columns": 12
    },
    "widgets": [
      {
        "id": "kpi-total-revenue",
        "type": "KPI_CARD",
        "metric": "TOTAL_REVENUE",
        "position": { "x": 0, "y": 0, "w": 3, "h": 2 }
      }
    ]
  },
  "visibleWidgets": ["kpi-total-revenue", "time-series-revenue"]
}
```

**Response**:

- Returns the updated configuration object (excluding computed metric values).

Validation rules:

- `visibleWidgets` must match widget IDs in `layout.widgets`.
- Widget types must be from the supported catalog.
- Metric identifiers must be valid built-in metrics or `custom_metrics.metricid` for that tenant.

---

## 10. Security and RBAC

### 10.1 Authentication and Multi-Tenancy

- All API calls are authenticated via the platform’s standard mechanism (e.g., Supabase Auth or equivalent).
- Every DB query includes `tenantid` in the WHERE clause, enforcing strict data isolation via RLS.
- No cross-tenant reads; multi-tenant isolation is mandatory.

### 10.2 Role-Based Access Control

Roles (illustrative):

- **Rep**:
  - Can view their own dashboard.
  - Can customize their layout and filters.
- **Manager**:
  - Can view dashboards aggregated for their team.
  - Can customize team-wide default dashboards (if enabled).
- **Admin / RevOps**:
  - Can define `custom_metrics`.
  - Can manage organization-level dashboard templates.

The service enforces RBAC in:

- `GET /api/v1/coaching/dashboards`: narrowing visibility to permitted users/teams.
- `PATCH /api/v1/coaching/dashboards/config`: preventing users from editing others’ layouts or global templates without proper roles.

---

## 11. Observability and Performance

### 11.1 Logging and Tracing

For every request:

- Log request ID, user ID, tenant ID, and main parameters (date range, widget count).
- Trace calls to:
  - ClickHouse query layer.
  - PostgreSQL fallback.
  - Snapshot refresh, if triggered.

Log levels:

- INFO for successful load and config update.
- WARN when falling back from ClickHouse to PostgreSQL.
- ERROR for failed queries or invalid configuration payloads.

### 11.2 Metrics and Alerts

Key metrics:

- Dashboard load latency (p50, p95, p99).
- Fallback rate from ClickHouse to PostgreSQL.
- Error rate per endpoint.
- Snapshot refresh job duration and failure count.

Alerts:

- High fallback rate (ClickHouse likely down).
- Persistent slow p95/p99 latencies.
- Snapshot job failures leading to stale data.

---

## 12. Performance Targets

Indicative targets (can be refined):

- `GET /api/v1/coaching/dashboards`:
  - p95 < 2 seconds under normal conditions.
  - p99 < 4 seconds during PostgreSQL fallback.
- Snapshot recomputation jobs:
  - Should not block main API, run in background queue with reasonable timeouts.
- Queries must support data volumes of **millions of events per tenant** over 12–24 months in ClickHouse.

---

## 13. Test Strategy

### 13.1 Unit Tests

- Widget resolution logic (config → metric requests).
- Date-range and filter merging (dashboard-level + widget-level).
- Custom metric formula evaluation.
- Snapshot staleness detection logic.

### 13.2 Integration Tests

- Full `GET /api/v1/coaching/dashboards` flow using seeded data for M-03, M-04, M-09 tables.
- `PATCH /api/v1/coaching/dashboards/config` with valid and invalid payloads.
- ClickHouse reads using test containers or a mocked query layer.
- PostgreSQL fallback path, ensuring:

  - Correct metrics.
  - Appropriate warnings/logging.

### 13.3 End-to-End / System Tests

- Scenario where data flows from capture to dashboards:
  - Calls are ingested, scored, and forecast submissions are recorded.
  - Revenue Graph and Forecasting modules populated.
  - Revenue Dashboard shows expected metrics for a given rep and manager.

- Failure scenarios:
  - ClickHouse unavailable; dashboards still load via PostgreSQL with slower performance, and an alert is generated.
  - Extremely large date ranges; ensure API enforces limits or warns.

---

## 14. Non-Functional Requirements

- **Availability**: Revenue dashboards must be **available even if ClickHouse is down**, using PostgreSQL fallback.
- **Scalability**: Use ClickHouse for heavy aggregations; avoid unbounded full scans in PostgreSQL for large tenants.
- **Security**: All data access tied to tenant and RBAC roles; no direct cross-schema joins that bypass owning module’s APIs except permitted exceptions documented in SAD.
- **Compliance**: All metrics derived from data that already respects opt-outs and compliance rules enforced upstream (e.g., Configure Compliance Settings). Data is not used for training shared models without explicit consent.

---

## 15. Open Questions and Future Enhancements

- Should we support multiple named dashboards per user (e.g., “My Pipeline”, “Manager View”) or keep a single configurable dashboard in v1?
- Do we support cross-module filters (e.g., filter by “play” from Orchestrate) now or later when M-08 is available?
- Should forecast accuracy metrics be computed purely from M-09 events or also consider external CRM signals?

Any changes that affect cross-module dependencies or shared data models must be reflected in the System Architecture Document and corresponding ADRs before being implemented.
