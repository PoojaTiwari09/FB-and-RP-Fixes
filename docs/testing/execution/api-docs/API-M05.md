# M05 — Account Intelligence API

| | Value |
|--|--------|
| **Web** | http://localhost:5179 |
| **API** | http://localhost:4012 |
| **Base path** | `/api/v1/account-intelligence` |
| **pnpm** | `dev:m05-api`, `dev:m05-web` |
| **Demo board** | http://localhost:5179/board/demo |

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `VITE_M05_STANDALONE=true` | Standalone Vite |
| `VITE_M05_API_URL` | `http://localhost:4012` or empty + proxy |
| `NEXT_PUBLIC_M05_API_URL` | Next.js board pages |
| `VITE_AI_URL` | AI summary service (often port 8000) |
| `VITE_M07_WEB_URL`, `VITE_M10_WEB_URL` | Cross-module nav |

**Client:** `apps/web/src/modules/m05-account-intelligence/lib/api.ts`  
**Prefix:** `m05ApiPrefix()` → `{host}/api/v1/account-intelligence`

---

## Frontend ↔ backend mapping (`api.ts`)

### Boards

| Frontend function | Method | Backend path |
|-------------------|--------|--------------|
| `fetchBoards()` | GET | `.../boards` |
| `fetchBoard(slug)` | GET | `.../boards/:slug` |
| `fetchTeam()` | GET | `.../boards/team` |
| `fetchPermissions(role)` | GET | `.../boards/permissions/:role` |
| `createBoard` / `updateBoard` / `duplicateBoard` / `deleteBoard` | POST/PUT/POST/DELETE | `.../boards`, `.../boards/:slug`, etc. |
| `addColumn` / `updateColumn` / `deleteColumn` | POST/PUT/DELETE | `.../boards/:slug/columns[...]` |
| `updateBriefConfig` | PATCH | `.../boards/:slug/brief-config` |

### Accounts

| Frontend function | Method | Backend path |
|-------------------|--------|--------------|
| `fetchAccounts({ board_slug, tab_id, ... })` | GET | `.../accounts?board_slug=&tab_id=&...` |
| `fetchAccountDetail(hubspotId)` | GET | `.../accounts/:hubspotId` |

Query params: `board_slug`, `tab_id`, `rep_id`, `period`, `sort_field`, `sort_dir`, `page`, `page_size`.

### Activities

| `fetchActivities(companyHubspotId, ...)` | GET | `.../activities/:companyHubspotId` |

### Edits

| `editCompany` | PATCH | `.../edits/company/:hubspotId` |
| `editDeal` | PATCH | `.../edits/deal/:dealId` |
| `editSupplementary` | PATCH | `.../edits/supplementary/:companyHubspotId` |

### Todos

| `fetchTodos` / `createTodo` / `updateTodo` / `deleteTodo` | GET/POST/PATCH/DELETE | `.../todos/:companyHubspotId`, `.../todos/:todoId` |

### AI

| `generateSummary(...)` | POST | `.../ai/summary` |
| `askAI(...)` | POST | `.../ai/chat` |
| AI health | GET | `.../ai/health` |

### HubSpot sync

| `triggerSync(role)` | POST | `.../sync/trigger` |
| `fetchSyncStatus()` | GET | `.../sync/status` |

---

## Test / verification (dev)

| Method | Path |
|--------|------|
| GET | `/api/v1/account-intelligence/test/health` |
| GET | `/api/v1/account-intelligence/test/verification` |
| POST | `/api/v1/account-intelligence/test/seed` |
| POST | `/api/v1/account-intelligence/test/smoke` |

See [../standalone/M05-VERIFICATION.md](../standalone/M05-VERIFICATION.md).

---

## Webhook

| Method | Path |
|--------|------|
| POST | `/api/v1/account-intelligence/webhooks/hubspot` |

---

## Full route list

[BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) → `m05-account-intelligence`.
