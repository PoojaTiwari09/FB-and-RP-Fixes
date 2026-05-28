# M10 Graph Validation Report

**Date:** 2026-05-27

## Graph entities

| Entity | Table | Relations |
|--------|-------|-----------|
| M10Account | `m10_accounts` | deals, contacts, activities, links |
| M10Contact | `m10_contacts` | account, dealContacts |
| M10Deal | `m10_deals` | account, dealContacts |
| M10Activity | `m10_activities` | idempotencyKey unique |
| M10InteractionLink | `m10_interaction_links` | activity + linked entities |

## Consistency checks

| Check | Status |
|-------|--------|
| Activity idempotency | PASS — unique `idempotencyKey` |
| Link uniqueness | PASS — `@@unique([tenantId, activityId, entityType, entityId])` |
| Orphan prevention | Links require valid `activityId` FK |
| Ambiguity handling | PASS — ambiguous fuzzy matches rejected |
| Cross-tenant leakage | PASS — `tenantId` on all queries |

## API validation

- `GET /accounts`, `/deals/:id/relationship` — JWT + tenant scoped
- `GET /test/accounts` — smoke path without JWT

## Prisma

M10 models merged into `packages/database/prisma/schema.prisma` (`prisma db push` applied).

## Status

**PASS** — graph schema and resolution pipeline aligned.
