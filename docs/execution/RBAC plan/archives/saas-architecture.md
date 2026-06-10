# Multi-Tenant SaaS Architecture Guide
### Production-Grade | Phase 1 (No Redis / No AWS) + Phase 2 Upgrade Map

> **How to use this document:** Follow sections in order during implementation. Each section describes *what* to build and *why*, not how to code it. Code patterns are in a separate reference doc.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Authentication Flow](#3-authentication-flow)
4. [JWT Structure & Token Lifecycle](#4-jwt-structure--token-lifecycle)
5. [API Request Lifecycle](#5-api-request-lifecycle)
6. [Authorization Layers (RBAC + Permissions + Ownership)](#6-authorization-layers)
7. [Multi-Tenancy Design](#7-multi-tenancy-design)
8. [PostgreSQL Row-Level Security (RLS)](#8-postgresql-row-level-security)
9. [Prisma Integration with RLS](#9-prisma-integration-with-rls)
10. [FastAPI / AI-LLM Service Security](#10-fastapi--ai-llm-service-security)
11. [Audit Logging](#11-audit-logging)
12. [Tenant Lifecycle Management](#12-tenant-lifecycle-management)
13. [Rate Limiting](#13-rate-limiting)
14. [Error Handling & Information Leakage](#14-error-handling--information-leakage)
15. [Security Checklist (Must Ship Phase 1)](#15-security-checklist--must-ship-phase-1)
16. [Phase 2 Upgrade Map](#16-phase-2-upgrade-map)
17. [Database Schema Reference](#17-database-schema-reference)
18. [Roles & Permissions Reference](#18-roles--permissions-reference)
19. [Environment Variables Reference](#19-environment-variables-reference)
20. [Architecture Decision Log](#20-architecture-decision-log)

---

## 1. System Overview

This is a multi-tenant CRM SaaS application. Multiple independent customer organizations (tenants) share the same application infrastructure. Each tenant's data must be fully isolated from every other tenant at all times.

### High-Level Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                     Next.js Frontend                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTPS + Bearer JWT
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     IDENTITY PROVIDER                           │
│          Auth0 / Clerk / Keycloak (OIDC-compliant)              │
│  Issues signed JWT access tokens with tenant + user context     │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Signed JWT (RS256)
                   ┌────────┴────────┐
                   ▼                 ▼
        ┌─────────────────┐  ┌──────────────────┐
        │   NestJS API    │  │  FastAPI LLM/RAG  │
        │  (REST APIs)    │  │    (AI APIs)      │
        └────────┬────────┘  └────────┬──────────┘
                 │                    │
                 └──────────┬─────────┘
                            ▼
              ┌─────────────────────────┐
              │  PostgreSQL Database    │
              │  + Row-Level Security   │
              │  + pgvector (RAG)       │
              └─────────────────────────┘
```

### Key Design Principles

- **Zero trust on client inputs.** The server never trusts headers like `x-tenant-id`, `x-user-id`, or `x-user-role`. All identity context comes exclusively from the verified JWT.
- **Defense in depth.** Security is enforced at three independent layers: application guards, business logic, and database RLS. A bug in any one layer does not expose data.
- **Tenant isolation is non-negotiable.** It must be impossible for one tenant to see another's data, even due to a developer error.
- **Explicit over implicit.** Every request must carry its auth context. No session state, no shared globals.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js | Authenticates via IdP SDK |
| REST API | NestJS | Verifies JWT, enforces RBAC |
| AI/LLM API | FastAPI | Independently verifies JWT |
| Database | PostgreSQL | RLS enforced at DB level |
| ORM | Prisma | Wraps all queries with tenant context |
| Identity Provider | Auth0 / Clerk / Keycloak | OIDC-compliant, issues JWTs |
| Vector Search | pgvector (PostgreSQL extension) | No extra infra in Phase 1 |
| Rate Limiting | NestJS Throttler (in-memory) | Redis-backed in Phase 2 |
| Audit Logging | PostgreSQL (async write) | Queue-backed in Phase 2 |

---

## 3. Authentication Flow

### 3.1 Initial Login

```
1.  User opens the frontend app.
2.  Frontend redirects to the Identity Provider (IdP) login page.
3.  User authenticates with the IdP (username/password, SSO, MFA).
4.  IdP issues:
      - Access Token (JWT, short-lived: 10 minutes)
      - Refresh Token (long-lived: 7 days, rotated on every use)
      - ID Token (for user profile display only)
5.  Frontend stores tokens in memory (not localStorage, not cookies unless HttpOnly).
6.  Frontend attaches the Access Token to every API request as:
      Authorization: Bearer <access_token>
```

### 3.2 Token Refresh Flow

```
1.  Frontend detects the access token is near expiry (or receives a 401 response).
2.  Frontend calls the IdP's token refresh endpoint with the Refresh Token.
3.  IdP validates the Refresh Token.
4.  IdP issues a new Access Token + rotates the Refresh Token.
5.  Frontend stores the new tokens.
6.  If Refresh Token is invalid/expired → redirect user to login.
```

### 3.3 Logout Flow

```
1.  User clicks logout.
2.  Frontend calls the IdP's logout endpoint (this invalidates the Refresh Token at source).
3.  Frontend clears tokens from memory.
4.  Frontend redirects to the login page.
```

> **Why this matters:** Since we don't have Redis for a token blocklist in Phase 1, calling the IdP logout endpoint is the only way to immediately invalidate a session. The 10-minute access token TTL limits the blast radius if a token is compromised.

### 3.4 What the Frontend MUST NOT Do

- Never send `x-tenant-id`, `x-user-id`, or `x-user-role` headers. The backend actively rejects these in production.
- Never store access tokens in `localStorage` (XSS risk). Use in-memory or `HttpOnly` cookies.
- Never use the Access Token for anything other than API calls (not for user display — use the ID Token).

---

## 4. JWT Structure & Token Lifecycle

### 4.1 JWT Payload (Access Token)

```json
{
  "sub": "user-123",
  "tenantId": "tenant-001",
  "role": "sales_rep",
  "permissions": [
    "task.view",
    "task.update"
  ],
  "iss": "https://your-idp.auth0.com/",
  "aud": "https://api.yourapp.com",
  "exp": 1718000000,
  "iat": 1717999400
}
```

### 4.2 Field Responsibilities

| Field | Source | Used By | Notes |
|---|---|---|---|
| `sub` | IdP | NestJS, FastAPI | Canonical user identifier |
| `tenantId` | IdP (set during user creation) | NestJS, FastAPI, RLS | Never from request body |
| `role` | IdP (set during user creation) | NestJS Guards | Coarse-grained access |
| `permissions` | IdP (set during user creation) | NestJS Guards | Fine-grained access |
| `iss` | IdP | Both services (verify) | Prevents token spoofing |
| `aud` | IdP | Both services (verify) | Prevents token replay across services |
| `exp` | IdP | Both services (verify) | 10-minute TTL |

### 4.3 Token Verification Requirements

Every service that receives a JWT **must** verify all of the following before trusting any claim:

- Signature is valid (using the IdP's public JWKS endpoint)
- Algorithm is `RS256` — never accept `none` or `HS256`
- `iss` matches the expected IdP issuer URL
- `aud` matches the service's own registered audience
- `exp` has not passed
- `tenantId` claim is present and non-empty

If any check fails → return `401 Unauthorized`. No exceptions.

---

## 5. API Request Lifecycle

Every request through NestJS goes through the following layers in order. A failure at any layer terminates the request immediately.

```
Incoming Request
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 1: Header Rejection Middleware               │
│  Rejects any request containing:                   │
│  x-tenant-id, x-user-id, x-user-role headers       │
│  → 400 Bad Request if present                       │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 2: JWT Auth Guard                            │
│  - Extracts Bearer token from Authorization header  │
│  - Verifies signature, issuer, audience, expiry     │
│  - Populates request.user with verified JWT claims  │
│  → 401 if missing or invalid token                  │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 3: Tenant Context Injection                  │
│  - Reads tenantId, userId, role from request.user   │
│  - Populates TenantContext (request-scoped service) │
│  - This object is injected everywhere DB is used    │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 4: Tenant Status Guard                       │
│  - Fetches tenant record from DB                    │
│  - Checks tenant.status === 'ACTIVE'                │
│  → 403 if tenant is suspended or deleted            │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 5: Rate Limit Check                          │
│  - Checks request count per tenant per time window  │
│  → 429 Too Many Requests if limit exceeded          │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 6: RBAC / Permissions Guard                  │
│  - Checks role and permissions from TenantContext   │
│  - Compares against @RequirePermissions decorator   │
│  → 403 Forbidden if insufficient permissions        │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 7: Controller / Business Logic               │
│  - Ownership checks for specific records            │
│  - Calls service layer with TenantContext           │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 8: Prisma + RLS                              │
│  - withTenantContext() sets RLS session variables   │
│  - DB policies enforce isolation automatically      │
│  - Even a raw SELECT * returns only tenant's rows   │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  RESPONSE: Global Exception Filter applied          │
│  Strips stack traces, SQL errors before response    │
└─────────────────────────────────────────────────────┘
```

---

## 6. Authorization Layers

Authorization is enforced at three independent levels. All three must work together.

### 6.1 Layer A — Role-Based Access Control (RBAC)

Roles control which endpoints a user can reach.

| Role | Access Level |
|---|---|
| `ADMIN` | Full tenant-wide access. Can manage users, settings, all records. |
| `MANAGER` | Team-wide access. Can view team reports, reassign tasks, manage team members. |
| `SALES_REP` | Own records only. Can view and update their assigned tasks and opportunities. |

**Rules:**
- Roles are assigned when a user is added to a tenant. They are stored in the IdP and embedded in the JWT.
- A role check is a coarse gate — "can this role type even reach this endpoint?"
- Roles alone are not sufficient for fine-grained control. Use permissions for that.

### 6.2 Layer B — Permission-Based Authorization

Permissions control what specific actions a user can perform within an endpoint they can reach.

#### Core Permission Set (Phase 1)

| Resource | Permissions |
|---|---|
| Tasks | `task.view`, `task.create`, `task.update`, `task.delete`, `task.assign` |
| Opportunities | `opportunity.view`, `opportunity.create`, `opportunity.update`, `opportunity.delete` |
| Customers | `customer.view`, `customer.create`, `customer.update`, `customer.delete` |
| Reports | `report.view`, `report.export` |
| Users | `user.view`, `user.invite`, `user.manage` |
| Settings | `settings.view`, `settings.manage` |

#### Default Role → Permission Mapping

| Permission | ADMIN | MANAGER | SALES_REP |
|---|:---:|:---:|:---:|
| `task.view` | ✅ | ✅ | ✅ |
| `task.create` | ✅ | ✅ | ✅ |
| `task.update` | ✅ | ✅ | ✅ (own only) |
| `task.delete` | ✅ | ✅ | ❌ |
| `task.assign` | ✅ | ✅ | ❌ |
| `report.view` | ✅ | ✅ | ❌ |
| `report.export` | ✅ | ✅ | ❌ |
| `user.invite` | ✅ | ✅ | ❌ |
| `user.manage` | ✅ | ❌ | ❌ |
| `settings.manage` | ✅ | ❌ | ❌ |

### 6.3 Layer C — Ownership-Based Authorization

Even when a user has permission to access a resource type, they may not be able to access a specific record.

| Role | What They Can Access |
|---|---|
| `ADMIN` | All records within the tenant |
| `MANAGER` | Records belonging to their direct team members |
| `SALES_REP` | Only records assigned to them personally |

**Implementation rule:** Ownership checks happen in the service/business logic layer, after guard checks pass. The check compares `record.assignedTo` (or `record.createdBy`) against the `userId` from TenantContext. Never from the request body.

**Example:** Rep A and Rep B are both in Tenant-001. Rep A must never see Rep B's tasks, even though they share the same `tenant_id`. The RLS tenant policy alone does not prevent this — ownership checks in the application layer enforce it.

### 6.4 Authorization Decision Flow

```
Request arrives at Controller
         │
         ▼
Is the user's role allowed on this endpoint?  (Layer A)
         │ NO → 403
         │ YES
         ▼
Does the user have the required permission?   (Layer B)
         │ NO → 403
         │ YES
         ▼
Does the user own / have access to this       (Layer C)
specific record?
         │ NO → 403 (or 404 — see note below)
         │ YES
         ▼
Proceed to DB query (RLS provides final backstop)
```

> **Note on 403 vs 404:** For ownership failures, returning `404 Not Found` is often preferable over `403 Forbidden` to avoid confirming that a record exists. Choose based on the sensitivity of the resource.

---

## 7. Multi-Tenancy Design

### 7.1 Approach: Row-Level Multi-Tenancy

All tenants share the same database, same schema, and same tables. Every tenant-owned table has a `tenant_id` column. Isolation is enforced by:

1. Application-level filtering (Prisma queries always include `WHERE tenant_id = ?`)
2. Database-level RLS policies (automatic, even on raw queries)

This approach was chosen over schema-per-tenant because it scales better for large numbers of tenants and avoids migration complexity.

### 7.2 Tables That Require `tenant_id`

Every table that stores business data must have a `tenant_id` column. Tables that are system-wide (e.g., the `tenants` table itself) do not need one.

**Business tables (must have tenant_id):**
- `users`
- `tasks`
- `opportunities`
- `customers`
- `contacts`
- `documents`
- `audit_logs`
- Any future business entity

**System tables (no tenant_id):**
- `tenants`
- `tenant_settings`

### 7.3 Tenant Data Flow Rule

```
┌──────────────────────────────────────────────┐
│  RULE: tenantId must ONLY come from the JWT  │
│                                              │
│  ✅ Correct: tenantId from TenantContext      │
│  ❌ Wrong:   tenantId from request.body       │
│  ❌ Wrong:   tenantId from request.params     │
│  ❌ Wrong:   tenantId from request.headers    │
└──────────────────────────────────────────────┘
```

This rule applies to NestJS controllers, services, repositories, and FastAPI routes without exception.

---

## 8. PostgreSQL Row-Level Security

### 8.1 What RLS Does

RLS is the last line of defense. When correctly configured, even a query with no `WHERE` clause returns only the rows belonging to the current tenant. A developer mistake in application code cannot leak cross-tenant data.

### 8.2 Database Role Setup (Required, Zero Cost)

Two separate PostgreSQL roles must be created and maintained:

| Role | Purpose | Permissions | Notes |
|---|---|---|---|
| `app_migrator` | Runs Prisma migrations | DDL + DML, can bypass RLS | Used only by migration scripts, never by the app |
| `app_user` | Used by the running NestJS/FastAPI app | DML only (SELECT, INSERT, UPDATE, DELETE) | `BYPASSRLS` must NEVER be granted |

**Connection strings:**
- `DATABASE_URL` in migration scripts → connects as `app_migrator`
- `DATABASE_URL` in app runtime → connects as `app_user`

These must be different environment variables pointing to different credentials.

### 8.3 RLS Configuration Per Table

For every business table, three things must be done:

1. **Enable RLS** — by default, RLS is off.
2. **Force RLS** — ensures even table owners are subject to policies.
3. **Create policies** — define what each user context can see.

Tables without RLS enabled are a critical security gap. Maintain a checklist (see Section 15).

### 8.4 Policy Types to Implement

#### Policy 1: Tenant Isolation (all business tables)
Every query is automatically scoped to the current tenant. Set via `SET LOCAL app.current_tenant` at the start of every transaction.

#### Policy 2: Ownership Isolation (records assigned to users)
For tables like `tasks` and `opportunities`, additional policy restricts access based on `assigned_to` for `SALES_REP` role. Set via `SET LOCAL app.current_role` and `SET LOCAL app.current_user_id`.

#### Policy 3: Manager Team Access (future)
Managers see records belonging to their direct reports. Requires a `team_members` relationship. Can be added in Phase 2 without changing the policy framework.

### 8.5 Session Variable Scoping (Critical)

Always use `SET LOCAL` (transaction-scoped), **never** `SET` (session-scoped).

| Command | Scope | Safe with connection pools? |
|---|---|---|
| `SET LOCAL app.current_tenant = ?` | Transaction only | ✅ Yes |
| `SET app.current_tenant = ?` | Session-wide | ❌ No — can leak to next request in pool |

### 8.6 RLS Testing Requirements

RLS policies must be tested in CI as integration tests (not unit tests — they require a real PostgreSQL instance):

- Connect to the test DB as `app_user` (not a superuser)
- Set a tenant context for Tenant A
- Assert that queries return only Tenant A's data
- Assert that Tenant B's data returns zero rows
- Assert that querying as Rep A does not return Rep B's tasks

These tests must run on every PR that touches a migration or RLS policy.

---

## 9. Prisma Integration with RLS

### 9.1 The Core Rule

**Every single database operation must go through the `withTenantContext` wrapper.** This wrapper sets the RLS session variables before executing any query. Direct Prisma calls that bypass this wrapper will not have RLS context and may behave incorrectly.

This is enforced by:
- Code review checklist (no Prisma calls outside the wrapper)
- A shared `PrismaService` that exposes `withTenantContext` as the only entry point for queries

### 9.2 What `withTenantContext` Does

```
withTenantContext(tenantContext, queryFn)
  │
  ├── Opens a Prisma transaction
  ├── Executes: SET LOCAL app.current_tenant = '<tenantId>'
  ├── Executes: SET LOCAL app.current_user_id = '<userId>'
  ├── Executes: SET LOCAL app.current_role = '<role>'
  └── Executes queryFn(tx) — your actual query
      │
      └── RLS policies are now active for all queries in this transaction
```

### 9.3 Prisma and RLS Migrations

Prisma's `migrate` command does not know about RLS policies. RLS policies are defined in raw SQL and managed separately.

**Structure:**

```
prisma/
  migrations/
    20240101_init/
      migration.sql          ← Prisma-managed (schema)
    20240101_rls_policies/
      migration.sql          ← Manually written (RLS SQL)
  schema.prisma
```

Always run RLS policy migrations after schema migrations. Document this in the deployment runbook.

### 9.4 What Prisma Cannot Do (Must Be Handled Manually)

- Enable/disable RLS on tables
- Create RLS policies
- Manage DB roles and grants
- Set connection-scoped variables

All of the above are raw SQL operations managed outside of Prisma's schema.

---

## 10. FastAPI / AI-LLM Service Security

### 10.1 JWT Verification (Independent)

FastAPI must verify the JWT independently. It must not trust any context forwarded from NestJS. The verification requirements are identical (see Section 4.3).

NestJS and FastAPI use the **same IdP** but are registered as **separate API audiences**. A token issued for the REST API (`aud: rest-api`) must be rejected by FastAPI (`aud: ai-api`). Configure both services with their own audience value.

### 10.2 The Request Lifecycle in FastAPI

```
Incoming Request
      │
      ▼
JWT Verification (Depends on get_current_user)
      │ Fails → 401
      │
      ▼
UserContext populated (userId, tenantId, role, permissions from JWT)
      │
      ▼
Per-tenant rate limit check (in-memory Phase 1)
      │ Exceeded → 429
      │
      ▼
Permission check for the AI operation
      │ Insufficient → 403
      │
      ▼
RAG Retrieval (tenant-scoped)
      │
      ▼
Prompt Construction (sanitized)
      │
      ▼
LLM Call
      │
      ▼
Output Validation
      │
      ▼
Response (audit logged async)
```

### 10.3 RAG / Vector Search Tenant Isolation

When retrieving documents for LLM context, the retrieval query **must always** filter by `tenant_id` from the verified JWT.

```
NEVER:  "Find similar documents in the database"
ALWAYS: "Find similar documents where tenant_id = <tenantId from JWT>"
```

If using `pgvector`, the SQL query includes a mandatory `WHERE tenant_id = $1` clause that is sourced from `user.tenant_id`, not from the request body.

### 10.4 Prompt Injection Mitigation

User-supplied content that reaches an LLM prompt is a potential attack vector. An attacker can write inputs designed to make the LLM reveal system instructions or other tenants' data.

**Required mitigations:**

1. **Input sanitization** — Strip angle brackets, unusual unicode, and limit length before inserting user content into prompts.
2. **System prompt hardening** — The system prompt must explicitly instruct the model to ignore instructions embedded in user content.
3. **No raw passthrough** — User query text goes into the `user` message only, never into the `system` message.
4. **Output validation** — Scan LLM responses before returning them. Check for known PII patterns, tenant IDs from other tenants, or signs of prompt injection success.

### 10.5 What the LLM Layer Must Never Do

- Trust `tenantId`, `userId`, or `role` from the request body
- Execute write operations directly without application-layer confirmation
- Return raw LLM output without validation
- Access the vector store without a tenant_id filter
- Expose the system prompt contents (instruct the model to refuse such requests)

### 10.6 Model Version Pinning

Pin the LLM model version explicitly in your configuration. Model provider updates can change behavior of prompts, reports, and summaries. Test against a fixed version. Document the version in use and the process for testing an upgrade.

---

## 11. Audit Logging

### 11.1 What to Log

Every significant action in the system must create an audit log entry.

| Category | Events to Log |
|---|---|
| Auth | User login, logout, login failure, token refresh |
| Data Writes | Task created/updated/deleted, opportunity assigned/updated |
| Admin Actions | User invited, role changed, user removed |
| AI Actions | AI report generated, RAG query executed, LLM-generated task created |
| Access | Report downloaded/exported |
| System | Tenant suspended/reactivated |

### 11.2 Audit Log Record Structure

Each audit log entry must capture:

| Field | Description |
|---|---|
| `id` | Unique identifier |
| `tenantId` | Which tenant this belongs to |
| `userId` | Who performed the action |
| `action` | What happened (e.g., `task.updated`) |
| `resourceType` | What was affected (e.g., `task`) |
| `resourceId` | ID of the specific record |
| `before` | Previous state (for updates) — JSON |
| `after` | New state (for updates) — JSON |
| `ipAddress` | Client IP |
| `userAgent` | Client user agent |
| `createdAt` | Timestamp (UTC, indexed) |

### 11.3 Write Strategy (Phase 1)

Audit log writes must be **non-blocking** (async, fire-and-forget). An audit log failure must never cause the primary request to fail.

- Write asynchronously after the main operation succeeds
- Log write errors to the application log (console/file), not to the caller
- The audit table is append-only — no UPDATE or DELETE from application code ever

### 11.4 Audit Log Security Rules

- The DB role that writes audit logs should only have `INSERT` permission on the audit table
- Audit records must never be updatable or deletable by the application
- Audit data is tenant-scoped (include `tenant_id`) but accessible to tenant admins for their own tenant

---

## 12. Tenant Lifecycle Management

### 12.1 Tenant States

```
PENDING → ACTIVE → SUSPENDED → DELETED
                ↓
           SUSPENDED → ACTIVE  (reactivation)
```

| State | API Access | Data | Notes |
|---|---|---|---|
| `PENDING` | Blocked | Empty | Tenant provisioned, not yet fully set up |
| `ACTIVE` | Allowed | Normal | Standard operation |
| `SUSPENDED` | Blocked (403) | Preserved | Non-payment, policy violation |
| `DELETED` | Blocked | Retained for N days | Soft delete, then archival |

### 12.2 Tenant Status Check

Every authenticated request must check tenant status before proceeding. This check happens in a guard layer (Layer 4 in the request lifecycle).

The check reads from the `tenants` table. In Phase 1 this is one DB read per request. In Phase 2, this result is cached in Redis with a 60-second TTL.

### 12.3 Tenant Onboarding Flow

```
1. Your ops team (or self-serve flow) creates a tenant record in DB
2. Tenant status set to PENDING
3. Initial admin user created in the IdP with tenantId + role=ADMIN embedded
4. Welcome email with setup link sent (IdP password setup flow)
5. Admin completes setup → tenant status set to ACTIVE
6. Admin can now invite team members via user invite flow
```

All of steps 1–5 must be audited. The tenant provisioning endpoint is an internal/admin-only route — never exposed to the public internet without additional auth.

### 12.4 User Invite Flow

```
1. Admin calls POST /users/invite with { email, role }
2. Backend verifies caller has user.invite permission
3. Backend creates user in IdP with tenantId, role, initial permissions
4. IdP sends invitation email with password-setup link
5. User completes setup → can now log in
```

The `tenantId` is assigned server-side during invite creation, never sent by the inviting admin in the request body.

---

## 13. Rate Limiting

### 13.1 Phase 1 Strategy (In-Memory)

Rate limiting in Phase 1 uses NestJS Throttler (in-memory) for the REST API and a simple in-memory counter in FastAPI.

**Limitations:** In-memory rate limiting does not share state across multiple running instances. It is acceptable when running a single instance. It must be replaced with Redis in Phase 2 before horizontal scaling.

### 13.2 Rate Limit Tiers

| Service | Limit | Window | Notes |
|---|---|---|---|
| REST API (general) | 100 requests | 60 seconds | Per IP in Phase 1 |
| FastAPI LLM endpoints | 20 requests | 60 seconds | Per tenant in Phase 1 |
| Auth endpoints | 10 requests | 60 seconds | Extra strict to prevent brute force |

### 13.3 Response on Limit Exceeded

- Return `429 Too Many Requests`
- Include `Retry-After` header indicating when the limit resets
- Log the event (tenant, user, endpoint) for monitoring

---

## 14. Error Handling & Information Leakage

### 14.1 The Global Exception Filter

A global exception filter must be registered in NestJS that intercepts all unhandled exceptions before they reach the client. It must:

- Return a clean JSON error response
- Include only the HTTP status code and a generic message for 5xx errors
- Never include stack traces, SQL error messages, query details, or internal IDs
- Log the full error server-side with the request ID for debugging

### 14.2 Error Response Rules

| Error Type | Client Response | Server Log |
|---|---|---|
| Validation error (400) | Include field-level details (safe) | Log with request context |
| Auth failure (401) | Generic "Unauthorized" only | Log token issue details |
| Permission failure (403) | Generic "Forbidden" only | Log user, resource, missing permission |
| Not found (404) | Generic "Not found" | Log resource type |
| Rate limit (429) | Include Retry-After header | Log tenant/user |
| Server error (500) | Generic "Internal server error" | Full stack trace + request ID |

### 14.3 What Must Never Appear in Client Responses

- Stack traces
- SQL queries or error messages
- Internal IDs (database row IDs, internal service names)
- Tenant IDs from other tenants
- Database column names
- File paths

### 14.4 Tenant Enumeration Prevention

Error messages must not reveal whether a tenant or user exists. A request for a suspended tenant and a request with a fake tenant ID should return identical responses (`403 Forbidden`).

---

## 15. Security Checklist — Must Ship Phase 1

These items have no external dependencies and are non-negotiable before any production deployment.

### Authentication

- [ ] JWT algorithm locked to `RS256` only — `none` and `HS256` are explicitly rejected
- [ ] JWT `iss` (issuer) verified on every request in both NestJS and FastAPI
- [ ] JWT `aud` (audience) verified on every request — NestJS and FastAPI have different audience values
- [ ] JWT `exp` (expiry) verified — tokens older than 10 minutes are rejected
- [ ] Access token TTL set to 10 minutes or less in the IdP config
- [ ] Refresh token rotation enabled in the IdP
- [ ] IdP logout endpoint called on user logout

### Headers & Input

- [ ] Requests containing `x-tenant-id`, `x-user-id`, or `x-user-role` headers are actively rejected with `400`
- [ ] `tenantId` is never read from request body, params, or headers in any controller, service, or repository
- [ ] All user-supplied input going into LLM prompts is sanitized and length-limited

### Database

- [ ] Two separate DB roles exist: `app_migrator` (DDL) and `app_user` (DML only, no BYPASSRLS)
- [ ] `app_user` does not have `BYPASSRLS` under any circumstance
- [ ] RLS is enabled with `FORCE ROW LEVEL SECURITY` on every business table
- [ ] Tenant isolation policy exists on every business table
- [ ] Ownership policy exists on `tasks` and `opportunities` tables
- [ ] `SET LOCAL` (not `SET`) is used for all RLS session variables
- [ ] All DB queries go through the `withTenantContext` wrapper — no direct Prisma calls
- [ ] Migration scripts use `app_migrator` credentials, not `app_user`

### AI / LLM

- [ ] FastAPI verifies JWT independently — does not trust context forwarded from NestJS
- [ ] All RAG/vector queries filter by `tenant_id` from the verified JWT
- [ ] System prompt instructs the model to ignore injected instructions
- [ ] LLM responses are validated before returning to the client
- [ ] LLM model version is pinned

### Application

- [ ] Global exception filter strips stack traces and SQL errors from all responses
- [ ] Audit log writes are non-blocking and never throw to the caller
- [ ] Tenant `status` is checked on every authenticated request
- [ ] Rate limiting is active on all endpoints

### Testing

- [ ] RLS integration tests run in CI against a real PostgreSQL instance
- [ ] Cross-tenant data access returns zero rows in all test cases
- [ ] Ownership isolation tests verify Rep A cannot access Rep B's records

---

## 16. Phase 2 Upgrade Map

All Phase 2 additions are additive. Nothing in Phase 1 needs to be rewritten.

### Phase 2A — Add Redis (Caching & Real-Time Controls)

| Current Phase 1 Behavior | Phase 2 With Redis |
|---|---|
| Access token TTL alone limits revocation window | Instant revocation via Redis blocklist on logout/user removal |
| In-memory throttler (per-instance) | Redis-backed throttler (shared across all instances) |
| Tenant status fetched from DB every request | Redis-cached with 60-second TTL |
| Permission check from JWT claims only | Redis-cached permission lookup (5-minute TTL) — enables instant permission changes |
| FastAPI in-memory rate limiter | Redis-backed per-tenant rate limiter |

**What changes:** Only the storage adapter for throttler and caching components. Business logic and guard structure remain identical.

### Phase 2B — Horizontal Scaling

Requires Phase 2A (Redis) to be complete first.

| Item | Change |
|---|---|
| NestJS single instance | Horizontal scaling behind a load balancer (rate limiting now shared via Redis) |
| FastAPI single instance | Same — horizontal scaling safe once Redis rate limiting is in place |
| Prisma built-in pool | Move to PgBouncer in transaction mode — verify `SET LOCAL` behavior in tests |
| No API gateway | Add Kong or Cloudflare Workers for WAF, per-tenant throttling, and JWT pre-validation at the edge |

### Phase 2C — Async Audit & Event Queue

| Item | Change |
|---|---|
| Synchronous fire-and-forget audit writes | BullMQ job queue → dedicated audit consumer service |
| All events processed in-request | Event bus (BullMQ or Kafka) for inter-service communication |
| Audit writes from app_user | Dedicated INSERT-only DB role for audit writes |

**What changes:** The `AuditService.log()` interface stays the same — only the underlying transport changes from direct DB write to queue push.

### Phase 2D — Enterprise / Compliance Tier

| Item | Change |
|---|---|
| Row-level multi-tenancy for all | Add a "dedicated schema" or "dedicated DB" option for enterprise tenants (HIPAA, SOC2) |
| pgvector shared table, tenant_id filter | Namespaced collections per tenant in Pinecone or Weaviate |
| Permissions in JWT (stale on change) | Open Policy Agent (OPA) for real-time policy evaluation without JWT dependency |
| Manager team access via application logic | RLS manager-tier policy using `team_members` relationship |

### Phase 2E — Cloud / AWS Migration

| Current | AWS Replacement |
|---|---|
| Auth0 / Clerk / Keycloak | AWS Cognito or Microsoft Entra ID |
| `.env` secrets | AWS Secrets Manager with automatic rotation |
| Console logging | CloudWatch + structured logging |
| No distributed tracing | AWS X-Ray or OpenTelemetry + Datadog |
| Manual DB backups | RDS automated backups + point-in-time recovery |

**Migration note:** The OIDC interface is standardized. Swapping IdPs requires changing only the `AUTH_ISSUER` and `API_AUDIENCE` environment variables. JWT verification code in NestJS and FastAPI does not change.

---

## 17. Database Schema Reference

### Core Tables (All Require `tenant_id`)

```
tenants
  id            UUID PK
  name          VARCHAR
  slug          VARCHAR UNIQUE
  status        ENUM (PENDING, ACTIVE, SUSPENDED, DELETED)
  plan          VARCHAR
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

users
  id            UUID PK
  tenant_id     UUID FK → tenants.id  (INDEXED)
  external_id   VARCHAR (IdP sub claim)
  email         VARCHAR
  role          ENUM (ADMIN, MANAGER, SALES_REP)
  status        ENUM (ACTIVE, INVITED, SUSPENDED)
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

tasks
  id            UUID PK
  tenant_id     UUID FK → tenants.id  (INDEXED)
  assigned_to   UUID FK → users.id
  created_by    UUID FK → users.id
  title         VARCHAR
  status        ENUM (OPEN, IN_PROGRESS, DONE, CANCELLED)
  due_date      DATE
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

opportunities
  id            UUID PK
  tenant_id     UUID FK → tenants.id  (INDEXED)
  assigned_to   UUID FK → users.id
  customer_id   UUID FK → customers.id
  title         VARCHAR
  stage         ENUM
  value         DECIMAL
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

customers
  id            UUID PK
  tenant_id     UUID FK → tenants.id  (INDEXED)
  created_by    UUID FK → users.id
  name          VARCHAR
  email         VARCHAR
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

audit_logs
  id            UUID PK
  tenant_id     UUID FK → tenants.id  (INDEXED)
  user_id       UUID FK → users.id
  action        VARCHAR (e.g., task.updated)
  resource_type VARCHAR
  resource_id   UUID
  before        JSONB
  after         JSONB
  ip_address    INET
  user_agent    TEXT
  created_at    TIMESTAMP  (INDEXED)
```

### Indexing Requirements

Every `tenant_id` column must be indexed. Queries without a `tenant_id` index will perform full table scans as data grows.

Additional indexes based on query patterns:
- `tasks(tenant_id, assigned_to)` — for ownership queries
- `tasks(tenant_id, status)` — for filtered task lists
- `audit_logs(tenant_id, created_at)` — for audit trail queries
- `users(tenant_id, external_id)` — for JWT sub → user resolution

---

## 18. Roles & Permissions Reference

### Roles (Phase 1)

| Role | Description |
|---|---|
| `ADMIN` | Full control within their tenant. Manages users, settings, and all data. |
| `MANAGER` | Team-level access. Cannot manage settings or remove users. |
| `SALES_REP` | Personal record access only. Core CRM operations on their own data. |

### Planned Roles (Phase 2)

| Role | Description |
|---|---|
| `TEAM_LEAD` | Between MANAGER and SALES_REP. Can view team tasks but cannot reassign. |
| `REGIONAL_MANAGER` | Multiple teams. Reports across regions. |
| `SALES_OPS` | Read access across all reps for reporting. Cannot modify records. |
| `READ_ONLY` | Audit/compliance observer. View-only, all data within tenant. |

### Permissions Reference

Permissions are strings in `resource.action` format. Stored in the JWT and enforced by guards.

| Permission String | Description |
|---|---|
| `task.view` | View tasks |
| `task.create` | Create new tasks |
| `task.update` | Update task details |
| `task.delete` | Delete tasks |
| `task.assign` | Reassign tasks to other users |
| `opportunity.view` | View opportunities |
| `opportunity.create` | Create opportunities |
| `opportunity.update` | Update opportunity details |
| `opportunity.delete` | Delete opportunities |
| `customer.view` | View customer records |
| `customer.create` | Create customers |
| `customer.update` | Update customer details |
| `customer.delete` | Delete customers |
| `report.view` | View reports and dashboards |
| `report.export` | Export/download reports |
| `user.view` | View user list |
| `user.invite` | Invite new users |
| `user.manage` | Change user roles, suspend users |
| `settings.view` | View tenant settings |
| `settings.manage` | Change tenant settings |
| `ai.query` | Use AI assistant / LLM features |
| `ai.report` | Generate AI reports |

---

## 19. Environment Variables Reference

### NestJS Service

```bash
# Identity Provider
AUTH_ISSUER=https://your-idp.auth0.com/
API_AUDIENCE=https://api.yourapp.com
JWKS_URI=https://your-idp.auth0.com/.well-known/jwks.json

# Database — Application runtime (app_user, no BYPASSRLS)
DATABASE_URL=postgresql://app_user:password@host:5432/dbname?connection_limit=10

# Database — Migrations only (app_migrator)
DATABASE_MIGRATION_URL=postgresql://app_migrator:password@host:5432/dbname

# Application
NODE_ENV=production
PORT=3000

# Rate Limiting
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100
```

### FastAPI Service

```bash
# Identity Provider (same IdP, different audience)
AUTH_ISSUER=https://your-idp.auth0.com/
AI_API_AUDIENCE=https://ai.yourapp.com
JWKS_URI=https://your-idp.auth0.com/.well-known/jwks.json

# Database (for RAG retrieval via pgvector)
DATABASE_URL=postgresql+asyncpg://app_user:password@host:5432/dbname

# LLM Provider
LLM_API_KEY=<your-llm-provider-key>
LLM_MODEL=<pinned-model-version>

# Rate Limiting
LLM_RATE_LIMIT_PER_TENANT=20
LLM_RATE_LIMIT_WINDOW_SECONDS=60
```

### Phase 2 Additions (Not Needed Yet)

```bash
# Redis (Phase 2A)
REDIS_URL=redis://localhost:6379

# AWS (Phase 2E)
AWS_REGION=us-east-1
AWS_SECRET_ARN=arn:aws:secretsmanager:...
```

---

## 20. Architecture Decision Log

Document every significant architecture decision so future team members understand the reasoning.

| Decision | Why | Alternative Considered | Trade-off |
|---|---|---|---|
| Row-level multi-tenancy over schema-per-tenant | Simpler migrations, scales to many tenants | Schema-per-tenant for stronger isolation | Weaker isolation mitigated by RLS |
| RLS as safety net over application-only filtering | Protects against developer mistakes | Application filtering only | Small performance overhead per query |
| Short JWT TTL (10 min) over Redis blocklist | No Redis dependency in Phase 1 | Redis blocklist for instant revocation | 10-min window of stale token risk |
| pgvector over dedicated vector DB | No extra infrastructure | Pinecone, Weaviate | Less scalable for large embedding volumes |
| In-memory rate limiting in Phase 1 | No Redis dependency | Redis throttler | Does not work across multiple instances |
| Fire-and-forget audit writes | Non-blocking, no queue dependency | Synchronous write or queued write | Risk of missed audit events on write failure |
| Separate DB roles for migration vs runtime | Principle of least privilege | Single DB user | Slightly more config overhead |
| FastAPI for AI services over NestJS | Better Python ecosystem for ML/LLM | NestJS with Node LLM SDKs | Additional service to maintain |

---

*Document version: 1.0 — Phase 1 Production Ready*
*Review this document when: adding new tables, adding new roles, adding new AI capabilities, or beginning Phase 2 work.*
