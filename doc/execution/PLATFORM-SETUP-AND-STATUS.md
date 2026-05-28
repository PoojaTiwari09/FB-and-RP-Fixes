# Revenue Intelligence Platform — Setup, Seeds, Smoke Tests, and Honest Status

> **Written for:** anyone running this project locally (developers, QA, or an AI agent picking up the work).  
> **Language:** plain English — what we use, what we ran, what worked, and what is still missing.  
> **Last updated:** 2026-05-26  
> **Related files in this folder:** `smoke.js`, `rri-seed.js`, `unified-seed.js`, `smoke-results.json`, `api-routes.txt`, logs (`seed.log`, `pnpm-install.log`, etc.)

---

## 1. What tech stack we are actually using

You asked for **Docker Postgres + Prisma**. That is the **intended** stack for backend data and the API. Here is what is in use today.

### What we use on purpose

| Piece | What it is | Where it lives |
| ----- | ---------- | -------------- |
| **Database** | PostgreSQL 16 in Docker | Container `revenue_intel_db`, host port **5433** (not 5432) |
| **DB name / user** | `revenue_intelligence` / `revenue_user` | Password: `revenue_pass` |
| **ORM** | Prisma | Package `@rri/database` → `packages/database/prisma/schema.prisma` |
| **Backend API** | NestJS 10 | `apps/api` on port **3001** |
| **Monorepo** | pnpm workspaces | Root: `r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence` |
| **Env file** | `.env` at monorepo root | `DATABASE_URL` points to `127.0.0.1:5433` |

Connection string used everywhere for seeds and API:

```text
postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
```

### Optional pieces (not required for basic backend smoke)

| Piece | Role |
| ----- | ---- |
| **Redis** | BullMQ job queues (M01 transcription, M03 research, etc.). Turned **off** for smoke via `DISABLE_REDIS=true` in `dev-api.bat`. |
| **Next.js web** | Frontend on port **3005** (`apps/web`) |
| **AI services** | Python FastAPI on port **8000** (`apps/ai-services`) — not started during backend-only smoke |
| **Meilisearch** | Search index for M02 — disabled with `DISABLE_MEILI=true` |

### Legacy stack still in the codebase (not what you wanted)

These are **old boilerplate** paths. They were **not** used to seed or smoke-test the main Postgres database.

| Legacy | Where it still appears | Impact |
| ------ | ---------------------- | ------ |
| **Supabase** | M03 and M05 backend services, M03 web, `supabase_seed.sql` | M05 account/activity APIs can return **500** because they call Supabase, not Prisma |
| **TypeORM** | M04 deal intelligence (~177 files) | **M04 is turned off** in `apps/api/src/app.module.ts` — it does not load at API boot |
| **Second Prisma schema** | `doc/execution/database-tools/schema.prisma` (~170 models) | Validates and documents the “unified” design, but **this DB was not fully created from that file** |

**Important:** `dev-api.bat` sets fake `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` so old modules do not crash on startup. That is **not** a real Supabase server — only a stub.

### Special case: Module M06 (Forecasting)

M06 forecast tables (`forecast_periods`, `crm_deals`, `users`, etc.) were added to the **same Docker Postgres** using SQL migration files under:

`modules/m06-forecasting-prediction/prisma/migrations/`

M06 code uses its **own** generated Prisma client at:

`modules/m06-forecasting-prediction/generated/prisma-client`

So M06 shares the database server with everyone else, but not yet the single `@rri/database` schema file.

---

## 2. Did we run smoke tests for all modules?

**Short answer:** We ran a **backend smoke script** for modules **M01–M03 and M05–M10**. **M04 was skipped** because it is not mounted on the API.

### What “smoke test” means here

A smoke test checks that:

- The API process starts without crashing.
- Important HTTP routes exist and return a sensible status (200, 201, 401, 404, etc.) — not necessarily full business logic.

It does **not** mean every feature in every PDF/TDD document was tested end-to-end.

### Script and result

- **Script:** `doc/test_result/smoke-backend.ps1`
- **Last known result:** **22 checks passed, 0 failed** (when API was running on port 3001)

### Per module — what was tested

| Module | Smoke run? | What was hit | Notes |
| ------ | ----------- | ------------ | ----- |
| **M01** Capture & Transcription | Yes | List calls, create call, search | Uses header `x-tenant-id: dev-tenant-001` |
| **M02** Conversation Intelligence | Yes | List/search conversations, list/create trackers | Trackers use a **fallback** if DB table missing |
| **M03** AI Summaries & GenAI | Yes | Module root, feedback POST | Path prefix is `ai-summaries-genai`, not `ai-summaries` |
| **M04** Deal Intelligence | **No** | — | Commented out in `AppModule` |
| **M05** Account Intelligence | Yes | Module root, accounts, activities | Some paths still error (Supabase) but counted as “acceptable” status in script |
| **M06** Forecasting | Yes | AI prediction for one period ID | Tenant header: `x-tenant-id: demo-tenant-01` |
| **M07** Revenue Dashboards | Yes | Root, widget catalog | Catalog needs JWT → often **401** (expected) |
| **M08** Sales Engagement | Yes | Workflows, tasks | Often returns **empty list** — tables not in unified Prisma |
| **M09** Coaching & Training | Yes | Root, test health | Full login/scenarios not fully verified |
| **M10** Data & Compliance | Yes | Stub root, revenue-graph accounts | Protected routes → **401** without token |

### What was NOT smoke-tested

- Frontend (browser on port 3005)
- Audio upload + transcription worker (needs Redis + AI services + ffmpeg)
- Full `smoke_test_plan.md` curl matrix (every POST body, webhooks, failure modes)
- M04 at all
- Redis / BullMQ queue processing
- HubSpot live sync

---

## 3. Was data seeded? Were all tables created?

**Short answer:** **Some tables exist. Some have data. Most modules were not seeded.**

### Tables in the database today

After `prisma db push` on `packages/database` plus M06 SQL migrations:

| Schema | Approx. table count |
| ------ | ------------------- |
| `public` | ~35 tables |
| `dashboards` | ~7 tables |

This is **not** the full ~170 tables from `doc/execution/database-tools/schema.prisma`. That large schema is a **design document** for future unification; it was **not** fully applied to this running database.

### Seeds that were actually executed

| Module | Seed file | What it puts in the DB |
| ------ | --------- | ------------------------ |
| **M01** | `modules/m01-capture-transcription/seeds/seed.ts` | 3 call records, 1 full transcript with utterances, notes; tenant `dev-tenant-001` |
| **M06** | `modules/m06-forecasting-prediction/seeds/historical-seed.ts` | Forecast periods, ~60+ CRM deals, users (manager + reps), quotas, conversion rates; tenant `demo-tenant-01` |

**How to run them again:**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
cd "r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\apps\api"
pnpm exec tsx "..\..\modules\m01-capture-transcription\seeds\seed.ts"
pnpm exec tsx "..\..\modules\m06-forecasting-prediction\seeds\historical-seed.ts"
```

M01 seed must import Prisma from `@rri/database` (not bare `@prisma/client`).

### Seeds that exist but were NOT run (or only placeholders)

| Module | Seed location | Status |
| ------ | ------------- | ------ |
| M02 | `seeds/.gitkeep` only | No seed script run |
| M03 | `seeds/supabase_seed.sql` | **Supabase SQL** — not for Docker Postgres Prisma path |
| M04 | Several TS seeds | Module disabled; not run against main API DB |
| M05 | `.gitkeep` only | No Prisma seed |
| M07–M08 | `.gitkeep` only | No seed |
| M09 | `modules/m09-coaching-training/seeds/seed.ts` | Written for **old** user model; does not match `@rri/database` cleanly |
| M09 dashboards | `scripts/seed-m09-dashboards.ts` | Optional; targets `dashboards.trainerscenarios` |
| M10 | `.gitkeep` / `seed-m10.js` in audit folder | Not fully run for smoke |

### Example row counts (after M01 + M06 seeds)

These numbers are approximate and change if you re-run seeds:

| Table | Rough row count |
| ----- | ---------------- |
| `call_records` | 7+ |
| `transcripts` / `utterances` | 2 / 14+ |
| `crm_deals` | ~165 |
| `forecast_periods` | 4 |
| `users` (M06 lowercase table) | 7 |
| `Tenant` / `User` (capitalized Prisma models) | 1–3 each |
| `trainersessions` | 0 |

---

## 4. Were API endpoints updated for the new system?

**Short answer:** **Partly.** The API boots and many routes work, but naming and data layers are not fully aligned with one unified Prisma API.

### What was fixed

1. **Removed 165 stale `.js` files** under `modules/` that hid the real TypeScript controllers (only stub GET/POST on module root were loading before).
2. **Route prefixes** fixed for sub-controllers:
   - M03 → `/api/v1/ai-summaries-genai/...`
   - M05 → `/api/v1/account-intelligence/...`
   - M09 → `/api/v1/coaching-training/...`
3. **`app.module.ts`** wires M01–M03, M05–M10 (M04 commented).
4. **Nest DI fixes** so the API can start (M01 `PiiRedactionService`, `NextStepsRepository`; M03 import paths; M09 `Reflector` for JWT guard).

### Path differences vs documentation

Docs and smoke plans sometimes use different URLs than the running code:

| Docs often say | Code actually uses |
| -------------- | ------------------ |
| `/api/v1/ai-summaries/...` | `/api/v1/ai-summaries-genai/...` |
| `/api/v1/sales-engagement/...` | `/api/v1/m08-sales-engagement/...` |
| `/api/v1/data-compliance/revenue-graph/...` | `/api/v1/m10-data-compliance/...` (for many M10 routes) |

Use `api-routes.txt` in this folder (if present) or Nest boot logs for the live route list.

### Tenant headers

| Modules | Header value |
| ------- | ------------- |
| M01, M02, M05, M07–M10 (stub) | `x-tenant-id: dev-tenant-001` |
| M06 | `x-tenant-id: demo-tenant-01` |

---

## 5. Are there no errors? Are all doc features implemented?

**Short answer:** **No.** The API can run and pass a **minimal** smoke script. Many documented features are **not** fully implemented on Prisma + Postgres yet.

### Runtime status (honest)

| Area | Status |
| ---- | ------ |
| API boot | **Works** after fixes — `http://localhost:3001`, log line `API listening on...` |
| Background reboot tasks | Several failed **during** fixing; final state can still be **up** if a process is already on port 3001 |
| M05 deep APIs | Often **500** — still tied to Supabase / missing board config |
| M03 research/query | Needs auth guards + Supabase or refactor to Prisma |
| M04 | **Off** — no REST from main API |
| M02 trackers | **Mock/fallback** if `m02Tracker` table missing from schema |
| M08 workflows/tasks | Return **[]** — workflow tables not in unified Prisma |
| M09 scenarios/login | Schema mismatch (`trainingScenario` vs `trainerscenarios`) |
| M07 / M10 protected routes | **401** without JWT — normal for guarded routes |

### Doc features per module (high level)

| Module | Fully implemented per TDD/docs? |
| ------ | ------------------------------- |
| M01 | **Partial** — core CRUD + seed data yes; upload/transcribe pipeline needs Redis + AI |
| M02 | **Partial** — list/search yes; full hybrid semantic search / DB trackers incomplete |
| M03 | **Partial** — HTTP shell yes; data layer still Supabase-oriented |
| M04 | **No** — disabled |
| M05 | **Partial** — routes exist; Prisma migration from Supabase not done |
| M06 | **Partial** — forecasting on separate tables; not merged into `@rri/database` |
| M07 | **Partial** — dashboards API exists; JWT + full builder flows incomplete |
| M08 | **Partial** — routes exist; empty data without schema tables |
| M09 | **Partial** — root/health; coaching DB not aligned |
| M10 | **Partial** — stub + JWT submodules; not full Revenue Graph / Data Cloud |

For deep gap lists, see `doc/analysis/analysis_m*.md` and `doc/execution/implementation_changes.md`.

---

## 6. Why Supabase appears (and why we are not “using” it for seeds)

You asked to use **Docker Postgres + Prisma only**.

- **Seeds and smoke** used **Postgres + Prisma** (`@rri/database` and M06 local client).
- **Supabase** is still **imported in source code** for M03/M05 because those modules were not fully rewritten yet.
- The stub env vars in `dev-api.bat` only prevent startup crashes; they do **not** connect to a real Supabase project for seeding.

**Follow-up work:** replace `getSupabase()` / `SupabaseService` in M03 and M05 with `PrismaService` and `@rri/database`, then remove `SUPABASE_*` from `dev-api.bat`.

---

## 7. How to start the platform locally (step by step)

### Step 1 — Start Postgres (Docker)

From `final_product/` (if using root compose) or ensure `revenue_intel_db` is running on port **5433**.

### Step 2 — Sync Prisma schema (packages/database)

```powershell
cd "r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\packages\database"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
npx prisma db push
```

### Step 3 — Apply M06 SQL tables (first time only)

Run the four migration SQL files under `modules/m06-forecasting-prediction/prisma/migrations/` against the same database (already done once in this audit).

Generate M06 client:

```powershell
cd "...\modules\m06-forecasting-prediction"
npx prisma generate --schema=prisma/schema.prisma
```

### Step 4 — Run seeds

See section 3 above (M01 + M06).

### Step 5 — Start API

```powershell
cd "...\apps\api"
.\dev-api.bat
```

Expect: `API listening on http://localhost:3001`

### Step 6 — Run smoke tests

```powershell
powershell -ExecutionPolicy Bypass -File "doc\test_result\smoke-backend.ps1"
```

---

## 8. Fixes applied during this work (for your records)

1. Deleted stale compiled `*.js` / `*.d.ts` under `modules/` that shadowed TypeScript.
2. M01 seed: use `@rri/database` Prisma client.
3. M03: fixed broken relative imports after JS removal.
4. M05/M09: full `api/v1/...` path prefixes on sub-controllers.
5. M06: SQL migrations + local Prisma client path in `database/prisma.service.ts`.
6. M01 module: registered `PiiRedactionService`, `NextStepsRepository`.
7. M09 module: `Reflector` + guards in providers (DI).
8. M02/M08: safe fallbacks when Prisma models/tables are missing.

---

## 9. Recommended next steps (priority order)

1. **Remove Supabase from M05 and M03 backends** — use Prisma only.  
2. **Merge M06 (and M08) models** into `packages/database/prisma/schema.prisma`, one `prisma generate`.  
3. **Re-enable M04** after TypeORM → Prisma migration.  
4. **Add Prisma seeds** for M02, M05, M07, M08, M09, M10 (or one `scripts/seed-all.ts`).  
5. **Push or migrate** `doc/execution/database-tools/schema.prisma` only when ready to replace/merge with packages schema — not done yet.  
6. **Expand smoke** beyond 22 checks — follow `doc/test_result/smoke_test_plan.md`.

---

## 10. Quick answers (FAQ style)

**Q: What stack are we using?**  
A: Docker Postgres + Prisma + NestJS API. Supabase and TypeORM are legacy leftovers in parts of the repo.

**Q: Did smoke run for every module?**  
A: M01–M03, M05–M10 yes (minimal HTTP checks). M04 no.

**Q: Is every table seeded?**  
A: No. Main data: M01 calls and M06 forecast/deals. Many tables are empty.

**Q: Are endpoints fully updated?**  
A: Partially — enough to boot and smoke; not fully unified naming and Prisma everywhere.

**Q: Zero errors and all doc features done?**  
A: No. Smoke can pass while many features and integrations remain incomplete.

**Q: Is the API running now?**  
A: Check with: `curl http://localhost:3001/api/v1/capture-transcription/calls -H "x-tenant-id: dev-tenant-001"` — if you get JSON/200, it is up.

---

*This file lives in `doc/execution/seeds/` next to seed scripts and logs. Update it when you change seeds, schema, or smoke results.*
