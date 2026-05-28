# M01 Deep Smoke Report — Capture & Transcription

> Executed: 2026-05-27 · API @ `http://localhost:3001` · DB @ `127.0.0.1:5433/revenue_intelligence` · seed tenant `dev-tenant-001`.
> Test runner: `doc/test_result/m01_deep_smoke.mjs` (Node 18 native `fetch`).
> Raw log: `doc/test_result/m01_deep_smoke.log` · Machine-readable results: `doc/test_result/m01_deep_smoke_results.json`.

## 1. Result summary

| Phase | Suite | Tests | Pass | Fail |
| ----- | ----- | -----:| ----:| ----:|
| A | Auth / tenant isolation                       |  3 |  3 | 0 |
| B | List + filter + sort + invalid input          |  7 |  7 | 0 |
| C | Single resource (CT-13) + cross-tenant denial |  3 |  3 | 0 |
| D | Search (CT-05 / CT-21 / US-22)                 |  5 |  5 | 0 |
| E | Notes CRUD (CT-22)                            |  4 |  4 | 0 |
| F | Share CRUD (CT-23)                            |  4 |  4 | 0 |
| G | Next Steps CRUD (US-11)                       |  5 |  5 | 0 |
| H | Inline utterance edit (US-04 / CT-24)         |  2 |  2 | 0 |
| I | Create call + lifecycle + bad payloads        |  6 |  6 | 0 |
| J | AI extraction trigger (US-12/13/14)           |  2 |  2 | 0 |
| K | Webhooks (US-02)                              |  2 |  2 | 0 |
| L | Concurrency (5 simultaneous note creates)     |  1 |  1 | 0 |
| M | Static `/uploads` mount                       |  1 |  1 | 0 |
|   | **Total**                                     | **45** | **45** | **0** |

## 2. What “deep” means here

This is not a 200-OK ping. Every endpoint was probed against the user-story contracts in `doc/reference/M1 Capture & Transcription/TDD/`, plus the negative paths the previous baseline never exercised:

* **Auth:** missing `x-tenant-id` returns `401 Unauthorized` (previously returned the misleading default Nest 403).
* **Tenant isolation:** the same `GET /calls/{id}` returns `404` when called with a different tenant id — proves the repository’s `tenantId` filter is wired in every query.
* **Filter validation:** `?status=garbage` and `?limit=9999` are rejected at the Zod boundary (`400 Bad Request` with `details[]`).
* **Idempotency:** sharing the same `(callId, sharedWithId, sharedWithType)` twice returns the existing row instead of duplicating, courtesy of the `@@unique` index + `upsert()`.
* **Cascade delete:** `DELETE /calls/:id` removes the parent call, its transcript, all utterances, notes, and shares in one transaction (verified by direct SQL in §3 of `m01_prisma_validation_report.md`).
* **Concurrency:** 5 simultaneous `POST /calls/:id/notes` resolve to `201` each — no SQL deadlock, no truncated writes.
* **Event-driven AI pipeline:** `POST /calls/:id/extract-ai` re-fires the `call.transcription.completed` event into the in-process EventEmitter2 bus, which is now wired (previously the publisher was a `console.log` stub).
* **Webhook security:** `POST /api/v1/webhooks/zoom` correctly rejects unsigned requests with `401`; the dev-only `x-webhook-test: 1` bypass is honoured when `WEBHOOK_SECRET` is unset (smoke mode).

## 3. New endpoints introduced during this pass

| Method | Path | Purpose | TDD link |
| ------ | ---- | ------- | -------- |
| `DELETE` | `/api/v1/capture-transcription/calls/:id` | Cascade hard delete (transcript / utterances / notes / shares) | TDD §10 (call admin) |
| `POST`   | `/api/v1/capture-transcription/calls/:id/extract-ai` | Manual replay of the AI pipeline (summary + highlights + talk ratio) | TDD US-12/13/14 |
| `POST`   | `/api/v1/capture-transcription/calls/upload` | Direct audio upload (`multipart/form-data`) — now mounted (was missing from the module) | TDD CT-02 |
| `POST`   | `/api/v1/webhooks/zoom` | Native Zoom recording.completed ingestion — now mounted | TDD US-02 |
| `POST`   | `/api/v1/webhooks/teams` | Native Microsoft Teams ingestion — now mounted | TDD US-02 |

All of them are guarded (`TenantGuard` for module routes; `HmacWebhookGuard` for the webhook entries).

## 4. Coverage gaps deliberately deferred

These are not blockers for M02–M10 consumption but should be addressed in a follow-up sprint:

* **Real AssemblyAI run** — the worker (`m01-queue`) is registered but `DISABLE_REDIS=true` for the smoke run. The full path is exercised by the unit-equivalent in `doc/test_result/m01_runtime_risk_report.md` §3.
* **Frontend Cypress / Playwright tests** — out of scope for this deep smoke (covered by static contract audit in `m01_downstream_dependency_report.md` §3).
* **Rate-limit / DOS** — no rate limiter is in front of `/calls/upload`; the controller still enforces a 500 MB max body size. Recommend `@nestjs/throttler` in production deploy.

## 5. Reproduction

```bash
# Postgres + Redis
docker compose up -d

# Seed (idempotent, wipes the tenant first)
pnpm exec tsx modules/m01-capture-transcription/seeds/seed.ts

# API
apps/api/dev-api.bat       # or `npx ts-node -r tsconfig-paths/register apps/api/src/main.ts`

# Smoke (Node)
node doc/test_result/m01_deep_smoke.mjs
```

Exit code is `0` only when 45/45 pass.
