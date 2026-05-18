# Doc #13 — Module README: M3 AI Summaries & GenAI

## 1. Module Overview

### What M3 does
M3 AI Summaries & GenAI converts upstream conversation signals into outputs that humans can directly consume in workflows, such as summaries, briefs, natural-language answers, and deep research reports. In the platform lifecycle, this is the **Analyze** stage: it sits after raw conversations have already been captured, linked, and understood, and before downstream execution modules act on those insights. 

### Why it matters
Raw transcripts, topic tags, tracker detections, and CRM-linked interaction data are useful, but most users do not want to read or interpret all of that manually. M3 turns those machine-readable signals into business-readable outputs that managers, reps, and RevOps can use immediately. 

### Lifecycle stage
R-Revenue Intelligence defines a 7-stage lifecycle: Capture, Model, Understand, Analyze, Execute, Predict, and Optimize. M3 belongs to the **Analyze** stage, where structured signals from the Understand stage are synthesized into higher-order outputs such as summaries, briefs, reports, and answers. 

### Core outputs
M3 is responsible for generating:
- AI-generated call summaries
- AI-generated deal briefs
- AI-generated account briefs
- Ask Anything natural-language answers with cited sources
- AI Deep Researcher async report outputs
- Query session history for conversational research and follow-up interactions 

### Business interpretation
A simple way to explain M3 to a fresher is this:  
- Upstream modules detect **what happened** in conversations.
- M3 explains **what it means** in a form a human can act on.
- Downstream workflow modules then use those outputs in boards, tasks, planning, and execution. 

## 2. Features in This Module

### AI Smart Summaries
AI Smart Summaries automatically generate concise call summaries and structured briefs by analyzing conversations, emails, and CRM data, making it easier for users to consume the most important insights quickly. In the architecture, this includes persisted call summaries and related summary-style outputs such as deal briefs and account briefs. 

### Ask Anything
Ask Anything is the natural-language query interface for users who want quick, contextual answers about calls, emails, deals, accounts, and contacts. It uses a retrieval-and-generation flow so users can ask business questions in plain language and receive grounded answers with supporting sources. 

### AI Deep Researcher
AI Deep Researcher is the deeper, report-oriented analysis feature in M3. It goes beyond short Q&A by analyzing large volumes of conversations and generating structured, in-depth reports for complex business questions. 

## 3. Module Boundaries

### What M3 owns
M3 owns insight generation outputs and the APIs, events, and storage needed to produce and retrieve them. In the architecture, M-06 owns `callsummaries`, `dealbriefs`, `accountbriefs`, `researchreports`, and `querysessions`, along with the `/api/v1/insights` API surface. 

### What M3 does not own
M3 does not own raw conversation capture, transcription, CRM sync, topic detection, tracker detection, Revenue Graph entity linking, or execution workflows. It consumes those upstream signals and transforms them into human-readable outputs, but it must not re-implement or bypass upstream module responsibilities. 

### Upstream dependencies
M3 depends on:
- M-01 for `call.transcription.completed`
- M-03 Revenue Graph for deal, account, and contact context
- M-04 for topic-tagging outputs
- M-05 for tracker detections and retrieval support
- Platform Core for auth, tenant isolation, validation, and event handling 

### Downstream consumers
M3 outputs are consumed by:
- Frontend insight views
- M-03 Revenue Graph in some summary propagation flows
- M-07 Deal and Account Management for deal health and board views
- End users such as reps, managers, and RevOps consuming summaries, briefs, answers, and reports 

### Boundary rule
M3 must never read another module’s private tables directly unless the architecture explicitly gives it ownership. Cross-module access must happen through APIs or events, preserving the modular boundary that the platform requires from day one. 

## 4. Architecture Snapshot

### Main components
The module is implemented as `InsightGenerationModule` in the NestJS API layer, with AI inference delegated to the Python AI Services Layer. Business logic, auth, event orchestration, persistence, and lifecycle handling stay in TypeScript, while summarization, answer generation, embeddings, and research reasoning stay in Python services. 

### Retrieval layer
M3 uses retrieval over summaries, transcript chunks, and semantic search for features like Ask Anything and Deep Researcher. The architecture uses pgvector for embeddings, structured source data in PostgreSQL, and retrieval orchestration through internal AI endpoints such as `v1/embed` and `v1/answer-query`. 

### AI generation flow
The standard pattern is:
1. Receive an event or API request.
2. Fetch transcript and entity context.
3. Build structured prompt payload.
4. Call AI Services Layer.
5. Validate and store structured output.
6. Expose result via API or event. 

### Storage and versioning
M3 stores summaries, briefs, query sessions, and research jobs in its owned tables. Generated summary-style outputs include version fields for regeneration tracking, while research jobs track lifecycle through `queued`, `running`, `completed`, and `failed` states. 

### Event flow
M3 consumes upstream events such as `call.transcription.completed`, `tracker.detection.created`, and `call.topics.tagged`. It emits downstream events such as `call.summary.generated` after successful summary creation. 

## 5. APIs

### API prefix
All module APIs are exposed under:
- ` /api/v1/insights ` 

### Summary generation endpoints
- `GET /api/v1/insights/calls/:id/summary` — fetch AI-generated call summary.
- `GET /api/v1/insights/deals/:id/brief` — fetch AI-generated deal brief.
- `GET /api/v1/insights/accounts/:id/brief` — fetch AI-generated account brief. 

### Ask endpoints
- `POST /api/v1/insights/ask` — submit a natural-language query.
- `GET /api/v1/insights/ask/sessions/:id` — fetch full Ask Anything session history. 

### Research job endpoints
- `POST /api/v1/insights/research` — create AI Deep Researcher async job.
- `GET /api/v1/insights/research/:id` — fetch research status or completed report result. 

### Auth model and caller types
All endpoints are JWT-protected and intended primarily for frontend callers acting on behalf of authenticated users. Authorization is enforced through Platform Core using Supabase Auth, JWT guards, RBAC, and tenant-aware request handling. 

## 6. Events

### Events consumed
M3 consumes these upstream events:
- `call.transcription.completed`
- `tracker.detection.created`
- `call.topics.tagged` 

### What M3 does when events arrive
- On `call.transcription.completed`, M3 generates and stores call summaries.
- On `tracker.detection.created`, M3 refreshes affected deal briefs using debounce rules.
- On `call.topics.tagged`, M3 enriches summary structure with topic information where relevant. 

### Events emitted
M3 emits:
- `call.summary.generated` 

### Event ownership and retry rules
M3 owns the summary-generated event contract and is responsible for idempotent handling of consumed events. For example, duplicate `call.transcription.completed` events must not create duplicate version-1 summaries, and deal brief refreshes are debounced to avoid regeneration storms. 

## 7. Data Ownership

### Owned data
M3 owns:
- `callsummaries`
- `dealbriefs`
- `accountbriefs`
- `researchreports`
- `querysessions` 

### Generated summaries and briefs
These tables store human-consumable outputs derived from upstream signals, not the upstream signals themselves. That distinction matters because M3 owns the interpretation artifacts, while other modules own the source-of-truth interaction and detection data. 

### Search and retrieval artifacts
M3 uses retrieval artifacts such as embeddings and transcript chunks, but vector generation and retrieval support are shared platform capabilities rather than M3-exclusive source systems. M3 may consume them for Ask Anything and Deep Researcher, but it should not treat them as a replacement for owned output tables. 

### Research job records
`researchreports` is the canonical async job record for AI Deep Researcher. It stores the question, filters, status, result text, creator, and created timestamp for long-running report-oriented analysis. 

### Tenant isolation and retention
All M3 data is tenant-scoped and subject to the platform’s shared PostgreSQL plus RLS model. Every query, write path, and exported output must preserve tenant isolation and follow the broader platform governance rules around customer-owned data. 

## 8. Folder Structure

### Recommended structure
This module should be easy for a fresher to navigate. Keep controller code thin, service code focused, and worker/retrieval/prompt logic separated clearly. 

```text
src/modules/m3-insight-generation/
├── controllers/
│   ├── call-summary.controller.ts
│   ├── ask.controller.ts
│   └── research.controller.ts
├── services/
│   ├── summary.service.ts
│   ├── brief.service.ts
│   ├── ask-anything.service.ts
│   └── deep-research.service.ts
├── retrieval/
│   ├── vector-search.service.ts
│   ├── transcript-retrieval.service.ts
│   └── context-assembly.service.ts
├── prompt-builders/
│   ├── summary.prompt.ts
│   ├── ask.prompt.ts
│   └── research.prompt.ts
├── workers/
│   ├── summary-generation.worker.ts
│   ├── brief-refresh.worker.ts
│   └── research.worker.ts
├── schemas/
│   ├── ask.schema.ts
│   ├── research.schema.ts
│   └── summary.schema.ts
├── events/
│   ├── summary-generated.event.ts
│   └── event-handlers.ts
├── repositories/
│   ├── call-summary.repository.ts
│   ├── brief.repository.ts
│   └── research-report.repository.ts
└── tests/
    ├── unit/
    ├── integration/
    └── event-flow/
```

### Folder intent
- `controllers/` own HTTP entry points only.
- `services/` own module business orchestration.
- `retrieval/` owns source fetching and ranking logic.
- `prompt-builders/` owns payload shaping for AI services.
- `workers/` own async processing.
- `schemas/` own validation contracts.
- `tests/` mirror real usage and event flows. 

## 9. Local Development

### Prerequisites
Local development should follow the real architecture closely enough to catch integration issues early. The approved local approach uses Docker Compose with the main services running in containers, alongside the approved frontend, NestJS backend, Python AI services, PostgreSQL, and Redis dependencies. 

### Setup steps
1. Clone the monorepo.
2. Pull environment variables from Doppler or approved secret source.
3. Start local services with Docker Compose.
4. Run database migrations.
5. Seed sample tenant, users, transcripts, and AI fixture data.
6. Start API, frontend, and AI service containers. 

### Run commands
Use one standard command path per service so new engineers do not guess. Exact commands may vary by repo, but the module README should point to the repo-standard commands for:
- API dev server
- AI services dev server
- worker processes
- test suites
- local stack startup 

### Worker setup
M3 depends on async workers for summary generation, brief refresh, and research jobs. Local development must include BullMQ-backed workers so event-driven flows and research job lifecycles can be tested properly, not mocked away by default. 

### Mock data strategy
Use stable fixtures for:
- transcripts
- topic tags
- tracker detections
- revenue graph context
- expected AI JSON outputs 

A good fresher-friendly rule is: first make the module work with deterministic fixtures, then test it with real queue and service boundaries. 

## 10. Configuration

### Required env vars
This module depends on shared platform infrastructure, so the required configuration will normally include:
- PostgreSQL connection
- Redis connection
- AI service base URL
- auth and JWT config
- logging and observability config
- secret manager integration 

### Optional env vars
Optional configuration may include:
- feature flags for Ask Anything or Deep Researcher rollout
- timeout overrides for AI endpoints
- retrieval depth limits
- research concurrency limits
- debug logging toggles 

### Secret sources
Secrets must come from approved centralized secret management, not local committed files. The approved architecture uses Doppler for environment and secret delivery. 

### Link to env registry
This README should link to the central environment variable registry or ops documentation rather than duplicating every secret definition inline. That keeps the README lightweight while preserving one source of truth for configuration. 

## 11. Operational Notes

### Common failure modes
Typical failure modes include:
- missing transcript or delayed upstream data
- missing Revenue Graph entity context
- AI service timeout or malformed structured response
- duplicate events causing accidental regeneration attempts
- queue backlog causing stale summary generation
- low-confidence outputs requiring review instead of blind use 

### Re-run and regeneration rules
M3 should treat regeneration as an explicit action, not an accidental side effect of duplicate events. The architecture already notes versioned summary outputs and idempotent handling of duplicate transcription events, which is the correct baseline rule for safe regeneration. 

### Cost controls
This module can become expensive because it combines retrieval, LLM calls, and async report generation. Practical cost controls include bounded retrieval depth, cached outputs where safe, debounce on repeated refreshes, and stronger limits on deep research jobs than on simple summary reads. 

### Support ownership
- Product/API ownership: Backend Lead
- AI quality and prompt ownership: AI Lead
- Queue and worker reliability: Backend Lead / Platform team
- Infra and secret issues: DevOps Lead
- Cross-module boundary issues: Tech Lead 

## 12. Related Docs

### Core references
- System Architecture Document (SAD)
- Feature TDD — AI Smart Summaries
- Feature TDD — Ask Anything
- Feature TDD — AI Deep Researcher
- API design docs for `/api/v1/insights`
- Sequence diagrams for summary, ask, and research flows
- Runbooks for AI service failures, queue backlog, and regeneration operations 

### Reading order for new engineers
Recommended reading order:
1. SAD sections on lifecycle, module boundaries, and AI services.
2. M3 Module README.
3. Feature TDDs for Smart Summaries, Ask Anything, and Deep Researcher.
4. API docs.
5. Event flow and operational runbooks. 
