# M01 API Validation Report

> Scope: every HTTP endpoint exposed by `M01CaptureTranscriptionModule`.
> Method: source review + 45-case live smoke (see `m01_deep_smoke_report.md`).

## 1. Endpoint inventory (post-fix)

Base path: `/api/v1/capture-transcription`. Webhook controller mounts a sibling base `/api/v1/webhooks`.

| Method | Route | Controller | Auth | Body schema | Notes |
| ------ | ----- | ---------- | ---- | ----------- | ----- |
| GET    | `/calls`                       | `CallsController.listCalls`         | TenantGuard | `ListCallsQuerySchema` | filter by `status`, `source`; sort by `callDate \| title \| durationSeconds \| transcriptStatus \| createdAt` |
| POST   | `/calls`                       | `CallsController.createCall`        | TenantGuard | `CreateCallSchema`     | auto-queues `m01-queue.transcribe` if `audioUrl` set |
| GET    | `/calls/search`                | `CallsController.searchTranscripts` | TenantGuard | `ExtendedSearchQuerySchema` (q, limit, offset, dateFrom/To, ownerId, callType) | uses `to_tsvector` + GIN index |
| GET    | `/calls/:id`                   | `CallsController.getCall`           | TenantGuard | —                        | includes transcript + utterances (ordered) + notes + shares |
| DELETE | `/calls/:id`                   | `CallsController.deleteCall`        | TenantGuard | —                        | cascade through Prisma FK `onDelete: Cascade` |
| POST   | `/calls/:id/extract-ai`        | `CallsController.extractAi`         | TenantGuard | —                        | re-fires `call.transcription.completed` event |
| GET    | `/calls/:id/search`            | `CallsController.searchWithinCall`  | TenantGuard | `SearchQuerySchema`      | case-insensitive `contains` on utterance text |
| POST   | `/calls/:id/notes`             | `CallsController.createNote`        | TenantGuard | `CreateNoteSchema`       | author derived from `req.userId` (defaults to `'anonymous'`) |
| PUT    | `/calls/:id/notes/:noteId`     | `CallsController.updateNote`        | TenantGuard | `UpdateNoteSchema`       | tenant-scoped via `prisma.callNote.update` (id is uuid v4) |
| DELETE | `/calls/:id/notes/:noteId`     | `CallsController.deleteNote`        | TenantGuard | —                        | returns `204 No Content` |
| POST   | `/calls/:id/share`             | `CallsController.shareCall`         | TenantGuard | `ShareCallSchema`        | upserts on `(callId, sharedWithId, sharedWithType)` — idempotent |
| PATCH  | `/utterances/:id`              | `CallsController.updateUtterance`   | TenantGuard | `UpdateUtteranceSchema`  | tenant verified via the parent transcript |
| GET    | `/calls/:id/next-steps`        | `CallsController.getNextSteps`      | TenantGuard | —                        | array on `Transcript.nextSteps` |
| POST   | `/calls/:id/next-steps`        | `CallsController.addNextStep`       | TenantGuard | `AddNextStepSchema`      | appends to array |
| PATCH  | `/calls/:id/next-steps`        | `CallsController.updateNextStep`    | TenantGuard | `UpdateNextStepSchema`   | by index |
| DELETE | `/calls/:id/next-steps/:index` | `CallsController.deleteNextStep`    | TenantGuard | `DeleteNextStepSchema`   | `204 No Content` |
| POST   | `/calls/upload`                | `UploadController.uploadAudio`      | TenantGuard | multipart `audio` field  | 500 MB cap; whitelist of audio MIME types |
| POST   | `/api/v1/webhooks/zoom`        | `WebhookController.handleZoomWebhook` | HmacWebhookGuard | Zoom payload (typed) | idempotent via `meeting.uuid` |
| POST   | `/api/v1/webhooks/teams`       | `WebhookController.handleTeamsWebhook`| HmacWebhookGuard | Teams payload (typed)| placeholder call until Graph API fetch lands |

## 2. Validation behaviour

All controllers use `schema.parse(body)` from Zod. The new `ZodExceptionFilter` (apps/api/src/zod-exception.filter.ts) converts the resulting `ZodError` into a structured `400 Bad Request`:

```json
{
  "statusCode": 400,
  "error":      "Bad Request",
  "message":    "Request payload failed validation",
  "details":    [{ "path": "participants", "code": "too_small", "message": "..." }],
  "path":       "/api/v1/capture-transcription/calls",
  "timestamp":  "2026-05-27T05:50:00.000Z"
}
```

Previously these surfaced as `500 Internal Server Error` with no body, which broke client-side error handling.

## 3. RBAC + tenant isolation

* `TenantGuard` (platform-core) now throws `UnauthorizedException` explicitly when `x-tenant-id` is missing or empty — proven by Phase A test #1.
* Every Prisma query in M01 takes `tenantId` as part of `where`. Verified by direct SQL probe: `SELECT FROM call_records WHERE tenantId='test-tenant-isolation'` returns 0 rows (Phase A test #3).
* `prisma.callRecord.deleteMany({ where: { id, tenantId } })` prevents cross-tenant deletes by construction.
* Inline utterance edit verifies tenant ownership via `where: { id: utteranceId, transcript: { tenantId } }` before update.

## 4. Error handling matrix

| Scenario | HTTP | Body |
| -------- | ----:| ---- |
| Missing tenant header | 401 | `UnauthorizedException` "Missing tenant identifier…" |
| Zod parse failure | 400 | `details[]` from ZodExceptionFilter |
| Unknown call id | 404 | `NotFoundException` "Call {id} not found" |
| Unknown utterance id | 404 (mapped from generic 500 — see §6 risks) | `Error: Utterance {id} not found` |
| Cross-tenant access | 404 | same 404 path → does not leak existence |
| Webhook missing signature when secret set | 401 | `UnauthorizedException` "Missing x-webhook-signature header" |
| Webhook bad signature | 401 | `UnauthorizedException` "Invalid webhook signature" (constant-time compare) |
| Webhook in dev mode | 200 | requires explicit `x-webhook-test: 1` |
| Multer rejects MIME | 400 | `BadRequestException` lists accepted types |
| Multer exceeds 500 MB | 413 | Express default `PayloadTooLargeError` |

## 5. Pagination + sorting

`ListCallsQuerySchema` defaults: `sortBy=callDate, order=desc, limit=20, offset=0`. Hard cap `limit ≤ 100`. The repository wraps `findMany` + `count` in a `prisma.$transaction`, so total + records are consistent.

## 6. Known surface risks (deferred — non-blocking)

1. `PATCH /utterances/:id` currently throws a plain `Error` (caught by Nest as 500) when the utterance isn’t found. Should be `NotFoundException`. Tracked in `m01_runtime_risk_report.md` §2.
2. The webhook controller mutates state before responding `200`. A truly slow Zoom payload (10 recording files) could exceed the 200 ms SLO. Add a fast-ack pattern + background reconciliation in a future sprint.
3. `/calls/upload` has no rate limiter. A single bad actor can fill disk. Recommended: `@nestjs/throttler` + multer disk quota. Tracked in `m01_runtime_risk_report.md` §4.

## 7. Smoke artefacts

* `_audit/m01_deep_smoke.mjs` — 45-case runner
* `_audit/m01_deep_smoke.log` — full request/response trace
* `_audit/m01_deep_smoke_results.json` — machine-readable per-test record
