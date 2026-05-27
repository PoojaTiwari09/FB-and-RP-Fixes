# M04 API Validation Report

**Date:** 2026-05-27  
**Base URL:** `http://localhost:3001` (no `/api/v1` prefix on M04 routes)

## Route map (observed at boot)

| Controller | Prefix | Auth |
|------------|--------|------|
| `M04TestController` | `/m04-test` | Open (health/smoke) |
| `DealBoardController` | `/boards` | `AuthGuard` + session middleware |
| `DealController` | `/deals` | `AuthGuard` |
| `AuthController` | `/auth` | Mixed |
| Settings / export / warnings / summaries | Various | `AuthGuard` |

## Contract validation

| Endpoint | Method | Expected | Observed |
|----------|--------|----------|----------|
| `/m04-test/health` | GET | 200 + `{ success: true }` | PASS |
| `/m04-test/smoke` | POST | 200/201 + orchestration | PASS |
| `/boards` | GET | 200 paginated/list | PASS (with `x-user-id` / `x-role`) |
| `/deals?limit=5` | GET | 200 list | PASS (with headers) |

### Auth contract

- Production path: **express-session** cookie + `SessionUserMiddleware` → `request.user`.
- Smoke path: `x-user-id`, `x-role`, optional `x-email` when no session (dev only).

### DTO layer

- Request/response DTOs under `schemas/` unchanged at HTTP boundary.
- `DealBoardService.mapToResponseDto` aligns entity graphs to `BoardResponseDto` (nested tabs/columns/permissions).

## Frontend integration note

Canonical UI lives under monorepo `apps/web/src/modules/m04-deal-intelligence/`. This pass validated **backend contracts** via `testm4.py`; full browser E2E should run against Vite proxy → `:3001` with session login or matching dev headers.

## Downstream compatibility

- M04 routes are **root-mounted** on the shared API (not namespaced under `/api/v1`), consistent with pre-disable behavior.
- No breaking change to response envelopes for boards/deals in smoke samples.

## Gaps

- HubSpot/sync controllers require env tokens; not exercised in smoke.
- Session-cookie login flow not automated in `testm4.py` (headers used instead).

## How to re-run

```bash
cd test_case
python testm4.py
```
