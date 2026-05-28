# R-Revenue Intelligence — Repository Knowledge Base (`version_knowledge.md`)

> **Status:** Draft v1 produced by automated end-to-end repository audit.
> **Generated:** 2026-05-26 by Claude (Cursor) — Principal Software Architect mode.
> **Source of truth for:** Cursor, Codex, AI agents, onboarding, debugging, integrations, smoke testing.
>
> This document is the **single source of truth for the repository as it exists today**. It records what is actually in the codebase (not what the architecture docs *aspire* to). When the implementation and the docs disagree, the disagreement is recorded explicitly with a `MISMATCH` flag.

---

## 1. Repository Layout (Top of `final_product/`)

```
final_product/
├── docker-compose.yml                                 ← UNIFIED Postgres-only stack (Prisma source of truth)
├── env                                                ← DATABASE_URL for the unified stack
├── README-docker.md
├── schema.prisma                                      ← UNIFIED root Prisma schema (170 models)
├── schema.prisma.bak                                  ← Backup of the corrupted original (kept for diff)
├── normalize_root_schema.py                           ← Tool that fixed the schema corruption
├── Final_Clean_Global_Database_Schema_M01_M10.docx    ← Source spec for the unified schema
└── r-revenue-intelligence-monorepo/                   ← The actual codebase
    ├── boilerplate code/
    │   ├── BOILERPLATE-MASTER-PLAN.md
    │   ├── generate_boilerplate.py
    │   ├── audit_boilerplate.py
    │   ├── syntax_validator.py
    │   └── r-revenue-intelligence/                    ← THE monorepo
    │       ├── apps/
    │       │   ├── api/                               ← NestJS (TypeScript) backend
    │       │   ├── web/                               ← Next.js 14 frontend
    │       │   └── ai-services/                       ← FastAPI (Python) AI workloads
    │       ├── modules/
    │       │   ├── platform-core/                     ← guards (TenantGuard, JwtGuard, HMAC), EventPublisher
    │       │   ├── m01-capture-transcription/
    │       │   ├── m02-conversation-intelligence/
    │       │   ├── m03-ai-summaries-genai/
    │       │   ├── m04-deal-intelligence/             ← ⚠ Largest module (177 .ts files); independent product
    │       │   ├── m05-account-intelligence/
    │       │   ├── m06-forecasting-prediction/
    │       │   ├── m07-revenue-dashboards/
    │       │   ├── m08-sales-engagement/
    │       │   ├── m09-coaching-training/
    │       │   └── m10-data-compliance/
    │       ├── packages/
    │       │   ├── database/                          ← @rri/database — secondary Prisma schema (717 lines)
    │       │   └── shared-types/                      ← @rri/shared-types — DTOs + event contracts
    │       ├── docs/                                  ← AI feature READMEs (Tracker, Theme Spotter, Call Reviewer)
    │       ├── docker-compose.yml                     ← Older/parallel orchestration (postgres + redis + meili + clickhouse + api + ai-services)
    │       ├── .env.example
    │       ├── pnpm-workspace.yaml
    │       ├── turbo.json
    │       └── package.json
    ├── docs/markdown documents/                       ← git-branching-strategy.md
    └── doc/reference/
        ├── docs/markdown documents/                   ← System_architecture.md, Coding standards, Event Schema registry, NFRs, Security…
        ├── archives/
        └── M{1..10} *.docx + TDD/                     ← Per-module TDDs, sequence diagrams, env-var registries
```

### 1.1 Pillars (per repo README)

1. **Boilerplate Code** — runnable modular-monolith monorepo (this is what we are auditing).
2. **Reference Documents** — TDDs, sequence diagrams, system architecture document (SAD), coding standards, event schema, NFRs, security architecture.

### 1.2 Top-level workspace (`r-revenue-intelligence`)

| Key | Value |
| --- | --- |
| Workspace manager | `pnpm@10.14.0` (defined in root `package.json`) |
| Workspace builder | `turbo@^2.0.0` (root `turbo.json` configures `build`, `dev`, `test`, `db:migrate`, `db:generate`) |
| TS version | `5.x` |
| Workspaces | `apps/*`, `packages/*`, `modules/*` |
| Root dev script | `pnpm dev` ⇒ `pnpm --parallel --filter api --filter web run dev` |
| Root build script | `pnpm -r run build` |
| Root db scripts | `pnpm db:migrate`, `pnpm db:generate` (both filter to `database` package) |

---

## 2. High-Level Architecture

### 2.1 Runtime topology (as implemented)

```
                 ┌──────────────────────────────────────────────┐
                 │  Next.js Web (apps/web, port 3000/3005)      │
                 │  src/app  + src/components + src/modules/m0X │
                 └───────────────┬──────────────────────────────┘
                                 │  REST (api/v1/<domain>)
                                 ▼
                 ┌──────────────────────────────────────────────┐
                 │  NestJS API (apps/api, port 3001)            │
                 │  AppModule wires all M01..M10 backend modules│
                 │  + BullMQ (Redis) for async jobs             │
                 └──────┬──────────────────┬────────────────────┘
                        │                  │
              ┌─────────▼─────────┐  ┌─────▼──────────────────────┐
              │  PostgreSQL + pgvector (5432)   │  │  Redis (6379)              │
              │  Prisma client (per-module)     │  │  BullMQ queues (m0X-queue) │
              └─────────────────────────────────┘  └────────────────────────────┘
                        │
                        │  HTTP (port 8000, internal)
                        ▼
                 ┌──────────────────────────────────────────────┐
                 │  FastAPI ai-services (apps/ai-services)      │
                 │  /v1/transcription, /v1/extraction           │
                 │  prompts/ (Jinja templates), services/       │
                 │  external: AssemblyAI, OpenAI                │
                 └──────────────────────────────────────────────┘
```

Optional / referenced but **not wired by default**: `Meilisearch:7700`, `ClickHouse:8123/9000` (declared in the boilerplate `docker-compose.yml` but no module actively integrates them at runtime — they are scaffolded for future M02 hybrid search + M07 OLAP fallback).

### 2.2 Module map (backend → frontend → docs)

| #   | Backend module                            | Frontend module (`apps/web/src/modules`)    | Reference docs           | Notes |
| --- | ----------------------------------------- | ------------------------------------------- | ------------------------ | ----- |
| M01 | `m01-capture-transcription`               | `m01-capture-transcription`                 | `M1 Capture & Transcription/TDD/*` | Calls + transcripts + AI extraction. Real Prisma. Has BullMQ worker. |
| M02 | `m02-conversation-intelligence`           | `m02-conversation-intelligence`             | `M2 Conversation Intelligence/TDD/*` (Smart tracker, Theme spotter, Topic tagger, Transcriber, Translator, Searchable Library) | Hybrid search, trackers, theme detection. Mostly stubbed services; one feature subtree under `features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/` contains a vendored mini-monorepo. |
| M03 | `m03-ai-summaries-genai`                  | `m03-ai-summaries-genai`                    | `M3 AI Summaries & GenAI/TDD/*` (Ask Anything, AI Smart Summaries, AI Deep Researcher) | Frontend is a **vendored Vite app + a Next.js app inside `apps/web`** with its own `package.json`. Mixes Supabase + Gemini + OpenAI; not yet reconciled to Prisma. |
| M04 | `m04-deal-intelligence`                   | `m04-deal-intelligence`                     | `M4 Deal Intelligence/TDD/*` (Deals Boards, View Deal Drivers) | Largest module — 177 TS files, full controllers/services/repositories + Prisma. Currently **commented out of `AppModule`**. |
| M05 | `m05-account-intelligence`                | `m05-account-intelligence`                  | `M5 Account Intelligence/TDD/*` | Account boards, AI briefs cache, todos. |
| M06 | `m06-forecasting-prediction`              | `m06-forecasting-prediction`                | `M6 Forecasting & Prediction/TDD/*` (AI Revenue Predictor, Forecast Boards) | Has HubSpot + executive controllers. |
| M07 | `m07-revenue-dashboards`                  | `m07-revenue-dashboards`                    | `M7 Revenue Dashboards/TDD/*` + sequence diagrams | Dataset/Dashboard/Widget builder. Mounted in `apps/web/src/app/page.tsx` (`KpiCard`). |
| M08 | `m08-sales-engagement`                    | `m08-sales-engagement` (1 file only)        | `M8 Sales Engagement/TDD/*` (Email Composer, Orchestrate, Workflow Automation, Engage To-Do) + 2 ADRs | Workflows + tasks. Frontend is bare. |
| M09 | `m09-coaching-training`                   | `m09-coaching-training`                     | `M9 Coaching & Training/TDD/*` (AI Trainer, Sales Coaching Insights) | Coaching snapshots, AI trainer scenarios — secondary Prisma `dashboards` schema covers these. |
| M10 | `m10-data-compliance`                     | `m10-data-compliance`                       | `M10 Data & Compliance/TDD/*` (Revenue Graph, Data Cloud/Export, Compliance Settings) | Has `revenue-graph.controller.ts`, `data-cloud.controller.ts`. |
| —   | `platform-core`                           | (none)                                       | `doc/reference/docs/markdown documents/*` | `TenantGuard`, `JwtGuard`, `HmacWebhookGuard`, `EventPublisherService` (currently **mock-only**: just `console.log`). |

### 2.3 Naming convention inconsistencies (MISMATCH)

| Convention             | Where it appears                                                   |
| ---------------------- | ------------------------------------------------------------------ |
| `@r-revenue/*`         | `modules/*/package.json` and `apps/api/package.json` workspace deps |
| `@rri/*`               | `apps/web/package.json` (`@rri/database`), `packages/database/package.json`, `packages/shared-types/package.json` |
| Unscoped (`api`)       | `apps/api/package.json`                                            |
| Unscoped (`@rri/web`)  | `apps/web/package.json`                                            |

`apps/api` depends on `@r-revenue/platform-core` and `@r-revenue/m01..m10` (workspace:*) but `apps/web` depends on `@rri/database`. There is **no package named `@rri/database` published from the monorepo** (the database package is `@rri/database` but it has no source files exported — only a `prisma/schema.prisma`). The `apps/web` import is therefore a dangling workspace reference.

---

## 3. Database / Prisma Reconciliation

### 3.1 Two parallel Prisma schemas exist today

| Schema file                                                                                  | Lines | Models | Status |
| -------------------------------------------------------------------------------------------- | ----: | -----: | ------ |
| `doc/execution/database-tools/schema.prisma`                                                                | 3140  |   170  | ✅ Normalized & `prisma validate`-passing as of this audit. Treat as **the unified source of truth** for all M01–M10 tables. |
| `r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/packages/database/prisma/schema.prisma` | 717   |  ~40  | ⚠ Uses `previewFeatures = ["multiSchema"]` + `schemas = ["dashboards","public"]`. Some models added after M-01 are **missing `@@schema("public")`** → `prisma validate` fails. |
| Per-module schemas (`modules/m0X/prisma/schema.prisma`)                                      | 10–600|  1–60 | Bootstrap-only or duplicating subset of the package schema. Each repeats `datasource db` and `generator client` and would clobber a shared client if all ran `prisma generate`. |

> **Decision recommended:** treat `doc/execution/database-tools/schema.prisma` as canonical. Move it to `packages/database/prisma/schema.prisma`, delete or freeze per-module schemas, keep them only for documentation. See `implementation_changes.md` for the migration path.

### 3.2 The unified `doc/execution/database-tools/schema.prisma`

* Generator: `prisma-client-js`
* Datasource: `postgresql`, `url = env("DATABASE_URL")`
* `170` models, no enums (enums are inlined as `String?` today).
* Highest-traffic entities: `Accounts`, `Activities`, `Calls`, `Transcripts`, `Deals` (alias `M04Deal` in module schemas), `Forecasts`, `Workflows`, `Users`, `UserRoles`, `Tenant` (implicit — every table has `tenantId String`).
* Known data-quality issues that survived normalization (need a separate cleanup pass; tracked in `implementation_changes.md`):
  * **Duplicate columns** (camelCase + lowercase aliases) in: `AiForecastSnapshots`, `TrainingSessions`, `Transcripts`, `WorkflowRuns`, `Workflows`, `Users`.
  * Some fields typed `Float` that obviously should be `String` (e.g. `generatedSummary Float?` in `AiBriefs` → should be `String?`).
  * Some `DateTime` fields typed `String` (e.g. `evidenceTimestampMs String?`, `extractedAt String?` in `AiExtractionResults`).

### 3.3 The unified Postgres container

`final_product/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: revenue_intel_db
    environment:
      POSTGRES_USER: revenue_user
      POSTGRES_PASSWORD: revenue_pass
      POSTGRES_DB: revenue_intelligence
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: pg_isready -U revenue_user -d revenue_intelligence
volumes:
  pgdata: { name: revenue_intel_pgdata }
```

`final_product/env`:

```
DATABASE_URL="postgresql://revenue_user:revenue_pass@localhost:5432/revenue_intelligence?schema=public"
```

> **Note:** this container does **not** install `pgvector`. The boilerplate `docker-compose.yml` (inside the monorepo) uses `pgvector/pgvector:pg16` because M02 (Conversation Intelligence) and M03 (RAG / Ask Anything) reference vector columns. To run both unified and vector-enabled flows we recommend swapping the image of the unified `postgres` service to `pgvector/pgvector:pg16` *or* enabling the boilerplate compose for hybrid-search smoke tests. See `implementation_changes.md`.

### 3.4 Other DB stacks referenced in the codebase (legacy / partial)

| Stack | Where | Migration target |
| ----- | ----- | ---------------- |
| Supabase JS client (`@supabase/supabase-js`) | `apps/web/src/modules/m03-ai-summaries-genai/modules/lib/supabase.js` + `src/lib/supabase.js` + `services/supabase.service.ts` | All Supabase reads/writes must move to Prisma-backed REST endpoints exposed by `apps/api`. M03 frontend should call `apps/api` not Supabase directly. |
| Raw Postgres / TypeORM (`typeorm` dep in `apps/api/package.json`) | Imported but no actual `DataSource` configured in `app.module.ts` | Remove dependency, use only Prisma client. |
| Per-module Prisma `PrismaService` instances (one per module) | Every backend module has its own `database/prisma.service.ts` and `database/prisma.module.ts` | Replace with a single shared `PrismaService` exported from `@rri/database` (or `packages/database/src/prisma.service.ts` newly created). |
| ClickHouse (`clickhouse-server:24`) | Only referenced in `boilerplate code/.../docker-compose.yml` and in `M7 Revenue Dashboards/sequence diagrams/sequence-clickhouse-fallback.md` | Out of scope for Prisma reconciliation. Keep as future OLAP cache. |
| Meilisearch | `boilerplate.../docker-compose.yml` + `apps/api`'s `.env.example` | Referenced for M02 hybrid search; current code uses an in-process `HybridSearchService` mock. Keep service definition; document as optional in smoke plan. |

### 3.5 Conceptual ERD (high-level relationships)

```
Tenant 1───* User
Tenant 1───* Accounts ───* Deals ───* Activities
Tenant 1───* Calls ───1 Transcripts ───* Utterances
                          │
                          ├──* AiExtractionResults ─*─1 AiExtractionFields
                          ├──* CallShares
                          ├──* CallNotes
                          └──* TranscriptCorrections
Tenant 1───* Workflows ───* WorkflowRuns ───* WorkflowAuditLogs / Exceptions
Tenant 1───* Forecasts / ForecastBoards / AiForecastSnapshots
Tenant 1───* Dashboards ───* Widgets
Tenant 1───* Datasets ───* DatasetRelationships / DatasetObject / DatasetField
              │
              └──1 DataSource ──* DataSourceObject ──* DataSourceField
Tenant 1───* AuditLogs (immutable)
Tenant 1───* Integrations (HubSpot, Zoom, Teams, Google, Gmail)
Tenant 1───* AiBriefs / AiBriefsCache / AccountBriefs / AiChatHistory
Tenant 1───* coachingsnapshots / coachingrecommendations / trainerscenarios / trainersessions
```

Tenant isolation is enforced **only at the application layer** (every repository method takes a `tenantId` parameter). The Reference SAD says RLS *should* be enabled at the DB level, but no RLS policies exist in the migrations folder. This is a recorded gap.

---

## 4. Backend (apps/api + modules/) — module-by-module

> Full per-module deep dives live in the `analysis_<module>.md` files. The block below is the cross-reference index.

### 4.1 `apps/api`

* **Entrypoint:** `src/main.ts`. ⚠ This file is **broken on disk** — it contains a literal GitHub conflict URL on line 22 and references `fs`, `multer`, and a `localFallbackExtraction` helper without importing them. It is fixed in this audit (see `implementation_changes.md`, item §A1).
* **Module wiring:** `src/app.module.ts`. ⚠ Originally also broken: missing `import { BullModule } from '@nestjs/bullmq'`, missing `import { M01CaptureTranscriptionModule } from '../../../modules/m01-capture-transcription/...'`, etc. Fixed in this audit (item §A2).
* **`tsconfig.json`:** ⚠ Malformed JSON — duplicate `target`/`outDir`/`strict-ish` keys and an out-of-object `baseUrl` block after the closing `}`. Fixed in §A3.
* **`package.json`:** ⚠ Duplicates of `@nestjs/bullmq`, `@nestjs/passport`, `bullmq`, `dotenv`, `prisma`, `zod`, and `@r-revenue/platform-core`. Also depends on `typeorm` (unused at runtime). Fixed in §A4.

### 4.2 `modules/platform-core`

| File | Purpose |
| ---- | ------- |
| `guards/tenant.guard.ts` | Reads `x-tenant-id` header (or `req.user.tenantId`) → sets `req.tenantId`. |
| `guards/jwt.guard.ts` | Passport JWT guard. |
| `guards/hmac-webhook.guard.ts` | Verifies inbound webhook HMAC signature. |
| `events/event-publisher.service.ts` | **MOCK** — only logs to stdout. Reference SAD calls for an event bus (Kafka/Redis Streams/SQS); current code never publishes anywhere. |
| `events/event-publisher.module.ts` | NestJS module wrapping the publisher. |

### 4.3 Quick stats (lines of code & artifact counts per module)

| Module | TS files (non-`.d.ts`) | Controllers | Services | Repositories | Has Prisma schema | Has migrations folder | Has BullMQ worker |
| ------ | ---------------------: | ----------: | -------: | -----------: | ----------------: | -------------------: | ----------------- |
| platform-core | 5 | 0 | 1 | 0 | n/a | n/a | n/a |
| m01 | 22 | 4 (m01, calls, upload, webhook) | 5 + prisma | 6 | yes (1 model) | yes | **yes** (`m01-queue`) |
| m02 | 23 | 6 | 9 + prisma | 2 | yes (12 models) | yes | no |
| m03 | 22 | 4 | 8 + prisma + supabase | 1 | yes (1 model) | yes | no |
| m04 | 177 | 35 | 43 | 3 | yes (extensive) | yes | (declared) |
| m05 | 27 | 10 | 10 + prisma | 1 | yes | yes | no |
| m06 | 34 | 3 | 3 + prisma | 1 | yes | yes | no |
| m07 | 15 | 1 | 2 + prisma | 1 | yes | yes | no |
| m08 | 19 | 3 | 4 + prisma | 3 | yes | yes | no |
| m09 | 32 | 2 | 2 + prisma | 1 | yes | yes | no |
| m10 | 23 | 3 | 4 + prisma | 3 | yes | yes | no |

### 4.4 API surface (representative — full per-module breakdown is in `analysis_*.md`)

| Module | Base path | Sample endpoints |
| ------ | --------- | ---------------- |
| M01 | `/api/v1/capture-transcription` | `GET/POST /calls`, `GET /calls/:id`, `GET /calls/search`, `POST /calls/:id/notes`, `POST /calls/:id/share`, `PATCH /utterances/:id`, `* /calls/:id/next-steps`, `POST /calls/upload` (multer), `POST /webhooks/assemblyai` |
| M02 | `/api/v1/conversation-intelligence` | `GET /conversations/search`, `GET /conversations`, `GET /conversations/:id`, `POST /saved-searches`, `GET /saved-searches`, plus `/topics`, `/topic-tags`, `/trackers`, `/translation`, `/vocabulary-corrections` |
| M03 | `/api/v1/ai-summaries` (inferred) | feedback, query, research |
| M04 | `/api/v1/deals`, `/api/v1/boards`, `/api/v1/analytics`, etc. | extensive — see file list |
| M05 | `/api/v1/account-intelligence` | accounts, activities, ai, boards, edits, preferences, sync, todos, webhooks |
| M06 | `/api/v1/forecasting` | executive, hubspot, m06 |
| M07 | `/api/v1/revenue-dashboards` | m07 + dataset/dashboard CRUD |
| M08 | `/api/v1/sales-engagement` | m08, task, workflow |
| M09 | `/api/v1/coaching-training` | m09 |
| M10 | `/api/v1/data-compliance` | data-cloud, revenue-graph, m10 |

> **MISMATCH:** the Reference SAD (`API Design Standards.md`) requires `/api/v1/<noun-kebab>` paths for **every** external endpoint, but M02 and M04 mix `/api/v1/conversation-intelligence/...` with `/conversations` and `/deals`. Already inconsistent inside the codebase — keep the verbose prefix and treat the bare paths as aliases.

---

## 5. Frontend (`apps/web/src/modules/m0X`)

### 5.1 Three different frontend conventions coexist (MISMATCH)

| Convention                                                        | Modules                                                  | Implication |
| ----------------------------------------------------------------- | -------------------------------------------------------- | ----------- |
| **Co-located Next.js feature folder** (`api/`, `components/`, `pages/`) | m01 | Standard Next 14 App Router – integrates cleanly with `apps/web/src/app`. |
| **Just a `components/` folder consumed from `apps/web/src/app/*`**| m02, m05, m07                                            | Components are imported via `@/modules/m07-revenue-dashboards/components/kpi-card` etc. |
| **Vendored mini-app (its own `package.json`, Vite, Tailwind)**    | m03 (Vite app + Supabase + Gemini), m04 (Vite app + Zustand), m09 (Vite app) | These were dropped in from another repo. They are **not built** by `pnpm dev` in the root because root dev only runs `--filter web --filter api`. Their `package.json` files are also ignored by `pnpm-workspace.yaml` (only `apps/*`, `packages/*`, `modules/*` are workspace globs). Treat them as static reference UI until integrated. |

### 5.2 Top-level routing (`apps/web/src/app`)

```
src/app
├── admin/
├── board/[slug]/
├── calls/                 (+ [callId])
├── conversation-intelligence/
├── extraction-library/
├── forecasting/
├── login/
├── signup/
├── m05/
├── m3/
├── modules/m10-data-compliance/revenue-graph/
├── globals.css            ← single design system ("Light Mode Slate")
└── page.tsx               ← landing → links to /datasets and /dashboards
```

> **GAP:** `page.tsx` links to `/datasets` and `/dashboards` but those routes do not exist as folders under `apps/web/src/app/`. Add them (see `implementation_changes.md`, §F1).

### 5.3 Shared UI

`apps/web/src/components/`:
* `layout/DashboardLayout.tsx`, `Header.tsx`, `Sidebar.tsx`
* `ui/Badge.tsx`, `HoverRow.tsx`, `StatCard.tsx`

`apps/web/src/middleware.ts` — role-based access via `x-user-role` header or cookie. Allowed roles per route are hard-coded; should use a config registry per Reference SAD §RBAC.

### 5.4 State management

Frontend uses **`zustand`** (declared in `apps/web/package.json`). The m04 vendored app uses its own zustand stores under `m04-deal-intelligence/stores/`. No Redux. No React Query / TanStack Query is wired up — each `api/*.api.ts` file calls `fetch` directly.

---

## 6. AI services (`apps/ai-services`, Python/FastAPI)

```
apps/ai-services/
├── Dockerfile
├── requirements.txt
└── app/
    ├── main.py                              (mounts /v1/transcription, /v1/extraction)
    ├── models/extraction_models.py
    ├── routers/transcription.py
    ├── routers/extraction.py
    └── services/
        ├── assemblyai_service.py
        └── extraction_service.py
prompts/
├── extract_highlights/v1.jinja2
└── summarize/v1.jinja2
```

* Listens on port `8000`, CORS allows `http://localhost:3000` only.
* `transcription.py` integrates AssemblyAI. `extraction.py` runs deterministic + LLM extraction over transcripts.
* No auth (just CORS); intended to be reached **only** from `apps/api` over the Docker network.

> **GAP:** there is no shared contract package between `apps/api` (TypeScript) and `apps/ai-services` (Python). Add JSON Schema or generate Pydantic models from the same OpenAPI as the NestJS controllers expose (M01 has `@nestjs/swagger` declared).

---

## 7. Async / Event flow

### 7.1 BullMQ queues

| Queue name | Producer | Consumer worker | Trigger event |
| ---------- | -------- | --------------- | ------------- |
| `m01-queue` | `CallService.createCall` → enqueues transcription job | `M01CaptureTranscriptionWorker` | `call.transcription.completed` (currently mocked via `console.log`) |

(Other modules import `BullModule.forRoot` but do not register named queues yet. The `apps/api/src/app.module.ts` originally registered **two** `BullModule.forRoot(...)` configurations — fixed: consolidated to one in §A2.)

### 7.2 Event bus

`platform-core/events/event-publisher.service.ts` is a **mock** — it `console.log`s but does not publish to Kafka/Redis Streams. Reference docs (`Event Schema registry.md`) define ~30 `noun.verb` events such as `call.transcription.completed`, `deal.stage.changed`, `forecast.submitted`. None of those are actually delivered cross-module; producers and consumers are wired by direct Nest DI.

> **GAP:** to make the architecture diagram in §2.1 truthful, either (a) implement the publisher against Redis Streams (BullMQ already provides a Redis connection) or (b) keep DI-based wiring and update the SAD.

---

## 8. Auth flow

| Component | What it does | Status |
| --------- | ------------ | ------ |
| `TenantGuard` | Pulls `x-tenant-id` from header or `req.user.tenantId` | implemented, used on all controllers |
| `JwtGuard` | `passport-jwt` strategy; expects `Authorization: Bearer <jwt>` | scaffolded only; no `JwtStrategy` class registered in `app.module.ts` |
| `HmacWebhookGuard` | Verifies HMAC for inbound webhooks (HubSpot, AssemblyAI, telephony) | scaffolded |
| Web middleware | Role gate via `x-user-role` header/cookie | implemented |
| Login/Signup pages | `apps/web/src/app/login/page.tsx`, `signup/page.tsx` | exist as plain pages — no API integration yet |

> **GAP:** there is no JWT issuance endpoint. The SAD assumes Supabase Auth — but only M03 actually imports `@supabase/supabase-js`. For smoke testing we treat `x-tenant-id` + (optional) `x-user-id` headers as the authentication boundary.

---

## 9. Configuration & Environment

### 9.1 Unified env (this audit's recommendation)

`final_product/env` (and `.env` after `cp env .env`):

```
DATABASE_URL="postgresql://revenue_user:revenue_pass@localhost:5432/revenue_intelligence?schema=public"
```

### 9.2 Boilerplate env (`r-revenue-intelligence/.env.example`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_intel
REDIS_URL=redis://localhost:6379
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=masterkey
AI_SERVICES_URL=http://localhost:8000
GROQ_API_KEY=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
```

> **MISMATCH:** the unified Postgres uses `revenue_user/revenue_pass/revenue_intelligence` whereas the boilerplate `.env.example` uses `postgres/postgres/revenue_intel`. The boilerplate compose also defaults `POSTGRES_DB` to `${DB_NAME:-m6}` (legacy from M06 isolation). For consistent local dev we recommend deleting the boilerplate compose and only using the unified one. Mappings in `implementation_changes.md` §C.

### 9.3 Per-module env registries (under `doc/reference/`)

* `M-01 Environment Variables Registry.md`
* `Environment Variables Registry-M2.md` (M2)
* `M3 Environment Variables Registry.md`
* `Environment Variables Registry-M4.md`
* `Environment Variables Registry-M5 Account Intelligence.md`
* `Environment Variables Registry-M6.md`
* `M7 Revenue Dashboards/env-registry.md`
* `Environment Variables Registry-M8.md`
* `Environment Variables Registry M9.md`
* `Environment Variables Registry-M10.md`

Each registry lists the per-module env-vars (API keys, signing secrets, queue names). They must be merged into a single `.env.example` at the monorepo root — currently many vars in the registries are not present in any `.env.example` (e.g. `ASSEMBLYAI_API_KEY`, `HUBSPOT_CLIENT_SECRET`).

### 9.4 Doppler

`.doppler.yaml` is present at both repo root and monorepo root — the team uses Doppler for secrets in CI. Local dev still uses `.env`.

---

## 10. Integrations (from code + reference docs)

| Integration | Module(s) | Mechanism in code | Notes |
| ----------- | --------- | ----------------- | ----- |
| AssemblyAI (ASR) | M01 | `apps/ai-services/app/services/assemblyai_service.py` + webhook controller in M01 | Real SDK usage. Requires `ASSEMBLYAI_API_KEY`. |
| OpenAI | M03, M01 (extraction) | `apps/ai-services/app/services/extraction_service.py` + summarize prompt | Used by Python service; Node code only invokes `apps/ai-services`. |
| Gemini (Google) | M03 (frontend vendored app) | `apps/web/src/modules/m03-ai-summaries-genai/modules/services/gemini.js` | Direct browser → Gemini call. Should be proxied through `apps/api`. |
| Supabase | M03 only | `m03-ai-summaries-genai/modules/lib/supabase.js`, `services/supabase.service.ts` | Legacy. Migration path documented in §C of `implementation_changes.md`. |
| HubSpot | M04 (`hubspot-client.service.ts`), M06 (`hubspot.controller.ts`, `hubspot.service.ts`) | REST client | Webhooks via `webhook.controller.ts` in M04 + M05. |
| Zoom / Teams / Meet | M01 | Stub connector cards in `apps/web/.../ConnectorCards.tsx` | Implementation pending — flagged in TDDs. |
| Gmail / Outlook | M01 | declared in `Integration` model (provider field) | Implementation pending. |
| Meilisearch | M02 (intended) | declared in compose + env example | No code calls Meilisearch yet. |
| ClickHouse | M07 (intended fallback) | declared in compose | No code calls ClickHouse yet. |

---

## 11. Documentation cross-reference

### 11.1 Platform-wide docs (`doc/reference/docs/markdown documents/`)

| Doc | Purpose | Sync state |
| --- | ------- | ---------- |
| `System_architecture.md` | SAD v1 draft — 19 sections, 25 features | Aspirational; many features not yet implemented (see implementation_changes §F). |
| `Coding standards.md` | Machine-enforceable rules | Mostly respected; naming inconsistencies in §2.3 violate it. |
| `Event Schema registry.md` | All cross-module event names + payloads | Producers exist but only logged. Consumers are coupled via DI. |
| `API Design Standards.md` | REST + internal API conventions | Partially followed (see §4.4 MISMATCH). |
| `Database Schema.md` | Pre-unification ER notes | Superseded by `doc/execution/database-tools/schema.prisma`. |
| `Module boundary document.md` | Defines product-vs-architecture module boundary (esp. M8 ADR-001) | Partially respected. |
| `Non-Functional Requirements (NFR) Specification.md` | Perf, scale, availability targets | No code-level instrumentation yet. |
| `Security architecture.md` | RBAC, RLS, secrets | RLS not implemented; secrets via Doppler. |
| `Local-Dev-Setup-Guide.md` | Bootstrap instructions | Outdated — references old DB names. |
| `team-handover-launchpad.md`, `developer-and-lead-playbook.md` | Process docs | n/a |
| `complete_codebase_knowledge_base.md` | Existing knowledge attempt | Superseded by this file. |

### 11.2 Per-module Reference docs

* Each module has `Module README-MX *.md`, a `Sequence Diagrams-*.md`, a per-module env registry, and a `TDD/` folder containing one TDD per feature.
* M4–M9 also ship a `drift-analysis.md` recording known gaps between TDD and implementation. These were the starting point for this audit.

---

## 12. Test & smoke status

* **Backend unit tests** present in m04 only: `deal-board.controller.spec.ts`, `deal-board.service.spec.ts`, `deal-board.service.simple.spec.ts`, `deal-drivers.service.spec.ts`, `ai-score-warning.service.spec.ts`. Jest is configured in `apps/api/package.json` (root: `src`).
* **No frontend tests** exist (no `*.test.tsx` files, no `jest.config.*` under `apps/web`).
* **No e2e tests.**
* **No CI workflows** are wired (`.github/` exists at the repo root but is empty in this snapshot).

A complete smoke strategy is in `smoke_test_plan.md`.

---

## 13. Quick-start (post-audit)

```bash
# 1) Start the unified Postgres
cd final_product
docker compose up -d
cp env .env

# 2) Validate + push the unified Prisma schema
npx --yes prisma@5 format    --schema=./schema.prisma
npx --yes prisma@5 validate  --schema=./schema.prisma
npx --yes prisma@5 db push   --schema=./schema.prisma    # first-time bootstrap
npx --yes prisma@5 generate  --schema=./schema.prisma

# 3) Install the monorepo
cd "r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence"
pnpm install

# 4) Point the monorepo at the unified DB
#    Either:
#      - copy final_product/env → r-revenue-intelligence/.env, OR
#      - set DATABASE_URL in your shell before running pnpm dev
$Env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@localhost:5432/revenue_intelligence?schema=public"
$Env:DISABLE_REDIS = "true"   # if you don't want to spin up Redis just yet

# 5) Run API + Web in parallel
pnpm dev
# → API at http://localhost:3001, Web at http://localhost:3000

# 6) Smoke test
curl http://localhost:3001/api/v1/capture-transcription/calls -H "x-tenant-id: demo"
```

The order above maps 1:1 to the `smoke_test_plan.md` Section 2 happy-path.

---

## 14. Outstanding risks (ranked)

| # | Risk | Severity | Location |
| - | ---- | -------- | -------- |
| 1 | `apps/api/src/main.ts` contains pasted GitHub conflict URL — does not compile | **CRITICAL** | fixed in this audit (§A1) |
| 2 | `apps/api/src/app.module.ts` has unimported `BullModule` and duplicate registration | **CRITICAL** | fixed in §A2 |
| 3 | `apps/api/tsconfig.json` malformed JSON | **CRITICAL** | fixed in §A3 |
| 4 | Two Prisma schemas with conflicting models & data types | HIGH | unification plan in §C |
| 5 | `EventPublisherService` is a mock — events never leave the process | HIGH | implementation §D |
| 6 | M04 (largest module) is disabled in `AppModule` (`// import {…} from m04…`) | HIGH | §A2 reverts the comment |
| 7 | Frontend `@rri/database` workspace dep is dangling | MEDIUM | §F2 (drop dep) |
| 8 | M03 calls Supabase directly from the browser | MEDIUM | §C migration |
| 9 | RLS not enforced at DB level | MEDIUM | needs migration |
| 10 | Per-module `PrismaService` duplication | LOW | §C consolidation |

---

## 15. How to use this knowledge base

* **Onboarding:** read this file end-to-end, then `analysis_platform-core.md`, then your module's `analysis_*.md`.
* **Adding a feature:** ground yourself in (a) the module's TDD under `doc/reference/`, (b) the module's `analysis_*.md` (gap list), (c) `implementation_changes.md` (pending work).
* **Smoke testing:** follow `smoke_test_plan.md`.
* **AI agents (Cursor / Codex):** treat `doc/execution/database-tools/schema.prisma` and the per-module `analysis_*.md` files as the authoritative implementation context. Treat the Reference SAD as **aspirational**.

