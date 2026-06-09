# Doc #11b — Technical Design Document (TDD): Ask Anything

## 1. Document Control

- **Document Title:** Technical Design Document — Ask Anything
- **Feature Name:** Ask Anything (Conversational RAG Search)
- **Module Name:** M3 AI Summaries & GenAI
- **Workspace Directory:** `modules/m03-ai-summaries-genai/`
- **Owner:** Product Engineering — M3
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales teams, managers, and customer success agents waste massive amounts of time opening historical recordings, reading dozens of meeting transcripts, or digging through CRM logs to answer simple natural-language questions about customer accounts. Ask Anything bridges this gap by providing an intuitive conversational interface inside R-Revenue Intelligence that instantly searches, retrieves, and synthesizes answers grounded directly in interactions and deal context.

### What this feature does
Ask Anything is a conversational interface that enables users to query their entire workspace interaction database using natural language. Using Retrieval-Augmented Generation (RAG) backed by a hybrid search engine (Meilisearch keyword search merged with pgvector semantic similarity), the system locates relevant conversation passages, call summaries, and email records. It then synthesizes an answer that cites the specific underlying calls and snippets as evidence chips.

### Value Proposition
- Reduces manual interaction search time to zero.
- Ensures absolute factual grounding through explicit source citations.
- Empowers representatives to quickly prepare for calls by querying client interaction histories.
- Maintains user session continuity, allowing progressive follow-up questions within the same workspace, deal, or account scope.

---

## 3. Scope & Dependencies

### In Scope
- Contextual natural-language question answering scoped by tenant and user access privileges.
- Hybrid search (Meilisearch + pgvector) context retrieval over call transcripts, summaries, and email histories.
- Inline and block citations highlighting source calls, speakers, and segments.
- Conversational session tracking and progressive multi-turn follow-up history.
- Dynamic query interpretation mapping questions to specific entity scopes (e.g. deals, accounts, reps).

### Out of Scope
- Multi-call async report writing; that belongs exclusively to AI Deep Researcher.
- General internet search or queries unrelated to captured workspace interactions.
- Direct execution of system actions (e.g. "update opportunity stage to closed-won").

### Upstream Dependencies
- **M1 Capture & Transcription:** Supplies meeting audio transcripts and maintains the shared platform `semantic_embeddings` table.
- **M2 Conversation Intelligence:** Provides topic tags and tracker detections as metadata context.
- **M10 Data & Compliance (Revenue Graph):** Supplies permission models, deal structures, and account relationships.

### Downstream Consumers
- **Frontend chat component:** Provides the interactive conversational UI panels.
- **Auditing/Compliance tools:** To audit generated answers and citation validity.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m03-ai-summaries-genai`.

### POST /api/v1/m03-ai-summaries-genai/ask
- **Description:** Submit a conversational RAG question and return a grounded cited response.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Request Payload:**
  ```json
  {
    "question": "What pricing concerns were raised by the Acme champion last week?",
    "sessionId": "optional-session-uuid",
    "dealId": "optional-deal-filter-uuid",
    "accountId": "optional-account-filter-uuid",
    "filters": {
      "dateRange": {
        "start": "2026-05-10T00:00:00Z",
        "end": "2026-05-17T23:59:59Z"
      }
    }
  }
  ```
- **Response Payload (`200 OK`):**
  ```json
  {
    "sessionId": "uuid",
    "text": "The Acme champion, Sarah, raised concerns about the expansion pricing, specifically asking if a 15% volume discount could be applied if they commit to a 3-year enterprise term [1].",
    "sources": [
      {
        "citationIndex": 1,
        "sourceType": "transcript",
        "entityId": "call-uuid",
        "callId": "call-uuid",
        "speaker": "Sarah Jenkins",
        "snippet": "...if we do three years, does the price drop to the volume tier?...",
        "timestampStart": 345,
        "timestampEnd": 360
      }
    ],
    "confidenceScore": 0.88,
    "grounded": true
  }
  ```

### GET /api/v1/m03-ai-summaries-genai/ask/sessions/:id
- **Description:** Retrieve the complete conversational message history for a query session.
- **Response Payload (`200 OK`):**
  ```json
  {
    "sessionId": "uuid",
    "tenantId": "uuid",
    "createdAt": "2026-05-18T23:43:19Z",
    "messages": [
      {
        "messageId": "uuid",
        "role": "user",
        "content": "What pricing concerns were raised by the Acme champion last week?",
        "createdAt": "2026-05-18T23:43:19Z"
      },
      {
        "messageId": "uuid",
        "role": "assistant",
        "content": "The Acme champion, Sarah, raised concerns about the expansion pricing...",
        "citedSources": [
          {
            "sourceType": "transcript",
            "entityId": "call-uuid",
            "snippet": "...volume tier?..."
          }
        ],
        "createdAt": "2026-05-18T23:43:45Z"
      }
    ]
  }
  ```

---

## 5. RAG Retrieval & Hybrid Search Architecture

Ask Anything uses **hybrid retrieval** by default, controlled via `RETRIEVAL_ENABLE_HYBRID_SEARCH = true`. The search controller executes dual retrieval pathways in parallel to ensure high semantic recall and absolute keyword precision:

1. **Semantic pgvector Search:**
   - The user query is converted into a vector representation using the `text-embedding-3-small` model (`OPENAI_MODEL_EMBEDDINGS`).
   - The system executes a vector cosine similarity search over `m03_ai_summaries_genai.semantic_embeddings` filtered strictly by `tenant_id` up to `PGVECTOR_TOP_K_ASK` (Default: `20` chunks).
2. **Full-Text Keyword Search (Meilisearch):**
   - The query is dispatched to Meilisearch using the `MEILISEARCH_URL` and `MEILISEARCH_API_KEY` configurations.
   - The search matches exact terms, product names, acronyms, and proper nouns.
3. **Merge and Rank:**
   - Chunks are aggregated, deduplicated using their primary key IDs, and re-ranked using Reciprocal Rank Fusion (RRF).
   - The top 20 highest-ranking context passages are injected into the final LLM prompt context block (`RETRIEVAL_MAX_SOURCE_CHUNKS = 20`).
   - If Meilisearch is unavailable, the RAG engine automatically falls back to pgvector-only search to preserve uptime.

---

## 6. Database Schema Design

All tables reside under the `m03_ai_summaries_genai` PostgreSQL schema.

```sql
-- 1. Query Sessions Table
CREATE TABLE m03_ai_summaries_genai.query_sessions (
  session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  context_deal_id     UUID NULL,
  context_account_id  UUID NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Query Messages Table (Drift #2 Resolution)
CREATE TABLE m03_ai_summaries_genai.query_messages (
  message_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES m03_ai_summaries_genai.query_sessions(session_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  role                VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
  content             TEXT NOT NULL,
  cited_sources       JSONB NULL, -- Array of source objects containing citation details
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & security
CREATE INDEX idx_query_sessions_tenant ON m03_ai_summaries_genai.query_sessions (tenant_id, user_id);
CREATE INDEX idx_query_messages_session ON m03_ai_summaries_genai.query_messages (session_id, tenant_id);
```

---

## 7. AI Prompt & Grounding Guardrails

### Model Choice & Prompt Pinning
- Ask Anything utilizes `gpt-4o` (`OPENAI_MODEL_ASK`) to generate high-fidelity responses.
- Prompt configurations are version-pinned (`PROMPT_VERSION_ASK = v1`).
- Prompts enforce strict JSON output formatting (`PROMPT_STRICT_JSON = true`).

### Hallucination Prevention & Refusal Rules
- **Evidence Gating:** The LLM is strictly prohibited from answering using out-of-context pre-training knowledge. Factual claims must be directly grounded in the provided retrieved chunks.
- **Graceful Refusal:** If the hybrid search returns no matching chunks or the evidence set is insufficient to answer the query, the LLM must return a standard response: *"I could not find enough evidence in our conversations to answer this question."*
- **No Source Fabrication:** The LLM must not invent references, speakers, or dates. All citations must map to actual source IDs present in the retrieval payload.

---

## 8. Data Governance & Session Retention (Drift #12 Resolution)

To ensure compliance with client data agreements, GDPR regulations, and storage costs, Ask Anything enforces a strict data retention and cascading cleanup policy:

- **Default Session Lifespan:** Conversational query sessions are retained for exactly **90 days** by default (configured via `SESSION_RETENTION_DEFAULT_DAYS = 90`).
- **Configurability:** Tenants can customize the retention window to `30`, `60`, `90`, or `180` days via workspace dashboard settings.
- **Hard Platform Cap:** A global platform ceiling of **365 days** is enforced. No tenant can retain chat history beyond this period.
- **Cascading Deletions:** A nightly cron job executes cleanup runs:
  ```sql
  DELETE FROM m03_ai_summaries_genai.query_sessions 
  WHERE updated_at < NOW() - INTERVAL '1 day' * :tenantRetentionDays;
  ```
  All associated messages in `m03_ai_summaries_genai.query_messages` are automatically removed via the database `ON DELETE CASCADE` constraint.

---

## 9. Security & Tenant Isolation

- **Authentication Interceptor:** All incoming requests are intercepted to verify active authorization. A user cannot query or read messages from a session unless they possess valid access.
- **RLS & Scoping:** The `X-Tenant-ID` is verified against the user's token session. Every database call and search index query joins on `tenant_id`, ensuring absolute data isolation between customers.
- **Sensitive Signal Masking:** If a retrieved chunk contains restricted metadata or matches a contact whom the querying user does not have permission to view, the RAG engine redacts that specific segment before assembling the prompt context.
