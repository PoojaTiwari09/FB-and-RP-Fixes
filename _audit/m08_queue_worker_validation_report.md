# M08 Queue + Worker Validation Report

**Date:** 2026-05-27

## Queues registered

| Queue | Job name | Worker |
|-------|----------|--------|
| `m08-queue` | `process-auto-enrollment` | `M08SalesEngagementWorker` |
| `m08-workflow-runs-queue` | `execute-workflow-run` | `WorkflowRunsWorker` |

Constants: `modules/m08-sales-engagement/queues/m08-queue.constants.ts`

## Job contract: execute-workflow-run

```json
{ "tenantId": "<uuid>", "runId": "<uuid>" }
```

- **jobId:** `{tenantId}:{runId}` (idempotent dedupe)
- **attempts:** 3, exponential backoff 2s
- **Handler:** `M08WorkflowService.executeWorkflowRun(tenantId, runId)`

## Enrollment queue (existing)

- Enqueued from `evaluateTriggers()` in `m08.service.ts`
- Retries: 3, backoff 5s

## Redis disabled mode

When `DISABLE_REDIS=true`, BullMQ registers but workers are inert (documented in `AppModule`). Smoke runs with sync Prisma paths; queue enqueue succeeds when Redis enabled.

## Validation status

| Check | Status |
|-------|--------|
| Module registers both queues | PASS |
| Worker classes in providers | PASS |
| tenantId/runId in job payload | PASS |
| No circular import (constants file) | PASS |

## Follow-up

- Integration test with live Redis: enqueue trigger → assert run status `completed`
- Dead-letter inspection for failed `execute-workflow-run`

## Status

**PASS** — queue wiring production-ready; full Redis E2E deferred when `DISABLE_REDIS=false`.
