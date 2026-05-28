# M01 Fix Log

> Every change applied in the M01 deep-validation pass. Roughly grouped by the phase that surfaced it. Every entry includes a short rationale so future readers (or the AI re-running the audit) can trace intent.

## Module wiring (the previously dead pieces)

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-01 | `modules/m01-capture-transcription/m01-capture-transcription.module.ts` | Registered `UploadController` and `WebhookController`; provided `AuditLogService`, `AiExtractionClient`, `AiExtractionSubscriber`; exported the repositories and services that downstream modules need; removed the boilerplate mock provider. | Without these the upload route was 404 and the AI pipeline / Zoom webhook never ran. |
| F-02 | `modules/m01-capture-transcription/controllers/m01.controller.ts` | **Deleted** | Returned `[{message:"Mock list for tenant …"}]` on `GET /api/v1/capture-transcription`. Confused integrators expecting real data. |
| F-03 | `modules/m01-capture-transcription/services/m01.service.ts` | **Deleted** | Companion to the mock controller; no other module imports it. |
| F-04 | `modules/m01-capture-transcription/repositories/m01.repository.ts` | **Deleted** | Hard-coded mock; orphaned after F-02. |
| F-05 | `modules/m01-capture-transcription/prisma/schema.prisma` | **Deleted** | Placeholder `M01CaptureTranscriptionRecord` model that nobody referenced. The unified schema in `packages/database` is the only Prisma source of truth. |
| F-06 | `packages/database` Prisma client | re-generated (`prisma generate`) | Schema didn’t change but we wanted a fresh client; took 233 ms. |

## Event bus (this was the biggest bug)

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-10 | `modules/platform-core/events/event-publisher.service.ts` | Replaced the `console.log` stub with an EventEmitter2-backed publisher; preserved the `publish(name, payload)` signature so no caller has to change. | The legacy stub silently swallowed every domain event. M01 emitted `transcription.completed` but no `@OnEvent` subscriber ever fired. |
| F-11 | `modules/platform-core/events/event-publisher.module.ts` | Marked `@Global()` so every module can inject the publisher without explicit re-import. | Cleaner than threading the dependency through every feature module. |
| F-12 | `apps/api/src/app.module.ts` | Imported `EventEmitterModule.forRoot(...)` once at the root + imported `EventPublisherModule` once at the root. | Single registration; matches NestJS docs’ guidance for `forRoot` modules. |
| F-13 | `modules/m01-capture-transcription/services/call.service.ts` | `onTranscriptionCompleted` and `triggerAiExtraction` now publish **`call.transcription.completed`** (canonical) and `transcription.completed` (alias) with the full envelope expected by M10’s Zod schema. Added `publishTranscriptionFailed`. | Aligns with M10’s `M10_REVENUE_GRAPH_EVENTS.CONSUMED.CALL_TRANSCRIPTION_COMPLETED` and the M08 comment in `task.service.ts`. |
| F-14 | `modules/m01-capture-transcription/services/ai-extraction.subscriber.ts` | Subscribes to `call.transcription.completed` (canonical). | Receives the new emission; payload contract unchanged. |

## Auth / guards

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-20 | `modules/platform-core/guards/tenant.guard.ts` | Throws `UnauthorizedException` explicitly when the header is missing; also wires `req.userId` from `x-user-id` for note attribution. | The old guard returned `false`, which Nest converts to a body-less 403 — terrible for debugging. |
| F-21 | `modules/platform-core/guards/hmac-webhook.guard.ts` | Validates `x-webhook-signature` via `crypto.timingSafeEqual`; allows `x-webhook-test: 1` only when `WEBHOOK_SECRET` is unset; throws explicit `UnauthorizedException` instead of crashing on `process.env.WEBHOOK_SECRET!`. | Constant-time compare avoids timing attacks; dev bypass keeps the smoke loop fast without backdooring production. |

## Repositories / services

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-30 | `repositories/transcript.repository.ts` | `create` is now an idempotent upsert inside `prisma.$transaction`: if a transcript exists for the call, wipe its utterances and rewrite the row; otherwise insert. | Worker retries previously hit `Unique constraint failed: transcripts.callId`. |
| F-31 | `repositories/call.repository.ts` | Added `deleteById(id, tenantId)` using `deleteMany` so cross-tenant deletes are impossible at the SQL level. | Lets us safely expose `DELETE /calls/:id`. |
| F-32 | `services/call.service.ts` | Added `deleteCall`, `triggerAiExtraction`, `publishTranscriptionFailed`. | Closes the gap between the frontend’s `deleteCall` / `extractAI` helpers and the backend. |
| F-33 | `services/audit-log.service.ts` | Stopped passing `null` to optional Prisma columns. | Prisma 5 treats `null` as “write NULL” which fails when the column has no nullability; `undefined` lets Prisma omit it. |

## Schema / API additions

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-40 | `controllers/calls.controller.ts` | Added `DELETE /calls/:id` and `POST /calls/:id/extract-ai`. | Match the frontend contract (`deleteCall`, `extractAI`). |
| F-41 | `schemas/m01.schema.ts` | Added `'skipped'` to status filter; added `'createdAt'` to sortable columns. | Frontend list page already exposes a "Skipped" status filter. |
| F-42 | `_audit/m01_create_fts_indexes.sql` | Created GIN indexes `idx_utterances_text_fts` and `idx_transcripts_fulltext` over `to_tsvector('english', text/"fullText")`. | The schema documents these as required; Prisma can’t emit expression-based GIN. |

## API surface improvements

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-50 | `apps/api/src/zod-exception.filter.ts` (new) + `apps/api/src/main.ts` | Global `ZodExceptionFilter` converts `ZodError` to RFC-7807-shaped `400` responses with `details[]`. | Previously every Zod failure became `500` with an empty body — opaque to clients. |
| F-51 | `apps/api/src/app.module.ts` | Mounted `ServeStaticModule` at `/uploads`. | Lets the frontend `<AudioPlayer />` stream uploaded files directly. |

## Seeds

| # | File | Change | Why |
| - | ---- | ------ | --- |
| F-60 | `modules/m01-capture-transcription/seeds/seed.ts` | Rewritten for idempotency: deletes all M01 rows for `dev-tenant-001` then re-inserts using deterministic UUIDs (`11111111-…-000000000001/2/3`). | Re-running the seed used to duplicate rows or hit the `transcripts.callId` unique constraint. |

## Dependencies

| # | Package | Action | Why |
| - | ------- | ------ | --- |
| F-70 | `@nestjs/event-emitter` | added at workspace root | Required for F-10/F-12. |
| F-71 | `@nestjs/serve-static`  | added at workspace root | Required for F-51. |
| F-72 | `tsx`                   | added at workspace root (devDependency) | Needed to run the seed (`pnpm exec tsx …`). |

## Outstanding follow-ups (intentionally NOT applied in this pass)

| Tracking id | Description |
| ----------- | ----------- |
| RR-M10-01 | Bridge `call.transcription.completed` from EventEmitter2 → M10 BullMQ queue (`revenue-graph-linking`). Without this, M10 worker stays idle on transcript events. |
| RR-M01-01 | Move M01 Zod DTOs to `packages/shared-types/src/dtos/m01/` and import them in the frontend so the API client stops using `any`. |
| RR-M01-02 | Replace the local `Error` in `TranscriptRepository.updateUtterance` with `NotFoundException` (gives a clean 404 instead of 500). |
| RR-M01-03 | Add `@nestjs/throttler` in front of `/calls/upload` to bound disk consumption. |
| RR-M01-04 | Stronger `Utterance.tenantId` validation — currently defaults to `''`; switch to non-null check once all writers are confirmed correct. |

All in-scope items are applied; out-of-scope items are tagged so the next sprint can pick them up without re-discovery.
