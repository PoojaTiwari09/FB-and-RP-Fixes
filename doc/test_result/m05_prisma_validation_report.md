# M05 Prisma Validation Report

**Date:** 2026-05-27

## Schemas

| Schema | Path | validate |
|--------|------|----------|
| Unified | `final_product/schema.prisma` | PASS |
| Boilerplate DB | `packages/database/prisma/schema.prisma` | PASS |
| M05 local stub | `modules/m05-account-intelligence/prisma/schema.prisma` | PASS (minimal) |

## Account model changes (boilerplate)

Added to `public.Account`:

- `assignedRepId`, `hubspotOwnerId`, `ownerUserId`
- `healthScore` → `@map("healthscore")`
- `crmRecordId`
- Index on `[tenantId, assignedRepId]`

## Unified Accounts model

- `healthscore` renamed to `healthScore` with `@map("healthscore")` (DB column unchanged)

## Runtime data layer

M05 boards still read **Supabase** `crm_*` tables; Prisma `Account` used by `m05.repository` for programmatic/tenant-scoped records. Full cutover = migrate Supabase queries to Prisma.

## generate

`prisma generate` may fail with EPERM if API holds query engine DLL — stop API and re-run if client stale.

## migrate / seed

- Run against unified DB when baselining: `pnpm db:migrate` / unified-seed with `healthScore`
- New Account columns require migration before production deploy
