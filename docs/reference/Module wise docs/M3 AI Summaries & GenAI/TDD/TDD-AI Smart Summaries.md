# Doc #11a — Technical Design Document (TDD): AI Smart Summaries

## 1. Document Control

- **Document Title:** Technical Design Document — AI Smart Summaries
- **Feature Name:** AI Smart Summaries (Call Summaries, Deal Briefs, Account Briefs)
- **Module Name:** M3 AI Summaries & GenAI
- **Workspace Directory:** `modules/m03-ai-summaries-genai/`
- **Owner:** Product Engineering — M3
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales reps and managers spend hours listening to recorded calls, reading transcript files, and trying to write recap notes for external CRM platforms. Crucial deal warnings, competitor updates, and follow-up commitments are frequently lost or delayed. AI Smart Summaries automates the creation of high-fidelity, structured summaries of customer interactions, saving time and improving data precision across opportunities and accounts.

### What this feature does
AI Smart Summaries dynamically synthesizes meeting inputs and CRM context into three core intelligence artifacts:
1. **AI Call Summaries:** Structure-mapped summaries of individual sales calls, highlighting customer feedback, pain points, competitor mentions, and next-step actions.
2. **AI Deal Briefs:** A debounced, aggregated brief of active sales opportunities combining the latest call summaries, emails, and active tracker flags.
3. **AI Account Briefs:** A strategic synthesis of overall account relationships, sentiment trends, and organizational health.

### Value Proposition
- Eliminates manual transcription analysis for revenue professionals.
- Accelerates executive deal reviews by aggregating raw signals into digestible briefings.
- Drives downstream automation and trigger-playbooks in CRM sync workflows.
- Lowers risk by automatically detecting and highlighting buyer friction or objections.

---

## 3. Scope & Dependencies

### In Scope
- Automatic background generation of a Call Summary upon receipt of call transcription event.
- Debounced, async updates of Deal and Account Briefs when new interaction data is captured.
- Storage of citation links mapping summary findings directly back to raw transcript passages.
- Manual trigger API for summary regeneration.
- Confidence-score evaluation, review gating, and CRM auto-sync blocking.

### Out of Scope
- Ephemeral in-call workspace notes or real-time assistance.
- Multi-call research reports on custom topics; those belong exclusively to AI Deep Researcher.
- General chat queries across multiple deals; those belong exclusively to Ask Anything.

### Upstream Dependencies
- **M1 Capture & Transcription:** Emits `call.transcription.completed` and provides meeting audio transcripts.
- **M2 Conversation Intelligence:** Emits `tracker.detection.created` and `call.topics.tagged` for thematic tagging.
- **M10 Data & Compliance (Revenue Graph):** Supplies account, deal, and stakeholder boundaries.

### Downstream Consumers
- **M4 Deal Intelligence / M5 Account Intelligence:** For pipeline card metrics and dashboard updates.
- **M8 Sales Engagement:** Pre-filling email composers and sequencing playbooks.
- **M10 Data & Compliance:** Subscribes to `call.summary.generated` to sync meeting summaries to external CRM systems (Salesforce/HubSpot).

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m03-ai-summaries-genai`.

### GET /api/v1/m03-ai-summaries-genai/calls/:id/summary
- **Description:** Retrieve the active call summary for a specific call.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Response Payload (`200 OK`):**
  ```json
  {
    "summaryId": "uuid",
    "callId": "uuid",
    "tenantId": "uuid",
    "version": 1,
    "confidenceScore": 0.85,
    "flaggedForReview": false,
    "executiveSummary": "Acme is interested in expanding their seat count but raised concerns regarding pricing flexibility...",
    "keyObjections": [
      {
        "category": "pricing",
        "description": "Acme requested a 15% discount for a 3-year term contract commitment."
      }
    ],
    "actionItems": [
      {
        "assignee": "rep-uuid",
        "task": "Send custom multi-year price quote",
        "dueDate": "2026-05-22"
      }
    ],
    "competitors": ["CompetitorX", "CompetitorY"],
    "updatedAt": "2026-05-18T23:43:19Z"
  }
  ```

### POST /api/v1/m03-ai-summaries-genai/calls/:id/summary/regenerate
- **Description:** Explicitly trigger an asynchronous background regeneration job.
- **Response Payload (`202 Accepted`):**
  ```json
  {
    "jobId": "bullet-job-uuid",
    "status": "queued",
    "createdAt": "2026-05-18T23:43:19Z"
  }
  ```

---

## 5. Functional Flow & Debounce Orchestration

### Call Summary Flow
1. **M1** emits `call.transcription.completed`.
2. M3 background worker validates tenant context and fetches raw transcript from M1 database.
3. Worker sends transcript and Revenue Graph metadata to FastAPI AI Services Layer via `POST /v1/summarize`.
4. FastAPI evaluates the prompt using the `gpt-4o-mini` model, returning structured JSON and an extraction confidence score.
5. The worker parses the response:
   - If confidence score is `< 0.70` (configured via `SUMMARY_CONFIDENCE_MIN`), set `flagged_for_review = true` and lock down auto-sync behavior (`ENABLE_FLAGGED_FOR_REVIEW_WRITE_GUARD`).
   - Store the summary record under `m03_ai_summaries_genai.call_summaries`.
   - Store citation links mapping summary findings directly back to raw transcript passages in `m03_ai_summaries_genai.summary_evidence_links`.
6. Emit a `call.summary.generated` event via Redis/BullMQ.

### Deal Brief Debouncing Flow (SD-05)
To prevent LLM token waste, the M3 Brief Worker debounces deal brief regenerations:
- When a `tracker.detection.created` event is consumed, M3 checks if a deal brief refresh job is already scheduled.
- If a job exists, the debounce timer is extended, preventing redundant generations.
- Once the 5-minute debounce window expires without further triggers, the worker pulls the last 5 call summaries, emails, and active trackers from `m03_ai_summaries_genai` and updates `m03_ai_summaries_genai.deal_briefs`.

---

## 6. Database Schema Design

All tables are defined inside the monorepo at `modules/m03-ai-summaries-genai/prisma/schema.prisma` under the `m03_ai_summaries_genai` PostgreSQL schema.

```sql
-- Create Schema Namespace
CREATE SCHEMA IF NOT EXISTS m03_ai_summaries_genai;

-- 1. Call Summaries Table
CREATE TABLE m03_ai_summaries_genai.call_summaries (
  summary_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id             UUID UNIQUE NOT NULL,
  tenant_id           UUID NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  confidence_score    NUMERIC(3,2) NOT NULL,
  flagged_for_review  BOOLEAN NOT NULL DEFAULT false,
  executive_summary   TEXT NOT NULL,
  key_objections      JSONB NULL, -- Array of objects: category, description
  action_items        JSONB NULL, -- Array of objects: assignee, task, dueDate
  competitors         JSONB NULL, -- Array of strings
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Deal Briefs Table
CREATE TABLE m03_ai_summaries_genai.deal_briefs (
  brief_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id             UUID UNIQUE NOT NULL,
  tenant_id           UUID NOT NULL,
  summary_text        TEXT NOT NULL,
  objections_summary  TEXT NULL,
  health_indicators   JSONB NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Account Briefs Table
CREATE TABLE m03_ai_summaries_genai.account_briefs (
  brief_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          UUID UNIQUE NOT NULL,
  tenant_id           UUID NOT NULL,
  relationship_brief  TEXT NOT NULL,
  sentiment_summary   TEXT NULL,
  key_stakeholders    JSONB NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Normalized Summary Evidence Links Table (Drift #8 Resolution)
CREATE TABLE m03_ai_summaries_genai.summary_evidence_links (
  link_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  summary_type        VARCHAR NOT NULL CHECK (summary_type IN ('call_summary', 'deal_brief', 'account_brief')),
  summary_id          UUID NOT NULL,
  section_name        VARCHAR NULL,
  source_type         VARCHAR NOT NULL CHECK (source_type IN ('transcript', 'tracker_detection', 'topic_tag', 'activity', 'email')),
  source_entity_id    UUID NOT NULL,
  snippet             TEXT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Summary History Table for Auditing (Drift #9 Resolution)
CREATE TABLE m03_ai_summaries_genai.summary_history (
  history_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID NOT NULL,
  summary_type        VARCHAR NOT NULL CHECK (summary_type IN ('call_summary', 'deal_brief', 'account_brief')),
  version             INTEGER NOT NULL,
  snapshot_data       JSONB NOT NULL,
  snapshot_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & security
CREATE INDEX idx_call_summaries_tenant ON m03_ai_summaries_genai.call_summaries (tenant_id);
CREATE INDEX idx_summary_evidence_lookup ON m03_ai_summaries_genai.summary_evidence_links (tenant_id, summary_type, summary_id);
CREATE INDEX idx_summary_evidence_source ON m03_ai_summaries_genai.summary_evidence_links (source_entity_id);
CREATE INDEX idx_summary_history_lookup ON m03_ai_summaries_genai.summary_history (parent_id, summary_type);
```

---

## 7. AI & Prompt Architecture

### Model Choices
- Call summaries utilize `gpt-4o-mini` (configured via `OPENAI_MODEL_SUMMARY`) due to high throughput requirements and low latency.
- Deal and Account briefs utilize the high-reasoning model `gpt-4o` (configured via `OPENAI_MODEL_ASK`) because they require complex synthesis of multi-source timeline signals.

### Prompt Structural Rules
- Prompts are version-pinned via Doppler configuration (`PROMPT_VERSION_SUMMARY = v1`).
- All prompt parameters require structured JSON output validation (`PROMPT_STRICT_JSON = true`) enforcing clean parsing schema models.
- Hallucination prevention rule: AI must strictly output action items and objections grounded in the transcript text, providing the exact timestamp or segment boundaries for citation storage in `summary_evidence_links`.

---

## 8. Operational Resilience & Error Handling

### Low Confidence Review Flag
If the AI-extracted confidence score falls below `0.70` (evaluated against `SUMMARY_CONFIDENCE_MIN`), the background worker sets `flagged_for_review = true` in the DB. The write guard (`ENABLE_FLAGGED_FOR_REVIEW_WRITE_GUARD`) automatically intercepts the post-generation lifecycle, blocking downstream CRM sync workers from updating external databases until a manager manually approves or updates the record.

### Timeout & Queue Retries
- Summarization tasks have a synchronous timeout guard of 30 seconds (`AI_SERVICE_TIMEOUT_MS_SYNC`).
- BullMQ workers maintain a strict queue retry limit of 3 (`AI_SERVICE_RETRY_MAX`). Transient errors will attempt execution retries using exponential backoff.
- Jobs exceeding maximum retries are routed to the Dead-Letter Queue (`QUEUE_DLQ_ENABLED = true`) for manual ops review.

---

## 9. Security & Compliance

### Row Level Security (RLS)
Every database query, search filter, and background retrieval joins on `tenant_id` to prevent cross-tenant data leakage. RLS is enforced at the PostgreSQL database level for all tables in the `m03_ai_summaries_genai` schema.

### Audit Trial
Regeneration sweeps preserve data history. Instead of silently overwriting existing rows:
1. The active summary is read and archived.
2. A copy is inserted into the `summary_history` audit table.
3. The primary table row is overwritten with the updated content, and the `version` counter is incremented by 1.
