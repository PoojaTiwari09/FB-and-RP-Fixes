# Doc #11d — TDD: AI Smart Tracker

## 1. Document Control

- **Document title:** Technical Design Document — AI Smart Tracker 
- **Feature name:** AI Smart Tracker 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-05 Smart Tracking and Search 
- **Internal architecture placement:** Primary ownership is in M-05 because Smart Tracker is defined there alongside Searchable Conversation Library and Deal Drivers, with tracker definitions, detections, search indexing, and risk snapshots stored inside the M-05 schema. 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Tech Lead / Smart Tracking squad 
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Module note:** For business-facing planning, Smart Tracker is grouped under **M2 Conversation Intelligence pack** because it helps users understand what is happening in calls and emails.   
> **Architecture note:** Internal implementation ownership belongs to **M-05 Smart Tracking and Search**, not M-04, because the system architecture defines Smart Tracker as the module that detects intent-based business signals and stores tracker definitions and detections. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Architecture view owner:** M-05 Smart Tracking and Search. 
- **Important design rule:** Smart Tracker uses **semantic intent detection**, not simple keyword matching. 

---

## 2. Purpose

AI Smart Tracker uses AI to identify and track important business concepts across calls and emails by understanding intent, not just keywords.   
Its purpose is to convert raw conversation content into reusable, structured business signals such as pricing concerns, competitor mentions, objections, risks, and other custom intent detections. 

This feature belongs in the M2 product module because it helps users understand what happened in customer interactions.   
In the architecture, however, it is implemented in M-05 because detections are combined with search, downstream signal consumption, and deal-risk surfacing. 

### Business problem

- Keyword rules are too brittle for real sales conversations because buyers express the same idea in many different ways. 
- Teams need a way to detect intent like pricing pressure, competitor risk, next-step commitment, or budget concern even when exact phrases differ. 
- Detected signals must be reusable by summaries, workflows, and deal-risk views downstream. 

### What the feature does

- Lets admins define trackers as AI-detectable business signals. 
- Runs semantic detection over calls and emails. 
- Stores ranked detections with snippet, timestamp, context IDs, and confidence. 
- Emits `tracker.detection.created` for downstream consumers. 

---

## 3. Scope

### In scope

- Tracker definition creation and publishing. 
- Semantic intent detection on calls and outbound emails. 
- Confidence-scored detection results with supporting snippet and timestamp. 
- Event emission through `tracker.detection.created`. 
- Downstream use in Insight Generation, Execution and Automation, and Deal Drivers. 

### Out of scope

- Topic tagging, which belongs to M-04 Conversation Intelligence. 
- Theme clustering over large call sets, which belongs to AI Theme Spotter. 
- CRM write-back automation logic, which belongs to downstream modules if approved. 
- Live in-call guidance, which is not part of the documented post-call Smart Tracker design. 

### Assumptions

- A transcript or email body exists before tracker detection runs. 
- Tracker definitions are tenant-scoped and can be published or unpublished. 
- Detection runs asynchronously through approved AI services. 
- Revenue Graph enrichment may arrive before or after initial detection creation. 

### Upstream dependencies

- `call.transcription.completed` from M-01 for call detection. 
- `email.sent` from M-02 for outbound email detection. 
- `revenuegraph.entity.linked` from M-03 for deal/account enrichment. 
- `call.topics.tagged` from M-04 for search indexing enrichment. 

### Downstream consumers

- M-06 Insight Generation consumes `tracker.detection.created`. 
- M-08 Execution and Automation consumes `tracker.detection.created`. 
- M-07 Deal and Account Management uses detections and deal-driver outputs for risk visibility. 

---

## 4. Users and Triggers

### Primary users

- RevOps admins creating and publishing trackers. 
- Managers watching repeated risk and objection signals. 
- Reps and leaders consuming tracker-driven risk summaries in downstream views. 

### Trigger types

- `call.transcription.completed` triggers tracker detection on transcripts. 
- `email.sent` triggers tracker detection on outbound email content. 

### Entry points

- `POST /api/v1/smart-tracking/trackers` creates a custom AI Smart Tracker. 
- `GET /api/v1/smart-tracking/trackers` lists trackers for the tenant. 
- `GET /api/v1/smart-tracking/trackers/:id/detections` returns detections for a tracker. 

### Preconditions

- User must be authorized to create or manage tracker definitions. 
- Tracker must be published before it participates in production detection flow. 
- Source content must be tenant-scoped and available to the worker. 

---

## 5. Functional Flow

### Happy path

1. An admin creates and publishes a tracker definition.   
2. A new transcript or outbound email event arrives.   
3. M-05 enqueues detection jobs for all published trackers relevant to that scope.   
4. M-05 calls `POST /v1/detect-trackers` in the AI services layer.   
5. The AI service evaluates semantic intent against tracker definitions and returns detections with confidence, snippet, and timing context.   
6. M-05 filters, ranks, and stores valid detections in `trackerdetections`.   
7. If M-03 linking data is available, detections are enriched with deal and contact context; if not, enrichment can happen later after `revenuegraph.entity.linked`.   
8. M-05 emits `tracker.detection.created`.   
9. Downstream modules refresh summaries, workflows, and risk views based on those detections. 

### Alternate paths

- Detection can run on outbound email content using the same tracker concept. 
- Unmatched deal/account linkage does not block detection creation; enrichment can update records later. 
- A tracker may apply to all calls, inbound, outbound, or emails based on its configured scope. 

### Failure paths

- Invalid tracker definitions are rejected at creation time. 
- AI endpoint failure results in queue retry rather than silent detection loss. 
- Low-confidence outputs may be stored but filtered out from some downstream views such as Deal Drivers. 

### Core design note

- Smart Tracker is an **intent detector**, not a string-matching rule engine. 
- This means “customer is worried about budget” should still match a pricing-risk tracker even if the exact tracked keyword never appears. 

---

## 6. Inputs and Outputs

### Inputs

- `tenantId` 
- Tracker definitions from `trackers`. 
- Transcript text or email body. 
- Optional context such as deal/account IDs once enriched. 

### Output records

- `trackerdetections` rows containing tracker ID, call ID, tenant ID, optional deal/contact IDs, snippet, timestamp, confidence, and detection time. 

### Events emitted

- `tracker.detection.created` with payload fields `eventid`, `detectionid`, `trackerid`, `callid`, `tenantid`, `dealid`, `snippet`, `confidencescore`, and `detectedat`. 

### APIs consumed

- Internal AI endpoint `POST /v1/detect-trackers`. 
- Internal AI endpoint `POST /v1/embed` for semantic search support around the broader M-05 module. 

### APIs exposed

- `GET /api/v1/smart-tracking/trackers` 
- `POST /api/v1/smart-tracking/trackers` 
- `GET /api/v1/smart-tracking/trackers/:id/detections` 
- Search and conversation listing endpoints also live in M-05 but are not the primary API surface for this TDD. 

---

## 7. Data Model

### Tables used

- `trackers` stores tracker definitions. 
- `trackerdetections` stores tracker matches. 
- `dealdriversnapshots` stores rep-level aggregated risk signals. 
- `searchindexsynclog` supports indexing synchronization related to searchable content. 

### Fields owned

#### `trackers`
- `trackerid` 
- `tenantid` 
- `name` 
- `businessquestion` 
- `type` such as competitor, pricing, objection, risk, custom. 
- `scope` such as allcalls, inbound, outbound, emails. 
- `createdby` 
- `ispublished` 

#### `trackerdetections`
- `detectionid` 
- `trackerid` 
- `callid` 
- `tenantid` 
- `dealid` 
- `contactid` 
- `snippet` 
- `timestampms` 
- `confidencescore` 
- `detectedat` 

### Required indexes

- Detections by tenant and tracker. 
- Detections by tenant and deal. 
- Detections by tenant and call. 
- Trackers by tenant and published status. 
- Deal driver snapshots by tenant and user. 

### Validation rules

- Every tracker and detection row must include `tenantid`. 
- `businessquestion` must be present because it is the semantic definition of what the tracker is trying to detect. 
- `scope` must be one of the supported content scopes. 
- `snippet` should capture evidence text, not generated explanation text. 

### Idempotency rules

- `call.transcription.completed` detection creation should be unique on `trackerid + callid`. 
- `email.sent` detection creation should be unique on `trackerid + sendid` at the event-handling level. 
- Event replay must not create duplicate detection rows. 

---

## 8. AI Processing

### AI task performed

AI Smart Tracker performs semantic intent classification over transcript or email content to determine whether a business signal is present.   
The architecture explicitly says this is **semantic NLP detection**, not keyword matching. 

### AI service endpoint

- `POST /v1/detect-trackers` in the AI services layer. 

### Processing mode

- Detection runs asynchronously through BullMQ-backed jobs. 
- Product services orchestrate the workflow in TypeScript, while AI inference lives in Python. 

### AI response expectations

The AI service should return structured JSON with detections, evidence snippets, time positions if applicable, and confidence scores. 

### Example response shape

```json
{
  "callId": "uuid",
  "trackerResults": [
    {
      "trackerId": "uuid",
      "matched": true,
      "confidenceScore": 0.89,
      "snippet": "We may need to revisit pricing because it is above our approved budget.",
      "timestampMs": 184200
    }
  ],
  "modelVersion": "v1",
  "latencyMs": 870
}
```

### Confidence handling

- Confidence scoring is part of the contract and should be persisted. 
- The architecture explicitly notes that low confidence below 0.7 is filtered from Deal Drivers. 
- This means a detection can exist in storage but still be suppressed from some downstream user views. 

---

## 9. Service and Integration Design

### Internal services

- **NestJS M-05 service:** manages trackers, queues detection jobs, stores detections, enriches context, emits events, and powers search-oriented APIs. 
- **Python AI services:** run semantic detection logic through `v1/detect-trackers`. 
- **Redis + BullMQ:** handle async execution, retry, and idempotent processing. 
- **Meilisearch:** supports broader searchable conversation workflows and topic-tag indexing inside M-05. 

### Integration pattern

- M-05 consumes upstream events instead of directly calling internal functions from other modules. 
- Revenue context enrichment uses allowed public API or event-driven updates, not illegal schema coupling. 

### External dependencies

- No direct external customer-facing integration is required just to define a tracker, but detections depend on upstream capture, transcription, and CRM-linking flows being healthy. 

---

## 10. Security and Compliance

### Tenant isolation

All trackers and detections are tenant-scoped and must follow platform tenancy enforcement. 

### Access control

- Admin or authorized users create and publish trackers. 
- Authorized users can read detections based on RBAC and tenant access. 

### Sensitive data handling

- Detection snippets come from customer conversations or emails and must be treated as sensitive business data. 
- Export or downstream usage must preserve tenant access boundaries. 

### Audit logging

- Tracker creation, publish/unpublish changes, and major detection pipeline actions should be auditable. 

### Compliance note

- Smart Tracker analyzes communication content, so it inherits the same governance expectations as transcript-derived AI outputs. 

---

## 11. Error Handling

### Definition errors

- Reject unsupported scope values, invalid tracker types, or empty business questions. 

### Detection runtime errors

- AI service failures should trigger retries and DLQ handling rather than dropping detection work. 
- Transient upstream data gaps, such as missing deal linkage, should not block base detection storage. 

### Low-confidence handling

- Detections below downstream thresholds may still be recorded but hidden from specific views. 
- Confidence gating should be configurable and testable. 

### Partial enrichment behavior

- Create the detection first if semantic evidence is valid. 
- Add deal/account enrichment later when `revenuegraph.entity.linked` arrives if necessary. 

---

## 12. Observability

### Logs

Structured logs should include:

- `trackerId` 
- `detectionId` 
- `tenantId` 
- Source type such as call or email. 
- Confidence score. 
- Enrichment status. 

### Metrics

Recommended metrics:

- Detection jobs enqueued. 
- Detections created per tracker. 
- Average confidence by tracker type. 
- Detection suppression rate for low-confidence outputs. 
- AI latency for `v1/detect-trackers`. 
- Retry and DLQ counts. 

### Alerts

Recommended alerts:

- Spike in detection job failures. 
- Sudden drop in detections for a widely used tracker. 
- AI service timeout bursts on `v1/detect-trackers`. 
- High duplicate-detection conflict rate, which may indicate idempotency issues. 

### Operational dashboards

- Show detections by tracker, average confidence, low-confidence suppression, queue depth, and event emission rate. 

---

## 13. Non-Functional Requirements

### Performance

- Detection must run asynchronously and should not block transcript completion or email send flows. 
- Search and downstream views should consume persisted results rather than rerunning detection on demand. 

### Scalability

- All published trackers may run against new transcripts, so queue design and deduplication are essential at scale. 

### Reliability

- Duplicate events must not create duplicate detections. 
- Detection records must survive delayed enrichment and downstream retries. 

### Explainability

- Every detection should have evidence in the form of a snippet and, for call data, a timestamp position. 
- Users should be able to understand why a tracker fired without reading the full transcript every time. 

---

## 14. Test Strategy

### Unit tests

- Tracker definition validation. 
- Scope routing logic. 
- Confidence threshold filtering. 
- Snippet normalization and truncation rules. 

### Integration tests

- `POST /trackers` create flow. 
- `call.transcription.completed` to tracker detection pipeline. 
- `email.sent` to tracker detection pipeline. 
- `revenuegraph.entity.linked` enrichment updates. 
- `tracker.detection.created` event emission. 

### Contract tests

- `POST /v1/detect-trackers` request/response schema validation. 
- `tracker.detection.created` event schema validation. 

### Idempotency tests

- Replay of the same call event does not create duplicate detections for the same tracker. 
- Email detection replay respects uniqueness for tracker and send combination. 

### Quality evaluation tests

- Golden datasets for pricing, objection, competitor, and custom intent detection. 
- Prompt/model regression tests by tracker type. 
- False-positive and false-negative review loops for semantic trackers. 

---

## 15. Open Questions

### Pending design decisions

- Should example-based tracker definitions be first-class in the public API, or should v1 stay centered on natural-language business questions? 
- Should multiple evidence snippets be stored for one detection or only the strongest snippet? 
- Should unpublished trackers support dry-run evaluation before production publishing? 

### Risks

- Vague tracker definitions can create noisy detections. 
- Overly broad trackers can flood downstream modules with low-value signals. 
- Poor confidence tuning can either hide useful signals or surface too many weak ones. 

### Deferred items

- Tracker analytics showing precision/usage over time. 
- Tracker template marketplace by use case or industry. 
- Live detection during active meetings. 

---

## 16. Feature-Specific Appendix

### 16.1 Tracker definition model, question-based or example-based

The architecture defines each tracker with fields including `name`, `businessquestion`, `type`, `scope`, `createdby`, and `ispublished`.   
The feature mapping describes Smart Tracker as AI that tracks business concepts by understanding intent rather than keywords, which makes a question-based definition model the natural v1 default. 

#### Architecture-backed v1 definition model

```json
{
  "name": "Budget Concern",
  "businessQuestion": "Did the buyer express concern that the product may be too expensive or outside approved budget?",
  "type": "pricing",
  "scope": "allcalls",
  "isPublished": true
}
```

#### Question-based model

- Best for admins because it is easy to create and explain. 
- Aligns directly with the `businessquestion` field already defined in the schema. 
- Works well for semantic detection prompts. 

#### Example-based extension

A future version can add positive and negative examples to improve narrow or high-stakes trackers.   
That can be modeled as an extension to the tracker definition rather than replacing the `businessquestion` field. 

#### Practical recommendation

Start with **question-based** trackers in v1 because the architecture already supports them directly and they are simpler for freshers, PMs, and admins to understand.   
Add example-based training hints later as an optional enhancer, not as the primary contract. 

### 16.2 Intent-detection pipeline

The architecture explicitly defines M-05 as the module that detects intent-based business signals using semantic NLP, and it calls the AI service endpoint `POST /v1/detect-trackers`. 

#### Pipeline steps

1. Upstream event arrives from `call.transcription.completed` or `email.sent`.   
2. M-05 fetches all published trackers for the tenant and matching scope.   
3. M-05 builds a detection request with content and tracker definitions.   
4. M-05 calls `POST /v1/detect-trackers`.   
5. AI service evaluates semantic match between content and tracker business question.   
6. AI service returns matched trackers with confidence, snippet, and timestamp.   
7. M-05 stores detections in `trackerdetections`.   
8. M-05 emits `tracker.detection.created`.   
9. M-05 later enriches detections with deal/account context if required. 

#### Design rule

This pipeline must stay async and event-driven.   
Do not turn it into a synchronous request-path AI call. 

### 16.3 Detection ranking and confidence

The architecture stores `confidencescore` on each detection and explicitly notes that low confidence below 0.7 is filtered from Deal Drivers.   
This makes confidence a first-class ranking and suppression signal, not just debug metadata. 

#### Recommended ranking logic

Rank detections by:

1. Confidence score.   
2. Tracker priority or type if a later config field is added.   
3. Recency of detection.   
4. Deal relevance once enrichment is available. 

#### Confidence rules

- Persist all valid detections with confidence. 
- Use threshold-based suppression for downstream views that need higher precision, such as Deal Drivers. 
- Keep threshold values configurable for AI quality tuning and golden-dataset evaluation. 

#### Example rule

```ts
showInDealDrivers = detection.confidenceScore >= 0.7;
```

### 16.4 Snippet capture rules

The architecture defines `snippet` as the exact quote from the conversation and `timestampms` as the position in call audio.   
The feature mapping also positions Smart Tracker as a user-facing signal system, so detections need evidence that a rep or manager can quickly verify. 

#### Recommended snippet rules

- Store the **best supporting quote**, not a paraphrase. 
- Keep snippet short enough for UI cards and alert payloads. 
- Preserve original wording because semantic evidence is stronger when users can verify the exact language. 
- Capture `timestampms` for calls so the user can jump back to the right moment. 

#### Email snippet rule

- For emails, store the matched sentence or paragraph excerpt even though audio timestamp is not applicable. 

#### Suggested practical guardrails

- Prefer one primary snippet per detection in v1. 
- Trim boilerplate and signatures for email detections. 
- Avoid storing oversized evidence blocks when one concise snippet is enough. 

### 16.5 `tracker.detection.created` event schema

The architecture defines `tracker.detection.created` as an M-05 event consumed by M-06 Insight Generation and M-08 Execution and Automation. (M-07 Deal and Account Management accesses tracker detections via M-05 API reads, not direct event-bus subscription). 

#### Canonical event payload

```json
{
  "eventid": "uuid",
  "detectionid": "uuid",
  "trackerid": "uuid",
  "callid": "uuid",
  "tenantid": "uuid",
  "dealid": "uuid",
  "snippet": "We may need to revisit pricing because the budget is already tight.",
  "confidencescore": 0.89,
  "detectedat": "2026-04-29T10:22:00Z"
}
```

#### Recommended extension fields

```json
{
  "contactid": "uuid",
  "timestampms": 184200,
  "sourceType": "call"
}
```

These fields are useful for richer downstream behavior, but they should be added through controlled event-version governance. 

#### Event-handling rule

- Publisher owns the contract. 
- Consumers must be idempotent because retries are expected. 
- The same event may be delivered more than once. 

### 16.6 Semantic detection, not keyword matching

The architecture explicitly states that M-05 Smart Tracking and Search detects intent-based business signals using semantic NLP, not keyword matching.   
The feature mapping says Smart Trackers identify and track important business concepts by understanding intent, not just keywords. 

#### Why this matters

A keyword matcher only finds exact words.   
A semantic tracker can detect the same meaning across phrases like:

- “This is out of our budget.” 
- “It may be difficult to get pricing approved internally.” 
- “We like the product, but cost is the main blocker.” 

All three can reasonably fire a pricing or budget concern tracker even though the wording is different. 

#### Engineering takeaway

If the design starts looking like `text.includes("pricing")`, it is no longer Smart Tracker as defined by the architecture.   
The correct path is semantic detection via the AI services layer, with confidence-scored evidence returned as structured JSON. 