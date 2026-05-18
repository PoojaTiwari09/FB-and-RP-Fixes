# Doc #11c — Technical Design Document: AI Data Extractor

## 1. Document Control

- **Document Title:** TDD — AI Data Extractor
- **Feature Name:** AI Data Extractor
- **Module Name:** M-01 Capture & Transcription
- **Document ID:** DOC-11C-M01-AI-DATA-EXTRACTOR
- **Version:** v0.1
- **Status:** Draft
- **Owner:** AI Lead / Backend Lead
- **Reviewers:** Tech Lead, M-01 Lead, M-03 Lead, Security Owner, QA Lead, RevOps Product Owner
- **Last Updated:** 2026-04-29
- **Primary Upstream References:** System Architecture Document, M-01 feature map, Tooling and Services Inventory
- **Primary Downstream Dependencies Enabled By This Feature:** CRM write-back readiness in M-03, Revenue Graph enrichment, future workflow triggers, AI summaries quality improvement

### 1.1 Purpose of this document

This document defines the internal technical design for the **AI Data Extractor** feature inside **M-01 Capture & Transcription**. It explains how the platform converts completed transcripts and related interaction context into structured CRM-ready fields with confidence scoring, review gating, event publication, and downstream handoff.

### 1.2 Design authority and boundaries

This TDD owns the feature-level design for extraction orchestration, extraction schemas, confidence handling, persistence, and event publication from M-01. It does not own final CRM write-back behavior, entity linking, or CRM system-of-record synchronization logic, which belongs downstream to M-03 Revenue Graph.

### 1.3 Why this document matters

AI Data Extractor is one of the first “business value” features after transcription. Once a call is transcribed, this feature turns raw conversation text into structured business data such as next steps, risks, timeline signals, budget hints, competitor mentions, and mapped CRM fields, reducing manual CRM updates by reps.

---

## 2. Purpose

### 2.1 Problem statement

Sales reps often finish calls but do not fully update CRM fields afterward. Important details remain trapped in raw conversations, which leads to stale deals, weak forecasting inputs, and incomplete activity history. AI Data Extractor solves this by transforming call content into structured CRM-compatible outputs automatically.

### 2.2 What this feature does

AI Data Extractor consumes completed call transcripts and related metadata, sends structured extraction requests to the approved Python AI service, validates the returned JSON, stores extracted outputs, flags low-confidence items for review, and publishes the `crm.fields.extracted` event for downstream handling.

### 2.3 Why this feature exists in M-01

This feature belongs in M-01 because extraction starts from captured interaction data and follows directly after transcription. The architecture explicitly places AI Data Extractor in M-01, with Call Transcription as its upstream dependency and deployed status in the early platform path.

### 2.4 Business value

This feature enables:
- Automatic capture of structured sales signals from conversations.
- Better CRM hygiene without asking reps to do manual updates.
- Faster downstream deal/account intelligence readiness.
- Confidence-based safety so uncertain outputs can be reviewed before CRM push.
- A reusable structured event contract for the rest of the platform.

---

## 3. Scope

### 3.1 In scope

- Trigger extraction after successful transcription completion.
- Build extraction payloads from transcript and source metadata.
- Call Python AI service for structured field extraction.
- Validate AI JSON response shape and field types.
- Store extracted fields and confidence information in M-01-owned persistence.
- Mark low-confidence fields for review.
- Publish `crm.fields.extracted` event for M-03 consumption.
- Support regeneration or re-run flow in a controlled way.
- Maintain idempotency for repeated events or retries.
- Add observability for extraction success, latency, failure, and low-confidence rate.

### 3.2 Out of scope

- Writing directly to Salesforce, HubSpot, or Dynamics.
- Final deal/account/contact matching logic.
- Revenue Graph relationship creation.
- UI-heavy review workbench design beyond basic status exposure.
- General-purpose summarization, topic tagging, or scorecard evaluation.
- Training custom models from tenant data.
- Direct AI provider SDK usage from TypeScript services, which is explicitly forbidden by architecture rules.

### 3.3 Assumptions

- Call Transcription has already completed successfully.
- Transcript text and metadata are stored and available in tenant-scoped tables.
- Python AI services are exposed through internal FastAPI endpoints.
- TypeScript product services orchestrate workflow only; inference remains in Python.
- Confidence scores are returned from the AI service for extracted outputs.
- BullMQ and Redis are available for asynchronous processing.

### 3.4 Dependencies

**Internal dependencies**
- Call Transcription output in M-01.
- Platform Core for auth, tenant context, audit, and RLS.
- BullMQ + Redis for async extraction jobs.
- PostgreSQL for transcript and extraction persistence.
- Internal AI services layer over FastAPI.
- M-03 Revenue Graph as downstream consumer of extracted CRM field events.

**External/AI dependencies**
- OpenAI via LiteLLM as the primary structured extraction provider path.
- Anthropic as fallback via LiteLLM where configured.
- Optional spaCy or preprocessing utilities inside Python AI services if needed.

The architecture requires all AI and NLP logic to live in Python services and not in the TypeScript product layer.

---

## 4. Users and Triggers

### 4.1 Primary users or systems

- Sales reps who benefit from auto-filled CRM signals.
- RevOps users who configure or review CRM enrichment workflows.
- M-01 backend workers.
- Python AI extraction service.
- M-03 Revenue Graph as downstream consumer.

### 4.2 Trigger conditions

This feature starts when:
- `call.transcription.completed` is published for a successfully processed call.
- A user explicitly requests extraction regeneration.
- A retryable extraction failure is replayed from queue.
- A backfill job is run for previously transcribed calls.

### 4.3 Entry points

Typical entry points:
- BullMQ consumer for `call.transcription.completed`
- Internal service method such as `enqueueExtraction(callId, tenantId)`
- Optional admin or support re-run endpoint
- Internal AI service endpoint such as `POST /v1/extract-crm-fields`

The architecture states that M-01 emits `crm.fields.extracted` and that extraction is part of the post-transcription path.

### 4.4 Preconditions

Before extraction can run:
- Transcript must exist and be in a completed status.
- Tenant must be resolved.
- Source call must belong to the tenant.
- Required AI service credentials and routing must be configured.
- Extraction schema version must be active and known.
- The call must not already have a successful extraction for the same version unless a regeneration flow is explicitly requested.

---

## 5. Functional Flow

### 5.1 Happy path

1. M-01 receives `call.transcription.completed`.
2. Extraction worker loads transcript text, speaker-labeled segments, call metadata, and source details.
3. Worker builds a structured extraction request payload.
4. M-01 sends the payload to the Python AI service endpoint for CRM field extraction.
5. AI service returns structured JSON containing extracted fields, mapped field names, and confidence scores.
6. M-01 validates the response using strict runtime schema validation.
7. Valid extracted outputs are stored in tenant-scoped extraction records.
8. Fields below confidence threshold are marked `flaggedForReview = true`.
9. M-01 publishes `crm.fields.extracted` with call ID, tenant ID, extracted fields, and flagged count.
10. M-03 later consumes that event and pushes approved fields into CRM-connected entities.

### 5.2 Alternate paths

- Extraction succeeds but some fields are empty because the conversation did not contain that information.
- Extraction returns partial output, and only valid fields are persisted while invalid ones are rejected and logged.
- Extraction runs before Revenue Graph linking; event still publishes because M-03 handles entity association later.
- Extraction may use provider fallback through LiteLLM if the primary provider is unavailable.

### 5.3 Failure paths

- Transcript record missing.
- AI service timeout or non-200 response.
- AI response is not valid JSON.
- JSON shape fails Zod validation.
- DB write fails after valid extraction result.
- Event publication fails after persistence.
- Duplicate extraction request arrives for the same call and version.
- Provider returns low-quality or empty extraction repeatedly.

### 5.4 Retry behavior

- Transient AI service failures retry through BullMQ with exponential backoff.
- Schema validation failures should not retry endlessly; they should move to failed status and alert engineering.
- DB or queue publish failures may retry safely if writes and publishes are idempotent.
- Duplicate `call.transcription.completed` events must not create duplicate extraction records for the same call/version pair.

### 5.5 Queue responsibilities

BullMQ is used for:
- extraction job scheduling
- AI request retries
- regeneration requests
- failed extraction replay
- optional backfill batches for historic calls

This follows the architecture rule that AI calls should be asynchronous through BullMQ rather than direct synchronous request handlers.

---

## 6. Inputs and Outputs

### 6.1 Inputs

**Primary upstream inputs**
- `callId`
- `tenantId`
- `transcriptId`
- transcript raw text
- speaker-labeled segments
- participant list
- source platform
- occurredAt timestamp
- language detected
- optional calendar or source metadata

These come from the transcription completion workflow and stored M-01 data.

**Extraction request inputs to AI service**
- transcript segments
- optional summarized metadata such as call duration and platform
- extraction schema version
- target CRM field mapping profile
- tenant context or workspace extraction settings where allowed

**Configuration inputs**
- confidence threshold
- enabled field set
- field mapping configuration
- review gating rules.

### 6.2 Output artifacts

This feature produces:
- structured extracted field records
- per-field confidence scores
- review flags for uncertain fields
- extraction status and version metadata
- audit trail for re-runs
- published `crm.fields.extracted` event payloads.

### 6.3 Events emitted

Primary event:
- `crm.fields.extracted`

The architecture defines this as an M-01 event consumed by M-03 Revenue Graph, with key payload fields including `eventId`, `callId`, `tenantId`, extracted fields, and flagged count.

Recommended internal lifecycle events:
- `extraction.failed`
- `extraction.regenerated`
- `extraction.review.required`

These are optional internal operational events and do not replace the platform registry event above.

### 6.4 APIs exposed or consumed

**Consumed**
- Internal AI service endpoint such as `POST /v1/extract-crm-fields`
- Optional internal embedding or preprocessing utilities if extraction pipeline evolves

**Exposed**
- Optional read endpoint for extraction status by call
- Optional admin endpoint to re-run extraction for a call
- Internal service method used by workers and downstream UI

The main integration boundary remains internal TypeScript-to-Python API coordination, not direct provider SDK usage in the product service.

---

## 7. Data Model

### 7.1 Tables used

From the architecture, M-01 already owns transcript and source-side ingestion structures. AI Data Extractor should read from transcript records and persist extraction outputs in a dedicated M-01 table rather than mixing them into unrelated entities.

### 7.2 Recommended new table

#### `m01.crmextractedfields`
Recommended columns:
- `extractionId` UUID primary key
- `callId` UUID not null
- `tenantId` UUID not null
- `transcriptId` UUID not null
- `fieldName` varchar not null
- `fieldValue` text or jsonb not null
- `confidenceScore` float not null
- `crmFieldMapping` varchar nullable
- `flaggedForReview` boolean default false
- `pushedToCrm` boolean default false
- `version` integer default 1
- `source` varchar default `ai_extractor`
- `createdAt` timestamptz default now()
- `updatedAt` timestamptz default now()

This structure aligns with the architecture’s explicit references to `crmextractedfields`, `confidenceScore`, `flaggedreview`, and `pushedtocrm` handling in downstream flows.

### 7.3 Recommended indexes

- `CREATE INDEX idx_crmextractedfields_tenant_call ON m01.crmextractedfields(tenantId, callId);`
- `CREATE INDEX idx_crmextractedfields_tenant_field ON m01.crmextractedfields(tenantId, fieldName);`
- `CREATE INDEX idx_crmextractedfields_review ON m01.crmextractedfields(tenantId, flaggedForReview, createdAt DESC);`
- `CREATE UNIQUE INDEX uq_crmextractedfields_call_field_version ON m01.crmextractedfields(callId, fieldName, version);`

### 7.4 Data ownership

M-01 owns raw extraction outputs and confidence flags. M-03 may read these outputs through event payloads or approved interfaces and may update `pushedToCrm` after successful CRM write-back, but M-03 must not mutate the original extracted evidence content itself without an explicit contract.

### 7.5 Data retention notes

- Extracted outputs are tenant-owned customer data.
- They must follow tenant isolation and export rules.
- They must not be used for shared model training without explicit written consent.
- Deletion/export behavior must align with broader data-ownership rules in the architecture.

---

## 8. Extraction Schema Design

### 8.1 Core extraction targets

The feature should focus on structured business signals that are useful and realistically inferable from conversations, such as:
- next steps
- decision timeline
- budget signal
- pain points
- objections
- competitor mentions
- stakeholders mentioned
- risks
- product interest
- follow-up commitments

This aligns with the feature description that AI Data Extractor converts unstructured conversation content into structured CRM data and updates predefined CRM fields automatically.

### 8.2 Output contract shape

Recommended AI response shape:
```json
{
  "callId": "uuid",
  "fields": [
    {
      "fieldName": "next_steps",
      "fieldValue": "Send pricing deck by Friday",
      "confidenceScore": 0.91,
      "crmFieldMapping": "ai_next_steps",
      "evidenceSnippet": "We'll send the pricing deck by Friday."
    },
    {
      "fieldName": "risk_level",
      "fieldValue": "medium",
      "confidenceScore": 0.74,
      "crmFieldMapping": "ai_risk_level",
      "evidenceSnippet": "Budget approval is still pending."
    }
  ],
  "modelVersion": "extractor-v1"
}
```

### 8.3 Validation rules

- `fieldName` must be from approved allowlist or tenant-configured mapped field set.
- `fieldValue` must match expected primitive or enum type.
- `confidenceScore` must be between 0 and 1.
- Empty string values should generally be dropped instead of persisted unless the schema explicitly supports null markers.
- Unknown fields must be rejected and logged.
- Response without valid fields is a valid outcome if the conversation lacked extractable business content.

### 8.4 Confidence gating

Recommended default:
- `confidenceScore >= 0.80` → eligible for normal downstream handling
- `0.70 <= confidenceScore < 0.80` → store but flag for review
- `< 0.70` → store only if policy allows, otherwise mark low-confidence and exclude from push candidate set

The architecture repeatedly uses confidence-score gating and explicitly references `flaggedreview true if confidencescore < 0.7` for AI flows, so the threshold can be tuned but must remain explicit and enforced.

---

## 9. Processing and Service Design

### 9.1 TypeScript responsibilities

The NestJS M-01 service is responsible for:
- receiving event trigger
- loading tenant-scoped source data
- building extraction job payload
- calling internal Python API
- validating response with Zod
- persisting extracted records
- publishing `crm.fields.extracted`
- tracking retries and failures

This follows the architecture rule that product APIs, workflows, and events live in TypeScript.

### 9.2 Python responsibilities

The Python AI service is responsible for:
- prompt construction
- NLP preprocessing if required
- calling LiteLLM / model providers
- returning structured JSON
- attaching confidence scores
- keeping AI logic isolated from product services

This follows the architecture rule that AI inference, NLP, and LLM orchestration live only in Python services.

### 9.3 Internal endpoint contract

Recommended internal endpoint:
- `POST /v1/extract-crm-fields`

Request body:
```json
{
  "tenantId": "uuid",
  "callId": "uuid",
  "transcriptId": "uuid",
  "language": "en",
  "sourcePlatform": "zoom",
  "transcriptSegments": [
    {
      "speaker": "AE",
      "text": "We can send the proposal tomorrow.",
      "timestampStartMs": 120000,
      "timestampEndMs": 126000
    }
  ],
  "schemaVersion": "crm-extractor-v1"
}
```

Response body:
```json
{
  "callId": "uuid",
  "fields": [
    {
      "fieldName": "next_steps",
      "fieldValue": "Send proposal tomorrow",
      "confidenceScore": 0.93,
      "crmFieldMapping": "ai_next_steps",
      "evidenceSnippet": "We can send the proposal tomorrow."
    }
  ],
  "modelVersion": "extractor-v1"
}
```

### 9.4 Idempotency rules

- One extraction version per call should be processed once unless regeneration is explicitly requested.
- Duplicate queue jobs must check for existing successful extraction rows.
- Event publication should use deterministic event keys where possible.
- Re-runs increment `version` instead of overwriting history.

---

## 10. Event Contract

### 10.1 Published event

#### `crm.fields.extracted`

### 10.2 Required payload

```json
{
  "eventId": "uuid",
  "callId": "uuid",
  "tenantId": "uuid",
  "extractedFields": [
    {
      "fieldName": "next_steps",
      "fieldValue": "Send proposal tomorrow",
      "confidenceScore": 0.93,
      "crmFieldMapping": "ai_next_steps"
    }
  ],
  "flaggedCount": 0,
  "occurredAt": "2026-04-29T12:00:00Z"
}
```

### 10.3 Downstream consumer action

M-03 Revenue Graph consumes this event and writes AI-extracted field values to linked account, deal, or contact paths and then pushes approved fields into the connected CRM, setting `pushedtocrm` true on success.

### 10.4 Delivery semantics

- Queue name: `crm.fields.extracted`
- Priority: Normal
- Retries: 3
- Backoff: exponential 30s, 60s, 120s
- DLQ: `crm.fields.extracted.dlq`

These values are explicitly documented in the event registry.

---

## 11. Security and Compliance

### 11.1 Tenant isolation

Every read and write must include `tenantId`, and extraction queries must only load transcripts belonging to that tenant. The architecture treats tenant isolation and RLS as non-negotiable platform rules.

### 11.2 Data sensitivity

Transcript-derived outputs may contain sensitive customer business information. They must be protected with the same access controls as transcripts and CRM-derived context.

### 11.3 AI boundary enforcement

TypeScript services must never call model SDKs directly. All inference goes through Python AI services. This is a hard architecture rule and must be reinforced in code review and tests.

### 11.4 Compliance notes

- Extract only approved CRM enrichment fields.
- Respect compliance settings before downstream CRM push.
- Do not use extracted tenant data for model training without explicit consent.
- Ensure audit logs exist for regeneration, review, and CRM-push-related actions.

### 11.5 Secrets and credentials

- AI provider credentials live in approved secret storage.
- No secrets in repo or request logs.
- Internal service authentication between NestJS and FastAPI should use approved service-to-service auth or internal network controls.

---

## 12. Observability

### 12.1 Logs

Log at minimum:
- extraction job start/end
- transcript lookup failure
- AI service latency
- schema validation failure
- extracted field count
- low-confidence field count
- event publish success/failure

### 12.2 Metrics

Recommended metrics:
- extraction jobs processed
- extraction success rate
- extraction failure rate
- average AI response latency
- low-confidence percentage
- empty extraction percentage
- retry count
- DLQ count

### 12.3 Alerts

Create alerts for:
- spike in extraction failures
- AI latency above threshold
- schema validation failures above baseline
- repeated empty outputs from same provider/model version
- DLQ growth for `crm.fields.extracted`

The architecture already standardizes Sentry, Better Stack, and Grafana for operational monitoring.

---

## 13. Error Handling

### 13.1 Error classes

Recommended categories:
- `TranscriptNotFoundError`
- `ExtractionAlreadyExistsError`
- `AIServiceTimeoutError`
- `AIResponseValidationError`
- `ExtractionPersistenceError`
- `ExtractionEventPublishError`

### 13.2 Recovery strategy

- Missing transcript → fail fast, do not retry endlessly.
- AI timeout → retry with backoff.
- Invalid JSON → fail and alert.
- Partial valid result → persist valid fields only if policy allows; log invalid subset.
- Event publish failure after DB commit → retry publish using idempotent event outbox or safe replay strategy.

### 13.3 Manual operations

Support/admin actions should include:
- re-run extraction
- inspect extraction status
- inspect failed reason
- inspect low-confidence outputs
- replay failed event publication

---

## 14. API and Service Pseudocode

### 14.1 NestJS orchestration pseudocode

```ts
@Processor('call.transcription.completed')
export class ExtractionWorker {
  async handle(job: Job<CallTranscriptionCompletedEvent>) {
    const { callId, tenantId, transcriptId } = job.data;

    const transcript = await this.transcriptRepo.findCompleted(tenantId, transcriptId);
    if (!transcript) throw new TranscriptNotFoundError(callId);

    const existing = await this.extractionRepo.findSuccessfulVersion(tenantId, callId, 1);
    if (existing) return;

    const aiResponse = await this.aiClient.extractCrmFields({
      tenantId,
      callId,
      transcriptId,
      language: transcript.languageDetected,
      sourcePlatform: transcript.sourcePlatform,
      transcriptSegments: transcript.speakerLabeledSegments,
      schemaVersion: 'crm-extractor-v1',
    });

    const parsed = ExtractCrmFieldsResponseSchema.parse(aiResponse);

    // Filter out fields below the exclude threshold (0.70)
    const validFields = parsed.fields.filter(f => f.confidenceScore >= 0.70);

    const rows = validFields.map((f) => ({
      tenantId,
      callId,
      transcriptId,
      fieldName: f.fieldName,
      fieldValue: f.fieldValue,
      confidenceScore: f.confidenceScore,
      crmFieldMapping: f.crmFieldMapping ?? null,
      flaggedForReview: f.confidenceScore < 0.80,
      version: 1,
    }));

    await this.extractionRepo.insertMany(rows);

    await this.eventBus.publish('crm.fields.extracted', {
      eventId: crypto.randomUUID(),
      callId,
      tenantId,
      extractedFields: validFields,
      flaggedCount: rows.filter(r => r.flaggedForReview).length,
      occurredAt: new Date().toISOString(),
    });
  }
}
```

### 14.2 Zod response schema example

```ts
const ExtractedFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldValue: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
  confidenceScore: z.number().min(0).max(1),
  crmFieldMapping: z.string().optional(),
  evidenceSnippet: z.string().optional(),
});

const ExtractCrmFieldsResponseSchema = z.object({
  callId: z.string().uuid(),
  fields: z.array(ExtractedFieldSchema),
  modelVersion: z.string().min(1),
});
```

---

## 15. Testing Strategy

### 15.1 Unit tests

Test:
- payload builder
- confidence threshold logic
- Zod schema validation
- field allowlist enforcement
- duplicate extraction guard
- flagged-review logic

### 15.2 Integration tests

Test with real PostgreSQL and Redis-backed flows:
- successful extraction persistence
- retry behavior on AI timeout
- event publication after write
- idempotent duplicate event handling
- tenant isolation on transcript lookup

### 15.3 Contract tests

Test TypeScript-to-Python contract:
- valid response accepted
- malformed JSON rejected
- unknown fields rejected
- confidence out of range rejected

### 15.4 Event-flow tests

Validate:
- `call.transcription.completed` → extraction job
- extraction persisted
- `crm.fields.extracted` published
- M-03 consumer can process event contract successfully

The architecture explicitly requires event-flow verification, not just unit success, before calling a feature production-ready.

### 15.5 AI evaluation tests

Use golden datasets for:
- extraction accuracy over known transcripts
- confidence calibration checks
- regression detection after prompt/model change
- false-positive and false-negative review

The tooling document explicitly recommends golden datasets, confidence-score gating, and human review loops for safe AI rollout.

---

## 16. Performance and Scaling

### 16.1 Performance targets

Recommended initial targets:
- extraction enqueue within 1 second of transcription completion
- median AI extraction latency under 10 seconds
- p95 end-to-end extraction completion under 30 seconds
- idempotent handling under duplicate event delivery

### 16.2 Scaling considerations

- Queue workers can scale horizontally.
- AI service capacity must be tracked separately from API service capacity.
- Large transcripts may need chunking or prompt window strategies handled in Python.
- Backfills must run at controlled concurrency to avoid provider spikes and cost bursts.

### 16.3 Cost considerations

This feature can create silent cost growth if transcript sizes are large or retries are poorly controlled. The architecture explicitly warns about retry amplification and AI cost concentration, so idempotency and prompt-size discipline are important here.

---

## 17. Rollout Plan

### 17.1 Phase 1 rollout

- Support extraction from completed call transcripts only.
- Use fixed extraction schema version `v1`.
- Emit `crm.fields.extracted`.
- Store flagged low-confidence outputs.
- No direct CRM write in M-01.

### 17.2 Later enhancements

- Tenant-specific extraction field packs.
- Email-based extraction in addition to call transcripts.
- Better evidence spans and source snippets.
- Human correction loop feeding prompt improvements.
- Multi-language extraction improvements.
- Structured support for account-, deal-, and contact-level field classes.

### 17.3 Rollback plan

If extraction quality degrades:
- disable event publication by feature flag if needed
- preserve transcript pipeline independently
- pause CRM downstream consumption
- continue logging failed or low-confidence extraction outcomes for diagnosis

---

## 18. Open Questions

- What exact CRM field allowlist is approved for v1?
- Should low-confidence fields be persisted but excluded from event payload, or included with flags?
- Do we want one row per extracted field or a parent record plus child rows?
- What evidence snippet length is stored by default?
- Will tenant-specific prompt packs be supported in Phase 1 or deferred?
- Should regeneration always increment version, even when prior extraction failed?

---

## 19. Acceptance Criteria

- A completed transcription automatically triggers extraction.
- M-01 calls the Python AI service, not provider SDKs directly.
- Structured extraction response is schema-validated before persistence.
- Extracted fields are stored with confidence score and review flag.
- `crm.fields.extracted` is published with required payload shape.
- Duplicate transcription events do not create duplicate extraction outputs.
- Low-confidence outputs are safely flagged for review.
- Integration and event-flow tests pass with realistic infra dependencies.

---

## 20. Implementation Notes for Freshers

- Keep all business workflow code in NestJS TypeScript.
- Keep all AI prompt and model logic in Python FastAPI.
- Never write directly to CRM from this feature.
- Always include `tenantId` in every query and event.
- Validate every AI response with Zod before using it.
- Design for retries, because queues and AI services can fail.
- Do not bypass event flow just because direct function calls feel easier; the architecture depends on clean module boundaries.
