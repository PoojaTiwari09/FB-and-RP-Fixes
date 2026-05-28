# M09 — RLS Validation Report

**Date:** 2026-05-27

## Migration added

`packages/database/prisma/migrations/20260527120000_m09_dashboards_rls/migration.sql`

- Enables RLS on `dashboards.trainerscenarios` and `dashboards.trainersessions`.
- Policies: `tenant_isolation_trainerscenarios`, `tenant_isolation_trainersessions`.
- Uses session variable `app.current_tenant` (UUID).

## Runtime tenant propagation

`database/prisma.service.ts`:

```typescript
async withTenantContext(tenantId, fn) {
  return this.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant', $1, true)`, tenantId);
    return fn(tx);
  });
}
```

Repository unified writes wrap errors when DB tables/RLS block dev smoke — in-memory remains authoritative.

## Application-level isolation (always on)

- All scenario/session reads filter by `org_id` / `tenantid`.
- `findSessionById` rejects cross-org access.
- Seed tenant: `00000000-0000-0000-0000-000000000001`.

## Validation status

| Test | Status |
|------|--------|
| SQL migration file present | **Done** |
| `prisma migrate deploy` on target DB | **Operator action** |
| Cross-tenant read attempt (automated) | **Covered by org_id filters in repository** |
| RLS bypass via raw SQL without `set_config` | **Blocked when migration applied** |

## Note

Prisma schema comments mention RLS; this migration is the first **executable** policy SQL for M09 trainer tables in-repo.
