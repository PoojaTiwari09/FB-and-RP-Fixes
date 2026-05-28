# M09 — Multi-Tenant Validation

**Date:** 2026-05-27

## Tenant model

M09 uses **`org_id`** in JWT claims and repository filters (legacy naming). Unified schema uses **`tenantid`**. Mapper bridges both.

**Dev seed tenant:** `00000000-0000-0000-0000-000000000001`

## Enforcement layers

| Layer | Mechanism |
|-------|-----------|
| Application | `findAllScenarios(orgId)`, `findSessionById(id, orgId)`, user lookups scoped |
| JWT payload | `org_id` on sign/login |
| PostgreSQL RLS | Migration `20260527120000_m09_dashboards_rls` (when deployed) |
| Transaction | `PrismaService.withTenantContext(tenantId, fn)` sets `app.current_tenant` |

## Tests performed

| Test | Result |
|------|--------|
| Rep user only sees org-scoped scenarios after login | PASS |
| Session create/read tied to JWT user's org | PASS |
| Cross-org session id access (different org in JWT) | Not automated — repository throws NotFound when org mismatch |

## Isolation from unstable modules

M09 does **not** import M03–M08 services at runtime. Optional future integration should use stable M01 call IDs or M02 conversation IDs only via explicit DTO contracts.
