# M01 — New frontend ↔ backend full contract (input + output)

**Source of truth (frontend):**
- `doc/execution/integration/Call_List Sales_Rep.txt` — 28 REST APIs (Calls List, Briefs, Transcript)
- `doc/execution/integration/smartcall_Figma_breakdown.txt` — Smart Call (7 backend APIs + browser-only live AI)

**Rule:** The backend **must** accept exactly the query/body the frontend sends and **must** respond with exactly the JSON shape below — field names, nesting, and enums. Internal Prisma/Nest shapes stay internal; only the facade exposes the contract.

**Base URL (M01 API):** `http://localhost:3001`  
**Auth headers (every request):**
```http
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002   (when user context needed)
Content-Type: application/json                      (POST/PATCH except multipart)
```

**Legacy routes** (`/api/v1/capture-transcription/...`) stay for old Vite UI until deprecated.

**Master bridge plan (all modules + collisions):** [FRONTEND-BRIDGE-API-MASTER.md](./FRONTEND-BRIDGE-API-MASTER.md)

**Also reviewed:** `callsearch_screen_breakdown_v2.txt` (M02), `Figma_Coaching-AI-Trainer 1.txt` (M09), `smartcall_Figma_breakdown 2.txt`.

---

## Status summary

| Phase | Screen | APIs | Done | Remaining |
|-------|--------|-----:|-----:|----------:|
| **A** | Calls List | 1–5 | 5 | 0 (harden filters + DB-level pagination) |
| **B** | Call metadata | 6 | 1 | 0 (lightweight header) |
| **C** | Briefs | 7–21 | 0 | 15 |
| **D** | Transcript & next steps | 22–28 | 0 | 7 |
| **E** | Smart Call | SC-1–7 | 0 | 6 backend (+ live AI = browser) |
| **—** | Upload (old UI; confirm with FE) | — | partial | map to `/api/calls/upload` if needed |

**Facade code today:** `modules/m01-capture-transcription/frontend-api/` (Phase A only).

---

# PHASE A — Calls List (`/calls`)

## 1. `GET /api/calls`

**Purpose:** Paginated call table with filters.

### Request (query) — frontend sends

| Param | Type | Required | Values / notes |
|-------|------|----------|----------------|
| `page` | number | no | default `1` |
| `size` | number | no | default `20`, max `100` |
| `search` | string | no | title, owner, account |
| `status` | string | no | `all` \| `completed` \| `processing` \| `failed` \| `skipped` |
| `duration` | string | no | `all` \| `lt2` \| `2to10` \| `gt10` (minutes: &lt;2, 2–10, &gt;10) |
| `dealType` | string | no | maps to `callType` / dealType in DB |
| `account` | string | no | account id or name substring |
| `participantId` | string | no | matches entry in `participants[]` |
| `ownerId` | string | no | maps to `callOwner` today |
| `dateRange` | string | no | `last7days` \| `last30days` \| `custom` |
| `startDate` | ISO date | no | with `dateRange=custom` |
| `endDate` | ISO date | no | with `dateRange=custom` |

### Response — backend must return

```json
{
  "totalCount": 42,
  "page": 1,
  "size": 20,
  "calls": [
    {
      "callId": "uuid",
      "callTitle": "Q2 Renewal Discussion",
      "dealType": "meeting",
      "account": "Acme Corp",
      "owner": {
        "ownerId": "rep-001",
        "ownerName": "Sarah Chen",
        "avatarInitials": "SC"
      },
      "dateTime": "2026-05-28T14:30:00.000Z",
      "duration": "12m 4s",
      "keyInsight": "One-line summary from transcript or em dash",
      "status": "completed"
    }
  ]
}
```

| Field | Source (internal) | Notes |
|-------|-------------------|--------|
| `callId` | `CallRecord.id` | |
| `callTitle` | `CallRecord.title` | |
| `dealType` | `dealType` or `callType` | FE doc uses dealType label |
| `account` | `accountId` or resolved name | need `accountName` column or CRM later |
| `owner.*` | `callOwner` | `ownerId` = stable id when we add `User` table |
| `dateTime` | `callDate` ISO | |
| `duration` | `durationSeconds` → `"Nm Ns"` | not raw seconds |
| `keyInsight` | `transcript.summary` | `"—"` if empty |
| `status` | `transcriptStatus` | map `pending` → `processing` for FE |

**Internal today:** `CallService.listCalls` → reshape in `m01-frontend.mapper.ts`  
**Gap to fix:** filters applied in-memory after page fetch — move to Prisma `where` for correct `totalCount`.

---

## 2. `GET /api/calls/:callId`

**Purpose:** Row click — header metadata (same shape as metadata endpoint #6).

### Request

| Param | In | |
|-------|-----|--|
| `callId` | path | UUID |

### Response

```json
{
  "callId": "uuid",
  "callTitle": "Q2 Renewal Discussion",
  "account": "Acme Corp",
  "type": "outbound",
  "dealType": "meeting",
  "date": "2026-05-28",
  "time": "02:30 PM",
  "duration": "12m 4s",
  "source": "manual",
  "participants": [{ "name": "Sarah Chen (Rep)" }, { "name": "John Smith" }],
  "owner": {
    "ownerId": "rep-001",
    "ownerName": "Sarah Chen",
    "avatarInitials": "SC"
  },
  "status": "completed"
}
```

| Field | Rules |
|-------|--------|
| `type` | **only** `inbound` \| `outbound` (map `meeting` → `outbound`) |
| `date` | `YYYY-MM-DD` local or UTC — pick one and document |
| `time` | 12h e.g. `02:30 PM` |
| `source` | `zoom` \| `teams` \| `meet` \| `dialer` \| `manual` |

**Internal today:** `getCallDetail` + `mapCallDetail` — **implemented** in facade.

---

## 3. `GET /api/calls/accounts`

### Request (query)

| Param | Type |
|-------|------|
| `search` | string optional |

### Response

```json
{
  "accounts": [
    { "accountId": "acme-corp-001", "accountName": "Acme Corp" }
  ]
}
```

**Internal today:** distinct `accountId` from `call_records` — **implemented**.  
**Gap:** real CRM account names from M05/M10 when integrated.

---

## 4. `GET /api/calls/participants`

### Request (query)

| Param | Type |
|-------|------|
| `search` | string optional |
| `accountId` | string optional |

### Response

```json
{
  "participants": [
    { "participantId": "Sarah Chen (Rep)", "name": "Sarah Chen (Rep)" }
  ]
}
```

**Internal today:** flatten `participants[]` on calls — **implemented**.

---

## 5. `GET /api/calls/search`

### Request (query)

| Param | Type | Required |
|-------|------|----------|
| `q` | string | **yes** |
| `page` | number | no |
| `size` | number | no |

### Response

```json
{
  "totalCount": 3,
  "calls": [
    {
      "callId": "uuid",
      "callTitle": "...",
      "account": "...",
      "owner": "Sarah Chen",
      "status": "completed",
      "dateTime": "2026-05-28T14:30:00.000Z",
      "duration": "12m 4s",
      "keyInsight": "excerpt..."
    }
  ]
}
```

**Note:** Here `owner` is a **string** (not object) — different from list #1. Match FE doc exactly.

**Internal today:** `searchTranscripts` — map hits to this shape. **Implemented**; verify `owner` is string.

---

# PHASE B — Call detail header

## 6. `GET /api/calls/:callId/metadata`

**Purpose:** Same data as #2 for Briefs/Transcript tabs top bar.

### Response

**Identical JSON to #2** — implement as alias: call same mapper `mapCallDetail`.

**Status:** **Not implemented** (add route before `:callId` nested routes).

---

# PHASE C — Briefs tab

Brief content is **not** in M01 Prisma today. Plan:

- **Read/generate** via M03 `BriefService` + call transcript as context, **or**
- New `call_briefs` table under M01 with sections matching FE.

All routes under `/api/calls/:callId/...` except templates (#9–10).

## 7. `GET /api/calls/:callId/briefs`

### Request (query)

| Param | Type |
|-------|------|
| `page` | number |
| `size` | number |

### Response

```json
{
  "briefs": [
    {
      "briefId": "brf_001",
      "briefTemplate": "Executive Summary",
      "period": "Last 30 days",
      "generatedAt": "2026-05-28T10:00:00.000Z",
      "generatedFrom": "AI"
    }
  ]
}
```

**Status:** **Implement** + persistence.

---

## 8. `GET /api/calls/:callId/briefs/:briefId`

### Response (full brief — all sections in one payload)

```json
{
  "briefId": "brf_001",
  "briefTemplate": "Executive Summary",
  "period": "Last 30 days",
  "generatedAt": "2026-05-28T10:00:00.000Z",
  "generatedFrom": "AI",
  "overview": { "text": "..." },
  "keyDiscussionPoints": [
    { "timestamp": "02:15", "description": "..." }
  ],
  "customerNeeds": [
    { "title": "...", "description": "..." }
  ],
  "risks": [
    { "title": "...", "description": "...", "severity": "high" }
  ],
  "commitments": [
    { "description": "...", "assigneeType": "rep", "dueDate": "2026-06-01" }
  ],
  "stakeholders": [
    { "name": "...", "title": "...", "company": "...", "avatarInitials": "JC" }
  ],
  "activityContext": [
    { "date": "2026-05-20", "type": "email", "description": "..." }
  ]
}
```

**Enums:** `severity`: `low` \| `medium` \| `high`; `assigneeType`: `rep` \| `customer`; `activity type`: `email` \| `call` \| `meeting`.

**Status:** **Implement** (generate from transcript + optional M10 activity).

---

## 9. `GET /api/brief-templates`

### Response

```json
{
  "templates": [
    { "templateId": "executive", "templateName": "Executive Summary" }
  ]
}
```

**Status:** **Implement** (static seed list OK for v1).

---

## 10. `GET /api/brief-periods`

### Response

```json
{
  "periods": [
    { "periodId": "last_7", "periodLabel": "Last 7 days" }
  ]
}
```

**Status:** **Implement** (static seed).

---

## 11. `POST /api/calls/:callId/briefs`

### Request (body)

```json
{
  "briefTemplate": "executive",
  "period": "last_30"
}
```

### Response

```json
{
  "briefId": "brf_001",
  "briefTemplate": "Executive Summary",
  "period": "Last 30 days",
  "generatedAt": "2026-05-28T10:00:00.000Z",
  "status": "processing"
}
```

Then FE polls #8 or we return `completed` when sync generation finishes.

**Status:** **Implement** — wire to AI (M03 or M01 worker).

---

## 12–15. Brief share / export

| # | Method | Path | Response highlights |
|---|--------|------|---------------------|
| 12 | POST | `.../briefs/:briefId/share-link` | `{ "shareableLink", "expiresAt" }` |
| 13 | POST | `.../briefs/:briefId/share-internal` | body: `recipientEmails[]`, `message` → `{ "message", "sentTo[]" }` |
| 14 | GET | `.../briefs/:briefId/export/pdf` | `application/pdf` stream |
| 15 | GET | `.../briefs/:briefId/formatted-summary` | `{ "formattedText": "..." }` |

**Status:** **Implement** (12–13 stub OK v1; 14–15 need PDF/text builders).

---

## 16–21. Brief section sub-resources

FE doc lists separate GETs per section. **Two options** (confirm with frontend):

- **A)** Only #8 returns everything (sections 16–21 optional / deprecated), or  
- **B)** Implement each GET returning the same slice as in #8:

| # | Path | Response root key |
|---|------|-------------------|
| 16 | `.../discussion-points` | `{ "discussionPoints": [{ pointId, timestamp, description }] }` |
| 17 | `.../customer-needs` | `{ "customerNeeds": [...] }` |
| 18 | `.../risks` | `{ "risks": [...] }` |
| 19 | `.../commitments` | `{ "commitments": [...] }` |
| 20 | `.../stakeholders` | `{ "stakeholders": [...] }` |
| 21 | `.../activity-context` | query: `page`, `size`, `types` → `{ "activities": [...] }` |

**Status:** **Implement** after #8 (can delegate to same service method).

---

# PHASE D — Transcript & Analysis tab

## 22. `GET /api/calls/:callId/transcript`

### Request (query)

| Param | Type |
|-------|------|
| `page` | number |
| `size` | number |
| `search` | string optional |
| `showLowConfidenceOnly` | boolean |

### Response

```json
{
  "totalCount": 120,
  "transcript": [
    {
      "entryId": "utt_uuid",
      "timestamp": "00:12",
      "speakerName": "Sarah Chen",
      "speakerType": "rep",
      "text": "Thanks for joining...",
      "confidence": "high"
    }
  ]
}
```

| Mapping | Internal |
|---------|----------|
| `entryId` | `Utterance.id` |
| `timestamp` | `startMs` → `MM:SS` |
| `speakerType` | infer rep vs customer from speaker label / order |
| `confidence` | `isLowConfidence` → `low` else `high` |

**Status:** **Implement** facade over `transcript.utterances`.

---

## 23. `GET /api/calls/:callId/transcript/summary`

### Response

```json
{
  "summary": "AI paragraph...",
  "generatedAt": "2026-05-28T10:00:00.000Z"
}
```

**Internal:** `transcript.summary` + `updatedAt`. **Implement**.

---

## 24. `GET /api/calls/:callId/transcript/talk-ratio`

### Response

```json
{
  "rep": { "percentage": 45 },
  "customer": { "percentage": 55 }
}
```

**Internal:** `transcript.talkRatio` JSON. **Implement** normalize keys to rep/customer.

---

## 25. `GET /api/calls/:callId/transcript/audio`

### Response

```json
{
  "audioUrl": "http://localhost:3001/uploads/audio/call-xxx.mp3",
  "duration": "12m 4s",
  "format": "mp3"
}
```

**Internal:** `CallRecord.audioUrl` + `durationSeconds`. **Implement**.

---

## 26. `GET /api/calls/:callId/transcript/topics`

### Response

```json
{
  "topics": [
    {
      "topicId": "top_1",
      "label": "Pricing",
      "timestamp": "03:20",
      "description": "...",
      "color": "#6366f1"
    }
  ]
}
```

**Internal:** M02 topics on call **or** derive from `keyHighlights` / AI. **Implement** (may call M02 ingest/topics or M01 highlights).

---

## 27. `GET /api/calls/:callId/next-steps`

### Response

```json
{
  "nextSteps": [
    {
      "stepId": "0",
      "description": "Send ROI deck",
      "completed": false
    }
  ]
}
```

**Internal today:** array of strings with **index** — map `stepId` = String(index). **Implement** facade.

---

## 28. `PATCH /api/calls/:callId/next-steps/:stepId`

### Request (body)

```json
{ "completed": true }
```

### Response

```json
{
  "stepId": "0",
  "completed": true,
  "updatedAt": "2026-05-28T15:00:00.000Z"
}
```

**Internal:** `PATCH .../next-steps` with `{ index, step }` today — facade translates `stepId` → index. **Implement**.

---

# PHASE E — Smart Call (`/api/smart-call`)

Live coaching = **browser only** (Groq/OpenRouter). Backend implements session lifecycle + post-call artifacts.

| # | API | Request | Response (root) | Status |
|---|-----|---------|-----------------|--------|
| SC-1 | `GET /api/smart-call/contacts` | `q`, `limit`, `offset` | `{ contacts[], total, hasMore }` | TODO |
| SC-2 | `GET .../contacts/:id/pre-call-brief` | path | pre-call JSON per spec | TODO |
| SC-3 | `POST /api/smart-call/sessions/start` | body: contactId, taskId?, integration? | sessionId, wsEndpoint (optional), status LIVE | TODO |
| SC-4 | Live AI | browser | — | **No backend** |
| SC-5 | `POST .../sessions/:id/end` | endedAt, generateSummary | summaryId, status ENDED | TODO |
| SC-6 | `GET .../sessions/:id/summary` | — | full Call Summary screen JSON | TODO |
| SC-7 | `GET .../sessions/:id/transcript` | — | segments[] with timestamp, speaker, text | TODO |

Full samples: `smartcall_Figma_breakdown.txt`.

**Module owner:** M02 web + new `smart-call` facade (can live in M02 module or M01 app).

---

# Upload (confirm with frontend)

Old product UI uses:

| Legacy | New (proposed) |
|--------|----------------|
| `POST /api/v1/capture-transcription/calls/upload` multipart `audio` | `POST /api/calls/upload` same |
| `POST .../calls/upload-from-s3` | `POST /api/calls/import-s3` `{ recordingId }` |

**Ask frontend:** Do they need upload on new `/calls` screen? If yes, add to contract with same post-upload flow (processing → completed).

---

# Locked integration decisions

See [INTEGRATION-DECISIONS-LOCKED.md](./INTEGRATION-DECISIONS-LOCKED.md). Highlights:

- **Owner:** `{ id, name, avatarInitials }` on list + search
- **UTC:** `dateTime` ISO; `date`/`time` derived from UTC
- **Metadata (#6):** lightweight — no `status`; full detail on `#2`
- **M02 search:** `GET /api/search/calls` (not `/api/calls/search`)
- **Errors:** `{ error, code, message }`
- **stepId:** stable string ids (schema work pending)

---

# Implementation order (backend)

1. Harden Phase A (DB filters, `totalCount`, pending→processing).
2. Phase B — `#6 metadata` alias.
3. Phase D — transcript + next-steps (reuse most M01 data).
4. Phase C — briefs (DB + AI generation).
5. Phase E — smart-call facade.
6. Optional upload routes on `/api/calls`.

**Files to add (pattern):**

```
modules/m01-capture-transcription/frontend-api/
  m01-frontend-calls.*          ✅ Phase A
  m01-frontend-metadata.*       Phase B
  m01-frontend-transcript.*     Phase D
  m01-frontend-briefs.*         Phase C
  m01-frontend-brief-templates.* Phase C (root /api)
modules/m02.../frontend-api/    Phase E smart-call (or shared app)
```

Every handler: **Zod validate input** → **service** → **mapper to FE JSON** (no raw Prisma leak).

---

# Quick reference — legacy vs new

| Frontend (new) | Legacy backend (internal) |
|----------------|---------------------------|
| `GET /api/calls` | `GET /api/v1/capture-transcription/calls` |
| `GET /api/calls/:callId` | `GET .../calls/:id` |
| `GET /api/calls/search?q=` | `GET .../calls/search` |
| `GET /api/calls/:callId/transcript` | utterances on `GET .../calls/:id` |
| `GET /api/calls/:callId/next-steps` | `GET .../calls/:id/next-steps` (shape change) |

---

*When you send the next screen, we implement that phase against this contract and mark rows ✅ in git.*
