# Smoke Test Plan (`smoke_test_plan.md`)

> Companion to `version_knowledge.md` and `implementation_changes.md`.
>
> The goal of this document is to give *one* well-defined sequence that proves the platform is wired correctly end-to-end after the Prisma unification. Every step is reproducible from a clean checkout on macOS, Linux, or Windows (PowerShell). Where a step has both a positive and a negative path we list both.
>
> Order matters: each phase depends on the previous one. Do not skip ahead.

---

## 0. Prerequisites

| Tool | Min version | How to check |
| ---- | ----------- | ------------ |
| Docker | 24+ | `docker --version` |
| Node | 18+ (22 tested) | `node --version` |
| pnpm | 10.x | `pnpm --version` |
| Python | 3.10+ | `python --version` |
| ffmpeg (for M01 audio path) | any | `ffmpeg -version` |

---

## 1. Database bootstrap (Prisma + Postgres)

```bash
cd final_product

# 1.1 Start the unified Postgres
docker compose up -d
docker compose ps        # should report "healthy"

# 1.2 Set DATABASE_URL
cp env .env              # Windows: Copy-Item env .env

# 1.3 Format + validate the unified schema
npx --yes prisma@5 format    --schema=./schema.prisma   # MUST report "Formatted schema.prisma"
npx --yes prisma@5 validate  --schema=./schema.prisma   # MUST report "The schema at schema.prisma is valid"

# 1.4 First-time bootstrap
npx --yes prisma@5 db push   --schema=./schema.prisma
#   ^ creates all 170 tables on the unified Postgres

# 1.5 Generate the Prisma client (into node_modules/.prisma/client)
npx --yes prisma@5 generate  --schema=./schema.prisma

# 1.6 (Optional) browse the DB
npx --yes prisma@5 studio    --schema=./schema.prisma
# open http://localhost:5555
```

**PASS criteria for Phase 1**

* `docker compose ps` shows the `revenue_intel_db` container as `(healthy)`.
* `prisma validate` emits the "schema is valid" message.
* `prisma db push` ends with `"Your database is now in sync with your schema."`
* `psql ... -c "\dt"` lists ≥ 170 tables in the `public` schema (or use Prisma Studio).

**Negative path**

* If `prisma validate` fails after a follow-up change to the schema, run `python normalize_root_schema.py --check` to confirm whether the corruption regressed.

---

## 2. Backend bootstrap (apps/api)

```bash
cd "r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence"

# 2.1 Install workspace dependencies
pnpm install

# 2.2 Point the API at the unified DB
#   Windows PowerShell:
$Env:DATABASE_URL  = "postgresql://revenue_user:revenue_pass@localhost:5432/revenue_intelligence?schema=public"
$Env:DISABLE_REDIS = "true"     # skip BullMQ during the first smoke run

#   bash/zsh:
export DATABASE_URL="postgresql://revenue_user:revenue_pass@localhost:5432/revenue_intelligence?schema=public"
export DISABLE_REDIS=true

# 2.3 Start only the API
pnpm --filter api dev
```

**PASS criteria for Phase 2**

* Logs include `API listening on http://localhost:3001`.
* Logs include `Mounted routes:` block.
* No "module not found" errors.
* Health check (no built-in `/health` endpoint — use any M02 path):
  ```bash
  curl -s http://localhost:3001/api/v1/conversation-intelligence/conversations \
       -H "x-tenant-id: demo" | head -c 200
  ```

**Negative path**

* `Cannot find module ...` → confirm `pnpm install` finished and that no `node_modules` cache from an older layout lingers.
* `ECONNREFUSED 5432` → `docker compose ps` on `final_product/`.

---

## 3. Frontend bootstrap (apps/web)

```bash
cd "r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence"

# 3.1 Run web
pnpm --filter web dev          # next dev -p 3005
# (root pnpm dev runs api + web together)
```

**PASS criteria for Phase 3**

* Browser opens `http://localhost:3005` and renders the landing page.
* No console errors regarding `@rri/database` (if you see one, see `implementation_changes.md` §F2).
* Network panel shows requests to `localhost:3001` succeed for any M02/M07 path you exercise.

---

## 4. AI services (apps/ai-services)

```bash
cd "r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/apps/ai-services"

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

export OPENAI_API_KEY=sk-...
export ASSEMBLYAI_API_KEY=...
uvicorn app.main:app --port 8000 --reload
```

**PASS criteria for Phase 4**

* `curl http://localhost:8000/health` returns `{"status":"healthy","service":"ai-services"}`.
* `curl http://localhost:8000/internal/health` returns `{"status":"ok"}`.

---

## 5. Per-module smoke matrix

Each row is the **minimum verification** required to declare a module green. Mark
each `✅` only when both API and DB writes are observable.

### 5.1 M01 — Capture & Transcription

| Step | Command | Expected |
| ---- | ------- | -------- |
| Create call | `curl -X POST :3001/api/v1/capture-transcription/calls -H "x-tenant-id: demo" -H "Content-Type: application/json" -d '{"title":"smoke","callDate":"2026-01-01T00:00:00.000Z","durationSeconds":60,"callType":"outbound","callSource":"manual","participants":["a@b.c"],"callOwner":"u1"}'` | 201 with `id`, `transcriptStatus:"pending"` |
| List calls | `curl :3001/api/v1/capture-transcription/calls -H "x-tenant-id: demo"` | array of 1 |
| Search calls | `:3001/api/v1/capture-transcription/calls/search?q=smoke` | empty list (no transcript yet) |
| Add next step | `curl -X POST :3001/api/v1/capture-transcription/calls/<id>/next-steps -H "x-tenant-id: demo" -d '{"step":"follow up"}'` | 201 |
| Upload audio (worker required) | `curl -F file=@sample.mp3 :3001/api/v1/capture-transcription/calls/upload -H "x-tenant-id: demo"` | 201 + transcription job enqueued |

Dependencies: Postgres ✅, AI services (only for upload+transcribe path).
Required env: `DATABASE_URL`. Optional: `ASSEMBLYAI_API_KEY`, `AI_SERVICES_URL`.

### 5.2 M02 — Conversation Intelligence

| Step | Command | Expected |
| ---- | ------- | -------- |
| List | `GET /api/v1/conversation-intelligence/conversations` | empty list |
| Search | `GET /api/v1/conversation-intelligence/conversations/search?q=demo` | empty list |
| Save search | `POST /api/v1/conversation-intelligence/saved-searches` | 201 |
| Tracker create | `POST /api/v1/conversation-intelligence/trackers` | 201 |
| Topic tag list | `GET /api/v1/conversation-intelligence/topic-tags` | empty list |

Dependencies: Postgres ✅, pgvector (only for true semantic search; without it `HybridSearchService` falls back to lexical).

### 5.3 M03 — AI Summaries & GenAI

| Step | Command | Expected |
| ---- | ------- | -------- |
| Feedback | `POST /api/v1/ai-summaries/feedback` | 201 |
| Query | `POST /api/v1/ai-summaries/query` | depends on AI services availability |
| Research kickoff | `POST /api/v1/ai-summaries/research` | 202 (async) |
| List briefs | `GET /api/v1/ai-summaries/briefs` | empty list initially |

Dependencies: Postgres, optionally `OPENAI_API_KEY` for non-mock responses. M03 currently still calls Supabase from the vendored web app — bypass with the REST endpoints above.

### 5.4 M04 — Deal Intelligence (currently disabled in `AppModule`)

Cannot smoke until §C5 of `implementation_changes.md` is complete (TypeORM → Prisma migration). For now, run M04's own Jest unit tests:

```bash
pnpm --filter "@r-revenue/m04-deal-intelligence" test
```

PASS criteria: existing `*.spec.ts` files green.

### 5.5 M05 — Account Intelligence

| Step | Command | Expected |
| ---- | ------- | -------- |
| List accounts | `GET /api/v1/account-intelligence/accounts` | empty |
| Activities | `GET /api/v1/account-intelligence/activities` | empty |
| AI brief (cached) | `GET /api/v1/account-intelligence/ai/brief?accountId=...` | 404 (no cache yet) |
| Webhook | `POST /api/v1/account-intelligence/webhooks/hubspot` + HMAC | 200 |

### 5.6 M06 — Forecasting & Prediction

| Step | Command | Expected |
| ---- | ------- | -------- |
| Forecast list | `GET /api/v1/forecasting` | empty |
| HubSpot sync | `POST /api/v1/forecasting/hubspot/sync` | 202 |
| Executive snapshot | `GET /api/v1/forecasting/executive/snapshot?period=2026Q2` | empty or 404 |

### 5.7 M07 — Revenue Dashboards

| Step | Command | Expected |
| ---- | ------- | -------- |
| Datasets | `GET /api/v1/revenue-dashboards/datasets` | empty |
| Create dataset | `POST /api/v1/revenue-dashboards/datasets` | 201 |
| Dashboards | `GET /api/v1/revenue-dashboards/dashboards` | empty |
| Widget catalog | `GET /api/v1/revenue-dashboards/widget-catalog` | seeded entries |

UI smoke: open `http://localhost:3005/` → "Dataset Builder" and "Dashboard Builder" buttons should not 404 (currently they will — see `implementation_changes.md` §F1).

### 5.8 M08 — Sales Engagement

| Step | Command | Expected |
| ---- | ------- | -------- |
| Workflows | `GET /api/v1/sales-engagement/workflows` | empty |
| Tasks | `GET /api/v1/sales-engagement/tasks` | empty |
| Trigger workflow | `POST /api/v1/sales-engagement/workflows/:id/trigger` | 202 |

### 5.9 M09 — Coaching & Training

| Step | Command | Expected |
| ---- | ------- | -------- |
| Scenarios | `GET /api/v1/coaching-training/scenarios` | seeded scenarios from `dashboards.trainerscenarios` |
| Sessions | `GET /api/v1/coaching-training/sessions` | empty |
| Login | `POST /api/v1/coaching-training/auth/login` | JWT (uses `JwtModule.register`) |

Required env: `JWT_SECRET` (the module defaults to `fallback_secret` which is fine for smoke but NOT for production).

### 5.10 M10 — Data & Compliance

| Step | Command | Expected |
| ---- | ------- | -------- |
| Revenue Graph nodes | `GET /api/v1/data-compliance/revenue-graph/nodes?tenantId=demo` | empty |
| Export request | `POST /api/v1/data-compliance/data-cloud/exports` | 202 |
| Compliance settings | `GET /api/v1/data-compliance/settings` | default policy |

---

## 6. Cross-module event flow smoke (with Redis)

When `DISABLE_REDIS` is NOT set:

```bash
# Phase 6.0 — start Redis (re-use boilerplate compose, or run alone)
docker run --rm --name rri-redis -p 6379:6379 redis:7-alpine

# Phase 6.1 — restart API without DISABLE_REDIS
$Env:DISABLE_REDIS = ""    # or unset on bash
pnpm --filter api dev
```

Expected log lines:

```
[Nest] BullMQ connection established (lazy)
[AppModule] (no warning about Redis disabled)
```

### 6.1 Verify the m01-queue

```bash
# Enqueue a transcription job
curl -X POST :3001/api/v1/capture-transcription/calls -H "x-tenant-id: demo" \
     -H "Content-Type: application/json" \
     -d '{"title":"q1","callDate":"2026-01-01T00:00:00.000Z","durationSeconds":120,"callType":"outbound","callSource":"manual","participants":["a@b.c"],"callOwner":"u1"}'
```

In the API console you should see:

```
[m01-queue] processing job <jobId>
[MOCK EventPublisher] Publishing event "call.transcription.completed" { ... }
```

PASS criteria: the `[MOCK EventPublisher]` line appears. This proves the queue ↔ worker ↔ publisher chain works. (The publisher will be promoted from mock to real in `implementation_changes.md` §D.)

---

## 7. Failure-mode rehearsal

| Failure | How to inject | Expected behavior |
| ------- | -------------- | ------------------ |
| DB down | `docker compose stop postgres` | API logs `ECONNREFUSED`. Web shows 502 on next call. After `docker compose start postgres` the API auto-recovers next request. |
| Redis down (with workers enabled) | `docker stop rri-redis` | API stays up (lazyConnect + offline-queue disabled). Workers retry per `retryStrategy: min(times*200, 5000)`. |
| AI services down | stop the FastAPI process | M01 upload returns 503; transcription job is retried per BullMQ default. |
| Webhook with bad HMAC | `curl -X POST :3001/api/v1/.../webhooks/hubspot -H "X-Signature: bad"` | `HmacWebhookGuard` returns 401. |
| Missing tenant header | omit `x-tenant-id` | `TenantGuard` returns 403. |

---

## 8. Final go/no-go checklist (for a release smoke)

* [ ] `final_product/schema.prisma` validates (`prisma validate` green).
* [ ] `prisma db push` synchronises the unified DB.
* [ ] `pnpm install` finishes without `ERR_PNPM_*` warnings.
* [ ] `pnpm --filter api build` succeeds (must succeed after §A1–A4).
* [ ] `pnpm --filter web build` succeeds (`next build`).
* [ ] Each module section 5.x passes its happy path.
* [ ] Each module section 5.x passes its failure path from §7.
* [ ] (With Redis) BullMQ queue smoke (§6.1) emits the `[MOCK EventPublisher]` line.
* [ ] `apps/ai-services` `/health` returns healthy.
* [ ] Browser landing page renders (`http://localhost:3005/`).

When all boxes tick, the platform is at **smoke-test-ready** parity with the architecture described in `version_knowledge.md`.
