# Module Analysis — `m01-capture-transcription`

> Order #1 in the lifecycle (per your chart): "Captures calls, meetings, emails. Transcribes audio using Whisper ASR." Starting point — no inbound dependencies.

---

## 1. Purpose

Owns the **capture → transcription → AI extraction** path for every customer interaction (calls, emails, meetings).

Maps to TDDs:

* `Reference documents/M1 Capture & Transcription/TDD/TDD-Call-Transcription.md`
* `Reference documents/M1 Capture & Transcription/TDD/AI Data Extractor.md`
* `Reference documents/M1 Capture & Transcription/TDD/Native Connectors.md`

---

## 2. Layout

```
modules/m01-capture-transcription/
├── package.json                       (@r-revenue/m01-capture-transcription)
├── m01-capture-transcription.module.ts
├── prisma/schema.prisma               (single mock model — superseded by unified schema)
├── controllers/
│   ├── m01.controller.ts              GET/POST /api/v1/capture-transcription
│   ├── calls.controller.ts            full CRUD + search + notes + share + next-steps
│   ├── upload.controller.ts           multer audio upload
│   └── webhook.controller.ts          inbound AssemblyAI / connector webhooks
├── services/
│   ├── m01.service.ts                 mock list/create + EventPublisher
│   ├── call.service.ts                real Prisma reads/writes for CallRecord lifecycle
│   ├── pii-redaction.service.ts       removes emails/phones from utterances (US-04)
│   ├── audit-log.service.ts           writes AuditLog rows (US-30)
│   ├── ai-extraction.client.ts        HTTP client for apps/ai-services
│   └── ai-extraction.subscriber.ts    listens for transcript completed → triggers extraction
├── repositories/
│   ├── m01.repository.ts              (mock — to remove)
│   ├── call.repository.ts             ✅ real Prisma
│   ├── transcript.repository.ts
│   ├── notes.repository.ts
│   ├── next-steps.repository.ts
│   └── search.repository.ts           (also exports ShareRepository)
├── schemas/m01.schema.ts              Zod DTOs (CreateCallSchema, ShareCallSchema, …)
├── seeds/seed.ts                      demo tenant + 3 calls + transcripts
├── workers/m01.worker.ts              BullMQ processor on m01-queue (AssemblyAI)
├── database/prisma.module.ts          local PrismaModule (replace with shared)
├── interfaces/
└── events/
```

---

## 3. Frontend

`apps/web/src/modules/m01-capture-transcription/`:

* `api/calls.api.ts`, `api/ai-extractor.api.ts`, `api/integrations.api.ts` — fetch wrappers.
* `components/`: `AiInsightsPanel`, `AudioPlayer`, `CallNotes`, `ConnectorCards`, `NextSteps`, `TalkRatioChart`, `TranscriptSearch`, `TranscriptViewer`.
* `pages/`:
  * `calls-list/page.tsx`
  * `call-detail/[callId]/page.tsx`
  * `extraction-library/page.tsx`

The Next.js `apps/web/src/app/calls/page.tsx` and `apps/web/src/app/calls/[callId]/page.tsx` are thin shells that import these module components.

---

## 4. API surface

Base path: `/api/v1/capture-transcription`.

| Method | Path | Handler | Notes |
| ------ | ---- | ------- | ----- |
| GET    | `/` | `M01Controller.findAll`  | Boilerplate; uses mock repo. Safe to remove once `CallsController` covers list. |
| POST   | `/` | `M01Controller.create`   | Same as above — mock create. |
| GET    | `/calls` | `CallsController.listCalls` | ✅ real Prisma, paged + sortable + filters by status/source. |
| POST   | `/calls` | `CallsController.createCall` | Validates via `CreateCallSchema`. Enqueues `m01-queue` job. |
| GET    | `/calls/:id` | `CallsController.getCall` | Full detail incl. transcript + utterances + notes + shares. |
| GET    | `/calls/search` | `CallsController.searchTranscripts` | Org-wide search (CT-05). Uses `SearchRepository` (PG `to_tsvector`). |
| GET    | `/calls/:id/search` | `CallsController.searchWithinCall` | In-call (CT-21). |
| POST   | `/calls/:id/notes` | `createNote` | CT-22. |
| PUT    | `/calls/:id/notes/:noteId` | `updateNote` | CT-22. |
| DELETE | `/calls/:id/notes/:noteId` | `deleteNote` | CT-22. |
| POST   | `/calls/:id/share` | `shareCall` | CT-23. |
| PATCH  | `/utterances/:id` | `updateUtterance` | Inline transcript edit. |
| GET    | `/calls/:id/next-steps` | `getNextSteps` | US-11. |
| POST   | `/calls/:id/next-steps` | `addNextStep` | US-11. |
| PATCH  | `/calls/:id/next-steps` | `updateNextStep` (by index) | US-11. |
| DELETE | `/calls/:id/next-steps/:index` | `deleteNextStep` | US-11. |
| POST   | `/calls/upload` | `UploadController` (multer) | CT-02 audio upload. |
| POST   | `/webhooks/assemblyai` | `WebhookController` | Receives transcript ready callback. |

---

## 5. Async / queue

Queue: `m01-queue` (BullMQ on Redis).

```
CallsController.createCall
  → CallService.createCall (Prisma insert)
  → enqueue { callId, audioUrl, tenantId } on m01-queue

M01CaptureTranscriptionWorker.process
  → AssemblyAI.transcribe (or upload → transcribe for local files)
  → utterances normalized via "Speaker 1/2" fallback (US-03)
  → CallService.onTranscriptionCompleted
    → Transcript + Utterance rows persisted
    → EventPublisher.publish('call.transcription.completed', { callId, tenantId, transcriptId })
```

Failures → `CallService.onTranscriptionFailed(...)` updates `transcriptStatus='failed'` + `failureReason`. BullMQ retries 3× with exponential backoff (5s, 25s, 125s) per US-08.

---

## 6. Events

| Direction | Event | Producer | Subscriber |
| --------- | ----- | -------- | ---------- |
| OUT | `call.uploaded` | `UploadController` | (none yet — M02 should subscribe) |
| OUT | `call.transcription.completed` | `CallService` | M02 (theme detection), M03 (summarization), M05 (account intelligence) |
| OUT | `call.transcription.failed` | `CallService` | M10 (compliance audit) |
| IN  | `revenue_graph.entity.linked` | from M10 | M01 enriches CallRecord with `accountId`/`dealId` |

---

## 7. Database (unified schema mapping)

Maps to these models in `final_product/schema.prisma`:

| App concept | Unified model | Notes |
| ----------- | ------------- | ----- |
| Call header | `Calls` (and also legacy `M01Call` in the `packages/database` schema) | Unify under `Calls`. |
| Transcript | `Transcripts` | Has fields for both summary and chunked retrieval. |
| Utterance | (not in unified) | Currently lives in `packages/database/prisma/schema.prisma` as `Utterance`. Move into unified schema. |
| AI extraction definitions | `AiExtractionFields` | |
| AI extraction results | `AiExtractionResults` | |
| Notes / shares / next-steps | `CallNote`, `CallShare`, `next_steps` columns on `CallRecord` (legacy) | Need new models in unified schema. |
| Integration tokens | `Integration` (legacy) | Add to unified schema. |
| Audit log | `AuditLogs` (legacy) | Already in unified as `audit_logs`. |
| Transcript corrections | `TranscriptCorrections` | Already in unified. |

> See `implementation_changes.md` §C2 for the migration steps.

---

## 8. Gaps & debts (post deep-validation)

| Severity | Issue | Status |
| -------- | ----- | ------ |
| ~~HIGH~~ | `repositories/m01.repository.ts` is a mock (returns hard-coded JSON). | ✅ **Removed** in the deep-validation pass (along with the mock controller + service). |
| ~~HIGH~~ | `prisma/schema.prisma` placeholder model. | ✅ **Removed**. |
| ~~HIGH~~ | `EventPublisherService` was a `console.log` stub — every `@OnEvent` subscriber was silently dead. | ✅ **Replaced** with EventEmitter2-backed publisher; emits both canonical and legacy event names. |
| ~~HIGH~~ | `UploadController` and `WebhookController` were defined but never registered in `M01CaptureTranscriptionModule`. | ✅ **Registered**. |
| ~~HIGH~~ | `TenantGuard` returned `false` (body-less 403). | ✅ Now throws explicit `UnauthorizedException` (401). |
| ~~HIGH~~ | Transcript `create` not idempotent — worker retry hit `Unique constraint failed`. | ✅ **Upserted** inside a `$transaction`. |
| ~~MEDIUM~~ | Frontend `deleteCall` and `extractAI` calls had no backend routes. | ✅ Added `DELETE /calls/:id` and `POST /calls/:id/extract-ai`. |
| ~~MEDIUM~~ | M10 expected canonical event name `call.transcription.completed`; M01 published `transcription.completed`. | ✅ M01 now emits both. |
| ~~MEDIUM~~ | GIN fulltext index missing. | ✅ Created (`_audit/m01_create_fts_indexes.sql`). |
| ~~MEDIUM~~ | Zod errors surfaced as 500. | ✅ Global `ZodExceptionFilter` returns RFC-7807 400 responses. |
| HIGH | Worker depends on `assemblyai` SDK at runtime; require pattern can break under pnpm hoisting. | Mitigated (assertion + fallback) — full fix tracked. |
| MEDIUM | `AiExtractionResult.evidenceTimestampMs` typed `String?` in unified schema (should be `Int?`). | Not in M01 — tracked for M18 / AI Extractor. |
| LOW | `UploadController` saves to a `process.cwd()`-relative `uploads/audio` directory. Production needs S3 / signed URLs. | Open (RR-M01-03). |
| LOW | M10 BullMQ bridge — M01 emits the event over EventEmitter2 but doesn’t enqueue it onto M10’s `revenue-graph-linking` queue. | Open (RR-M10-01). |

---

## 9. Frontend ↔ backend contracts

The Zod schemas in `schemas/m01.schema.ts` are the contract. The frontend API helpers in `apps/web/src/modules/m01-capture-transcription/api/*.api.ts` re-declare the shapes loosely (as `any` in some places). Recommend exporting the Zod schemas from `packages/shared-types/src/dtos/m01/` and reusing them on the frontend.

---

## 10. Smoke checklist (essentials only)

* `POST /api/v1/capture-transcription/calls` returns 201.
* `GET  /api/v1/capture-transcription/calls/:id` returns the seeded transcript.
* `POST /api/v1/capture-transcription/calls/upload` accepts a small `.mp3` file and stores it under `uploads/audio/`.
* With Redis enabled, console shows `[M01 Worker] Starting job ...` after upload.
* With `ASSEMBLYAI_API_KEY` set, console shows `[M01 Worker] ✅ Done!`.
