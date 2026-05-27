# M08 Task Boundary Validation

**Date:** 2026-05-27

## Ownership

| Capability | Owner | Route |
|------------|-------|-------|
| Engage To-Do list | **M08** | `GET /api/v1/sales-engagement/tasks` |
| My tasks | **M08** | `GET /api/v1/sales-engagement/tasks/my-tasks` |
| Overdue tasks | **M08** | `GET /api/v1/sales-engagement/tasks/overdue` |
| Deal-scoped tasks | **M04** | `GET /deals/:dealId/tasks` (unchanged) |

## M04 cleanup

- `TaskManagementController` (`GET /tasks/my-tasks`, `GET /tasks/overdue`) **removed** from `m04-deal-intelligence.module.ts`
- Smoke confirms `GET /tasks/my-tasks` → **404** (no longer mounted at root)

## M08 RBAC

- Representatives: own tasks only (`x-user-id` filter)
- Managers/admins: optional `userId` query filter
- Reassign: manager/admin only

## Event subscriber

`M08TaskEventSubscriber` listens `@OnEvent('call.transcription.completed')` → `handleCallTranscriptionCompleted()` for idempotent AI task creation.

## Smoke

| Test | Result |
|------|--------|
| GET `/tasks` | PASS |
| GET `/tasks/my-tasks` | PASS |
| GET `/tasks/overdue` | PASS |
| M04 `/tasks/my-tasks` | PASS (404) |

## Status

**PASS** — task boundaries clean; no duplicate my-tasks/overdue at M04 root.
