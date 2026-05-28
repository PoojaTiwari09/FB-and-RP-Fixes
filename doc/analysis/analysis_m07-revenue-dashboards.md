# Module Analysis — `m07-revenue-dashboards`

> Order #9 in the lifecycle (per your chart): "Displays revenue dashboards and performance metrics". Depends on M06 (`forecast.submitted`) + M02 (`call.scored`).

---

## 1. Purpose

The OLAP-style dashboard layer:

* **Dataset Builder** — model raw sources (Calls, Deals, CRM) into reusable datasets.
* **Dashboard Builder** — drop widgets onto a grid, configure metrics, filters, snapshots.
* **Sharing** — public share tokens with visibility (PRIVATE / TEAM / LINK).

Maps to TDDs:

* `M7 Revenue Dashboards/TDD/Revenue Dashboards.md`
* `M7 Revenue Dashboards/sequence diagrams/sequence-dashboard-read-flow.md`
* `M7 Revenue Dashboards/sequence diagrams/sequence-save-dashboard-config.md`
* `M7 Revenue Dashboards/sequence diagrams/sequence-clickhouse-fallback.md`

---

## 2. Layout

```
modules/m07-revenue-dashboards/
├── m07-revenue-dashboards.module.ts
├── prisma/schema.prisma
├── controllers/m07.controller.ts        (single umbrella controller)
├── services/m07.service.ts, prisma.service.ts
├── repositories/m07.repository.ts
└── seeds/, schemas/, interfaces/, events/, database/, migrations/
```

---

## 3. Frontend

`apps/web/src/modules/m07-revenue-dashboards/`:

* `components/kpi-card.tsx` (already consumed by `apps/web/src/app/page.tsx`).
* Other charts (Bar, Line, Pie, Funnel, Area, Column, Donut, Gauge, Table, Performance, Attainment trend, Forecast, Trends, Changes) — see `WidgetType` enum in `packages/database/prisma/schema.prisma`.

⚠ **Top-level routes `/datasets` and `/dashboards` referenced by `apps/web/src/app/page.tsx` do not exist** — see `implementation_changes.md` §F1.

---

## 4. API surface

Base path: `/api/v1/revenue-dashboards`.

| Method | Path |
| ------ | ---- |
| GET    | `/datasets`, `/datasets/:id` |
| POST   | `/datasets` (with `selectedObjects`, `selectedFields`, `mappingStatus`) |
| PATCH  | `/datasets/:id` |
| POST   | `/datasets/:id/relationships` (DatasetRelationship) |
| GET    | `/dashboards`, `/dashboards/:id` |
| POST   | `/dashboards`, `PATCH /dashboards/:id` |
| POST   | `/dashboards/:id/widgets`, `PATCH /widgets/:id`, `DELETE /widgets/:id` |
| POST   | `/dashboards/:id/snapshots` (cache the current values) |
| POST   | `/dashboards/:id/share` (generates `shareToken`) |
| GET    | `/widget-catalog` (read `WidgetCatalog`) |

---

## 5. Database (unified schema mapping)

| Unified model | Notes |
| ------------- | ----- |
| `Dashboards` (M07-specific) | grid + widgets + share token (also defined as `Dashboard` in `packages/database`). |
| `DashboardSnapshots` | precomputed metric cache (per period × metric × dimension). |
| `DashboardConfigs` / `dashboardconfigs` | user-specific layout (camelCase mapped model + a stray lowercase model — pick one in §B2). |
| `Widgets` | KPI/BAR/LINE/PIE/etc. + position. |
| `WidgetCatalog` | catalog of available widget types (seedable). |
| `Datasets`, `DatasetObject`, `DatasetField`, `DatasetRelationship` | dataset builder primitives. |
| `DataSource`, `data_source_objects`, `data_source_fields`, `data_source_relationships` | CRM / Calls / Conversations source connectors. |
| `DashboardAccess` | dashboard-level sharing (canView/canEdit). |
| `UserDashboardPreferences` | star/pin per user. |

---

## 6. Events

| Direction | Event |
| --------- | ----- |
| IN  | `forecast.submitted` (M06) → refresh snapshots |
| IN  | `call.scored` (M02) → recompute call-volume widgets |
| OUT | `dashboard.published` |

---

## 7. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | `DashboardConfig` (camelCase + mapped) vs `dashboardconfigs` (lowercase) — two near-identical models in `packages/database/prisma/schema.prisma`. Pick one and delete the other before unification. |
| MEDIUM | ClickHouse fallback described in TDD but no actual ClickHouse client in code. Either delete the fallback doc or add it. |
| MEDIUM | `WidgetType` enum is in `packages/database/prisma/schema.prisma` only — duplicate in unified schema as enum (currently a `String?`). |
| LOW | Single `m07.controller.ts` for everything → eventually split into `datasets.controller.ts`, `dashboards.controller.ts`, `widgets.controller.ts`. |

---

## 8. Smoke checklist

* `GET /api/v1/revenue-dashboards/widget-catalog` returns seeded entries (or `[]` if not seeded).
* `POST /api/v1/revenue-dashboards/datasets` returns 201.
* `POST /api/v1/revenue-dashboards/dashboards` returns 201 with `status: 'DRAFT'`.
* `POST /api/v1/revenue-dashboards/dashboards/:id/widgets` returns 201.
* `POST /api/v1/revenue-dashboards/dashboards/:id/share` returns `{ shareToken }`.
* Landing page (`/`) loads `KpiCard` widgets without errors.
