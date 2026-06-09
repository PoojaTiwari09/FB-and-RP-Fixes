# Frontend team specs → backend map (master)

**Your need (restated):** The **old frontend + old backend** (`/api/v1/...`) should keep working. The **new frontend** must call the **exact paths and JSON** from the documents the frontend team gave you — not random shapes from our database.

**What we did NOT do:** We did **not** replace or break your working legacy APIs.

**What we added:** A **translator layer** (bridge) at `/api/...` that reads/writes the **same** internal services/DB, but returns JSON in the **frontend document shape**.

---

## Rule (avoid format errors)

| Who | Must call | Example |
|-----|-----------|---------|
| **Old Vite/Next UI** (already working) | Legacy only | `GET /api/v1/capture-transcription/calls` |
| **New Figma UI** | Bridge only | `GET /api/calls` per `Call_List Sales_Rep.txt` |

If the new UI calls legacy URLs → wrong JSON → errors.  
If the new UI calls bridge URLs but we did not implement that route yet → 404 or wrong shape → errors.

---

## Documents you shared (inventory)

| File | Module | Screen(s) | Frontend `/api` routes (approx.) |
|------|--------|-----------|----------------------------------|
| `Call_List Sales_Rep.txt` | M01 | Calls List, Briefs, Transcript | **28** |
| `smartcall_Figma_breakdown 2.txt` | M01 | Smart Call | **6** |
| `callsearch_screen_breakdown_v2.txt` | M02 | Call Search (Manager) | **6** |
| `Figma_Coaching-AI-Trainer 1.txt` | M09 | AI Trainer | **9** |
| `specs/Ai_Call_Reviewer_Manager.txt` | M02 | AI Call Reviewer (Manager) | **~25+** |
| `specs/Ai_Call_Reviewer_SalesRep.txt` | M02 | AI Call Reviewer (Rep) | uses `GET /api/calls?view=ai-reviewer` |

---

## What code changed (simple list)

Only **new files** under `modules/*/frontend-api/` + registration in Nest modules. **Legacy controllers unchanged.**

| Module | New folder | Old API still works? |
|--------|------------|-------------------|
| M01 | `m01-capture-transcription/frontend-api/` | Yes — `CallsController`, `UploadController`, etc. |
| M02 | `m02-conversation-intelligence/frontend-api/` | Yes — all `/api/v1/conversation-intelligence/...` |
| M09 | `m09-coaching-training/frontend-api/` | Yes — `/api/v1/coaching-training/...` |

**Docs added:** `doc/execution/integration/*.md` (plans and locked decisions).

---

## Status by document (bridge = new UI contract)

### M01 — `Call_List Sales_Rep.txt`

| Frontend route | Status | Notes |
|----------------|--------|-------|
| `GET /api/calls` | ✅ Bridge | List + filters (DB-level) |
| `GET /api/calls/:callId` | ✅ | Detail |
| `GET /api/calls/:callId/metadata` | ✅ | Lightweight header |
| `GET /api/calls/accounts`, `/participants`, `/search` | ✅ | |
| Transcript 22–25, next-steps 27–28 | ✅ Bridge | Must use `owner: { id, name }`, `stepId` like `step_001` |
| Briefs 7–21, templates, periods | ✅ Bridge | Generated from transcript; not full M03 AI |
| `POST /api/calls/upload` | ✅ Bridge | Same as legacy upload |
| Smart Call `/api/smart-call/*` | ⚠️ Partial | Sessions/contacts scaffold; live AI proxy not full |

**Legacy:** `GET /api/v1/capture-transcription/calls` — **unchanged**.

---

### M02 — `callsearch_screen_breakdown_v2.txt`

| Frontend route | Status | Notes |
|----------------|--------|-------|
| `GET /api/filters/options` | ✅ Bridge | |
| `GET /api/search/calls` | ✅ Bridge | **Not** `/api/calls/search` (that is M01) |
| `GET /api/search/calls/:callId` | ✅ Bridge | Drawer shape from call + transcript |
| `POST /api/calls/ai-ask` | ✅ Bridge | Simple answer from summary |
| `POST /api/calls/export`, `POST /api/streams` | ✅ Bridge | Job id / stream id |

**Legacy:** conversation search, trackers, translate — **unchanged**.

---

### M09 — `Figma_Coaching-AI-Trainer 1.txt`

| Frontend route | Status | Notes |
|----------------|--------|-------|
| `GET /api/trainings` | ✅ Bridge | Maps scenarios → trainings |
| `GET /api/trainings/:id` | ✅ | Setup (`repObjective` spelling) |
| Session messages / pause / resume / end / results | ✅ Bridge | Text works; `audioUrl` optional (TTS not required) |

**Legacy:** `/api/v1/coaching-training/*` — **unchanged**.

---

### M02 — `Ai_Call_Reviewer_Manager.pdf` ✅ **Bridge added**

This is the spec you just pointed to. The new UI expects **`/api/call-reviews`** (separate from `/api/calls` and `/api/search/calls`).

| # | Frontend API (from PDF) | Bridge status |
|---|-------------------------|---------------|
| 1–23 | `/api/call-reviews/*`, `/api/analytics/*`, `/api/scorecards`, `/api/users`, `/api/meta/coaching-tags` | ✅ Bridge (`m02-frontend-call-reviews`) |

**Possible legacy to map later (internal, not same JSON):** M02 scorecard on conversations, trackers — paths differ; need **new** `m02-frontend-call-reviews` bridge, not reusing `/api/calls`.

---

## Why errors happen (checklist for frontend team)

1. **Wrong base path** — e.g. Call Search calling `/api/calls/search` instead of `/api/search/calls`.
2. **Route not built yet** — e.g. Call Reviewer calling `/api/call-reviews` (we have not added this bridge).
3. **Field names** — e.g. frontend expects `owner.id` but API returns `ownerId` (we standardized on `{ id, name, avatarInitials }` per locked decision).
4. **Mixing old and new UI on same URLs** — old app must stay on `/api/v1/...`.

---

## Recommended next step (your priority)

1. **Freeze legacy** — no changes to `/api/v1/...` without explicit approval.
2. **New UI uses only routes from the table above** for each screen.
3. **Implement next:** `m02-frontend-call-reviews` from `Ai_Call_Reviewer_Manager.pdf` (all rows ❌).
4. **Get SR PDF/txt** for Rep reviewer if different from Manager.
5. **Per route:** Zod validate request → service → mapper → **exact** response fields from PDF/txt.

---

## Quick reference — who owns which `/api` prefix

| Prefix | Owner screen |
|--------|----------------|
| `/api/calls` | M01 Sales Rep (list, detail, transcript, briefs) |
| `/api/search/calls` | M02 Call Search drawer + search |
| `/api/call-reviews` | M02 AI Call Reviewer (Manager) — **from PDF** |
| `/api/trainings` | M09 AI Trainer |
| `/api/smart-call` | M01 Smart Call |
| `/api/analytics` | M02 Reviewer analytics (PDF) |
| `/api/v1/...` | **Legacy only** — old working app |

---

*Update this file when a bridge route is implemented: change ❌ → ✅ and link PR/commit.*
