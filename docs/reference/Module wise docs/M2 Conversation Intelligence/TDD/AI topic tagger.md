# Doc #11b — TDD: AI Topic Tagger

## 1. Document Control

- **Document Title:** Technical Design Document — AI Topic Tagger
- **Feature Name:** AI Topic Tagger
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Tech Lead / Conversation Intelligence Squad
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

AI Topic Tagger analyzes call transcripts and automatically labels key discussion topics such as pricing, next steps, objections, and product issues, making conversations structured and searchable. Its job is to turn raw transcript text into normalized topic signals that can power filtering, downstream analysis, and insight generation.

This feature belongs in the M2 module because M2 is the central system for understanding customer conversations and generating structured signals. Topic tags make large volumes of conversations easier to search, segment, summarize, and analyze.

### Business Problem
- Raw transcripts are hard to scan at scale.
- Teams need structured labels to find conversations about pricing, objections, competitors, product issues, and next steps.
- Downstream features cannot reliably summarize or track patterns if topic signals are not standardized first.

### What the Feature Does
- Detects key topics in completed call transcripts.
- Stores topic tags with confidence and source metadata in tenant-scoped tables.
- Emits `call.topics.tagged` for downstream modules.
- Feeds Smart Tracking and search indexing with structured topic signals.

---

## 3. Scope

### In Scope
- Topic tagging for completed calls after transcript ingestion.
- AI-based topic detection using the internal AI services layer.
- Storage of topic tags in `topic_tags`.
- Confidence-based suppression and filtering of weak tags.
- Event emission through `call.topics.tagged`.

### Out of Scope
- Smart Tracker intent detection logic (handled by AI Smart Tracker).
- Theme clustering across large conversation sets (handled by AI Theme Spotter).
- Full-text or semantic conversation search implementation (handled by Searchable Conversation Library).
- UI implementation details.

### Assumptions
- A valid transcript exists from Whisper or fallback ASR.
- Topic models or taxonomy definitions are available at global or tenant-custom level.
- AI logic runs in Python services, while business orchestration and persistence remain in TypeScript.

### Upstream Dependencies
- **M1 Capture & Transcription:** completed ASR outputs.
- **M10 Data & Compliance:** Revenue Graph context where linked context is useful for better downstream enrichment.

### Downstream Consumers
- **M2 Searchable Library:** Consumes topic tags for search indexing.
- **M3 AI Summaries & GenAI:** Consumes `call.topics.tagged` and includes topic tags in summary structures.

---

## 4. Users and Triggers

### Primary Users
- Sales reps searching for calls by discussion area.
- Managers and enablement teams analyzing discussion patterns.
- RevOps and insight workflows needing structured topic signals.

### System Triggers
- Primary trigger is `call.transcription.completed` from M1.

### Entry Points
- Async queue job from transcript completion event.
- Read API: `GET /api/v1/m02-conversation-intelligence/calls/:id/topics`.

---

## 5. Functional Flow

### Happy Path
1. M1 completes transcription and emits `call.transcription.completed`.
2. M2 enqueues a topic-tagging job for the call.
3. The background worker loads transcript content, speaker segments, and the relevant topic model/taxonomy for the tenant.
4. M2 calls the private AI endpoint `POST /internal/tag-topics`.
5. The AI service returns candidate topics with confidence scores and optional evidence mapping.
6. M2 applies confidence threshold and suppression rules to remove weak or duplicate topics.
7. M2 persists the surviving topic tags in `topic_tags`.
8. M2 emits `call.topics.tagged`.
9. Downstream modules (especially M3) consume the event.

---

## 6. Inputs and Outputs

### Inputs
- `callId` (UUID)
- `tenantId` (UUID)
- Transcript text and optionally speaker segments.
- Topic taxonomy/model definitions from `topic_models`.

### Output Records
- `topic_tags` rows containing call ID, tenant ID, topic name, source, confidence score, and tag timestamp.

### Events Emitted
- `call.topics.tagged` conforming to standard `EventEnvelopeSchema`:
  ```json
  {
    "eventId": "uuid",
    "eventName": "call.topics.tagged",
    "eventVersion": "v1",
    "tenantId": "uuid",
    "producer": "m02-conversation-intelligence",
    "occurredAt": "2026-05-18T12:00:00Z",
    "publishedAt": "2026-05-18T12:00:01Z",
    "correlationId": "uuid",
    "payload": {
      "callId": "uuid",
      "topics": [
        {
          "topicName": "pricing",
          "confidenceScore": 0.91
        },
        {
          "topicName": "next steps",
          "confidenceScore": 0.84
        }
      ],
      "taggedAt": "2026-05-18T12:00:00Z"
    }
  }
  ```

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `topic_models` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `modelId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `topics` (JSONB)
- `type` (VARCHAR) -> global, tenantcustom
- `last_trained_at` (TIMESTAMP) -> mapped to `lastTrainedAt`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `topic_tags` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `tagId`
- `call_id` (UUID, Indexed) -> mapped to `callId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `topic_name` (VARCHAR) -> mapped to `topicName`
- `source` (VARCHAR) -> aimodel, vocabularyrule
- `confidence_score` (DECIMAL) -> mapped to `confidenceScore`
- `created_at` (TIMESTAMP)

---

## 8. AI Processing

- **Task:** Topic classification.
- **Internal AI Endpoint:** `POST /internal/tag-topics`
- **Confidence Gating Rule:**
  - Let `TOPIC_MIN_CONFIDENCE = 0.70`.
  - Suppress any topics where `confidenceScore < 0.70`.

---

## 16. Appendix: Topic Tag Deduplication Logic

```typescript
export interface TopicTagCandidate {
  topicName: string;
  confidenceScore: number;
  source: 'aimodel' | 'vocabularyrule';
}

export function deduplicateAndFilterTopics(
  candidates: TopicTagCandidate[],
  threshold: number = 0.70
): TopicTagCandidate[] {
  const result: TopicTagCandidate[] = [];
  const seen = new Set<string>();

  // Sort candidates by confidence desc
  const sorted = [...candidates].sort((a, b) => b.confidenceScore - a.confidenceScore);

  for (const item of sorted) {
    if (item.confidenceScore < threshold) {
      continue;
    }
    const normalized = item.topicName.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(item);
    }
  }

  return result;
}
```