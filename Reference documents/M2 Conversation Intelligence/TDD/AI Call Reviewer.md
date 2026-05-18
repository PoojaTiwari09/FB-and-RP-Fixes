# Doc #11a — TDD: AI Call Reviewer

## 1. Document Control

- **Document Title:** Technical Design Document — AI Call Reviewer
- **Feature Name:** AI Call Reviewer
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Tech Lead / Conversation Intelligence Squad
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

AI Call Reviewer evaluates sales and support calls using predefined admin-managed scorecards and AI-generated insights. Its purpose is to convert unstructured conversation data into structured performance signals that can be used for quality review, coaching, and downstream performance analysis.

This feature belongs in the M2 module because M2 is the central system for understanding customer conversations and generating structured signals. The value is strongest for managers, QA teams, enablement, and RevOps because they can review calls consistently at scale instead of relying on random sampling or manual reviews.

### Business Problem
- Managers cannot manually review enough calls to coach teams consistently.
- Manual scoring is subjective and varies by reviewer.
- Raw transcripts alone do not tell the business whether a call met expected quality standards.

### What the Feature Does
- Scores a completed call against one or more active admin-defined scorecards.
- Produces per-question answers, evidence snippets, confidence, and total score.
- Derives behavioral call metrics such as talk ratio, question rate, and longest monologue.
- Flags low-confidence or ambiguous results for manual review.
- Emits a `call.scored` event for downstream consumers such as Coaching & Training.

---

## 3. Scope

### In Scope
- Scorecard-based AI evaluation of completed calls.
- Scoring after transcript completion and Revenue Graph entity linking.
- Per-question scoring output with evidence and confidence.
- Derived call metrics used for coaching and benchmarking.
- Review flag generation for uncertain results.
- Event emission through `call.scored`.

### Out of Scope
- Real-time in-call scoring or live guidance.
- Manual review workflow UI implementation details.
- Coaching recommendation generation itself, which belongs downstream in M9 Coaching & Training.
- Scorecard authoring UX beyond the API and persisted schema.
- Direct CRM write-back from score results (handled by M10).

### Assumptions
- A valid transcript exists from M1 Capture & Transcription.
- The call is linked into the M10 Revenue Graph before scoring is finalized.
- At least one active scorecard exists for the tenant.
- AI scoring runs through internal Python AI services exposed over private APIs.

### Upstream Dependencies
- **M1 Capture & Transcription:** `call.transcription.completed` event and transcript data.
- **M10 Data & Compliance:** `revenue_graph.entity.linked` event and linked deal/account/contact context.
- Tenant auth, RLS, audit logging, queue infrastructure, and shared platform services.

### Downstream Consumers
- **M9 Coaching & Training:** Consumes `call.scored` for scorecard metrics and skill analysis.
- **M3 AI Summaries & GenAI:** Consumes score trends for summary generation.

---

## 4. Users and Triggers

### Primary Users
- Sales managers reviewing rep performance.
- QA and enablement teams standardizing call reviews.
- RevOps users configuring scorecards and governance rules.

### System Triggers
- Primary trigger is `call.transcription.completed` from M1.
- Final scoring must wait until `revenue_graph.entity.linked` from M10 has arrived, or until the delayed scoring job fallback window completes.

### Entry Points
- Async queue job created from transcript completion event.
- Read APIs: `GET /api/v1/m02-conversation-intelligence/calls/:id/score`.
- Admin API: `POST /api/v1/m02-conversation-intelligence/scorecards`.
- Admin API: `GET /api/v1/m02-conversation-intelligence/scorecards`.

---

## 5. Functional Flow

### Happy Path
1. M1 completes transcription and emits `call.transcription.completed`.
2. M2 enqueues a delayed score evaluation job (using deterministic job IDs to avoid duplicates) with `CALL_SCORE_DELAY_MS` set to 5 minutes (300,000ms).
3. M10 links the call to CRM entities and emits `revenue_graph.entity.linked`.
4. M2 worker promotes the scoring job immediately to active upon receiving the entity link event.
5. The worker loads the transcript, speaker segments, linked deal context, and active scorecards for the tenant.
6. M2 calls the private AI endpoint `POST /internal/score-call` in the AI services layer.
7. The AI service returns structured per-question answers, evidence snippets, confidence, and total score.
8. M2 worker derives behavioral call metrics (talk ratio, question rate, longest monologue) from speaker segments.
9. M2 persists results in `call_scores` table, marks review status if needed, and emits `call.scored`.
10. Downstream modules, especially M9 Coaching & Training, consume the event.

### Alternate Paths
- If multiple scorecards are active, the worker evaluates the call against each applicable scorecard and persists separate records.
- If no active scorecard exists for the tenant, the scoring job finishes silently.
- If `revenue_graph.entity.linked` is delayed beyond 5 minutes, the worker executes scoring with fallback parameters rather than blocking indefinitely.

---

## 6. Inputs and Outputs

### Inputs
- `callId` (UUID)
- `tenantId` (UUID)
- Transcript text segments and speaker segments.
- Linked deal/account context from M10.
- Active scorecard definitions.

### Output Records
- `call_scores` row containing AI answers, total score, aggregate confidence, and `flaggedReview` status.

### Events Emitted
- `call.scored` conforming to standard `EventEnvelopeSchema`:
  ```json
  {
    "eventId": "uuid",
    "eventName": "call.scored",
    "eventVersion": "v1",
    "tenantId": "uuid",
    "producer": "m02-conversation-intelligence",
    "occurredAt": "2026-05-18T12:00:00Z",
    "publishedAt": "2026-05-18T12:00:01Z",
    "correlationId": "uuid",
    "payload": {
      "callId": "uuid",
      "scorecardId": "uuid",
      "scorecardVersion": "v1",
      "totalScore": 86,
      "confidenceScore": 0.84,
      "flaggedReview": false,
      "scoredAt": "2026-05-18T12:00:00Z"
    }
  }
  ```

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `scorecards` Table
- `id` (UUID, Primary Key) -> mapped to `scorecardId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `name` (VARCHAR)
- `questions` (JSONB)
- `scoring_conditions` (JSONB)
- `created_by` (UUID) -> mapped to `createdBy`
- `is_active` (BOOLEAN) -> mapped to `isActive`
- `version` (VARCHAR)
- `lifecycle_state` (VARCHAR) -> mapped to `lifecycleState`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `call_scores` Table
- `id` (UUID, Primary Key) -> mapped to `scoreId`
- `call_id` (UUID, Indexed) -> mapped to `callId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `scorecard_id` (UUID, Indexed) -> mapped to `scorecardId`
- `scorecard_version` (VARCHAR) -> mapped to `scorecardVersion`
- `ai_answers` (JSONB) -> mapped to `aiAnswers`
- `total_score` (INTEGER) -> mapped to `totalScore`
- `confidence_score` (DECIMAL) -> mapped to `confidenceScore`
- `flagged_review` (BOOLEAN) -> mapped to `flaggedReview`
- `scored_at` (TIMESTAMP) -> mapped to `scoredAt`

### Idempotency Key
Deterministic queue job key: `score:tenantId:callId:scorecardId:scorecardVersion`.

---

## 8. AI Processing

- **Task:** Scorecard evaluation.
- **Internal AI Endpoint:** `POST /internal/score-call`
- **Gating Confidence Rule:**
  - Let `MANUAL_REVIEW_THRESHOLD = 0.70`.
  - If aggregate `confidenceScore < 0.70`, set `flaggedReview = true`.

---

## 9. Security and Compliance

- **RLS Policy:** Every DB query must include `tenant_id = current_tenant_id()`.
- **Sensitive Data:** Transcript snippets in `aiAnswers` must be stored securely.

---

## 16. Appendix: Manual Review Flag Logic

```typescript
export interface ScoringResult {
  totalScore: number;
  confidenceScore: number;
  answers: {
    questionId: string;
    answer: string;
    score: number;
    confidence: number;
  }[];
}

export function evaluateManualReviewFlag(
  result: ScoringResult,
  reviewThreshold: number = 0.70
): boolean {
  // Flag review if overall confidence is low
  if (result.confidenceScore < reviewThreshold) {
    return true;
  }
  
  // Flag review if any individual answer is extremely low confidence (< 0.60)
  const hasLowConfidenceAnswer = result.answers.some(
    (ans) => ans.confidence < 0.60
  );
  if (hasLowConfidenceAnswer) {
    return true;
  }

  return false;
}
```
