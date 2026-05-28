# M08 Prisma Workflow Validation

**Date:** 2026-05-27  
**Schema:** `packages/database/prisma/schema.prisma`

## Canonical models added

| Model | Table | Key fields |
|-------|-------|------------|
| `Workflow` | `workflows` | `triggerType`, `triggerConditions`, `definition` |
| `WorkflowRun` | `workflow_runs` | `triggerPayload`, `variables`, `logs` |
| `Task` | `tasks` | Engage To-Do (M08) |
| `Approval`, `WorkflowException`, `IntegrationState`, `WorkflowAuditLog` | mapped tables |
| `SalesPlay`, `PlayEnrollment`, … | play orchestration |

## Legacy fields removed from runtime schema

- `triggerevent` — **not** in `@rri/database` M08 models
- `triggereventpayload` — replaced by `triggerPayload` on `WorkflowRun`

## @map consistency

All M08 workflow models use camelCase Prisma fields with snake_case `@map` aligned to module-local schema.

## Commands

| Command | Result |
|---------|--------|
| `npx prisma validate` | PASS |
| `npx prisma db push` | PASS (tables created) |
| `npx prisma generate` | PASS (after API stopped — Windows EPERM if API holds DLL) |

## Repository alignment

`M08WorkflowRepository.createWorkflowRun` persists `triggerPayload` and mirrors into `variables` when omitted.

## Residual

- Root `final_product/schema.prisma` still has legacy `Workflows`/`WorkflowRuns` with `triggerevent*` — do not use for M08 runtime client.

## Status

**PASS** — zero Prisma drift for M08 workflow/task models in package schema.
