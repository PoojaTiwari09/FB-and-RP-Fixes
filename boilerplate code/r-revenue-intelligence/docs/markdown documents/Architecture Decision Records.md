# Architecture Decision Records (ADRs)

## Purpose

This document contains the Architecture Decision Records (ADRs) for the R-Revenue Intelligence platform. An ADR is a short document that captures one important technical or architectural decision, why it was made, what alternatives were considered, and what impact the decision has on the system.

The purpose of this document is to make major technology decisions clear, traceable, reviewable, and easy to understand for current and future team members.

> **Source of truth note:** The content in this document has been formally extracted from `System_architecture.md` Sections 4.3–4.7 and consolidated here as the canonical ADR registry. The SAD remains the detailed implementation reference. This document is the governance record.

---

## ADR Status Values

- **Draft** — Decision is being discussed and is not final
- **Approved** — Decision is accepted and can be used in implementation
- **Superseded** — Decision was once approved but has now been replaced by a newer ADR

---

## ADR Registry

| ADR | Decision | Status | Owner | Date |
|---|---|---|---|---|
| ADR-001 | Modular Monolith as Phase 1–2 architecture | ✅ Approved | Tech Lead | April 2026 |
| ADR-002 | TypeScript (Node.js) as product service language | ✅ Approved | Tech Lead | April 2026 |
| ADR-002b | Python (FastAPI) as AI/ML service language | ✅ Approved | Tech Lead | April 2026 |
| ADR-003 | Python as AI/ML service language (standalone) | ✅ Approved | Tech Lead | April 2026 |
| ADR-004 | PostgreSQL as primary relational database | ✅ Approved | Tech Lead | April 2026 |
| ADR-005 | BullMQ on Redis as the event bus | ✅ Approved | Tech Lead | April 2026 |
| ADR-006 | OpenAI API as primary LLM via LiteLLM gateway | ✅ Approved | Tech Lead | April 2026 |
| ADR-007 | Whisper (primary ASR) + AssemblyAI (fallback) | ✅ Approved | Tech Lead | April 2026 |
| ADR-008 | Multi-tenancy: shared DB + Row Level Security | ✅ Approved | Tech Lead | April 2026 |
| ADR-009 | Data Cloud: 5 warehouse targets + daily idempotent sync | ✅ Approved | Tech Lead | April 2026 |

---

## ADR-001 — Modular Monolith as Phase 1–2 Architecture

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform needs to be built with a small team (under 25 engineers) in the early phases. A full microservices architecture was considered but the team size, domain learning curve, and Phase 1 delivery velocity requirements make it premature.

### Options Considered

- **Option A — Full Microservices from Day 1:** 10 independent services, each with its own deployment pipeline, monitoring, and on-call rotation.
- **Option B — Modular Monolith (chosen):** 10 NestJS modules in a single deployable unit, strict schema-per-module boundaries enforced by code conventions.
- **Option C — Single-layer monolith:** No enforced module boundaries, shared database tables.

### Decision

**Modular Monolith (Option B)** for Phase 1 and Phase 2.

Two services are extracted from Day 1 due to fundamentally different runtime profiles:
- **Transcription Service** (Python/FastAPI) — burst CPU, 8GB RAM for Whisper model
- **AI Services Layer** (Python/FastAPI) — continuous LLM inference, stateful LangGraph agents

All 10 product modules (M-01 through M-10) remain in the NestJS Monolith until extraction triggers are met.

### Consequences

**Benefits:**
- 1 deployment pipeline instead of 10 → 10x faster iteration
- Single debugger session traces M-01 → M-06
- Schema refactoring stays in 1 repo during boundary discovery
- Railway deploy takes 4 hours vs 4 weeks for service mesh

**Trade-offs:**
- Cannot scale individual modules independently before Phase 3
- All modules share the same deployment and restart cycle
- Must enforce module boundaries by convention, not network isolation

**Extraction Triggers (All 5 must be met before extracting any module):**

| Trigger | Metric | Target |
|---|---|---|
| Performance | CPU/Memory usage | > 80% sustained 7 days |
| Release Cadence | Deploy frequency vs monolith | < 1x/week |
| Load Isolation | P99 latency impact | > 500ms on other modules |
| Boundary Stability | Schema/API changes | < 2 changes in 2 quarters |
| Team Capacity | Dedicated engineers | 4+ FTE committed |

**Planned Extraction Order:**
1. M-03 Revenue Graph (Phase 3a) — highest load, most shared
2. M-05 Smart Tracking (Phase 3b) — embedding generation scale
3. M-07 Deal Management (Phase 3c) — UI bottleneck

**Developer Rule:** Extraction without all 5 triggers = premature optimization. PRs for early extraction will be rejected.

**Reference:** `System_architecture.md` Sections 4.3 and 4.3.1–4.3.3

---

## ADR-002 — TypeScript (Node.js) as Product Service Language

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform requires a consistent backend language for all 10 NestJS product modules. The language must support strong typing, async I/O, and the modular NestJS architecture pattern.

### Options Considered

- **Option A — TypeScript (chosen):** Strong typing, native NestJS support, shared type contracts between frontend and backend.
- **Option B — JavaScript (no types):** Faster initial writing but loses compile-time safety across module boundaries.
- **Option C — Go:** Better performance but steeper learning curve and no NestJS ecosystem.

### Decision

**TypeScript 5.x on Node.js 20.x LTS** for all NestJS product services.

All module-level code, API handlers, event consumers, BullMQ workers, and database access via Prisma must be written in TypeScript. No plain JavaScript files in the product service codebase.

### Consequences

**Benefits:**
- Shared type contracts between frontend (Next.js) and backend (NestJS)
- Compile-time detection of schema drift before runtime
- NestJS decorators and dependency injection work natively
- Zod + TypeScript gives end-to-end type safety on API boundaries

**Trade-offs:**
- Slightly more verbose than plain JavaScript
- Build step required (ts-node or tsc)
- AI/ML logic still requires Python — TypeScript does not replace it

**Non-negotiable rule:** AI libraries (PyTorch, LangChain, spaCy, sentence-transformers) cannot run inside the TypeScript service. All AI capability is consumed via the AI Services Layer Python API. See ADR-002b.

**Reference:** `System_architecture.md` Section 2.4 Principle 4, Section 16 (Technology Stack)

---

## ADR-002b — Python (FastAPI) as AI/ML Service Language

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform's AI capabilities require Python-native libraries (PyTorch, spaCy, sentence-transformers, LangGraph) that cannot run inside Node.js. Two separate Python services are needed: the Transcription Service and the AI Services Layer.

### Options Considered

- **Option A — Python FastAPI (chosen):** Native support for all AI/ML libraries. Clean, typed async API. FastAPI is the standard for ML-serving.
- **Option B — Python Flask:** Simpler but lacks async support and type validation out of the box.
- **Option C — Node.js ONNX runtime:** Limited ML ecosystem, no LangGraph support, no PyTorch.

### Decision

**Python 3.12 + FastAPI** for both extracted Python services:

1. **Transcription Service:** Receives audio jobs from BullMQ → Whisper/AssemblyAI → publishes `call.transcription.completed`
2. **AI Services Layer:** Exposes all AI endpoints to the NestJS Monolith via internal HTTP API

### Consequences

**Benefits:**
- Full access to PyTorch, LangGraph, spaCy, sentence-transformers, LiteLLM
- GPU support for model inference
- Language boundary enforced — no Python business logic, no DB writes from AI services
- FastAPI provides automatic OpenAPI docs for AI endpoints

**Trade-offs:**
- Two language stacks to maintain
- Separate CI/CD pipeline for Python services
- Cross-language type contracts must be validated manually

**Critical rule:** AI services must only receive structured JSON, compute, and return structured JSON. No database writes, no CRM calls, no business actions. The NestJS layer owns all business logic.

**Interface example:**
```
POST /summarize → {summary, key_points, next_steps, confidence_score, tokens_used}
POST /detect-trackers → {detections: [{tracker_id, confidence, match_text}]}
POST /embed → {embeddings: float[][]}
```

**Reference:** `System_architecture.md` Sections 4.4 and 4.5 (ADR-002b), Section 12 (AI Architecture)

---

## ADR-003 — Python as Standalone AI/ML Language Principle

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

To avoid confusion between ADR-002 (TypeScript for product services) and ADR-002b (Python for AI services), this ADR formally states the language stack rule as a platform-wide principle.

### Decision

**Language Stack Rule (Non-Negotiable):**

| Layer | Language | Framework | Reason |
|---|---|---|---|
| Frontend | TypeScript | Next.js 14 | SSR, routing, BFF pattern |
| Product Services | TypeScript | NestJS 10 | Modular monolith, DI, decorators |
| AI Services | Python 3.12 | FastAPI | AI/ML library ecosystem |
| Transcription | Python 3.12 | FastAPI | Whisper, ASR libraries |

No AI/ML library may be imported into TypeScript product services. No business logic may be written in Python services.

**Reference:** `System_architecture.md` Section 2.4 Principle 4

---

## ADR-004 — PostgreSQL as Primary Relational Database

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform stores multi-tenant revenue data with strict isolation requirements, vector embeddings for RAG, and complex relational queries across module schemas.

### Options Considered

- **Option A — PostgreSQL + Supabase (chosen):** ACID compliance, pgvector extension, RLS for tenant isolation, managed hosting via Supabase.
- **Option B — PlanetScale (MySQL):** No pgvector, no RLS, schema migrations more complex.
- **Option C — Neon:** PostgreSQL-compatible but less mature managed platform at the time of decision.
- **Option D — MongoDB:** No ACID across documents, poor fit for relational revenue data.

### Decision

**PostgreSQL 16 via Supabase Pro** as the single primary database for all 10 modules.

Key requirements it fulfills:
- **pgvector extension** — vector embeddings stored alongside relational data (no separate vector DB needed in Phase 1–2)
- **Row Level Security (RLS)** — tenant isolation enforced at the DB layer, not just application layer
- **Schema-per-module** — `m01_*`, `m02_*`, ..., `m10_*` table prefixes enforce ownership
- **Prisma ORM** — type-safe access and migration workflow

### Consequences

**Benefits:**
- One DB to monitor, back up, and operate
- pgvector eliminates need for a separate vector store (Qdrant, Pinecone) until Phase 3
- RLS ensures no tenant data leaks even with application bugs
- Prisma provides type-safe schema access across all modules

**Trade-offs:**
- Shared DB means one bad migration can affect all modules
- At scale (Phase 3+), may need per-module DB instances
- pgvector query performance may degrade at large embedding count (>1M vectors)

**Upgrade path:** Move to per-module PostgreSQL instances and optionally Qdrant/Weaviate for vector storage when extraction triggers (ADR-001) are met.

**Reference:** `System_architecture.md` Section 8 (Database Architecture)

---

## ADR-005 — BullMQ on Redis as the Event Bus

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform is event-driven. All 10 modules communicate asynchronously via events. The event bus must support retries, dead-letter queues, priority queues, idempotency, and tenant-safe message handling.

### Options Considered

- **Option A — BullMQ on Redis (chosen):** Queue-based, first-class retry/DLQ support, Node.js native, works inside the NestJS monolith.
- **Option B — Kafka:** Overkill for Phase 1 scale, requires separate cluster, higher operational cost.
- **Option C — RabbitMQ:** Strong message broker but extra infrastructure and less native Node.js integration.
- **Option D — AWS SQS:** Managed, but adds cloud vendor lock-in and higher latency.

### Decision

**BullMQ on Redis** as the platform event bus for all inter-module communication.

Named event queues (one per event type):
- `call.transcription.completed` (Priority: High, Retries: 3, Backoff: Exponential 30s/60s/120s)
- `revenue_graph.entity.linked` (Priority: High, Retries: 3, Backoff: Exponential 30s/60s/120s)
- `deal.stage.changed` (Priority: High, Retries: 2, Backoff: Fixed 30s/30s)
- `call.scored` (Priority: Normal, Retries: 3, Backoff: Exponential 60s)
- `call.summary.generated` (Priority: Normal, Retries: 2, Backoff: Fixed 30s/30s)
- `tracker.detection.created` (Priority: High, Retries: 3, Backoff: Exponential 30s/60s/120s)
- `forecast.submitted` (Priority: Low, Retries: 2, Backoff: Fixed 30s/30s)

Each queue has a corresponding dead-letter queue: `<event-name>.dlq`

### Consequences

**Benefits:**
- Single Redis instance supports all queues (no additional broker infra)
- BullMQ DLQ, retry, and priority are built-in
- BullMQ runs in-process with NestJS — no network hop for monolith workers
- Event Schema Registry enforces typed contracts across all queues

**Trade-offs:**
- Redis memory must be sized for queue depth during peak
- Not suitable for extremely high throughput (>10k/sec) — Kafka migration would be needed
- At Phase 3 extraction, queues become network-facing

**Mandatory rule:** All inter-module communication MUST go through BullMQ. No direct module-to-module imports or HTTP calls between product modules.

**Reference:** `System_architecture.md` Section 9 (Event Architecture), `Event Schema registry.md`

---

## ADR-006 — OpenAI API as Primary LLM via LiteLLM Gateway

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform's AI features (summaries, Q&A, email drafts, extraction, RAG) require a production-grade LLM. The choice must balance output quality, latency, cost, and provider lock-in risk.

### Options Considered

- **Option A — OpenAI API via LiteLLM (chosen):** Best-in-class model quality, structured JSON output, function calling. LiteLLM provides provider abstraction.
- **Option B — Direct OpenAI API (no gateway):** Simpler, but vendor lock-in with no fallback.
- **Option C — Anthropic Claude only:** Strong but no fallback if Anthropic has outages.
- **Option D — Local Ollama/Gemma:** Insufficient quality for production summarization at current model size.

### Decision

**OpenAI API** as the primary LLM provider, accessed exclusively through **LiteLLM** inside the Python AI Services Layer.

LiteLLM provides:
- Unified provider interface (swap provider without code changes)
- Automatic fallback: OpenAI → Anthropic
- Token cost tracking per request
- Rate limit handling

### Consequences

**Benefits:**
- Provider abstraction allows migration to Anthropic, Gemini, or local models without changing business code
- Consistent cost tracking via LiteLLM
- No direct OpenAI dependency in TypeScript services

**Trade-offs:**
- API cost scales with token usage — requires monitoring from Day 1
- LiteLLM adds minor latency overhead (~10ms)

**Cost monitoring rule:** Every AI endpoint must log `tokens_used` and `model_used` per request. Alerts must fire if monthly AI spend exceeds budget thresholds.

**Reference:** `System_architecture.md` Section 12 (AI Services Architecture), `tooling-and-services-inventory.md` Section 5.3

---

## ADR-007 — Whisper (Primary ASR) + AssemblyAI (Fallback)

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

Call transcription is the critical revenue path. 90% of platform value flows through the transcription pipeline. The ASR solution must handle burst load, speaker diarization, and provide a reliable fallback.

### Options Considered

- **Option A — Whisper + AssemblyAI fallback (chosen):** Open-source primary with managed fallback. Cost-efficient at scale.
- **Option B — AssemblyAI only:** Fully managed, reliable, but expensive at high call volume.
- **Option C — Azure Speech Services:** Managed, but strong vendor lock-in and pricing complexity.
- **Option D — Deepgram:** Good quality but less established fallback story.

### Decision

**OpenAI Whisper** as the primary ASR, with **AssemblyAI** as the automatic fallback.

The Transcription Service (Python/FastAPI) handles:
1. Receive audio job from M-01 via BullMQ
2. Attempt transcription with Whisper
3. On failure → auto-switch to AssemblyAI
4. Write transcript to `m01_transcriptions`
5. Publish `call.transcription.completed` to BullMQ

### Consequences

**Benefits:**
- Whisper self-hosted option available if API costs grow
- AssemblyAI provides speaker diarization when Whisper quality is insufficient
- Fallback is automatic, not manual

**Trade-offs:**
- 8GB RAM required for Whisper model in production
- Fallback increases per-call cost by ~3x

**Critical rule:** `call.transcription.completed` must only be published AFTER the transcript is durably written to the database. The event is the guarantee of data availability for downstream modules.

**Reference:** `System_architecture.md` Section 3.7 (External AI and ML Services), Section 4.4 (Transcription Service)

---

## ADR-008 — Multi-Tenancy: Shared DB + Row Level Security

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

The platform must serve multiple tenants with strict data isolation. The multi-tenancy approach must balance operational simplicity (Phase 1) with compliance and security requirements.

### Options Considered

- **Option A — Shared DB + Row Level Security (chosen):** One DB, `tenant_id` on every row, RLS enforced at PostgreSQL layer.
- **Option B — Schema-per-tenant:** One PostgreSQL schema per tenant. Better isolation but harder to query across tenants for analytics.
- **Option C — DB-per-tenant:** Maximum isolation but operationally expensive to maintain at scale.

### Decision

**Shared PostgreSQL database with Row Level Security (RLS)** enforced at the database level.

Rules:
- Every table must have a `tenant_id UUID NOT NULL` column
- RLS policies enforce `tenant_id = current_setting('app.current_tenant_id')`
- Application layer sets tenant context before every query
- No cross-tenant queries permitted except by platform admin service
- All events must carry `tenant_id` in their envelope

### Consequences

**Benefits:**
- Simpler operations — one DB instance, one schema migration path
- RLS provides defense-in-depth even if application has bugs
- Easier analytics aggregation (Phase 2+ reporting)

**Trade-offs:**
- All queries must include `tenant_id` filter — missing filters can be caught by RLS but should be caught earlier in code review
- Noisy neighbor risk — one tenant's heavy query affects others

**Upgrade path:** If a large enterprise tenant requires DB-level isolation, extract their data to a dedicated DB instance using the `tenant_id` partitioning already in the schema.

**Reference:** `System_architecture.md` Section 11 (Authentication and Multi-Tenancy)

---

## ADR-009 — Data Cloud: 5 Warehouse Targets + Daily Idempotent Sync

- **Status:** ✅ Approved
- **Date:** April 2026
- **Owner:** Tech Lead
- **Review Date:** July 2026

### Context

Enterprise customers need to export platform data to their own data warehouses for BI, analytics, and compliance purposes.

### Options Considered

- **Option A — 5 warehouse targets via daily idempotent sync (chosen):** Snowflake, BigQuery, Redshift, Azure Synapse, Databricks.
- **Option B — Single warehouse only:** Simpler but limits enterprise customer adoption.
- **Option C — Real-time streaming via Kafka:** Complex, high operational cost at Phase 1 scale.

### Decision

**5 target warehouse connectors** with **daily idempotent sync** at 02:00 UTC:

| Warehouse | Priority |
|---|---|
| Snowflake | Phase 2 (P1) |
| BigQuery | Phase 2 (P2) |
| Redshift | Phase 3 |
| Azure Synapse | Phase 3 |
| Databricks | Phase 3 |

Sync is idempotent — rerunning the same day's sync produces the same result. Sync jobs are tracked with `sync_id` to prevent duplicate writes.

### Consequences

**Benefits:**
- Unblocks enterprise deals requiring BI integration
- Daily idempotent sync is operationally simple vs streaming

**Trade-offs:**
- Up to 24-hour data lag for warehouse consumers
- 5 connectors to maintain as warehouse APIs evolve

**Reference:** `System_architecture.md` Section 3.6 (External Systems), Section 8 (Database Architecture)

---

## How to Add a New ADR

Use the following template for each new ADR:

```
## ADR-XXX — Decision Title

- **Status:** Draft / Approved / Superseded
- **Date:** YYYY-MM-DD
- **Owner:** Name
- **Review Date:** YYYY-MM-DD

### Context
Describe the problem, requirement, or situation that requires a decision.

### Options Considered
- Option 1
- Option 2
- Option 3

### Decision
State the final decision clearly and directly.

### Consequences
Describe the expected benefits, trade-offs, risks, limitations, and future impact.

### Reference
Link to the relevant section(s) of System_architecture.md or other docs.
```

**Rules:**
- Every major technology choice must have an ADR before it enters the codebase
- No ADR in Draft status should be treated as final for production
- Superseded ADRs must NOT be deleted — mark as Superseded and reference the new ADR
- Tech Lead sign-off required for all Approved ADRs

---

*Document last updated: 2026-04-28. Extracted from System_architecture.md Sections 4.3–4.7.*
