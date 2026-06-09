# Doc #11a — Technical Design Document: Call Transcription

## 1. Document Control

- **Document Title:** TDD — Call Transcription
- **Feature Name:** Call Transcription
- **Module Name:** M-01 Capture & Transcription
- **Document ID:** DOC-11A-M01-CALL-TRANSCRIPTION
- **Version:** v3.0
- **Status:** Approved
- **Owner:** Tech Lead / Backend Lead
- **Reviewers:** AI Lead, Platform Lead, DevOps Lead, Security Owner, QA Lead
- **Last Updated:** 2026-05-18
- **Primary Upstream References:** System Architecture Document (SAD), M-01 module mapping, Tooling and Services Inventory
- **Primary Downstream Consumers:** M2 Conversation Intelligence, M3 AI Summaries & GenAI, M8 Sales Engagement, M10 Data & Compliance

### 1.1 Purpose of this document

This document defines the internal technical design for the **Call Transcription** feature inside **M-01 Capture & Transcription**. It covers the end-to-end flow from call completion event intake through audio ingestion, transcription processing, transcript persistence, and publication of the `call.transcription.completed` event.

### 1.2 Design authority and boundaries

This TDD owns feature-level implementation details for Call Transcription only. Platform-wide rules such as modular monolith boundaries, event-first communication, tenant isolation, authentication standards, and shared infrastructure patterns remain governed by the SAD and must not be redefined here.

### 1.3 Document status

This version is a working draft intended to lock the skeleton and implementation direction before engineering starts. Open items are listed in Section 15 and must be closed before approval.

---

## 2. Purpose

### 2.1 Problem statement

Revenue intelligence features cannot operate without a reliable transcript. Raw recordings from Zoom, Teams, Google Meet, and telephony systems are not directly usable by downstream modules for search, AI analysis, CRM enrichment, or insight generation.

### 2.2 What this feature does

Call Transcription converts a completed call recording into structured, speaker-labeled transcript data. It validates inbound source events, fetches or receives the recording reference, stores the audio in platform-controlled storage, sends the audio to the dedicated Python transcription service, stores the returned transcript artifacts, and emits `call.transcription.completed` for downstream modules.

### 2.3 Why this feature exists in M-01

M-01 is the capture-stage foundation of the platform. Its job is to collect interactions, convert them into usable structured assets, and make those assets available to downstream modules through stable event contracts.

### 2.4 Business value

This feature enables:
- Searchable conversation data.
- AI understanding of customer interactions.
- CRM field extraction from transcripts.
- Downstream summaries, topic tagging, scorecards, trackers, and deal/account intelligence.

If transcription fails, most downstream value chains stop because many later modules depend on the `call.transcription.completed` event as their entry signal.

---

## 3. Scope

### 3.1 In scope

- Receiving call completion signals from supported source systems.
- Verifying source authenticity for webhook-based providers.
- Creating and maintaining the M-01 call record.
- Downloading and storing raw audio in approved storage.
- Enqueuing transcription jobs using BullMQ.
- Sending audio references to the dedicated transcription service.
- Receiving transcript results from the transcription service callback.
- Persisting transcript text, speaker segments, language, provider, and confidence.
- Updating call processing status.
- Emitting `call.transcription.completed`.
- Idempotency checks for duplicate source events and duplicate processing attempts.
- Retry and dead-letter behavior for recoverable failures.

### 3.2 Out of scope

- Topic detection, scorecards, summaries, sentiment, or tracker detection.
- CRM write-back logic.
- UI transcript editing workflows.
- Revenue Graph entity linking.
- Email/calendar ingestion.
- Real-time in-call transcription.
- Human QA tooling beyond flagging for review.
- Cross-module business logic outside M-01.

### 3.3 Assumptions

- A source system is already connected through M-01 Native Connectors.
- The recording is available either through a provider URL or provider fetch workflow.
- Redis and BullMQ are operational.
- PostgreSQL and Supabase Storage are operational.
- The Python transcription service is deployed and reachable on the internal network.
- Tenant context is available at the M-01 entry layer.

### 3.4 Dependencies

**Internal dependencies**
- Platform Core: tenant resolution, auth guards where applicable, audit logging.
- M-01 Native Connectors: source configuration and webhook secrets.
- BullMQ + Redis: async job orchestration.
- PostgreSQL: call and transcript persistence.
- Supabase Storage: raw audio storage.

**External dependencies**
- Zoom, Microsoft Teams, Google Meet, dialer/telephony providers.
- Transcription service (Python FastAPI).
- Whisper as primary ASR path.
- AssemblyAI as fallback path for transcription failures.

---

## 4. Users and Triggers

### 4.1 Primary users or systems

- Conferencing providers such as Zoom, Teams, and Google Meet.
- Telephony or dialer systems.
- M-01 internal ingestion workers.
- The Python transcription service.
- Downstream product modules that consume `call.transcription.completed`.

### 4.2 Trigger conditions

This flow starts when one of the following happens:
- A provider sends a “call completed” or “recording available” webhook.
- A sync job discovers a newly available recording.
- An admin or internal operator manually re-triggers processing for a failed call.

Primary production path is the provider completion webhook followed by async processing.

### 4.3 Entry points

Possible entry points:
- `POST /api/v1/m01-capture-transcription/webhook/zoom`
- `POST /api/v1/m01-capture-transcription/webhook/teams`
- `POST /api/v1/m01-capture-transcription/webhook/meet`
- `POST /api/v1/m01-capture-transcription/webhook/dialer`
- Internal reprocess job endpoint or admin workflow
- BullMQ worker callback handler for transcription completion

The webhook endpoints are the main ingestion points for Phase 1.

### 4.4 Preconditions

Before processing begins:
- A valid tenant-scoped ingestion source must exist.
- Provider authentication or webhook verification must pass.
- The recording URL or file reference must be present.
- The call must not already be completed for the same `callId`.
- Required infrastructure services must be healthy enough to enqueue the job.

---

## 5. Functional Flow

### 5.1 Happy path

1. Provider sends call completion webhook to the relevant M-01 endpoint.
2. M-01 verifies authenticity using HMAC or provider-specific verification.
3. M-01 performs idempotency check using provider call identity and tenant context.
4. M-01 creates `m01_capture_transcription.calls` row with initial status such as `pending`.
5. M-01 downloads the recording or validates provider recording availability.
6. M-01 uploads raw audio to approved object storage and updates the call record.
7. M-01 enqueues a BullMQ transcription job with `callId`, `tenantId`, `audioUrl`, `durationSeconds`, and provider hint.
8. The dedicated transcription service dequeues the job.
9. The transcription service downloads the audio from storage.
10. The transcription service runs ASR using Whisper as primary and falls back to AssemblyAI when needed.
11. The transcription service performs diarization and timestamp alignment.
12. The transcription service returns transcript payload to the M-01 internal callback endpoint.
13. M-01 stores transcript data in `m01_capture_transcription.transcripts`.
14. M-01 updates the call record status to `completed`.
15. M-01 emits `call.transcription.completed` with the canonical event payload.
16. Downstream modules independently consume the event through BullMQ.

### 5.2 Alternate paths

- Provider webhook is valid, but recording download is temporarily unavailable, so M-01 retries fetch with exponential backoff.
- Whisper fails, so the transcription service reroutes to AssemblyAI fallback.
- Language hint is missing, so language is auto-detected during transcription.
- Speaker diarization produces low confidence speaker boundaries, so transcript is still stored but flagged for downstream review rules if configured.

### 5.3 Failure paths

- Invalid webhook signature: reject request, do not create processing job.
- Duplicate call event: acknowledge safely and skip duplicate processing.
- Recording fetch fails after retries: mark call as `audiofetchfailed`.
- Both ASR providers fail: mark call as `transcriptionfailed`.
- Callback from transcription service fails repeatedly: BullMQ retries, then dead-letter on exhaustion.
- Database write fails after transcript completion: retry via worker; dead-letter if exhausted.
- Event publish fails transiently: retry through queue-backed event mechanism.

### 5.4 Retry behavior

- Webhook duplicate deliveries must be harmless through idempotency checks.
- Audio fetch should retry up to 3 times with exponential backoff.
- Transcription job should retry up to 3 attempts.
- Whisper provider failure should trigger one provider-level fallback path before total job failure.
- Callback persistence failures should use queue retries and then move to dead-letter handling if exhausted.

### 5.5 BullMQ responsibilities

BullMQ is used for:
- Decoupling webhook receipt from heavy processing.
- Running transcription jobs asynchronously.
- Handling retry and backoff logic.
- Providing dead-letter recovery patterns.
- Publishing downstream events in a durable async way.

---

## 6. Inputs and Outputs

### 6.1 Inputs

**Inbound webhook input**
- Provider event metadata
- Provider call identifier
- Recording URL or recording reference
- Tenant/source mapping context
- Call duration
- Participants if available
- Timestamp of completion
- Signature headers for verification

**Internal processing input**
- `callId`
- `tenantId`
- `audioUrl`
- `durationSeconds`
- `sourcePlatform`
- `preferredProvider`
- optional `languageHint`

**Transcription callback input**
- `callId`
- `tenantId`
- `rawText`
- `speakerLabeledSegments`
- `languageDetected`
- `confidenceScore`
- `providerUsed`
- `durationSeconds`
- optional diarization metadata.

### 6.2 Output artifacts

The feature produces:
- A persisted call recording record.
- A persisted transcript record.
- Structured speaker-labeled transcript segments.
- Language and confidence metadata.
- Processing status updates.
- Optional review flags for low-confidence outputs.

### 6.3 Events emitted

Primary event emitted by this feature:

#### `call.transcription.completed`

**Publisher:** M-01  
**Consumers:** M2 Conversation Intelligence, M3 AI Summaries & GenAI, M8 Sales Engagement, M10 Data & Compliance  
**Purpose:** Signals that a transcript is available and safe for downstream processing.

**Canonical payload**
```json
{
  "eventId": "uuid",
  "callId": "uuid",
  "transcriptId": "uuid",
  "tenantId": "uuid",
  "durationSeconds": 1800,
  "participantCount": 3,
  "sourcePlatform": "zoom",
  "languageDetected": "en",
  "confidenceScore": 0.92,
  "providerUsed": "whisper",
  "occurredAt": "2026-04-29T10:30:00Z"
}
```

### 6.4 APIs exposed or consumed

**Exposed by M-01**
- Webhook ingestion endpoints per provider
- Internal callback endpoint for completed transcript persistence
- Read endpoints for transcript retrieval by frontend or internal services

**Consumed by M-01**
- Provider recording APIs when direct fetch is needed
- Supabase Storage for audio object upload/download
- Internal transcription service endpoint or queue contract
- BullMQ/Redis for job dispatch and event publish.

---

## 7. Data Model

### 7.1 Tables used

Primary M-01 owned tables under the schema namespace `m01_capture_transcription`:
- `m01_capture_transcription.calls`
- `m01_capture_transcription.transcripts`
- `m01_capture_transcription.transcript_corrections` (related but not core to first transcription write)
- `m01_capture_transcription.ingestion_sources` (read for source config and secrets)

### 7.2 Table ownership

M-01 owns the recording and transcript persistence for this feature. No other module may write directly into M-01 transcript tables, and M-01 must not write directly into downstream module schemas.

### 7.3 Core fields

#### `m01_capture_transcription.calls`
- `call_id` UUID primary key
- `tenant_id` UUID not null
- `source_platform` varchar
- `audio_url` text
- `duration` integer
- `status` varchar
- `created_at` timestamptz

#### `m01_capture_transcription.transcripts`
- `transcript_id` UUID primary key
- `call_id` UUID foreign key
- `tenant_id` UUID not null
- `raw_text` text
- `speaker_labeled_segments` jsonb
- `timestamps` jsonb
- `language` varchar
- `confidence_score` float
- `flagged_for_review` boolean
- `provider_used` varchar
- `created_at` timestamptz

### 7.4 Validation rules

- Every row must include `tenantId`.
- `callId` must be unique per tenant-scoped source event.
- `transcriptId` must be generated once per completed transcript version.
- `confidenceScore` must be numeric in the accepted range.
- `speakerLabeledSegments` must follow the contract schema.
- `status` transitions must follow allowed lifecycle states only.

### 7.5 Idempotency keys

Recommended idempotency keys:
- Webhook-level: provider event ID if available.
- Call-level: `tenantId + provider + providerCallId`.
- Processing-level: `callId`.
- Transcript completion-level: `callId + transcript version`.

Hard rule: the same audio URL or provider completion event may arrive more than once, and the system must skip duplicate processing safely.

### 7.6 Suggested status lifecycle

`pending -> audio_stored -> processing -> completed`

Failure variants:
- `audiofetchfailed`
- `transcriptionfailed`
- `callbackfailed`
- `failed_permanent`

This status model should be implemented centrally in M-01 service logic to keep behavior consistent.

---

## 8. Service and Integration Design

### 8.1 Internal services involved

- M-01 Ingestion Controller
- Webhook Verification Service
- Audio Fetch Service
- Storage Service
- Transcription Job Producer
- Transcript Callback Handler
- Event Publisher
- Audit Logging Service
- Queue Workers for retries and failure handling.

### 8.2 External integrations

- Zoom
- Microsoft Teams
- Google Meet
- Telephony/dialer providers
- Supabase Storage
- Transcription Service
- Whisper
- AssemblyAI.

### 8.3 Auth method

- Webhooks: HMAC-SHA256 or provider-approved verification scheme.
- Internal service-to-service calls: internal network trust plus service authentication as defined by platform standards.
- Storage access: service credentials, signed URLs, or approved service key patterns.
- User-facing transcript reads: JWT + RBAC through Platform Core.

### 8.4 Rate limits and quotas

This feature must account for:
- Provider webhook bursts.
- Provider recording fetch quotas.
- Storage bandwidth limits.
- ASR provider throughput limits.
- Queue backlog growth during peak periods.

Queue-first design is mandatory so provider burst traffic does not block request handlers.

### 8.5 Fallback behavior

- Primary ASR: Whisper.
- Fallback ASR: AssemblyAI.
- If primary fails, switch provider before failing the job.
- If both fail, mark the call failed and raise observability signals.
- Do not invent transcript text or partially synthesize missing sections.

---

## 9. AI Processing

### 9.1 AI step in the pipeline

The AI step in this feature is speech-to-text transcription plus speaker diarization. This is the first AI-dependent stage in the revenue intelligence pipeline and is a prerequisite for almost all downstream AI and analytics features.

### 9.2 AI service endpoint

The Call Transcription feature uses the dedicated Python transcription service. In the approved architecture, this service is a separate FastAPI-based microservice because transcription is compute-heavy and should not run inside the NestJS modular monolith.

### 9.3 Input to AI

The transcription service receives:
- audio file URL
- tenant ID
- call ID
- duration
- provider preference
- optional language hint

The service must not receive unrelated business logic instructions from TypeScript services.

### 9.4 Output from AI

The service returns structured output only:
- transcript raw text
- speaker-labeled segments
- timestamps
- detected language
- confidence score
- provider used
- optional metadata such as speaker count.

### 9.5 Confidence handling

- Confidence score must be persisted with the transcript.
- Low confidence outputs should be flagged for review or excluded rather than silently treated as fully trusted.
- System enforces a three-tier pipeline utilizing `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80) and `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70).

### 9.6 Human review rules

Minimum rule for Phase 1:
- Automatically sync extracted Opportunity CRM fields to CRM endpoints if confidence $\geq$ `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80).
- Save to tables with `flagged_for_review = true` and hold for manual approval if confidence is between `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70) and `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` (0.80).
- Silently exclude and drop from synchronizations if confidence $<$ `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` (0.70).
- Flag transcript for review if diarization quality is below accepted threshold.
- Flag transcript for review if language detection is unsupported or uncertain.
- Do not block event emission unless product policy says the transcript is unusable.

The initial review path can be operational rather than fully productized UI.

---

## 10. Security and Compliance

### 10.1 Tenant isolation

Every write must include `tenantId`. All transcript and call recording rows must remain tenant-scoped and protected by the platform’s tenant isolation patterns and RLS approach.

### 10.2 Access control

- Webhook endpoints must validate authenticity before any business processing.
- User transcript access must be protected by JWT and RBAC.
- Internal processing endpoints must not be exposed publicly without control.
- Reprocess operations must be admin or ops restricted.

### 10.3 Secret handling

- Webhook secrets must be stored in approved secret management, not code.
- Provider API tokens must be tenant-safe and encrypted where needed.
- Storage credentials and AI provider secrets must remain outside repository code.
- Doppler is the approved secret management approach in the current stack.

### 10.4 Audit logging

Audit at least:
- webhook received
- webhook rejected
- call record created
- transcription started
- provider fallback used
- transcript stored
- event published
- permanent failure reached

Audit logs should avoid leaking full sensitive transcript text unless policy explicitly allows it.

### 10.5 Data retention

Raw audio is sensitive and expensive. The architecture requires configurable auto-deletion and references 7 days as the default retention rule for raw audio in current guidance.

Recommended retention split:
- Raw audio: short-lived, configurable, default 7 days.
- Transcript text: retained longer according to customer contract and compliance policy.
- Failed artifacts: retained only as needed for recovery and audit.

### 10.6 Compliance constraints

- Do not use customer audio or transcript data for shared model training without explicit consent.
- Respect tenant data ownership rules.
- Protect recordings and transcript content as sensitive customer data.
- Enforce least privilege on storage and transcript retrieval.

---

## 11. Error Handling

### 11.1 Validation errors

Examples:
- Missing signature header
- Invalid payload schema
- Missing recording URL
- Unknown source mapping
- Missing tenant association

Behavior:
- Reject at boundary.
- Return proper 4xx status for provider-facing webhook when appropriate.
- Log securely.
- Do not enqueue invalid jobs.

### 11.2 Provider failures

Examples:
- Recording URL expired
- Provider API throttled
- Provider metadata incomplete

Behavior:
- Retry transient fetch failures with exponential backoff.
- Mark permanent provider errors after retry exhaustion.
- Raise alert for operational visibility.

### 11.3 Timeout handling

Timeout-sensitive stages:
- recording fetch
- storage upload
- transcription provider execution
- internal callback persistence

Behavior:
- enforce timeout per stage
- retry where stage is safe and idempotent
- dead-letter after retry exhaustion.

### 11.4 Partial success rules

Examples:
- Audio stored, but transcript not yet completed.
- Transcript created, but downstream event not yet published.
- Transcript available, but confidence low.

Rules:
- Persist honest status at every stage.
- Never mark call as `completed` until transcript persistence succeeds.
- Never hide low-confidence or degraded processing outcomes.

### 11.5 Dead-letter queue conditions

Move to dead-letter queue when:
- callback persistence fails after max retries
- database unavailable beyond retry window
- event payload repeatedly fails validation
- transcription provider repeatedly fails and fallback also fails
- unexpected unrecoverable worker exception occurs.

---

## 12. Observability

### 12.1 Logs

Structured logs must include:
- `tenantId`
- `callId`
- `sourcePlatform`
- `jobId`
- `providerUsed`
- `status`
- error category
- retry count

Never log full secrets or unnecessary sensitive payloads.

### 12.2 Metrics

Track at minimum:
- webhook receipt count
- webhook verification failure count
- duplicate webhook count
- audio fetch success/failure rate
- storage upload latency
- transcription queue depth
- transcription job duration
- transcription success/failure rate
- fallback usage rate
- low-confidence transcript rate
- dead-letter count
- event publish success/failure.

### 12.3 Alerts

Alert on:
- queue backlog above threshold
- sudden spike in invalid webhook signatures
- sustained transcription failure rate
- fallback provider overuse
- dead-letter queue growth
- storage failures
- callback persistence failures.

### 12.4 Trace points

Important trace boundaries:
- webhook receive
- idempotency decision
- audio fetch start/end
- storage write
- queue enqueue
- transcription service execution
- callback receipt
- DB commit
- event publish.

### 12.5 Dashboard needs

M-01 dashboards should show:
- ingestion volume by provider
- transcript completion rate
- median and p95 transcription latency
- failure reasons by stage
- queue health
- duplicate event suppression counts
- low-confidence transcript trends.

---

## 13. Non-Functional Requirements

### 13.1 Performance

- Webhook acknowledgment path should stay lightweight and non-blocking.
- Heavy work must be async.
- Transcript completion latency should be optimized for practical downstream use, but exact SLA should be finalized per provider and call length.

### 13.2 Scalability

- Transcription workload must scale independently from the monolith.
- The dedicated transcription service supports burst scaling and is explicitly extracted because ASR is CPU/memory heavy.

### 13.3 Reliability

- Idempotency is mandatory.
- Retries must be safe.
- Queue persistence must protect against transient worker crashes.
- Fallback provider path must reduce single-provider dependency.

### 13.4 Availability

- M-01 webhook ingestion should remain available even during downstream slowdowns.
- Queue buffering should absorb traffic spikes.
- A provider outage must degrade only the affected path, not corrupt platform data.

### 13.5 Maintainability

- Keep TypeScript limited to orchestration and product logic.
- Keep AI and ASR logic in Python services only.
- Enforce module-owned schemas and event contracts.
- Keep code simple enough for mixed-experience teams to maintain.

---

## 14. Test Strategy

### 14.1 Unit tests

Must cover:
- webhook signature verification
- payload validation
- idempotency checks
- status transition rules
- event payload builder
- low-confidence flag logic
- provider selection/fallback orchestration boundaries.

### 14.2 Integration tests

Must cover:
- webhook endpoint to DB write
- storage upload flow
- BullMQ enqueue and worker behavior
- internal callback persistence
- event emission after transcript persistence
- tenant isolation on transcript reads/writes.

### 14.3 Contract tests

Must cover:
- transcription service request schema
- transcription callback response schema
- `call.transcription.completed` event schema
- provider webhook payload adapters per connector.

### 14.4 Idempotency tests

Must verify:
- duplicate webhook is ignored safely
- duplicate queue job does not create duplicate transcript
- duplicate callback does not create duplicate completion records
- duplicate event publish attempts remain safe.

### 14.5 Failure injection tests

Must simulate:
- invalid webhook signature
- expired recording URL
- storage upload failure
- Whisper timeout
- AssemblyAI fallback failure
- PostgreSQL temporary outage
- Redis temporary outage
- callback network failure
- dead-letter path activation.

### 14.6 Suggested edge-case coverage

- corrupt audio file
- unsupported language
- very long recording
- empty or near-empty transcript
- speaker diarization mismatch
- missing participant list
- provider sends completion before recording is actually downloadable.

### 14.7 Merge gate expectation

A Call Transcription change must not be merged unless:
- unit tests pass
- integration tests pass
- event contract tests pass
- idempotency tests pass
- failure path tests cover the main operational risks.

---

## 15. Open Questions

1. What exact transcript completion SLA should be committed for Phase 1 by recording duration bucket?
2. Should low-confidence transcripts still emit `call.transcription.completed`, or should there be an additional quality-state field in the event?
3. What transcript versioning approach should be used when a transcript is manually corrected or reprocessed?
4. Should speaker names remain generic (`Speaker 1`, `Speaker 2`) in M-01, with identity mapping deferred downstream?
5. What is the approved maximum raw audio file size and maximum call duration for first release?
6. Should provider-specific recording metadata be normalized into a common M-01 payload before persistence, or stored partly as raw metadata JSON?
7. What reprocessing policy should be allowed for failed versus completed transcripts?
8. Is a separate `transcription.failed` event needed for operations or future downstream workflows?
9. Which exact language list is supported for production rollout in Phase 1?
10. How should transcript corrections interact with the original emitted event payload if a corrected transcript replaces version 1?

---

## Appendix A — Audio Ingestion Rules

### A.1 Accepted sources

Initial supported source categories:
- Zoom
- Microsoft Teams
- Google Meet
- Telephony/dialer integrations configured through M-01 Native Connectors.

### A.2 Ingestion rules

- Do not process a recording unless the source is connected and tenant-mapped.
- Always verify webhook authenticity before creating heavy work.
- Always persist the call record before expensive downstream steps.
- Store audio in approved object storage before transcription.
- Use queue-based processing only; do not transcribe inside request handlers.

### A.3 File validation

Validate at minimum:
- accessible URL or file reference
- supported media type
- non-zero file size
- within accepted duration/file-size thresholds
- checksum or fetch integrity when available

### A.4 Reprocessing rules

- Failed calls may be reprocessed by admin/ops workflow.
- Completed calls must not be reprocessed automatically without explicit reason.
- Reprocessing must create an auditable version trail if transcript content can change.

---

## Appendix B — Speaker Diarization Rules

### B.1 Goal

The transcript must preserve who said what to support downstream analysis, summaries, and revenue context interpretation.

### B.2 Minimum output format

Each segment should contain:
- `speaker`
- `text`
- `startMs`
- `endMs`

Example:
```json
[
  {
    "speaker": "Speaker 1",
    "text": "Thanks for joining today.",
    "startMs": 0,
    "endMs": 2100
  },
  {
    "speaker": "Speaker 2",
    "text": "Happy to be here.",
    "startMs": 2200,
    "endMs": 3900
  }
]
```

### B.3 Rules

- Speaker labels may remain generic in M-01.
- Do not infer business roles such as rep or buyer inside this feature unless explicitly supported by trusted metadata.
- Diarization output must be stored as structured JSONB.
- Low-quality diarization should not be silently treated as high certainty.

---

## Appendix C — Language Detection

### C.1 Policy

Language detection should happen as part of transcription when not provided by source metadata. The detected language must be stored with the transcript and emitted in the completion event.

### C.2 Rules

- Prefer provider hint if trustworthy and available.
- Confirm or override with transcription-service detection if needed.
- Mark uncertain language cases for review.
- Unsupported languages should fail gracefully with explicit status or fallback policy.

---

## Appendix D — Transcript Storage Format

### D.1 Raw transcript

Store a normalized `rawText` field for full-text downstream processing.

### D.2 Structured transcript

Store speaker-attributed transcript segments in `speakerLabeledSegments` JSONB.

### D.3 Optional timestamps

Store word/segment timing metadata in `timestamps` JSONB when returned by the provider or service.

### D.4 Storage principles

- Store once in M-01 as the source transcript of record.
- Downstream modules read via event + public access patterns, not cross-module table ownership changes.
- Avoid provider-specific formats leaking into downstream contracts.

---

## Appendix E — Transcript Completion Event Schema

### E.1 Event name

`call.transcription.completed`.

### E.2 Required fields

- `eventId`
- `callId`
- `transcriptId`
- `tenantId`
- `durationSeconds`
- `participantCount`
- `sourcePlatform`
- `languageDetected`
- `confidenceScore`
- `providerUsed`
- `occurredAt`

### E.3 Event rules

- Event is emitted only after transcript persistence succeeds.
- Event must be idempotent from the consumer point of view.
- Publisher owns the schema and its backward-compatible evolution.
- Downstream modules must subscribe instead of directly coupling to M-01 internals.

### E.4 Example event

```json
{
  "eventId": "7f1d0d3b-c95f-4d1b-8601-8a4f92e2c111",
  "callId": "f92ac9e1-28d5-4c6b-b776-9d74d313e001",
  "transcriptId": "d2a1a4f4-3d5a-4f95-b1e3-d61f4d61a222",
  "tenantId": "b91e7a17-208a-4fd0-9ef1-2d879cb0f333",
  "durationSeconds": 1842,
  "participantCount": 4,
  "sourcePlatform": "zoom",
  "languageDetected": "en",
  "confidenceScore": 0.93,
  "providerUsed": "whisper",
  "occurredAt": "2026-04-29T10:44:00Z"
}
```

---

## Appendix F — Implementation Notes for Engineers

### F.1 Freshers rule

If you are building this feature, keep the logic split clean:
- **NestJS / TypeScript:** webhook handling, validation, DB writes, queue orchestration, event publish.
- **Python / FastAPI:** transcription, diarization, language detection, provider fallback logic.

### F.2 Do not do these shortcuts

- Do not run ASR directly inside NestJS product services.
- Do not write directly into downstream module tables.
- Do not skip idempotency because webhook providers retry.
- Do not put secrets in code.
- Do not block webhook handlers with long-running audio work.

### F.3 Engineering principle

Keep M-01 boring, predictable, and event-driven. If this feature is reliable, the rest of the platform can grow on top of it safely.

