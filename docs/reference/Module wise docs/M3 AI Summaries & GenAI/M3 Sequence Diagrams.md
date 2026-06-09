# Doc #19 — M3 Sequence Diagrams

## 1. Document Control

- **Document Title:** Sequence Diagrams — M3 AI Summaries & GenAI
- **Module:** M3 AI Summaries & GenAI
- **Owner:** Tech Lead / AI Lead / Backend Lead
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. SD-01: Async Call Summary Generation

This diagram illustrates the asynchronous workflow triggered when a call transcript is finalized, resulting in structured summary generation, confidence-score validation, normalized evidence linking, and event emission.

```mermaid
sequenceDiagram
    autonumber
    participant Bus as Message Bus (BullMQ)
    participant M3_Wrk as M3 Background Worker
    participant M3_DB as M3 Postgres DB
    participant M10_API as M10 Data & Compliance API
    participant AI_Svc as Python AI Services Layer
    participant M3_Bus as Message Bus (BullMQ)

    Bus->>M3_Wrk: Consume call.transcription.completed (eventId, tenantId, callId)
    activate M3_Wrk
    M3_Wrk->>M3_DB: Fetch raw transcript chunks & speaker segments
    M3_DB-->>M3_Wrk: Return transcript details
    
    M3_Wrk->>M10_API: GET /api/v1/m10-data-compliance/deals/scoped (tenantId, callId)
    M10_API-->>M3_Wrk: Return Revenue Graph context (dealId, accountId, contactId)

    M3_Wrk->>AI_Svc: POST /v1/summarize (query, rawTranscript, context)
    activate AI_Svc
    AI_Svc-->>M3_Wrk: Return JSON summary & confidenceScore (e.g. 0.85)
    deactivate AI_Svc

    Note over M3_Wrk, M3_DB: Standardize tables as snake_case in m03_ai_summaries_genai
    M3_Wrk->>M3_DB: Write to m03_ai_summaries_genai.call_summaries (write latest version)
    M3_Wrk->>M3_DB: Write to m03_ai_summaries_genai.summary_evidence_links (store citations)
    M3_Wrk-->>M3_DB: Durable write complete

    alt Confidence Score < 0.70 (Review Flagged)
        M3_Wrk->>M3_DB: Update flagged_for_review = true, block CRM auto-sync
    end

    M3_Wrk->>M3_Bus: Emit call.summary.generated (eventId, summaryId, callId, tenantId, confidenceScore, flaggedReview)
    deactivate M3_Wrk
```

---

## 3. SD-02: Ask Anything Conversational Chat (RAG)

This diagram describes the real-time RAG query flow, which merges pgvector semantic search and Meilisearch full-text search (hybrid retrieval), performs prompt assembly, generates answers with cited sources, and tracks session message history.

```mermaid
sequenceDiagram
    autonumber
    actor User as Public Web UI
    participant M3_Ctrl as M3 Ask Controller
    participant M3_DB as M3 Postgres DB
    participant Meili as Meilisearch Instance
    participant AI_Svc as Python AI Services Layer

    User->>M3_Ctrl: POST /api/v1/m03-ai-summaries-genai/ask (tenantId, question, sessionId, filters)
    activate M3_Ctrl
    M3_Ctrl->>M3_DB: Validate session & fetch prior turn history (query_sessions / query_messages)
    M3_DB-->>M3_Ctrl: Return session state & message history

    M3_Ctrl->>AI_Svc: POST /v1/embed (normalize and generate query embeddings)
    activate AI_Svc
    AI_Svc-->>M3_Ctrl: Return vector query representation
    deactivate AI_Svc

    par 1. Semantic pgvector search
        M3_Ctrl->>M3_DB: SELECT * FROM m03_ai_summaries_genai.semantic_embeddings WHERE tenant_id = :tenantId ORDER BY vector <=> :queryVector LIMIT 20
        M3_DB-->>M3_Ctrl: Return top 20 semantic chunks
    and 2. Full-text keyword search (if RETRIEVAL_ENABLE_HYBRID_SEARCH = true)
        M3_Ctrl->>Meili: Search Meilisearch index with question & filters
        Meili-->>M3_Ctrl: Return top keyword chunks
    end

    M3_Ctrl->>M3_Ctrl: Merge, deduplicate, and rank chunks (top 20 max context)
    M3_Ctrl->>AI_Svc: POST /v1/answer-query (query, rankedChunks, history)
    activate AI_Svc
    AI_Svc-->>M3_Ctrl: Return grounded response & citedSources array
    deactivate AI_Svc

    M3_Ctrl->>M3_DB: Write User & Assistant turns to m03_ai_summaries_genai.query_messages (messageId, sessionId, content, citedSources)
    M3_DB-->>M3_Ctrl: Message write durable

    M3_Ctrl-->>User: Return Ask Anything Response (text, citedSources, sessionId)
    deactivate M3_Ctrl
```

---

## 4. SD-03: AI Deep Researcher Async Workflow

This diagram outlines the long-running async research report workflow. It accepts a query, registers a queued report row, schedules the multi-step reasoning worker, indexes/batches evidence, generates structured findings, and notifies downstream consumers via Message Bus.

```mermaid
sequenceDiagram
    autonumber
    actor User as Public Web UI
    participant M3_Ctrl as M3 Research Controller
    participant M3_DB as M3 Postgres DB
    participant Bus as Message Bus (BullMQ)
    participant M3_Wrk as M3 Research Worker
    participant AI_Svc as Python AI Services Layer

    User->>M3_Ctrl: POST /api/v1/m03-ai-summaries-genai/research (tenantId, question, filters)
    activate M3_Ctrl
    M3_Ctrl->>M3_DB: Write m03_ai_summaries_genai.research_reports (status = queued)
    M3_DB-->>M3_Ctrl: Return reportId
    M3_Ctrl->>Bus: Enqueue background research job (reportId, tenantId)
    M3_Ctrl-->>User: Return 202 Accepted (reportId, status = queued)
    deactivate M3_Ctrl

    Bus->>M3_Wrk: Dequeue and process research job (reportId)
    activate M3_Wrk
    M3_Wrk->>M3_DB: Update research_reports set status = running
    
    M3_Wrk->>M3_DB: Retrieve call summaries, transcripts, emails & metadata (up to 100 sources)
    M3_DB-->>M3_Wrk: Return evidence candidates

    Note over M3_Wrk, AI_Svc: Multi-step reasoning: Planning, Clustering, Batch Synthesis, global report assembly
    M3_Wrk->>AI_Svc: POST /v1/generate-report (question, filters, rawEvidenceCandidates)
    activate AI_Svc
    AI_Svc-->>M3_Wrk: Return structured report JSON (Executive Summary, Key Findings, Caveats, Actions)
    deactivate AI_Svc

    M3_Wrk->>M3_DB: Update m03_ai_summaries_genai.research_reports (status = completed, result_text)
    M3_DB-->>M3_Wrk: Report persistence complete
    
    M3_Wrk->>Bus: Emit research.report.completed (eventId, reportId, tenantId, createdBy, status = completed)
    deactivate M3_Wrk
```

---

## 5. SD-04: Downstream Consumption of Call Summary Generated

This diagram tracks how downstream modules react asynchronously when M3 publishes a `call.summary.generated` event on the Message Bus.

```mermaid
sequenceDiagram
    autonumber
    participant Bus as Message Bus (BullMQ)
    participant M10_Wrk as M10 CRM Sync Worker
    participant M4_Wrk as M4 Deal Intelligence Worker
    participant M9_Wrk as M9 Coaching Worker

    Note over Bus: Event call.summary.generated published

    par 1. Sync Summary Notes to CRM
        Bus->>M10_Wrk: Consume call.summary.generated
        activate M10_Wrk
        M10_Wrk->>M10_Wrk: Resolve external CRM authorization scopes
        M10_Wrk->>M10_Wrk: Push summarized call notes & action items into Salesforce/HubSpot API
        deactivate M10_Wrk
    and 2. Update Deal Health Scorecard
        Bus->>M4_Wrk: Consume call.summary.generated
        activate M4_Wrk
        M4_Wrk->>M4_Wrk: Scan summary risks and next-step alignment
        M4_Wrk->>M4_Wrk: Recalculate deal progress drivers & health indicator card
        deactivate M4_Wrk
    and 3. Scan for Agent Coaching Opportunities
        Bus->>M9_Wrk: Consume call.summary.generated
        activate M9_Wrk
        M9_Wrk->>M9_Wrk: Match customer objections & rep responses in summary
        M9_Wrk->>M9_Wrk: Append recommended enablement/coaching materials to rep dashboard
        deactivate M9_Wrk
    end
```

---

## 6. SD-05: Deal Brief Refresh Flow via Tracker Detections

This diagram illustrates how changes in customer interactions trigger a debounced deal brief refresh in M3. When a tracker detection is created, a debounced job is scheduled to wait for consecutive calls, preventing database/LLM write-flooding.

```mermaid
sequenceDiagram
    autonumber
    participant Bus as Message Bus (BullMQ)
    participant M3_Wrk as M3 Brief Worker
    participant M3_DB as M3 Postgres DB
    participant AI_Svc as Python AI Services Layer

    Bus->>M3_Wrk: Consume tracker.detection.created (eventId, tenantId, dealId)
    activate M3_Wrk
    Note over M3_Wrk: Check if deal refresh job is already scheduled (Debounce check)
    
    alt Refresh Job Exists & Active (Within 5-minute debounce window)
        M3_Wrk-->>M3_Wrk: Extend debounce timer, ignore redundant immediate processing
    else No Scheduled Refresh (or Debounce Window Expires)
        M3_Wrk->>M3_Wrk: Schedule BullMQ background delay (Wait 5 minutes for additional meeting notes)
        Note over M3_Wrk: Debounce delay complete, start processing...
        
        M3_Wrk->>M3_DB: Retrieve latest 5 call summaries, emails & active trackers for dealId
        M3_DB-->>M3_Wrk: Return opportunity signal details
        
        M3_Wrk->>AI_Svc: POST /v1/summarize (context = deal, sources = briefs & calls)
        activate AI_Svc
        AI_Svc-->>M3_Wrk: Return refreshed deal brief text
        deactivate AI_Svc
        
        M3_Wrk->>M3_DB: Update m03_ai_summaries_genai.deal_briefs (dealId, status = updated)
        M3_DB-->>M3_Wrk: Durable write complete
    end
    deactivate M3_Wrk
```
