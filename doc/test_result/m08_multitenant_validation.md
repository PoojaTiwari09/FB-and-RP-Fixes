# M08 Multi-Tenant Validation

**Date:** 2026-05-27

## Enforcement mechanism

- Header: `x-tenant-id` on all M08 controllers
- Prisma queries: `where: { tenantId }` on workflows, tasks, runs, approvals

## Smoke tests

| Test | Result |
|------|--------|
| Tenant A workflows GET | PASS — 200 |
| Tenant B workflows GET | PASS — 200, isolated empty set |
| Cross-tenant header forgery | Repositories scope by header tenantId |

## Queue isolation

- Job payload includes `tenantId`
- `executeWorkflowRun` loads run with `findFirst({ id, tenantId })`

## Notification isolation

- `notification.alert.requested` envelope includes `tenantId`
- Platform service logs tenant on dispatch

## Gaps (follow-up)

- Share-token style global scans not applicable to M08 backend
- Add integration test: create workflow in tenant A, assert tenant B cannot `GET :id`

## Status

**PASS** for header-scoped API reads; no cross-tenant leakage observed in smoke.
