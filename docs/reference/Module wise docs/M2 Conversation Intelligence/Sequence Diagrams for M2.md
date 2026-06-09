# Doc #14 — Sequence Diagrams for M2 Conversation Intelligence

This document defines the approved sequence diagrams for the **M2 Conversation Intelligence** module. All workflows within this module are designed to be **asynchronous, event-driven, and resilient**. Every flow illustrates the upstream event or request, queue handoff, background worker execution, private AI service call, PostgreSQL/Meilisearch persistence, and downstream event publication.

---

## SD-01 — Revenue Graph Event to AI Call Reviewer to `call.scored`

### Purpose
This diagram shows how a completed call transcript is evaluated and scored by the AI Call Reviewer once Revenue Graph context becomes available from M10. The scoring worker enqueues the transcript upon M1 completion but waits up to 5 minutes for entity linkage context to select the correct deal-specific or account-specific scorecard template before persisting the final call score.

### Actors
- **M1** (Capture & Transcription) — Upstream transcript generator.
- **M10** (Data & Compliance / Revenue Graph) — Centralized data sync and CRM relationship owner.
- **M2** (Conversation Intelligence / BullMQ) — Message queue and worker engine.
- **AI Services Layer** — Python FastAPI microservice (`POST /internal/score-call`).
- **PostgreSQL** — Stores scorecard metadata and results in the `m02_conversation_intelligence` schema.
- **Event Bus** — Standard event router.
- **M9** (Coaching & Training) — Downstream consumer of scored call metrics.

### Preconditions
- A call transcript exists and has been successfully recorded in PostgreSQL.
- At least one active scorecard is configured for the tenant.
- BullMQ workers are running.

### Mermaid Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant M1 as M1 Capture & Transcription
    participant M2 as M2 Conversation Intelligence
    participant Q as BullMQ Scoring Queue
    participant W as Scoring Worker
    participant M10 as M10 Data & Compliance
    participant AI as AI Services Layer
    participant DB as PostgreSQL
    participant EVT as Event Bus
    participant M9 as M9 Coaching & Training

    M1->>EVT: Emit call.transcription.completed
    EVT->>M2: Deliver call.transcription.completed
    M2->>Q: Enqueue delayed score-call job (CALL_SCORE_DELAY_MS = 300000)

    M10->>EVT: Emit revenue_graph.entity.linked
    EVT->>M2: Deliver revenue_graph.entity.linked
    M2->>Q: Promote score-call job to active immediately

    Q->>W: Start score-call job
    W->>DB: Read transcript, scorecard, & Revenue Graph context
    W->>AI: POST /internal/score-call (JSON Payload)
    AI-->>W: Return structured score, evidence, and confidence
    W->>DB: Insert call_scores (m02_conversation_intelligence schema)
    W->>EVT: Emit call.scored (EventEnvelope)
    EVT->>M9: Deliver call.scored to Coaching
```

---

## SD-02 — Revenue Graph Event to AI Topic Tagger to `call.topics.tagged`

### Purpose
This diagram shows how M2 tags a call transcript with structured, high-accuracy discussion topics (e.g. pricing, competitor, product issues) after transcription completes. This tagging enriches Meilisearch indexes and allows downstream filters to work.

### Actors
- **M1** (Capture & Transcription) — Upstream transcript generator.
- **M10** (Data & Compliance) — Upstream Revenue Graph entity router.
- **M2** (Conversation Intelligence / BullMQ) — Message queue and topic tagging worker.
- **AI Services Layer** — Python FastAPI microservice (`POST /internal/tag-topics`).
- **PostgreSQL** — Stores topic tags in `m02_conversation_intelligence.topic_tags`.
- **Event Bus** — Standard event router.
- **M3** (AI Summaries & GenAI) — Downstream consumer for taxonomy search indexing.

### Mermaid Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant M1 as M1 Capture & Transcription
    participant EVT as Event Bus
    participant M2 as M2 Conversation Intelligence
    participant Q as BullMQ Topic Queue
    participant W as Topic Worker
    participant M10 as M10 Data & Compliance
    participant AI as AI Services Layer
    participant DB as PostgreSQL
    participant M3 as M3 AI Summaries & GenAI

    M1->>EVT: Emit call.transcription.completed
    EVT->>M2: Deliver call.transcription.completed
    M2->>Q: Enqueue tag-topics job

    M10->>EVT: Emit revenue_graph.entity.linked
    EVT->>M2: Deliver revenue_graph.entity.linked

    Q->>W: Start tag-topics job
    W->>DB: Read transcript, speaker segments, & taxonomy rules
    W->>AI: POST /internal/tag-topics
    AI-->>W: Return topics, timestamps, & confidence scores
    W->>DB: Insert topic_tags (m02_conversation_intelligence schema)
    W->>EVT: Emit call.topics.tagged (EventEnvelope)
    EVT->>M2: Deliver to Search Index Worker
    EVT->>M3: Deliver for summary extraction
```

---

## SD-03 — Batch Theme Analysis Flow (AI Theme Spotter)

### Purpose
This diagram shows the asynchronous batch theme analysis process. A user triggers theme clustering across many calls via the API, which runs as a long-running background job via BullMQ.

### Actors
- **Admin User** — Initiates the batch theme spotter request.
- **Frontend** — Captures inputs and polls for results.
- **M2 API** — Exposes `/api/v1/m02-conversation-intelligence/theme-analyses`.
- **PostgreSQL** — Stores theme data in `m02_conversation_intelligence.theme_analyses` & `themes`.
- **BullMQ Theme Queue** — Manages job persistence.
- **AI Services Layer** — Python FastAPI microservice (`POST /internal/detect-themes`).

### Mermaid Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant U as Admin User
    participant FE as Frontend
    participant M2 as M2 API
    participant DB as PostgreSQL
    participant Q as BullMQ Theme Queue
    participant W as Theme Worker
    participant AI as AI Services Layer

    U->>FE: Submit batch theme analysis request
    FE->>M2: POST /api/v1/m02-conversation-intelligence/theme-analyses (filters, query)
    M2->>DB: Insert theme_analyses (status=queued)
    M2->>Q: Enqueue detect-themes job
    M2-->>FE: Return analysisId (HTTP 202 Accepted)

    Q->>W: Start detect-themes job
    W->>DB: Read matching transcripts and filtering metadata
    W->>AI: POST /internal/detect-themes (payload containing transcripts)
    AI-->>W: Return clustered themes, summaries, & counts
    W->>DB: Insert clustered theme rows
    W->>DB: Update theme_analyses (status=completed)

    FE->>M2: Poll GET /api/v1/m02-conversation-intelligence/theme-analyses/:id
    M2->>DB: Read theme_analyses and associated themes
    M2-->>FE: Return finished theme report JSON
```

---

## SD-04 — Tracker Detection Flow (`tracker.detection.created`)

### Purpose
This diagram shows how M2 detects semantic business signals (e.g. pricing risk, objections) from call transcripts and outbound emails. It uses intent-based NLP classification rather than plain keyword searches, and enriches results once M10 Revenue Graph metadata is linked.

### Actors
- **M1** (Capture & Transcription) — Generates call transcripts.
- **M8** (Sales Engagement) — Generates outbound email text.
- **M10** (Data & Compliance) — Links entities in the Revenue Graph.
- **M2** (Conversation Intelligence / BullMQ) — Handles tracker queuing and execution.
- **AI Services Layer** — Python FastAPI microservice (`POST /internal/detect-trackers`).
- **PostgreSQL** — Stores detections in `m02_conversation_intelligence.tracker_detections`.
- **M3** (AI Summaries & GenAI) — Downstream consumer for risk flags.

### Mermaid Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant M1 as M1 Capture & Transcription
    participant M8 as M8 Sales Engagement
    participant EVT as Event Bus
    participant M2 as M2 Conversation Intelligence
    participant Q as BullMQ Tracker Queue
    participant W as Tracker Worker
    participant AI as AI Services Layer
    participant DB as PostgreSQL
    participant M10 as M10 Data & Compliance
    participant M3 as M3 AI Summaries & GenAI

    M1->>EVT: Emit call.transcription.completed
    M8->>EVT: Emit email.sent
    EVT->>M2: Deliver transcription or email event
    M2->>Q: Enqueue tracker detection job

    Q->>W: Start detect-trackers job
    W->>DB: Read transcript/email and published tracker definitions
    W->>AI: POST /internal/detect-trackers
    AI-->>W: Return matched detections, snippets, and confidence
    W->>DB: Insert tracker_detections (m02_conversation_intelligence schema)
    W->>EVT: Emit tracker.detection.created (EventEnvelope)
    EVT->>M3: Deliver for risk summary generation

    M10->>EVT: Emit revenue_graph.entity.linked
    EVT->>M2: Deliver revenue_graph.entity.linked
    M2->>DB: Update tracker_detections with deal_id/account_id context
```

---

## SD-05 — Search Indexing and Hybrid Query Flow

### Purpose
This diagram shows how conversation text and AI-derived signals (topics, trackers) are indexed in Meilisearch and pgvector, and how a user's hybrid query merges full-text and semantic vector scores.

### Actors
- **M2 API** & **Index Worker** — Controls search queries and transforms records.
- **Meilisearch** — Handles high-performance full-text search.
- **AI Services Layer** — Generates embeddings via `POST /internal/generate-embeddings`.
- **PostgreSQL (pgvector)** — Performs similarity searches.
- **Frontend** — Initiates library queries.

### Mermaid Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant EVT as Event Bus
    participant M2 as M2 API / Worker
    participant Q as BullMQ Index Queue
    participant W as Index Worker
    participant AI as AI Services Layer
    participant MS as Meilisearch
    participant VDB as pgvector Store (PostgreSQL)
    participant FE as Frontend User

    EVT->>M2: Deliver call.transcription.completed or call.topics.tagged
    M2->>Q: Enqueue search-indexing job

    Q->>W: Start indexing job
    W->>MS: Upsert searchable text document, topics, and filters
    W->>AI: POST /internal/generate-embeddings (text snippet)
    AI-->>W: Return high-dimensional embedding vector
    W->>VDB: Store vector in pgvector index (m02_conversation_intelligence schema)
    W->>M2: Update search_index_sync_log

    FE->>M2: GET /api/v1/m02-conversation-intelligence/conversations/search?q=query
    par Full-Text Search
        M2->>MS: Search query with filters
        MS-->>M2: Return keyword matches
    and Semantic Similarity Search
        M2->>AI: POST /internal/generate-embeddings (query string)
        AI-->>M2: Return query embedding vector
        M2->>VDB: Query similarity (pgvector cosine distance)
        VDB-->>M2: Return semantic matches
    end
    M2->>M2: Merge, rank, and deduplicate scores
    M2-->>FE: Return ranked, highly relevant conversation list
```

---

## SD-06 — Transcript Correction and Translation Flow

### Purpose
This diagram shows how vocabulary corrections are registered and applied, and how user translation preferences localize transcripts via background workers.

### Actors
- **Admin User** — Defines business vocabulary rules.
- **M1** (Capture & Transcription) — Receives vocab rules.
- **M2 API** — Exposes `/api/v1/m02-conversation-intelligence/translations/:id`.
- **BullMQ Translation Queue** — Enqueues translation work.
- **AI Services Layer** — Python FastAPI microservice (`POST /internal/translate`).
- **PostgreSQL** — Stores translations in `m02_conversation_intelligence.translated_texts`.

### Mermaid Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant A as Admin User
    participant FE as Frontend
    participant M1 as M1 Capture & Transcription
    participant M2 as M2 Conversation Intelligence
    participant Q as BullMQ Translation Queue
    participant W as Translation Worker
    participant DB as PostgreSQL
    participant AI as AI Services Layer
    participant U as End User

    A->>FE: Create vocabulary correction rule
    FE->>M1: POST /api/v1/m01-capture-transcription/vocabulary
    M1->>DB: Insert vocabulary_corrections (m01_capture_transcription schema)

    U->>FE: Trigger translation request
    FE->>M2: Enqueue translation job
    M2->>Q: Enqueue translation job
    Q->>W: Start translation job
    W->>DB: Read corrected transcript & vocabulary rules
    W->>DB: Read translation_preferences
    W->>W: Apply vocabulary correction filters
    W->>AI: POST /internal/translate (corrected text, target language)
    AI-->>W: Return translated output text
    W->>DB: Store in translated_texts (m02_conversation_intelligence schema)

    U->>FE: Read translated transcript content
    FE->>M2: GET /api/v1/m02-conversation-intelligence/translations/:id
    M2->>DB: Read translated_texts
    M2-->>FE: Return localized, corrected transcript text
```
