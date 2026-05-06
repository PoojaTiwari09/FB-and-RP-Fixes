# Doc #11b — TDD: AI Topic Tagger

## 1. Document Control

- **Document title:** Technical Design Document — AI Topic Tagger 
- **Feature name:** AI Topic Tagger 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-04 Conversation Intelligence 
- **Internal architecture placement:** Primary ownership is in M-04 because topic tagging is part of the Conversation Intelligence responsibilities that analyze completed call transcripts and produce structured topic labels. 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Tech Lead / Conversation Intelligence squad 
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Module note:** For planning and business-facing documentation, this feature is grouped under the single module **M2 Conversation Intelligence pack** so the squad can work with one clear customer-facing module.   
> **Architecture note:** Internal architecture ownership across M2 is split between **M-04** and **M-05**; for AI Topic Tagger, ownership stays in **M-04**, while downstream consumers include **M-05 Smart Tracking** and **M-06 Insight Generation**. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Architecture view owner:** M-04 Conversation Intelligence. 
- **Key dependency direction:** M-04 produces topic tags, and downstream modules consume them through event-driven contracts rather than direct coupling. 

---

## 2. Purpose

AI Topic Tagger analyzes call transcripts and automatically labels key discussion topics such as pricing, next steps, objections, and product issues, making conversations structured and searchable.   
Its job is to turn raw transcript text into normalized topic signals that can power filtering, downstream analysis, and insight generation. 

This feature belongs in M2 because M2 is the business-facing module for understanding what happened in conversations and exposing structured insight from that content.   
The value is strongest for reps, managers, RevOps, and analytics users because topic tags make large volumes of conversations easier to search, segment, summarize, and analyze. 

### Business problem

- Raw transcripts are hard to scan at scale. 
- Teams need structured labels to find conversations about pricing, objections, competitors, product issues, and next steps. 
- Downstream features cannot reliably summarize or track patterns if topic signals are not standardized first. 

### What the feature does

- Detects key topics in completed call transcripts. 
- Stores topic tags with confidence and source metadata in tenant-scoped tables. 
- Emits `call.topics.tagged` for downstream modules. 
- Feeds Smart Tracking and Insight Generation with structured topic signals. 

---

## 3. Scope

### In scope

- Topic tagging for completed calls after transcript ingestion. 
- AI-based topic detection using the internal AI services layer. 
- Storage of topic tags in M-04-owned data tables. 
- Confidence-based suppression and filtering of weak tags. 
- Event emission through `call.topics.tagged`. 

### Out of scope

- Smart Tracker intent detection logic, which belongs in M-05. 
- Theme clustering across large conversation sets, which belongs to AI Theme Spotter. 
- Full-text or semantic conversation search implementation, which belongs to Searchable Conversation Library in M-05. 
- UI implementation details for displaying tags on transcript pages. 

### Assumptions

- A valid transcript exists from upstream transcription flow. 
- The call is tenant-scoped and available for M-04 processing. 
- Topic models or taxonomy definitions are available at global or tenant-custom level. 
- AI logic runs in Python services, while business orchestration and persistence remain in TypeScript. 

### Upstream dependencies

- M-01 call transcription outputs. 
- M-03 Revenue Graph context where linked context is useful for better downstream enrichment. 
- Platform Core tenanting, auth, queues, and audit services. 

### Downstream consumers

- M-05 Smart Tracking consumes `call.topics.tagged`. 
- M-06 Insight Generation consumes `call.topics.tagged` and includes topic tags in summary structures. 
- Search and downstream analytics can use persisted topic tags as structured filters. 

---

## 4. Users and Triggers

### Primary users

- Sales reps searching for calls by discussion area. 
- Managers and enablement teams analyzing discussion patterns. 
- RevOps and insight workflows that need structured topic signals. 

### System triggers

- Primary trigger is `call.transcription.completed`. 
- Topic-tagging jobs are enqueued by M-04 when transcription finishes. 

### Entry points

- Async queue job from transcript completion event. 
- Read API `GET /api/v1/conversation-intelligence/calls/:id/topics`. 

### Preconditions

- Transcript must exist and pass basic validation. 
- Tenant context must be available in every job and request. 
- Topic taxonomy/model configuration must be retrievable for the tenant. 

---

## 5. Functional Flow

### Happy path

1. M-01 completes transcription and emits `call.transcription.completed`.   
2. M-04 enqueues a topic-tagging job for the call.   
3. M-04 loads transcript content, speaker segments if needed, and the relevant topic model/taxonomy for the tenant.   
4. M-04 calls the internal AI service endpoint `POST /v1/tag-topics`.   
5. The AI service returns candidate topics with confidence scores and optional evidence mapping.   
6. M-04 applies confidence threshold and suppression rules to remove weak, duplicate, or non-visible topics.   
7. M-04 persists the surviving topic tags in `topictags`.   
8. M-04 emits `call.topics.tagged`.   
9. M-05 Smart Tracking and M-06 Insight Generation consume the event downstream. 

### Alternate paths

- If the tenant uses custom topic taxonomy, M-04 loads tenant-custom topic model definitions instead of only global defaults. 
- If both AI-model and vocabulary-rule sources contribute, the stored tag source identifies which path produced the tag. 
- If no topic crosses threshold, the system stores no tags and treats the run as a valid no-topic result rather than a failure. 

### Failure paths

- Invalid or missing transcript payload causes validation failure before AI call. 
- AI service timeout or provider error triggers queue retry policy. 
- Structurally invalid AI output is rejected and logged for investigation. 

### Retry behavior

- Topic-tagging runs on BullMQ-backed async processing with retry safety. 
- Replayed events must not create duplicate topic-tag rows for the same call and topic identity. 
- Retry strategy should use exponential backoff and deterministic job IDs where possible. 

---

## 6. Inputs and Outputs

### Inputs

- `callId` 
- `tenantId` 
- Transcript text and optionally speaker/timestamp context. 
- Topic taxonomy/model definitions from `topicmodels`. 

### Output records

- `topictags` rows containing call ID, tenant ID, topic name, source, confidence score, and tag timestamp. 

### Events emitted

- `call.topics.tagged` with payload fields: `eventid`, `callid`, `tenantid`, `topics[{topicname, confidencescore}]`, `taggedat`. 

### APIs consumed

- Internal AI endpoint: `POST /v1/tag-topics`. 

### APIs exposed

- `GET /api/v1/conversation-intelligence/calls/:id/topics` for retrieving topic tags for a call. 

---

## 7. Data Model

### Tables used

- `topictags` stores topic tags applied to calls. 
- `topicmodels` stores topic taxonomy/model definitions. 
- `transcripts` and related transcript-domain data are read from upstream capture/transcription stores. 

### Fields owned

#### `topictags`
- `tagid` 
- `callid` 
- `tenantid` 
- `topicname` 
- `source` (`aimodel` or `vocabularyrule`) 
- `confidencescore` 

#### `topicmodels`
- `modelid` 
- `tenantid` 
- `topics` JSONB 
- `type` (`global` or `tenantcustom`) 
- `lasttrainedat` 

### Validation rules

- Every row must include `tenantid`. 
- Topic tags must resolve to a valid topic definition set or a permitted generated topic rule. 
- Confidence must be numeric and within expected bounds. 
- Topic name must be non-empty and normalized for indexing/search use. 

### Idempotency keys

- Recommended uniqueness basis: `tenantid + callid + normalizedTopicName + source + modelVersion`. 
- Event replay must upsert or ignore duplicates rather than insert duplicate tags. 

### Retention notes

- Topic tags are derived conversation intelligence artifacts and follow tenant retention rules. 
- Tags should remain reproducible from transcript plus taxonomy versioning where possible. 

---

## 8. AI Processing

### AI task performed

The AI task is topic classification over transcript content, returning structured topic labels with confidence scores.   
This is a conversation-understanding task in M-04, not a tracker intent-detection task in M-05. 

### AI service endpoint

- `POST /v1/tag-topics` in the internal AI services layer. 

### Model or pipeline type

- M-04 uses the AI services layer for topic tagging, with business orchestration in NestJS and AI logic in Python. 
- The architecture allows topics to be sourced from model definitions and vocabulary-based rules, with the stored `source` field tracking origin. 

### Input payload

Recommended payload:

```json
{
  "tenantId": "uuid",
  "callId": "uuid",
  "transcriptText": "full transcript text",
  "topicModel": {
    "modelId": "uuid",
    "type": "tenantcustom",
    "topics": [
      {
        "topicName": "pricing",
        "keywords": ["budget", "price", "cost"],
        "weight": 1.0
      },
      {
        "topicName": "next steps",
        "keywords": ["follow-up", "next meeting", "action items"],
        "weight": 1.0
      }
    ]
  },
  "context": {
    "language": "en",
    "callType": "sales"
  }
}
```

This matches the architecture pattern that AI services receive structured JSON and return structured machine-readable output. 

### Output schema

Recommended response schema:

```json
{
  "callId": "uuid",
  "topics": [
    {
      "topicName": "pricing",
      "confidenceScore": 0.91,
      "source": "aimodel",
      "evidenceSnippet": "We need to understand your pricing before moving ahead."
    },
    {
      "topicName": "next steps",
      "confidenceScore": 0.84,
      "source": "aimodel",
      "evidenceSnippet": "Let's schedule the follow-up demo for next week."
    }
  ],
  "modelVersion": "v1",
  "latencyMs": 420
}
```

### Confidence handling

- Confidence-score gating is part of the approved AI safety pattern. 
- Weak candidate topics should be suppressed rather than stored if they do not meet the configured threshold. 
- Topic suppression is preferable to noisy tagging because downstream Smart Tracking and summaries depend on topic quality. 

---

## 9. Service and Integration Design

### Internal services

- **NestJS M-04 service:** orchestrates topic-tagging workflow, validation, persistence, and event emission. 
- **Python AI service:** executes `v1/tag-topics` inference. 
- **BullMQ + Redis:** handles async execution, retry, and event-driven chaining. 
- **Platform Core:** provides tenant interception, auth context, and audit logging. 

### External integrations

- Topic tagging itself does not directly expose customer-facing external integrations beyond approved model-provider routing inside the AI services layer. 

### Rate limits, quotas, and fallback

- AI provider interaction must stay behind the AI services layer, not in product TypeScript code. 
- Retry and fallback behavior should be centralized through the AI services layer and LiteLLM-based provider routing. 

---

## 10. Security and Compliance

### Tenant isolation

All topic-model definitions and topic tags must be tenant-scoped, with RLS enforcement across owned tables. 

### Access control

- Admins can manage custom topic taxonomy or model configuration if that capability is exposed. 
- Authorized users can read topic tags through protected APIs. 

### Sensitive data handling

- Topic tags are derived from customer conversation content and remain sensitive business metadata. 
- Evidence snippets, if stored later, should be minimized and tenant-protected. 

### Audit logging

- Changes to tenant-custom taxonomy or topic model definitions should be audit logged. 
- Reprocessing and manual governance actions should be traceable. 

### Compliance considerations

- Topic outputs must follow the same tenant data governance rules as transcripts and other AI-generated outputs. 

---

## 11. Error Handling

### Validation failures

- Missing transcript, invalid topic model definition, or malformed AI response should fail fast and log clear diagnostics. 

### Low-confidence tag handling

- Low-confidence candidate tags should be suppressed and not emitted downstream if below threshold. 
- Optionally, suppressed candidates may be logged for offline evaluation but should not appear in product-facing results. 

### Queue retry and DLQ behavior

- Use BullMQ retry policies with dead-letter handling after exhaustion. 

### Partial success rules

- If some candidate tags are valid and others are malformed or below threshold, persist only valid tags and complete successfully. 
- Topic-tagging is not all-or-nothing if partial output remains trustworthy. 

---

## 12. Observability

### Logs

- Structured logs should include `tenantId`, `callId`, `modelId`, job ID, and tag count. 

### Metrics

Recommended metrics:

- Topic-tagging job count. 
- Topic-tagging success/failure/retry count. 
- AI latency for `v1/tag-topics`. 
- Average topics per call. 
- Suppression rate by topic and model version. 

### Alerts

Recommended alerts:

- Spike in topic-tagging failures. 
- AI timeout/error bursts on `v1/tag-topics`. 
- Sudden drop to near-zero tags across calls, which may indicate taxonomy or prompt failure. 
- Unusually high suppression rate after taxonomy/model changes. 

### Traces

- Trace the flow from `call.transcription.completed` through AI inference, persistence, and `call.topics.tagged` emission. 

### Operational dashboards

- Grafana dashboards should show queue depth, tag throughput, suppression rate, AI latency, and downstream event emission rate. 

---

## 13. Non-Functional Requirements

### Performance

- Topic tagging must run asynchronously and must not block ingestion or transcript storage. 

### Scalability

- The system should support large call volumes using queue-backed fan-out processing. 

### Reliability

- Duplicate event delivery must not produce duplicate tags. 
- Provider or endpoint failures should be retried safely through centralized queue orchestration. 

### Latency expectations

- Topic tagging is a post-call async workflow where throughput, correctness, and stable event emission matter more than synchronous response latency. 

---

## 14. Test Strategy

### Unit tests

- Topic normalization logic. 
- Confidence threshold and suppression rules. 
- Source assignment rules (`aimodel`, `vocabularyrule`). 
- Event payload builder for `call.topics.tagged`. 

### Integration tests

- `call.transcription.completed` to queued topic-tagging flow. 
- Persistence into `topictags`. 
- `GET /calls/:id/topics` API behavior. 
- Downstream event emission correctness. 

### Contract tests

- `POST /v1/tag-topics` request and response schema validation. 
- `call.topics.tagged` event schema validation. 

### Idempotency tests

- Replay of the same transcription-completed event does not duplicate tags. 
- Retry after transient AI failure preserves deterministic output handling. 

### Quality evaluation tests

- Golden dataset for topic precision and recall by common business topics. 
- Regression testing after taxonomy changes or prompt/model updates. 
- Threshold tuning tests to balance false positives and false negatives. 

---

## 15. Open Questions

### Pending design decisions

- Should topics be stored by `topicname` only, or should `topicid` from taxonomy become mandatory in all persisted tag rows? 
- Should a tenant be allowed to hide certain global topics without redefining the full model? 
- Should suppressed low-confidence tags be retained in a hidden evaluation log for AI quality tuning? 

### Risks

- Over-tagging can make search and downstream summaries noisy. 
- Under-tagging can reduce discoverability and downstream insight quality. 
- Poorly governed tenant-custom taxonomies may break cross-tenant comparability. 

### Deferred items

- Topic hierarchy support, such as parent/child tags. 
- Topic-level UI explanations and evidence surfacing. 
- Auto-suggestion of new taxonomy entries from recurring uncategorized discussions. 

---

## 16. Feature-Specific Appendix

### 16.1 Topic taxonomy and source

The feature mapping defines AI Topic Tagger as the capability that labels key discussion topics on every call, such as pricing, next steps, objections, and product issues, making conversations structured and searchable.   
The architecture supports topic definitions through `topicmodels` and stores applied topic tags in `topictags`. 

#### Taxonomy source types

- **Global taxonomy:** platform-provided default topics used across tenants. 
- **Tenant-custom taxonomy:** tenant-specific topics stored in `topicmodels` with type `tenantcustom`. 
- **Vocabulary-rule-assisted source:** rule-driven support path identified by `source = vocabularyrule`. 

#### Recommended taxonomy shape

```json
{
  "modelId": "uuid",
  "type": "tenantcustom",
  "topics": [
    {
      "topicName": "pricing",
      "keywords": ["budget", "cost", "discount"],
      "weight": 1.0
    },
    {
      "topicName": "next steps",
      "keywords": ["follow-up", "next meeting", "action item"],
      "weight": 1.0
    },
    {
      "topicName": "product issues",
      "keywords": ["bug", "integration issue", "limitation"],
      "weight": 0.9
    }
  ]
}
```

#### Source tracking rule

- Every stored tag should keep a `source` field so engineering and analytics teams can distinguish AI-model-generated tags from vocabulary-rule-generated tags. 

### 16.2 Topic detection pipeline

The architecture explicitly assigns topic tagging to M-04 and exposes `POST /v1/tag-topics` through the AI services layer. 

#### Recommended pipeline

1. Receive `call.transcription.completed`.   
2. Fetch transcript and tenant context.   
3. Load global or tenant-custom topic model.   
4. Call `POST /v1/tag-topics`.   
5. Receive candidate topic labels with confidence.   
6. Normalize topic names and apply suppression rules.   
7. Persist accepted tags to `topictags`.   
8. Emit `call.topics.tagged`.   
9. Let downstream M-05 and M-06 consumers continue their own workflows. 

#### Design note

- TypeScript owns orchestration, queueing, persistence, and events. 
- Python owns inference and topic-detection logic. 

### 16.3 Confidence threshold and tag suppression rules

The tooling inventory requires confidence-score gating for AI outputs, and the system architecture provides confidence-scored topic tagging outputs. 

#### Recommended suppression rules

Suppress a candidate topic when any of the following is true:

- `confidenceScore < TOPIC_MIN_CONFIDENCE`. 
- Topic is marked invisible or deprecated in taxonomy config. 
- Topic is a duplicate of an already accepted normalized topic for the same call. 
- Evidence is too weak or too generic based on quality heuristics added in future versions. 

#### Example pseudo-logic

```ts
acceptedTopics = candidates.filter(
  (t) =>
    t.confidenceScore >= TOPIC_MIN_CONFIDENCE &&
    visibleTopics.has(normalize(t.topicName)) &&
    !dedupeSet.has(normalize(t.topicName))
);
```

#### Operational note

- Suppression is safer than exposing noisy tags because topic tags directly feed Smart Tracking and Insight Generation. 

### 16.4 `call.topics.tagged` event schema

The architecture defines `call.topics.tagged` as an M-04 emitted event with downstream consumers in M-05 Smart Tracking and M-06 Insight Generation. 

#### Canonical event payload

```json
{
  "eventid": "uuid",
  "callid": "uuid",
  "tenantid": "uuid",
  "topics": [
    {
      "topicname": "pricing",
      "confidencescore": 0.91
    },
    {
      "topicname": "next steps",
      "confidencescore": 0.84
    }
  ],
  "taggedat": "2026-04-29T12:45:00Z"
}
```

#### Recommended v1 extension fields

```json
{
  "modelVersion": "v1",
  "taxonomyType": "tenantcustom",
  "tagCount": 2
}
```

These extension fields are helpful for observability and downstream debugging, but they should only be added through controlled event contract governance. 

### 16.5 Downstream consumers of topic tags

The architecture explicitly states that `call.topics.tagged` is consumed by **M-05 Smart Tracking** and **M-06 Insight Generation**. 

#### M-05 Smart Tracking

- Uses topic tags as structured conversation signals that can support indexing and filtered search behavior. 
- Smart Tracking also indexes topic tags into Meilisearch for filtered search workflows. 

#### M-06 Insight Generation

- Uses topic tags as part of summary structure generation. 
- Topic tags can become part of summaries, briefs, and other synthesized outputs. 

#### Key system importance

- Topic tags are not just UI labels; they are intermediate structured outputs used by later modules. 
- This is why topic quality, suppression rules, and event contract stability matter. 