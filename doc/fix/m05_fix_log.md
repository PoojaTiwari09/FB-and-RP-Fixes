# M05 Fix Log

**Date:** 2026-05-27

| # | Gap | Fix |
|---|-----|-----|
| 1 | HIGH: duplicate owner fields | `domain/account-ownership.ts` + sync/webhook/accounts semantics |
| 2 | MEDIUM: healthscore naming | `healthScore @map("healthscore")` in unified + boilerplate Prisma |
| 3 | MEDIUM: webhook HMAC env | `M05_HUBSPOT_WEBHOOK_SECRET` + registry + `m05-env.ts` |
| 4 | LOW: controller overlap | Module root = metadata; accounts on `/accounts`; `M05TestController` |
| 5 | Frontend wrong API paths | `M05_API` prefix in `lib/api.ts` |
| 6 | Mock repository | Prisma `account.findMany` / `create` |
| 7 | Env template | `.env` + registry Supabase/HubSpot rows |
| 8 | Smoke | `testm5.py` (7/7 PASS), `smoke-backend.ps1` updated |
| 9 | API `health_score` field | `accounts.service.ts` + frontend `AccountSummary` type |

## Validation

- `prisma validate` — packages/database + doc/execution/database-tools/schema.prisma: **PASS**
- `testm5.py` — **7/7 PASS**
- Accounts/boards 500 without Supabase — expected in local smoke (Supabase unset)
