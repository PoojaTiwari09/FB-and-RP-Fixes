# M05 Account Model Reconciliation Report

**Date:** 2026-05-27  
**Status:** Resolved (semantic model + schema alignment)

## Decision: three fields, three roles

| Field | Prisma / DB | Canonical use | Do NOT use for |
|-------|-------------|---------------|----------------|
| **assignedRepId** | `assigned_rep_id` | Board filters, `rep_id` query, API `assigned_rep.id` | CRM owner object identity |
| **hubspotOwnerId** | `hubspot_owner_id` | HubSpot sync/webhook writes, CRM reconciliation | App rep filtering |
| **ownerUserId** | `owner_user_id` | Platform `User.id` (M01 auth), cross-module ownership | HubSpot sync |

## Implementation

- `domain/account-ownership.ts` — `getCanonicalAssignedRepId`, `assignedRepIdForHubSpotUpsert`
- `sync.service.ts` — preserves existing `assigned_rep_id` on upsert; sets from HubSpot owner only when empty
- `webhook.controller.ts` — writes `hubspot_owner_id`; backfills `assigned_rep_id` only when null
- `accounts.service.ts` — reads **only** `assigned_rep_id` for `assigned_rep` (never `hubspot_owner_id`)

## Prisma schema updates

**Unified** `doc/execution/database-tools/schema.prisma` — `Accounts.healthScore` with `@map("healthscore")`.

**Boilerplate** `packages/database/prisma/schema.prisma` — `Account` model extended with `assignedRepId`, `hubspotOwnerId`, `ownerUserId`, `healthScore`, `crmRecordId`.

## Seeds

- `doc/execution/seeds/unified-seed.js` — `healthScore` (was `healthscore`)

## API response

- `health_score` exposed on account list items (from `healthscore` / `health_score` Supabase columns when present)
- Distinct from `ai_risk_score` (supplementary_accounts)

## Follow-up

- Map Supabase `crm_companies` → unified Prisma `Account` / `Accounts` on full cutover
- Populate `ownerUserId` from M01 when linking CRM companies to platform users
