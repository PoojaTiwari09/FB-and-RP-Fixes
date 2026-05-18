# Sequence Diagram — Save Dashboard Config (Layout + Filters)

This document shows what happens when a user updates their dashboard layout or default filters and the frontend calls `PATCH /api/v1/coaching/dashboards/config`.

## 1. Actors

- User browser / frontend app
- API Gateway (or BFF)
- M7 Dashboard Service
- PostgreSQL (dashboards schema)
- Auth / Identity provider (for context)

## 2. High-Level Description

When a user drags widgets, changes default filters, or updates their default date range:

1. Frontend sends a PATCH request with the new layout and defaults.
2. Gateway validates auth and forwards to M7 Dashboard Service with tenant and user context.
3. Service validates the payload (widget IDs, types, metrics, limits).
4. Service enforces RBAC (user can only edit their own config unless they have admin privileges).
5. Service updates the `dashboards.dashboard_configs` row for that `(tenantid, userid)`.
6. Service returns the updated configuration to the frontend.

## 3. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber

    participant U as User Browser (Frontend)
    participant G as API Gateway
    participant D as M7 Dashboard Service
    participant P as PostgreSQL (dashboards)

    Note over U: User rearranges widgets / changes filters

    U->>G: PATCH /api/v1/coaching/dashboards/config<br/>{ layout, visibleWidgets, dateRangeDefault, filtersDefault }
    G->>G: Validate auth & extract tenantId, userId, roles
    G->>D: PATCH /api/v1/coaching/dashboards/config<br/>X-Tenant-Id, X-User-Id, roles, payload

    Note over D: Validate payload & permissions

    D->>D: Validate layout JSON<br/>and widget definitions
    D->>D: Validate metric references<br/>(built-in or custom_metrics)
    D->>D: Check RBAC (rep vs manager vs admin)

    alt Invalid payload or forbidden
        D-->>G: 400/403 error<br/>{ error: ... }
        G-->>U: 400/403 error
    else Valid config and allowed
        Note over D: Upsert user config in dashboards.dashboard_configs

        D->>P: SELECT configid FROM dashboards.dashboard_configs<br/>WHERE tenantid = ? AND userid = ?
        alt Config exists
            P-->>D: configid
            D->>P: UPDATE dashboards.dashboard_configs<br/>SET layout = ?, visiblewidgets = ?,<br/>    daterangedefault = ?, filtersdefault = ?, updatedat = now()<br/>WHERE configid = ?
        else No config yet
            P-->>D: no row
            D->>P: INSERT INTO dashboards.dashboard_configs<br/>(tenantid, userid, layout, visiblewidgets,<br/> daterangedefault, filtersdefault, createdat, updatedat)<br/>VALUES (...)
        end
        P-->>D: write success

        D-->>G: 200 OK<br/>{ updatedConfig }
        G-->>U: 200 OK<br/>updated config JSON

        Note over U: Persist new layout in UI state
    end
```

## 4. Key Notes for Engineers

- This flow modifies only **configuration**, not metrics or snapshots.
- All writes are scoped by `tenantid` and `userid`; RLS ensures isolation.
- RBAC should prevent a normal user from editing another user’s config or global templates.
- Validation should enforce:
  - Known widget types.
  - Valid metric identifiers.
  - Reasonable limits (e.g., max widgets per dashboard).