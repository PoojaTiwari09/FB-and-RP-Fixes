# M08 Backend Fix Log

**Date:** 2026-05-27

## Schema / Prisma

- Added M08 models to `packages/database/prisma/schema.prisma` (Workflow, WorkflowRun with `triggerPayload`, Task, plays, approvals, etc.)
- `prisma db push` applied tables to local Postgres

## Queues / workers

- Added `m08-workflow-runs-queue` + `WorkflowRunsWorker`
- Added `m08-queue.constants.ts` (avoid circular imports)
- `workflow.service.ts` enqueues `execute-workflow-run` instead of sync-only execution

## Notifications

- Added `PlatformNotificationService` + `NotificationEventConsumer`
- Registered `PlatformNotificationModule` in AppModule
- M08 `triggerOutreachAlerts` → `notification.alert.requested` events
- Workflow `email_compose` → event emission (no direct SMTP)

## API / routing

- Canonical prefix: `api/v1/sales-engagement` (tasks, workflows, plays, test)
- Workflow controller route order fixed; added `GET :id/runs`
- Task endpoints: `my-tasks`, `overdue`
- `M08TestController` for smoke health

## M04 boundary

- Removed `TaskManagementController` from M04 module registration

## Events

- `M08TaskEventSubscriber` for `call.transcription.completed`

## Testing

- Added `test_case/testm8.py` — 12/12 PASS

## Module file fix

- Added missing `M08TestController` import (boot blocker)
