# Integration decisions (locked)

**Status:** Approved — backend implementation follows this document.  
**Supersedes:** open questions in [FRONTEND-BRIDGE-API-MASTER.md](./FRONTEND-BRIDGE-API-MASTER.md).

---

## Global

| Topic | Decision |
|-------|----------|
| Path collision | **Option A** — M01: `GET /api/calls/search`, `GET /api/calls/:callId`. M02: `GET /api/search/calls`, `GET /api/search/calls/:callId` |
| Base URL | `/api` only (no gateway prefix for now) |
| Auth | **JWT** `Authorization: Bearer <token>`; tenant/user from token. `x-tenant-id` only for internal/dev tools |
| Errors | `{ "error": true, "code": "CALL_NOT_FOUND", "message": "..." }` |
| Dates/times | **UTC only** in API (e.g. `2026-05-28T10:45:00Z`); FE localizes |
| Legacy Vite UI | Keep `/api/v1/...` until migration complete — no breaking changes |

---

## M01 — Calls List / Briefs / Transcript

| Topic | Decision |
|-------|----------|
| `owner` shape | **Object everywhere** — `{ "id", "name", "avatarInitials" }` (not string in search) |
| Briefs phase 1 | Fat GET only — `GET /api/calls/:callId/briefs/:briefId` (section routes 16–21 = phase 2) |
| `stepId` | **Stable string IDs** (e.g. `step_001`) — not array index; requires transcript next-steps model upgrade |
| Upload | `POST /api/calls/upload` — bridge over legacy upload |
| Metadata vs detail | **`GET /api/calls/:callId/metadata`** = lightweight header (no `status`); **`GET /api/calls/:callId`** = full row/detail for list navigation |

---

## M01 — Smart Call

| Topic | Decision |
|-------|----------|
| Live AI | **Backend proxy** (keys server-side; OpenRouter/Groq behind abstraction) — not browser keys |
| `wsEndpoint` | **Required** on session start for realtime streaming |
| Contacts | Phase 1: demo seed; phase 2: CRM |

---

## M02 — Call Search

| Topic | Decision |
|-------|----------|
| Rich search | `GET /api/search/calls` |
| Drawer detail | `GET /api/search/calls/:callId` |
| Emails tab | Phase 1: stub `emailsCount: 0` |
| Score on rows | **Scorecard service/API** — not duplicated on call row DB |
| AI ask | `POST /api/calls/ai-ask` — backend AI abstraction (OpenRouter/Groq) |
| Export | Async job — `{ "jobId", "status": "queued" }` + poll/WS notification |
| Reviewer / Translator | **Blocked** until Figma API txt from design team |

**M02 bridge routes (summary):**

| Method | Path | Module |
|--------|------|--------|
| GET | `/api/filters/options` | M02 |
| GET | `/api/search/calls` | M02 |
| GET | `/api/search/calls/:callId` | M02 |
| POST | `/api/calls/ai-ask` | M02 |
| POST | `/api/calls/export` | M02 |
| POST | `/api/streams` | M02 |

---

## M09 — Coaching AI Trainer

| Topic | Decision |
|-------|----------|
| Routes | `/api/trainings` (not `/api/v1/coaching-training`) |
| JSON field | `repObjective` (not `repObjectiicve`) |
| TTS | Pending — ElevenLabs or Azure Speech |
| Session results | **Polling** after end (WS later) |
| `missedInLastAttempt` | **v2** — not in initial integration |

---

## Implementation notes (backend)

1. **Bridge layer** — all rows above are implemented in `modules/*/frontend-api/`, not by changing legacy controllers.
2. **JWT** — wire `JwtAuthGuard` + `TenantGuard` on bridge controllers when auth module is shared into M01/M02 apps (M07 strategy is reference).
3. **Next-step IDs** — add `CallNextStep` table or JSON map `{ id, description, completed }` on transcript; facade maps to `step_001` style ids.
4. **Smart Call AI** — new `smart-call-ai` proxy service; deprecate browser-stored API keys for new UI only.

---

*Last updated: integration decisions from product/engineering review.*
