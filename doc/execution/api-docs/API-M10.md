# M10 — Data & Compliance API

| | Value |
|--|--------|
| **Web** | http://localhost:5178 |
| **API** | http://localhost:4011 |
| **Base path** | `/api/v1/m10-data-compliance` |
| **pnpm** | `dev:m10-api`, `dev:m10-web` |

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `VITE_M10_STANDALONE=true` | Standalone Vite |
| `VITE_M10_API_URL` | `http://localhost:4011` or proxy |
| `NEXT_PUBLIC_M10_API_URL` | Next.js |
| `VITE_TENANT_ID`, `VITE_USER_ID` | `x-tenant-id`, `x-user-id` |

**Clients**

| File | Feature |
|------|---------|
| `api/revenue-graph.api.ts` | Revenue Graph (accounts, deals, contacts, CRM sync) |
| `api/data-cloud.api.ts` | Data Cloud exports |

**Prefix:** `m10ApiPrefix()` → `{host}/api/v1/m10-data-compliance`

---

## Revenue Graph — frontend ↔ backend

| Frontend function | Method | Backend path |
|-------------------|--------|--------------|
| `fetchAccounts(params)` | GET | `/accounts?page=&limit=&search=` |
| `fetchAccountById(id)` | GET | `/accounts/:id` |
| `fetchDeals(params)` | GET | `/deals?accountId=&isActive=&stage=` |
| `fetchDealById(id)` | GET | `/deals/:id` |
| `fetchDealRelationship(id)` | GET | `/deals/:id/relationship` |
| `fetchContactById(id)` | GET | `/contacts/:id` |
| `fetchCrmSyncStatus()` | GET | `/crm-sync-status` |
| `triggerCrmSync(body)` | POST | `/crm-sync` |

**Headers:** `m10DefaultHeaders()` — `x-tenant-id`, `x-user-id`, `Content-Type: application/json`; optional `Authorization: Bearer`.

**Fallback:** Clients return **mock data** if API unreachable (local dev).

---

## Data Cloud — frontend ↔ backend

| Frontend function | Method | Backend path |
|-------------------|--------|--------------|
| `fetchConnections()` | GET | `/exports/connections` |
| `registerConnection(body)` | POST | `/exports/connections` |
| `testConnection(id)` | POST | `/exports/connections/:id/test` |
| `fetchExportRuns(connectionId?)` | GET | `/exports/runs?connectionId=` |
| `triggerReplay(body)` | POST | `/exports/replay` |

Download: `GET /exports/runs/:runId/download` (backend; wire in UI when implemented).

---

## Test / dev

| Method | Path |
|--------|------|
| GET | `/api/v1/m10-data-compliance/test/health` |
| POST | `/api/v1/m10-data-compliance/test/smoke` |
| GET | `/api/v1/m10-data-compliance/test/accounts` |
| POST | `/api/v1/m10-data-compliance/test/seed` |

---

## UI views

| Web URL | APIs |
|---------|------|
| `http://localhost:5178/` | Revenue Graph (default) |
| `http://localhost:5178/?view=data-cloud` | Data Cloud exports |

---

## Legacy prefix

Some controllers also register under `/api/v1/data-compliance` — prefer **`/api/v1/m10-data-compliance`** for new frontend work.

---

## Full route list

[BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) → `m10-data-compliance`.
