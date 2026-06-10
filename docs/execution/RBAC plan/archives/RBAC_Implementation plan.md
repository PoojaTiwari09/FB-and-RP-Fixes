# RBAC & Tenant Isolation Implementation Plan

This plan outlines the steps required to migrate the R-Revenue Intelligence architecture from the current coarse-grained Supabase auth approach to a highly scalable, Auth0/Clerk-backed system with fine-grained permissions and strict PostgreSQL Row Level Security (RLS). 

## User Review Required

> [!WARNING]
> **Identity Provider Cutover**
> This migration fundamentally changes how users log in and how their sessions are verified. Supabase Auth will be completely replaced with Auth0 (or Clerk). This will require a coordinated release on both the frontend and backend, and all existing user accounts will need to be migrated to the new IdP.

> [!IMPORTANT]
> **Database Role Changes**
> The application will no longer connect to the database as a superuser. We must provision an `app_user` role with strictly `DML` privileges to ensure RLS cannot be bypassed.

## Proposed Changes

### Phase 1: Identity Provider (IdP) Setup and Frontend Integration

This phase sets up the external provider to inject the custom claims required by our backend architecture.

#### [NEW] [Auth0 Configuration Rules / Actions](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/docs/execution/RBAC%20plan/auth0-rules.js)
- Configure the IdP to inject custom claims into every issued JWT.
- Claims to inject: `tenantId`, `role`, and `permissions` (an array of strings like `["task.create", "task.view"]`).
- Implement the IdP Post-Login Action to read these values from user metadata and attach them to the token payload.

#### [MODIFY] [Next.js Auth Integration](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/apps/web/src/pages/api/auth/[...auth0].ts)
- Replace Supabase Auth SDK with `@auth0/nextjs-auth0`.
- Remove custom `/auth/login` and `/auth/register` endpoints.
- Ensure the frontend attaches the Auth0 Access Token (JWT) as a `Bearer` token to all outbound API requests.

---

### Phase 2: Backend JWT Validation (NestJS & FastAPI)

This phase replaces the Supabase token validators with standard JWKS verification.

#### [MODIFY] [JwtStrategy](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/platform-core/strategies/jwt.strategy.ts)
- Install `jwks-rsa` and `passport-jwt`.
- Configure `JwtStrategy` to pull public keys from the Auth0 `.well-known/jwks.json` endpoint.
- Update the `validate()` method to map the custom claims (`sub`, `tenantId`, `role`, `permissions`) into `req.user`.

#### [MODIFY] [FastAPI Auth Dependency](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/apps/api/src/fastapi/auth.py) *(If applicable)*
- Implement `python-jose` to fetch the Auth0 JWKS.
- Build a FastAPI `Depends()` function that verifies the JWT signature, issuer, audience, and expiry before populating the user context.

---

### Phase 3: Granular Authorization (Permissions)

This phase replaces coarse role checks with fine-grained permission checks.

#### [NEW] [PermissionsGuard](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/platform-core/guards/permissions.guard.ts)
- Implement a new NestJS guard that reads the `permissions` array from `req.user` (injected by the IdP).
- Compare the user's permissions against the required permissions for the endpoint.

#### [NEW] [RequirePermissions Decorator](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/platform-core/decorators/permissions.decorator.ts)
- Create a custom `@RequirePermissions('task.create', 'task.view')` decorator.

#### [MODIFY] All Module Controllers (e.g., `m01` - `m11`)
- Replace existing `@Roles()` decorators with `@RequirePermissions()`.
- Example: Change `@Roles(UserRole.MANAGER)` to `@RequirePermissions('team.manage')`.

---

### Phase 4: Database Row Level Security (RLS)

This phase acts as the final safety net, ensuring the database physically blocks cross-tenant data leaks.

#### [NEW] [RLS Migration Script](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/packages/database/prisma/migrations/2026_add_rls_policies.sql)
- Write raw SQL to `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on all business tables (e.g., `tasks`, `opportunities`, `users`).
- Create `tenant_isolation_policy`: `USING (tenant_id = current_setting('app.current_tenant')::text)`.

#### [MODIFY] [Prisma Middleware](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/packages/database/src/prisma.service.ts)
- Implement a Prisma Client extension (`$extends`) to wrap all queries.
- Before executing any business query, open a transaction and execute `SET LOCAL app.current_tenant = req.user.tenantId`.
- Ensure this context is scoped only to the transaction (`SET LOCAL`) to prevent connection pool leaks.

---

## Verification Plan

### Automated Tests
- Run `npm run test:e2e` to verify the new Auth0 JWT decoding works correctly.
- Execute RLS Integration Tests:
  - Connect as `app_user`.
  - Perform a Prisma `findMany()` with `tenant A` context.
  - Assert that data belonging to `tenant B` is not returned, even without a explicit Prisma `where: { tenantId }` clause.

### Manual Verification
- Deploy to a staging environment and verify the Auth0 login flow redirects correctly.
- Attempt to access a protected endpoint using an expired or tampered JWT.
- Attempt to execute an API action without the specific granular permission required (should return `403 Forbidden`).
