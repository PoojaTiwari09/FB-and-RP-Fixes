# API documentation — integrated standalone modules

For the **frontend team**: map UI calls to backend endpoints for modules that run as **standalone** apps (separate API + web ports).

**Not included:** M04 (Deal Intelligence), M06 (Forecasting), M08 (Sales Engagement) — not standalone-integrated in this repo layout.

---

## Quick reference

| Module | Web port | API port | API base path |
|--------|----------|----------|---------------|
| **M01** Capture & Transcription | 5174 | 3001 | `/api/v1/capture-transcription` |
| **M02** Conversation Intelligence | 5175 | 3002 | `/api/v1/conversation-intelligence` (+ `/api/v1/m02-conversation-intelligence`) |
| **M03** AI Summaries & GenAI | 5177 | 4010 | `/api/v1/ai-summaries-genai` |
| **M05** Account Intelligence | 5179 | 4012 | `/api/v1/account-intelligence` |
| **M07** Revenue Dashboards | 5180 | 4013 | `/api/v1/revenue-dashboards` (+ Next.js `/api/*` BFF) |
| **M09** Coaching & Training | 5176 | 4009 | `/api/v1/coaching-training` |
| **M10** Data & Compliance | 5178 | 4011 | `/api/v1/m10-data-compliance` |

**Run commands:** [../standalone/STANDALONE-MODULE-COMMANDS.md](../standalone/STANDALONE-MODULE-COMMANDS.md)

---

## Per-module docs (frontend ↔ backend mapping)

| Doc | Contents |
|-----|----------|
| [API-M01.md](./API-M01.md) | Calls, upload, AI extractor, integrations |
| [API-M02.md](./API-M02.md) | Conversation library, topics, trackers, vocabulary |
| [API-M03.md](./API-M03.md) | Workspace, briefs, Ask Anything, Deep Researcher |
| [API-M05.md](./API-M05.md) | Boards, accounts, activities, AI brief, sync |
| [API-M07.md](./API-M07.md) | Dashboards, datasets, HubSpot (BFF + Nest API) |
| [API-M09.md](./API-M09.md) | Auth, sessions, scenarios, coaching, analytics |
| [API-M10.md](./API-M10.md) | Revenue Graph, Data Cloud exports |

**Full backend route list (all HTTP methods):** [BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md)

---

## Common auth headers (standalone dev)

| Header | Typical value | Modules |
|--------|---------------|---------|
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | M01, M02, M10 |
| `x-user-id` | `00000000-0000-0000-0000-000000000002` | M01, M02, M10 |
| `X-Org-Id` | `00000000-0000-0000-0000-000000000001` or org UUID | M03 |
| `X-User-Id` | user UUID | M03 |
| `X-Role` | `SALES_MANAGER` / `rep` / `manager` | M03, M05 |
| `Authorization` | `Bearer <jwt>` | M09 (after login), M10 (optional) |

M05 standalone often uses **session/cookie** via Vite proxy — see [API-M05.md](./API-M05.md).

---

## How URLs resolve in standalone mode

```text
Browser  →  Vite dev server (web port)
              ├─ proxy /api/v1/...  →  m0N-api (API port)
              └─ or direct NEXT_PUBLIC_* / VITE_*_API_URL → http://localhost:PORT
```

Each module doc lists:

1. **Frontend env vars** (`VITE_*`, `NEXT_PUBLIC_*`)
2. **Frontend client file** (where `fetch` / axios is defined)
3. **Mapping table**: frontend function/path → backend method + full path

---

## Related

- [MODULE-DATA-FLOW.md](../MODULE-DATA-FLOW.md) — how modules connect (events + deep links)
- [Event Schema registry](../../reference/docs/markdown%20documents/Event%20Schema%20registry.md)
