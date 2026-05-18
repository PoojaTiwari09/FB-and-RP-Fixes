# Doc #11a — TDD: AI Call Reviewer

## 1. Document Control

- **Document title:** Technical Design Document — AI Call Reviewer 
- **Feature name:** AI Call Reviewer 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-04 Conversation Intelligence 
- **Internal architecture placement:** Primary ownership is in M-04 because scoring, scorecards, and topic/theme-class AI processing belong to the Conversation Intelligence module. 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Tech Lead / Conversation Intelligence squad 
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Module note:** For planning and business-facing documentation, this feature is documented under the single module **M2 Conversation Intelligence pack** so the squad can work with one clear customer-facing module.   
> **Architecture note:** Internal architecture ownership across M2 is split between **M-04** and **M-05**; for AI Call Reviewer specifically, ownership stays in **M-04**. Smart Tracker and Searchable Conversation Library are the main areas that sit in M-05 or cross that boundary. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Architecture view owner:** M-04 Conversation Intelligence. 
- **Why this matters:** Product packaging stays simple for planning, but engineering implementation must follow actual module boundaries in the system architecture. 

---

## 2. Purpose

AI Call Reviewer evaluates sales and support calls using predefined admin-managed scorecards and AI-generated insights.   
Its purpose is to convert unstructured conversation data into structured performance signals that can be used for quality review, coaching, and downstream performance analysis. 

This feature belongs in M2 because M2 is the business-facing module for understanding what happened in customer conversations and turning that into usable insights.   
The value is strongest for managers, QA teams, enablement, and RevOps because they can review calls consistently at scale instead of relying on random sampling or manual note-taking. 

### Business problem

- Managers cannot manually review enough calls to coach teams consistently. 
- Manual scoring is subjective and varies by reviewer. 
- Raw transcripts alone do not tell the business whether a call met expected quality standards. 

### What the feature does

- Scores a completed call against one or more active admin-defined scorecards. 
- Produces per-question answers, evidence snippets, confidence, and total score. 
- Derives behavioral call metrics such as talk ratio, question rate, and longest monologue. 
- Flags low-confidence or ambiguous results for manual review. 
- Emits a `call.scored` event for downstream consumers such as Performance and Coaching. 

---

## 3. Scope

### In scope

- Scorecard-based AI evaluation of completed calls. 
- Scoring after transcript completion and Revenue Graph entity linking. 
- Per-question scoring output with evidence and confidence. 
- Derived call metrics used for coaching and benchmarking. 
- Review flag generation for uncertain results. 
- Event emission through `call.scored`. 

### Out of scope

- Real-time in-call scoring or live guidance. 
- Manual review workflow UI implementation details. 
- Coaching recommendation generation itself, which belongs downstream in Performance and Coaching. 
- Scorecard authoring UX beyond the API and persisted schema. 
- Direct CRM write-back from score results. 

### Assumptions

- A valid transcript exists from upstream capture and transcription flow. 
- The call has tenant-scoped metadata and is linked into the Revenue Graph before final scoring is finalized. 
- At least one active scorecard may exist for a tenant, but the system must tolerate the case where none exists. 
- AI scoring runs through Python AI services exposed over internal APIs, while business orchestration stays in TypeScript. 

### Upstream dependencies

- M-01 transcription completion event and transcript data. 
- M-03 Revenue Graph linking event and linked deal/account/contact context. 
- Tenant auth, RLS, audit logging, queue infrastructure, and shared platform services. 

### Downstream consumers

- M-09 Coaching and Training consumes `call.scored`. 
- Coaching snapshots and benchmarking can reuse talk ratio, question rate, and longest monologue metrics. 
- Future reporting and dashboards may consume score trends as analytical inputs. 

---

## 4. Users and Triggers

### Primary users

- Sales managers reviewing rep performance. 
- QA and enablement teams standardizing call reviews. 
- RevOps users configuring scorecards and governance rules. 

### System triggers

- Primary trigger is `call.transcription.completed`. 
- Final scoring must wait until `revenuegraph.entity.linked` has arrived or until the delayed job can safely proceed with available context. 

### Entry points

- Async queue job created from transcript completion event. 
- Read APIs such as `GET /api/v1/conversation-intelligence/calls/:id/score`. 
- Admin API for scorecard creation and management such as `POST /api/v1/conversation-intelligence/scorecards`. 

### Preconditions

- Transcript and speaker segments must exist. 
- Tenant context must be available on every request and job. 
- Scorecards must be retrievable in tenant scope. 
- Linked conversation context from Revenue Graph is strongly preferred before final score persistence. 

---

## 5. Functional Flow

### Happy path

1. M-01 completes transcription and emits `call.transcription.completed`.   
2. M-04 enqueues score evaluation work for the call, keyed by call ID and scorecard scope.   
3. The system waits for `revenuegraph.entity.linked`, or processes after the configured delay if linking is not received earlier.   
4. M-04 loads transcript segments, speaker metadata, linked deal/account/contact context, and active scorecards for the tenant.   
5. M-04 calls the internal AI scoring endpoint `POST /v1/score-call` in the AI services layer.   
6. The AI service returns structured per-question answers, evidence, confidence, and total score.   
7. M-04 derives behavioral call metrics such as talk ratio, question rate, and longest monologue from transcript and speaker timing context.   
8. M-04 persists the score result in `callscores`, marks review status if needed, and emits `call.scored`.   
9. Downstream modules, especially Performance and Coaching, consume the event. 

### Alternate paths

- If multiple scorecards are active, the system evaluates the call against each applicable scorecard and stores separate results. 
- If no active scorecard exists for the tenant, the scoring step is skipped silently rather than treated as a hard failure. 
- If Revenue Graph linking is delayed, the queued job waits up to the configured delay before running. 

### Failure paths

- If transcript payload is missing or invalid, validation failure is recorded and the job is failed safely. 
- If the AI scoring endpoint times out or returns a 5xx error, the queue retry policy applies. 
- If all retries are exhausted, the job lands in failure handling / DLQ workflow for replay and investigation. 
- If the AI result is structurally valid but low confidence, the result is persisted with manual review flag instead of being discarded. 

### Retry behavior

- BullMQ is the queue backbone for async inter-module processing and retries. 
- Delayed jobs use call-based job IDs to reduce duplicate work and support idempotency. 
- Retries should be exponential and safe to rerun because writes must be idempotent on call and scorecard scope. 

---

## 6. Inputs and Outputs

### Inputs

- `callId` 
- `tenantId` 
- Transcript segments and speaker segments from transcription schema. 
- Linked Revenue Graph context, including deal/account/contact references when available. 
- Active scorecard definitions for the tenant. 

### Output records

- `callscores` row containing score result, AI answers, total score, confidence score, and review flag. 
- Derived score metadata for analytics and downstream coaching use. 

### Events emitted

- `call.scored` with payload fields: `eventid`, `callid`, `tenantid`, `scorecardid`, `totalscore`, `confidencescore`, `flaggedreview`, `scoredat`. 

### APIs consumed

- Internal AI endpoint: `POST /v1/score-call`. 
- Transcript and linked call context reads from internal data stores / module services. 

### APIs exposed

- `GET /api/v1/conversation-intelligence/calls/:id/score` for score retrieval. 
- `POST /api/v1/conversation-intelligence/scorecards` for scorecard creation. 
- `GET /api/v1/conversation-intelligence/scorecards` for scorecard listing. 

---

## 7. Data Model

### Tables used

- `scorecards` stores scorecard definitions. 
- `callscores` stores score results per call and scorecard. 
- `transcripts` and `speakersegments` are read from the transcription domain. 
- Revenue Graph entities and activity context are read from M-03-owned tables. 

### Fields owned

#### `scorecards`
- `scorecardid` 
- `tenantid` 
- `name` 
- `questions` JSONB 
- `scoringconditions` JSONB 
- `createdby` 
- `isactive` 
- `version` VARCHAR
- `lifecyclestate` VARCHAR 

#### `callscores`
- `scoreid` 
- `callid` 
- `tenantid` 
- `scorecardid`
- `scorecardversion` VARCHAR
- `aianswers` JSONB 
- `totalscore` 
- `confidencescore` 
- `flaggedreview` 
- `scoredat` 

### Validation rules

- Every write must include `tenantid`. 
- Scorecard references must resolve inside the same tenant. 
- AI responses must match the expected structured schema before persistence. 
- Confidence must be numeric and bounded to valid scoring range. 

### Idempotency keys

- Recommended uniqueness basis: `tenantid + callid + scorecardid + scorecardVersion`. 
- Queue job IDs should be deterministic per call scoring attempt. 
- Reprocessing the same call under the same scorecard version must update or upsert rather than duplicate. 

### Retention notes

- Call score outputs are business records and should follow tenant data retention policy. 
- Raw audio is not the long-term source of truth; transcripts and derived outputs are the primary retained artifacts. 

---

## 8. AI Processing

### AI task performed

The AI task is scorecard-based call evaluation using transcript content plus linked business context.   
The model returns question-level judgments, evidence snippets, confidence, and aggregate score output as structured JSON. 

### AI service endpoint

- `POST /v1/score-call` in the internal AI services layer. 

### Model or pipeline type

- M-04 scoring tasks use the AI services layer and are routed through the approved Python AI stack, with LLM access centralized through LiteLLM rather than direct provider calls from TypeScript. 
- The architecture positions scoring under M-04, not M-05. 

### Input payload

Recommended payload:

```json
{
  "tenantId": "uuid",
  "callId": "uuid",
  "scorecard": {
    "scorecardId": "uuid",
    "version": "v1",
    "name": "Discovery QA",
    "questions": [
      {
        "questionId": "q1",
        "text": "Did the rep confirm next steps?",
        "type": "boolean",
        "weight": 20,
        "evaluationRule": "answer must include a clear future action and owner"
      }
    ],
    "scoringConditions": {
      "passThreshold": 80,
      "manualReviewThreshold": 0.70
    }
  },
  "transcriptSegments": [],
  "speakerSegments": [],
  "context": {
    "dealId": "uuid",
    "accountId": "uuid",
    "contactIds": ["uuid"]
  }
}
```

This shape follows the architecture rule that AI services should return structured machine-readable outputs and that product services should pass tenant-scoped, validated inputs only. 

### Output schema

Recommended response schema:

```json
{
  "callId": "uuid",
  "scorecardId": "uuid",
  "scorecardVersion": "v1",
  "answers": [
    {
      "questionId": "q1",
      "answer": "yes",
      "score": 20,
      "confidence": 0.91,
      "evidenceSnippet": "Let's schedule the follow-up demo next Tuesday."
    }
  ],
  "totalScore": 86,
  "confidenceScore": 0.84,
  "manualReviewFlag": false,
  "derivedMetrics": {
    "talkRatio": 0.58,
    "questionRate": 0.14,
    "longestMonologueSeconds": 96
  }
}
```

### Confidence handling

- Confidence-score gating is required for AI outputs. 
- Low-confidence results are not blindly trusted; they are persisted with `flaggedreview = true` for human review. 
- Confidence thresholds should be tenant-configurable in later versions, but the first version can use a default operational threshold. 

---

## 9. Service and Integration Design

### Internal services

- **NestJS M-04 service:** orchestrates scoring workflow, validation, persistence, and event emission. 
- **Python AI service:** executes `v1/score-call` inference and returns structured output. 
- **BullMQ + Redis:** handles async execution, retry, and delayed processing. 
- **Platform Core:** provides auth context, tenant enforcement, and audit logging. 

### External integrations

- No direct external customer-facing integration is required for the scoring step itself beyond approved AI provider routing under the AI services layer. 
- OpenAI is the primary approved LLM path, routed through LiteLLM inside Python services. 

### Rate limits, quotas, and fallback

- AI calls must not be made directly from TypeScript product services. 
- Provider retries and fallbacks are centrally managed by LiteLLM and AI services, not by feature-specific code. 
- Queue retry behavior absorbs short-lived provider or service failures. 

---

## 10. Security and Compliance

### Tenant isolation

Every scorecard, call score, and related query must be tenant-scoped, and row-level security is mandatory across tables. 

### Access control

- Admins manage scorecards. 
- Managers and authorized reviewers can read score outputs. 
- Access must flow through JWT-guarded APIs with RBAC checks. 

### Sensitive data handling

- Transcript excerpts used as evidence may contain sensitive business content and must remain tenant-isolated. 
- Customer conversation data must not be used for shared model training without explicit written consent. 

### Audit logging

- Scorecard creation, updates, and score review actions should be audit logged. 
- Manual review overrides must be traceable. 

### Compliance considerations

- Retention and access should align with configured compliance policy and tenant governance controls. 
- Avoid unnecessary duplication of transcript text in downstream systems. 

---

## 11. Error Handling

### Validation failures

- Missing transcript, invalid scorecard schema, or cross-tenant references should fail fast before AI execution. 

### Low-confidence AI result handling

- Persist result with `flaggedreview = true`. 
- Do not block storage of otherwise valid outputs solely because confidence is low. 
- Downstream consumers should be able to respect the review flag before operational use. 

### Queue retry and DLQ behavior

- Use BullMQ retries with exponential backoff. 
- Exhausted jobs should move to DLQ / manual replay workflow. 

### Partial success rules

- If one scorecard evaluation succeeds and another fails, persist successful scorecards and mark failed scorecards separately for retry. 
- If derived metrics can be computed even when some AI answers are low confidence, store metrics and review flag together. 

---

## 12. Observability

### Logs

- Structured logs must include `tenantId`, `callId`, `scorecardId`, job ID, and processing stage. 

### Metrics

Recommended metrics:

- Score job enqueue count. 
- Score job success/failure/retry count. 
- AI latency for `v1/score-call`. 
- Review-flag rate by tenant and scorecard version. 
- Average total score distribution by tenant and scorecard. 

### Alerts

Recommended alerts:

- Spike in score job failures. 
- AI timeout/error burst on scoring endpoint. 
- Queue backlog beyond threshold. 
- Unusual jump in manual review rate after a scorecard or prompt version change. 

### Traces

- Propagate correlation IDs from event receipt to AI call and DB persistence path. 

### Operational dashboards

- Grafana dashboards should show queue health, AI latency, scoring throughput, failure rate, and review-flag trend. 

---

## 13. Non-Functional Requirements

### Performance

- Post-call AI processing is async and must not block user-facing ingest flows. 
- Score retrieval API should be low-latency once scoring is complete. 

### Scalability

- The design must support scoring across large volumes of calls using queue-based fan-out and idempotent workers. 

### Reliability

- Duplicate events must not create duplicate score rows for the same scoring scope. 
- Temporary AI provider issues should be handled through retries and centralized fallback policy. 

### Latency expectations

- Scoring is a post-call async workload, so correctness and resilience matter more than immediate synchronous response. 
- End-to-end target should align with the wider post-call agent budget where scoring is one node in the overall pipeline. 

---

## 14. Test Strategy

### Unit tests

- Scorecard validation logic. 
- Manual review flag threshold logic. 
- Derived metric calculators for talk ratio, question rate, and longest monologue. 
- Event payload builder for `call.scored`. 

### Integration tests

- `call.transcription.completed` to queued score job flow. 
- Waiting behavior for `revenuegraph.entity.linked`. 
- Persistence into `callscores`. 
- Read API returns correct score output per tenant. 

### Contract tests

- `POST /v1/score-call` request and response schema validation. 
- `call.scored` event schema validation. 

### Idempotency tests

- Replayed transcript-completed event does not create duplicate score rows. 
- Retry after transient AI failure safely upserts the same scoring result. 

### Quality evaluation tests

- Golden dataset for scorecard question evaluation quality. 
- Confidence distribution tracking by scorecard version. 
- Regression checks when prompts or model routing changes. 

---

## 15. Open Questions

### Pending design decisions

- **[RESOLVED]** Scorecard version will be an explicit first-class field in `scorecards` and `callscores`. A new published version creates a new `scorecards` row with incremented version. 
- Should the system allow rescoring historical calls when a scorecard changes version? 
- Should manual review thresholds be global, tenant-level, or scorecard-level? 

### Risks

- Score quality may vary if transcript quality is poor. 
- Different teams may over-customize scorecards and reduce comparability across the org. 
- Weak evidence extraction could make users distrust otherwise correct scores. 

### Deferred items

- Human reviewer override workflow details. 
- Score explanation UI and side-by-side evidence viewer. 
- Trend analytics and benchmarking views beyond the base `call.scored` event emission. 

---

## 16. Feature-Specific Appendix

### 16.1 Scorecard definition and versioning

AI Call Reviewer depends on admin-defined scorecards, and the architecture already provides a `scorecards` table with question and scoring condition storage in JSONB.   
The feature mapping also identifies call scorecards as a distinct capability for manual or AI-based call evaluation and coaching. 

#### Recommended scorecard model

```json
{
  "scorecardId": "uuid",
  "version": "v1",
  "name": "Discovery Call QA",
  "isActive": true,
  "questions": [
    {
      "questionId": "q1",
      "text": "Did the rep establish agenda early?",
      "type": "boolean",
      "weight": 10,
      "evaluationRule": "Look for explicit agenda-setting in the opening section"
    },
    {
      "questionId": "q2",
      "text": "Did the rep confirm next steps?",
      "type": "boolean",
      "weight": 20,
      "evaluationRule": "Look for a future action with owner and timing"
    }
  ],
  "scoringConditions": {
    "passThreshold": 80,
    "manualReviewThreshold": 0.70
  }
}
```

#### Versioning rules

- Every score result must be tied to the exact scorecard version used during evaluation. 
- New scorecard versions must not overwrite historical evaluation meaning. 
- Scorecards should support draft, published, and retired lifecycle states in future iterations, even if v1 uses only `isActive`. 

### 16.2 Question evaluation rules

Question evaluation rules define how the AI should judge each scorecard item consistently. 

Recommended rule structure per question:

- Question text. 
- Expected evidence pattern. 
- Allowed answer type, such as boolean, categorical, or scaled. 
- Weight in total score. 
- Minimum confidence threshold for unflagged acceptance. 

Example:

- **Question:** Did the rep ask discovery questions? 
- **Evaluation rule:** Count substantive open-ended questions asked by the rep, not filler confirmations. 
- **Evidence rule:** Return up to 2 transcript snippets. 
- **Scoring rule:** Full points if threshold met, partial if weak evidence, zero if absent. 

### 16.3 Derived call metrics

The architecture and feature inventory highlight coaching-oriented behavior metrics such as talk ratio, question rate, and longest monologue. 

#### Talk ratio
Rep speaking time divided by total speaking time for rep plus customer. 

#### Question rate
Count of rep questions divided by call duration or rep turns, depending on final metric standardization. 

#### Longest monologue
Maximum uninterrupted speaking duration by a single speaker, usually used to detect over-talking. 

#### Recommended formulas

```text
talkRatio = repSpeakingSeconds / (repSpeakingSeconds + customerSpeakingSeconds)

questionRate = repQuestionCount / callDurationMinutes

longestMonologueSeconds = max(contiguousSpeakerSegmentDuration)
```

### 16.4 Manual review flag logic

Manual review is required when the score output is usable but not sufficiently trustworthy for blind downstream reliance. 

Recommended conditions for `flaggedreview = true`:

- Aggregate `confidenceScore < configuredThreshold`. 
- One or more critical questions have low confidence. 
- Evidence snippets are missing for mandatory scorecard questions. 
- Transcript quality indicators show likely corruption or speaker ambiguity. 
- Score result deviates strongly from expected range for the same scorecard and rep history, if anomaly checks are later added. 

Example pseudo-logic:

```ts
flaggedReview =
  confidenceScore < MANUAL_REVIEW_THRESHOLD ||
  criticalAnswers.some(a => a.confidence < CRITICAL_QUESTION_THRESHOLD) ||
  requiredEvidenceMissing === true;
```

### 16.5 `call.scored` event schema

The architecture defines `call.scored` as the emitted event from M-04 and states that it is consumed by Performance and Coaching. 

#### Canonical event payload

```json
{
  "eventid": "uuid",
  "callid": "uuid",
  "tenantid": "uuid",
  "scorecardid": "uuid",
  "totalscore": 86,
  "confidencescore": 0.84,
  "flaggedreview": false,
  "scoredat": "2026-04-29T12:30:00Z"
}
```

#### Recommended v1 extension fields

```json
{
  "scorecardVersion": "v1",
  "talkRatio": 0.58,
  "questionRate": 0.14,
  "longestMonologueSeconds": 96
}
```

These extra fields are useful for downstream coaching and performance analytics, but they should be added only if event contract governance allows it. 

### 16.6 Consumer mapping

- **Primary downstream consumer:** M-09 Coaching and Training. 
- **Primary business use:** performance review, coaching benchmarks, and rep behavior analysis. 
- **Reason this matters:** AI Call Reviewer is not just a storage feature; it produces operational signals that power later coaching workflows. 


