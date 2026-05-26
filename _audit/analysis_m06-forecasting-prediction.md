# Module Analysis — `m06-forecasting-prediction`

> Order #8 in the lifecycle (per your chart): "Predicts revenue, builds forecast boards, calculates pipeline coverage". Depends on M04 (`deal.stage.changed`) + M08 (`deal.stage.changed`).

---

## 1. Purpose

Two product surfaces:

1. **Forecast Boards** — manual/managed forecast submissions per rep / per team / per period.
2. **AI Revenue Predictor** — model-based forecast generated from pipeline + activity signals.

Maps to TDDs:

* `M6 Forecasting & Prediction/TDD/TDD-Forecast Boards.md`
* `M6 Forecasting & Prediction/TDD/TDD-AI Revenue Predictor.md`
* `M6 Forecasting & Prediction/M6-drift-analysis.md`

---

## 2. Layout

```
modules/m06-forecasting-prediction/
├── m06-forecasting-prediction.module.ts
├── prisma/schema.prisma
├── controllers/
│   ├── m06.controller.ts           default CRUD
│   ├── executive.controller.ts     executive dashboard (region/segment rollups)
│   └── hubspot.controller.ts       sync + pipeline refresh
├── services/
│   ├── m06.service.ts
│   ├── hubspot.service.ts
│   └── prisma.service.ts
├── repositories/m06.repository.ts
└── seeds/, schemas/, events/, database/, migrations/, interfaces/
```

---

## 3. Frontend

`apps/web/src/modules/m06-forecasting-prediction/`:

* `components/` — Forecast Board grid, Pipeline Coverage card, Variance chart, Executive view.

Top-level Next route: `apps/web/src/app/forecasting/page.tsx`.

---

## 4. API surface

Base path: `/api/v1/forecasting`.

| Method | Path |
| ------ | ---- |
| GET    | `/` | (`m06` controller default) |
| GET    | `/forecasts` | list submitted forecasts |
| POST   | `/forecasts` | submit/commit a forecast (CT-FORECAST.001) |
| GET    | `/forecasts/:id` |
| POST   | `/forecasts/:id/lock` | lock for the period |
| GET    | `/executive/snapshot?period=2026Q2` | rolled-up executive view |
| POST   | `/executive/refresh` | recompute snapshot |
| POST   | `/hubspot/sync` | pull pipeline from HubSpot |
| GET    | `/predictions` | AI-driven forecasts (`AiForecastSnapshots`) |

---

## 5. Database (unified schema mapping)

| Unified model | Notes |
| ------------- | ----- |
| `Forecasts` | submitted forecasts |
| `ForecastBoards` | board config (period, team, currency) |
| `AiForecastSnapshots` | AI-predicted figures. ⚠ Carries duplicate columns (camelCase + lowercase). See §B2. |
| `Deals` | source of truth for pipeline |
| `Periods` (if defined) | quarter/month definitions |

---

## 6. Events

| Direction | Event |
| --------- | ----- |
| IN  | `deal.stage.changed` (M04, M08) |
| IN  | `account.health.updated` (M05) |
| OUT | `forecast.submitted` |
| OUT | `forecast.locked` |

---

## 7. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | `AiForecastSnapshots` has duplicate columns — see §B2 of `implementation_changes.md`. |
| MEDIUM | No worker module — AI predictor lives in the request path. Long predictions should move to a queue. |
| MEDIUM | `hubspot.service.ts` overlaps with M04 + M05 HubSpot logic. Consolidate in a shared `HubSpotClientService`. |
| LOW | Executive dashboard data hits Prisma directly; should consume `forecast.submitted` events to materialize the snapshot. |

---

## 8. Smoke checklist

* `GET /api/v1/forecasting/forecasts` returns `[]`.
* `POST /api/v1/forecasting/forecasts` with `{ period:'2026Q2', amount: 1000000 }` returns 201.
* `GET /api/v1/forecasting/predictions` returns `[]` until a sync runs.
* `POST /api/v1/forecasting/hubspot/sync` returns 202 with `HUBSPOT_*` env present.
* `GET /api/v1/forecasting/executive/snapshot?period=2026Q2` returns aggregated payload.
