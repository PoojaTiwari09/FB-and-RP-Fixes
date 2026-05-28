# M08 API Smoke Report

**Date:** 2026-05-27  
**Harness:** `test_case/testm8.py`  
**Base URL:** `http://localhost:3001`

## Results: 12/12 PASS

| # | Test | HTTP | Expected |
|---|------|------|----------|
| 1 | GET `/test/health` | 200 | 200 |
| 2 | POST `/test/smoke` | 201 | 200/201 |
| 3 | GET `/workflows` | 200 | 200 |
| 4 | GET `/workflows/approvals` | 200 | 200 |
| 5 | POST `/workflows/trigger` {} | 400 | 400 |
| 6 | POST `/workflows` (rep) | 403 | 403 |
| 7 | GET `/tasks` | 200 | 200 |
| 8 | GET `/tasks/my-tasks` | 200 | 200 |
| 9 | GET `/tasks/overdue` | 200 | 200 |
| 10 | GET `/plays` | 200 | 200 |
| 11 | M04 `/tasks/my-tasks` | 404 | 404 |
| 12 | GET `/workflows` (tenant B) | 200 | 200 |

## Headers

```
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002
x-user-role: admin | representative
```

## Prerequisites

1. API running: `pnpm --filter api run start`
2. `DATABASE_URL` set; `prisma db push` applied
3. `prisma generate` (stop API first on Windows)

## Not in harness (manual)

- POST create workflow + trigger happy path with Redis
- Notification event with live `SLACK_WEBHOOK_URL`
- Workflow run completion assertion

## Status

**PASS** — all automated backend smoke cases green.
