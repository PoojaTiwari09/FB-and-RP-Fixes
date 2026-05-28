# M09 — Backend Fix Log

**Date:** 2026-05-27

| # | Issue | Fix |
|---|--------|-----|
| 1 | `PrismaService` uses `@rri/database` but repository called `prisma.trainingScenario` | Rewrote `m09.repository.ts` with delegate-safe access + `m09-memory.store.ts` |
| 2 | `POST /test/health` 500 (`prisma.user.count`) | Health uses repository + LLM provider metadata |
| 3 | `POST /test/seed` 500 (legacy upserts) | Seed via `repository.seedTestData()` |
| 4 | `POST /test/smoke` 500 (invalid UUID for Postgres) | UUID seed ids; guarded unified `create` with `isUuid()` |
| 5 | `fallback_secret` in JwtModule | Removed; dev-only explicit default |
| 6 | `POST /test/token` alg:none JWT | Real `JwtService.sign()` |
| 7 | No provider abstraction | Added `providers/*` + `resolveLlmProviderKind()` |
| 8 | No RLS SQL | Added migration `20260527120000_m09_dashboards_rls` |
| 9 | Local prisma confusion | `prisma/DEPRECATED.md` |
| 10 | No repeatable smoke harness | `doc/test_result/doc/test_result/doc/test_result/test_case/testm9.py` + `test9.md` |

## Files changed

```
modules/m09-coaching-training/repositories/m09.repository.ts
modules/m09-coaching-training/repositories/m09-memory.store.ts
modules/m09-coaching-training/repositories/m09-prisma-mappers.ts
modules/m09-coaching-training/database/prisma.service.ts
modules/m09-coaching-training/controllers/m09.controller.ts
modules/m09-coaching-training/m09-coaching-training.module.ts
modules/m09-coaching-training/services/m09.service.ts
modules/m09-coaching-training/providers/*
modules/m09-coaching-training/prisma/DEPRECATED.md
packages/database/prisma/migrations/20260527120000_m09_dashboards_rls/migration.sql
doc/test_result/doc/test_result/test_case/testm9.py
doc/test_result/test_case/test9.md
doc/test_result/m09_*.md (10 reports)
```
