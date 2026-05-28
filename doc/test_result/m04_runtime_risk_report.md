# M04 Runtime Risk Report

**Date:** 2026-05-27  
**Overall risk:** **Medium** (re-enabled for integration; not production-persistent yet)

## Risk matrix

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Ephemeral memory store | High | Certain on restart | Wire Prisma to PostgreSQL |
| Dev auth header bypass | High | Low if gated | Env flag `M04_DEV_AUTH_HEADERS` |
| Typecheck debt (~100 errors) | Medium | Medium on strict CI | Expand `models.ts` / incremental fixes |
| Legacy TypeORM scripts imported accidentally | Low | Low | Not in module providers |
| HubSpot without token | Low | Medium | `isConfigured()` guards |
| `DealDriversModule` raw SQL | Medium | Low until imported | Review before enable |
| bcrypt vs bcryptjs hash parity | Low | Low | Re-hash on Prisma user table |
| N+1 on relation hydration | Medium | Medium at scale | Prisma `include` tuning |
| No unified tenant RLS | High | Until Prisma | Mandatory `tenantId` filters |

## Runtime stability (observed)

- API starts with M04 enabled — **stable**
- No TypeORM connection pool errors — **eliminated**
- DI resolution — **stable** in smoke window

## Integration readiness

| Criterion | Ready? |
|-----------|--------|
| Downstream HTTP calls to boards/deals | Yes (smoke) |
| Cross-module orchestration | Partial — memory only |
| Analytics / AI pipelines | Blocked on persistent DB |
| Production deploy | No — needs Prisma + auth gate |

## Monitoring recommendations

- Log `M04EntityRepository` slow queries after Prisma cutover
- Alert on 401 spike on `/boards` (auth misconfig)
- Track memory store size if staying in dev mode
