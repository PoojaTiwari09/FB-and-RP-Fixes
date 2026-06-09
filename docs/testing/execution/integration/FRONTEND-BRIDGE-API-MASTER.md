# Frontend ↔ Backend bridge API (master plan)

**Purpose:** New Figma frontend speaks **`/api/...`** with fixed JSON shapes. Existing Nest apps speak **`/api/v1/<module>/...`** with different shapes. **Never change legacy routes in place** — add a **bridge (facade)** layer that validates FE input and maps to/from internal services.

**Bridge already started (M01):**  
`modules/m01-capture-transcription/frontend-api/` → `@Controller('api/calls')`

**Locked decisions:** [INTEGRATION-DECISIONS-LOCKED.md](./INTEGRATION-DECISIONS-LOCKED.md)  
**M01–M09 completion backlog:** [MODULES-M01-M02-M03-M09-COMPLETION-PLAN.md](./MODULES-M01-M02-M03-M09-COMPLETION-PLAN.md)

---

## New files reviewed (your additions)

| File | Module / screen | Owner (from roster) | FE APIs | Backend today |
|------|-----------------|---------------------|---------|---------------|
| `Call_List Sales_Rep.txt` | M01 — Calls List, Briefs, Transcript | Linojose | **28** on `/api/calls/...` + `/api/brief-*` | Facade **5/28** done |
| `smartcall_Figma_breakdown 2.txt` | M01 — Smart Call | Aakrithi | **6** on `/api/smart-call/...` + backend AI proxy | **0** |
| `callsearch_screen_breakdown_v2.txt` | M02 — Call Search (SM) | Shivani | **6** at `/api/search/...` | **bridge** on m02-api |
| `Ai_Call_Reviewer_Manager.pdf` | M02 — AI Call Reviewer (SM) | Haripriya | **~23** at `/api/call-reviews` | **❌ not built** — see [FRONTEND-SPEC-MASTER-MAP.md](./FRONTEND-SPEC-MASTER-MAP.md) |
| `Figma_Coaching-AI-Trainer 1.txt` | M09 — Coaching AI Trainer | (new) | **~10** on `/api/trainings/...` | M09 legacy `/api/v1/coaching-training/...` (different paths) |

**Per-screen contract detail:** [M01-NEW-FRONTEND-FULL-CONTRACT.md](./M01-NEW-FRONTEND-FULL-CONTRACT.md) (M01 only today).

---

## Bridge architecture (same pattern for every module)

```
┌─────────────────┐     exact FE JSON      ┌──────────────────────┐     internal DTO     ┌─────────────────┐
│  New frontend   │ ─────────────────────► │  Bridge controllers  │ ───────────────────► │  Legacy services │
│  /api/...       │ ◄───────────────────── │  frontend-api/*      │ ◄─────────────────── │  /api/v1/...     │
└─────────────────┘   Zod in + mapper out  └──────────────────────┘                      └─────────────────┘
```

**Each bridge handler:**

1. **Zod** — parse query/body exactly as FE doc (reject unknown enums).
2. **Adapter** — call `CallService`, M02 search repo, M09 training service, etc. (no HTTP hop unless cross-module).
3. **Mapper** — build response with **exact** field names from Figma txt (no Prisma leak).
4. **Errors** — map to FE `{ error, code, message }` where doc specifies it.

**Folder convention:**

```
modules/<module>/frontend-api/
  <module>-frontend-<screen>.controller.ts
  <module>-frontend-<screen>.service.ts
  <module>-frontend-<screen>.schema.ts   # Zod
  <module>-frontend.mapper.ts
```

Register controllers in the **same Nest module** as legacy (M01 API app imports M01 module only, etc.).

---

## Path routing (locked — Option A)

| Screen | Method | Path |
|--------|--------|------|
| M01 list search | GET | `/api/calls/search` |
| M01 call detail | GET | `/api/calls/:callId` |
| M01 call header | GET | `/api/calls/:callId/metadata` |
| M02 rich search | GET | `/api/search/calls` |
| M02 drawer | GET | `/api/search/calls/:callId` |
| M02 filters | GET | `/api/filters/options` |
| M02 AI ask | POST | `/api/calls/ai-ask` |
| M02 export | POST | `/api/calls/export` |
| M02 streams | POST | `/api/streams` |

M02 bridge scaffold: `modules/m02-conversation-intelligence/frontend-api/` (registered on **m02-api**).

---

## What breaks if we change APIs wrong

| Change | What breaks |
|--------|-------------|
| Rename/remove `/api/v1/capture-transcription/calls/*` | Old M01 Vite UI, upload flow, S3 import, transcription worker triggers |
| Change `CallRecord` / `Transcript` Prisma fields for FE only | M02 ingest, M03 summaries, smoke tests, workers |
| Replace `GET /api/calls/search` with M02 shape only | Sales Rep Calls List search box (when wired) |
| Replace `GET /api/calls/:callId` with drawer shape only | Sales Rep row click metadata |
| Move Live Assist / Smart Call live AI to backend | Intentionally browser-only (Groq/OpenRouter); no change needed |
| Change M09 `/api/v1/coaching-training/*` in place | Old coaching UI; map via `/api/trainings` bridge instead |

**Safe rule:** Legacy routes and DB models stay; only **`frontend-api/`** controllers expose new shapes.

---

## Open items (still pending)

| Item | Status |
|------|--------|
| M02 Reviewer / Translator Figma API txt | Blocked — waiting on design |
| M09 TTS vendor (ElevenLabs vs Azure) | Pending |
| JWT module wired on M01/M02 bridge controllers | Planned (M07 `JwtStrategy` reference) |
| Next-step stable IDs (`step_001`) | Schema migration + facade |
| Smart Call backend AI proxy | New service — replaces browser keys for new UI |

All other integration questions are answered in [INTEGRATION-DECISIONS-LOCKED.md](./INTEGRATION-DECISIONS-LOCKED.md).

---

## Bridge API inventory (implement status)

### M01 — `modules/m01-capture-transcription/frontend-api/`

| Phase | Screen | Endpoints | Bridge status |
|-------|--------|-----------|---------------|
| A | Calls List | `GET /api/calls`, accounts, participants, search (SR), `:callId` | **5 done** — harden DB filters |
| B | Metadata | `GET .../metadata` | TODO (alias #2) |
| C | Briefs | 7–21 | TODO (new persistence + AI) |
| D | Transcript | 22–28 | TODO (mapper over utterances/next-steps) |
| E | Smart Call | `/api/smart-call/*` × 6 | TODO (new module or M02 facade) |

### M02 — `modules/m02-conversation-intelligence/frontend-api/` (to create)

| Screen | Endpoints | Maps to internal (examples) |
|--------|-----------|------------------------------|
| Call Search | `GET /api/filters/options` | **scaffold** — static options v1 |
| Call Search | `GET /api/search/calls` | **scaffold** — wire HybridSearch + scorecard |
| Call Search | `GET /api/search/calls/:callId` | **stub** — drawer payload |
| Call Search | `POST /api/calls/ai-ask` | M03 or M02 Q&A |
| Call Search | `POST /api/calls/export` | M02 export jobs |
| Call Search | `POST /api/streams` | M02 streams persistence |

### M09 — `modules/m09-coaching-training/frontend-api/` (to create)

| Screen | FE path | Legacy internal |
|--------|---------|-----------------|
| Dashboard | `GET /api/trainings` | `GET /api/v1/coaching-training/my` (reshape) |
| Setup | `GET /api/trainings/:id` | `GET /api/v1/coaching-training/:id` |
| Session | `POST/PATCH .../sessions/*` | `start`, `send-message`, `end`, etc. |
| Results | `GET .../results` | Post-session evaluation payload |

---

## Implementation order (recommended)

1. **Resolve G1** (path collision) with frontend — blocking for M02 Call Search + M01 `#5` coexistence.
2. Harden M01 Phase A (Prisma `where`, `totalCount`, `pending` → `processing`).
3. M01 Phase D (transcript) — data exists, mostly mapping.
4. M01 Phase B + C (metadata alias, briefs).
5. M02 Call Search bridge (after G1).
6. M01 Smart Call bridge (SC-1–7; live AI unchanged in browser).
7. M09 Training bridge (map legacy coaching-training).
8. M02 Reviewer / Translator when Figma API txt arrives.

---

## Quick test (M01 bridge today)

```http
GET http://localhost:3001/api/calls?page=1&size=10
x-tenant-id: 00000000-0000-0000-0000-000000000001
```

Legacy unchanged:

```http
GET http://localhost:3001/api/v1/capture-transcription/calls
```

---

*Update this doc when frontend answers G1 and when new Figma API txt files land for M02 Reviewer / Translator.*
