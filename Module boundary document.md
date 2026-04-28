## 1. Document Info

- **Document Name:** Module Boundary Document
- **Document ID:** Doc #3
- **Product:** R-Revenue Intelligence
- **Organization:** Relanto.ai
- **Document Type:** Architecture Governance Document
- **Version:** 0.2
- **Status:** Draft
- **Owner:** Tech Lead
- **Contributors:** Backend Lead, Frontend Lead, AI Lead, QA Lead, Product Manager
- **Last Updated:** 2026-04-23
- **Next Review Date:** 2026-07-23
- **Review Cadence:** Every 3 months, or immediately after any major module boundary, dependency, or integration change
- **Primary Audience:** Backend Engineers, Frontend Engineers, AI/ML Engineers, QA Engineers, Product Managers, Tech Leads
- **Related Documents:** System Architecture Document (SAD), Technical Design Documents (TDDs), API Design Documents, Event Registry, Data Model Documents

## 1.1 Document History

| Version | Date | Author | Summary of Changes |
|---|---|---|---|
| 0.2 | 2026-04-23 | Tech Lead | Added governance updates, event registry, resolved open questions, RBAC baseline, and SLA targets |
| 0.1 | 2026-04-10 | Tech Lead | Initial draft - all 10 module boundaries defined |

## 2. Purpose

This document defines the architectural boundary of each module in the R-Revenue Intelligence platform.

Its purpose is to clearly specify what each module owns, what it is responsible for, what it may expose to other modules, what it may consume from other modules, and what it must never access directly.

This document exists to prevent tight coupling between modules, reduce ownership confusion, support cleaner engineering decisions, and preserve the modular architecture needed for phased rollout, future service extraction, and modular commercial packaging.

For engineering teams, this document acts as the source of truth for module ownership and cross-module interaction rules. For product and delivery teams, it provides clarity on which features belong to which module and where dependency risks exist.

## 3. Scope

This document covers the module-level architectural boundaries of the R-Revenue Intelligence platform.

Specifically, this document defines:

- Module responsibilities
- Business capability ownership by module
- Feature ownership by module
- Data ownership and schema ownership
- Public APIs exposed by each module
- Events published by each module
- Events consumed by each module
- Allowed module dependencies
- Forbidden module dependencies
- External integration ownership
- AI service dependency boundaries
- Operational ownership and failure boundaries
- Testing boundaries and boundary validation rules
- Canonical module naming and mapping references where needed

This document applies to all platform modules and must be used when designing new modules, adding new features, introducing cross-module communication, reviewing pull requests, or planning future module extraction.

## 4. Out of Scope

This document defines module boundaries and ownership rules at the platform architecture level. It does not describe the internal implementation details of any single feature.

This document does **not** cover:

- Internal business logic or algorithms for individual features
- Prompt engineering details, model prompts, or prompt tuning workflows
- Screen-level UI design, user journeys, wireframes, or visual interaction behavior
- Full API payload specifications, field-by-field request and response contracts, or Swagger-level endpoint definitions
- Detailed database schema definitions, table-by-table column specifications, migrations, or index design
- Detailed event payload schemas beyond boundary-level ownership and usage references
- Sprint planning, estimates, delivery sequencing, or task breakdowns
- Test cases, test data sets, or QA execution checklists for individual features
- Vendor-specific implementation details unless they affect module ownership or boundary rules

The correct destination for these details is:

- **Feature-specific logic:** Technical Design Documents (TDDs)
- **API contract details:** API Design Documents
- **UI and interaction details:** Product Design Specifications / Figma
- **Database implementation details:** Data Model or Schema Documents
- **Testing details:** QA Test Plans
- **Sprint and execution planning:** Jira backlog, sprint plans, or delivery trackers

**Rule:** If a topic is about how a single feature works internally, it belongs in that feature’s TDD, not in this document. If a topic affects ownership, dependency rules, cross-module interaction, or architectural boundaries, it belongs here.

## 5. How to Use This Document

This document should be used as the primary reference before making any design or implementation decision that affects module ownership or module-to-module interaction.

Use this document before:

- Writing a new Technical Design Document (TDD)
- Creating a new module API or changing an existing public module API
- Adding a new event or changing the ownership of an existing event
- Reading or writing data that may belong to another module
- Introducing a new dependency between two modules
- Assigning feature ownership to a module
- Reviewing a pull request that introduces cross-module behavior
- Planning module extraction, module split, or module merge decisions

When using this document, follow these rules:

- Check the module definition first before writing code
- Confirm whether the feature belongs to an existing module before creating a new one
- Verify whether the required interaction should happen through an event, a public API, or not at all
- Check data ownership before reading from or writing to any table or storage owned by another module
- Use this document during PR review to identify boundary violations early
- Update related TDDs, API docs, or event registry entries if a boundary decision changes

**Rule:** If a proposed change affects module ownership, published or consumed events, public APIs, schema ownership, or cross-module communication, this document must be updated first or in the same pull request as the implementation change.

**Reviewer rule:** A pull request that introduces a new cross-module dependency, new shared ownership, or undocumented boundary exception is not ready for approval until this document is updated accordingly.


## 6. Module Boundary Principles

The following principles govern all module boundary decisions in the R-Revenue Intelligence platform. These are not optional preferences. They are architecture rules and must be followed in design, implementation, and review.

- Every module owns a clearly defined business capability.
- Every module owns its own schema, public APIs, and published event contracts.
- A module may write only to its own schema and must never write directly to another module’s schema.
- A module must not directly query another module’s private tables or private schema objects.
- A module must not call another module’s internal service methods or import another module’s internal code.
- Cross-module communication must happen only through approved public APIs or published events.
- Event contracts are owned by the publishing module. Consumers must adapt to contract evolution through approved versioning or compatibility rules.
- If a required event or API does not exist, engineers must raise the need for review instead of creating an undocumented direct dependency.
- AI/ML inference belongs to the Python AI Services layer and must not be embedded inside TypeScript product services.
- Business logic remains inside product modules. AI services may return structured outputs, but they must not perform product business actions or direct database writes.
- Every module must remain understandable as an independent ownership unit even while running inside the modular monolith.
- Every module should be designed so that it can be extracted later with minimal boundary redesign when extraction triggers are met.
- Every module must enforce tenant-level Row Level Security (RLS) on all reads and writes. No module may read or write data across tenant boundaries under any circumstance.

**Developer rule:** If implementing a feature requires direct module import, direct cross-schema access, or hidden synchronous coupling, the boundary design is wrong and must be refactored.

## 7. Canonical Module List

The platform currently has naming differences between the product module breakdown and the System Architecture Document. To avoid confusion, this document uses the following canonical module list as the default reference for all new TDDs, PRs, and module boundary discussions.

| Module ID | Canonical Name | Business Name | Lifecycle Stage | Status |
|---|---|---|---|---|
| M-01 | Capture and Transcription | Capture / Transcription | Capture | Draft |
| M-02 | Sales Engagement | Sales Engagement | Capture / Execute | Draft |
| M-03 | Revenue Graph | Data / Compliance Foundation | Model | Draft |
| M-04 | Conversation Intelligence | Conversation Intelligence | Understand | Draft |
| M-05 | Smart Tracking and Search | Tracking / Search / Deal Drivers | Understand | Draft |
| M-06 | AI Summaries and GenAI | AI Summaries / GenAI | Analyze | Draft |
| M-07 | Deal and Account Management | Deal Intelligence / Account Intelligence | Execute | Draft |
| M-08 | Execution and Automation | Orchestrate / Workflow Automation | Execute | Draft |
| M-09 | Forecasting and Prediction | Forecasting | Predict | Draft |
| M-10 | Coaching and Training | Dashboards / Coaching / Training | Optimize | Draft |

### 7.1 Naming Notes

- `M-01 Capture and Transcription` corresponds to the current SAD module `M-01 Data Ingestion`.
- `M-03 Revenue Graph` remains the correct architectural name and should continue to be used as-is.
- `M-06 AI Summaries and GenAI` corresponds to the current SAD module `M-06 Insight Generation`.
- `M-09 Forecasting and Prediction` corresponds to the current SAD module `M-09 Forecasting`.
- `M-10 Coaching and Training` corresponds to the current SAD module `M-10 Performance and Coaching`.

### 7.2 Boundary Reconciliation Notes

The following mapping conflicts remain open and are tracked with explicit ownership and target resolution dates:

| Conflict ID | Modules Affected | Description | Owner | Target Resolution Date |
|---|---|---|---|---|
| BC-001 | M-02, M-08 | Sales Engagement vs Execution and Automation boundary overlap for orchestration-heavy engagement flows | Tech Lead | 2026-05-15 |
| BC-002 | M-05 | Tracking vs search vs deal-driver reporting ownership overlap | Backend Lead | 2026-05-22 |
| BC-003 | M-07 | Deal Intelligence vs Account Intelligence split and potential extraction boundaries | Tech Lead | 2026-05-29 |

**Rule:** Until an ADR formally resolves any open boundary conflict, this canonical list must be used for reference, and any module-specific TDD must explicitly state which canonical module it belongs to.

## 8. Cross-Module Communication Rules

Cross-module communication must be explicit, documented, and reviewable. No module may depend on another module through hidden coupling.

### 8.1 Allowed

The following cross-module communication patterns are allowed:

- Event publish and subscribe through the approved event bus
- Calls to approved public module APIs
- Reads from shared platform core utilities that are explicitly approved for all modules
- Calls from TypeScript product modules to Python AI services through approved internal APIs or queues
- Approved read-only access patterns only where explicitly documented by architecture governance

### 8.2 Not Allowed

The following patterns are not allowed:

- Direct cross-module database writes
- Direct reads from another module’s private schema or private tables
- Importing internal code, services, repositories, or helpers from another module
- Hidden synchronous dependencies that are not documented in this document
- Creating a direct dependency because an event or public API does not yet exist
- Embedding AI provider SDK calls directly inside product modules instead of using the AI services layer

### 8.3 Exceptions

Calls to another module's documented **public API** are allowed and do not require exception approval. Exceptions are required only for synchronous coupling that bypasses a module's public API layer (for example: direct internal service imports, private queue access, or private repository access).

Approved synchronous bypass exceptions must be rare, explicitly justified, and documented here before implementation.

| Exception ID | From Module | To Module | Interface Type | Justification | Approval Status |
|---|---|---|---|---|---|
| None | N/A | N/A | N/A | No approved public-API-bypassing synchronous exceptions at this time | Active Rule |

**Rule:** Other than approved bypass exceptions listed in this section, inter-module communication must use events or documented public APIs only.

**Reviewer rule:** A pull request that introduces a new synchronous dependency, undocumented exception, or hidden module coupling must be rejected until the boundary is documented and approved.

### 8.4 Event Contract Versioning Rules

- Event schemas must be backward-compatible by default (additive changes only).
- Breaking changes require a new event version suffix (for example: `call.transcription.completed.v2`).
- The publishing module must support old and new versions for at least one release cycle before retiring the old version.
- Consumers must not rely on undocumented or optional payload fields as stable contract guarantees.

### 8.5 Automated Boundary Enforcement

- The CI pipeline must include module import boundary checks to prevent direct cross-module internal imports.
- Approved tooling includes Nx boundary lint rules, ESLint import restrictions, or an equivalent enforcement mechanism.
- Any cross-module import that bypasses an approved public API adapter is a lint failure.
- Boundary lint failures must block merge.


## 9. Shared Platform Core

Platform Core is the shared technical foundation used by all modules. It is **not** a sellable product module, does not represent a standalone business capability, and must not be treated as a feature ownership bucket.

Platform Core exists to provide common cross-cutting capabilities that every module depends on, so that these concerns do not get re-implemented separately inside each module.

It includes:

- Authentication and identity enforcement
- API Gateway and common request handling
- Event Bus and async communication infrastructure
- CI/CD and engineering quality gates
- Shared observability foundations
- Shared security foundations
- Tenant isolation and platform-wide request context enforcement
- Common health check, logging, validation, and error-handling infrastructure

### 9.1 What Platform Core Includes

The following capabilities belong to Platform Core:

- **Auth:** User authentication, JWT verification, RBAC enforcement, tenant context injection, and session-related platform controls
- **API Gateway:** Common API entry patterns, routing, guards, middleware, validation, rate limiting, and shared request handling concerns
- **Event Bus:** Shared BullMQ and Redis-based event infrastructure used for inter-module async publish/subscribe communication
- **CI/CD:** Shared build pipelines, type checks, test gates, schema validation, boundary checks, deployment workflows, and release quality controls
- **Observability:** Shared logging, metrics, uptime monitoring, tracing foundations, exception capture, and health endpoints
- **Security Foundations:** Shared secrets handling, edge protection, WAF, webhook protection, audit-oriented enforcement, and baseline platform security controls

### 9.2 What Platform Core Does Not Own

Platform Core does **not** own:

- Product-facing business features
- Domain-specific workflows
- Customer-facing module functionality
- Revenue lifecycle business capabilities
- Module-specific schemas or business tables
- Module-specific APIs beyond common platform infrastructure behavior
- Module-specific event contracts

**Rule:** If a capability exists only to support all modules technically, it belongs to Platform Core. If it represents a customer-visible business capability, workflow, or domain responsibility, it belongs to a product module.

### 9.3 Platform Core Ownership Boundary

Platform Core may provide reusable infrastructure and guardrails, but it must not become a dumping ground for business logic.

Allowed responsibilities of Platform Core include:

- Shared auth and authorization enforcement
- Shared event transport infrastructure
- Shared logging, monitoring, and alerting setup
- Shared validation and exception-handling infrastructure
- Shared CI/CD enforcement and architecture quality checks
- Shared tenant isolation enforcement
- Shared security controls used by all modules

Not allowed inside Platform Core:

- Deal logic
- Forecast logic
- Conversation analysis logic
- Summary generation logic
- CRM-specific business workflows
- Module-specific orchestration that belongs to a business module

### 9.4 Implementation Notes

Platform Core supports all modules but does not replace module ownership. Each module remains responsible for its own business behavior even when it uses shared platform services.

Examples of platform-level implementations currently associated with Platform Core include shared auth enforcement, tenant-aware request handling, BullMQ-based event infrastructure, GitHub Actions quality gates, and shared observability and security tooling such as Sentry, Grafana, Better Stack, Cloudflare, and Doppler.

**Developer rule:** Do not place code in Platform Core just because multiple modules need it. Put code in Platform Core only if it is truly cross-cutting infrastructure and contains no business ownership ambiguity.

### 9.5 Platform Core Ownership

- **Owner:** Tech Lead (primary) and Backend Lead (secondary)
- **Operational SLA:** Platform Core shared services (auth, API gateway, event transport, and tenant-context middleware) target 99.9% monthly availability
- **Review cadence:** Any Platform Core change that can alter module boundaries must be reviewed by all module leads before merge


## 10. Module Boundary Definitions

### 10.0 Cross-Module Governance Baselines

The following baseline controls apply to all module definitions unless a module-specific ADR or TDD explicitly overrides them.

#### Baseline SLA and Freshness Targets

| Module | Target Operational Expectation |
|---|---|
| M-01 Capture and Transcription | P95 transcript completion <= 15 minutes from ingestion; ingestion pipeline availability >= 99.9% |
| M-02 Sales Engagement | User-triggered action APIs P95 <= 2 seconds; engagement task/event processing P95 <= 5 minutes |
| M-03 Revenue Graph | Context-linking event lag P95 <= 5 minutes; context lookup API P95 <= 500 ms |
| M-04 Conversation Intelligence | Call review and tagging completion P95 <= 20 minutes after context-ready event |
| M-05 Smart Tracking and Search | Index freshness lag P95 <= 10 minutes; search API P95 <= 1 second |
| M-06 AI Summaries and GenAI | Async summary generation P95 <= 10 minutes; synchronous answer endpoint P95 <= 3 seconds (excluding deep research jobs) |
| M-07 Deal and Account Management | Board read API P95 <= 1 second; managed-state update propagation P95 <= 3 minutes |
| M-08 Execution and Automation | Workflow trigger-to-action latency P95 <= 5 minutes; duplicate suppression accuracy >= 99% |
| M-09 Forecasting and Prediction | Forecast snapshot generation P95 <= 30 minutes; forecast-board read API P95 <= 1.5 seconds |
| M-10 Coaching and Training | Dashboard snapshot freshness <= 60 minutes; coaching insight generation P95 <= 15 minutes |

#### Baseline Access Control (RBAC) Matrix

| Module | Minimum Access Control Rules |
|---|---|
| M-01 | Connector/admin actions require `tenant_admin` or `integration_admin`; transcript reads require workspace membership and tenant scope |
| M-02 | Outreach/task authoring requires `rep` or above; sending policy changes require `manager` or `enablement_admin` |
| M-03 | Context graph writes require service principals or `integration_admin`; read APIs require tenant-scoped authenticated users |
| M-04 | Review override and reprocessing endpoints require `qa_lead` or `manager`; standard reads require `rep` or above |
| M-05 | Tracker configuration requires `manager` or `ops_admin`; search/read access requires workspace membership |
| M-06 | Summary generation and Q&A read/write requires `rep` or above; prompt/config policy changes require `ai_admin` |
| M-07 | Deal/account board updates require `rep` or `manager`; risk policy and board schema changes require `manager` or `ops_admin` |
| M-08 | Workflow creation/activation requires `manager` or `ops_admin`; manual trigger execution requires `rep` or above |
| M-09 | Forecast submission APIs require `rep` or `manager`; period locking and forecast override actions require `manager` or `forecast_admin` |
| M-10 | Dashboard/coaching read requires `rep` or above; team coaching policy and trainer template management require `manager` or `enablement_admin` |

### 10.1 M-01 Capture and Transcription

#### Purpose

M-01 Capture and Transcription is the entry-point module for revenue interaction ingestion. Its purpose is to capture customer interaction data from connected systems, convert raw conversation inputs into structured transcript outputs, and produce the first reliable machine-usable records that downstream modules depend on.

This module is the foundation of the platform lifecycle. If M-01 does not capture and normalize interaction data correctly, downstream modules cannot generate context, signals, summaries, forecasting inputs, or coaching outputs.

#### Business Capabilities Owned

M-01 owns the business capability of interaction capture and transcription.

This includes:

- Capturing inbound interaction data from approved source systems
- Managing call ingestion workflows
- Storing raw and normalized transcript records
- Producing speaker-labeled transcript outputs
- Extracting structured CRM-relevant fields from conversation content
- Managing ingestion status, retry state, and transcript completion state
- Owning the first machine-readable representation of customer conversations

#### Features Owned

M-01 owns the following product features:

- Call Transcription
- Native Connectors
- AI Data Extractor

Feature notes:

- **Call Transcription:** Converts audio or recorded conversation input into speaker-labeled transcript text
- **Native Connectors:** Connects conferencing, telephony, CRM, email, and related systems required for approved ingestion flows
- **AI Data Extractor:** Extracts structured business fields from conversation content for downstream use

#### Data Owned

M-01 owns all data required to ingest, process, and store captured interaction records before they are linked into downstream business context.

This includes ownership of data such as:

- Raw call or meeting ingestion records
- Recording metadata
- Source-system ingestion metadata
- Transcript records
- Speaker-labeled transcript segments
- Language detection results
- Transcript confidence scores
- Extraction job state
- Extracted CRM field payloads before downstream consumption
- Connector sync metadata related to capture flows
- Capture pipeline retry and failure state

Schema rule:

- M-01 owns schema objects and tables under the `m01` boundary
- Other modules must not directly read or write M-01 private tables
- Access to M-01-owned data must happen through published events or approved public APIs

#### Public APIs

M-01 exposes only those APIs required for interaction ingestion, capture status inspection, connector control, and approved operational workflows.

Current public API boundary:

- `GET /api/v1/ingestion/health` — module health and readiness status
- `POST /api/v1/ingestion/webhooks/:provider` — approved inbound ingestion entry point for external providers
- `GET /api/v1/ingestion/calls/:id` — retrieve capture status for an owned call record
- `GET /api/v1/ingestion/transcripts/:id` — retrieve transcript details where access is approved
- `POST /api/v1/ingestion/connectors/:provider/sync` — trigger approved connector sync or ingestion refresh workflows
- `POST /api/v1/ingestion/transcripts/:id/reprocess` — approved reprocessing entry point for operational recovery

API boundary rules:

- These APIs expose M-01-owned resources only
- These APIs must not expose internal pipeline implementation details
- Downstream business modules must not bypass events by querying M-01 storage directly

#### Published Events

M-01 publishes events when capture or transcript outputs become available for downstream modules.

Primary published events:

- `call.transcription.completed`
- `crm.fields.extracted`

Published event ownership rules:

- Event contracts are owned by M-01
- Consumers must treat event payloads as publisher-owned contracts
- Events must be idempotent and safe for retry delivery

Key event notes:

- `call.transcription.completed` is the foundational downstream trigger for M-03 and also supports M-02, M-04, M-05, and M-06 processing chains
- `crm.fields.extracted` provides structured field extraction outputs for downstream context building in M-03

#### Consumed Events

M-01 is primarily an upstream producer module and does not depend on business events from other product modules for its core capture workflow.

Consumed event boundary:

- None required for core capture and transcription responsibility

Operational note:

- M-01 may consume platform-level infrastructure triggers, queue jobs, or retry signals, but these are not treated as business events owned by another product module

#### Allowed Dependencies

M-01 may depend on the following:

- Platform Core for auth, event bus, tenant context, logging, validation, and security controls
- Approved external conferencing, telephony, email, and CRM provider integrations for ingestion and metadata capture
- Supabase Storage or equivalent approved object storage for recording storage
- BullMQ and Redis for async processing orchestration
- Python Transcription Service for ASR and speaker diarization
- Python AI Services only for approved extraction-related inference workflows
- Shared observability and security infrastructure

Allowed dependency rule:

- M-01 may depend on shared infrastructure and approved external systems
- M-01 must not create undocumented business coupling to downstream product modules

#### Forbidden Dependencies

M-01 must not depend on:

- Private schemas or private tables of M-02 through M-10
- Internal services, repositories, or helpers of other product modules
- Downstream business logic from Revenue Graph, Intelligence, Forecasting, Coaching, or Deal modules
- Direct embedding of AI/ML model logic inside TypeScript services
- Any hidden synchronous dependency on downstream modules for successful ingestion completion

Developer rule:

- M-01 must complete its owned workflow without requiring direct code-level access to another product module

#### External Integrations Owned

M-01 owns the external integrations required to capture interaction data and related source metadata.

This includes approved ownership of integrations such as:

- Zoom
- Google Meet
- Microsoft Teams
- Dialers and telephony systems
- Recording ingestion sources
- CRM systems where needed for capture-side enrichment
- Email and calendar sources where interaction capture belongs to ingestion scope

Ownership rule:

- If the integration exists primarily to bring raw interaction data into the platform, it belongs to M-01 unless explicitly reassigned by architecture decision

#### AI Service Dependencies

M-01 depends on Python-based AI and transcription services for machine processing steps, but it does not own AI inference implementation.

Primary AI dependencies:

- Transcription Service for ASR
- Diarization capability for speaker separation
- Vocabulary correction support for business-specific terminology normalization
- Extraction-oriented AI services for structured CRM field extraction

Boundary rule:

- M-01 owns the orchestration and product behavior
- Python services own the model execution
- TypeScript services must not embed model SDK logic directly

#### Operational Ownership

M-01 is operationally owned as the critical ingestion and transcription module for capture-stage workflows.

Operational ownership includes:

- Ingestion reliability
- Connector availability for capture flows
- Recording fetch success rate
- Transcript completion latency
- Retry handling
- Dead-letter recovery for failed ingestion jobs
- Monitoring of transcription pipeline health
- Signature verification and webhook security for inbound providers

This module requires strong alerting because a failure here blocks most downstream platform value.

#### Failure Boundary

The failure boundary of M-01 ends at successful capture, transcript persistence, and event publication.

If M-01 fails:

- The call or interaction record may remain in a failed or pending capture state
- No downstream module should proceed without the required published event
- Partial downstream business records must not be created from incomplete capture state
- Failures must be recoverable through retry, reprocessing, or operator action where appropriate

Important rule:

- If `call.transcription.completed` is never published, downstream modules must remain unaffected except for missing downstream outputs

#### Testing Boundary

M-01 testing must validate its owned workflows independently of downstream module implementation.

Testing scope includes:

- Webhook authentication and provider signature validation
- Connector ingestion flows
- Recording fetch and storage behavior
- Queue dispatch and retry handling
- Transcript persistence and status transitions
- Event publication correctness
- Idempotency for duplicate provider callbacks or repeated events
- Tenant isolation and RLS-safe writes
- Failure recovery and dead-letter handling

Testing must not require direct validation of downstream module business logic to prove M-01 correctness.

#### Commercial Packaging Notes

M-01 has standalone commercial value and is the first sellable platform capability.

Packaging notes:

- M-01 can be sold as a standalone transcription and capture offering
- It is the earliest deployable module in the phased rollout
- It provides direct customer value even before deeper analytics modules are active
- It is the minimum foundation for later conversation intelligence and revenue intelligence packaging

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Connector ownership remains in M-01 for raw-ingestion integrations; shared utilities may exist in Platform Core only as non-business adapters. | Tech Lead | 2026-05-15 | Resolved |
| 2 | Email and calendar ingestion remains in M-01 for current roadmap phases; M-02 consumes resulting events/APIs. | Product Manager | 2026-05-08 | Resolved |
| 3 | Transcript retrieval stays public for tenant-scoped read use cases; operational/debug retrieval remains internal. | Backend Lead | 2026-05-08 | Resolved |
| 4 | `crm.fields.extracted` remains active and may evolve to `crm.fields.extracted.v2` only for breaking schema changes. | AI Lead | 2026-05-22 | Resolved |
| 5 | Transcript turnaround SLA is set to P95 <= 15 minutes and P99 <= 30 minutes, tracked by provider and tenant tier. | QA Lead | 2026-05-15 | Resolved |



### 10.2 M-02 Sales Engagement

#### Purpose

M-02 Sales Engagement owns seller-facing execution workflows related to outreach, task prioritization, and guided follow-up actions. Its purpose is to help reps take the next best action after customer interactions by generating emails, organizing to-dos, and supporting repeatable engagement flows.

This module sits close to day-to-day rep execution. It turns captured interaction context and revenue context into actionable outreach artifacts instead of deeper analytical outputs.

#### Business Capabilities Owned

M-02 owns the business capability of sales engagement and rep execution support.

This includes:

- AI-assisted email drafting
- Rep to-do generation and prioritization
- Outbound email sending and scheduling
- Email template and personalization workflows
- Email flow enrollment and sequence execution
- Rep task management tied to sales activity
- Activity logging for engagement actions owned by this module

#### Features Owned

M-02 owns the following product features:

- Email Composer
- Engage To-Do List

Depending on final packaging decisions, M-02 may also own the seller-side execution portion of:

- Automated email sequences
- Template-based outreach flows
- Scheduled follow-up actions

Feature notes:

- **Email Composer:** Generates and sends AI-personalized emails using call context and CRM context
- **Engage To-Do List:** Centralizes and prioritizes rep tasks across outreach and follow-up workflows
- **Flow-based outreach behavior:** Belongs to M-02 only where the workflow is primarily rep engagement and not broader cross-module orchestration

#### Data Owned

M-02 owns all data required to create, manage, send, and track outbound engagement actions initiated by reps or engagement workflows.

This includes ownership of data such as:

- Email drafts
- Sent email records
- Email templates
- Email personalization metadata
- Email scheduling records
- Email flow definitions
- Flow enrollments
- Rep task records
- Task priority state
- Task completion state
- Email engagement tracking metadata such as opens, clicks, and reply status where supported
- Module-owned activity logs related to engagement execution

Schema rule:

- M-02 owns schema objects and tables under the `m02` boundary
- Other modules must not directly read or write M-02 private tables
- If other modules need M-02 data, they must use published events or approved public APIs

#### Public APIs

M-02 exposes public APIs for engagement workflows that are owned by the module.

Current public API boundary includes endpoints such as:

- `GET /api/v1/sales-engagement/health` — module health and readiness status
- `POST /api/v1/sales-engagement/email/drafts` — generate or save an email draft
- `GET /api/v1/sales-engagement/email/drafts/:id` — retrieve a draft owned by M-02
- `POST /api/v1/sales-engagement/email/send` — send an approved outbound email
- `POST /api/v1/sales-engagement/email/schedule` — schedule outbound email delivery
- `GET /api/v1/sales-engagement/tasks` — retrieve rep to-do items
- `POST /api/v1/sales-engagement/tasks` — create a task owned by the engagement module
- `PATCH /api/v1/sales-engagement/tasks/:id` — update task status or priority
- `POST /api/v1/sales-engagement/flows/:id/enroll` — enroll a contact or deal into an engagement flow

API boundary rules:

- These APIs expose engagement resources owned by M-02 only
- M-02 APIs must not directly expose private data owned by M-03 or any downstream module
- M-02 may enrich outputs using approved upstream context, but ownership of the enriched data remains clearly separated

#### Published Events

M-02 publishes events when outbound engagement actions complete or change state in a way that other modules may need.

Primary published events:

- `email.sent`
- `task.created`
- `task.completed`
- `engagement.flow.enrolled`
- `engagement.flow.step.completed`

Published event ownership rules:

- Event contracts are owned by M-02
- Consumers must not assume private implementation details behind these events
- Events must be idempotent and safe for retry delivery

Key event notes:

- `email.sent` is already identified as a cross-module event consumed by M-03 and M-07, and may also support signal detection workflows in M-05
- Task and flow events should exist only if other modules need them; otherwise they remain module-internal events

#### Consumed Events

M-02 is not a pure upstream foundation module. It consumes selected upstream context and may react to interaction-derived triggers.

Consumed business events may include:

- `call.transcription.completed` where seller follow-up tasks or draft suggestions are triggered from newly completed calls
- `crm.fields.extracted` where extracted fields help enrich rep workflows if approved
- Additional approved upstream events as needed for task generation and engagement timing

Synchronous exception:

- M-02 is allowed to call the **public API** of M-03 Revenue Graph for real-time CRM and revenue context lookup required for email personalization

Boundary note:

- This M-02 to M-03 synchronous call is a documented exception and must not expand into direct internal service access or direct schema reads

#### Allowed Dependencies

M-02 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-03 Revenue Graph **public API only** for real-time deal, account, and contact context lookup during email personalization
- Approved email provider integrations such as Gmail or Outlook
- Approved calendar and activity sources if required for seller workflow enrichment
- Python AI Services for email generation, language adaptation, and structured draft assistance
- BullMQ and Redis for background workflows, retries, scheduled sends, and flow execution
- Shared observability and security infrastructure

Allowed dependency rule:

- M-02 may use M-03 through documented public API access
- M-02 must not create direct hidden code or schema coupling to M-03 or any other module

#### Forbidden Dependencies

M-02 must not depend on:

- Private schemas or private tables of M-03 through M-10
- Internal services, repositories, or helper functions from another module
- Direct database reads from Revenue Graph for personalization
- Downstream modules such as M-07, M-08, M-09, or M-10 for basic engagement workflow completion
- AI model SDKs embedded directly inside TypeScript business services
- Any undocumented synchronous dependency beyond the approved M-03 public API exception

Developer rule:

- If M-02 needs new context from another module, it must request a public API or event contract instead of creating direct coupling

#### External Integrations Owned

M-02 owns the external integrations required to execute outbound engagement workflows.

This includes approved ownership of integrations such as:

- Gmail
- Outlook / Microsoft 365 email
- Email delivery and tracking mechanisms associated with seller outreach
- Calendar-linked follow-up behavior where it is part of rep execution support
- Optional template and sequence provider integrations if approved later

Ownership rule:

- If the integration primarily supports outbound seller engagement execution, it belongs to M-02 unless explicitly moved by architecture decision

#### AI Service Dependencies

M-02 depends on Python-based AI services for content generation and assistance, but it does not own inference implementation.

Primary AI dependencies may include:

- Email draft generation
- Personalization assistance
- Multi-language email generation
- Subject line suggestion
- Tone adaptation
- Follow-up content generation from call or CRM context

Boundary rule:

- M-02 owns the business workflow, approval flow, and sending logic
- Python AI services own model inference and content generation
- AI-generated output must return as structured data and must not directly perform product actions

#### Operational Ownership

M-02 is operationally owned as the seller engagement execution module.

Operational ownership includes:

- Email draft generation success rate
- Email send reliability
- Scheduled send execution
- Task creation and completion reliability
- Flow execution reliability
- Provider API retry handling
- Rate-limit handling for email providers
- Monitoring of delivery failures, queue backlogs, and engagement workflow health

This module is operationally important because it directly affects rep productivity and customer-facing outreach quality.

#### Failure Boundary

The failure boundary of M-02 ends at successful creation, sending, scheduling, or state update of engagement artifacts owned by the module.

If M-02 fails:

- Drafts may not be generated
- Scheduled emails may remain pending or fail
- Tasks may not be created or updated
- Flow progression may pause or retry
- Downstream modules must not assume an email or task exists unless the corresponding M-02 event has been published successfully

Important rule:

- A failure in M-02 must not corrupt M-03, M-07, or any downstream module state
- If `email.sent` is not published, downstream modules must treat the email as not completed

#### Testing Boundary

M-02 testing must validate its owned workflows independently while mocking approved external dependencies and approved M-03 public API access.

Testing scope includes:

- Email draft generation workflow
- Personalization input assembly
- M-03 public API integration behavior for allowed context lookup
- Send and schedule workflows
- Task generation and prioritization logic
- Flow enrollment and step progression logic
- Event publication correctness
- Idempotency for repeated send callbacks or retries
- Tenant isolation and RLS-safe writes
- Provider failure handling and retry behavior

Testing must not require direct access to M-03 private data structures to prove M-02 correctness.

#### Commercial Packaging Notes

M-02 has strong user-facing value but has a dependency on M-03 for full real-time personalization quality.

Packaging notes:

- M-02 can be positioned as a seller execution and engagement module
- Full value is unlocked when M-03 Revenue Graph is available for personalization context
- In phased rollout terms, M-02 should not be commercially promised beyond what its deployed dependency chain can support
- M-02 remains a logical standalone module even if early deployment depends on upstream context availability

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Orchestration-heavy multi-step automations belong in M-08; rep-facing engagement execution remains in M-02. | Tech Lead | 2026-05-15 | Resolved |
| 2 | Task generation supports both event-driven and user-initiated triggers, with user intent taking precedence. | Product Manager | 2026-05-08 | Resolved |
| 3 | `task.created` and `task.completed` remain internal until another module requires them, then ADR promotion is required. | Backend Lead | 2026-05-22 | Resolved |
| 4 | Email analytics ownership remains in M-02; M-03 stores normalized activity projections from `email.sent`. | Tech Lead | 2026-05-15 | Resolved |
| 5 | Calendar-linked follow-up actions remain in M-02; no separate execution split is approved in this version. | Product Manager | 2026-05-22 | Resolved |

### 10.3 M-03 Revenue Graph

#### Purpose

M-03 Revenue Graph owns the platform’s connected revenue data layer. Its purpose is to transform captured raw interaction records into structured business context by linking conversations, emails, meetings, and activities to the correct accounts, contacts, deals, and teams.

M-03 is the model-stage foundation of the platform. It is the module that turns captured signals into usable revenue context for all downstream intelligence, search, summary, execution, forecasting, and optimization modules.

#### Business Capabilities Owned

M-03 owns the business capability of revenue data modeling and entity linkage.

This includes:

- Automated data capture into the revenue model
- Contextual mapping of interactions to revenue entities
- Entity resolution across accounts, contacts, deals, and activities
- Relationship graph construction for revenue context
- CRM-linked context normalization
- AI context preparation for downstream modules
- Data export to client-owned warehouses through Data Cloud
- Ownership of canonical linked interaction context used across the platform

#### Features Owned

M-03 owns the following product features:

- Revenue Graph
- Automated Data Capture Engine
- Contextual Data Mapping
- AI Context Layer
- Data Cloud

Feature notes:

- **Revenue Graph:** Connects all captured interactions to the correct accounts, deals, and contacts
- **Automated Data Capture Engine:** Collects and normalizes revenue-related signals across channels
- **Contextual Data Mapping:** Maps interactions to business entities and relationship context
- **AI Context Layer:** Prepares structured context needed by downstream AI-driven modules
- **Data Cloud:** Exports platform data to customer-owned data warehouses for analytics and governance use

#### Data Owned

M-03 owns the linked and normalized business context data layer for the platform.

This includes ownership of data such as:

- Linked interaction records
- Revenue entity relationships
- Accounts master records under Revenue Graph ownership
- Contacts master records under Revenue Graph ownership
- Revenue activities and activity timelines
- Context mapping outputs
- CRM sync state for linked revenue entities
- Entity resolution records
- Relationship edges between calls, contacts, accounts, deals, and teams
- Export job state and warehouse sync metadata for Data Cloud
- AI context records used to enrich downstream modules

Schema rule:

- M-03 owns schema objects and tables under the `m03` boundary
- Other modules must not directly read or write M-03 private tables
- M-03 data must be accessed through approved public APIs, published events, or explicitly documented exceptions

#### Public APIs

M-03 exposes public APIs because it is the central context provider for multiple downstream modules.

Current public API boundary includes endpoints such as:

- `GET /api/v1/revenue-graph/health` — module health and readiness status
- `GET /api/v1/revenue-graph/deals/:id` — deal context lookup
- `GET /api/v1/revenue-graph/accounts/:id` — account context lookup
- `GET /api/v1/revenue-graph/contacts/:id` — contact context lookup
- `GET /api/v1/revenue-graph/interactions/:id` — linked interaction context lookup
- `POST /api/v1/revenue-graph/link` — approved internal linking or relinking trigger
- `POST /api/v1/revenue-graph/export/:target/sync` — approved Data Cloud export trigger
- `GET /api/v1/revenue-graph/export/jobs/:id` — export job status

API boundary rules:

- M-03 APIs expose linked revenue context, not private implementation internals
- M-03 is the approved context source for downstream modules that need deal, account, contact, or interaction context
- A module needing M-03 data must call the API instead of querying M-03 tables directly

#### Published Events

M-03 publishes events when revenue linkage and context construction are complete or materially changed.

Primary published events:

- `revenuegraph.entity.linked`
- `revenuegraph.context.updated`
- `datacloud.export.completed`

Published event ownership rules:

- Event contracts are owned by M-03
- Consumers must tolerate schema evolution using approved contract practices
- Events must be idempotent and safe for replay and retries

Key event notes:

- `revenuegraph.entity.linked` is the critical downstream trigger for M-04 and M-05
- Data Cloud export events are owned by M-03 because customer-export capability belongs to the Revenue Graph boundary

#### Consumed Events

M-03 consumes upstream events and selected business events needed to maintain the connected revenue model.

Primary consumed events include:

- `call.transcription.completed`
- `crm.fields.extracted`
- `email.sent`

Consumed event notes:

- `call.transcription.completed` is the core upstream trigger from M-01 for building linked interaction context
- `email.sent` allows outbound engagement activity to be reflected in the connected revenue timeline
- Additional CRM-sync or ingestion events may be consumed where needed to maintain canonical revenue context

#### Allowed Dependencies

M-03 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-01 published events for transcript and extraction outputs
- M-02 published events for outbound engagement activity updates
- Approved CRM integrations such as Salesforce, HubSpot, and Microsoft Dynamics 365
- Approved warehouse targets for Data Cloud export such as Snowflake, BigQuery, Databricks, S3, and Redshift
- Python AI Services for entity resolution and context enrichment
- BullMQ and Redis for async linking, sync, and export workflows
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-03 may consume upstream events and expose downstream context
- M-03 must not create direct internal coupling to downstream intelligence, forecasting, or coaching modules

#### Forbidden Dependencies

M-03 must not depend on:

- Private schemas or private tables of M-04 through M-10
- Internal services or repositories of downstream product modules
- Downstream modules for completion of its own core context-linking responsibilities
- AI model logic embedded directly inside TypeScript business services
- Hidden direct reads into M-07 or other downstream schemas
- Any undocumented cross-schema write into another module’s storage

Developer rule:

- M-03 is the source of linked revenue context and must not rely on downstream modules to define its canonical data model

#### External Integrations Owned

M-03 owns the external integrations required to model and sync revenue context beyond raw capture.

This includes approved ownership of integrations such as:

- Salesforce
- HubSpot
- Microsoft Dynamics 365
- Customer-owned data warehouses for Data Cloud export
- Approved warehouse delivery targets such as Snowflake, BigQuery, Databricks, Amazon S3, and Amazon Redshift

Ownership rule:

- If an integration exists primarily to model, sync, or export structured revenue context, it belongs to M-03 unless explicitly reassigned

#### AI Service Dependencies

M-03 depends on Python-based AI services for context enrichment, but does not own inference implementation.

Primary AI dependencies may include:

- Entity resolution
- Relationship inference
- Context enrichment
- Structured mapping assistance
- Resolution confidence scoring

Boundary rule:

- M-03 owns the business decision of what becomes canonical revenue context
- Python AI services return structured outputs only
- Business actions, persistence decisions, and schema ownership remain inside M-03

#### Operational Ownership

M-03 is operationally owned as the platform’s core context and linkage module.

Operational ownership includes:

- Entity-linking success rate
- CRM sync reliability
- Revenue context freshness
- Data Cloud export reliability
- Event publication correctness
- Retry handling for failed linking and sync jobs
- Monitoring of relationship-building latency and export backlog
- Validation of tenant-safe data mapping and sync behavior

This module is operationally critical because downstream modules lose meaningful context if M-03 is degraded.

#### Failure Boundary

The failure boundary of M-03 ends at successful linkage, persistence of canonical context, and publication of owned events.

If M-03 fails:

- Interactions may remain unlinked
- Downstream modules may lack deal, account, or contact context
- Data Cloud exports may be delayed or incomplete
- Downstream intelligence modules must not infer linked context unless M-03 has successfully published the relevant event or served the context via public API

Important rule:

- If `revenuegraph.entity.linked` is not published, M-04 and M-05 must treat the interaction as not yet modeled

#### Testing Boundary

M-03 testing must validate its owned workflows independently while mocking upstream event producers and external CRM or warehouse integrations.

Testing scope includes:

- Event consumption from M-01 and M-02
- Entity resolution and linkage workflows
- API correctness for context lookup
- CRM sync behavior and retry handling
- Data Cloud export orchestration
- Event publication correctness
- Idempotency for repeated upstream events
- Tenant isolation and RLS-safe writes
- Linkage accuracy for account, contact, and deal association
- Failure recovery for partial sync or export failures

Testing must not require direct downstream module execution to prove M-03 correctness.

#### Commercial Packaging Notes

M-03 has high strategic value because it unlocks context-aware intelligence across the rest of the platform.

Packaging notes:

- M-03 is the required foundation for basic conversation intelligence beyond simple transcription
- It is planned as an early extraction priority because it is highly shared and load-critical
- Commercially, M-03 enables the jump from standalone capture to structured revenue intelligence
- Customers should not be promised downstream modules that rely on M-03 unless its event and API outputs are live in production

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Long-term synchronous lookups are limited to low-latency reads; heavy joins move to event-driven materialized projections. | Tech Lead | 2026-05-15 | Resolved |
| 2 | CRM sync ownership remains in M-03; connector transport mechanics may be extracted later, but context normalization stays in M-03. | Backend Lead | 2026-05-22 | Resolved |
| 3 | Data Cloud export schemas in the approved external contract namespace are canonical external contracts. | Product Manager | 2026-05-29 | Resolved |
| 4 | `revenuegraph.context.updated` is adopted as a versioned event family beginning with v1 governance. | Backend Lead | 2026-05-22 | Resolved |
| 5 | Read-performance exceptions are allowed only via documented public API projections; direct cross-schema reads remain prohibited. | Tech Lead | 2026-05-15 | Resolved |

---

### 10.4 M-04 Conversation Intelligence

#### Purpose

M-04 Conversation Intelligence owns the first layer of content understanding over linked interactions. Its purpose is to analyze conversations after M-03 has attached the required business context, then produce structured interpretation outputs such as scores, topics, themes, corrected transcripts, and translated content.

M-04 is the understand-stage module. It answers questions such as what happened in the conversation, what topics were discussed, how the call performed, and how raw transcript text should be cleaned or translated for downstream use.

#### Business Capabilities Owned

M-04 owns the business capability of structured conversation analysis.

This includes:

- AI-assisted call review
- Topic tagging
- Theme discovery across call sets
- Business-term transcript correction
- Translation of transcripts and related outputs
- Scorecard-based conversation evaluation
- Production of structured understanding outputs for downstream signal and summary modules

#### Features Owned

M-04 owns the following product features:

- AI Call Reviewer
- AI Theme Spotter
- AI Topic Tagger
- AI Transcriber
- AI Translator

Feature notes:

- **AI Call Reviewer:** Evaluates calls using scorecards and AI-generated insights
- **AI Theme Spotter:** Identifies recurring themes and trends across many conversations
- **AI Topic Tagger:** Applies structured topics to conversations
- **AI Transcriber:** Corrects business-specific terminology, acronyms, and named entities in transcripts
- **AI Translator:** Translates transcripts and AI-generated outputs into user or workspace language

#### Data Owned

M-04 owns all structured outputs created by conversation-level understanding workflows.

This includes ownership of data such as:

- Scorecards
- Call review results
- Review explanations and scoring metadata
- Topic model definitions
- Topic tags
- Theme definitions
- Theme analysis jobs
- Transcript correction outputs
- Translation outputs
- Confidence scores for conversation analysis results
- Review flags requiring human review
- Analysis job states and processing metadata

Schema rule:

- M-04 owns schema objects and tables under the `m04` boundary
- Other modules must not directly read or write M-04 private tables
- Access to M-04 data must happen through published events or approved public APIs

#### Public APIs

M-04 exposes public APIs for owned conversation analysis resources.

Current public API boundary includes endpoints such as:

- `GET /api/v1/conversation-intelligence/health` — module health and readiness status
- `GET /api/v1/conversation-intelligence/reviews/:callId` — call review results lookup
- `GET /api/v1/conversation-intelligence/topics/:callId` — topic tag lookup
- `GET /api/v1/conversation-intelligence/themes/:analysisId` — theme analysis result lookup
- `POST /api/v1/conversation-intelligence/reviews/reprocess/:callId` — approved re-analysis trigger
- `POST /api/v1/conversation-intelligence/transcripts/:callId/correct` — approved transcript correction trigger
- `POST /api/v1/conversation-intelligence/transcripts/:callId/translate` — approved translation trigger

API boundary rules:

- M-04 APIs expose conversation understanding outputs owned by this module
- M-04 must not expose private data owned by M-03 except through already-resolved references or enriched responses that preserve ownership boundaries
- Downstream modules must not bypass M-04 by directly querying its analysis tables

#### Published Events

M-04 publishes events when conversation analysis outputs become available for downstream modules.

Primary published events:

- `call.review.scored`
- `topics.tagged`
- `themes.detected`
- `transcript.corrected`
- `translation.completed`

Published event ownership rules:

- Event contracts are owned by M-04
- Consumers must not rely on M-04 internal implementation details
- Events must be idempotent and safe for retry delivery

Key event notes:

- `call.review.scored` is already identified as an upstream event for M-05
- Topic, theme, correction, and translation events may be consumed by M-05 or M-06 depending on final processing design

#### Consumed Events

M-04 consumes modeled context and linked interactions from upstream modules.

Primary consumed events include:

- `revenuegraph.entity.linked`

Consumed event notes:

- M-04 should begin analysis only after M-03 has provided linked business context
- Additional approved upstream events may be consumed for re-analysis or context refresh, but M-03 remains the primary upstream dependency

#### Allowed Dependencies

M-04 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-03 published events for linked interaction context
- M-03 public APIs for approved context lookup when needed
- Python AI Services for scoring, topic modeling, theme detection, transcript correction, and translation
- BullMQ and Redis for background analysis jobs and retries
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-04 may depend on M-03 context but must not create hidden direct coupling to M-03 tables or internal services
- M-04 must remain focused on understanding content, not on owning canonical revenue context

#### Forbidden Dependencies

M-04 must not depend on:

- Private schemas or private tables of M-03 or any other module
- Internal services or repositories from M-03, M-05, M-06, or downstream modules
- Direct business logic from summary, forecasting, deal management, or coaching modules
- AI model SDKs embedded directly inside TypeScript services
- Any hidden cross-module write into another module’s schema

Developer rule:

- M-04 may analyze conversations, but it must not redefine entity ownership or canonical revenue context owned by M-03

#### External Integrations Owned

M-04 generally does not own many customer-facing external integrations in the same way M-01 or M-03 do.

Its owned external-facing dependencies are primarily limited to:

- Approved AI processing services used for conversation analysis
- Optional language and NLP support services if explicitly approved later

Ownership rule:

- If an external dependency exists mainly to run understanding-stage AI analysis, it may be operationally attached to M-04 through the AI services layer, but customer-facing integration ownership remains elsewhere unless explicitly reassigned

#### AI Service Dependencies

M-04 depends heavily on Python AI services for its core behavior.

Primary AI dependencies may include:

- Call scoring
- Topic tagging
- Theme detection
- Terminology correction
- Translation
- Confidence scoring and review flagging

Boundary rule:

- M-04 owns analysis orchestration, persistence, review flow, and business rules around output usage
- Python AI services own inference execution only
- AI services must return structured outputs without direct DB writes or business actions

#### Operational Ownership

M-04 is operationally owned as the conversation understanding module.

Operational ownership includes:

- Analysis job throughput
- Call scoring latency
- Topic and theme generation success rate
- Transcript correction quality workflow
- Translation job reliability
- Retry handling for failed AI analysis jobs
- Monitoring of analysis queue health, low-confidence outputs, and flagged-for-review rates

This module is operationally important because many later signals and summaries depend on its structured understanding outputs.

#### Failure Boundary

The failure boundary of M-04 ends at successful creation and publication of owned conversation analysis outputs.

If M-04 fails:

- Calls may remain unscored
- Topics and themes may be missing
- Corrected transcript versions may not be available
- Translation outputs may be delayed or absent
- M-05 and later modules must not assume conversation intelligence exists unless the corresponding M-04 event or API output exists

Important rule:

- A failure in M-04 must not corrupt M-03 context ownership or upstream captured transcript state

#### Testing Boundary

M-04 testing must validate its owned workflows independently while mocking M-03 context and AI-service dependencies.

Testing scope includes:

- Consumption of `revenuegraph.entity.linked`
- Scorecard evaluation workflow
- Topic tagging persistence and retrieval
- Theme analysis orchestration
- Transcript correction workflow
- Translation workflow
- Event publication correctness
- Idempotency for repeated upstream events
- Tenant isolation and RLS-safe writes
- Flagging behavior for low-confidence AI outputs
- Retry and failure recovery behavior

Testing must not require execution of downstream smart tracking, summaries, or deal management modules to prove M-04 correctness.

#### Commercial Packaging Notes

M-04 adds strong visible intelligence value, but it depends on M-03 context to function correctly.

Packaging notes:

- M-04 is part of the conversation understanding layer and is not meaningful without linked revenue context from M-03
- It can be packaged as part of a conversation intelligence offering once the M-01 to M-03 chain is active
- Commercial claims for M-04 features should only be made when upstream M-03 events are flowing with production data
- M-04 remains logically standalone even if operational deployment currently depends on upstream modules

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Corrected transcripts remain an M-04 derived artifact; canonical raw transcript ownership remains in M-01. | Tech Lead | 2026-05-15 | Resolved |
| 2 | Topic and theme outputs remain event-driven for downstream processing and API-readable for interactive retrieval. | Backend Lead | 2026-05-08 | Resolved |
| 3 | Translation outputs generated by M-04 remain M-04-owned; downstream translated derivatives are owned by their generating module. | AI Lead | 2026-05-22 | Resolved |
| 4 | Manual review overrides are represented as M-04-owned override records with actor metadata. | QA Lead | 2026-05-15 | Resolved |
| 5 | Cleanup split is fixed as baseline normalization in M-01 and semantic/business-term correction in M-04. | Tech Lead | 2026-05-29 | Resolved |

### 10.5 M-05 Smart Tracking and Search

#### Purpose

M-05 Smart Tracking and Search owns intent-based signal detection, searchable conversation discovery, and rep-level surfacing of deal-risk drivers. Its purpose is to help users find the right conversations, detect important business signals automatically, and understand which signals matter most across deals and rep activity.

M-05 is still part of the understand stage, but it sits one level above basic conversation interpretation. It turns analyzed content into searchable, actionable detections and retrieval-ready records.

#### Business Capabilities Owned

M-05 owns the business capability of signal detection and searchable conversation access.

This includes:

- AI Smart Tracker configuration and execution
- Intent-based detection across conversations and emails
- Searchable conversation archive and retrieval
- Full-text and semantic search over conversation content
- Deal driver aggregation and rep-level signal surfacing
- Detection enrichment using linked deal and account context
- Search index synchronization for owned searchable resources

#### Features Owned

M-05 owns the following product features:

- AI Smart Tracker
- Searchable Conversation Library
- View Deal Drivers

Feature notes:

- **AI Smart Tracker:** Detects business concepts such as competitor mentions, pricing objections, and next-step commitments using intent-based AI rather than keyword-only rules
- **Searchable Conversation Library:** Provides a searchable, filterable archive of calls, emails, and related interaction content
- **View Deal Drivers:** Surfaces the most prevalent risk signals and drivers across active deals and reps

#### Data Owned

M-05 owns all structured signal-detection and retrieval-layer data produced by tracking and search workflows.

This includes ownership of data such as:

- Tracker definitions
- Tracker detection records
- Detection snippets and evidence references
- Detection confidence scores
- Detection timestamps and enrichment metadata
- Search index synchronization logs
- Conversation search projections owned by M-05
- Deal driver snapshots
- Rep-level detection aggregates
- Search query session metadata where owned by the module
- Search ranking metadata and retrieval audit state where applicable

Schema rule:

- M-05 owns schema objects and tables under the `m05` boundary
- Other modules must not directly read or write M-05 private tables
- Access to M-05 data must happen through published events or approved public APIs

#### Public APIs

M-05 exposes public APIs for tracker management, conversation search, and deal-driver retrieval.

Current public API boundary includes endpoints such as:

- `GET /api/v1/smart-tracking/health` — module health and readiness status
- `GET /api/v1/smart-tracking/trackers` — list trackers for the tenant
- `POST /api/v1/smart-tracking/trackers` — create a tracker
- `GET /api/v1/smart-tracking/trackers/:id/detections` — list detections for a tracker
- `GET /api/v1/smart-tracking/conversations/search` — full-text and semantic search across conversation library
- `GET /api/v1/smart-tracking/conversations` — paginated conversation library with filters
- `GET /api/v1/smart-tracking/deal-drivers` — top risk signals and detection patterns for current user or scope

API boundary rules:

- M-05 APIs expose owned search and detection outputs only
- M-05 may enrich results using upstream references, but ownership of canonical deal, account, and contact context remains outside M-05
- Downstream modules must not query M-05 private search tables directly

#### Published Events

M-05 publishes events when tracker detections and related search-derived business signals become available.

Primary published events:

- `tracker.detection.created`
- `dealdrivers.snapshot.generated`
- `conversation.index.updated`

Published event ownership rules:

- Event contracts are owned by M-05
- Consumers must handle retries and duplicate delivery safely
- Event schemas must evolve through approved compatibility rules

Key event notes:

- `tracker.detection.created` is already identified as a downstream trigger for M-06 and M-08
- Detection-created events are the main signal handoff between the understand layer and later synthesis or execution workflows

#### Consumed Events

M-05 consumes upstream context and conversation-understanding outputs needed to run trackers and maintain searchable views.

Primary consumed events include:

- `revenuegraph.entity.linked`
- `call.review.scored`
- `topics.tagged`
- `themes.detected`
- `email.sent`

Consumed event notes:

- `revenuegraph.entity.linked` provides the deal, account, and contact context needed for enrichment
- `call.review.scored`, topic, and theme outputs improve filtering, indexing, and signal interpretation
- `email.sent` allows tracker detection to run on outbound email content where applicable

#### Allowed Dependencies

M-05 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-03 public APIs and published events for revenue context enrichment
- M-04 published events for conversation intelligence outputs
- M-02 published events for outbound email content detection
- Python AI Services for intent detection and embeddings
- Meilisearch for full-text search
- pgvector or approved vector retrieval support for semantic search
- BullMQ and Redis for async detection and indexing workflows
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-05 may enrich signals using upstream context and understanding outputs
- M-05 must not take ownership of canonical revenue entities or synthesis outputs owned by later modules

#### Forbidden Dependencies

M-05 must not depend on:

- Private schemas or private tables of M-03, M-04, M-06, or any other module
- Internal services or repositories of other product modules
- Direct writes into M-06 summaries, M-07 deal states, or M-08 automation state
- AI model SDKs embedded directly inside TypeScript services
- Any hidden synchronous dependency on downstream modules
- Any attempt to redefine deal health ownership, which belongs downstream

Developer rule:

- M-05 detects and surfaces signals, but it does not own final summaries, deal decisions, or execution actions

#### External Integrations Owned

M-05 does not primarily own customer-facing external SaaS integrations in the same way as capture or CRM modules.

Its owned external-facing technical dependencies are primarily:

- Search infrastructure used to power the conversation library
- Approved AI-service endpoints required for detection and embedding generation

Ownership rule:

- If an external dependency exists mainly to support owned retrieval and signal-detection workflows, it may be operationally attached to M-05, but source-system ownership remains with upstream modules

#### AI Service Dependencies

M-05 depends heavily on Python AI services for signal detection and retrieval support.

Primary AI dependencies may include:

- Intent detection
- Tracker matching
- Embedding generation
- Detection confidence scoring
- Search query embedding for semantic retrieval

Boundary rule:

- M-05 owns tracker lifecycle, detection persistence, search orchestration, and deal-driver surfacing
- Python AI services own inference and embedding execution only
- AI services must not directly write to module tables or perform downstream business actions

#### Operational Ownership

M-05 is operationally owned as the platform’s signal-detection and searchable conversation module.

Operational ownership includes:

- Tracker detection throughput
- Detection accuracy workflow monitoring
- Search latency and search freshness
- Index synchronization reliability
- Embedding generation reliability
- Queue backlog and retry behavior
- Monitoring of low-confidence detections and retrieval degradation
- Search service availability and fallback behavior

This module is operationally important because it powers both user discovery workflows and downstream AI synthesis triggers.

#### Failure Boundary

The failure boundary of M-05 ends at successful creation of detection/search outputs and publication of owned events.

If M-05 fails:

- Tracker detections may be missing or delayed
- Conversation library search may return incomplete or stale results
- Deal-driver views may be outdated
- Downstream modules such as M-06 and M-08 must not assume signals exist unless corresponding M-05 outputs or events are available

Important rule:

- A failure in M-05 must not alter canonical conversation context owned by M-03 or raw analysis outputs owned by M-04

#### Testing Boundary

M-05 testing must validate its owned workflows independently while mocking upstream context, AI services, and search infrastructure as needed.

Testing scope includes:

- Consumption of upstream events from M-03, M-04, and M-02
- Tracker creation and publication workflow
- Detection persistence and enrichment
- Search indexing and search result retrieval
- Hybrid full-text plus semantic search behavior
- Deal-driver snapshot generation
- Event publication correctness
- Idempotency for repeated upstream events
- Tenant isolation and RLS-safe writes
- Retry and failure recovery for indexing and detection jobs

Testing must not require execution of M-06 summary generation or M-08 automation workflows to prove M-05 correctness.

#### Commercial Packaging Notes

M-05 adds visible intelligence and strong standalone value because users can search conversations and detect business signals directly.

Packaging notes:

- M-05 is a major step from basic conversation intelligence to actionable revenue intelligence
- It is planned as an early extraction priority because of search and embedding workload patterns
- Commercially, it supports a strong “full conversation intelligence” package when combined with the M-01 to M-03 chain
- It must not be sold as fully active unless upstream modeling and conversation intelligence data are flowing in production

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Searchable indexes and retrieval models remain fully owned by M-05; shared read models are allowed only via M-05 public APIs. | Tech Lead | 2026-05-22 | Resolved |
| 2 | `dealdrivers.snapshot.generated` remains a first-class event because downstream modules require async consumption. | Backend Lead | 2026-05-08 | Resolved |
| 3 | Email signal detection ownership remains in M-05; M-02 and M-08 consume outputs for action workflows. | Product Manager | 2026-05-15 | Resolved |
| 4 | Semantic-degraded fallback is lexical search plus recent-signal filters with visible degraded-mode indicators. | QA Lead | 2026-05-22 | Resolved |
| 5 | Low-confidence detections are published with confidence metadata but hidden from default UX below threshold. | AI Lead | 2026-05-29 | Resolved |

---

### 10.6 M-06 AI Summaries and GenAI

#### Purpose

M-06 AI Summaries and GenAI owns the synthesis layer that converts conversation signals, linked context, and retrieval results into human-readable AI-generated outputs. Its purpose is to generate summaries, briefs, research reports, and natural-language answers that help users quickly understand what matters without reading every call, email, or activity record themselves.

M-06 is the analyze-stage module. It does not detect raw signals or own canonical context. Instead, it synthesizes upstream outputs into useful decision-ready artifacts.

#### Business Capabilities Owned

M-06 owns the business capability of AI-generated synthesis and question answering.

This includes:

- AI-generated call summaries
- Deal briefs
- Account briefs
- Deep research report generation
- Natural-language question answering
- Retrieval-augmented generation workflows
- Session-based GenAI interaction history for Ask Anything
- Structured summary regeneration and versioning workflows

#### Features Owned

M-06 owns the following product features:

- AI Smart Summaries
- AI Deep Researcher
- Ask Anything GenAI Query

Feature notes:

- **AI Smart Summaries:** Generates structured call summaries and multi-source deal and account briefs
- **AI Deep Researcher:** Produces deeper analytical reports across multiple conversations and signals
- **Ask Anything GenAI Query:** Answers natural-language questions using retrieval over calls, deals, accounts, and related context

#### Data Owned

M-06 owns all AI-generated synthesis artifacts and related interaction history created by this module.

This includes ownership of data such as:

- Call summaries
- Deal briefs
- Account briefs
- Research reports
- Query sessions
- Query message history
- Summary evidence references
- Summary confidence scores
- Flagged-for-review metadata
- Version history for regenerated outputs
- Research job status and result state
- Ask Anything source references and answer metadata

Schema rule:

- M-06 owns schema objects and tables under the `m06` boundary
- Other modules must not directly read or write M-06 private tables
- Access to M-06 outputs must happen through published events or approved public APIs

#### Public APIs

M-06 exposes public APIs for summary retrieval, research jobs, and conversational GenAI access.

Current public API boundary includes endpoints such as:

- `GET /api/v1/insights/health` — module health and readiness status
- `GET /api/v1/insights/calls/:id/summary` — AI-generated call summary
- `GET /api/v1/insights/deals/:id/brief` — AI-generated deal brief
- `GET /api/v1/insights/accounts/:id/brief` — AI-generated account brief
- `POST /api/v1/insights/research` — create AI Deep Researcher job
- `GET /api/v1/insights/research/:id` — fetch research job status or result
- `POST /api/v1/insights/ask` — submit Ask Anything query
- `GET /api/v1/insights/ask/sessions/:id` — fetch Ask Anything session history

API boundary rules:

- M-06 APIs expose only synthesis outputs owned by this module
- M-06 may reference upstream evidence, but ownership of canonical upstream records stays with the source module
- Downstream modules must not read M-06 tables directly to obtain briefs or summaries

#### Published Events

M-06 publishes events when AI-generated synthesis outputs become available or are refreshed.

Primary published events:

- `insight.summary.ready`
- `call.summary.generated`
- `deal.brief.generated`
- `account.brief.generated`
- `research.report.completed`

Published event ownership rules:

- Event contracts are owned by M-06
- Consumers must tolerate retries, replay, and output version changes through approved compatibility rules
- Events must not expose private upstream table structure

Key event notes:

- The SAD identifies M-06 summary-ready outputs as upstream inputs for M-07 and M-08
- `call.summary.generated` may also be consumed by M-03 for activity enrichment or cross-module reference tracking

#### Consumed Events

M-06 consumes upstream signals and context needed to synthesize useful outputs.

Primary consumed events include:

- `tracker.detection.created`
- `topics.tagged`
- `themes.detected`
- `call.review.scored`
- `revenuegraph.context.updated`

Consumed event notes:

- `tracker.detection.created` is the main cross-module event identified as feeding M-06
- M-06 may also fetch approved upstream context through public APIs from M-03 and M-05 during synthesis workflows
- Ask Anything and Deep Researcher may combine event-driven inputs with API-based retrieval

#### Allowed Dependencies

M-06 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-05 published events and public APIs for tracker detections and search results
- M-03 public APIs for deal, account, contact, and interaction context
- M-04 published events or public APIs for topics, themes, and review outputs
- Python AI Services for summarization, research generation, RAG answer generation, and embedding/query support
- pgvector or approved vector retrieval support for Ask Anything
- BullMQ and Redis for async generation, regeneration, and research workflows
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-06 may synthesize across multiple upstream modules
- M-06 must not own source-of-truth context or signal detection responsibilities that belong upstream

#### Forbidden Dependencies

M-06 must not depend on:

- Private schemas or private tables of M-03, M-04, M-05, or downstream modules
- Internal services or repositories of other product modules
- Direct writes into M-07 deal-state tables or M-08 automation tables
- AI model SDKs embedded directly inside TypeScript services
- Hidden direct coupling to downstream UI-serving modules
- Any attempt to redefine canonical deal, account, or detection ownership

Developer rule:

- M-06 generates synthesized outputs, but it must not become a hidden business-logic owner for deal workflow or automation decisions

#### External Integrations Owned

M-06 generally does not own customer-facing business integrations like CRM or email providers.

Its owned external-facing technical dependencies are primarily:

- Approved AI-service endpoints for summarization and GenAI
- Approved retrieval infrastructure for RAG
- Optional model-provider abstractions managed through the AI services layer

Ownership rule:

- If an external dependency exists mainly to generate or retrieve AI synthesis outputs, it may be operationally attached to M-06 through the AI layer, but customer-system ownership remains elsewhere

#### AI Service Dependencies

M-06 depends heavily on Python AI services for nearly all core module behavior.

Primary AI dependencies may include:

- Summarization
- Brief generation
- Research report synthesis
- RAG answer generation
- Citation/source packaging
- Query embedding support
- Confidence scoring and review flagging

Boundary rule:

- M-06 owns prompt-orchestration decisions at the product workflow level, persistence, session behavior, and output lifecycle
- Python AI services own inference execution only
- AI services must return structured JSON outputs and must not directly write business records or trigger downstream product actions

#### Operational Ownership

M-06 is operationally owned as the synthesis and GenAI output module.

Operational ownership includes:

- Summary generation latency
- Brief freshness
- Research job completion rate
- Ask Anything query latency
- Confidence score and flagged-review monitoring
- Retry handling for failed AI jobs
- Session persistence reliability
- Retrieval quality monitoring for RAG-backed answers

This module is operationally important because it produces some of the most visible AI outputs in the product.

#### Failure Boundary

The failure boundary of M-06 ends at successful persistence and publication of owned synthesis outputs.

If M-06 fails:

- Summaries and briefs may be missing or stale
- Research jobs may remain queued or failed
- Ask Anything responses may not be generated
- Downstream modules such as M-07 and M-08 must not assume a summary or brief exists unless the corresponding M-06 output or event exists

Important rule:

- A failure in M-06 must not corrupt upstream context, tracker detections, or conversation analysis outputs
- If `insight.summary.ready` is not published, downstream modules must treat the synthesis output as unavailable

#### Testing Boundary

M-06 testing must validate its owned workflows independently while mocking upstream APIs, upstream events, and AI-service dependencies.

Testing scope includes:

- Consumption of `tracker.detection.created` and other approved upstream events
- Call summary generation workflow
- Deal brief and account brief generation
- Research job orchestration
- Ask Anything session and response workflow
- Retrieval assembly for RAG-based answers
- Event publication correctness
- Idempotency for repeated upstream triggers
- Tenant isolation and RLS-safe writes
- Low-confidence output flagging and review workflow
- Retry and failure recovery for generation jobs

Testing must not require execution of M-07 deal boards or M-08 automation flows to prove M-06 correctness.

#### Commercial Packaging Notes

M-06 has strong user-facing value because it makes upstream intelligence easy to consume quickly.

Packaging notes:

- M-06 is a key differentiator for GenAI-assisted revenue intelligence
- It depends on upstream context and detection quality, especially from M-03 and M-05
- Commercially, it is meaningful only when upstream modules are already producing high-quality linked context and signal outputs
- It remains logically standalone even if operational rollout depends on prior lifecycle stages

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | `insight.summary.ready` remains the canonical downstream trigger; summary variants are typed payload categories in one family. | Tech Lead | 2026-05-15 | Resolved |
| 2 | Source citations are stored as compact references (source IDs and offsets) and expanded at read time. | Backend Lead | 2026-05-22 | Resolved |
| 3 | Regeneration is event-driven: upstream material changes enqueue refresh with version increment and supersession markers. | AI Lead | 2026-05-15 | Resolved |
| 4 | Quick summaries may be synchronous on request; deep research and board-level briefs remain asynchronous jobs. | Product Manager | 2026-05-08 | Resolved |
| 5 | Summary-quality feedback remains M-06-owned quality telemetry and is exposed as read-only aggregates downstream. | QA Lead | 2026-05-29 | Resolved |

### 10.7 M-07 Deal and Account Management

#### Purpose

M-07 Deal and Account Management owns the operational workspace where revenue teams review deal health, account health, timelines, risks, and AI-supported context in one place. Its purpose is to convert upstream insights into execution-ready boards that help reps and managers manage pipeline and accounts with clarity.

M-07 is the first major execute-stage module. It does not generate the underlying signals or summaries, but it turns them into managed business state that teams can act on.

#### Business Capabilities Owned

M-07 owns the business capability of deal and account workspace management.

This includes:

- Deals Board management
- Account Board management
- Deal health scoring and categorization
- Risk flag lifecycle management for deals
- Engagement score computation for accounts
- Board configuration and personalization
- Pipeline and account timeline surfacing
- Operational visibility into deal and account state

#### Features Owned

M-07 owns the following product features:

- Deals Boards
- Account Boards

It also owns the board-facing operational layer for:

- Deal health scores
- AI risk warnings on deals
- Account engagement visibility
- AI-enriched activity timelines within boards

Feature notes:

- **Deals Boards:** Combines CRM pipeline data, AI warnings, activity timelines, and deal health into a unified pipeline workspace
- **Account Boards:** Combines CRM data, engagement activity, and AI account context into an account-centric workspace

#### Data Owned

M-07 owns the operational board state and managed execution-state data for deals and accounts.

This includes ownership of data such as:

- Deals board configurations
- Account board configurations
- Deal health score records
- Deal risk flags
- Historical deal health score snapshots
- Account engagement scores
- Renewal or expansion signals attached to accounts where owned by the board layer
- User-specific board preferences
- Board filter and column settings
- Board-level materialized views used to serve deal and account workspaces
- AI-enriched workspace state derived from upstream inputs

Schema rule:

- M-07 owns schema objects and tables under the `m07` boundary
- Other modules must not directly read or write M-07 private tables
- Access to M-07-owned board state must happen through approved public APIs or published events

#### Public APIs

M-07 exposes public APIs for board retrieval, board configuration, and health-state access.

Current public API boundary includes endpoints such as:

- `GET /api/v1/deal-management/health` — module health and readiness status
- `GET /api/v1/deal-management/boards/deals` — Deals Board data
- `GET /api/v1/deal-management/boards/deals/:dealId` — deal board detail view
- `GET /api/v1/deal-management/boards/accounts` — Account Board data
- `GET /api/v1/deal-management/boards/accounts/:accountId` — account board detail view
- `PATCH /api/v1/deal-management/boards/deals/config` — update Deals Board configuration
- `PATCH /api/v1/deal-management/boards/accounts/config` — update Account Board configuration
- `GET /api/v1/deal-management/deals/:dealId/health` — retrieve current deal health state
- `GET /api/v1/deal-management/accounts/:accountId/engagement` — retrieve current account engagement state

API boundary rules:

- M-07 APIs expose board and workspace state owned by this module
- M-07 may compose upstream context into board responses, but canonical data ownership remains with the source modules
- Other modules must not access M-07 state by querying M-07 tables directly

#### Published Events

M-07 publishes events when managed deal or account state changes in a way that other modules must react to.

Primary published events:

- `deal.stage.changed`
- `deal.health.updated`
- `account.engagement.updated`

Published event ownership rules:

- Event contracts are owned by M-07 for board-managed state transitions and health outputs
- Consumers must treat these as state-change notifications, not invitations to read M-07 internals directly
- Events must be idempotent and safe for retry delivery

Key event notes:

- The platform event chain identifies `deal.stage.changed` as a downstream event consumed by M-08 and M-09
- `deal.health.updated` and `account.engagement.updated` can support forecasting, automation, and coaching later if formally adopted

#### Consumed Events

M-07 consumes upstream insights, summaries, and activity signals to maintain board state and recompute deal or account health.

Primary consumed events include:

- `tracker.detection.created`
- `call.summary.generated`
- `email.sent`
- `insight.summary.ready`

Consumed event notes:

- `tracker.detection.created` feeds new risk flags and signal-driven health updates
- `call.summary.generated` and other M-06 summary outputs add risks, next steps, and contextual brief content
- `email.sent` updates board activity timelines and engagement visibility

#### Allowed Dependencies

M-07 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-03 public APIs for canonical accounts, contacts, deals, and activities
- M-05 published events for tracker detections
- M-06 published events and public APIs for summaries and briefs
- M-02 published events for outbound engagement activity
- Python AI Services for risk scoring, engagement scoring, or brief-assist calculations where applicable
- BullMQ and Redis for async recomputation workflows
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-07 may compose upstream outputs into board state
- M-07 must not take ownership of raw transcript analysis, tracker detection, or summary generation logic owned upstream

#### Forbidden Dependencies

M-07 must not depend on:

- Private schemas or private tables of M-03, M-05, M-06, M-08, or any other module
- Internal services or repositories from other modules
- Direct writes into M-08 automation state or M-09 forecasting state
- AI model SDKs embedded directly inside TypeScript services
- Hidden direct schema reads across module boundaries except for any explicitly approved named exception
- Any attempt to redefine CRM source-of-truth ownership

Developer rule:

- M-07 owns managed workspace state and health computation, not raw context ownership and not automation execution

#### External Integrations Owned

M-07 generally does not own the upstream CRM sync itself, but it may expose board behavior tied to CRM state and optionally push selected updates through approved APIs.

Its primary external-facing integration posture is limited to:

- Approved CRM-facing update operations if explicitly assigned
- Board-facing read access through M-03 context APIs rather than direct CRM integration ownership

Ownership rule:

- CRM integration ownership for sync remains upstream unless a specific writeback responsibility is explicitly assigned to M-07

#### AI Service Dependencies

M-07 depends on Python AI services only for owned scoring or contextual assist behaviors, not for canonical data creation.

Primary AI dependencies may include:

- Deal risk scoring
- Account engagement scoring
- Workspace brief assist
- Signal aggregation support

Boundary rule:

- M-07 owns the business rules that determine how board state changes
- Python AI services may provide scoring inputs, but they do not own final board state transitions
- AI services must return structured outputs only

#### Operational Ownership

M-07 is operationally owned as the deal and account workspace module.

Operational ownership includes:

- Deals Board response latency
- Account Board response latency
- Health score recomputation reliability
- Risk flag creation and resolution workflow
- Board configuration persistence
- Timeline freshness
- Retry handling for failed recomputation jobs
- Monitoring of stale health states and workspace-read performance

This module is operationally critical because it is where revenue teams directly inspect deal and account state.

#### Failure Boundary

The failure boundary of M-07 ends at successful persistence and serving of owned board state and published managed-state events.

If M-07 fails:

- Board views may be stale or unavailable
- Health scores may not refresh
- Risk flags may remain outdated
- Downstream modules must not assume stage changes or health updates occurred unless the corresponding M-07 event was published successfully

Important rule:

- A failure in M-07 must not corrupt upstream source data owned by M-03, M-05, or M-06
- Board failures should degrade visibility, not alter canonical linked context or summary ownership

#### Testing Boundary

M-07 testing must validate its owned workflows independently while mocking upstream APIs and event producers.

Testing scope includes:

- Consumption of tracker, summary, and activity events
- Deal health score computation
- Risk flag creation, resolution, and deduplication
- Board query performance and response correctness
- Board configuration persistence
- Account engagement computation
- Event publication correctness for owned state changes
- Idempotency for repeated upstream events
- Tenant isolation and RLS-safe writes
- Retry and failure recovery for board recomputation workflows

Testing must not require execution of M-08 automation or M-09 forecasting flows to prove M-07 correctness.

#### Commercial Packaging Notes

M-07 has strong user-facing value because it is where pipeline and account execution becomes visible and actionable.

Packaging notes:

- M-07 is planned as a later extraction priority because it depends on strong upstream intelligence
- It supports a high-value pipeline risk intelligence package when upstream modules are already live
- M-07 should not be sold independently unless M-03, M-05, and M-06 outputs are already flowing reliably in production
- It remains a logical standalone module even if early deployment depends on earlier lifecycle stages

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Account engagement scoring remains in M-07 for current scope; extraction requires ADR and roadmap trigger. | Tech Lead | 2026-05-29 | Resolved |
| 2 | Risk flags support both system-managed lifecycle and manager-approved manual resolution states with audit metadata. | Product Manager | 2026-05-15 | Resolved |
| 3 | `deal.health.updated` is a formal platform event with versioned contract governance. | Backend Lead | 2026-05-08 | Resolved |
| 4 | Board projections use hybrid mode: hot-path aggregates precomputed, low-frequency joins assembled on read. | Backend Lead | 2026-05-22 | Resolved |
| 5 | CRM writebacks for stage/health annotations route through M-03 integration pathways only. | Tech Lead | 2026-05-15 | Resolved |

---

### 10.8 M-08 Execution and Automation

#### Purpose

M-08 Execution and Automation owns next-best-action orchestration, guided sales workflows, branching workflow execution, and automated reaction to revenue signals. Its purpose is to transform detected signals and synthesized insights into concrete actions, alerts, and repeatable GTM execution flows.

M-08 is the action engine of the platform. It does not own canonical deal state or core signal detection, but it decides what to do next based on those upstream outputs.

#### Business Capabilities Owned

M-08 owns the business capability of execution orchestration and automation.

This includes:

- Orchestrate play definition and execution
- Workflow automation and branching rule execution
- Next-best-action generation
- Competitor mention alert triggering
- Task or play activation from upstream signals
- Automated routing of follow-up actions to reps or workflows
- Execution audit trails for owned automations
- Play enrollment and progression tracking

#### Features Owned

M-08 owns the following product features:

- Orchestrate
- Workflow Automation
- Competitor Mention Alerts

Feature notes:

- **Orchestrate:** Defines and runs GTM plays with guided next steps
- **Workflow Automation:** Executes branching automation for sales processes and task orchestration
- **Competitor Mention Alerts:** Triggers real-time alerts when competitor names are detected in conversations

#### Data Owned

M-08 owns all automation-state and play-execution data required to run actions and workflows.

This includes ownership of data such as:

- Play definitions
- Workflow definitions
- Trigger conditions
- Automation rules
- Play enrollments
- Workflow execution records
- Step execution history
- Competitor alert records
- Next-best-action recommendations
- Execution audit logs
- Retry state for automation jobs
- User assignment and action-delivery state for owned automations

Schema rule:

- M-08 owns schema objects and tables under the `m08` boundary
- Other modules must not directly read or write M-08 private tables
- Access to M-08 state must happen through approved public APIs or published events

#### Public APIs

M-08 exposes public APIs for play management, automation control, and alert retrieval.

Current public API boundary includes endpoints such as:

- `GET /api/v1/execution/health` — module health and readiness status
- `GET /api/v1/execution/plays` — list GTM plays
- `POST /api/v1/execution/plays` — create a play
- `GET /api/v1/execution/plays/:id` — fetch play definition and state
- `POST /api/v1/execution/plays/:id/enroll` — enroll a deal, account, or user into a play
- `GET /api/v1/execution/workflows` — list automation workflows
- `POST /api/v1/execution/workflows` — create a workflow
- `POST /api/v1/execution/workflows/:id/run` — trigger a workflow
- `GET /api/v1/execution/alerts` — list active alerts including competitor mention alerts
- `GET /api/v1/execution/recommendations` — fetch next-best-action recommendations

API boundary rules:

- M-08 APIs expose owned automation and recommendation state only
- M-08 may reference upstream entities and signals, but ownership of those records remains with the source modules
- Other modules must not access M-08 automation state through direct DB queries

#### Published Events

M-08 publishes events when workflow actions or automation state transitions complete.

Primary published events:

- `workflow.executed`
- `play.enrollment.created`
- `nextbestaction.generated`
- `competitor.alert.created`

Published event ownership rules:

- Event contracts are owned by M-08
- Consumers must not assume direct ownership of automation internals
- Events must be idempotent and safe for retry delivery

Key event notes:

- `competitor.alert.created` is a direct result of competitor-related tracker detections
- Workflow and recommendation events may be consumed by later reporting, forecasting, or coaching modules once formally needed

#### Consumed Events

M-08 consumes upstream signals and managed state changes to decide when to trigger actions and workflows.

Primary consumed events include:

- `tracker.detection.created`
- `deal.stage.changed`
- `insight.summary.ready`
- `call.summary.generated`

Consumed event notes:

- `tracker.detection.created` is the core trigger for signal-based automations and competitor alerts
- `deal.stage.changed` is already identified as an M-07 event consumed by M-08
- Summary outputs may trigger recommended next steps, follow-up tasks, or guided play progression

#### Allowed Dependencies

M-08 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-05 published events for tracker detections
- M-06 published events and public APIs for summaries and insight outputs
- M-07 published events and public APIs for stage changes and managed workspace state
- M-03 public APIs for canonical deal, account, and contact context lookup where needed
- M-02 public APIs or published events where approved actions include outreach creation or task synchronization
- Python AI Services for next-best-action recommendation support
- BullMQ and Redis for workflow execution and retry orchestration
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-08 may orchestrate actions across modules through approved APIs and events
- M-08 must not take ownership of the underlying source data or board state it reacts to

#### Forbidden Dependencies

M-08 must not depend on:

- Private schemas or private tables of any other product module
- Internal services or repositories of M-02, M-03, M-05, M-06, or M-07
- Direct edits to another module’s storage without an approved public API
- AI model SDKs embedded directly inside TypeScript services
- Hidden direct coupling to forecasting or coaching internals
- Any attempt to redefine source-of-truth ownership for deal, account, or detection data

Developer rule:

- M-08 decides and executes actions, but it must not quietly become the owner of deals, summaries, trackers, or engagement artifacts

#### External Integrations Owned

M-08 may own external delivery endpoints for alerts and automation-triggered actions where those actions are part of execution workflows.

This may include approved ownership of integrations such as:

- Notification channels for alerts
- Internal workflow webhooks
- Approved outbound operational callbacks required for automation delivery

Ownership rule:

- If the integration exists primarily to deliver or execute an automation owned by M-08, it belongs here unless explicitly reassigned

#### AI Service Dependencies

M-08 depends on Python AI services only where automation recommendations require inference.

Primary AI dependencies may include:

- Next-best-action recommendation
- Play step recommendation
- Action prioritization
- Competitor-alert classification support

Boundary rule:

- M-08 owns workflow state, triggers, and execution decisions
- Python AI services may provide recommendation inputs, but M-08 owns final automation behavior
- AI services must return structured recommendation outputs only

#### Operational Ownership

M-08 is operationally owned as the workflow and automation execution engine.

Operational ownership includes:

- Workflow execution success rate
- Trigger handling latency
- Alert delivery reliability
- Play enrollment reliability
- Step progression correctness
- Retry and dead-letter handling for automation jobs
- Monitoring of stuck workflows, duplicate triggers, and failed action delivery
- Execution audit completeness

This module is operationally critical because failures here directly reduce actionability even when upstream intelligence is healthy.

#### Failure Boundary

The failure boundary of M-08 ends at successful persistence and execution of automation state and publication of owned execution events.

If M-08 fails:

- Plays may not start or progress
- Alerts may not be delivered
- Next-best-action recommendations may be missing
- Workflow steps may pause or retry
- Downstream consumers must not assume an automation completed unless the corresponding M-08 output or event exists

Important rule:

- A failure in M-08 must not corrupt upstream tracker detections, summaries, or deal state
- Execution failures should leave source data unchanged and recoverable through retries or operator action

#### Testing Boundary

M-08 testing must validate owned automation workflows independently while mocking all upstream event sources and downstream action targets.

Testing scope includes:

- Consumption of tracker, summary, and stage-change events
- Play creation and enrollment
- Workflow branching and execution logic
- Competitor alert generation
- Next-best-action generation and delivery
- Event publication correctness
- Idempotency for repeated trigger events
- Tenant isolation and RLS-safe writes
- Retry, dead-letter, and failure recovery behavior
- Safe execution ordering when multiple triggers arrive for the same entity

Testing must not require execution of forecasting, coaching, or upstream ownership logic to prove M-08 correctness.

#### Commercial Packaging Notes

M-08 provides strong operational value because it converts insight into repeatable seller action.

Packaging notes:

- M-08 is meaningful only when upstream signal and summary quality is already reliable
- It can support a workflow automation or sales execution package once M-05, M-06, and M-07 are active
- Competitor Mention Alerts may be a separately visible selling point inside a broader execution package
- M-08 should not be sold as fully autonomous unless the upstream dependency chain is deployed and healthy in production

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Default policy is recommendation-first; full automation is allowed only for tenant-approved low-risk actions. | Product Manager | 2026-05-15 | Resolved |
| 2 | M-08 requests task creation through M-02 public APIs; direct writes into M-02 data stores are prohibited. | Backend Lead | 2026-05-08 | Resolved |
| 3 | Throttling and dedup use tenant-scoped idempotency keys, cooldown windows, and per-rule rate limits. | QA Lead | 2026-05-22 | Resolved |
| 4 | Notification transport primitives are Platform Core; business notification policy/trigger logic is owned by M-08. | Tech Lead | 2026-05-15 | Resolved |
| 5 | `nextbestaction.generated` is both an event and an M-08 materialized recommendation record for UX traceability. | Backend Lead | 2026-05-29 | Resolved |


### 10.9 M-09 Forecasting

#### Purpose

M-09 Forecasting owns revenue prediction, forecast collaboration, and pipeline coverage computation. Its purpose is to turn executed pipeline state and historical conversion patterns into forward-looking revenue projections that reps and managers can review, submit, and compare over time.

M-09 is the predict-stage module. It does not own raw deal management or upstream intelligence generation, but it converts managed execution data into forecast outputs and planning views.

#### Business Capabilities Owned

M-09 owns the business capability of revenue forecasting and forecast collaboration.

This includes:

- AI-based revenue prediction
- Forecast Board management
- Forecast period definition and locking
- Rep and manager forecast submissions
- Pipeline coverage calculation
- Historical conversion-rate modeling for forecast support
- Forecast accuracy tracking over time
- Versioned forecast snapshots and submission history

#### Features Owned

M-09 owns the following product features:

- AI Revenue Predictor
- Forecast Boards

Feature notes:

- **AI Revenue Predictor:** Generates AI-based revenue projections using historical conversion patterns and current pipeline state
- **Forecast Boards:** Provides a collaborative workspace for forecast submissions, rollups, and target tracking

#### Data Owned

M-09 owns all data required to generate, store, compare, and review forecast outputs.

This includes ownership of data such as:

- Forecast periods
- Forecast submissions
- AI forecast snapshots
- Pipeline coverage metrics
- Historical conversion-rate records
- Forecast version history
- Submission approval or review state where applicable
- Forecast assumptions metadata
- Forecast accuracy logs
- Board configuration specific to forecasting views
- Model input snapshots used to explain predictions

Schema rule:

- M-09 owns schema objects and tables under the `m09` boundary
- Other modules must not directly read or write M-09 private tables
- Access to M-09 data must happen through approved public APIs or published events

#### Public APIs

M-09 exposes public APIs for forecast boards, submissions, and prediction retrieval.

Current public API boundary includes endpoints such as:

- `GET /api/v1/forecasting/health` — module health and readiness status
- `GET /api/v1/forecasting/periods` — list forecast periods
- `POST /api/v1/forecasting/periods` — create a forecast period
- `GET /api/v1/forecasting/boards/:periodId` — fetch Forecast Board data
- `POST /api/v1/forecasting/submissions` — submit forecast amount
- `GET /api/v1/forecasting/submissions/:id` — retrieve a specific submission
- `GET /api/v1/forecasting/predictions/:periodId` — fetch AI forecast output for a period
- `GET /api/v1/forecasting/coverage/:periodId` — fetch pipeline coverage metrics
- `POST /api/v1/forecasting/periods/:id/lock` — lock a forecast period for governance control

API boundary rules:

- M-09 APIs expose forecast resources and planning outputs owned by this module
- M-09 may reference deals and pipeline context from upstream systems, but ownership of canonical deal state remains upstream
- Other modules must not query M-09 private forecast tables directly

#### Published Events

M-09 publishes events when forecast submissions or forecast-state outputs become available.

Primary published events:

- `forecast.submitted`
- `forecast.snapshot.generated`
- `pipeline.coverage.updated`

Published event ownership rules:

- Event contracts are owned by M-09
- Consumers must treat these as forecasting outputs, not as source-of-truth deal updates
- Events must be idempotent and safe for replay and retries

Key event notes:

- `forecast.submitted` is already identified as a downstream event consumed by M-10
- Snapshot and coverage events may later support dashboards and coaching workflows if formally adopted

#### Consumed Events

M-09 consumes upstream managed-state events needed to generate forecasts.

Primary consumed events include:

- `deal.stage.changed`
- `workflow.executed`
- `nextbestaction.generated`
- `deal.health.updated`

Consumed event notes:

- The SAD explicitly identifies `deal.stage.changed` as an upstream event consumed by M-09
- M-09 may also use outputs from M-08 to understand execution-state changes and pipeline momentum
- Forecasting should consume managed execution signals, not raw transcript or tracker data directly

#### Allowed Dependencies

M-09 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-07 published events and public APIs for deal state, board state, and pipeline changes
- M-08 published events and public APIs for execution-state signals
- M-03 public APIs for canonical deal and account context where needed for forecast explainability
- Python AI Services for forecasting models and confidence-range generation
- BullMQ and Redis for async forecasting jobs and recalculation workflows
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-09 may use upstream managed-state outputs to compute forecasts
- M-09 must not own deal-stage truth, account truth, or raw execution workflow state

#### Forbidden Dependencies

M-09 must not depend on:

- Private schemas or private tables of M-07, M-08, or any other module
- Internal services or repositories from other modules
- Direct writes into M-10 dashboards or coaching state
- Raw transcript analysis tables owned by M-04 or signal tables owned by M-05 without approved APIs
- AI model SDKs embedded directly inside TypeScript services
- Any attempt to redefine upstream deal-state ownership

Developer rule:

- M-09 predicts future revenue using upstream state, but it must not become the owner of pipeline execution truth

#### External Integrations Owned

M-09 generally does not own major customer-facing external SaaS integrations beyond what is required for forecasting workflows.

Its external-facing technical dependencies are primarily:

- Approved AI-service endpoints for forecasting models
- Optional downstream export or notification hooks if explicitly assigned later

Ownership rule:

- If an external dependency exists mainly to generate or distribute forecast outputs owned by this module, it may be attached to M-09, otherwise integration ownership remains elsewhere

#### AI Service Dependencies

M-09 depends on Python AI services for projection logic and confidence modeling.

Primary AI dependencies may include:

- Revenue forecast generation
- Conversion-rate modeling
- Confidence range estimation
- Scenario scoring support
- Forecast explainability payload generation

Boundary rule:

- M-09 owns forecast workflow, submission lifecycle, approval flow, and persistence
- Python AI services own model inference only
- Final forecast state and published events remain owned by M-09

#### Operational Ownership

M-09 is operationally owned as the forecasting and planning module.

Operational ownership includes:

- Forecast generation latency
- Submission reliability
- Forecast period locking behavior
- Coverage calculation freshness
- Accuracy-log generation
- Retry handling for failed recalculation jobs
- Monitoring of stale predictions, job failures, and submission consistency
- Governance controls around locked periods and versioning

This module is operationally important because it affects planning confidence and executive decision-making.

#### Failure Boundary

The failure boundary of M-09 ends at successful persistence and publication of forecast outputs and forecast collaboration state.

If M-09 fails:

- Forecast predictions may become stale or unavailable
- Forecast submissions may fail or remain pending
- Coverage metrics may be outdated
- M-10 and other downstream consumers must not assume a forecast or submission exists unless the corresponding M-09 output or event exists

Important rule:

- A failure in M-09 must not corrupt upstream deal management or execution state
- Forecast recalculation failures should degrade forecast freshness, not alter source pipeline records

#### Testing Boundary

M-09 testing must validate its owned workflows independently while mocking upstream APIs, upstream events, and AI-service dependencies.

Testing scope includes:

- Forecast period creation and locking
- Forecast submission workflow
- AI forecast generation workflow
- Pipeline coverage computation
- Historical conversion-rate update workflow
- Forecast accuracy logging
- Event publication correctness
- Idempotency for repeated upstream events
- Tenant isolation and RLS-safe writes
- Retry and failure recovery for recalculation jobs

Testing must not require execution of M-10 dashboards or coaching workflows to prove M-09 correctness.

#### Commercial Packaging Notes

M-09 has strong executive and manager-facing value because it supports forecasting discipline and visibility.

Packaging notes:

- M-09 is meaningful only when upstream deal and execution signals are already reliable
- It supports a forecasting package or forecasting add-on once M-07 and M-08 are operating in production
- Forecast Boards and AI Revenue Predictor should not be commercially promised unless the upstream execution chain is active and healthy
- M-09 remains logically standalone even if practical rollout depends on earlier lifecycle stages

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | Scenario modeling remains in M-09 as an advanced forecasting sub-capability. | Tech Lead | 2026-05-15 | Resolved |
| 2 | Forecast assumptions are split into user-editable business inputs and protected system/model parameters. | Product Manager | 2026-05-08 | Resolved |
| 3 | Explainability exposes factor contribution summaries and confidence bands without exposing proprietary internals. | AI Lead | 2026-05-22 | Resolved |
| 4 | `pipeline.coverage.updated` is approved as a formal event with additive-version evolution rules. | Backend Lead | 2026-05-29 | Resolved |
| 5 | Locked-period governance remains in M-09; immutable audit and access traces remain Platform Core controls. | Tech Lead | 2026-05-15 | Resolved |

---

### 10.10 M-10 Performance and Coaching

#### Purpose

M-10 Performance and Coaching owns revenue dashboards, coaching insights, and AI-based training experiences. Its purpose is to help leaders improve team performance by aggregating signals from across the lifecycle into visibility, benchmarking, and skill-development workflows.

M-10 is the optimize-stage module. It sits at the end of the lifecycle and converts historical and current platform outputs into improvement loops for managers, enablement teams, and reps.

#### Business Capabilities Owned

M-10 owns the business capability of performance optimization and coaching enablement.

This includes:

- Revenue dashboard management
- Metric snapshot generation
- Sales coaching insight generation
- Rep and team benchmarking
- AI Trainer simulation experiences
- Coaching gap identification
- Training feedback capture
- Performance trend surfacing over time

#### Features Owned

M-10 owns the following product features:

- Revenue Dashboards
- Sales Coaching Insights
- AI Trainer

Feature notes:

- **Revenue Dashboards:** Displays configurable revenue metrics, targets, and trend views
- **Sales Coaching Insights:** Identifies coaching needs and best practices across calls and emails
- **AI Trainer:** Provides AI-driven training simulations based on real interaction patterns and scorecards

#### Data Owned

M-10 owns all optimization, dashboard, and coaching-layer data created by this module.

This includes ownership of data such as:

- Dashboard configurations
- Custom metrics
- Dashboard snapshots
- Coaching insight records
- Benchmark records
- Rep performance trend aggregates
- Training scenario definitions
- AI Trainer session records
- AI Trainer feedback outputs
- Coaching recommendation history
- Optimization-layer materialized metrics owned by M-10

Schema rule:

- M-10 owns schema objects and tables under the `m10` boundary
- Other modules must not directly read or write M-10 private tables
- Access to M-10 outputs must happen through approved public APIs

#### Public APIs

M-10 exposes public APIs for dashboards, coaching outputs, and training sessions.

Current public API boundary includes endpoints such as:

- `GET /api/v1/performance/health` — module health and readiness status
- `GET /api/v1/performance/dashboards` — list available dashboard views
- `GET /api/v1/performance/dashboards/:id` — fetch a dashboard configuration and latest metrics
- `PATCH /api/v1/performance/dashboards/:id` — update dashboard layout or widget preferences
- `GET /api/v1/performance/coaching` — fetch coaching insights for a user, manager, or team
- `GET /api/v1/performance/benchmarks` — fetch benchmark and trend outputs
- `POST /api/v1/performance/trainer/sessions` — start an AI Trainer session
- `GET /api/v1/performance/trainer/sessions/:id` — fetch trainer session state and feedback

API boundary rules:

- M-10 APIs expose optimization outputs owned by this module
- M-10 may compose upstream metrics into dashboards, but canonical ownership of underlying source data remains upstream
- Other modules must not query M-10 private tables directly

#### Published Events

M-10 is primarily a terminal consumption module and usually does not need to publish many platform-critical business events.

Primary published events may include:

- `coaching.insight.generated`
- `trainer.session.completed`
- `dashboard.snapshot.generated`

Published event ownership rules:

- Event contracts are owned by M-10 where these events are used
- Published events should be optional and justified by downstream consumers, not created without a consumer
- Events must be idempotent and safe for replay and retries

Key event notes:

- M-10 is usually the last major lifecycle stage, so most outputs are consumed by users directly rather than by downstream modules

#### Consumed Events

M-10 consumes upstream forecasting and performance-related events needed for optimization workflows.

Primary consumed events include:

- `forecast.submitted`
- `call.review.scored`
- `deal.health.updated`
- `account.engagement.updated`

Consumed event notes:

- The event registry explicitly identifies `forecast.submitted` and `call.review.scored` as upstream inputs to M-10
- M-10 may also use approved APIs from M-03, M-04, and M-09 to retrieve historical or comparative context for dashboards and coaching
- M-10 should consume aggregated or managed-state outputs, not raw low-level capture events unless explicitly approved

#### Allowed Dependencies

M-10 may depend on the following:

- Platform Core for auth, event bus, tenant context, validation, logging, and security controls
- M-09 published events and public APIs for forecast submissions and historical forecast data
- M-04 published events and public APIs for call score outputs and topic distributions
- M-07 public APIs for deal outcomes, health state, and execution performance context
- M-03 public APIs for canonical deal, account, and activity history where needed for KPI computation
- Python AI Services for benchmarking, coaching recommendation generation, and trainer simulation
- BullMQ and Redis for async metric snapshot generation and training workflows
- Shared observability, security, and storage infrastructure

Allowed dependency rule:

- M-10 may aggregate across many upstream modules because it is the terminal optimization layer
- M-10 must not take ownership of canonical source data that belongs upstream

#### Forbidden Dependencies

M-10 must not depend on:

- Private schemas or private tables of any other module
- Internal services or repositories from upstream modules
- Direct writes into forecasting, deal-management, or conversation-intelligence tables
- AI model SDKs embedded directly inside TypeScript services
- Hidden ownership of source metrics that should remain in upstream modules
- Any attempt to bypass approved public APIs or events for source data access

Developer rule:

- M-10 can aggregate and optimize, but it must not become a shadow owner of all platform data

#### External Integrations Owned

M-10 generally does not own major source-system integrations.

Its external-facing technical dependencies are primarily:

- Approved AI-service endpoints for coaching and training simulations
- Optional analytics delivery or export hooks if explicitly assigned later

Ownership rule:

- If an external dependency exists mainly to power dashboards, coaching, or training flows owned by M-10, it may be attached here; otherwise system-of-record integration ownership stays upstream

#### AI Service Dependencies

M-10 depends on Python AI services for coaching analysis and AI Trainer behavior.

Primary AI dependencies may include:

- Benchmark generation
- Coaching recommendation generation
- Persona simulation for AI Trainer
- Feedback scoring for practice sessions
- Trend explanation support

Boundary rule:

- M-10 owns the business workflows for dashboards, coaching, and training
- Python AI services own inference and simulation execution only
- Final metric snapshots, coaching records, and trainer-session lifecycle remain owned by M-10

#### Operational Ownership

M-10 is operationally owned as the optimization, dashboard, and coaching module.

Operational ownership includes:

- Dashboard load performance
- Snapshot freshness
- Coaching insight generation reliability
- Benchmark computation reliability
- AI Trainer session reliability
- Retry handling for failed snapshot and training jobs
- Monitoring of stale metrics, broken widgets, and trainer-session failures
- Governance around dashboard customization and training-session history

This module is operationally important because it shapes how leaders monitor performance and how reps improve over time.

#### Failure Boundary

The failure boundary of M-10 ends at successful persistence and serving of dashboard, coaching, and training outputs.

If M-10 fails:

- Dashboards may show stale metrics
- Coaching insights may be delayed or missing
- AI Trainer sessions may fail or be unavailable
- No upstream module should be affected because M-10 is a terminal consumer for most lifecycle flows

Important rule:

- Failures in M-10 should never alter upstream forecasting, deal, conversation, or execution data
- Optimization failure is a visibility and enablement issue, not a source-data integrity issue

#### Testing Boundary

M-10 testing must validate its owned workflows independently while mocking all upstream APIs, event producers, and AI-service dependencies.

Testing scope includes:

- Dashboard configuration and snapshot generation
- Coaching insight generation
- Benchmark computation
- AI Trainer session lifecycle
- Feedback persistence and retrieval
- Event publication correctness where M-10 emits optional events
- Idempotency for repeated upstream events
- Tenant isolation and RLS-safe writes
- Retry and failure recovery for metric and trainer workflows

Testing must not require execution of upstream forecasting or call-scoring implementation details to prove M-10 correctness.

#### Commercial Packaging Notes

M-10 has strong leadership-facing and enablement-facing value because it closes the loop on visibility and rep improvement.

Packaging notes:

- M-10 depends on many upstream modules and should be positioned as an advanced, full-platform optimization layer
- It supports a premium reporting, coaching, and training package once the upstream chain is operating with production-quality data
- Revenue Dashboards may be attractive commercially on their own, but their value depends heavily on upstream data completeness
- M-10 should not be sold as fully meaningful unless forecasting, scoring, and managed execution signals are already available

#### Open Questions

| # | Decision / Question | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | KPI strategy uses hybrid compute: high-cost aggregates precomputed in snapshots; drill-down metrics computed on demand. | Backend Lead | 2026-05-22 | Resolved |
| 2 | AI Trainer scenarios use tenant data by default plus approved system templates only when tenant policy enables blending. | Product Manager | 2026-05-15 | Resolved |
| 3 | Coaching recommendation contracts are versioned independently from scoring logic with backward-compatible payload evolution. | AI Lead | 2026-05-29 | Resolved |
| 4 | Canonical M-10 outputs are coaching insight records, benchmark snapshots, and trainer outcomes; mirrored KPIs remain projections. | Tech Lead | 2026-05-15 | Resolved |
| 5 | `coaching.insight.generated` is retained as a formal event for optional downstream analytics/workflow subscribers. | Backend Lead | 2026-05-08 | Resolved |

## 11. Platform Event Registry

| Event Name | Publisher | Consumers | Status |
|---|---|---|---|
| `call.transcription.completed` | M-01 | M-02, M-03, M-04, M-05, M-06 | Active |
| `crm.fields.extracted` | M-01 | M-03 | Active |
| `email.sent` | M-02 | M-03, M-05, M-07 | Active |
| `revenuegraph.entity.linked` | M-03 | M-04, M-05 | Active |
| `revenuegraph.context.updated` | M-03 | M-06 | Active (Versioned Family) |
| `call.review.scored` | M-04 | M-05, M-10 | Active |
| `topics.tagged` | M-04 | M-05, M-06 | Active |
| `themes.detected` | M-04 | M-05, M-06 | Active |
| `transcript.corrected` | M-04 | M-05, M-06 | Active |
| `translation.completed` | M-04 | M-06 | Active |
| `tracker.detection.created` | M-05 | M-06, M-07, M-08 | Active |
| `dealdrivers.snapshot.generated` | M-05 | M-06, M-07 | Active |
| `insight.summary.ready` | M-06 | M-07, M-08, M-10 | Active |
| `call.summary.generated` | M-06 | M-03, M-07 | Active |
| `deal.stage.changed` | M-07 | M-08, M-09 | Active |
| `deal.health.updated` | M-07 | M-09, M-10 | Active |
| `account.engagement.updated` | M-07 | M-10 | Active |
| `workflow.executed` | M-08 | M-09 | Active |
| `nextbestaction.generated` | M-08 | M-09, M-10 | Active |
| `forecast.submitted` | M-09 | M-10 | Active |
| `pipeline.coverage.updated` | M-09 | M-10 | Active |
| `forecast.snapshot.generated` | M-09 | M-10 | Draft |
| `coaching.insight.generated` | M-10 | Optional downstream analytics consumers | Active |



