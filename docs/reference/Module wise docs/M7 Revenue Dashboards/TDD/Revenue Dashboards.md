# Technical Design Document (TDD): M7 Revenue Dashboards

## 1. Document Control

- **Document Title:** Technical Design Document — Revenue Dashboards
- **Feature Name:** Revenue Dashboards & Custom Performance Grid
- **Module Name:** M7 Revenue Dashboards
- **Workspace Directory:** `modules/m07-revenue-dashboards/`
- **Owner:** Product Engineering — M7
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales organizations operate with distinct dashboard preferences across individual contributors, managers, and RevOps executives. Frontline reps need direct views of personal activity quotas and deal stages; managers require aggregated pipeline coverage metrics; and RevOps executives require organization-wide performance analysis compared with historical objectives. Generating these multi-dimensional widgets on large deal databases often degrades core transactional database performance.

### What This Feature Does
M7 **Revenue Dashboards** provides highly configurable, fast-rendering grid workspaces. It enables users to select, organize, and customize widgets representing core KPIs (total closed won, win rates, sales velocity), activity volumes, and forecast trends. 
- To guarantee under 2-second dashboard load speeds, the system queries high-performance **ClickHouse Columnar Storage** as the primary query pathway.
- If ClickHouse is down, the system enters a degraded **PostgreSQL Failover Fallback** mode, dynamically restricting date range queries and throttling non-essential widgets to protect transactional database throughput.

---

## 3. Scope & Dependencies

### In Scope
- Storing and updating per-user, per-tenant widget configurations, coordinates, and filters.
- Generating precalculated dashboard snapshot caches.
- Evaluating built-in and user-defined metrics.
- Intercepting ClickHouse failures to redirect traffic to PostgreSQL.
- Throttling non-essential widget queries during database fallback.

### Out of Scope
- Direct CRM write integrations; stage updates must be requested through **M10 Data & Compliance**.
- AI revenue predictor calculations; those are computed and stored by **M6 Forecasting & Prediction**.
- Transcribing call recordings; that is owned by **M1 Capture & Transcription**.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m07-revenue-dashboards`.

### GET /api/v1/m07-revenue-dashboards
- **Description:** Retrieve the user's dashboard configuration and computed widgets.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`, `X-User-ID: <uuid>`
- **Response Payload (`200 OK`):**
  ```json
  {
    "dateRange": {
      "mode": "LAST_30_DAYS",
      "from": "2026-04-18",
      "to": "2026-05-18"
    },
    "filters": {
      "teamIds": ["uuid-1"],
      "regions": ["APAC"]
    },
    "widgets": [
      {
        "id": "kpi-total-revenue",
        "type": "KPI_CARD",
        "title": "Total Closed-Won Revenue",
        "metric": "TOTAL_REVENUE",
        "value": 1234567.89,
        "delta": 0.12,
        "target": 2000000.00,
        "meta": {
          "currency": "USD"
        }
      }
    ]
  }
  ```

### PATCH /api/v1/m07-revenue-dashboards/config
- **Description:** Save or update user layout defaults, active widgets list, and filters.
- **Request Payload:**
  ```json
  {
    "dateRangeDefault": "LAST_30_DAYS",
    "filtersDefault": {
      "teamIds": ["uuid-1"],
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
    "visibleWidgets": ["kpi-total-revenue"]
  }
  ```
- **Response Payload (`200 OK`):** Returns updated layout configuration (excluding calculated metric values).

---

## 5. Database Schema Design

All tables reside under the `m07_revenue_dashboards` PostgreSQL schema namespace.

```sql
-- Create Schema Namespace
CREATE SCHEMA IF NOT EXISTS m07_revenue_dashboards;

-- 1. Dashboard Layout Configurations Table
CREATE TABLE m07_revenue_dashboards.dashboard_configs (
  config_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  layout              JSONB NOT NULL DEFAULT '{}', -- Coordinate layout maps
  visible_widgets     JSONB NOT NULL DEFAULT '[]', -- Array of active widget IDs
  date_range_default  VARCHAR(50) NOT NULL DEFAULT 'LAST_30_DAYS',
  filters_default     JSONB NOT NULL DEFAULT '{}', -- Default region/team scopes
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tenant_user_config UNIQUE (tenant_id, user_id)
);

-- 2. Custom Metric Definitions Table
CREATE TABLE m07_revenue_dashboards.custom_metrics (
  metric_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  formula             JSONB NOT NULL DEFAULT '{}', -- Math definitions
  base_metric         VARCHAR(100) NOT NULL,
  static_filters      JSONB NOT NULL DEFAULT '{}',
  created_by          UUID NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dashboard Snapshots Cache Table
CREATE TABLE m07_revenue_dashboards.dashboard_snapshots (
  snapshot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  period_key          VARCHAR(100) NOT NULL, -- e.g., '2026-Q2'
  metric_name         VARCHAR(150) NOT NULL,
  dimension           JSONB NOT NULL DEFAULT '{}', -- Scoping identifiers
  value               NUMERIC(15,2) NOT NULL,
  computed_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & tenancy RLS
CREATE INDEX idx_dash_config_lookup ON m07_revenue_dashboards.dashboard_configs (tenant_id, user_id);
CREATE INDEX idx_dash_snapshots_lookup ON m07_revenue_dashboards.dashboard_snapshots (tenant_id, period_key, metric_name);
```

---

## 6. Functional & Governance Logic

### ClickHouse Columnar Querying (Normal Path)
Under standard operation, M7 routes analytical metric queries to ClickHouse. The dispatcher maps the target widgets to ClickHouse columnar events:
- **`activity_events` / `call_events`:** Used to compute call totals, email volumes, and rep performance.
- **`call_score_events`:** Used to calculate scorecard averages and theme tracking scores.
- **`deal_state_events`:** Used to aggregate pipeline progression funnels.

### PostgreSQL Fallback and Resource Protection Heuristics
If ClickHouse queries throw network failures or times out:
1. **Fallback Interceptor:** The service switches aggregation queries to PostgreSQL.
2. **Observability Dispatch:** M7 immediately dispatches a high-priority, sanitized alert to **Better Stack** notifying teams of degraded query modes.
3. **Guard Limit Enforcements:**
   - **Date Window Truncation:** If a user selects a date range greater than 90 days, the fallback dispatcher truncates the range to exactly **90 days** (`M07_FALLBACK_MAX_DATERANGE_DAYS`) to prevent massive table scans on the transactional database.
   - **Widget Throttling:** Non-essential widgets (such as call conversational theme distribution tables or advanced segmentation grids) are strictly **throttled and suspended**. The API returns a lightweight response with those widgets marked as `status: "suspended"`, reducing PostgreSQL load by up to 60%.

---

## 7. Security & Tenancy Isolation

- **Row-Level Security (RLS):** Enabled and forced on all tables.
- **Data Access Audits:** The API layer prevents cross-schema joins. M7 interacts with transactional tables (`m10_data_compliance.deals`) only through the PostgreSQL connection setting, strictly constrained by standard tenant ID session variables.
