# Doc #11c — Technical Design Document: AI Data Extractor

## 1. Document Control

- **Document Title:** TDD — AI Data Extractor
- **Feature Name:** AI Data Extractor
- **Module Name:** M-01 Capture & Transcription
- **Document ID:** DOC-11C-M01-AI-DATA-EXTRACTOR
- **Version:** v3.0
- **Status:** Approved
- **Owner:** AI Lead / Backend Lead
- **Reviewers:** Tech Lead, M1 Lead, M10 Lead, Security Owner, QA Lead, RevOps Product Owner
- **Last Updated:** 2026-05-18
- **Primary Upstream References:** System Architecture Document, M-01 feature map, Tooling and Services Inventory
- **Primary Downstream Dependencies Enabled By This Feature:** CRM write-back readiness in M10 Data & Compliance, Revenue Graph enrichment, future workflow triggers, AI summaries quality improvement in M3

### 1.1 Purpose of this document

This document defines the internal technical design for the **AI Data Extractor** feature inside **M1 Capture & Transcription**. It explains how the platform converts completed transcripts and related interaction context into structured CRM-ready fields with confidence scoring, review gating, event publication, and downstream handoff.

### 1.2 Design authority and boundaries

This TDD owns the feature-level design for extraction orchestration, extraction schemas, confidence handling, persistence, and event publication from M1. It does not own final CRM write-back behavior, entity linking, or CRM system-of-record synchronization logic, which belongs downstream to M10 Data & Compliance.

### 1.3 Why this document matters

AI Data Extractor is one of the first “business value” features after transcription. Once a call is transcribed, this feature turns raw conversation text into structured business data such as next steps, risks, timeline signals, budget hints, competitor mentions, and mapped CRM fields, reducing manual CRM updates by reps.

---

## 2. Purpose

### 2.1 Problem statement

Sales reps often finish calls but do not fully update CRM fields afterward. Important details remain trapped in raw conversations, which leads to stale deals, weak forecasting inputs, and incomplete activity history. AI Data Extractor solves this by transforming call content into structured CRM-compatible outputs automatically.

### 2.2 What this feature does

AI Data Extractor consumes completed call transcripts and related metadata, sends structured extraction requests to the approved Python AI service in `apps/ai-services`, validates the returned JSON, stores extracted outputs in decentralized PostgreSQL table, flags low-confidence items for review, and publishes the `crm.fields.extracted` event for downstream handling.

### 2.3 Why this feature exists in M1

This feature belongs in M1 because extraction starts from captured interaction data and follows directly after transcription. The architecture explicitly places AI Data Extractor in M1, with Call Transcription as its upstream dependency.

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
- Validate AI JSON response shape and field types using Zod.
- Store extracted fields and confidence information in M1-owned persistence (schema `m01_capture_transcription`).
- Mark low-confidence fields for review.
- Publish `crm.fields.extracted` event for M10 consumption.
- Support regeneration or re-run flow in a controlled way.
- Maintain idempotency for repeated events or retries.
- Add observability for extraction success, latency, failure, and low-confidence rate.

### 3.2 Out of scope

- Writing directly to Salesforce, HubSpot, or Dynamics (handled by M10).
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
- Call Transcription output in M1.
- Platform Core for auth, tenant context, audit, and RLS.
- BullMQ + Redis for async extraction jobs.
- PostgreSQL for transcript and extraction persistence under decentralized database schema `m01_capture_transcription`.
- Python AI Services application (`apps/ai-services`).
- M10 Data & Compliance as downstream consumer of extracted CRM field events.

**External/AI dependencies**
- OpenAI via LiteLLM as the primary structured extraction provider path.
- Anthropic as fallback via LiteLLM where configured.
- Optional spaCy or preprocessing utilities inside Python AI services.

---

## 4. Users and Triggers

### 4.1 Primary users or systems

- Sales reps who benefit from auto-filled CRM signals.
- RevOps users who configure or review CRM enrichment workflows.
- M1 backend workers.
- Python AI extraction service.
- M10 Data & Compliance as downstream consumer.

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

---

## 5. Functional Flow

### 5.1 Happy path

1. M1 receives `call.transcription.completed`.
2. Extraction worker loads transcript text, speaker-labeled segments, call metadata, and source details.
3. Worker builds a structured extraction request payload.
4. M1 sends the payload to the Python AI service endpoint for CRM field extraction.
5. AI service returns structured JSON containing extracted fields, mapped field names, and confidence scores.
6. M1 validates the response using strict runtime schema validation.
7. Valid extracted outputs are stored in tenant-scoped extraction records (under `m01_capture_transcription.crm_extracted_fields` table).
8. Fields below the review threshold are marked `flagged_for_review = true`.
9. M1 publishes `crm.fields.extracted` event using the standard envelope, with call ID, tenant ID, extracted fields, and flagged count in the payload.
10. M10 later consumes that event and pushes approved fields into CRM-connected entities.

### 5.2 Alternate paths

- Extraction succeeds but some fields are empty because the conversation did not contain that information.
- Extraction returns partial output, and only valid fields are persisted while invalid ones are rejected and logged.
- Extraction runs before Revenue Graph linking; event still publishes because M10 handles entity association later.
- Extraction may use provider fallback through LiteLLM if the primary provider is unavailable.

### 5.3 Failure paths

- Transcript record missing.
- AI service timeout or non-200 response.
- AI response is not valid JSON.
- JSON shape fails Zod validation.
- DB write fails after valid extraction result.
- Event publication fails after persistence.
- Duplicate extraction request arrives for the same call and version.

### 5.4 Retry behavior

- Transient AI service failures retry through BullMQ with exponential backoff.
- Schema validation failures should not retry endlessly; they should move to failed status and alert engineering.
- DB or queue publish failures may retry safely if writes and publishes are idempotent.

### 5.5 Queue responsibilities

BullMQ is used for extraction job scheduling, AI request retries, regeneration requests, and failed extraction replay.

---

## 6. Inputs and Outputs

### 6.1 Inputs

**Primary upstream inputs**
- `callId`, `tenantId`, `transcriptId`, transcript raw text, speaker-labeled segments, participant list, source platform, occurredAt timestamp, language detected.

**Extraction request inputs to AI service**
- transcript segments, optional call duration and platform, extraction schema version, target CRM field mapping profile.

**Configuration inputs**
- confidence threshold, enabled field set, field mapping configuration, review gating rules.

### 6.2 Output artifacts

This feature produces:
- structured extracted field records, per-field confidence scores, review flags for uncertain fields
- extraction status and version metadata, published `crm.fields.extracted` event payloads.

### 6.3 Events emitted

Primary event:
- `crm.fields.extracted`

The architecture defines this as an M1 event consumed by M10 Data & Compliance, with key payload fields including `eventId`, `callId`, `tenantId`, extracted fields, and flagged count.

---

## 7. Data Model

### 7.1 Tables used

Primary M1 table for AI Data Extractor (under the decentralized database schema namespace `m01_capture_transcription`):
- `m01_capture_transcription.crm_extracted_fields`

### 7.2 Table columns

#### `m01_capture_transcription.crm_extracted_fields`
- `extraction_id` UUID primary key
- `call_id` UUID not null
- `tenant_id` UUID not null
- `transcript_id` UUID not null
- `field_name` varchar not null
- `field_value` text or jsonb not null
- `confidence_score` float not null
- `crm_field_mapping` varchar nullable
- `flagged_for_review` boolean default false
- `pushed_to_crm` boolean default false
- `version` integer default 1
- `source` varchar default `ai_extractor`
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

---

## 8. Extraction Schema Design

### 8.1 Core extraction targets

Focused on structured business signals: next steps, decision timeline, pain points, stakeholder mentions, competitor mentions.

### 8.2 Output contract shape

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

### 8.3 Confidence gating

M-01 AI Data Extractor enforces a strict three-tier pipeline utilizing the Doppler configuration variables `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80) and `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70):
- **Auto-Sync:** confidence $\geq$ `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80) $\rightarrow$ eligible for normal downstream CRM write-back via event triggers.
- **Review Gating:** `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70) $\leq$ confidence $<$ `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80) $\rightarrow$ store in table `m01_capture_transcription.crm_extracted_fields` and flag for review (`flagged_for_review = true`) to await manual operator approval.
- **Silent Exclusion:** confidence $<$ `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70) $\rightarrow$ silently exclude and drop from opportunity sync pipeline.

---

## 9. Processing and Service Design

### 9.1 TypeScript responsibilities

M1 modular code in `/modules/m01-capture-transcription/src/`:
- `m01-capture-transcription.controller.ts` (exposes triggers and reads)
- `m01-capture-transcription.service.ts` (orchestrates AI extraction requests and parses with Zod)
- `m01-capture-transcription.repository.ts` (decentralized Prisma wrapper writes to `m01_capture_transcription.crm_extracted_fields`)
- `m01-capture-transcription.worker.ts` (async BullMQ worker handles post-transcription pipeline)

### 9.2 Python responsibilities

FastAPI service in `apps/ai-services` handles model calls and prompt execution, attaching confidence scores.

---

## 10. Event Contract

### 10.1 Published event

`crm.fields.extracted` is sent after DB persistence. M10 Data & Compliance consumes it for CRM write-backs.

---

## 11. Security and Compliance

### 11.1 Tenant isolation

Every query enforces `tenantId` filtering and PostgreSQL RLS.

### 11.2 secret handling

AI provider credentials and keys are strictly managed inside Doppler as the SSOT secrets manager.

---

## 12. Observability

Metrics (extraction success rates, latency, low-confidence frequencies) are monitored inside Grafana and sent to Sentry.

---

## 13. Test Strategy

All local tests reside in `/modules/m01-capture-transcription/tests/` and cover:
- Zod schema validation
- Duplicate extraction guards
- BullMQ worker integration
- Tenant isolation checks

---

## 14. Pseudocode & Acceptance Criteria

### 14.1 Orchestration Pseudocode
```typescript
async function processExtraction(callId: string, tenantId: string): Promise<void> {
  const transcript = await db.transcripts.findUnique({ where: { call_id: callId } });
  if (!transcript) throw new Error("Transcript not found");
  
  const promptInput = preparePrompt(transcript.raw_text);
  const aiResponse = await aiServiceClient.extractFields(promptInput);
  const validatedData = ExtractorSchema.parse(aiResponse); // Zod verification
  
  const reviewThreshold = parseFloat(process.env.M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD || "0.80");
  const excludeThreshold = parseFloat(process.env.M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD || "0.70");
  
  for (const field of validatedData.fields) {
    if (field.confidence_score < excludeThreshold) {
      logger.info(`Field ${field.fieldName} dropped due to low confidence ${field.confidence_score}`);
      continue; // Silent Exclusion
    }
    
    const flaggedForReview = field.confidence_score < reviewThreshold; // Review required between [0.7, 0.8)
    
    await db.crm_extracted_fields.create({
      data: {
        call_id: callId,
        tenant_id: tenantId,
        transcript_id: transcript.transcript_id,
        field_name: field.fieldName,
        field_value: field.fieldValue,
        confidence_score: field.confidence_score,
        crm_field_mapping: field.crmFieldMapping,
        flagged_for_review: flaggedForReview,
        pushed_to_crm: false,
      }
    });
  }
  
  const flaggedCount = validatedData.fields.filter(
    f => f.confidence_score >= excludeThreshold && f.confidence_score < reviewThreshold
  ).length;
  
  await eventBus.publish("crm.fields.extracted", {
    eventId: uuid(),
    eventName: "crm.fields.extracted",
    eventVersion: "v1",
    tenantId,
    producer: "m01-capture-transcription",
    occurredAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    correlationId: transcript.correlation_id,
    payload: {
      callId,
      flaggedCount,
    }
  });
}
```

---

## 15. Implementation Notes for Freshers

- Keep all business workflow code in NestJS TypeScript.
- Keep all AI prompt and model logic in Python FastAPI.
- Never write directly to CRM from this feature (handled by M10).
- Always include `tenantId` in every query and event.
- Validate every AI response with Zod before using it.
- Design for retries, because queues and AI services can fail.
- Do not bypass event flow just because direct function calls feel easier.
