# M07 Deep Smoke Report

**Date:** 2026-05-27  
**Harness:** `doc/test_result/doc/test_result/doc/test_result/test_case/testm7.py`  
**API:** `http://localhost:3001`

## Results: 5/5 PASS

| Test | Result | Notes |
|------|--------|-------|
| GET `/api/v1/revenue-dashboards` (health) | PASS | `module: m07-revenue-dashboards`, `message: OK` |
| POST `/api/v1/revenue-dashboards` | PASS | 201 Accepted |
| GET `/widgets/catalog` (no JWT) | PASS | 401 as expected |
| GET `/sample-builder` | PASS | 200 config payload |
| GET `/datasets` (no JWT) | PASS | 401 as expected |

## Headers used

- `x-tenant-id`: `00000000-0000-0000-0000-000000000001` (override via `M07_TENANT`)
- `x-user-id`: `00000000-0000-0000-0000-000000000002` (override via `M07_USER`)

## Not covered in harness (manual / CI follow-up)

- Next.js `/api/dashboards` routes (require web server + DB)
- JWT-authenticated KPI/widget create flows
- Share token round-trip

## Run

```bash
cd test_case
python testm7.py
```

Optional: `M07_API_URL=http://localhost:3001 python testm7.py`

## Status

**PASS** — Nest M07 module mounted and auth boundaries behave as designed.
