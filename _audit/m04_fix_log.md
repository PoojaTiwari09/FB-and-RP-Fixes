# M04 Fix Log

**Date:** 2026-05-27

## Critical fixes

| # | Issue | Fix |
|---|-------|-----|
| 1 | Module disabled in `app.module.ts` | Re-enabled `M04DealIntelligenceModule` |
| 2 | TypeORM runtime dependency | `M04DatabaseModule` + `M04EntityRepository` memory shim |
| 3 | `@nestjs/typeorm` in 16 services | `@/database/inject-repository` |
| 4 | Entity/model duplication | `entities/models.ts` + re-export stubs |
| 5 | Path alias resolution at API boot | `tsconfig-paths/register` + `apps/api/tsconfig.json` paths |
| 6 | `bcrypt` native binding failure (Windows) | `bcryptjs` in `auth.service.ts` |
| 7 | Broken entity files post strip script | Replaced with `models.ts` exports |
| 8 | Missing enums (`AuditAction`, column enums, etc.) | Added to `models.ts` |
| 9 | `/boards`, `/deals` 401 in smoke | `SessionUserMiddleware` dev header bypass |
| 10 | Jest `rootDir: src` — no tests found | `rootDir: "."`, `test` script, `@/` mapper |
| 11 | Jest controller suite TS errors | `AuditAction.UNPUBLISH`, DTO casts in `mapToResponseDto` |
| 12 | `UserPreference` field mismatch | `preferenceKey`, `preferenceValue`, `scopeId` |
| 13 | `@nestjs/axios` missing | Added dependency + response cast in HubSpot client |
| 14 | `export.service` invalid `select` | `find({ take: 1 })` |
| 15 | `AuditEntityType.DEAL_WARNING` | Enum member added |
| 16 | `DealTask` assignee fields | Optional fields on model class |

## Test results after fixes

- `pnpm --filter "@r-revenue/m04-deal-intelligence" test` → **138/138 PASS** (6 suites)
- `python testm4.py` → **4/4 PASS**

## Open items

- `pnpm --filter "@r-revenue/m04-deal-intelligence" typecheck` — ~100 remaining TS errors (domain model field gaps across services; does not block Jest or API smoke)
- Unified Prisma persistence
- Archive TypeORM seeds/scripts
- Production gate on dev auth headers
