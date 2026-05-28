# M06 Runtime Risk Report

**Date:** 2026-05-27

| Risk | Severity | Mitigation |
|------|----------|------------|
| Redis off → jobs not processed | High | Document `REDIS_URL` required for async path |
| `ForecastUser` vs platform `User` | Medium | Clear model naming; no shared table |
| Worker ↔ service circular calls | Low | One-way: worker → service methods |
| Jest 30 incompatibility | Low | Pin jest 29 or fix jest config |
| Old `generated/prisma-client` stale imports | Medium | Delete generated folder |
| Materialize calls full dashboard compute | Medium | Acceptable offline; cache on read |

## Resolved

- Local Prisma fragmentation
- Duplicate schema columns in unified doc
- Sync snapshot on HTTP createDeal
- Dead letter queue path (Bull retries)
