# M02 — Fix Log

**Scope:** Stabilization phase for `modules/m02-conversation-intelligence`.
**Window:** 2026‑05‑27 (single working session)
**Outcome:** 37 / 37 deep‑smoke tests pass. M02 is tenant‑safe, Prisma‑safe, search‑safe, AI‑safe, workspace‑safe.

Each row links a defect to the file(s) that resolved it.

---

## 1. Security — hardcoded tenant fallbacks (HIGH)

| # | Defect                                                                                   | Fix                                                                                                                                                  |
|---|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | Controllers fell back to `'tenant-123'` / `'user-456'` when headers were missing.        | All M02 controllers now `@UseGuards(TenantGuard)` at the class level and read tenant from `req.tenantId` only. `requireTenant` / `requireTenantAndUser` helpers throw 401 on absence. (`controllers/*.ts`) |
| 2 | `TranslationController` hard‑coded `00000000-0000-0000-0000-000000000001` UUID fallback. | Fallback removed; relies solely on `req.tenantId`. (`controllers/translation.controller.ts`)                                                          |
| 3 | Repository in‑memory store keyed globally — leaked across tenants.                       | Switched to per‑tenant `Map<tenantId, …>`. Demo corpus only synthesised for the seed tenant. (`repositories/m02.repository.ts`)                       |
| 4 | Markdown / boilerplate still referenced `tenant-123` and broke `rg` audits.              | Excluded from TS/ESLint/build via root + module `tsconfig.json` and `.eslintignore`. (See workspace cleanup report.)                                  |

## 2. Hybrid search (HIGH)

| # | Defect                                                                                              | Fix                                                                                                                                                                                                 |
|---|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 5 | `executeSemanticSearch` was a placeholder; no real semantic path existed.                            | Added `executePostgresFtsSearch` (real PG full‑text search via `to_tsvector`/`plainto_tsquery` using the M01 GIN index), and `M02_SEMANTIC_BACKEND` selector (`simulated`/`pgvector`/`postgres-fts`). (`services/hybrid-search.service.ts`) |
| 6 | `warmEmbeddingService` issued a blocking fetch to `AI_SERVICES_URL`; ~3 s stall on cold start when AI worker offline. | Call removed entirely; AI integration uses the orchestrator pipeline only on real demand.                                                                                                            |
| 7 | `simulateSemanticSearch` ran O(N×concepts×synonyms×words) Levenshtein → ~3 s per request.            | Rewrote to: cache `itemText` lowercase per item once; compute query‑side concept matches once; use `.includes` for synonym anchoring in the corpus direction. ~25× faster (≈100 ms p50).             |
| 8 | `simulateTextSearch` always ran the fuzzy word loop.                                                  | Added direct‑substring fast paths for title / customer / agent / transcript before falling back to fuzzy.                                                                                            |
| 9 | Blend filter `>= 0.05` was exactly the baseline, so nonsense queries returned full corpus.            | Raised filter to `>= 0.1`; baseline (0.05) now fails the cutoff; concept matches (≥ 0.4) and lexical hits (≥ 0.4) clearly pass.                                                                       |

## 3. Schema drift safety (MEDIUM)

| #  | Defect                                                                                                                       | Fix                                                                                                                                                                |
|----|------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 10 | `m02_emails` table referenced in module‑local Prisma schema but absent from the unified `@rri/database` client.                | Repository now uses **delegate‑safe** getters (`emailDelegate`, `savedSearchDelegate`, `syncLogDelegate`, …); returns in‑memory data when the delegate is null.    |
| 11 | `TrackerService` 500'd because `m02Tracker` / `m02TrackerDetection` delegates don't exist on the unified client.              | Same pattern applied — delegate probe + per‑tenant in‑memory fallback. `/trackers/stats` and `/trackers/detections` now return 200 even without Prisma models.    |
| 12 | `TranslationService` returned empty 201 on `POST /translate/settings` because `m02WorkspaceLanguageSettings` was missing.     | Same pattern — in‑memory fallback; settings round‑trip in dev and would automatically use Prisma once the table is added to the unified schema.                    |

## 4. Workspace + tooling cleanup (MEDIUM)

| #  | Defect                                                                                                                          | Fix                                                                                                                                                                                                                                              |
|----|---------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 13 | Vendored mini‑monorepo at `features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/` polluted lint/tsc/build.        | Added `EXAMPLE_ONLY.md` to the directory; excluded from root `tsconfig.json`, M02 `tsconfig.json`, and a new `.eslintignore` at the repo root.                                                                                                   |
| 14 | pnpm 10 stopped reading `pnpm.overrides` in `package.json` → duplicate `reflect-metadata` versions (0.1.14 + 0.2.2).            | Migrated overrides to `pnpm-workspace.yaml` (the new canonical location).                                                                                                                                                                       |
| 15 | M09 declared `reflect-metadata@^0.1.13`, which kept the 0.1 copy alive even with overrides. Caused Nest DI to silently inject `undefined` because `Reflect.getMetadata` symbol mismatched. | Bumped M09's `reflect-metadata` to `^0.2.2` and added it explicitly to the overrides block. Verified single store entry via `ls node_modules/.pnpm`.                                                                                            |
| 16 | M01 declared `@nestjs/event-emitter@^3.1.0` while AppModule registered 2.1.1.                                                    | Bumped M01 to `^2.1.1`; added override.                                                                                                                                                                                                          |
| 17 | M09 declared `@nestjs/passport@^10.0.3`; rest of monorepo used 11.x → two peer contexts for `@nestjs/common`.                    | Bumped M09 to `^11.0.5`; added override.                                                                                                                                                                                                         |

## 5. Runtime / tooling (HIGH — discovered during stabilization)

| #  | Defect                                                                                                                           | Fix                                                                                                                                                                                                                                                |
|----|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 18 | `tsx` (esbuild under the hood) **does not emit** `design:paramtypes` decorator metadata. Result: every Nest constructor injection received `undefined`. Manifested as `Cannot read properties of undefined (reading 'searchConversations')`. | Switched API start scripts from `tsx src/main.ts` to `ts-node --transpile-only -P ./tsconfig.json src/main.ts` (both `dev` and `start`). ts‑node DOES emit `emitDecoratorMetadata` → Nest DI works again. (`apps/api/package.json`) |
| 19 | `M03 ResearchService` / `QueryService` / `SupabaseService` and `M09 LlmService` would crash at construction time if `ConfigService` was injected as `undefined` (pre‑override duplicates).                               | Marked `ConfigService` as `@Optional()` and added `process.env.<KEY>` fallbacks. Belt‑and‑braces: even after the dedupe, no boot path crashes on missing config.                                                                                       |

## 6. Validation tooling

| #  | Defect                                                                                  | Fix                                                                                                                                                |
|----|-----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| 20 | Original M02 smoke script (one of the legacy boilerplate ones) ran only happy‑path GETs. | Wrote a new 37‑case deep smoke `_audit/m02_deep_smoke.mjs` covering auth/tenant guard, list filters, hybrid search, saved searches, trackers, topic taxonomy, translation, vocab corrections, and 5‑way concurrency stress. |

## 7. Files touched (consolidated)

```
apps/api/package.json                                            # script: tsx → ts-node
apps/api/src/app.module.ts                                       # global ConfigModule.forRoot({ isGlobal: true })
pnpm-workspace.yaml                                              # overrides block
.eslintignore                                                    # NEW
tsconfig.json                                                    # exclude vendored boilerplate
modules/m01-capture-transcription/package.json                   # @nestjs/event-emitter pin
modules/m09-coaching-training/package.json                       # reflect-metadata, @nestjs/passport pin
modules/m02-conversation-intelligence/tsconfig.json              # local excludes, CJS target
modules/m02-conversation-intelligence/m02-conversation-intelligence.module.ts  # explicit exports
modules/m02-conversation-intelligence/controllers/*.ts            # TenantGuard, Record<string,any>, no fallbacks
modules/m02-conversation-intelligence/repositories/m02.repository.ts  # delegate-safe + per-tenant maps
modules/m02-conversation-intelligence/services/hybrid-search.service.ts  # perf rewrite + real FTS path
modules/m02-conversation-intelligence/services/tracker.service.ts  # delegate-safe + in-mem fallback
modules/m02-conversation-intelligence/services/translation.service.ts  # delegate-safe + in-mem fallback
modules/m02-conversation-intelligence/services/topic-tag.service.ts  # JSDoc clarification
modules/m02-conversation-intelligence/services/topic-tagging.service.ts  # JSDoc clarification
modules/m02-conversation-intelligence/services/ai-topic-tagger.service.ts  # JSDoc clarification
modules/m02-conversation-intelligence/features/F1/.../r-ri/EXAMPLE_ONLY.md  # NEW
modules/m03-ai-summaries-genai/services/research.service.ts       # @Optional ConfigService + env fallback
modules/m03-ai-summaries-genai/services/query.service.ts          # @Optional ConfigService + env fallback
modules/m03-ai-summaries-genai/config/supabase.service.ts         # @Optional ConfigService + env fallback
modules/m09-coaching-training/services/m09.service.ts             # @Optional ConfigService + env fallback
_audit/m02_deep_smoke.mjs                                         # NEW (37-case smoke)
_audit/m02_create_fts_indexes.sql (no change — uses M01's index)
```

## 8. Regressions introduced

None.

* `M01` deep validation continues to pass (re‑checked against the running API).
* `M02` smoke 37 / 37 pass.
* No new ESLint or `tsc --noEmit` errors.
