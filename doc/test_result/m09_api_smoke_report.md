# M09 — API Smoke Report

**Base:** `/api/v1/coaching-training`  
**Harness:** `test_case/testm9.py`  
**Result:** 15 / 15 PASS

## Routes exercised

| Method | Path | Auth | Result |
|--------|------|------|--------|
| GET | `/test/health` | Public | PASS |
| GET | `/` | Public | PASS |
| POST | `/test/seed` | Public | PASS |
| POST | `/test/smoke` | Public | PASS |
| POST | `/auth/login` | Public | PASS |
| POST | `/auth/login` (bad password) | Public | 401 PASS |
| GET | `/scenarios` | JWT | PASS |
| GET | `/scenarios` | None | 401 PASS |
| POST | `/sessions/start` | JWT (rep) | PASS |
| POST | `/sessions/send-message` | JWT (rep) | PASS |
| POST | `/sessions/end` | JWT (rep) | PASS |
| GET | `/sessions/:id` | JWT | PASS |
| GET | `/sessions/voices` | Public | PASS |
| POST | `/test/token` | Public | PASS |

## Full route inventory (registered)

~50 routes across: `auth`, `sessions`, `scenarios`, `coaching`, `training`, `analytics`, `test` (see `m09.controller.ts` route logs on boot).

## Not exercised in this smoke pass

- Manager-only analytics export paths
- Multipart `scenarios/transcribe`, `analyze-audio`
- `training/assignments` CRUD (in-memory only; no regression signal)
- Voice upload `send-voice`

These remain **integration-ready** but untested in this backend-only pass.
