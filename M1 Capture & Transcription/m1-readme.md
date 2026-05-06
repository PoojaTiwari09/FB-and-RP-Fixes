# Doc #13 — Module README: M-01 Capture & Transcription

## 1. Module Overview

M-01 is the **Capture-stage** foundation of the platform. It is the first operational module in the revenue intelligence lifecycle and is responsible for bringing raw interaction data into the system, turning call audio into transcripts, and producing structured extraction outputs that downstream modules can use.

This module matters because almost every later capability depends on it. If M-01 does not ingest calls, produce transcripts, and emit its completion events reliably, downstream modules such as Revenue Graph, Conversation Intelligence, Smart Tracking, and Insight Generation have no trusted input to work with.

**Lifecycle stage:** Capture.

**Current Phase 1-2 status:** Deployed.

**Core outputs produced by M-01:**
- Speaker-labeled transcripts.
- Structured CRM fields extracted from conversations.
- Connected source records for conferencing and telephony ingestion.
- Ingestion events such as `call.transcription.completed` and `crm.fields.extracted`.

In simple words: M-01 is the module that listens first, writes down what happened, and prepares clean structured outputs for the rest of the product.

## 2. Features in This Module

M-01 includes three core features in the approved feature map.

| Feature | What it does | Notes |
|---|---|---|
| Call Transcription | Converts call audio or video into accurate speaker-labeled, timestamped text. | Foundational input for almost all later AI features. |
| Native Connectors | Connects conferencing, telephony, CRM, email, and calendar systems so interactions can be captured automatically without manual logging or ETL. | In Phase 1, the most critical path is conferencing and telephony ingestion. |
| AI Data Extractor | Converts unstructured conversation content into structured CRM fields automatically. | Runs after transcription and publishes extracted field events for M-03. |

**Related TDDs**
- TDD — Call Transcription.
- TDD — Native Connectors.
- TDD — AI Data Extractor.

A new engineer should think of these three features as one pipeline: **connect source -> ingest call -> transcribe -> extract structured data -> publish events**.

## 3. Module Boundaries

### What M-01 owns

M-01 owns the entry boundary for call and audio ingestion under `/api/v1/ingestion`, the source connector setup for supported capture systems, the transcription orchestration flow, transcript persistence, and CRM-field extraction outputs derived from conversations.

It also owns the event contracts it publishes, especially `call.transcription.completed` and `crm.fields.extracted`, and it owns the M-01 tables used to track recordings, transcripts, corrections, connected sources, and extracted CRM fields.

### What M-01 does not own

M-01 does not own CRM system-of-record sync, account/deal/contact linking, forecast logic, scorecards, summaries, or downstream analytics. Those belong to later modules such as M-03 Revenue Graph, M-04 Conversation Intelligence, M-05 Smart Tracking, and M-06 Insight Generation.

M-01 also does not own auth, RBAC, platform audit implementation, or cross-module data writes. Platform Core owns auth and shared governance, and every downstream module must consume M-01 through public APIs or events rather than direct DB coupling.

### Allowed integrations

Allowed external integrations include Zoom, Microsoft Teams, Google Meet, dialers and telephony tools, CRM systems (Salesforce, HubSpot, Dynamics), Email/Calendar (Gmail, Outlook/Office 365), GTM tools, plus the internal transcription service and internal AI extraction service.

### Forbidden shortcuts

- No direct writes into another module’s schema.
- No direct querying of another module’s private tables.
- No AI inference logic inside NestJS TypeScript services.
- No skipping event publication just because a direct internal call feels easier.
- No accepting conferencing webhooks without HMAC verification and idempotency handling.

The safe rule for freshers is simple: if the shortcut bypasses tenancy, events, auth, or the TypeScript/Python boundary, do not do it.

## 4. Architecture Snapshot

### Main components

M-01 is implemented as the NestJS `DataIngestionModule` with API prefix `/api/v1/ingestion`. It works with a separate FastAPI transcription service, PostgreSQL for transactional storage, Supabase Storage or equivalent object storage for audio artifacts, and BullMQ on Redis for queues and event delivery.

### Request flow

A typical call-ingestion path is: provider webhook arrives -> HMAC is verified -> call record is created -> recording is fetched and stored -> transcription job is queued -> transcription callback persists transcript -> `call.transcription.completed` is published.

### Queue flow

BullMQ is used for transcription processing, retries, internal event delivery, and extraction-related async work. This is mandatory because the architecture requires slow AI and media-processing steps to run asynchronously rather than inside request handlers.

### AI service interactions

M-01 talks to Python services over internal APIs. The transcription path uses the transcription service for ASR and diarization, and the extraction path uses an internal AI endpoint such as `POST /v1/extract-crm-fields` for structured CRM-field extraction.

### Storage and DB

Audio files live in object storage, while operational records live in PostgreSQL. The main M-01 tables are `callrecordings`, `transcripts`, `transcriptcorrections`, `ingestionsources`, and `crmextractedfields`.

## 5. APIs

The main public endpoints exposed by M-01 are listed in the architecture below.

| Method | Endpoint | Auth | Primary caller | Purpose |
|---|---|---|---|---|
| POST | `/api/v1/ingestion/webhook/zoom` | HMAC-SHA256. | Zoom. | Receive call-completed webhook and enqueue transcription job. |
| POST | `/api/v1/ingestion/webhook/teams` | HMAC-SHA256. | Microsoft Teams. | Receive call-completed webhook and enqueue transcription job. |
| POST | `/api/v1/ingestion/webhook/meet` | HMAC-SHA256. | Google Meet. | Receive call-completed webhook and enqueue transcription job. |
| POST | `/api/v1/ingestion/webhook/dialer` | HMAC-SHA256. | Telephony provider. | Receive call-completed webhook and enqueue transcription job. |
| POST | `/api/v1/ingestion/internal/callback` | Internal Auth. | Transcription Service | Receive internal transcription job result callback. |
| GET | `/api/v1/ingestion/calls` | JWT. | Frontend. | Paginated call list for the tenant. |
| GET | `/api/v1/ingestion/calls/:id/transcript` | JWT. | Frontend. | Full transcript for a call. |
| POST | `/api/v1/ingestion/sources` | JWT, RevOps role. | Frontend. | Connect a new call source. |
| GET | `/api/v1/ingestion/sources` | JWT, RevOps role. | Frontend. | List connected sources and sync status. |

A beginner-friendly way to remember the API surface is: **webhooks bring calls in, source endpoints manage connectors, and call endpoints expose captured results**.

## 6. Events

### Events emitted

M-01 emits two key platform events:
- `call.transcription.completed`.
- `crm.fields.extracted`.

`call.transcription.completed` carries fields such as `eventId`, `callId`, `transcriptId`, `tenantId`, `durationSeconds`, `participantCount`, `sourcePlatform`, `languageDetected`, `confidenceScore`, and `providerUsed`.

`crm.fields.extracted` carries `eventId`, `callId`, `tenantId`, `occurredAt`, extracted fields, and flagged count for downstream CRM enrichment handling.

### Events consumed

The architecture states that M-01 is the **entry point** of the pipeline and does not consume upstream module events in the current design.

### Downstream consumers

- `call.transcription.completed` is consumed by M-03, M-04, M-05, and M-06.
- `crm.fields.extracted` is consumed by M-03 Revenue Graph.

### Event ownership and idempotency

M-01 owns the schema of the events it publishes. All event handling must be idempotent because BullMQ retries can deliver the same event more than once.

For a fresher: publish once, but always code as if the same event may arrive again.

## 7. Data Ownership

M-01 owns the following key tables in PostgreSQL.

| Table | Purpose | Key notes |
|---|---|---|
| `m01.callrecordings` | Stores call-level ingestion records. | Includes `callId`, `tenantId`, source platform, audio URL, duration, status, and timestamps. |
| `m01.transcripts` | Stores completed transcript outputs. | Includes raw text, speaker-labeled segments, timestamps, language, confidence score, review flag (`flagged_for_review`), and provider used. |
| `m01.transcriptcorrections` | Stores vocabulary correction history. | Supports business-term cleanup in transcripts. |
| `m01.ingestionsources` | Stores connected source metadata. | Tracks platform, status, last sync time, and webhook secret. |
| `m01.crmextractedfields` | Stores extracted structured CRM-ready fields. | Tracks field name, value, confidence, push status, and review flag (`flagged_for_review`). |

### Data retention notes

The tooling document states that the platform owns transcripts and metadata, but long-term raw audio should not be kept forever. Raw audio should be auto-deleted after a configurable retention period, with 7 days used as the default compliance and cost-control rule.

### Tenant isolation

Every M-01 record must include `tenantId`, and row-level security is mandatory. Tenant isolation is enforced through PostgreSQL RLS, tenant-aware application controls, JWT guards, and interceptors.

## 8. Folder Structure

A simple suggested folder layout for freshers is below. The exact naming can vary, but the separation of responsibilities should stay clear and boring.

```text
src/modules/m01-capture-transcription/
├── m01-data-ingestion.module.ts
├── controllers/
│   ├── webhook.controller.ts
│   ├── calls.controller.ts
│   └── sources.controller.ts
├── services/
│   ├── ingestion.service.ts
│   ├── transcription-orchestrator.service.ts
│   ├── extraction-orchestrator.service.ts
│   ├── source-connector.service.ts
│   └── webhook-verification.service.ts
├── workers/
│   ├── transcription.worker.ts
│   ├── extraction.worker.ts
│   └── retry-replay.worker.ts
├── schemas/
│   ├── webhook-payload.schema.ts
│   ├── transcript-response.schema.ts
│   ├── extraction-response.schema.ts
│   └── source-config.schema.ts
├── integrations/
│   ├── zoom/
│   ├── teams/
│   ├── meet/
│   ├── dialer/
│   ├── transcription-service/
│   └── ai-services/
├── repositories/
│   ├── call-recordings.repository.ts
│   ├── transcripts.repository.ts
│   ├── ingestion-sources.repository.ts
│   └── crm-extracted-fields.repository.ts
├── events/
│   ├── call-transcription-completed.event.ts
│   └── crm-fields-extracted.event.ts
└── tests/
    ├── unit/
    ├── integration/
    └── event-flow/
```

### Where new code should go

- Add HTTP entry logic in `controllers/`.
- Add business workflow orchestration in `services/`.
- Add async BullMQ consumers in `workers/`.
- Add provider-specific adapters in `integrations/`.
- Add request/response validation in `schemas/` using Zod.
- Add DB access code in `repositories/` rather than scattering Prisma everywhere.

Simple rule: controllers receive, services decide, workers retry, integrations talk outside, repositories talk to DB.

## 9. Local Development

### Prerequisites

Local development should use the approved standard stack: Docker Compose for local orchestration, PostgreSQL, Redis, object storage mock or equivalent local setup, the NestJS app, and the Python transcription or AI services needed for internal calls.

### Setup steps

1. Start the local infra stack with Docker Compose.
2. Configure environment variables from the Env Registry and secret source, not by inventing new local names.
3. Run database migrations for PostgreSQL.
4. Start Redis and BullMQ-backed workers.
5. Start the NestJS API service.
6. Start the transcription service and any required AI service endpoints used by M-01.
7. Seed mock sources or use webhook test payloads for Zoom, Meet, Teams, or dialer flows.

### Typical run commands

```bash
# infra
pnpm docker:up

# backend
pnpm install
pnpm prisma migrate dev
pnpm start:dev

# workers
pnpm start:workers

# python services
make ai-services-up
```

The exact command names can differ by repo, but the architecture expectation is stable: **DB + Redis + object storage + NestJS + Python services must all be available locally for realistic M-01 work**.

### Test commands

- Unit tests with Jest.
- API integration tests with Supertest.
- DB and queue integration tests with Testcontainers where possible.
- Event-flow tests for webhook -> transcription -> event publish paths.

### Seed or mock setup

Use recorded webhook fixtures, sample audio files, and deterministic transcript fixtures. For AI and transcription contracts, prefer stable mocks or test endpoints so that onboarding work is reproducible for juniors.

## 10. Configuration

M-01 depends on environment variables for database access, Redis, object storage, webhook secrets, internal service URLs, and provider credentials. This README should **not** duplicate the full environment catalog; it should point engineers to the centralized Env Registry and secret-management source instead.

### Required configuration categories

- Database connection and Prisma config.
- Redis and BullMQ config.
- Object storage config for audio files.
- Internal transcription service URL and auth.
- Internal AI extraction service URL and auth.
- Webhook secrets for Zoom, Teams, Meet, and dialers.
- OAuth or connector credentials for supported source integrations.

### Secret sources

Secrets must live in Doppler or another approved secrets manager, not in source control, screenshots, or copied local notes.

### Environment notes

- Local should use safe test secrets and mock providers where possible.
- Staging should use real integration behavior with non-production tenants.
- Production must enforce approved secret storage, HMAC verification, observability, and retention controls.

## 11. Operational Notes

### Common failure modes

- Duplicate webhook deliveries from providers.
- Invalid webhook signatures due to secret mismatch.
- Audio download URL expired or unreachable, causing `audiofetchfailed` status.
- Whisper timeout or failure, causing fallback to AssemblyAI or final transcription failure.
- Callback/network failure between transcription service and NestJS.
- Low-confidence transcript or extracted field result flagged for review.
- Stuck BullMQ jobs due to Redis or worker issues.

### Troubleshooting checklist

1. Check Sentry for webhook rejection, transcription, or callback errors.
2. Verify Redis and BullMQ worker health.
3. Check whether the call record exists and what status it is in: `pending`, `processing`, `completed`, or `failed`.
4. Confirm audio file availability in object storage.
5. Confirm transcription service health and callback logs.
6. Confirm `call.transcription.completed` was published successfully.
7. If extraction is missing, inspect `crmextractedfields` and extraction-worker logs.

### Reprocessing guidance

Failed calls should remain in a failed status and be manually retriggerable rather than partially rewritten. The architecture explicitly states that if `call.transcription.completed` is never published, downstream modules remain unaffected and RevOps is alerted instead of receiving partial bad data.

### Support ownership

Operational ownership usually sits across Backend Lead, Integrations Owner, AI Lead, DevOps Lead, and RevOps support depending on whether the issue is webhook ingestion, media fetch, transcription quality, or connector state.

## 12. Related Docs

New joiners should keep these documents open while working on M-01.

- System Architecture Document (SAD). 
- Tooling and Services Inventory. 
- Feature TDD — Call Transcription.
- Feature TDD — Native Connectors.
- Feature TDD — AI Data Extractor.
- Event registry and sequence-flow sections in the architecture, especially the call-ingestion flow and M-01 event definitions.
- API docs or Swagger pages for `/api/v1/ingestion` once generated in the codebase.
- Runbooks for webhook failures, queue backlog, transcription fallback, and reprocessing.

A practical onboarding tip is to read the docs in this order: **SAD -> this README -> Call Transcription TDD -> Native Connectors TDD -> AI Data Extractor TDD -> codebase**.

## Quick Mental Model

If you are joining the team fresh, remember this short model:

- External systems send call events into M-01.
- M-01 verifies, stores, and queues the work.
- Python services do transcription and AI extraction, not NestJS business code.
- M-01 stores transcripts and extracted fields.
- M-01 publishes events so the rest of the platform can continue safely.

That is the heart of the module.
