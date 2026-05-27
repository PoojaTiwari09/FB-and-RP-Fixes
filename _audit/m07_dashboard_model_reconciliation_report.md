# M07 Dashboard Model Reconciliation Report

**Date:** 2026-05-27  
**Scope:** `packages/database/prisma/schema.prisma` + M07 web API routes

## Problem

Two Prisma models represented overlapping dashboard layout persistence:

| Model (before) | Table | Runtime usage |
|----------------|-------|---------------|
| `dashboardconfigs` | `dashboards.dashboardconfigs` | **All live Next.js routes** |
| `DashboardConfig` | `dashboards.dashboard_configs` | **Unused** — different columns (`gridLayout`, `defaultFilters`) |

This caused type-generation instability, migration drift risk, and ambiguous ownership.

## Decision

**Canonical model:** `DashboardConfig` mapped to the **existing** `dashboards.dashboardconfigs` table (lowercase DB columns via `@map`).

**Removed:** Duplicate `DashboardConfig` → `dashboard_configs` mapping (unused phantom table model).

## Schema (after)

```prisma
model DashboardConfig {
  configId         String   @id @map("configid")
  tenantId         String   @map("tenantid")
  userId           String   @map("userid")
  layout           Json
  visibleWidgets   Json?    @map("visiblewidgets")
  dateRangeDefault String?  @map("daterangedefault")
  createdAt        DateTime @map("createdat")
  @@unique([tenantId, userId], map: "uq_dashboardconfigs_tenant_user")
  @@schema("dashboards")
  @@map("dashboardconfigs")
}
```

## Code updates

| File | Change |
|------|--------|
| `apps/web/.../api/dashboards/route.ts` | `prisma.dashboardConfig`, camelCase fields |
| `apps/web/.../api/dashboards/share/route.ts` | Same + `visibleWidgets` token store |
| `apps/web/.../api/dashboards/metrics/route.ts` | Same |

**Unchanged:** `coachingsnapshots` remains lowercase Prisma model/fields (separate table).

## Client accessor

- Before: `prisma.dashboardconfigs`
- After: `prisma.dashboardConfig`
- Compound unique: `tenantId_userId: { tenantId, userId }`

## Validation

- `npx prisma validate` — **PASS**
- `npx prisma generate` — schema valid; Windows EPERM if API holds query engine DLL (stop API, regenerate)

## Residual risk

- Root `final_product/schema.prisma` still contains legacy `DashboardConfigs` — out of monorepo package scope; do not mix clients.
- Empty `dashboard_configs` table may exist in some DBs from earlier drafts; safe to drop manually after backup if unused.

## Status

**RESOLVED** — single canonical model, all runtime references reconciled.
