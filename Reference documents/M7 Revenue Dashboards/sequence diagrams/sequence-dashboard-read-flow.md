# Sequence Diagram — Dashboard Read Flow

This document shows what happens when a user opens the Revenue Dashboard page and the frontend calls `GET /api/v1/coaching/dashboards`.

## 1. Actors

- User browser / frontend app
- API Gateway (or BFF)
- M7 Dashboard Service (Coaching & Training service)
- PostgreSQL (dashboards schema and upstream schemas)
- ClickHouse (analytics store)
- Auth / Identity provider (for context only)

## 2. High-Level Description

When the dashboard page loads:

1. The frontend calls the dashboards API with the user’s auth token.
2. The gateway validates auth and forwards to the M7 Dashboard Service.
3. The service loads user config (layout, filters, date range) from PostgreSQL.
4. The service resolves widgets and decides which metrics to compute.
5. For each metric, it first tries to read from cached snapshots; if not fresh, it queries ClickHouse.
6. If ClickHouse is healthy, results come from ClickHouse; otherwise it falls back to PostgreSQL (see separate fallback diagram).
7. The service returns a dashboard response to the frontend.

## 3. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber

    participant U as User Browser (Frontend)
    participant G as API Gateway
    participant D as M7 Dashboard Service
    participant P as PostgreSQL (dashboards + core)
    participant C as ClickHouse (analytics)

    Note over U: User opens Revenue Dashboard page

    U->>G: GET /api/v1/coaching/dashboards (JWT)
    G->>G: Validate auth & extract tenantId, userId
    G->>D: GET /api/v1/coaching/dashboards<br/>X-Tenant-Id, X-User-Id

    Note over D: Load user dashboard config

    D->>P: SELECT * FROM dashboards.dashboard_configs<br/>WHERE tenantid = ? AND userid = ?
    alt Config exists
        P-->>D: dashboard_configs row
    else No config
        P-->>D: no rows
        D->>P: INSERT default dashboard_configs for user
        P-->>D: inserted default config
    end

    Note over D: Build widget list & metric requests

    D->>D: Resolve widgets from layout JSON<br/>+ default date range & filters

    Note over D: Load metric snapshots (if available)

    D->>P: SELECT * FROM dashboards.dashboard_snapshots<br/>WHERE tenantid = ? AND period = ? AND metricname IN (...)
    P-->>D: snapshot rows (may be empty or stale)

    alt Snapshots fresh and complete
        D->>D: Use snapshot values<br/>for widgets
    else Missing or stale snapshots
        Note over D: Query analytics store (ClickHouse)

        D->>C: Aggregation queries for metrics<br/>(revenue, win rate, activity, forecast, etc.)
        C-->>D: Aggregated metric results

        D->>D: Optionally update dashboard_snapshots<br/>with fresh values
        D->>P: UPSERT dashboards.dashboard_snapshots
        P-->>D: upsert success
    end

    Note over D: Assemble final dashboard response

    D-->>G: 200 OK<br/>{ dateRange, filters, widgets[] with metric values }
    G-->>U: 200 OK<br/>Dashboard JSON

    Note over U: Render dashboard widgets on screen
```

## 4. Key Notes for Engineers

- Frontend never talks directly to ClickHouse or PostgreSQL; only to the dashboards API.
- Dashboard config is **per-tenant, per-user**, backed by `dashboards.dashboard_configs`.
- Snapshots (`dashboards.dashboard_snapshots`) are used to speed up repeated dashboard loads.
- ClickHouse is preferred for heavy aggregations; PostgreSQL is only used as a fallback or to store configuration and snapshots.