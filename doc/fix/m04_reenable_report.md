# M04 Re-enable Report

**Date:** 2026-05-27  
**Status:** **RE-ENABLED**

## Change

`M04DealIntelligenceModule` was restored in `apps/api/src/app.module.ts` inside `sharedBackendModules`:

```typescript
import { M04DealIntelligenceModule } from '../../../modules/m04-deal-intelligence/m04-deal-intelligence.module';
// ...
M04DealIntelligenceModule,
```

## Module bootstrap

| Check | Result |
|-------|--------|
| Nest DI resolves all providers | PASS (API listens on :3001) |
| No TypeORM `forRoot` at startup | PASS |
| `M04DatabaseModule` global repos | PASS |
| Path aliases (`@/entities`, `@/services`, …) | PASS via `apps/api/tsconfig.json` + `tsconfig-paths/register` in `main.ts` |
| Controllers registered | PASS — logs show `DealBoardController {/boards}`, `DealController {/deals}`, `M04TestController {/m04-test}` |

## Supporting fixes for re-enable

1. Removed `@nestjs/typeorm` from `m04-deal-intelligence.module.ts`.
2. Added `M04TestController` for health/smoke without auth friction on test paths.
3. `SessionUserMiddleware` dev header bypass (`x-user-id`, `x-role`) for API smoke alignment with M01/M03.
4. `bcryptjs` in `auth.service.ts` (native module load failure on Windows).

## Smoke after re-enable

```
doc/test_result/doc/test_result/test_case/testm4.py → 4/4 PASS
- GET  /m04-test/health
- POST /m04-test/smoke
- GET  /boards  (with demo headers)
- GET  /deals   (with demo headers)
```

## Not imported (intentional)

- `DealDriversModule` — separate raw SQL path; not wired into main M04 module yet.

## Rollback

Comment out `M04DealIntelligenceModule` in `app.module.ts` if a regression blocks the API; no TypeORM rollback path remains.
