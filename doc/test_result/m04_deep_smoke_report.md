# M04 Deep Smoke Report

**Date:** 2026-05-27  
**Harness:** `doc/test_result/doc/test_result/doc/test_result/test_case/testm4.py`  
**API:** `http://localhost:3001`

## Results: 4/4 PASS

| Phase | Test | Result |
|-------|------|--------|
| A | GET `/m04-test/health` | PASS |
| B | POST `/m04-test/smoke` | PASS |
| C | GET `/boards` (auth headers) | PASS |
| D | GET `/deals?limit=5` (auth headers) | PASS |

## Flows verified

- API boot with M04 module enabled
- NestJS → `M04EntityRepository` → in-memory store
- Auth guard satisfied via `SessionUserMiddleware` dev headers
- Board list and deal list JSON responses (200)

## Flows not yet in harness

- CRUD create/update/delete on boards/deals
- Pagination edge cases (empty page, invalid sort)
- Publish/unpublish board
- Session-cookie login E2E
- Tenant mismatch / 403 cases
- HubSpot sync queue
- Frontend Vite → API proxy

## How to run

```bash
# Ensure API on :3001 with DATABASE_URL set (Redis optional off)
cd test_case
python testm4.py
```

## Environment

- `M04_API_URL` — optional override (default `http://localhost:3001`)
- Demo headers: `x-user-id=00000000-0000-0000-0000-000000000004`, `x-role=MANAGER`

## Comparison to M03

M03 harness is 9-phase (health, workspace, query, research, brief, tenant negative). M04 harness is intentionally smaller for first re-enable; expand per `doc/test_result/doc/test_result/test_case/test4.md` when added.
