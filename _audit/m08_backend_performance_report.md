# M08 Backend Performance Report

**Date:** 2026-05-27

## Smoke latency (local, DISABLE_REDIS=true)

| Endpoint | Typical ms |
|----------|------------|
| GET `/test/health` | ~50–4000 (cold start) |
| GET `/workflows` | 15–35 |
| GET `/tasks/my-tasks` | 15–35 |
| GET `/plays` | 15–20 |

## Bottleneck analysis

| Area | Risk | Mitigation |
|------|------|------------|
| Workflow trigger | Sync step loop in worker | Already async via queue |
| Task list | Full table scan per tenant | Index `(tenantId, userId, status, dueDate)` — present |
| Play dashboard | Multiple enrollment joins | Paginate + selective includes |
| Notification | Sequential slack+email events | Fire-and-forget; failures non-blocking |
| In-memory aggregation | N/A in M08 backend | — |

## Queue

- Idempotent `jobId` prevents duplicate run execution storms
- Exponential backoff limits retry storms (3 attempts)

## Recommendations

1. Enable Redis in staging; load-test `execute-workflow-run` concurrency
2. Add SQL `LIMIT` on audit-log and exception list endpoints
3. Batch notification dispatch for high-volume enrollments

## Status

**Adequate** for pilot; no blocking performance defects in smoke pass.
