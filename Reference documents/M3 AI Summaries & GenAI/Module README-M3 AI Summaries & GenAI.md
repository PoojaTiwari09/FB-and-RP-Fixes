# Doc #13 — Module README: M3 AI Summaries & GenAI

## 1. Document Control

- **Document Title:** Module README — M3 AI Summaries & GenAI
- **Module:** M3 AI Summaries & GenAI
- **Workspace Target:** `modules/m03-ai-summaries-genai/`
- **Owner:** Product Engineering — M3
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Module Overview

### What M3 does
M3 AI Summaries & GenAI converts upstream conversation signals into structured outputs that human sales professionals can directly consume, such as executive call summaries, deal briefs, account briefs, natural-language answers, and deep research reports. In the platform lifecycle, this represents **Stage 4 — Analyze**: it sits after raw conversations have been captured, linked, and analyzed for structural keywords, and before downstream execution and dashboard modules act on those insights.

### Why it matters
Raw transcripts, topic tags, tracker detections, and CRM-linked interaction data are heavy, low-level data. Most business professionals do not have the time to sift through transcripts manually. M3 turns those machine-readable signals into clear, actionable business summaries and reports that managers, reps, and RevOps can immediately act upon.

### Platform Lifecycle Stage
R-Revenue Intelligence defines a 7-stage lifecycle: Capture, Model, Understand, Analyze, Execute, Predict, and Optimize. M3 is the exclusive owner of **Stage 4 — Analyze**, where raw signals from the earlier stages are synthesized into higher-order, structured artifacts.

### Core Outputs
M3 is responsible for generating and persisting:
- **AI Call Summaries:** Single-call structured breakdowns.
- **AI Deal Briefs:** Aggregated momentum and risk reports for active opportunities.
- **AI Account Briefs:** Consolidated executive briefs tracking client health.
- **Ask Anything Conversational Answers:** Context-grounded RAG query answers with cited sources.
- **AI Deep Researcher Reports:** Complex, multi-call async research reports.

### Business Interpretation
- Upstream modules (**M1 Capture & Transcription** and **M2 Conversation Intelligence**) detect **what happened** in customer interactions.
- **M3 AI Summaries & GenAI** explains **what it means** in a form a human can act on.
- Downstream workflow and UI modules (**M4 Deal Intelligence**, **M5 Account Intelligence**, and **M8 Sales Engagement**) consume these insights for execution.

---

## 3. Module Boundaries & Communication Contracts

### What M3 Owns
M3 owns the generation, storage, and retrieval of derived business insights. In the PostgreSQL database, it has exclusive write authority over tables under the **`m03_ai_summaries_genai`** schema:
- `m03_ai_summaries_genai.call_summaries`
- `m03_ai_summaries_genai.deal_briefs`
- `m03_ai_summaries_genai.account_briefs`
- `m03_ai_summaries_genai.research_reports`
- `m03_ai_summaries_genai.query_sessions`
- `m03_ai_summaries_genai.query_messages`
- `m03_ai_summaries_genai.summary_evidence_links`
- `m03_ai_summaries_genai.summary_history`

### What M3 Does Not Own
- M3 does **not** own raw call capture, audio storage, or transcript creation (owned by **M1**).
- M3 does **not** own the generation of topic models, scorecards, or keyword tracker detections (owned by **M2**).
- M3 does **not** own the CRM entity graph, account/contact syncing, or the direct database mapping of deals (owned by **M10**).
- M3 does **not** own email composition, outbound sequence triggers, or task lists (owned by **M8**).

### Upstream Dependencies
M3 consumes and requires data from:
- **M1 Capture & Transcription:** Audio transcripts, speaker segments, and call metadata.
- **M2 Conversation Intelligence:** Topic tags, scorecards, and keyword tracker detections.
- **M10 Data & Compliance:** CRM deal, account, contact, and relationship context (Revenue Graph).
- **Platform Core:** Auth verification, tenant context lookup, and BullMQ task scheduling.

### Downstream Consumers
M3 outputs are consumed by:
- **M4 Deal Intelligence / M5 Account Intelligence:** For deal card widgets, risk notifications, and stakeholder maps.
- **M8 Sales Engagement:** To trigger email draft completions and playbooks based on meeting actions.
- **M10 Data & Compliance:** Asynchronous propagation of meeting notes into external CRMs.
- **Frontend client applications:** Serving interactive summaries, chat libraries, and PDF report downloads.

### Non-Circular Communication Rule
**M10 Data & Compliance** serves as an upstream dependency during summary generation (providing deal metadata via REST API) and acts as an asynchronous downstream consumer (subscribing to `call.summary.generated` to sync meeting summaries to external CRM systems). This relationship is strictly non-blocking: M3 never writes to M10 tables directly, and M10 processes events asynchronously via the message bus, preventing circular runtime locks.

---

## 4. Architecture Snapshot

```
   ┌────────────────────────────────────────────────────────┐
   │                  Public Web Client (UI)                │
   └───────────────────────────┬────────────────────────────┘
                               │
               (HTTPS REST APIs: /api/v1/m03-*)
                               v
   ┌────────────────────────────────────────────────────────┐
   │             modules/m03-ai-summaries-genai/            │
   │                (NestJS Service Controllers)            │
   └───────────────┬────────────────────────┬───────────────┘
                   │                        │
       (Async jobs via BullMQ)              │ (Grounded RAG Queries)
                   v                        v
   ┌───────────────────────────┐    ┌───────────────────────┐
   │     Background Workers    │    │  Vector Search Engine │
   │ (Summary & Report Gen)    │    │ (pgvector + Postgres) │
   └───────────────┬───────────┘    └───────────┬───────────┘
                   │                            │
                   ├────────────────────────────┘
                   │ (Private Internal REST APIs)
                   v
   ┌────────────────────────────────────────────────────────┐
   │                  FastAPI AI Services Layer             │
   │               (Python Model Inference / LLM)           │
   └────────────────────────────────────────────────────────┘
```

### Main Components
The module is physically packaged inside `modules/m03-ai-summaries-genai/` in the monorepo:
1. **NestJS Controllers & Services (TypeScript):** Handles user authorization, tenant query filters, session management, database migrations, and job scheduling.
2. **BullMQ Background Workers:** Orchestrates long-running summaries and multi-interaction research reports, preventing API thread blocking.
3. **Retrieval Layer:** Interfaces with PostgreSQL `pgvector` and Meilisearch to execute hybrid search over tenant-isolated embeddings.
4. **FastAPI Inference Layer (Python):** Private service execution for prompt shaping, structured JSON parsing, and LLM text generation.

---

## 5. Module APIs

All public REST endpoints are exposed strictly under the `/api/v1/m03-ai-summaries-genai` prefix.

### Call Summary Endpoints
- `GET /api/v1/m03-ai-summaries-genai/calls/:id/summary`
  - Fetches the active AI call summary including next steps, risks, and confidence scores.
- `POST /api/v1/m03-ai-summaries-genai/calls/:id/summary/regenerate`
  - Explicitly schedules an asynchronous background job to regenerate the call summary.

### Deal & Account Brief Endpoints
- `GET /api/v1/m03-ai-summaries-genai/deals/:id/brief`
  - Fetches the latest deal brief combining recent calls, tracker alerts, and deal drivers.
- `GET /api/v1/m03-ai-summaries-genai/accounts/:id/brief`
  - Fetches the latest account brief reflecting stakeholder sentiment and health trends.

### Ask Anything (Conversational RAG) Endpoints
- `POST /api/v1/m03-ai-summaries-genai/ask`
  - Submits a natural-language question. Initiates a grounded hybrid search and returns a cited response.
- `GET /api/v1/m03-ai-summaries-genai/ask/sessions/:id`
  - Retrieves the complete conversational message history for a query session.

### AI Deep Researcher (Async Analysis) Endpoints
- `POST /api/v1/m03-ai-summaries-genai/research`
  - Submits a research query with complex filters. Returns an instant `202 Accepted` with a `reportId`.
- `GET /api/v1/m03-ai-summaries-genai/research/:id`
  - Polls the active job status (`queued`, `running`, `completed`, `failed`) and returns the finished report.

---

## 6. Message & Event Contracts

Platform components communicate asynchronously using event-driven choreography via **BullMQ** on Redis.

### Events Consumed
- **`call.transcription.completed`**
  - *Trigger:* Emitted by **M1** when a meeting transcript is finalized.
  - *Action:* M3 immediately enqueues a background summary generation job.
- **`tracker.detection.created`**
  - *Trigger:* Emitted by **M2** when a keyword pattern matches a transcript.
  - *Action:* M3 registers the signal and queues a debounced deal/account brief refresh job.
- **`call.topics.tagged`**
  - *Trigger:* Emitted by **M2** when topic taxonomies are generated.
  - *Action:* M3 appends topic-specific tags and structures to the active call summary metadata.

### Events Emitted
- **`call.summary.generated`**
  - *Payload:* `eventId`, `summaryId`, `callId`, `tenantId`, `confidenceScore`, `flaggedReview`, `generatedAt`.
  - *Action:* Emitted after a call summary is successfully stored. Consumed by **M10** for CRM notes propagation and **M4/M5** for cards refresh.
- **`research.report.completed`**
  - *Payload:* `eventId`, `reportId`, `tenantId`, `createdBy`, `status`, `questionSummary`, `sourceCount`, `generatedAt`.
  - *Action:* Emitted when a multi-call Deep Researcher report completes and is written to persistent storage.

---

## 7. Data Ownership & Schema Layout

All M3 tables reside under the **`m03_ai_summaries_genai`** PostgreSQL schema. Under decentralized db governance, these tables are managed locally in `modules/m03-ai-summaries-genai/prisma/schema.prisma`.

### Owned Tables
1. **`call_summaries`:** Stores call executive summaries, next steps, risks, confidence score, and revision versioning.
2. **`deal_briefs`:** Stores opportunity briefings, competitive signals, and recommended steps.
3. **`account_briefs`:** Stores overall client account status and sentiment summary.
4. **`research_reports`:** Stores complex async researcher reports and question parameters.
5. **`query_sessions`:** Stores individual Ask Anything chat conversation metadata and scopes.
6. **`query_messages`:** Stores chat conversation turns (user vs assistant) along with cited sources JSON arrays.
7. **`summary_evidence_links`:** Normalized table map linking summary sections to source calls, transcript snippets, or detections.
8. **`summary_history`:** Stores previous snapshots of regenerated summaries for audit trails.

### Shared Platform Tables (Consumed, NOT Owned)
- **`semantic_embeddings`:** Owned by the platform embedding pipeline (managed under **M1**). M3 reads embeddings through read-only access to this table to perform pgvector similarity lookups.

---

## 8. Directory & Folder Layout

The physical codebase resides strictly under the `modules/m03-ai-summaries-genai/` directory:

```text
modules/m03-ai-summaries-genai/
├── prisma/
│   └── schema.prisma                # Local Prisma migrations & DB schema
├── src/
│   ├── controllers/                 # Express/NestJS HTTP route managers
│   │   ├── call-summary.controller.ts
│   │   ├── ask.controller.ts
│   │   └── research.controller.ts
│   ├── services/                    # Module business orchestration
│   │   ├── summary.service.ts
│   │   ├── brief.service.ts
│   │   ├── ask-anything.service.ts
│   │   └── deep-research.service.ts
│   ├── retrieval/                   # pgvector & Meilisearch retrieval
│   │   ├── hybrid-search.service.ts
│   │   └── context-assembler.service.ts
│   ├── prompt-builders/             # LLM prompt composition
│   │   ├── summary-prompt.ts
│   │   ├── ask-prompt.ts
│   │   └── research-prompt.ts
│   ├── workers/                     # BullMQ background task execution
│   │   ├── summary-generation.worker.ts
│   │   └── research-generation.worker.ts
│   └── dto/                         # Input validation via Zod schemas
│       ├── ask.dto.ts
│       └── research.dto.ts
└── tests/
    ├── unit/                        # Isolated logic tests
    └── integration/                 # End-to-end endpoint and event tests
```

---

## 9. Environment Configuration Summary

All environment settings are loaded dynamically at runtime via Doppler. The key configuration flags include:
- `M03_ENABLED`: Master feature switch to bootstrap M3 routes and queues.
- `M03_SUMMARY_ENABLED`: Toggle call summary background workers.
- `M03_ASK_ENABLED`: Toggle Ask Anything RAG routes.
- `M03_RESEARCH_ENABLED`: Toggle Deep Researcher async queue processors.
- `SESSION_RETENTION_DEFAULT_DAYS`: Standard session retention window (Default: `90` days, maximum: `365` days).

*Refer to the [M3 Environment Variables Registry.md](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/Reference%20documents/M3%20AI%20Summaries%20&%20GenAI/M3%20Environment%20Variables%20Registry.md) for full config details.*

---

## 10. Operational Guidelines

### AI Failure Resiliency & Throttling
- **LLM Timeout Guard:** Synchronous user queries (Ask Anything) time out after 30 seconds (`AI_SERVICE_TIMEOUT_MS_SYNC`). Background jobs have a 5-minute cap (`AI_SERVICE_TIMEOUT_MS_ASYNC`).
- **Research Concurrency Cap:** To prevent external token exhaustion, a single tenant is restricted to **2 concurrent** AI Deep Researcher workflows. Excess requests are queued in BullMQ.
- **Low-Confidence Gating:** Call summaries or reports generating a confidence score `< 0.70` are written with `flagged_for_review = true` and blocked from downstream auto-sync to external CRMs.

---

## 11. Related Documentation

- **Feature Technical Design Documents (TDDs):**
  - [TDD-AI Smart Summaries.md](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/Reference%20documents/M3%20AI%20Summaries%20&%20GenAI/TDD/TDD-AI%20Smart%20Summaries.md)
  - [TDD-Ask Anything.md](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/Reference%20documents/M3%20AI%20Summaries%20&%20GenAI/TDD/TDD-Ask%20Anything.md)
  - [TDD-AI Deep Researcher.md](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/Reference%20documents/M3%20AI%20Summaries%20&%20GenAI/TDD/TDD-AI%20Deep%20Researcher.md)
- **Sequence Flows:**
  - [M3 Sequence Diagrams.md](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/Reference%20documents/M3%20AI%20Summaries%20&%20GenAI/M3%20Sequence%20Diagrams.md)
