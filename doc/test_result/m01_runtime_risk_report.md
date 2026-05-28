# M01 Runtime Risk Report

> Risks observed at runtime that did not break the smoke pass but should be tracked.
> Severity legend: 🟥 critical · 🟧 high · 🟨 medium · 🟦 low (info).

## 1. Worker / AssemblyAI integration — 🟧

* The `m01-queue` BullMQ worker (`M01CaptureTranscriptionWorker`) loads the AssemblyAI SDK via `require('assemblyai')` to dodge pnpm hoisting quirks. With pnpm 10 + workspace hoisting the resolution can still surprise (`AssemblyAI` was sometimes `undefined`, hence the existing `.default ?? .AssemblyAI` fallback).
* Mitigation in place: explicit assertion (`if (!AssemblyAI || typeof AssemblyAI !== 'function')`) raises a descriptive error before the job is consumed.
* Recommendation: pin AssemblyAI to ESM import once the SDK ships proper ESM exports; until then keep the require + fallback + assertion pattern.

## 2. PATCH `/utterances/:id` returns 500 on miss — 🟨

`TranscriptRepository.updateUtterance` throws `new Error('Utterance {id} not found')` rather than `NotFoundException`. Nest serialises plain `Error` as 500.

```ts
const utterance = await this.prisma.utterance.findFirst({ where: { id, transcript: { tenantId } } });
if (!utterance) throw new Error(`Utterance ${utteranceId} not found`);
```

Smoke tests still pass because the failure path was not exercised, but a real frontend tries to update a stale id will see a 500 with no body. Tracked in `m01_fix_log.md` as RR-M01-02.

## 3. Worker resilience under Redis loss — 🟨

* The smoke run sets `DISABLE_REDIS=true`. The worker is registered but never starts — perfectly safe.
* With Redis online, BullMQ retries 3× with exponential backoff (5 s, 25 s, 125 s). If the LLM service (`apps/ai-services`) is offline the AI subscriber catches the error inside each stage so the transcript still gets persisted — see `AiExtractionSubscriber` stage 1–3 each wrapped in `try/catch`.
* Risk: if AssemblyAI rate-limits us, the failed job consumes a worker slot for ~155 s of backoff. Recommend tuning concurrency from `2` to `4` after we know the production volume.

## 4. Upload path / storage — 🟧

* `UploadController` writes to `process.cwd()/uploads/audio/`. Acceptable for development; in production:
  * Disk fills if we don’t add a cleanup cron;
  * No rate limiting → easy DOS;
  * Filenames include random suffix so collisions are unlikely but a sequence of 500 MB uploads can OOM a small VM.
* Recommendation: swap multer disk storage for S3 (signed URL `PUT`) and let the worker pull from S3. Tracked as RR-M01-03 + an architectural note.

## 5. PII redaction patterns — 🟨

The regex set in `pii-redaction.service.ts` covers credit cards, SSN, email, phone. It does NOT catch:
* Passport numbers
* IBAN / SWIFT codes
* Driver-licence patterns outside the US

For multi-tenant SaaS in regulated industries (insurance, banking) the redactor should consume a pluggable rule pack so customers can extend it. This is a US-04 follow-up, not a blocker for M02–M10.

## 6. Audit log writes — 🟦

`AuditLogService.log` is fire-and-forget by design (US-30: never let audit failures break the main operation). That is correct, but it means:
* If the DB is unhealthy we lose audit entries silently.
* No retry / DLQ.

Tracked separately; the Postgres outbox pattern is the recommended long-term fix.

## 7. Event-bus delivery — 🟦

The new `EventEmitter2` setup is in-process. If the API restarts mid-pipeline, any in-flight `call.transcription.completed` event is lost. The BullMQ queue retains the transcribe job (durable), but the downstream AI extraction is not durable. For now this is acceptable because the operation is idempotent (manual replay via `POST /calls/:id/extract-ai`).

## 8. Tenant header trust model — 🟧

`TenantGuard` accepts whatever value comes in `x-tenant-id`. In production the gateway must verify the JWT and inject the tenant id from the verified claim. Today the JWT validation lives in M09 only. Recommend lifting `JwtAuthGuard` into `platform-core` and chaining `JwtAuthGuard → TenantGuard` at the controller level for all M01 routes.

## 9. Database connection pool — 🟦

PrismaService is instantiated once per module (M01 has its own `PrismaModule`). Each `PrismaClient` opens its own pool (default 17 connections). With the unified schema across many modules we could exhaust Postgres’ default `max_connections=100` under burst. Pending fix: consolidate every module onto a single `@Global` Prisma module.

## 10. Worker / API process colocation — 🟦

The BullMQ worker runs inside the API process. For production scale move the worker into its own process / container with `process.env.WORKERS_ONLY=true` and lock CPU to the worker side.

---

**Summary**: zero critical issues at the M01 boundary post-fix. Two high-severity items (storage hardening, JWT chaining) and the rest are non-blocking improvements.
