# M07 Prisma Validation Report

**Date:** 2026-05-27  
**Schema:** `packages/database/prisma/schema.prisma`

## M07-related models

| Model | Schema | Purpose |
|-------|--------|---------|
| `DashboardConfig` | `dashboards` | Per-user layout (`dashboardconfigs` table) |
| `coachingsnapshots` | `dashboards` | Coaching metrics snapshots |
| `Dashboard` | `public` | Nest-managed dashboard entities |
| `DashboardWidget` | `public` | Widget definitions |
| `DashboardSnapshot` | `public` | Pre-computed widget metrics |

## Validation commands

| Command | Result |
|---------|--------|
| `npx prisma validate` | **PASS** |
| `npx prisma generate` | Valid schema; **EPERM** on Windows if API locks `query_engine-windows.dll.node` |

## Reconciliation

- Duplicate `DashboardConfig` / `dashboardconfigs` models merged → single `DashboardConfig` with `@@map("dashboardconfigs")`
- Removed unused `@@map("dashboard_configs")` model definition

## Migrations

- No new migration required when DB already has `dashboardconfigs` only
- If `dashboard_configs` table exists empty from draft migrations, drop after verification

## Seed

- M07 module seed folder is `.gitkeep`; dashboard layout seeded via Next `/api/seed` and runtime upserts

## Client usage

- Backend: `@rri/database` via `modules/m07-revenue-dashboards/database/prisma.service.ts`
- Web routes: `@rri/database/node_modules/@prisma/client` (fragile path — recommend `@rri/database` export in follow-up)

## Status

**PASS** — schema valid, duplicate model eliminated.
