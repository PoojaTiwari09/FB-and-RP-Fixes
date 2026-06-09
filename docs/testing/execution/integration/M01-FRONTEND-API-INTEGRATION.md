# M01 — New frontend API integration

**Full per-endpoint input/output contract:** [M01-NEW-FRONTEND-FULL-CONTRACT.md](./M01-NEW-FRONTEND-FULL-CONTRACT.md)

**Source docs (in `doc/execution/integration/`):**

| File | Scope |
|------|--------|
| `Call_List Sales_Rep.txt` | M01 screens: Calls List, Briefs, Transcript (28 REST APIs) |
| `final_semantic_backend_mapping_plan.docx` | Semantic map frontend → backend |
| `callsearch_screen_breakdown_v2.txt` | Call Search (mostly M02 — later) |
| `smartcall_Figma_breakdown.txt` | Smart Call / Live Assist (in `doc/execution/integration/`) |

**Current backend prefix:** `/api/v1/capture-transcription/...`  
**New frontend prefix:** `/api/...` (product contract)

## Approach

1. Add a **frontend facade** layer in `modules/m01-capture-transcription/frontend-api/` that exposes `/api/calls`, `/api/brief-templates`, etc.
2. **Reuse** existing `CallService`, repositories, workers — no duplicate business logic.
3. **Map** request query/body and **reshape** responses to match frontend docs exactly.
4. Keep legacy routes working for the old Vite UI until the new frontend is wired.

## Module 1 API inventory (from `Call_List Sales_Rep.txt`)

### Screen: Calls List (`/calls`) — **Phase 1 (in progress)**

| # | Frontend API | Backend today | Action |
|---|--------------|---------------|--------|
| 1 | `GET /api/calls` | `GET .../calls` | **Reshape** + add filters (`page`, `size`, duration, dateRange, …) |
| 2 | `GET /api/calls/:callId` | `GET .../calls/:id` | **Reshape** (metadata row shape) |
| 3 | `GET /api/calls/accounts` | — | **Implement** (distinct accounts from calls) |
| 4 | `GET /api/calls/participants` | — | **Implement** (distinct participants from calls) |
| 5 | `GET /api/calls/search` | `GET .../calls/search` | **Reshape** |

### Screen: Call Detail — Briefs — **Phase 2**

| # | Frontend API | Action |
|---|--------------|--------|
| 6–21 | `/api/calls/:callId/metadata`, briefs, sections, share, export | Map to M01 transcript/AI + M03 brief services |

### Screen: Call Detail — Transcript — **Phase 3**

| # | Frontend API | Action |
|---|--------------|--------|
| 22–28 | transcript, summary, talk-ratio, audio, topics, next-steps | Reshape existing M01 endpoints |

### Smart Call / Live Assist (`smartcall_Figma_breakdown.txt`) — **Phase 4 (M02-aligned)**

| # | Frontend API | Backend today | Action |
|---|--------------|---------------|--------|
| 1 | `GET /api/smart-call/contacts` | M02 `useM02CrmData` mock only | **Implement** facade |
| 2 | `GET /api/smart-call/contacts/:id/pre-call-brief` | — | **Implement** |
| 3 | `POST /api/smart-call/sessions/start` | — | **Implement** (optional Supabase like LiveAssist) |
| 4 | Live coaching (Groq + OpenRouter) | M02 `gemini.js` in browser | **No backend** — keys in `localStorage` only |
| 5 | `POST /api/smart-call/sessions/:id/end` | — | **Implement** |
| 6 | `GET /api/smart-call/sessions/:id/summary` | — | **Implement** |
| 7 | `GET /api/smart-call/sessions/:id/transcript` | — | **Implement** (can link to M01 call after ingest) |

**Note:** Doc explicitly says **no WebSocket** for live coaching — browser calls Groq/OpenRouter directly (same as current M02 Live Assist). Backend only needs session lifecycle + post-call summary storage.

---

## Response shape example (Calls List)

**Frontend expects:**

```json
{
  "totalCount": 42,
  "page": 1,
  "size": 20,
  "calls": [{
    "callId": "...",
    "callTitle": "...",
    "dealType": "meeting",
    "account": "Acme Corp",
    "owner": { "ownerId": "...", "ownerName": "Sarah", "avatarInitials": "SC" },
    "dateTime": "2026-05-28T10:30:00.000Z",
    "duration": "12m 4s",
    "keyInsight": "Summary snippet...",
    "status": "completed"
  }]
}
```

**Backend today:** `{ "total": 42, "records": [{ "id", "title", "callDate", ... }] }`

---

## Work order (screenwise)

1. **Calls List** — facade `GET /api/calls` (+ accounts, participants, search, detail)
2. **Transcript tab** — facade transcript APIs
3. **Briefs tab** — facade + M03 brief generation where needed
4. **Smart Call** — separate design (sessions + WS)

When you share the next screen doc, we extend this file and implement that phase.
