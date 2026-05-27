# M09 — Auth & Guard Validation

**Date:** 2026-05-27

## Current architecture

| Component | Location | Role |
|-----------|----------|------|
| `JwtAuthGuard` | `controllers/m09.controller.ts` | Verifies Bearer JWT via `JwtService`, loads user from `M09Repository` |
| `RolesGuard` | `controllers/m09.controller.ts` | Enforces `@Roles('rep' \| 'manager' \| 'org_admin')` |
| `@Public()` | same file | Bypasses JWT for test/health/auth register/login |
| `AuthController` | `controllers/auth.controller.ts` | Register/login with bcrypt + JWT sign |
| `JwtModule.register` | `m09-coaching-training.module.ts` | Signs tokens; **no `fallback_secret`** |

## Removed / avoided

- `fallback_secret` hardcoded default — replaced with `dev-only-m09-jwt-secret-change-me` for local dev only.
- `POST /test/token` no longer emits `alg:none` dummy JWT — uses `JwtService.sign()` with real secret.

## Tests

| Case | Expected | Result |
|------|----------|--------|
| `GET /scenarios` without token | 401 | PASS |
| `POST /auth/login` valid | 201 + token | PASS |
| `POST /auth/login` wrong password | 401 | PASS |
| `GET /scenarios` with Bearer | 200 | PASS |
| `POST /test/token` | Signed JWT | PASS |

## Gap vs target architecture

| Target (audit brief) | Current |
|----------------------|---------|
| `CentralJwtStrategy` / Passport | **Not wired** — M09 uses custom guard |
| `GlobalJwtAuthGuard` (platform-core) | **Not adopted** — M10/M02 use `platform-core/guards/jwt.guard.ts` |
| `TenantGuard` on all routes | **Not on M09** — tenant isolation via JWT `org_id` in services |

## Recommendation

Migrate M09 to `platform-core` JWT + `TenantGuard` in a follow-up pass without breaking M09's `org_id` claim shape (map `tenantId` ↔ `org_id`).
