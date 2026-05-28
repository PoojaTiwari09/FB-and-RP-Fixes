# M10 Deep Smoke Report

**Date:** 2026-05-27  
**Harness:** `doc/test_result/doc/test_result/doc/test_result/test_case/testm10.py`

## Tests

| Test | Expected |
|------|----------|
| GET `/test/health` | 200, `success: true` |
| POST `/test/smoke` | Entity engine returns `bestMatch` |
| GET `/test/accounts` | 200 paginated accounts |
| GET `/accounts` (no JWT) | 401/403 |
| GET legacy `/data-compliance` | 200 stub |
| POST `/exports/replay` invalid | 400/401 |

## Run

```bash
cd test_case
python testm10.py
```

Prerequisites: API on `:3001`, `prisma db push`, `DISABLE_REDIS=true` acceptable for smoke.

## Manual export validation

1. Register connection (JWT): `POST /exports/connections`
2. Trigger replay or scheduled export with Redis enabled
3. Verify files under `uploads/m10-exports/{tenant}/{run}/`
4. Download: `GET /exports/runs/{id}/download?dataset=accounts&format=csv`

## Results: 6/6 PASS

| Test | Result |
|------|--------|
| GET `/test/health` | PASS |
| POST `/test/smoke` | PASS — entity engine `bestMatch` |
| GET `/test/accounts` | PASS |
| GET `/accounts` (no JWT) | PASS — 401 |
| GET legacy `/data-compliance` | PASS |
| POST `/exports/replay` invalid | PASS — 401 |

## Status

**PASS** — backend smoke green (2026-05-27).
