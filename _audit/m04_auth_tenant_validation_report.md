# M04 Auth & Tenant Validation Report

**Date:** 2026-05-27

## Auth architecture (M01 alignment)

| Component | Role |
|-----------|------|
| `SessionUserMiddleware` | Loads `request.user` from session id via `AuthService.getUserBySession` |
| `AuthGuard` | Requires `request.user`; throws 401 if absent |
| `AuthService` | bcryptjs password verify; session create/destroy |
| Dev smoke bypass | `x-user-id`, `x-role`, `x-email` when no session cookie |

### Session vs headers

- **Production expectation:** Login → session cookie → middleware populates user → guards pass.
- **Smoke/test:** Demo headers match seeded user `00000000-0000-0000-0000-000000000004` (`MANAGER`).

### Demo credentials (memory seed)

- Email: `manager@dealboards.demo`
- Password: `password`

## RBAC

- `AuthGuard` checks authenticated user; role checks on board admin paths via `DealBoardRepository.hasAdminAccess`.
- Board publish/unpublish/delete require admin access on repository layer.

## Tenant isolation

| Mechanism | Status |
|-----------|--------|
| `M04_DEV_TENANT` env default in memory store | Seeded data scoped by tenant id on entities |
| Cross-tenant reads in smoke | Not fully automated — recommend adding negative test with wrong `x-tenant-id` when Prisma wired |
| User/Session models | Single `models.ts` source — no duplicate Prisma vs TypeORM entity |

## Model collision resolution

- **User**, **Session**, **UserPreference**: consolidated in `entities/models.ts`; legacy `*.entity.ts` files re-export.
- Compatible with M01 session concepts at HTTP layer (express-session); not yet using unified `packages/database` User table.

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| A1 | Info | Dev header bypass must not ship enabled in production without explicit env gate |
| A2 | Low | Full tenant-negative smoke not in `testm4.py` yet |
| A3 | Info | Ephemeral memory DB — tenant isolation proven at query-filter level in repos, not DB RLS |

## Recommendations

1. Gate header bypass: `if (process.env.M04_DEV_AUTH_HEADERS === 'true')`.
2. Add `testm4.py` case: request without auth → expect 401 on `/boards`.
3. On Prisma cutover, enforce `tenantId` on every `where` clause in repositories.
