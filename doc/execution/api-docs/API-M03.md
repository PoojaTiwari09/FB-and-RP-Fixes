# M03 — AI Summaries & GenAI API

| | Value |
|--|--------|
| **Web** | http://localhost:5177 |
| **API** | http://localhost:4010 |
| **Base path** | `/api/v1/ai-summaries-genai` |
| **pnpm** | `dev:m03-api`, `dev:m03-web` |

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `VITE_M03_STANDALONE=true` | Standalone Vite app |
| `VITE_M03_API_URL` | Empty → relative `/api/v1/ai-summaries-genai` (proxied) |
| `VITE_M03_API_PROXY` | Vite proxy target `http://localhost:4010` |
| `VITE_TENANT_ID` → `X-Org-Id` | Org/tenant |
| `VITE_USER_ID` → `X-User-Id` | User |
| `X-Role`, `X-Team-Id` | Set in `m03Api.js` defaults |

**Client:** `apps/web/src/modules/m03-ai-summaries-genai/src/api/m03Api.js`

**Legacy brief paths (some UI):** `/api/ai-summaries/:briefType-brief/:entityId` — also registered on backend as `/api/ai-summaries/...`

---

## Frontend ↔ backend mapping (`m03Api.js`)

| Frontend function | Method | Backend path |
|-------------------|--------|--------------|
| `fetchWorkspace()` | GET | `/api/v1/ai-summaries-genai/workspace` |
| `fetchChatHistory()` | GET | `/api/v1/ai-summaries-genai/workspace/chat-history` |
| `saveChatMessage(...)` | POST | `/api/v1/ai-summaries-genai/workspace/chat-history` |
| `deleteChatMessage(id)` | DELETE | `/api/v1/ai-summaries-genai/workspace/chat-history/:id` |
| `getBrief(type, entityId)` | GET | `/api/v1/ai-summaries-genai/briefs/:briefType/:entityId` |
| `generateBrief(type, entityId)` | POST | `/api/v1/ai-summaries-genai/briefs/:briefType/:entityId/generate` |
| `askQuery(...)` | POST | `/api/v1/ai-summaries-genai/query` |
| `createResearchJob(...)` | POST | `/api/v1/ai-summaries-genai/research/jobs` |
| `getJobStatus(jobId)` | GET | `/api/v1/ai-summaries-genai/research/jobs/:jobId` |
| `listJobs(status)` | GET | `/api/v1/ai-summaries-genai/research/jobs` |
| `getReport(reportId)` | GET | `/api/v1/ai-summaries-genai/research/reports/:reportId` |
| `submitFeedback(reportId, ...)` | POST | `/api/v1/ai-summaries-genai/feedback/reports/:reportId` |
| `healthCheck()` | GET | `/api/v1/ai-summaries-genai/test/health` |

---

## Dev / test endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/ai-summaries-genai/test/health` | Health |
| GET | `/api/v1/ai-summaries-genai/test/workspace-stats` | DB stats |
| POST | `/api/v1/ai-summaries-genai/test/seed-crm` | Seed CRM workspace data |
| POST | `/api/v1/ai-summaries-genai/test/smoke` | Smoke suite |

---

## Headers (standalone)

```http
Content-Type: application/json
X-Org-Id:  00000000-0000-0000-0000-000000000001
X-User-Id: 00000000-0000-0000-0000-000000000002
X-Role:    SALES_MANAGER
X-Team-Id: b0000000-0000-0000-0000-000000000001
```

---

## UI pages → features

| Route (web) | APIs used |
|-------------|-----------|
| `/research` | research jobs + reports |
| `/ask-anything` | `query`, workspace chat |
| `/smart-summaries` | briefs, workspace |

---

## Full route list

[BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) → `m03-ai-summaries-genai`.
