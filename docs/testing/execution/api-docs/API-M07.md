# M07 — Revenue Dashboards API

| | Value |
|--|--------|
| **Web** | http://localhost:5180 |
| **Nest API** | http://localhost:4013 |
| **Nest base** | `/api/v1/revenue-dashboards` |
| **pnpm** | `dev:m07-api`, `dev:m07-web` |

---

## Important: two API layers

M07 uses **both**:

1. **Next.js BFF routes** on the **web port** (`/api/...`) — what the browser calls today  
2. **NestJS `m07-api`** on **4013** — canonical module API (widgets, workspaces, test)

Many BFF handlers use **Prisma directly** in `apps/web/src/modules/m07-revenue-dashboards/api/**/route.ts`, not HTTP proxy to 4013.

```text
Browser  →  http://localhost:5180/api/dashboards  →  Next route (Prisma)
Optional →  http://localhost:4013/api/v1/revenue-dashboards/...  →  Nest M07 module
```

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Often `http://localhost:4013/api/v1` (Nest) |
| `VITE_M07_WEB_URL` | Cross-links from M05 |

**UI clients:** `dashboard-client.tsx`, `dataset-builder-client.tsx` — `fetch('/api/...')` relative to web origin.

---

## Frontend ↔ BFF mapping (browser → `localhost:5180`)

| Frontend `fetch` | Methods | BFF path (Next.js) | Implementation |
|------------------|---------|-------------------|----------------|
| List/save dashboards | GET, POST, DELETE | `/api/dashboards` | `api/dashboards/route.ts` (Prisma) |
| Dashboard metrics | GET, POST | `/api/dashboards/metrics` | `api/dashboards/metrics/route.ts` |
| Dashboard share | GET, POST | `/api/dashboards/share` | `api/dashboards/share/route.ts` |
| Dashboard access | GET, POST, DELETE | `/api/dashboards/access` | `api/dashboards/access/route.ts` |
| Drilldown | GET | `/api/dashboards/drilldown` | `api/dashboards/drilldown/route.ts` |
| Analytics | GET | `/api/dashboards/analytics` | `api/dashboards/analytics/route.ts` |
| Datasets CRUD | GET, POST, DELETE | `/api/datasets` | `api/datasets/route.ts` |
| Dataset preview | GET | `/api/datasets/preview` | `api/datasets/preview/route.ts` |
| Dataset data | GET | `/api/datasets/data` | `api/datasets/data/route.ts` |
| Teams | GET, POST, DELETE | `/api/teams` | `api/teams/route.ts` |
| HubSpot OAuth/sync | GET, POST, DELETE | `/api/hubspot`, `/api/hubspot/sync`, `/api/hubspot/authorize`, … | `api/hubspot/**` |
| Executive metrics | GET | `/api/executive/metrics` | `api/executive/metrics/route.ts` |
| Deal score | POST | `/api/deals/score` | `api/deals/score/route.ts` |
| Seed | POST | `/api/seed` | `api/seed/route.ts` |

**Query params (examples):** `source`, `datasetId`, `timeRange`, `customer`, `team`, `dashboardId`, `page`, `limit`.

---

## Nest API (`m07-api` — port 4013)

Use when wiring frontend directly to Nest instead of BFF.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/revenue-dashboards/test/health` | Health |
| POST | `/api/v1/revenue-dashboards/test/smoke` | Smoke |
| GET/POST | `/api/v1/revenue-dashboards/dashboards` | Dashboard CRUD |
| GET | `/api/v1/revenue-dashboards/widgets/catalog` | Widget catalog |
| GET | `/api/v1/revenue-dashboards/dashboards/templates` | Templates |
| POST | `/api/v1/revenue-dashboards/datasets` | Create dataset |
| GET | `/api/v1/revenue-dashboards/datasets` | List datasets |
| GET | `/api/v1/revenue-dashboards/datasets/preview` | Preview |
| POST | `/api/v1/revenue-dashboards/workspaces/query` | Widget query |
| … | … | See [BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) |

---

## Headers (BFF / Nest)

BFF `dashboards/route.ts` resolves user from:

- `x-user-id`, `x-tenant-id` headers, or body/query, or defaults:
  - tenant `11111111-1111-1111-1111-111111111111`
  - user `22222222-2222-2222-2222-222222222222`

---

## Full Nest route list

[BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) → `m07-revenue-dashboards`.
