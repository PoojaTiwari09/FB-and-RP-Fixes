# R-Revenue Intelligence — Complete Codebase Knowledge Base

## File Inventory by Folder

---

## ROOT

### `README.md`
- Platform overview: enterprise-grade AI-driven revenue intelligence platform
- 10 product modules (M1–M10) following the Revenue Intelligence Lifecycle
- Core principles: Tenant Isolation, Event-Driven, AI/Business Separation, Snake_Case standard
- Getting started: read SAD → Local Dev Guide → Git Branching Strategy

---

## docs/markdown documents/ (14 MD files)

### `System_architecture.md` (~630KB)
- "Single Source of Truth" for the platform
- 10 architecture modules (M-01 through M-10) in a Modular Monolith (NestJS)
- Two Python services extracted from Day 1: Transcription Service + AI Services Layer
- 7-stage Revenue Intelligence Lifecycle: Capture → Model → Understand → Analyze → Execute → Predict → Optimize
- Event bus: BullMQ on Redis with named queues per event type

### `tooling-and-services-inventory.md` (~247KB)
- Definitive approved tech stack inventory
- Frontend: Next.js 14, TypeScript
- Backend: NestJS 10, TypeScript, Prisma ORM
- AI/ML: FastAPI, Python 3.12, LangGraph, LiteLLM, Whisper, AssemblyAI
- Data: Supabase/PostgreSQL 16, Redis, Meilisearch, pgvector, ClickHouse
- Secrets: Doppler | Monitoring: Sentry, BetterStack | Deploy: Railway → AWS ECS
- Rule: "No new tool without review"

### `Event Schema registry.md` (~103KB)
- All cross-module async events with versioned Zod schemas
- Standard envelope: `eventId`, `version`, `tenantId`, `occurredAt`, `correlationId`, `traceId`
- Key events:
  - `call.transcription.completed` — M-01 → M-02, M-03, M-04, M-05, M-06
  - `call.scored` — M-04 → M-05, M-06, M-07, M-09, M-10
  - `call.topics.tagged` — M-04 → M-05, M-06
  - `call.summary.generated` — M-06 → M-03, M-07, M-08, M-10
  - `tracker.detection.created` — M-05 → M-06, M-07, M-08
  - `revenue_graph.entity.linked` — M-03 → M-04, M-05, M-07
  - `deal.stage.changed` — M-07 → M-08, M-09
  - `crm.fields.extracted` — M-01 → M-03
  - `email.sent` — M-02 → M-05, M-07
  - `forecast.submitted` — M-09 → M-10
- Rules: publisher owns schema, consumers use versioned contracts, all events immutable + idempotent

### `Database Schema.md` (~151KB)
- Schema-per-module convention: `m01_*`, `m02_*`, … `m10_*`
- Every table MUST have: `tenant_id UUID NOT NULL`, `UUID PRIMARY KEY`, `created_at`, index on `(tenant_id, lookup_col)`
- RLS policy: `tenant_id = current_setting('app.current_tenant_id')`
- Prisma middleware sets tenant context before every query
- Mandatory audit SQL scripts for RLS and index validation

### `Security architecture.md` (~253KB)
- Defense-in-depth: JWT → Prisma middleware → RLS
- Data classification: Public / Internal / Confidential / Restricted
- Secrets via Doppler only — never in `.env` files or images
- HMAC-SHA256 for all inbound webhooks
- GDPR/CCPA: automated cascade deletion and opt-out checks
- No AI/LLM calls from TypeScript services

### `Non‑Functional Requirements (NFR) Specification.md` (~77KB)
- API p99 latency: < 500ms
- Availability: 99.5%
- Transcription completion: < 5min p95
- AI summary generation: < 30s p95
- Search: < 200ms p99
- Every NFR has: measurement tool, owner, breach protocol
- "Measure Everything" principle

### `Module boundary document.md` (~133KB)
- Master table of all events with producer/consumer ownership
- Cross-module access rules: events or public APIs only, never direct DB access
- Critical rule: `deal.stage.changed` producer = M-07 (NOT M-03)
- Module interaction matrix showing allowed dependencies

### `API Design Standards.md` (~146KB)
- REST conventions: `noun.verb` for events, kebab-case for URL paths
- Versioning: `/api/v1/...`
- All endpoints require JWT auth unless explicitly public (webhooks use HMAC)
- Standard response envelope, pagination, error codes
- Internal APIs use `INTERNAL_SERVICE_SECRET` header

### `Coding standards.md` (~220KB)
- TypeScript strict mode enforced
- Zod for all request/event validation
- No `any` types, no direct LLM imports in TypeScript
- Repository pattern for DB access (no raw Prisma scattered in services)
- BullMQ workers must be idempotent
- snake_case for DB, camelCase for TypeScript

### `git-branching-strategy.md` (~181KB)
- Branches: `main` (production), `develop` (integration), `module/mX-*` (per-module integration)
- Feature branches: `feature/`, `fix/`, `chore/`
- Stale branch policy: 14-day warning → 30-day deletion
- PR requirements: CI must pass, Tech Lead review, no draft merges
- Monorepo structure

### `Local-Dev-Setup-Guide.md` (~34KB)
- Full stack runs via `doppler run -- docker compose up`
- Services: frontend (3000), NestJS API (3001), AI services (8000), transcription (8001)
- Prerequisites: Docker Desktop, Node 20 LTS, Python 3.11, Doppler CLI
- DB: `npx prisma migrate dev && prisma generate && prisma db seed`
- Health checks: `GET /health` (API), `GET /internal/health` (AI services)
- Day-to-day: pull develop → branch → code → test → PR → CI → merge

### `Architecture Decision Records.md` (~22KB)
9 formal ADRs — all Approved:
| ADR | Decision |
|---|---|
| ADR-001 | Modular Monolith for Phase 1–2 (extraction triggers: 5 conditions required) |
| ADR-002 | TypeScript/NestJS for product services |
| ADR-002b | Python/FastAPI for AI/ML services |
| ADR-003 | Language stack rule (no AI libs in TS, no business logic in Python) |
| ADR-004 | PostgreSQL 16 via Supabase as primary DB |
| ADR-005 | BullMQ on Redis as event bus |
| ADR-006 | OpenAI via LiteLLM as primary LLM |
| ADR-007 | Whisper (primary ASR) + AssemblyAI (fallback) |
| ADR-008 | Shared DB + RLS for multi-tenancy |
| ADR-009 | 5 warehouse targets (Snowflake, BigQuery, etc.) + daily idempotent sync |

### `mermaid-system-design.md` (~9KB)
- Flowchart TD diagram of the entire system
- Shows: Actors → Frontend → Platform Core → Modular Monolith → AI Services → Data Layer → External Systems
- Event flows: call.created → BullMQ → Transcription → call.transcription.completed → AI Orchestrator
- M-03 labeled as Priority 1

### `fix-checkout.md` (~4KB)
- Historical log of 14 documentation fixes applied
- Key fixes: event name standardization, producer conflict corrections, ADR population, Mermaid diagram updates
- All issues verified via grep and PowerShell scans

---

## archives/

### `System_architecture_old_v1.md` (~655KB)
- Old v1 architecture — historical reference only
- 7-stage lifecycle first documented here
- Modular monolith → microservices extraction strategy origin

---

## M1 Capture & Transcription/ (4 MD files + TDD/)

### `m1-readme.md`
- **Lifecycle stage:** Capture
- **Status:** Phase 1–2 deployed
- **Three features:** Call Transcription, Native Connectors, AI Data Extractor
- **Pipeline:** connect source → ingest → transcribe → extract → publish events
- **Emits:** `call.transcription.completed`, `crm.fields.extracted`
- **Tables:** `m01.callrecordings`, `m01.transcripts`, `m01.transcriptcorrections`, `m01.ingestionsources`, `m01.crmextractedfields`
- **API prefix:** `/api/v1/ingestion`
- **Webhooks:** Zoom, Teams, Meet, Dialer (all HMAC-SHA256)
- **Key rule:** Raw audio deleted after 7 days; M-01 is entry point and consumes NO upstream events

### `m1-sequence diagram.md`
- **SD-01:** Webhook → HMAC verify → idempotency check → store audio → enqueue BullMQ job
- **SD-02:** Worker → transcription service → Whisper (primary) / AssemblyAI (fallback) → persist transcript → publish `call.transcription.completed`
- **SD-03:** `call.transcription.completed` → extraction worker → AI service `/v1/extract-crm-fields` → store `crmextractedfields` → publish `crm.fields.extracted`
- **SD-04:** RevOps user → `POST /api/v1/ingestion/sources` → RBAC check → insert `ingestionsources`

### `M-01 Environment Variables Registry.md`
- **Doc ID:** DOC-18-M01-ENV-REGISTRY
- 40+ variables covering: app config, DB, Redis, storage, webhook secrets, AI services, ASR providers, CRM creds, observability, feature flags
- Key vars: `ZOOM_WEBHOOK_SECRET`, `TRANSCRIPTION_SERVICE_URL`, `ASSEMBLYAI_API_KEY`, `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80), `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70)
- Secrets: Doppler only | Naming: UPPER_SNAKE_CASE with domain prefix

### `drift analysis m1.md`
- 17 drifts identified (2 Critical, 4 High, 6 Medium, 4 Low)
- **D-01 Critical:** README title says "Data Ingestion" vs actual "Capture & Transcription"
- **D-04 High:** Three-way confidence threshold conflict (narrative vs pseudocode vs env var)
- **D-05 High:** TDD file name contains merge artifact
- Root cause: README written with old module name, TDDs are more current
- Event names and HMAC rules consistent across all files

### TDD/AI Data Extractor.md
- AI extraction of structured CRM fields from transcripts
- Three-tier confidence: ≥0.80 normal, 0.70–0.80 flag review, <0.70 exclude
- Calls AI service: `POST /v1/extract-crm-fields`
- Returns: field name, value, confidence, source spans

### TDD/Native Connectors.md
- Connector types: Zoom, Teams, Meet, telephony, Salesforce, HubSpot, Dynamics, Gmail, Outlook, GTM tools
- HMAC verification on all webhooks
- Connector lifecycle events: `connector.connected`, `connector.disconnected`, `connector.health.degraded`, etc.

### TDD/TDD-Call-Transcription.md
- Primary ASR: Whisper | Fallback: AssemblyAI
- Output: raw text, speaker segments, language, confidence score, provider used
- BullMQ retry: 3 attempts, exponential backoff (30s/60s/120s)
- Dead-letter queue for failed jobs

---

## M2 Conversation Intelligence/ (4 MD files + TDD/)

### `README-M2 Conversation Intelligence.md`
- **Lifecycle stage:** Understand
- **Product module:** M2 (customer-facing) splits into:
  - **M-04** Conversation Intelligence: AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, AI Translator
  - **M-05** Smart Tracking & Search: AI Smart Tracker, Searchable Conversation Library
- **Consumes:** `call.transcription.completed`, `revenue_graph.entity.linked`, `email.sent`
- **Emits:** `call.scored`, `call.topics.tagged`, `tracker.detection.created`
- **M-04 tables:** `scorecards`, `callscores`, `themes`, `themeanalyses`, `topictags`, `translationpreferences`
- **M-05 tables:** `trackers`, `trackerdetections`, `searchindexsynclog`, `dealdriversnapshots`
- **Rule:** M-04 must wait for `revenue_graph.entity.linked` before finalizing call scores

### `Sequence Diagrams for M2.md`
- Scoring flow, theme detection flow, tracker detection flow, search indexing flow

### `Environment Variables Registry-M2.md`
- Variables for M-04 and M-05: AI service URLs, Meilisearch config, pgvector config, scoring thresholds, search index settings

### `M2-drift-analysis.md`
- Drift between product module naming (M2) and architecture module names (M-04, M-05)
- Some TDD files misrouted to wrong architecture owner

### TDD/ (7 files)
- AI Call Reviewer, AI Smart Tracker, AI Theme Spotter, AI Transcriber, AI Translator, AI Topic Tagger, Searchable Conversation Library

---

## M3 AI Summaries & GenAI/ (4 MD files + TDD/)

### `Module README-M3 AI Summaries & GenAI.md`
- **Lifecycle stage:** Analyze
- **Architecture owner:** M-06 Insight Generation (InsightGenerationModule)
- **API prefix:** `/api/v1/insights`
- **Three features:** AI Smart Summaries, Ask Anything, AI Deep Researcher
- **Owned tables:** `callsummaries`, `dealbriefs`, `accountbriefs`, `researchreports`, `querysessions`
- **Consumes:** `call.transcription.completed`, `tracker.detection.created`, `call.topics.tagged`
- **Emits:** `call.summary.generated`
- **Pattern:** Receive event → fetch context → build prompt → call AI service → validate → store → expose via API/event
- Uses pgvector for embeddings, retrieval orchestration through `v1/embed` and `v1/answer-query`
- Research jobs: `queued → running → completed → failed` lifecycle

### `M3 Sequence Diagrams.md`
- Summary generation flow, Ask Anything RAG flow, Deep Researcher async job flow

### `M3 Environment Variables Registry.md`
- AI service URL, retrieval depth limits, research concurrency limits, summary versioning config

### `M3-drift-analysis.md`
- Drift: README names architecture owner as M-06 but product docs call it M3

### TDD/ (3 files)
- TDD-AI Deep Researcher, TDD-AI Smart Summaries, TDD-Ask Anything

---

## M4 Deal Intelligence/ (4 MD files + TDD/)

### `Module README-M4 Deal Intelligence.md`
- **Two features:** Deals Boards (→ M-07), View Deal Drivers (→ M-05)
- **Critical note:** One product module maps to TWO architecture owners — requires formal ADR
- **Event-Driven Loop Warning:** M-03 is upstream for M-07, but M-07 emits `deal.stage.changed` consumed by M-03 — must stay async, never synchronous
- **Stale board troubleshooting:** Check M-03 → M-05 → M-06 → Redis/BullMQ in that order

### `Sequence Diagrams for M4.md`
- Board read path, driver analytics path, async refresh path

### `Environment Variables Registry-M4.md`
- CRM integration creds, board refresh config, AI service endpoints

### `M4-drift-analysis.md`
- Product/architecture split not yet formalized in ADR

### TDD/ (2 files)
- TDD — View Deal Drivers, TDD — Deals Boards

---

## M5 Account Intelligence/ (4 MD files + TDD/)

### `Module README-M5 Account Intelligence.md`
- **One feature:** Account Boards
- **Architecture owner:** M-07 Deal and Account Management (DealAccountModule)
- **API prefix:** `/api/v1/deal-management`
- **Lifecycle stage:** Execute
- **Owned tables (via M-07):** `account_board_configs`, `engagement_scores`, `renewal_signals`
- **Key upstream:** M-06 Insight Generation for account briefs
- Read-heavy UI-serving pattern; prefer precomputed signals over live recomputation
- Every board read must remain tenant-scoped under RLS + RBAC

### `Sequence Diagrams for M5.md`
- Account board read path, AI context refresh path, stale-state handling

### `Environment Variables Registry-M5 Account Intelligence.md`
- Board page size, score freshness thresholds, AI brief TTL, refresh debounce

### `M5-drift-analysis.md`
- Product name (M5) vs architecture owner (M-07) naming drift in docs

### TDD/ (1 file)
- TDD — Account Boards (32KB — comprehensive)

---

## M6 Forecasting & Prediction/ (4 MD files + TDD/)

### `Module README-M6 Forecasting Prediction.md`
- **Two features:** AI Revenue Predictor, Forecast Boards
- **Architecture owner:** M-09 Forecasting and Prediction
- **Lifecycle stage:** Predict (Stage 6)
- **API prefix:** `/api/v1/forecasting`
- **Owned tables:** `forecast_periods`, `forecast_submissions`, `ai_forecast_snapshots`, `pipeline_coverage_metrics`, `historical_conversion_rates`, `forecast_accuracy_log`
- **Consumes:** `deal.stage.changed` (batched: max 1 recalculation per tenant/period per 60-min window)
- **Emits:** `forecast.submitted` → M-10
- **Submission rule:** versioned (never overwrite previous, create new version row)
- **Idempotency:** `idempotency_key` on snapshots and coverage metrics

### `Sequence Diagrams for M6.md`
- Period creation, board load, submission, AI prediction refresh, recalculation trigger

### `Environment Variables Registry-M6.md`
- Recalculation batch delay, prediction freshness threshold, forecast period locks

### `M6-drift-analysis.md`
- Minor naming inconsistencies between product (M6) and architecture (M-09)

### TDD/ (2 files)
- TDD-AI Revenue Predictor, TDD-Forecast Boards

---

## M7 Revenue Dashboards/ (3 MD files + TDD/ + sequence diagrams/)

### `Module-README M7 R-Revenue Dashboards.md`
- **Architecture owner:** M-10 Coaching and Training (Optimize stage)
- **API prefix:** `/api/v1/coaching/dashboards`
- **Two endpoints:** `GET /dashboards` (load), `PATCH /dashboards/config` (save layout)
- **Owned tables:** `dashboards.dashboard_configs`, `dashboards.custom_metrics`, `dashboards.dashboard_snapshots`
- **Read strategy:** ClickHouse primary → PostgreSQL fallback (must always remain available)
- **ClickHouse tables:** `call_events`, `activity_events`, `call_score_events`, `forecast_submission_events`
- **RBAC:** Rep = own dashboard, Manager = team dashboards, Admin/RevOps = custom metrics + org templates
- Per-user config unique on `(tenantid, userid)`

### `env-registry.md`
- ClickHouse connection, fallback flags, snapshot refresh schedule, observability

### `M7-drift-analysis.md`
- Placement under M-10 architecture owner vs M7 product label needs clearer cross-reference

### TDD/ (1 file)
- Revenue Dashboards TDD

### sequence diagrams/ (3 files)
- `sequence-dashboard-read-flow.md`: Frontend → API → ClickHouse/PostgreSQL → response
- `sequence-save-dashboard-config.md`: PATCH config → validate → update row
- `sequence-clickhouse-fallback.md`: ClickHouse down → PostgreSQL fallback with alert

---

## M8 Sales Engagement/ (6 MD files + TDD/)

### `Module README M8 Sales Engagement.md`
- **Critical boundary:** M8 is a PRODUCT UMBRELLA, NOT one backend module
- **Feature split:**
  - Email Composer + Engage To-Do → **M-02 Sales Engagement**
  - Orchestrate + Workflow Automation → **M-08 Execution and Automation**
- **M-02 tables:** `email_drafts`, `email_sends`, `email_templates`, `email_flows`, `email_flow_enrollments`, `tasks`
- **M-08 tables:** `sales_plays`, `play_enrollments`, `play_step_completions`, `workflows`, `workflow_runs`
- **Key rule:** Every PR must state which architecture module owns the feature
- **Open architecture note:** ADR-001 drafted for M-02 vs M-08 boundary resolution

### `ADR-001-M8-Product-vs-Architecture-Boundary.md`
- Decision pending: formalize M-02/M-08 split

### `ADR-002-Platform-Notification-Service.md`
- Notification service boundary decision

### `Environment Variables Registry-M8.md`
- Email provider creds, workflow trigger configs, play enrollment settings, Slack alert config

### `M8-drift-analysis.md`
- TDD files misrouted between M-02 and M-08

### `Sequence Diagrams M8 flows.md`
- Email composer flow, task creation flow, play enrollment flow, workflow automation trigger flow

### TDD/ (4 files)
- TDD-Email Composer, TDD-Engage To-Do, TDD-Orchestrate, TDD-Workflow Automation

---

## M9 Coaching & Training/ (4 MD files + TDD/)

### `Module README-M9 Coaching Training.md`
- **Two features:** Sales Coaching Insights, AI Trainer
- **Architecture owner:** M-10 Coaching and Training
- **Lifecycle stage:** Optimize (Terminal module — does NOT emit downstream lifecycle events)
- **API prefix:** `/api/v1/coaching`
- **Sales Coaching Insights tables:** `coaching_snapshots`, `coaching_benchmarks`, `coaching_recommendations`
- **AI Trainer tables:** `trainer_scenarios`, `trainer_sessions`, `trainer_messages`, `trainer_results`
- **Consumes:** `call.scored` (M-04), `forecast.submitted` (M-09)
- **RBAC:** Reps see own data only, Managers see their team, Admins see all
- **Low-sample rule:** Do NOT generate coaching recommendations if `callCount < 5` (statistically unreliable)
- AI Trainer: full conversation history sent on EVERY turn; session state stored in M-10

### `Sequence Diagrams-M9 flows.md`
- Coaching snapshot update, manager team view, AI Trainer session turn, scenario creation

### `Environment Variables Registry M9.md`
- Coaching snapshot freshness, benchmark period config, AI persona model settings, session timeout

### `M9-drift-analysis.md`
- Terminal module rule not clearly stated in some TDDs

### TDD/ (2 files)
- TDD-Sales Coaching Insights, TDD-AI Trainer

---

## M10 Data & Compliance/ (4 MD files + TDD/)

### `Module README-M10 Data Compliance.md`
- **Three features mapped to different architecture owners:**
  - Revenue Graph → M-03 Revenue Graph
  - Configure Compliance Settings → Platform Core / Cross-cutting Governance
  - Data Cloud / Data Export → M-03 Revenue Graph / Data Platform
- **M10 is a product grouping, NOT one technical subsystem**
- **Revenue Graph:** Automated Data Capture → Contextual Data Mapping → AI Context Layer
- **Configure Compliance Settings:** CRM opt-out enforcement, GDPR/CCPA regional rules, policy evaluation at outreach time, audit logging
- **Data Cloud:** 5 warehouse targets (Snowflake, BigQuery, Databricks, S3, Redshift), daily idempotent sync at 02:00 UTC, `sync_id` prevents duplicate writes
- **Core design principles:** Split by real ownership, tenant isolation first, idempotent processing, policy enforcement at runtime, customer data ownership

### `Sequence Diagrams-M10 flows.md`
- Capture to entity linking, compliance policy enforcement at outreach, Data Cloud export + retry, deletion/consent enforcement

### `Environment Variables Registry-M10.md`
- Graph processing workers, opt-out sync settings, export schedules, warehouse credentials, audit logging controls

### `M10-drift-analysis.md`
- Revenue Graph owned by M-03 but labeled M10 in product docs — common confusion point

### TDD/ (3 files)
- TDD-Configure Compliance Settings, TDD-Data Cloud or Data Export, TDD-Revenue Graph

---

## PLATFORM-WIDE RULES CHEAT SHEET

| Rule | Detail |
|---|---|
| No secrets in `.env` | Use Doppler only |
| No AI calls from TypeScript | All LLM/ML stays in Python FastAPI |
| No cross-module DB writes | Use events or public APIs |
| Every table needs `tenant_id` | RLS enforced at DB level |
| Events must be idempotent | BullMQ can redeliver |
| Publisher owns event schema | Consumers use versioned contracts |
| Extraction triggers (5 of 5) | Required before Phase 3 module extraction |
| `deal.stage.changed` producer | M-07 only (NOT M-03) |
| M4/M5/M8/M9 product names | Map to different architecture owners |
| Coaching < 5 calls | No recommendations generated |
| Audio retention | 7 days default, then auto-delete |
| Forecast submissions | Versioned — never update in place |
| ClickHouse fallback | Dashboard must work via PostgreSQL |
| ADR required | Before any major technology choice enters codebase |

---

## MODULE → ARCHITECTURE OWNER QUICK MAP

| Product Module | Architecture Owner | Lifecycle Stage |
|---|---|---|
| M1 Capture & Transcription | M-01 Data Ingestion | Capture |
| M2 Conversation Intelligence | M-04 + M-05 (split) | Understand |
| M3 AI Summaries & GenAI | M-06 Insight Generation | Analyze |
| M4 Deal Intelligence | M-07 (Deals Boards) + M-05 (Deal Drivers) | Execute |
| M5 Account Intelligence | M-07 Deal and Account Management | Execute |
| M6 Forecasting & Prediction | M-09 Forecasting and Prediction | Predict |
| M7 Revenue Dashboards | M-10 Coaching and Training | Optimize |
| M8 Sales Engagement | M-02 (Email/Tasks) + M-08 (Plays/Automation) | Execute |
| M9 Coaching & Training | M-10 Coaching and Training | Optimize |
| M10 Data & Compliance | M-03 (Revenue Graph + Data Cloud) + Platform Core (Compliance) | Model/Cross-cutting |

---

*Last compiled: 2026-05-17 | Source: Full audit of all MD files across all folders*
