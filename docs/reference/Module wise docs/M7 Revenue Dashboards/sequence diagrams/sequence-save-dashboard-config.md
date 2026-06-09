# Sequence Diagram — Save Dashboard Config (Layout + Filters)

This document shows what happens when a user updates their dashboard layout grid positions, default filters, or date range presets.

## 1. Document Control

- **Document Title:** Sequence Diagram — Save Dashboard Layout Config
- **Feature Name:** Save Dashboard Layout Configuration
- **Module Name:** M7 Revenue Dashboards
- **Workspace Directory:** `modules/m07-revenue-dashboards/`
- **Owner:** Product Engineering — M7
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Actors & Components

- **User Browser (Frontend):** Sends drag-and-drop coordinate changes and configuration updates.
- **API Gateway:** Passes token claims and request headers.
- **M7 Dashboard Service:** NestJS backend service residing at `modules/m07-revenue-dashboards/`.
- **PostgreSQL:** Transactional database (using namespace schema `m07_revenue_dashboards`).

---

## 3. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber

    participant U as User Browser (Frontend)
    participant G as API Gateway
    participant D as M7 Dashboard Service
    participant P as PostgreSQL (m07_revenue_dashboards)

    Note over U: User drags grid widgets or edits filters
    U->>G: PATCH /api/v1/m07-revenue-dashboards/config<br/>{ layout, visibleWidgets, dateRangeDefault, filtersDefault }
    G->>G: Validate JWT access token & extract claims
    G->>D: PATCH /api/v1/m07-revenue-dashboards/config<br/>Headers: X-Tenant-Id, X-User-Id, X-User-Roles, Payload

    Note over D: Validate Payload Boundaries & RBAC
    D->>D: Parse & validate grid coordinates schema via Zod
    D->>D: Check metric references (built-in or custom_metrics ID)
    D->>D: Enforce RBAC access policies (Rep vs Manager vs Admin)

    alt Invalid Payload or Forbidden Role Context
        D-->>G: 400 Bad Request / 403 Forbidden
        G-->>U: Return Error Response (Redacted logs)
    else Payload Valid & Authorized
        Note over D: Persist Configuration in PostgreSQL
        D->>P: SELECT config_id FROM m07_revenue_dashboards.dashboard_configs<br/>WHERE tenant_id = ? AND user_id = ?
        
        alt Layout Row Exists
            P-->>D: Return config_id
            D->>P: UPDATE m07_revenue_dashboards.dashboard_configs<br/>SET layout = ?, visible_widgets = ?,<br/>    date_range_default = ?, filters_default = ?, updated_at = NOW()<br/>WHERE config_id = ?
        else No Row Exists
            P-->>D: Return empty set
            D->>P: INSERT INTO m07_revenue_dashboards.dashboard_configs<br/>(tenant_id, user_id, layout, visible_widgets, date_range_default, filters_default)<br/>VALUES (...)
        end
        P-->>D: Return transaction commit success

        D-->>G: 200 OK<br/>{ updatedConfig }
        G-->>U: 200 OK<br/>Return updated layout JSON
        Note over U: Store layout state in local UI context
    end
```

---

## 4. Key Notes for Engineers

1. **Validation Checks (Zod DTOs):** The layout update payload must carry valid grid coordinate properties (`x`, `y`, `w`, `h` as integers). An invalid grid width or coordinate will throw a `400 Bad Request` before database queries are formulated.
2. **Access Control Safeguards:** Normal sales representatives are strictly forbidden from writing or altering organizational or team-shared template presets. Admins and RevOps are the exclusive writers of shared dashboard configurations.
3. **Idempotent Write Operations:** The service wraps the PostgreSQL SELECT and UPDATE/INSERT steps into a single database transaction, ensuring RLS checks are locked during execution.