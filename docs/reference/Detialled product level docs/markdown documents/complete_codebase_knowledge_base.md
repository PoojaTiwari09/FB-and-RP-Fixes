# R-Revenue Intelligence — Complete Codebase Knowledge Base
**Version:** v3.1  
**Status:** Approved  
**Last Updated:** 2026-06-09  
**Owner:** Technical Architecture Team & Relanto Engineering

---

## 1. Document Control & Governance

### 1.1 Purpose of This Document
This document serves as the **Single Source of Truth (SSOT)** and primary engineering reference manual for the R-Revenue Intelligence platform. It synthesizes the System Architecture Document (SAD), Non-Functional Requirements (NFR) Specification, Database Schema Design, API Design Standards, Coding Standards, Event Schema Registry, Tooling and Services Inventory, and individual product module specifications into a single, cohesive, high-fidelity manual.

It is designed to eliminate architectural drift and ensure that all developers, architects, and technical stakeholders—regardless of seniority—operate under the same engineering assumptions, naming conventions, directory structure layouts, security boundaries, and validation requirements.

### 1.2 Governance & Evolution Policy
*   **Zero Casual Edits:** No changes may be made to this knowledge base without an accompanying approved Architecture Decision Record (ADR) or explicit sign-off from the Tech Lead.
*   **Version Increment Rules:**
    *   `v1.x` — Minor updates, structural cleanups, or clarifications that do not change underlying architecture.
    *   `v2.x` — Major revisions reflecting platform transitions.
    *   `v3.x` — Full alignment reflecting Decoupled Physical Monorepo Workspaces and Decentralized Database Governance.
*   **Conflict Resolution Hierarchy:** If this document conflicts with any direct source specification:
    1.  **Architecture Decision Records (ADRs)** take absolute priority as the formal decision history.
    2.  **System Architecture Document (SAD / Doc #1)** takes precedence for high-level module boundaries and lifecycle stages.
    3.  **This Knowledge Base** takes precedence for integration patterns, environment configurations, and schema rules.

---

## 2. Core Architectural & Platform Principles

The R-Revenue Intelligence platform is designed around four foundational, non-negotiable architectural pillars. Every line of code written must respect these patterns:

```
┌────────────────────────────────────────────────────────┐
│               Public Internet (Untrusted)              │
└───────────────────────────┬────────────────────────────┘
                            │ (Cloudflare Edge Protection)
                            v
┌────────────────────────────────────────────────────────┐
│              Decoupled Multi-Package Monorepo          │
│         (NestJS Platform Core & modules/m0X-*)        │
└─────────────┬────────────────────────────┬─────────────┘
              │ (Internal network only)    │ (Event Bus)
              v                            v
┌───────────────────────────┐    ┌───────────────────────┐
│     FastAPI AI Layer      │    │  BullMQ Queue System  │
│  (Python / AI Inference)   │    │  (Redis Backed Async) │
└───────────────────────────┘    └───────────┬───────────┘
                                             │
                                             v
                                 ┌───────────────────────┐
                                 │  Background Workers   │
                                 │   (Durable Ingestion) │
                                 └───────────────────────┘
```

### 2.1 Separation of Business Logic and AI Inference
*   **TypeScript (NestJS) is the Product Brain:** Responsible for state management, authorization, multi-tenancy context, workflow orchestration, database updates, and external API integrations.
*   **Python (FastAPI) is the AI Brain:** Restricts its scope strictly to model execution, high-performance transcription (ASR), vector embedding generation, sentiment mapping, and RAG pipelines for core async call records (M01).
*   **Standard Boundary Rule & SDK Exceptions (ADR-003):** To keep the architecture modular and self-contained, core asynchronous transcription pipelines route requests to the Python FastAPI microservice (`apps/ai-services`). However, direct SDK or REST calls to Groq (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `whisper-large-v3`) and Gemini endpoints are utilized inside NestJS TypeScript services for specific modules, including M02 (CI Topic Ingestion and Translation), M09 (AI Roleplay and live turn evaluation), and M11 (AI Deep Researcher analysis).

### 2.2 Strict Multi-Tenancy & Layered Data Isolation
The platform enforces a shared-database, isolated-schema tenancy model, secured by a three-tiered defense-in-depth framework:
1.  **Layer 1: Application Middleware (Prisma Middleware):** A global query interceptor captures the verified `tenant_id` from the request context and automatically appends it to all queries, updates, deletes, and insertions. It rejects any operation lacking a valid tenant context with a `ForbiddenException`.
2.  **Layer 2: Database Storage (PostgreSQL Row-Level Security - RLS):** RLS is enabled and forced on all tenant-scoped tables. The NestJS API sets the `app.current_tenant_id` session variable at the start of every connection, ensuring that PostgreSQL enforces tenant separation even if application code is bypassed.
3.  **Layer 3: Secure JWT Verification:** The tenant context is extracted from RS256 cryptographically signed Supabase JWT claims, preventing client-side spoofing or ID tampering.

### 2.3 Async by Default for Heavy Workloads
*   Any operation involving model inference, transcription, massive data synchronizations, or multi-step external integration calls must be designed as an **Asynchronous Background Task**.
*   Synchronous HTTP request handlers are prohibited from waiting on LLM prompts or speech-to-text outputs. They must return an HTTP `202 Accepted` status with a tracking job ID and immediately delegate the payload execution to a robust **BullMQ** queue backed by Upstash Redis.

### 2.4 Decoupled Monorepo with Clear Microservice Extraction Path
To avoid premature optimization while preparing for high scalability, the platform is implemented as a decoupled, physical multi-package monorepo. Modules live directly under `/modules/` (e.g. `/modules/m01-capture-transcription/`, `/modules/m02-conversation-intelligence/`, etc.). 
A module becomes eligible for microservice extraction into an independent server only when all 5 conditions specified in **ADR-001** are met:
1.  **Independent Scaling Requirements:** The module consumes disproportionate CPU/memory (e.g., M-01 audio ingestion).
2.  **Data Isolation Completeness:** The module's database tables are completely decoupled from other schemas with no foreign keys crossing schemas.
3.  **Team Ownership Autonomy:** A dedicated engineering sub-team is assigned to manage its lifecycle.
4.  **Operational Boundary Overhead Justification:** The latency cost of network serialization is offset by architectural isolation.
5.  **Defined API Contract Stability:** The public API and event boundaries have remained stable without breaking changes for at least 3 months.

---

## 3. Database Stack & Schema Governance

### 3.1 Technology Inventory & Storage Mapping
The platform segregates storage technologies to match specific transactional and analytical workloads:

| Storage Engine | Technology Provider | Primary Data Domain | Performance Role |
| :--- | :--- | :--- | :--- |
| **Primary Relational DB** | Supabase PostgreSQL 16 | User credentials, tenants, deals, accounts, metadata, and transactional configurations. | Core system of record. Enforces RLS and consistency. |
| **Vector Index** | pgvector (Postgres Extension) | High-dimensional text embeddings of transcripts, call reviews, and RAG knowledge items. | Semantic search, similarity matching, and context retrieval. |
| **Analytics Engine** | ClickHouse 24.x | Time-series events, activity metrics, call score trends, and coaching log data. | High-performance columnar aggregation for BI dashboards. |
| **Full-Text Search** | Meilisearch (Stable) | Transcripts, conversation logs, email content, and deal driver tags. | Instant search UI, prefix matching, and spelling correction. |
| **Queue / Cache** | Redis 7.x (Upstash) | Queue state persistence, rate-limiting, session states, and API result caching. | BullMQ backing store and low-latency volatile cache. |

### 3.2 Database Schema Governance & Table Design
The platform operates under a **Centralized Database Schema** design utilizing a single source of truth Prisma schema configuration at `packages/database/prisma/schema.prisma`. This schema defines and maps all tables and database extensions (such as `vector`) and enables cross-workspace compilation of modular client bindings.

To satisfy automated audits, the database tables must conform to the following conventions:
1.  **Primary Key:** Must use standard text-based IDs (such as `uuid` or `cuid`). Serial integers are avoided.
2.  **Tenant Scoping:** Must have `tenantId` (mapped as `tenantId TEXT NOT NULL` or `tenantid UUID NOT NULL`) as a core column. Join tables may omit this only if they enforce tenant separation transitively through foreign keys.
3.  **Auditing Fields:** Must include `createdAt` (defaulting to current timestamp) and `updatedAt`.
4.  **Indexing:** Indices must be created on lookup fields scoped by tenant (e.g. `@@index([tenantId, lookupField])`) to prevent slow sequential scans.
5.  **RLS Enforcement:** PostgreSQL Row-Level Security (RLS) is applied on critical tables (such as dashboards, coaching recommendation schemas, etc.) using tenant isolation policies.

```sql
-- Conceptual SQL Example of a Scoped Table with RLS (dashboards schema)
CREATE SCHEMA IF NOT EXISTS dashboards;

CREATE TABLE dashboards.trainerscenarios (
    scenarioid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenantid UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    personadescription TEXT,
    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and isolate by tenant session variable
ALTER TABLE dashboards.trainerscenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards.trainerscenarios FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON dashboards.trainerscenarios
    FOR ALL USING (tenantid = COALESCE(NULLIF(current_setting('app.current_tenant', true), '')::uuid, tenantid));
```

### 3.3 Schema Ownership Mapping
PostgreSQL database tables are organized into two main namespaces:

*   `public` (Default Schema): Stores the core platform tables (Tenants, Users, Accounts, Deals) and module-specific data models for M1, M2, M3, M4, M5, M6, M8, and M10.
*   `dashboards`: Managed by M07 (Revenue Dashboards) and M09 (Coaching & Training) to store cached snapshots, dashboard configs, widget definitions, recommendations, and training roleplay sessions.

Conceptual data ownership remains divided by module boundaries, ensuring that each module handles queries for its domain logical layer (e.g. M1 handles call logs and transcripts, M6 handles forecasts, M10 handles revenue graphs).

### 3.4 Permitted Cross-Schema Read Contract Registry
Direct PostgreSQL table joins across schemas in application code are strictly prohibited to ensure module decoupling. If a service requires read context from a different domain, it must query it via the corresponding module's public REST API. The approved synchronizations are:

```
┌───────────────────────────────────────┐              ┌───────────────────────────────────────┐
│       M8 Sales Engagement             │ ────API─────> │       M10 Data & Compliance           │
│       (modules/m08-sales-engagement)  │              │       (modules/m10-data-compliance)   │
└───────────────────────────────────────┘              └───────────────────────────────────────┘
┌───────────────────────────────────────┐              ┌───────────────────────────────────────┐
│       M2 Conversation Intelligence    │ ────API─────> │       M10 Data & Compliance           │
│       (modules/m02-conv-intel)        │              │       (modules/m10-data-compliance)   │
└───────────────────────────────────────┘              └───────────────────────────────────────┘
┌───────────────────────────────────────┐              ┌───────────────────────────────────────┐
│       M3 AI Summaries & GenAI         │ ────API─────> │       M2 Conversation Intelligence    │
│       (modules/m03-ai-summaries-genai)│              │       (modules/m02-conv-intel)        │
└───────────────────────────────────────┘              └───────────────────────────────────────┘
┌───────────────────────────────────────┐              ┌───────────────────────────────────────┐
│       M4 Deal Intelligence            │ ────API─────> │       M3 AI Summaries & GenAI         │
│       (modules/m04-deal-intelligence) │              │       (modules/m03-ai-summaries-genai)│
└───────────────────────────────────────┘              └───────────────────────────────────────┘
```

---

## 4. Technical, Design & Coding Standards

### 4.1 The 10 Golden Rules of R-Revenue Intelligence
These rules are non-negotiable. Breaking any golden rule will result in an immediate merge blockage at the PR stage:

1.  **Keep Core AI Inference in Python (with Specific NestJS Exceptions):** Core asynchronous transcription pipeline prompts and processing live in the Python FastAPI service. Specific interactive/logical modules (M02 Topic Tagging & Translation, M09 AI Trainer Roleplay & Evaluation, M11 AI Deep Researcher) are permitted to write targeted prompts and make direct Groq/Gemini SDK or REST requests inside NestJS TypeScript services to keep the modules self-contained.
2.  **No Direct Cross-Module Imports:** You cannot import service classes or repositories directly across `/modules/m0X-*` workspaces. Communicate exclusively via BullMQ events or public API calls.
3.  **Strict Secrets Governance:** Secrets must never reside in source code, committed `.env` files, or Docker images. Doppler is the exclusive secrets orchestrator.
4.  **No Raw SQL in Services:** Database queries must use the local module's Prisma client instance to ensure automatic query verification and RLS enforcement.
5.  **Validate All Input Boundaries:** Every API route handler must use a typed **Zod DTO** schema. Unvalidated client payloads must never reach business logic.
6.  **No Synchronous AI Processing:** Keep the request-response lifecycle fast. Queue all transcriptions, scoring tasks, and summaries, returning an instant `202 Accepted` status.
7.  **Pin All Docker and Base Image Tags:** Never use `latest` or floating version identifiers in `Dockerfile` configurations. Pin exact, tested major-minor versions.
8.  **No Technology Addition Without ADR:** Adding an external package, service, database, or LLM provider requires a signed-off Architecture Decision Record.
9.  **Scope All Database Queries by Tenant:** Every database operation must contain a `tenant_id` filter at the service layer, acting as a redundant guard alongside RLS.
10. **Zero Bypasses for Merge to Main:** All 7 automated CI validation gates must be completely green, and manual Tech Lead sign-off is mandatory.

### 4.2 Naming Conventions & Code Style

#### Case Standardization
*   **Database Objects:** Schemas, tables, columns, indexes, and constraints must use `snake_case`. (e.g. `tenant_id`, `created_at`, `call_id`).
*   **TypeScript (NestJS/Next.js):**
    *   Files and folders: `kebab-case` (e.g., `call-review.service.ts`).
    *   Classes and types: `PascalCase` (e.g., `CallReviewService`).
    *   Variables and functions: `camelCase` (e.g., `getCallById`).
    *   Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`).
*   **Python (FastAPI):**
    *   Modules, functions, and variables: `snake_case` (e.g., `score_call.py`).
    *   Classes: `PascalCase` (e.g., `CallScorer`).

#### Typing Enforcement
*   The TypeScript compile options enforce `strict: true`. Bypassing the compiler using the `any` keyword is blocked. Use explicit interfaces or typed generics.
*   Pydantic v2 is the mandatory validation engine for all Python-based API payloads, using strict type declarations.

---

## 5. System Event Schema & Message Registry

Platform components are decoupled via an asynchronous message choreography driven by **BullMQ** on Redis. 

### 5.1 Standard Event Envelope
Every event emitted into the platform message bus must be encapsulated within this standard envelope to ensure consistent validation, routing, and log correlation:

```typescript
export const EventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string(),
  eventVersion: z.literal('v1'),
  tenantId: z.string().uuid(),
  producer: z.string(),
  occurredAt: z.string().datetime(),
  publishedAt: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid().optional(),
  payload: z.record(z.any())
});
```

### 5.2 Schema Size & Payload Limits
*   **Maximum Payload Size:** Standard events should target `< 256 KB` and have an absolute hard ceiling at `512 KB` to prevent Redis memory fragmentation.
*   **Large Data Reference Rule:** Payload fields containing objects larger than `50 KB` (such as full transcription text or raw audio buffers) must not be embedded directly inside the message. Instead, upload the asset to Supabase Object Storage and pass a validated URL reference:

```json
// ❌ WRONG: Heavy text embedded in payload
{
  "eventId": "...",
  "payload": {
    "callId": "...",
    "fullText": "...hundreds of thousands of lines of transcription text..."
  }
}

// ✅ CORRECT: URL reference to file storage
{
  "eventId": "...",
  "payload": {
    "callId": "...",
    "transcriptStorageUrl": "s3://ingestion-transcripts/tenant-123/call-456.txt",
    "transcriptSizeBytes": 45102,
    "transcriptHash": "sha256:e3b0c442..."
  }
}
```

### 5.3 Event Routing & Delivery Design
*   **Queue-per-Version Model:** The platform uses separated, versioned queues (e.g., `call.transcription.completed.v1`, `call.transcription.completed.v2`) to manage migrations smoothly without runtime parsing failures.
*   **Idempotency Guarantee:** Every consumer must track processed `eventId` values in Redis or check database state first, ensuring that a re-delivered message does not produce duplicate side effects.

---

## 6. Comprehensive Module Mapping (M1 – M10)

This section maps all customer-facing product modules to their corresponding technical architecture owners, database schemas, event boundaries, and custom domain validation constraints.

### 6.1 Product Module & Feature Inventory

| Module ID | Module Name | Core Features |
| :--- | :--- | :--- |
| **M1** | Capture & Transcription | Call Transcription, Native Connectors, AI Data Extractor |
| **M2** | Conversation Intelligence | AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, Smart Tracker, AI Translator, AI Transcriber, Searchable Conversation Library, Real-Time Call guidance |
| **M3** | AI Summaries & GenAI | AI Smart Summaries, Ask Anything (RAG-based chat), AI Deep Researcher |
| **M4** | Deal Intelligence | Deals Boards, View Deal Drivers |
| **M5** | Account Intelligence | Account Boards |
| **M6** | Forecasting & Prediction | AI Revenue Predictor, Forecast Boards |
| **M7** | R-Revenue Dashboards | Revenue Dashboards |
| **M8** | Sales Engagement | Email Composer, Engage (To-Do), Orchestrate, Workflow Automation |
| **M9** | Coaching & Training | Sales Coaching Insights, AI Trainer |
| **M10** | Data & Compliance | Revenue Graph, Configure Compliance, Data Export (Data Cloud) |

```
                  ┌─────────────────────────────────────────┐
                  │    Capture & Transcription (M1)         │
                  └────────────────────┬────────────────────┘
                                       │
                                       │ (call.transcription.completed)
                                       v
                  ┌─────────────────────────────────────────┐
                  │      Data & Compliance (M10 Graph)      │
                  └──────────┬───────────────────┬──────────┘
                             │                   │
                             │ (linked metadata) │ (linked metadata)
                             v                   v
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│  Conversation Intelligence (M2)        │   │     AI Summaries & GenAI (M3)          │
└────────────────────┬───────────────────┘   └───────────────────┬────────────────────┘
                     │                                           │
                     │ (call.scored)                             │ (call.summary.generated)
                     v                                           v
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│    Coaching & Training (M9)            │   │       Deal & Account Mgmt (M4/M5)      │
└────────────────────────────────────────┘   └────────────────────────────────────────┘
```

---

### 📦 MODULE: M1 Capture & Transcription
*   **v1 Features:** Call Ingestion API, Native Connectors (Zoom, Google Meet, Teams), Deepgram/Whisper Transcribers, speaker diarization, vocabulary correction.
*   **Technical Workspace:** `modules/m01-capture-transcription/`
*   **Platform Lifecycle Stage:** Stage 1 — `Capture`
*   **Canonical API Prefix:** `/api/v1/m01-capture-transcription`
*   **Owned Table Schema:** `m01_capture_transcription`
*   **Events Emitted:**
    *   `call.transcription.completed` (Triggered after transcription and speaker diarization persist).
    *   `crm.fields.extracted` (Triggered after downstream parsing of key entity properties).
*   **Events Consumed:** None. (M1 acts as the primary data entry gateway for the entire platform).
*   **Special Domain Rules & Constraints:**
    *   **7-Day Raw Audio Deletion:** To minimize risk and storage costs, raw audio and video files must be permanently purged from the storage buckets 7 days post-ingestion. Only text transcripts and downstream intelligence remain.
    *   **Confidence Review Thresholds:** CRM fields extracted by the AI engine must follow a three-tier pipeline:
        *   `Score >= 0.80`: Auto-synced to the connected CRM platform.
        *   `0.70 <= Score < 0.80`: Flagged for review; must reside in `crm_extracted_fields` for human manual approval.
        *   `Score < 0.70`: Silent exclusion; dropped from sync pipelines.

---

### 📦 MODULE: M2 Conversation Intelligence
*   **v1 Features:** AI Call Reviewer (LangGraph agent scorecards), AI Topic Tagger, AI Theme Spotter, Smart Tracker, AI Translator, AI Transcriber, Searchable Conversation Library, Real-Time Call guidance.
*   **Technical Workspace:** `modules/m02-conversation-intelligence/`
*   **Platform Lifecycle Stage:** Stage 3 — `Understand`
*   **Canonical API Prefix:** `/api/v1/m02-conversation-intelligence`
*   **Owned Table Schema:** `m02_conversation_intelligence`
*   **Events Emitted:**
    *   `call.topics.tagged` (Emitted after topic categorization completes).
    *   `call.scored` (Emitted after scorecard valuation finishes).
    *   `tracker.detection.created` (Emitted when dynamic keyword patterns match a transcript).
*   **Events Consumed:**
    *   `call.transcription.completed` (Triggers both AI scorecard scoring and keyword tracking runs).
    *   `revenue_graph.entity.linked` (Signals that a call record has been successfully mapped to CRM deals; triggers scoring finalization).
    *   `email.sent` (Triggers intent tracking sweeps across outbound outreach content).
*   **Special Domain Rules & Constraints:**
    *   **Context Locking Rule:** AI Call Reviewer and scoring services are restricted from calculating final call scores until M10 emits the `revenue_graph.entity.linked` event. Scoring must leverage the CRM metadata (deal value, client tier) to select the correct contextual scoring template.

---

### 📦 MODULE: M3 AI Summaries & GenAI
*   **v1 Features:** AI Smart Summaries (structured briefs), Ask Anything (RAG-based chat), AI Deep Researcher (multi-call insights).
*   **Technical Workspace:** `modules/m03-ai-summaries-genai/`
*   **Platform Lifecycle Stage:** Stage 4 — `Analyze`
*   **Canonical API Prefix:** `/api/v1/m03-ai-summaries-genai`
*   **Owned Table Schema:** `m03_ai_summaries_genai`
*   **Events Emitted:**
    *   `call.summary.generated` (Announces the availability of a new call summary).
    *   `research.report.completed` (Fires when an asynchronous AI deep research job completes).
*   **Events Consumed:**
    *   `call.transcription.completed` (Triggers the automatic generation of call summaries and next steps).
    *   `tracker.detection.created` (Triggers recalculations of risk flags in active briefs).
    *   `call.topics.tagged` (Provides taxonomy mappings to index retrieval context).
*   **Special Domain Rules & Constraints:**
    *   **RAG Query Retention Limit:** Chat history records within `query_sessions` must be strictly retained for exactly 90 days. A daily platform CRON sweeps and permanently cascades deletion for expired chat histories.
    *   **Research Concurrency Caps:** To prevent external token exhaustion, a single tenant can run a maximum of 2 concurrent AI Deep Researcher workflows. Excess requests are placed in an operational wait queue.

---

### 📦 MODULE: M4 Deal Intelligence
*   **v1 Features:** Deals Boards UI, Deal drivers scoring, MEDDIC/BANT extraction, risk indicators.
*   **Technical Workspace:** `modules/m04-deal-intelligence/`
*   **Platform Lifecycle Stage:** Stage 5 — `Execute`
*   **Canonical API Prefix:** `/api/v1/m04-deal-intelligence`
*   **Owned Table Schema:** `m04_deal_intelligence`
*   **Events Emitted:** None. (UI-serving module).
*   **Events Consumed:**
    *   `revenue_graph.entity.linked` (Updates active boards with new entity relation lines).
    *   `deal.stage.changed` (Fires when a deal moved stage in CRM; consumed to refresh position on board).
    *   `tracker.detection.created` (Used to update and show deal risk flags on the active board).
    *   `email.sent` (Updates deal's last activity timestamps).
    *   `call.summary.generated` (Invalidates deal brief cache and signals board UI to fetch fresh details).
*   **Special Domain Rules & Constraints:**
    *   **UI Stage-Change Request Pattern (ADR-005):** When a salesperson drags and drops a deal card to a new stage in the Deals Board UI:
        1. M4 performs an optimistic local DB update and publishes an internal `deal.stage.update.requested` request message.
        2. **M10** (Data & Compliance / Revenue Graph) consumes this internal message, performs the outbound synchronization to the external CRM system, and waits for success.
        3. Once the CRM updates successfully (or when an inbound sync detects a CRM stage change), **M10** publishes the public platform event `deal.stage.changed` to the event bus.
        4. M4, M8, and M6 consume `deal.stage.changed` to run downstream side-effects. M4 is strictly prohibited from direct CRM writes or publishing public platform events directly from UI triggers.

---

### 📦 MODULE: M5 Account Intelligence
*   **v1 Features:** Account Boards UI, stakeholder influence map, competitive alert widgets.
*   **Technical Workspace:** `modules/m05-account-intelligence/`
*   **Platform Lifecycle Stage:** Stage 5 — `Execute`
*   **Canonical API Prefix:** `/api/v1/m05-account-intelligence`
*   **Owned Table Schema:** `m05_account_intelligence`
*   **Events Emitted:** None.
*   **Events Consumed:**
    *   `call.summary.generated` (Used to invalidate account briefs and serve fresh summaries).
    *   `email.sent` (Increments engagement activity counts).
    *   `tracker.detection.created` (Attaches competitive tracking alerts to the account portal).
*   **Special Domain Rules & Constraints:**
    *   **Context Freshness Control:** Account intelligence dashboards utilize a precomputed read-model pattern. The system pulls from pre-calculated `engagement_scores` and `renewal_signals` rather than computing them live on every page load to guarantee under 500ms p99 latency SLAs.

---

### 📦 MODULE: M6 Forecasting & Prediction
*   **v1 Features:** AI Revenue Predictor, Quota and Forecast Boards.
*   **Technical Workspace:** `modules/m06-forecasting-prediction/`
*   **Platform Lifecycle Stage:** Stage 6 — `Predict`
*   **Canonical API Prefix:** `/api/v1/m06-forecasting-prediction`
*   **Owned Table Schema:** `m06_forecasting_prediction`
*   **Events Emitted:**
    *   `forecast.submitted` (Fires when a manager locks and submits a team forecast).
*   **Events Consumed:**
    *   `deal.stage.changed` (Triggers asynchronous pipeline coverage and accuracy calculation updates).
*   **Special Domain Rules & Constraints:**
    *   **Rate-Limited Recalculations:** Due to the mathematical complexity of the predictive ML models, the forecasting engine restricts real-time updates. A maximum of one forecast recalculation per tenant/period is allowed within a 60-minute window.
    *   **Immutability of Submissions:** Submissions inside `forecast_submissions` are strictly append-only. A manager modifying a forecast generates a new row version increment, maintaining a historical audit trail.

---

### 📦 MODULE: M7 R-Revenue Dashboards
*   **v1 Features:** Columnar Revenue performance widgets, scorecards, Attainment BI graphs.
*   **Technical Workspace:** `modules/m07-revenue-dashboards/`
*   **Platform Lifecycle Stage:** Stage 7 — `Optimize`
*   **Canonical API Prefix:** `/api/v1/m07-revenue-dashboards`
*   **Owned Table Schema:** `m07_revenue_dashboards`
*   **Events Emitted:** None.
*   **Events Consumed:** None.
*   **Special Domain Rules & Constraints:**
    *   **The Columnar Storage Rule:** Dashboard queries must target the **ClickHouse Columnar Store** as their primary data engine. 
    *   **PostgreSQL Failover Fallback:** If the primary ClickHouse database becomes unavailable, the dashboard service must automatically fall back to executing queries against the PostgreSQL transaction database, log a high-priority alert to Better Stack, and throttle non-essential dashboard widget renderings.

---

### 📦 MODULE: M8 Sales Engagement
*   **v1 Features:** Email Composer, Engage (To-Do), Sequencer outreach tasks, automated playbooks trigger flows.
*   **Technical Workspace:** `modules/m08-sales-engagement/`
*   **Platform Lifecycle Stage:** Stage 5 — `Execute`
*   **Canonical API Prefix:** `/api/v1/m08-sales-engagement`
*   **Owned Table Schema:** `m08_sales_engagement`
*   **Events Emitted:**
    *   `email.sent` (Emitted when an outbound email dispatch finishes).
*   **Events Consumed:**
    *   `call.transcription.completed` (Evaluates transcribed content to trigger automated follow-up drafts).
    *   `tracker.detection.created` (Triggers competitive alerts and automated play enrollments).
    *   `deal.stage.changed` (Triggers stage-based workflows and sales play automations).
    *   `call.summary.generated` (Evaluates extracted meeting topics to trigger workflow completions).
*   **Special Domain Rules & Constraints:**
    *   **SendGrid Integration Sandboxing:** Dispatched emails are automatically validated and must use a strictly isolated sandbox mode unless flagged for production by the organizational tenant settings.

---

### 📦 MODULE: M9 Coaching & Training
*   **v1 Features:** Coaching dashboard, playlists, AI Trainer (roleplay scenarios and messages).
*   **Technical Workspace:** `modules/m09-coaching-training/`
*   **Platform Lifecycle Stage:** Stage 7 — `Optimize`
*   **Canonical API Prefix:** `/api/v1/m09-coaching-training`
*   **Owned Table Schema:** `m09_coaching_training`
*   **Events Emitted:** None. (M9 acts as a terminal downstream consumer).
*   **Events Consumed:**
    *   `call.scored` (Consumes scorecards to update skill metrics).
    *   `forecast.submitted` (Triggers forecast accuracy evaluation pipelines).
*   **Special Domain Rules & Constraints:**
    *   **The Low-Sample Coaching Rule:** To prevent AI Hallucinations and statistically invalid recommendations, the coaching service is prohibited from generating weekly recommendations unless the salesperson has a minimum of 5 recorded calls (`callCount >= 5`) within that tracking window.

---

### 📦 MODULE: M10 Data & Compliance
*   **v1 Features:** Revenue Graph CRM entities sync, PII Redaction, Immutable audit logging, Data Cloud export connectors (Snowflake, BigQuery).
*   **Technical Workspace:** `modules/m10-data-compliance/`
*   **Platform Lifecycle Stage:** Stage 2 — `Model` & Cross-cutting Governance
*   **Canonical API Prefix:** `/api/v1/m10-data-compliance`
*   **Owned Table Schema:** `m10_data_compliance`
*   **Events Emitted:**
    *   `revenue_graph.entity.linked` (Fires after successful CRM entity resolution and matching).
    *   `deal.stage.changed` (Fires after a deal stage change is durably recorded/synced to CRM).
*   **Events Consumed:**
    *   `call.transcription.completed` (Triggers interaction mapping to accounts and deals).
    *   `crm.fields.extracted` (Pushes key structured data parameters into relational tables).
    *   `email.sent` (Captures outreach activities to update transaction timelines).
    *   `call.summary.generated` (Saves generated summaries to CRM opportunity note fields).
*   **Special Domain Rules & Constraints:**
    *   **The Daily Synchronization Lock:** The Data Cloud export system processes daily exports to 5 supported target types (Snowflake, BigQuery, Databricks, Amazon S3, Redshift) starting at 02:00 UTC. The process uses a persistent `sync_id` key in Redis to prevent duplicate parallel exports.

---

## 7. Tooling, Services & Cost Management

### 7.1 Tech Stack Cost & Usage Matrix
All tools and services utilized in the R-Revenue Intelligence platform must be mapped to their approved cost mindset and usage role. The introduction of any unlisted service is prohibited:

| Cost Classification | Development Tools | AI / ML Layer | Data & Storage | Monitoring & DevOps |
| :--- | :--- | :--- | :--- | :--- |
| **Free & Open Source** | Node.js, TypeScript, Next.js, NestJS, FastAPI, Prisma, Zod. | LangGraph, LiteLLM. | PostgreSQL, Redis, Meilisearch, ClickHouse. | GitHub Actions, Docker, TailwindCSS. |
| **Free Offline AI** | Ollama (Local LLM runs). | Gemma-family (Prompt validation), pyannote.audio. | SQLite (Local mock databases). | Ruff, Black, ESLint. |
| **Free Tier / Trial** | Vercel (Previews). | Google AI Studio (API tests), Groq (Speed tests). | Supabase (Starter plans), Upstash Redis. | Sentry (Hobby), Better Stack (Logs). |
| **Paid Now** | Vercel Pro (Production). | OpenAI API, Deepgram. | Supabase Pro, AWS S3 Buckets. | Sentry (Production), Doppler Team. |
| **Paid Later at Scale** | AWS ECS / Fargate. | Dedicated GPU clusters (AI Services). | Managed ClickHouse, Qdrant (Vector DB). | PagerDuty, Enterprise Cloudflare. |

### 7.2 Core Principles of Stack Governance
*   **"Prefer Approved Stack First":** Before adding any third-party framework or dependency, the engineering lead must verify if an existing tool in the matrix can satisfy the requirement.
*   **"No Secrets in Git":** Secrets rotation must occur on a strict 90-day cadence. Doppler acts as the single orchestrator. Storing keys in raw code or Docker files is prohibited.
*   **"Security Redaction on Logs":** Log collectors (Better Stack, Sentry) must run local regex processors to filter and redact all PII data (phone numbers, emails) and secrets prior to external storage.

---

## 8. Local Setup & Environment Architecture

To accommodate different developer machines and OS-level virtualization constraints, the R-Revenue Intelligence platform is architected to run seamlessly under a dual-environment configuration:

### 8.1 Setup Option A: Containerized Infrastructure (With Docker)
This is the standard local engineering environment. Running `docker-compose up -d` boots:
* **PostgreSQL 16 (with pgvector)** on port `5438` (mapped to container port `5432`) for transactional metadata and embedding search.
* **Redis 7 (via Upstash client compatibility)** on port `6379` for BullMQ backing.
* **Meilisearch** on port `7700` and **ClickHouse** on port `8123/9000`.

### 8.2 Setup Option B: Native Host Environment (Without Docker)
If running without Docker, services are run natively:
* **Local Databases**: Developers run PostgreSQL 16 and Redis natively on their host machine, or point to sandbox instances in the cloud (e.g. Supabase/Neon, Upstash).
* **Workspace Environment (.env)**: A local `.env` is created in the repository root containing native connection parameters (`DATABASE_URL`, `REDIS_HOST`, `AI_SERVICE_URL`).
* **Python Services**: The AI microservice (`apps/ai-services`) runs in a native Python 3.11 virtual environment (`python -m venv venv` + `uvicorn app.main:app --port 8000`).

### 8.3 Compilation Resolution for Shared Monorepo Databases
When building Prisma types across our physical monorepo workspaces on Windows, running parallel compiler threads causes a file system rename race condition (`EPERM` write lock errors on `query_engine-windows.dll.node.tmp`).
* **Non-Negotiable Rule**: All developers must compile prisma client databases recursively and **sequentially** utilizing the concurrency-throttled pnpm option:
  ```bash
  pnpm --workspace-concurrency=1 -r db:generate
  ```
* **Schema Synchronization**: Once generated, database tables are synchronized globally against the configured DB instance via:
  ```bash
  npx prisma db push --schema=packages/database/prisma/schema.prisma
  ```

### 8.4 Beginner Onboarding Roadmap & SDD Constitution
For freshers, interns, and onboarding teams, a step-by-step feature development blueprint is maintained at [beginner_developer_journey_guide.md](file:///C:/Users/Relanto/.gemini/antigravity/brain/c4cfdae5-d238-463f-beb1-926342b7d116/artifacts/beginner_developer_journey_guide.md). This guide details:
1. **Spec-Driven Development (SDD)**: Creating Specs under `.specify/specs/`, plan generation via AI under `.specify/plans/`, and sequential tasks execution.
2. **Modular Git Branching**: Cutting temporary `feature/mX-*` branches from dedicated staging integrations `module/mX-*`, ensuring zero commit pollution on `develop` or `main`.

---

## 9. Development Workflow Checklist for Engineering Team

Before submitting a Pull Request for integration into the `develop` branch, the developer must complete this validation checklist:

- [ ] **Directory Alignment:** The code resides strictly within the decoupled physical workspace directories: domain modules under `/modules/m0X-*`, platform core under `/modules/platform-core/`, and AI model code under `/apps/ai-services/`.
- [ ] **Technical Boundary Rule:** No direct cross-module imports are used. Cross-module data queries are routed through BullMQ event publishers or approved REST APIs.
- [ ] **Database Schema Standard:** The local table configurations utilize UUID primary keys, carry `tenant_id UUID NOT NULL` as the second column, and have an index on `(tenant_id, lookup_col)`.
- [ ] **Row-Level Security:** `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` are applied to all newly created tables.
- [ ] **Input Sanitization:** All controller entry points contain a corresponding Zod validation schema. No raw payload reaches business service files.
- [ ] **Secrets Hygiene:** No credentials or API keys exist within `.env` files or source code. All variables are fetched via Doppler context calls.
- [ ] **ASR & LLM Decoupling:** TypeScript service files make no direct calls to OpenAI or Deepgram. All AI operations are delegated asynchronously via BullMQ or routed through private FastAPI endpoints.
- [ ] **Dashboard ClickHouse Fallback:** If modifying M7/M10 dashboard components, a failover mechanism is implemented to query PostgreSQL if ClickHouse is unreachable.
- [ ] **Coaching Metrics Constraint:** M9 updates ensure that coaching metrics recommendations are suppressed if the salesperson has fewer than 5 recorded calls in the current period.
- [ ] **Event Envelope Compliance:** Emitted event messages carry the verified standard v1 envelope, including `eventId`, `tenantId`, `correlationId`, and `occurredAt`.
- [ ] **Linting & Verification:** `npm run lint` and `python -m ruff check` compile with zero warnings. Automated unit and integration tests run successfully with a minimum coverage of 80%.

---

## 10. Technical Debt & Known Issues

This section records open architectural mismatches, deferred clean-up items, and temporary workarounds that must be resolved before general availability. Each entry maps 1:1 to a corresponding item in [`docs/execution/implementation_plan.md` — Technical Debt Registry](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/docs/execution/implementation_plan.md).

| TD-ID | Severity | Status | Title | Affects |
| :--- | :--- | :--- | :--- | :--- |
| **TD-001** | Medium | 🔴 Open | M11 Physical Folder / M3 Logical Boundary Mismatch | `modules/m11-deep-researcher/`, `modules/m03-ai-summaries-genai/` |

### TD-001 — M11 Physical Folder / M3 Logical Boundary Mismatch

**Summary:** The platform is documented as a **10-module logical architecture** (M1–M10). However, a physical folder `modules/m11-deep-researcher/` exists in the repository and is registered as a standalone NestJS module in `apps/unified-api/src/app.module.ts`. The **AI Deep Researcher** feature it contains is logically and commercially owned by **M3 (AI Summaries & GenAI)**.

**Temporary Workaround:** All documentation treats AI Deep Researcher as part of M3. The `modules/m11-deep-researcher/` folder is a layout artifact only. No new documentation should refer to it as a standalone M11 module.

**Resolution:** See full resolution plan in `implementation_plan.md → TD-001`. Summary:
1. Migrate source files into `modules/m03-ai-summaries-genai/deep-researcher/`.
2. Merge `M11Module` into `M03Module`.
3. Remove standalone `M11Module` registration from `app.module.ts`.
4. Consolidate API routes under `/api/v1/m03-ai-summaries-genai/deep-researcher`.
5. Delete `modules/m11-deep-researcher/` after migration.
6. Raise a formal ADR for the consolidation.

---
*End of Complete Codebase Knowledge Base. Maintain this standard to preserve architectural integrity.*
