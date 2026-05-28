# Implementation Changes (`implementation_changes.md`)

> Companion to `version_knowledge.md`. Everything in this file is an actionable change — either **already applied by this audit** (marked ✅ APPLIED) or **recommended for follow-up** (marked ⏭ PROPOSED).
>
> Section letters (A, B, C, ...) match the cross-references used in `version_knowledge.md`.

---

## A. Critical compile/runtime blockers in `apps/api` — fixed in this audit

### A1 ✅ APPLIED — Rewrite `apps/api/src/main.ts`

**Before**

* Line 4 imported `dotenv` then never called any other imports (e.g. `multer`, `fs` were referenced but never imported).
* Line 22 contained a literal GitHub PR conflict URL pasted into a `cb(...)` call:
  `cb(https://github.com/santhoshraajrelanto/r-revenue-intelligence-monorepo/pull/38/conflict?...null, ...)`.
  This made the file an immediate TypeScript / Node parse error.
* `bootstrap()` never awaited a global `ValidationPipe` and had no error-trap.
* A `localFallbackExtraction(...)` helper sat between the multer setup and the bootstrap; it belongs in a service in `m01-capture-transcription`, not in the bootstrap file.

**After** (`apps/api/src/main.ts`)

* Adds proper `fs`, `path`, `dotenv`, NestFactory bootstrap.
* Sets a global `ValidationPipe` (`whitelist: true`, `transform: true`).
* Awaits `app.listen(PORT)` with a default of `3001`.
* Wraps bootstrap in `.catch(...)` so failures surface a stack trace.
* `localFallbackExtraction` removed — move it into M01 if still needed (tracked in §F3).

### A2 ✅ APPLIED — Rewrite `apps/api/src/app.module.ts`

**Before**

* Imported only `M02`, `M03`, `M05` modules.
* Referenced `BullModule.forRoot(...)` **without importing** `BullModule`.
* Registered `BullModule.forRoot(...)` **twice** (different connection options each time).
* Listed `M01CaptureTranscriptionModule, M02..., M04..., M05..., M06..., M07..., M08..., M09..., M10...` all on one line with no commas/imports.

**After**

* All 10 `M0X` module imports are present and ordered (M04 left commented because it uses TypeORM and its Prisma schema has not been reconciled — see §B and `analysis_m04-deal-intelligence.md`).
* `BullModule.forRoot(...)` is registered **once** behind a `DISABLE_REDIS` feature flag.
* `redisEnabled` warns at boot when set.

### A3 ✅ APPLIED — Rewrite `apps/api/tsconfig.json`

**Before**

* Duplicate `target`, `outDir`, `forceConsistentCasingInFileNames`, `skipLibCheck` keys.
* A `}` on line 41 closed the `compilerOptions` block prematurely; then `baseUrl`, `paths`, `types` were written at the root of the file → invalid JSON.
* `exclude` repeated twice, with conflicting globs (`../modules/**` then `node_modules, dist`).
* `include` glob (`../../modules/**/*`) inverted the `exclude` glob (`../modules/**`).

**After**

* Single, canonical NestJS-style `tsconfig.json`.
* Path mappings retained for `@/services/*` etc. (M04 alias group), pointed at `../../modules/m04-deal-intelligence/*` to match the actual layout.
* `include` now reads `["src/**/*", "../../modules/**/*"]` and `exclude` covers `node_modules`, `dist`, the `features/` subtree (which contains nested mini-monorepos under M02), and any `*.spec.ts`.

### A4 ✅ APPLIED — Clean `apps/api/package.json`

**Before**

* Duplicate keys (JSON parsers will silently take the last): `@nestjs/bullmq`, `@nestjs/passport`, `bullmq`, `dotenv`, `prisma`, `zod`, `@r-revenue/platform-core`.
* `typeorm` dep declared but no `TypeOrmModule.forRoot` in `app.module.ts`.

**After**

* Each dep listed exactly once, alphabetised.
* `typeorm` removed (M04 imports it locally; will be addressed when M04 is re-enabled).
* `private: true` flag added (this is a workspace package — not for npm publish).
* Adds `passport-jwt`, `@types/passport-jwt`, `multer`, `@types/multer` (`@types/multer` was at `^2.1.0` which does not exist; downgraded to `^1.4.0` to match the published types for `multer@1.4.5-lts.1`).

---

## B. Root Prisma schema — fixed

### B1 ✅ APPLIED — Normalize `doc/execution/database-tools/schema.prisma`

The provided schema had **systematic formatting damage** consistent with a faulty DOCX → text conversion:

| Defect | Example | Fix |
| ------ | ------- | --- |
| Space between type and optional marker | `String ? @map(...)` | rewritten to `String? @map(...)` |
| Space inside attribute parens | `@default (uuid())` | rewritten to `@default(uuid())` |
| 4 / 8 / 12-space cascading indent after each optional field | `confidenceScore Float? @map(...)` then on the next line `        snapshotid String?` | normalized to a uniform 2-space indent inside every model |
| Over-indented `@@id`/`@@map` lines | `        @@map("workflows")` | normalized to 2-space indent |

After the fix `prisma format` and `prisma validate` both succeed on the schema:

```
> npx prisma@5 validate --schema=./schema.prisma
The schema at schema.prisma is valid 🚀
```

The original file is preserved at `doc/execution/database-tools/schema.prisma.bak`.

### B2 ⏭ PROPOSED — Drop duplicate columns (manual review required)

The unioning step in the source DOCX created sibling columns that are obviously the same field in two conventions. These are valid Prisma columns (so they don't break `prisma validate`), but they will create redundant Postgres columns and confuse application code:

| Model | Duplicate pair | Recommended kept | Recommended dropped |
| ----- | -------------- | ---------------- | ------------------- |
| `AiForecastSnapshots` | `predictedAmount` / `predictedamount` | `predictedAmount Float? @map("predicted_amount")` | `predictedamount Float?` |
| `AiForecastSnapshots` | `confidenceRangeLow` / `confidencerangelow` | `confidenceRangeLow` (mapped) | `confidencerangelow` |
| `AiForecastSnapshots` | `confidenceRangeHigh` / `confidencerangehigh` | `confidenceRangeHigh` (mapped) | `confidencerangehigh` |
| `AiForecastSnapshots` | `modelInputs` / `modelinputs` | `modelInputs` (mapped) | `modelinputs` |
| `AiForecastSnapshots` | `computedAt` / `computedat` | `computedAt` (mapped) | `computedat` |
| `TrainingSessions` | `sessionId` (PK `id`) vs `sessionid` | use PK `id`, drop `sessionid` |
| `Transcripts` | `transcriptText` / `rawtext` etc. | `transcriptText` (mapped), `fullText`, `summary` | the lowercase clones |
| `Users` | `supabaseuserid`, `avatarurl` | rename to `supabaseUserId`, `avatarUrl` with `@map(...)` |
| `Workflows` | `triggerevent` / `triggerType` | `triggerType` (mapped) | `triggerevent` (or align both with explicit semantics) |

For each row, decide which column the application code currently writes to — that's the one to keep. The other can be safely deleted **before** the first migration is generated. After the first migration this becomes a destructive change requiring data migration.

### B3 ⏭ PROPOSED — Tighten data types

| Model | Field | Current | Should be |
| ----- | ----- | ------- | --------- |
| `AiBriefs` | `generatedSummary` | `Float?` | `String?` (it's a generated text body) |
| `AiBriefs` | `generationStatus` | `Float?` | `String?` (enum-like) |
| `AiExtractionFields` | `displayOrder` | `String?` | `Int?` |
| `AiExtractionResults` | `evidenceTimestampMs` | `String?` | `Int?` |
| `AiExtractionResults` | `extractedAt` | `String?` | `DateTime?` |
| `AiBriefsCache` | `generatedAt` | `DateTime?` | OK |
| `UserDashboardPreferences` | `lastViewedAt` | `String?` | `DateTime?` |
| `UserPreferences` | `amount` | `Float?` | `Decimal? @db.Decimal(18, 2)` if monetary, else `Int?` |
| `WorkflowAuditLogs` | `metadata` | `Json?` | OK |
| `WorkflowExceptions` | `resolvedAt` | `String?` | `DateTime?` |
| `WorkflowRuns` | `idempotencykey` | `String?` | rename `idempotencyKey`; ensure `@unique` if it's supposed to be a dedupe key |

### B4 ⏭ PROPOSED — Add enums

Inline string fields like `transcriptStatus`, `callType`, `callSource`, `forecastCategory`, `status` should be Prisma enums to keep the codebase honest. See `doc/reference/docs/markdown documents/Coding standards.md` — "every string with a fixed value set must be an enum".

### B5 ⏭ PROPOSED — RLS migration

Per `doc/reference/docs/markdown documents/Security architecture.md`, every tenant-scoped table needs Postgres RLS:

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON accounts
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

This must be done in a follow-up migration after `prisma db push` because Prisma cannot model RLS policies natively. A starter file is suggested at `packages/database/prisma/migrations/<timestamp>_rls/migration.sql`.

---

## C. Unify Prisma layer (in progress / planned)

### C1 ✅ APPLIED — Pick a single source of truth

* The canonical schema for the platform is now `doc/execution/database-tools/schema.prisma`.
* All other schemas (`packages/database/prisma/schema.prisma` and every `modules/m0X/prisma/schema.prisma`) are **legacy** and should be removed after the unified schema is wired up.

### C2 ⏭ PROPOSED — Move `doc/execution/database-tools/schema.prisma` into the monorepo

```
git mv doc/execution/database-tools/schema.prisma \
       r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/packages/database/prisma/schema.prisma
```

After moving:

1. Update `packages/database/package.json` so `db:migrate` and `db:generate` point at this file (the existing scripts already do).
2. Delete each `modules/m0X/prisma/schema.prisma`.
3. Update each module's `database/prisma.module.ts` and `database/prisma.service.ts` to re-export a single shared client from `@rri/database` (see §C3).

### C3 ⏭ PROPOSED — Single shared `PrismaService`

Create `packages/database/src/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit()    { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

And a thin `PrismaModule` that exports it as `@Global()`. Then every module's local `PrismaModule` can be deleted and replaced with `import { PrismaModule } from '@rri/database';`.

### C4 ⏭ PROPOSED — Reconcile M03 Supabase usage

* `apps/web/src/modules/m03-ai-summaries-genai/modules/lib/supabase.js`, `src/lib/supabase.js`, and `modules/m03-ai-summaries-genai/services/supabase.service.ts` all instantiate a Supabase client directly.
* Replace each call site with REST calls to `apps/api`. Map them like this:

| Supabase table | New REST endpoint | Backed by |
| -------------- | ------------------ | --------- |
| `ai_briefs`            | `GET /api/v1/ai-summaries/briefs?type=...` | `AiBriefs` |
| `ai_briefs_cache`      | `GET /api/v1/ai-summaries/cache`           | `AiBriefsCache` |
| `ai_chat_history`      | `POST/GET /api/v1/ai-summaries/chat`       | `AiChatHistory` |
| `account_briefs`       | `GET /api/v1/account-intelligence/accounts/:id/brief` | `AccountBriefs` |
| `transcript_chunks`    | internal-only (used by RAG) | `TranscriptChunks` |
| `feedback`             | `POST /api/v1/feedback`                    | new `Feedback` model |

For each move, ensure the Prisma model already exists in the unified schema (most do under the `M03` and `M05` blocks).

### C5 ⏭ PROPOSED — Drop TypeORM from M04

M04 imports `@nestjs/typeorm`, `typeorm`, and ships hand-written entities (`entities/*.entity.ts`). After unifying on Prisma:

1. Rewrite repository files (`modules/m04-deal-intelligence/repositories/*.repository.ts`) to use `PrismaService` instead of TypeORM `Repository<T>`.
2. Translate each `@nestjs/typeorm` `forFeature([...])` into Prisma model usage.
3. Delete `entities/*.entity.ts`.
4. Re-enable M04 inside `apps/api/src/app.module.ts` (currently the only commented import).

---

## D. Event bus

### D1 ⏭ PROPOSED — Replace mock `EventPublisherService`

Today `modules/platform-core/events/event-publisher.service.ts` just `console.log`s. Replace with a real publisher. Two viable backends in this stack:

* **BullMQ topics** — re-use the existing Redis. Each event becomes a queue named after the event (`call.transcription.completed`). Subscribers are workers. Lowest infra cost.
* **Redis Streams** — use `ioredis` directly. Better for fan-out semantics.

Sample implementation in `doc/test_result/snippets/event-publisher.redis-streams.ts.example` (NOT shipped — outline only).

### D2 ⏭ PROPOSED — Add an `@EventConsumer()` decorator

Per `doc/reference/.../Event Schema registry.md`, consumer modules should declaratively bind to event names. A small decorator over BullMQ workers gets us 80% there without adopting Kafka.

---

## E. Docker / orchestration

### E1 ⏭ PROPOSED — Single source of compose

Today we have **three** compose files:

1. `final_product/docker-compose.yml` (unified, postgres only, the one this audit recommends).
2. `r-revenue-intelligence-monorepo/docker-compose.yml` (pgvector + redis + meili + clickhouse + api + ai-services).
3. `r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/docker-compose.yml` (same as #2 but with hard-coded `DB_NAME:-m6`).

Recommendation: keep #1 as the authoritative "DB only" stack for local Prisma work, and rewrite #2 to:

* Reuse #1's Postgres credentials (`revenue_user/revenue_pass/revenue_intelligence`).
* Swap the postgres image to `pgvector/pgvector:pg16` so M02/M03 vector flows still work.
* Add `depends_on.postgres.condition: service_healthy` and a `healthcheck` on every dependent service.
* Delete the boilerplate copy (#3) entirely.

A consolidated proposal is shown at the end of this section (search `### E2`).

### E2 ⏭ PROPOSED — Reference compose

```yaml
# r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: revenue_intel_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: revenue_user
      POSTGRES_PASSWORD: revenue_pass
      POSTGRES_DB: revenue_intelligence
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U revenue_user -d revenue_intelligence"]
      interval: 10s
      timeout: 5s
      retries: 5
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping"]
      interval: 10s
      retries: 5
  meilisearch:
    image: getmeili/meilisearch:v1.7
    ports: ["7700:7700"]
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:-masterkey}
  api:
    build: ./apps/api
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    environment:
      DATABASE_URL: postgresql://revenue_user:revenue_pass@postgres:5432/revenue_intelligence?schema=public
      REDIS_HOST:   redis
      REDIS_PORT:   6379
    ports: ["3001:3001"]
  ai-services:
    build: ./apps/ai-services
    environment:
      OPENAI_API_KEY:     ${OPENAI_API_KEY}
      ASSEMBLYAI_API_KEY: ${ASSEMBLYAI_API_KEY}
    ports: ["8000:8000"]
volumes:
  pgdata:
    name: revenue_intel_pgdata
```

---

## F. Frontend / missing routes & features

### F1 ⏭ PROPOSED — Add the routes referenced from the landing page

`apps/web/src/app/page.tsx` links to `/datasets` and `/dashboards`, neither of which exists. Add:

* `apps/web/src/app/datasets/page.tsx` → renders Dataset Builder shell, fed by `@/modules/m07-revenue-dashboards/components/...`.
* `apps/web/src/app/dashboards/page.tsx` → renders Dashboard Builder shell.

### F2 ⏭ PROPOSED — Drop the dangling `@rri/database` dep

`apps/web/package.json` declares `"@rri/database": "workspace:*"` but the web app never imports anything from that package (and the package only ships a Prisma schema, no client). Remove the dep.

### F3 ⏭ PROPOSED — Move `localFallbackExtraction` into M01

The function deleted from `apps/api/src/main.ts` belongs in `modules/m01-capture-transcription/services/`. Suggested file: `services/local-extraction.service.ts`. The M01 transcription worker should call it when `process.env.AI_SERVICES_URL` is unset.

### F4 ⏭ PROPOSED — Wire the M02/M03/M04 vendored sub-apps

The vendored Vite apps under `m03-ai-summaries-genai/`, `m04-deal-intelligence/`, and `m09-coaching-training/` are not part of the Next.js build. Options:

* **Integrate** — port their components into the Next.js layout (preferred long-term).
* **Iframe** — host them on separate ports and embed via `<iframe />` (fastest path to "every feature works in the same app shell").
* **Freeze** — mark them deprecated and rewrite from scratch (highest effort).

Pick per module based on TDD priority.

---

## G. Documentation reconciliation

### G1 ⏭ PROPOSED — Update `Local-Dev-Setup-Guide.md`

The setup guide references the old `revenue_intel` database name. Replace all references with `revenue_intelligence` and the unified `revenue_user/revenue_pass` creds.

### G2 ⏭ PROPOSED — Snapshot `System_architecture.md` against reality

The SAD describes features that are not implemented (e.g. AI Trainer voice simulation, Forecast Boards rollup). Add a "Reality column" to each feature table marking `IMPLEMENTED / PARTIAL / NOT STARTED`. The per-module `analysis_<module>.md` files already contain this status; the SAD just needs to consume it.

---

## H. Smoke-blocking issues vs implementation issues — explicit list

The table below lets a future agent decide what to fix first when running the smoke plan in `smoke_test_plan.md`.

| # | Severity | Blocks smoke? | Fixed in this audit? | File |
| - | -------- | ------------- | -------------------- | ---- |
| 1 | CRITICAL | yes — TS compile error | ✅ | `apps/api/src/main.ts` |
| 2 | CRITICAL | yes — TS compile error | ✅ | `apps/api/src/app.module.ts` |
| 3 | CRITICAL | yes — invalid JSON | ✅ | `apps/api/tsconfig.json` |
| 4 | CRITICAL | yes — invalid Prisma | ✅ | `doc/execution/database-tools/schema.prisma` |
| 5 | HIGH | partial — m04 disabled | ⏭ | M04 Prisma reconciliation |
| 6 | HIGH | yes — produces silent events | ⏭ | `platform-core/events/event-publisher.service.ts` |
| 7 | MEDIUM | no | ⏭ | duplicate columns in unified schema |
| 8 | MEDIUM | no | ⏭ | M03 Supabase migration |
| 9 | MEDIUM | no | ⏭ | RLS migration |
| 10 | MEDIUM | no | ⏭ | `packages/database/prisma/schema.prisma` missing `@@schema("public")` on M01 models |
| 11 | LOW | no | ⏭ | naming inconsistency (`@rri/*` vs `@r-revenue/*`) |
| 12 | LOW | no | ⏭ | `apps/web/src/app/{datasets,dashboards}/page.tsx` missing |

After items 1–4 (already applied), the API should compile and start in `DISABLE_REDIS=true` mode with the unified Postgres. Verify with `smoke_test_plan.md` Sections 1–2.
