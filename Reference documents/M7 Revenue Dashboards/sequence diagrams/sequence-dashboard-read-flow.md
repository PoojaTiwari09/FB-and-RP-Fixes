# Sequence Diagram — Dashboard Read Flow

This document details the API execution sequence when a client requests active revenue performance dashboards and metrics.

## 1. Document Control

- **Document Title:** Sequence Diagram — Dashboard Read Flow
- **Feature Name:** Dashboard Read Flow
- **Module Name:** M7 Revenue Dashboards
- **Workspace Directory:** `modules/m07-revenue-dashboards/`
- **Owner:** Product Engineering — M7
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Actors & Components

- **User Browser (Frontend):** Renders dashboard layouts and widgets.
- **API Gateway:** Validates access tokens and passes standard headers.
- **M7 Dashboard Service:** NestJS backend service residing at `modules/m07-revenue-dashboards/`.
- **PostgreSQL:** Transactional database (using namespace schema `m07_revenue_dashboards`).
- **ClickHouse:** Columnar database (primary analytics engine).

---

## 3. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber

    participant U as User Browser (Frontend)
    participant G as API Gateway
    participant D as M7 Dashboard Service
    participant P as PostgreSQL (m07_revenue_dashboards)
    participant C as ClickHouse (Analytics)

    Note over U: User opens Revenue Dashboard page
    U->>G: GET /api/v1/m07-revenue-dashboards (JWT Token)
    G->>G: Validate Supabase JWT token context
    G->>D: GET /api/v1/m07-revenue-dashboards<br/>Headers: X-Tenant-Id, X-User-Id

    Note over D: Load User Layout Configuration
    D->>P: SELECT * FROM m07_revenue_dashboards.dashboard_configs<br/>WHERE tenant_id = ? AND user_id = ?
    
    alt Configuration Profile Exists
        P-->>D: Return dashboard_configs row
    else Profile Missing
        P-->>D: Return empty set
        D->>P: INSERT default layout profile into dashboard_configs
        P-->>D: Return insertion success
    end

    Note over D: Build Widget Metric Requests
    D->>D: Parse layout JSON coordinates<br/>Apply default date ranges & active filters

    Note over D: Query Cache Layer (Dashboard Snapshots)
    D->>P: SELECT * FROM m07_revenue_dashboards.dashboard_snapshots<br/>WHERE tenant_id = ? AND period_key = ? AND metric_name IN (...)
    P-->>D: Return snapshots list (may be empty or stale)

    alt Snapshots Fresh & Complete
        D->>D: Map pre-computed snapshot values directly to widgets
    else Snapshots Missing or Stale
        Note over D: Query Analytics Store (ClickHouse)
        D->>C: Execute columnar aggregations<br/>(revenue, activity counts, win rates)
        C-->>D: Return aggregated analytics results
        
        Note over D: Update Snapshot Cache (Async Background Task)
        D->>P: UPSERT INTO m07_revenue_dashboards.dashboard_snapshots<br/>(tenant_id, period_key, metric_name, value, computed_at)
        P-->>D: Return cache upsert success
    end

    Note over D: Assemble Dashboard Widget Metrics
    D-->>G: 200 OK<br/>{ dateRange, filters, widgets[] with computed values }
    G-->>U: 200 OK<br/>Return Dashboard JSON
    Note over U: Render widget grids on interface
```

---

## 4. Key Notes for Engineers

1. **Gateway Auth Propagation:** The API gateway must intercept the incoming Authorization JWT, verify the signature, and append the `X-Tenant-Id` and `X-User-Id` headers before forwarding the request to the M7 service.
2. **Snapshot Cache Expiry:** In Step 61, snapshot freshness is computed by checking if the current time minus the `computed_at` timestamp is less than `M07_SNAPSHOT_STALENESS_THRESHOLD_MINUTES` (defaults to 60 minutes).
3. **Optimistic UI:** If ClickHouse triggers a cache recalculation, the write-path to `dashboard_snapshots` is processed as an asynchronous task, preventing write operations from blocking the client's HTTP response.