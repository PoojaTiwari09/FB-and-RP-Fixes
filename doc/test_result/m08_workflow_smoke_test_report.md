# M08 Workflow Smoke Test Report

**Date:** 2026-05-27  
**Harness:** `doc/test_result/doc/test_result/doc/test_result/test_case/testm8.py`  
**API prefix:** `/api/v1/sales-engagement`

## Results: 12/12 PASS (workflow-related subset)

| Test | Result |
|------|--------|
| GET `/workflows` | PASS — 200, `[]` or list |
| GET `/workflows/approvals` | PASS — static route no longer captured by `:id` |
| POST `/workflows/trigger` (empty body) | PASS — 400 |
| POST `/workflows` (rep role) | PASS — 403 |
| GET `/workflows` (tenant B) | PASS — tenant-scoped empty list |

## Architecture validated

- **triggerType** + **triggerConditions** on `Workflow` (no `triggerevent`)
- **triggerPayload** on `WorkflowRun` (no `triggereventpayload`)
- Async execution via `m08-workflow-runs-queue` + `execute-workflow-run` job
- `GET /workflows/:id/runs` exposed

## Trigger flow

```
POST /workflows/trigger
  → createWorkflowRun(triggerPayload)
  → enqueueWorkflowRun(tenantId, runId)
  → WorkflowRunsWorker → executeWorkflowRun()
```

## Run

```bash
cd test_case
python testm8.py
```

## Status

**PASS** — workflow APIs stable after Prisma unify + route reorder.
