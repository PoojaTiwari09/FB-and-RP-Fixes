# Doc #13 — Module README: M2 Conversation Intelligence

## 1. Module Overview

M2 Conversation Intelligence is the **Understand** stage of the Revenue Intelligence lifecycle. It helps teams understand what happened inside customer interactions by turning transcripts and interaction data into structured signals such as call scores, topics, themes, tracked signals, translated outputs, corrected terminology, and searchable conversation archives. 

In the product mapping, M2 includes these user-facing features: AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, AI Smart Tracker, AI Translator, AI Transcriber, and Searchable Conversation Library.   
Why it matters is simple: this module takes raw conversation data and makes it usable for AI summaries, deal search, coaching, risk detection, renewal forecasting, and sales engagement workflows.

### Lifecycle Stage

- **Lifecycle Stage:** Stage 3 — `Understand`
- **Primary Job:** Track what is happening in calls and conversations and convert that into useful, structured, and search-enriched signals.
- **Upstream Dependency:** **M1 Capture & Transcription** (completed transcripts) and **M10 Data & Compliance** (Revenue Graph context).
- **Downstream Impact:** Feeds **M3 AI Summaries & GenAI**, **M4 Deal Intelligence**, **M5 Account Intelligence**, **M8 Sales Engagement**, and **M9 Coaching & Training**.

### What M2 Does

From a product and technical point of view, M2 analyzes completed conversations and gives users a searchable, structured, AI-enriched understanding of those interactions.   
It helps answer critical questions like: What topics were discussed, what themes are repeating, what risks appeared, how should this call be scored, and where can I find the right conversation later.

### Why It Matters

Without M2, the platform mostly has captured transcripts and linked CRM context, but lacks usable, semantic intelligence. M2 is the operational bridge between raw conversation capture (M1) and the downstream forecasting (M6), sales engagement (M8), and coaching (M9) modules.

### Core Outputs

The main outputs tied to M2 are call review scores, topic tags, theme analysis results, tracker detections, corrected business terminology, translated transcript outputs, and searchable conversation records.   
At the architecture level, the most explicit event outputs are `call.scored`, `call.topics.tagged`, and `tracker.detection.created`, which are consumed by downstream modules.

---

## 2. Features in This Module

M2 contains the following product-facing features, all unified within the `/modules/m02-conversation-intelligence/` workspace and backed by the `m02_conversation_intelligence` schema:

### AI Call Reviewer
AI Call Reviewer evaluates sales or support calls using predefined admin-managed scorecards and AI-generated insights. It stores scorecard definitions and call score results directly in the module's database tables.

### AI Topic Tagger
AI Topic Tagger labels key discussion topics in calls, such as pricing, next steps, objections, and product issues, so conversations become structured and searchable. It emits the `call.topics.tagged` event for downstream search and insight workflows.

### AI Theme Spotter
AI Theme Spotter analyzes multiple conversations together to detect recurring themes, trends, objections, and patterns that are not obvious from a single call alone. It is executed via asynchronous batch analysis jobs and stores theme results locally.

### AI Smart Tracker
AI Smart Tracker detects business signals across calls and emails using semantic intent detection instead of simple keyword matching. It tracks pricing concerns, competitor mentions, and custom intent signals, emitting `tracker.detection.created` upon matches.

### AI Translator
AI Translator converts transcripts and AI-generated outputs into the preferred language of the user or workspace, helping multilingual teams work from the same source interaction data.

### AI Transcriber
AI Transcriber improves transcript quality by correcting mis-transcribed business-specific terms such as product names, competitor names, acronyms, and jargon. It works alongside M1 Capture & Transcription to maintain the vocabulary correction registry.

### Searchable Conversation Library
Searchable Conversation Library lets users find, filter, analyze, and export calls, accounts, and customer interactions using search and AI-enriched metadata. It manages the hybrid search APIs and search index synchronization logic.

---

## 3. Product vs Architecture Mapping

### Product Module M2 Scope
In the product map, M2 is one sellable and understandable module called **Conversation Intelligence**. It groups together all features that help users understand customer conversations after capture. This packaging is useful for product roadmaps, pricing models, UI groupings, and customer communication.

### Unified Architecture
Unlike legacy system drafts where Conversation Intelligence was split across "M-04" and "M-05" packages, the v3.0 architecture unifies the entire backend scope into a single physical monorepo workspace: `/modules/m02-conversation-intelligence/`.
All data records, APIs, event handlers, and BullMQ workers are managed within this single module boundary under the unified PostgreSQL schema `m02_conversation_intelligence`.

---

## 4. Module Boundaries

### What M2 Owns
M2 owns all features that help users understand captured conversations through AI review, topic understanding, trend detection, tracker detection, translation, transcript cleanup, and library search. It owns the "understand the conversation" experience and persistent intelligence tables.

### What M2 Does Not Own
M2 does **not** own raw transcription generation, call ingestion, CRM syncing, revenue entity linking, executive summary generation, deal boards, forecasting, dashboards, or coaching outputs. Those belong to upstream or downstream modules such as M1, M3, M4, M5, M6, M7, M8, M9, and M10.

### Allowed Dependencies
M2 is allowed to depend on:
- **M1 Capture & Transcription** for completed transcripts and transcript-related source data.
- **M10 Data & Compliance** for deal, account, contact, and core Revenue Graph context used in scoring and enrichment.
- **AI Services Layer** (FastAPI) for scoring, theme detection, topic tagging, tracker detection, and embedding generation.
- **Platform Core** for authentication, tenant context, auditing, and role-based access control (RBAC).

### Downstream Consumers
The main downstream consumers are:
- **M3 AI Summaries & GenAI** for structured summaries and RAG queries.
- **M4 Deal Intelligence** and **M5 Account Intelligence** for deal risk flags and active boards.
- **M8 Sales Engagement** for automated playbook enrollments and follow-up drafts.
- **M9 Coaching & Training** for scorecard metrics and skill analysis.

---

## 5. Architecture Snapshot

### Main Components
The main architecture pieces behind M2 are:
- **M2ConversationIntelligenceModule** with API prefix `/api/v1/m02-conversation-intelligence`.
- **AI Services Layer** in Python FastAPI, called for scoring, theme detection, topic tagging, tracker detection, and embeddings.
- **Meilisearch** for full-text search and **pgvector** (via PostgreSQL) for semantic retrieval.

### Queue and Event Flows
The architecture is event-driven. M2 reacts to upstream events like `call.transcription.completed` and `revenue_graph.entity.linked`, then emits downstream events like `call.scored`, `call.topics.tagged`, and `tracker.detection.created`.

### AI Service Interactions
TypeScript product services orchestrate business workflows, while Python AI services handle inference and NLP. NestJS modules call private AI endpoints such as `POST /internal/score-call`, `POST /internal/detect-themes`, `POST /internal/tag-topics`, `POST /internal/detect-trackers`, and `POST /internal/generate-embeddings`.

---

## 6. Events

### Events Consumed
The most important upstream events consumed by the M2 implementation are:
- `call.transcription.completed` from M1 (Triggers AI scoring, topic tagging, and keyword tracking runs).
- `revenue_graph.entity.linked` from M10 (Signals that a call record has been mapped to CRM deals; triggers scoring finalization).
- `email.sent` from M8 (Triggers intent tracking sweeps across outbound outreach content).

*Note: M2 must wait for `revenue_graph.entity.linked` before finalizing call scores when scorecard criteria depend on deal value or tier context.*

### Events Emitted
The main emitted events are:
- `call.scored` (Emitted after scorecard evaluation finishes).
- `call.topics.tagged` (Emitted after topic categorization completes).
- `tracker.detection.created` (Emitted when dynamic keyword or intent patterns match a transcript or email).

These events carry the verified standard v1 envelope, including `eventId`, `tenantId`, `correlationId`, and `occurredAt`.

---

## 7. APIs

All M2 features are exposed through the canonical `/api/v1/m02-conversation-intelligence` prefix:

### Scorecard & Review Endpoints
- `GET /api/v1/m02-conversation-intelligence/calls/:id/score` (Retrieves call review score)
- `POST /api/v1/m02-conversation-intelligence/scorecards` (Creates a scorecard definition)
- `GET /api/v1/m02-conversation-intelligence/scorecards` (Lists all active scorecards)
- `POST /api/v1/m02-conversation-intelligence/theme-analyses` (Submits a batch theme analysis request)
- `GET /api/v1/m02-conversation-intelligence/theme-analyses/:id` (Gets status or results of theme analysis)
- `GET /api/v1/m02-conversation-intelligence/calls/:id/topics` (Gets tagged topics for a call)
- `POST /api/v1/m02-conversation-intelligence/vocabulary` (Manages tenant vocabulary correction rules)
- `GET /api/v1/m02-conversation-intelligence/translations/:id` (Retrieves translated transcript content)

### Smart Tracking & Search Endpoints
- `GET /api/v1/m02-conversation-intelligence/trackers` (Lists all custom Smart Trackers)
- `POST /api/v1/m02-conversation-intelligence/trackers` (Creates a custom Smart Tracker)
- `GET /api/v1/m02-conversation-intelligence/trackers/:id/detections` (Retrieves detections for a tracker)
- `GET /api/v1/m02-conversation-intelligence/conversations/search` (Performs hybrid text + vector search)
- `GET /api/v1/m02-conversation-intelligence/conversations` (Lists conversation library meta)
- `GET /api/v1/m02-conversation-intelligence/deal-drivers` (Retrieves deal risk aggregations)
- `GET /api/v1/m02-conversation-intelligence/saved-searches` (Lists saved filters)
- `POST /api/v1/m02-conversation-intelligence/saved-searches` (Saves a search query)

---

## 8. Data Ownership

### Core PostgreSQL Tables
All M2 tables reside in the isolated `m02_conversation_intelligence` schema in PostgreSQL, secured by Row-Level Security (RLS):
- `scorecards` (Scorecard rules, version metadata, and evaluation criteria).
- `call_scores` (Scoring outputs, questions, aggregate confidence, and review flags).
- `themes` & `theme_analyses` (Batch theme spotter results and query conditions).
- `topic_tags` & `topic_models` (Topic labels mapped per call, and custom taxonomy models).
- `translation_preferences` & `translated_texts` (Target translation preferences and localized outputs).
- `trackers` & `tracker_detections` (Intent tracker definitions and detected snippets).
- `search_index_sync_log` (Sync trace history tracking Meilisearch and pgvector updates).
- `deal_driver_snapshots` (Rep-level aggregated risk signals used on the Deal Board).

---

## 9. Local Development

### Prerequisites
To work locally on M2-related features, you need:
- Node.js and NestJS backend runtime.
- Python runtime for running the FastAPI AI Services layer.
- PostgreSQL with `pgvector` enabled.
- Upstash Redis or local Redis for BullMQ queues.
- Meilisearch.

### Setup Steps
1. Start the local database, Redis, Meilisearch, and Python AI service using Docker Compose.
2. Initialize local prisma clients:
   ```bash
   npx prisma generate --schema=./modules/m02-conversation-intelligence/prisma/schema.prisma
   ```
3. Run the database migrations locally:
   ```bash
   npx prisma migrate dev --schema=./modules/m02-conversation-intelligence/prisma/schema.prisma
   ```
4. Start the NestJS background workers:
   ```bash
   npm run start:dev m02-worker
   ```

---

## 10. Operational & Troubleshooting Notes

### Common Failure Modes
- **Scoring Gating Delays:** If `revenue_graph.entity.linked` is delayed, call scoring is queued as a delayed job for up to 5 minutes (`CALL_SCORE_DELAY_MS` = 300,000ms) before scoring with fallback parameters.
- **AI Service Timeouts:** Model inference endpoints may time out under load. BullMQ is configured with exponential backoff retries to resolve transient errors.
- **Low-Confidence Suppression:** Detections with confidence scores below `0.70` are silently excluded from downstream Deal Drivers boards, although they remain stored in `tracker_detections`.

---

## 11. Related Docs

- **System Architecture Document (SAD):** Core platform patterns, data models, and monorepo workspaces.
- **M2 Feature TDDs:** Comprehensive engineering designs located in the `/TDD/` subfolder.
- **Event Schema Registry:** Complete event registries and BullMQ queue definitions.