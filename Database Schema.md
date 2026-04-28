## PART 1 — Document Header

**Document Title:** Database Schema Design  
**Project:** R-Revenue Intelligence  
**Version:** v1.0  
**Status:** Draft  
**Last Updated:** 23-04-2026  
**Owner:** Relanto  
**Reviewers:** Senior Architect Team

---

## PART 2 — Overview & Purpose

### 2.1 What This Document Covers

This document defines the database design standards for R-Revenue Intelligence, including the database technologies used, schema ownership boundaries, multi-tenancy enforcement rules, table design expectations, indexing standards, and migration rules. It must be read before creating any new table, writing any migration, or querying data owned by another module, because schema ownership and cross-schema access rules are enforced during code review and violations should not be merged. [file:3]

### 2.2 Who Should Read This

This document should be read by all backend developers, database designers, tech leads, interns working on schema changes, and any engineer creating tables, indexes, migrations, or module-level data contracts. It is also important for reviewers because database ownership, tenant isolation, and migration quality are review gates, not optional guidelines. [file:3]

### 2.3 Golden Rules (Non-Negotiable)

- Every table must include `tenantid UUID NOT NULL` as the second column after the primary key unless it is an approved exception such as a pure join table with tenant enforcement through foreign keys or a platform-scoped internal table. [file:3]
- Every new table must use a `UUID PRIMARY KEY`; serial integers are not allowed. [file:3]
- Every new table must include `createdat TIMESTAMPTZ DEFAULT NOW()`. [file:3]
- Every table must have at least one index on `(tenantid, primary_lookup_column)` to support efficient tenant-scoped queries. [file:3]
- Row Level Security must be enabled on every tenant-scoped table so PostgreSQL enforces tenant isolation at the storage layer. [file:3]
- A module may write only to its own schema; writing into another module’s schema is not permitted. [file:3]
- Direct cross-schema reads in application code are not allowed unless they are explicitly documented as approved read contracts. [file:3]
- Never drop a column directly in production; mark it as deprecated first and schedule removal in a later major version. [file:3]
- Each migration file must touch only the schema owned by the module being changed. [file:3]
- No migration may be merged or run in production without Tech Lead review and explicit sign-off. [file:3]

---

## PART 3 — Database Technology Stack

### 3.1 Stores at a Glance

| Store | Technology | Version | What It Stores |
|-------|------------|---------|----------------|
| Primary DB | Supabase PostgreSQL | PostgreSQL 16 | All core platform data such as users, calls, transcripts, deals, accounts, forecasts, emails, and coaching data. [file:3] |
| Analytics | ClickHouse | 24.x latest stable | High-volume time-series and aggregation-heavy analytical data for Revenue Dashboards and Coaching Insights. [file:3] |
| Vector | pgvector | PostgreSQL 16 extension | Embeddings for semantic search, Ask Anything RAG, and AI Deep Researcher workflows. [file:3] |
| Search | Meilisearch | Latest stable | Full-text search across transcripts, emails, topic tags, and conversation library content. [file:3] |
| Cache/Queue | Redis | 7.x | Session data, rate limits, and BullMQ queue backing store for asynchronous processing. [file:3] |

### 3.2 Source of Truth Rule

Supabase PostgreSQL is the source of truth for all primary platform data, while ClickHouse, pgvector, and Meilisearch receive replicated or derived data from PostgreSQL for analytics, vector retrieval, and search use cases. Redis is not a source of truth and is treated only as a temporary operational store, so loss of Redis data must not break core platform correctness. [file:3]



## PART 4 — Multi-Tenancy & Security

### 4.1 How Tenant Isolation Works

R-Revenue Intelligence uses a shared database model, but each tenant’s data is isolated using three protection layers working together: the application layer adds tenant scope automatically through Prisma middleware, PostgreSQL enforces Row Level Security so only rows for the active tenant can be read or changed, and Supabase JWT tokens carry a signed `tenantid` claim that identifies which tenant the user belongs to. This means developers do not need to manually add tenant filters in every query, and even if application logic is bypassed accidentally, the database still blocks cross-tenant access as a defense-in-depth safeguard. [file:3]

### 4.2 Prisma Middleware (Layer 1)

The application layer uses a global Prisma middleware to automatically scope all database operations to the current tenant stored in request context. If a request does not have a valid tenant context, the middleware fails immediately instead of allowing an unsafe query to reach the database. [file:3]

```ts
prisma.use(async (params, next) => {
  const tenantId = asyncLocalStorage.getStore()?.tenantid;

  if (!tenantId) {
    throw new ForbiddenException('No tenant context');
  }

  const scopedActions = ['findMany', 'findFirst', 'findUnique', 'count', 'updateMany', 'deleteMany'];

  if (scopedActions.includes(params.action)) {
    params.args.where = {
      ...params.args.where,
      tenantid: tenantId,
    };
  }

  if (params.action === 'create') {
    params.args.data = {
      ...params.args.data,
      tenantid: tenantId,
    };
  }

  return next(params);
});
```

This middleware automatically adds the current `tenantid` to query filters and inserts, so each request stays inside its own tenant boundary. It also hard-fails when tenant context is missing, which prevents silent cross-tenant data leaks caused by developer mistakes or missing guards. [file:3]

### 4.3 Row Level Security — RLS (Layer 2)

PostgreSQL Row Level Security is the database-level enforcement layer, and it applies even if application code is bypassed through raw SQL or an accidental unscoped query. The application sets `app.tenantid` at the start of the database session, and every RLS policy uses that value to allow access only to rows belonging to the active tenant. [file:3]

```sql
ALTER TABLE schema.tablename ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema.tablename FORCE ROW LEVEL SECURITY;

CREATE POLICY select_tenant_isolation ON schema.tablename
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY insert_tenant_isolation ON schema.tablename
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY update_tenant_isolation ON schema.tablename
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY delete_tenant_isolation ON schema.tablename
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

**Important:** `FORCE ROW LEVEL SECURITY` is mandatory because without it, privileged connections can bypass RLS entirely. With `FORCE`, the protection still applies even to the table owner or service-level connections, making it the critical safeguard for tenant isolation. [file:3]

### 4.4 JWT Claim (Layer 3)

The `tenantid` is embedded as a custom claim inside the Supabase-issued JWT at sign-in or token refresh time, and the NestJS JWT guard reads that verified claim before any business logic runs. Because the token is signed by Supabase using RS256, a user cannot spoof another tenant’s identity by editing the token payload; if the signature is invalid or the `tenantid` claim is missing, the request is rejected before it reaches the application or database. [file:3]

### 4.5 Mandatory Column Checklist

Every new table must include the following minimum structure and security requirements. These rules are enforced in code review, and migrations that break them should not be approved. [file:3]

- [ ] `<entity>id UUID PRIMARY KEY` [file:3]
- [ ] `tenantid UUID NOT NULL` as the second column, always, unless it is an approved exception such as a pure join table with tenant enforcement through foreign keys or a platform-scoped internal table [file:3]
- [ ] `createdat TIMESTAMPTZ DEFAULT NOW()` [file:3]
- [ ] Index on `(tenantid, <primary_lookup_column>)` for efficient tenant-scoped queries [file:3]
- [ ] `ENABLE ROW LEVEL SECURITY` applied on the table [file:3]
- [ ] `FORCE ROW LEVEL SECURITY` applied on the table [file:3]



## PART 5 — Schema Ownership Map

### 5.1 Schema Registry

R-Revenue Intelligence follows a schema-per-module design in PostgreSQL, where each module owns its own schema and is responsible for writing only to the tables inside that schema. This creates clear ownership boundaries, reduces accidental coupling, and allows a module to be extracted later with minimal redesign because the boundary already exists in both code and data layout. [file:3]

| Schema Name | Owner Module | Key Tables |
|-------------|--------------|------------|
| `platform` | Platform Core | `tenants`, `users`, `roles`, `auditlogs`, `featureflags`, `integrations` [file:3] |
| `ingestion` | M-01 Data Ingestion | `calls`, `audiofiles`, `transcripts`, `speakersegments`, `transcriptcorrections`, `ingestionsources`, `crmextractedfields` [file:3] |
| `engagement` | M-02 Sales Engagement | `emaildrafts`, `emailsends`, `emailtemplates`, `emailflows`, `flowenrollments`, `tasks` [file:3] |
| `revenuegraph` | M-03 Revenue Graph | `accounts`, `contacts`, `accountcontacts`, `deals`, `dealcontacts`, `activities`, `crmsynclogs`, `datacloudexports` [file:3] |
| `conversationintelligence` | M-04 Conversation Intelligence | `scorecards`, `callreviews`, `topics`, `topictags`, `themes`, `themeanalyses`, `vocabularycorrections`, `translationpreferences` [file:3] |
| `smarttracking` | M-05 Smart Tracking | `trackers`, `trackerdetections`, `searchindexsynclog`, `dealdriversnapshots` [file:3] |
| `insights` | M-06 Insight Generation | `callsummaries`, `dealbriefs`, `accountbriefs`, `researchreports`, `querysessions`, `querymessages`, `semanticembeddings` [file:3] |
| `dealmanagement` | M-07 Deal & Account Mgmt | `deals`, `dealstages`, `dealhealthscores`, `dealriskflags`, `dealcontacts`, `dealboardconfigs`, `dealdrivers` [file:3] |
| `execution` | M-08 Execution Automation | `salesplays`, `playenrollments`, `playstepcompletions`, `workflows`, `workflowruns`, `competitoralertconfigs`, `competitoralerts` [file:3] |
| `forecasting` | M-09 Forecasting | `forecastperiods`, `forecastsubmissions`, `aiforecastsnapshots`, `pipelinecoveragemetrics`, `historicalconversionrates`, `forecastaccuracylog` [file:3] |
| `dashboards` | M-10 Performance & Coaching | `dashboardconfigs`, `coachingsnapshots`, `coachingrecommendations`, `trainerscenarios`, `trainersessions` [file:3] |

### 5.2 Schema Write Rules

A module may write only to its own schema, and cross-schema writes are not permitted under the architecture rules of the platform. If a module needs to affect data owned by another module, it must do so through that module’s API or event contract instead of issuing direct writes, and any PR that violates schema ownership should be rejected in review. [file:3]

Additional write rules to enforce during review:

- A migration file must touch only the schema owned by the module being changed. [file:3]
- A module must never create, update, or delete rows in another module’s tables directly. [file:3]
- Platform Core is the only owner allowed to write to the `platform` schema; all other modules treat it as read-only. [file:3]

---

## PART 6 — Cross-Schema Read Contracts

### 6.1 Permitted Cross-Schema Reads

Cross-schema reads are tightly controlled in R-Revenue Intelligence, and modules are not allowed to query another module’s tables directly from application code unless that access pattern is explicitly documented as an approved contract. The standard rule is simple: if data belongs to another module, call that module’s API or consume its event instead of reading its tables directly. [file:3]

| Reader Module | Data It Needs | How To Access |
|---------------|---------------|---------------|
| M-02 Sales Engagement | Contact and deal context for email personalization | `GET /api/v1/revenue-graph/deals/:id` via M-03 API [file:3] |
| M-04 Conversation Intelligence | Deal stage and account segment for scorecard context | `GET /api/v1/revenue-graph/deals/:id` via M-03 API [file:3] |
| M-05 Smart Tracking | Deal and account context to enrich detections | `GET /api/v1/revenue-graph/deals/:id` via M-03 API [file:3] |
| M-06 Insight Generation | Deal, account, and contact context for summaries and briefs | `GET /api/v1/revenue-graph/deals/:id` via M-03 API [file:3] |
| M-06 Insight Generation | Tracker detections for deal brief generation | `GET /api/v1/smart-tracking/trackers/:id/detections` via M-05 API [file:3] |
| M-07 Deal Management | Accounts, contacts, deals, and activities | `GET /api/v1/revenue-graph/deals/:id` via M-03 API [file:3] |
| M-07 Deal Management | Deal briefs and account briefs | `GET /api/v1/insights/deals/:id/brief` via M-06 API [file:3] |
| M-08 Execution Automation | Deal and account context for play enrollment | `GET /api/v1/revenue-graph/deals/:id` via M-03 API [file:3] |
| M-10 Performance Coaching | Call scores and topic distributions | M-04 API [file:3] |
| M-10 Performance Coaching | Deal outcomes and win-rate context | M-03 API [file:3] |
| M-10 Performance Coaching | Historical forecast submissions | M-09 API [file:3] |

### 6.2 Cross-Schema Read Rule

If a required read is not listed in the approved contracts table, it must be treated as disallowed until a Tech Lead reviews and documents the access pattern. Direct Prisma queries or raw SQL joins across schemas are architecture violations, and the only named exception in the SAD is a future Phase 3 PostgreSQL view for M-07 reading M-03 `revenuegraph` data for performance, which still requires explicit Tech Lead approval. [file:3]

### 6.3 Review Checklist for Cross-Module Reads

Use this checklist during design and PR review to keep the boundary clean:

- [ ] Is the data owned by another module? [file:3]
- [ ] If yes, is there an approved API or event contract for it? [file:3]
- [ ] Is the read path listed in the cross-schema read contracts table? [file:3]
- [ ] Is the code avoiding direct Prisma or raw SQL cross-schema joins? [file:3]
- [ ] If this is a new dependency, has it been reviewed and documented before implementation? [file:3]

**Important rule:** If it is not documented here, you cannot read it directly. Call the owning module’s API instead. [file:3]




## PART 7 — Module Schema Sections

## 📦 MODULE: M-01 Data Ingestion — Schema: `ingestion`

### 7.1.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-01 [file:3] |
| Module Name | Data Ingestion [file:3] |
| Schema Name | `ingestion` [file:3] |
| Phase | Phase 1 [file:3] |
| Owner | [Developer Name] |
| Description | Stores everything required to capture customer interactions, process recordings, generate transcripts, and extract structured CRM-ready data from conversations. [file:3][file:1] |

M-01 is the foundation module of the platform because every major downstream capability depends on a completed transcript or extracted call data being produced here first. It is already marked as deployed in the platform module roadmap and is the starting point for the full revenue intelligence lifecycle. [file:3]

---

### 7.1.2 Tables in This Schema

#### Table: `calls`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `callid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for each captured call record. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `sourceplatform` | TEXT | NOT NULL | — | Source system such as Zoom, Teams, Meet, or dialer. [file:3] |
| `recordingurl` | TEXT | NULL | — | Original source recording URL. [file:3] |
| `storageurl` | TEXT | NULL | — | Internal storage location after upload. [file:3] |
| `duration` | INTEGER | NULL | — | Call duration in seconds. [file:3] |
| `participantlist` | JSONB | NULL | — | Participants captured from the source event. [file:3] |
| `calendareventid` | UUID | NULL | — | Optional linked calendar event identifier. [file:3] |
| `status` | TEXT | NOT NULL | — | Processing status such as pending, audio stored, completed, failed. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Master record for every captured customer call in the system. [file:3]
- **Written by:** M-01 Data Ingestion webhook handlers and transcription pipeline. [file:3]
- **Read by:** M-01 internal services, M-03 via `call.transcription.completed`, and ClickHouse replication for analytics events. [file:3]

#### Table: `audiofiles`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `fileid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for audio file metadata row. [file:3] |
| `callid` | UUID | NOT NULL | — | Related call identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `storagebucket` | TEXT | NOT NULL | — | Bucket name where the file is stored. [file:3] |
| `storagepath` | TEXT | NOT NULL | — | Path to the stored audio file. [file:3] |
| `filesizebytes` | BIGINT | NULL | — | File size in bytes. [file:3] |
| `format` | TEXT | NULL | — | Audio format such as mp3, wav, or m4a. [file:3] |
| `uploadedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when the file was uploaded. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Standard audit creation timestamp used across all tenant tables. [file:3] |

- **Purpose:** Stores metadata for raw audio files uploaded to platform storage. [file:3]
- **Written by:** M-01 storage ingestion flow after call capture. [file:3]
- **Read by:** M-01 transcription service and internal retry/reprocessing flows. [file:3]

#### Table: `transcripts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `transcriptid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for transcript record. [file:3] |
| `callid` | UUID | NOT NULL | — | Parent call identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `rawtext` | TEXT | NOT NULL | — | Full transcript text for the call. [file:3] |
| `languagedetected` | TEXT | NULL | — | Detected transcript language. [file:3] |
| `wordcount` | INTEGER | NULL | — | Total transcript word count. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence score returned by transcription process. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores the full raw transcript generated for each processed call. [file:3]
- **Written by:** M-01 transcription callback flow after ASR and diarization complete. [file:3]
- **Read by:** M-04 Conversation Intelligence, M-05 Smart Tracking, M-06 Insight Generation, and search/indexing flows triggered after `call.transcription.completed`. [file:3]

#### Table: `speakersegments`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `segmentid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for each speaker segment. [file:3] |
| `transcriptid` | UUID | NOT NULL | — | Parent transcript identifier. [file:3] |
| `callid` | UUID | NOT NULL | — | Parent call identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `speakerlabel` | TEXT | NOT NULL | — | Speaker label such as Speaker 1 or Speaker 2. [file:3] |
| `text` | TEXT | NOT NULL | — | Transcript segment text. [file:3] |
| `starttime` | NUMERIC | NOT NULL | — | Segment start timestamp in the call. [file:3] |
| `endtime` | NUMERIC | NOT NULL | — | Segment end timestamp in the call. [file:3] |

- **Purpose:** Stores speaker-labeled transcript chunks with timestamps for playback, analysis, and downstream AI processing. [file:3]
- **Written by:** M-01 transcription service output merge step. [file:3]
- **Read by:** M-04 scoring and topic tagging, M-06 summaries, and any transcript playback or citation-linked features. [file:3]

#### Table: `transcriptcorrections`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `correctionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for correction log entry. [file:3] |
| `transcriptid` | UUID | NOT NULL | — | Parent transcript identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `originalterm` | TEXT | NOT NULL | — | Original incorrectly transcribed term. [file:3] |
| `correctedterm` | TEXT | NOT NULL | — | Corrected term applied by the system. [file:3] |
| `appliedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when the correction was applied. [file:3] |

- **Purpose:** Logs business vocabulary corrections applied to transcripts for auditability and quality improvement. [file:3]
- **Written by:** M-01 vocabulary correction step during transcript processing. [file:3]
- **Read by:** M-01 internal QA/reprocessing flows and audit/debug use cases. [file:3]

#### Table: `ingestionsources`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sourceid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for connected ingestion source. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `platform` | TEXT | NOT NULL | — | Connected source type such as Zoom or Teams. [file:3] |
| `webhooksecret` | TEXT | NULL | — | Secret used to validate source webhooks. [file:3] |
| `status` | TEXT | NOT NULL | — | Current connection status. [file:3] |
| `lastwebhookat` | TIMESTAMPTZ | NULL | — | Last successful webhook received time. [file:3] |

- **Purpose:** Stores connected conferencing or capture sources and their webhook configuration. [file:3]
- **Written by:** M-01 connector setup and admin configuration flows. [file:3]
- **Read by:** M-01 webhook validation and source health monitoring flows. [file:3]

#### Table: `crmextractedfields`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `extractionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for extracted CRM field row. [file:3] |
| `callid` | UUID | NOT NULL | — | Parent call identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `fieldname` | TEXT | NOT NULL | — | Name of the CRM field extracted from conversation. [file:3] |
| `fieldvalue` | TEXT | NULL | — | Extracted field value. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence for the extracted value. [file:3] |
| `pushedtocrm` | BOOLEAN | NOT NULL | `FALSE` | Whether the value was synced to CRM. [file:3] |
| `pushedat` | TIMESTAMPTZ | NULL | — | When the CRM push was completed. [file:3] |

- **Purpose:** Stores AI-extracted CRM fields from calls before and after sync to the connected CRM. [file:3]
- **Written by:** M-01 AI Data Extractor flow. [file:1][file:3]
- **Read by:** M-03 Revenue Graph and CRM sync flows through the `crm.fields.extracted` event. [file:3]

---

### 7.1.3 Indexes

All M-01 tables must follow the tenant-first indexing rule so tenant-scoped queries remain efficient and RLS-filtered access does not degrade as data volume grows. The architecture document explicitly requires an index on `(tenantid, primary_lookup_column)` for every table, and any table expected to exceed 10,000 rows must not rely on sequential scans. [file:3]

```sql
-- Calls
CREATE INDEX idx_calls_tenant_created
  ON ingestion.calls (tenantid, createdat DESC);

CREATE INDEX idx_calls_tenant_status
  ON ingestion.calls (tenantid, status);

-- Audio files
CREATE INDEX idx_audiofiles_tenant_call
  ON ingestion.audiofiles (tenantid, callid);

-- Transcripts
CREATE INDEX idx_transcripts_tenant_call
  ON ingestion.transcripts (tenantid, callid);

CREATE INDEX idx_transcripts_tenant_created
  ON ingestion.transcripts (tenantid, createdat DESC);

-- Speaker segments
CREATE INDEX idx_speakersegments_tenant_call
  ON ingestion.speakersegments (tenantid, callid);

CREATE INDEX idx_speakersegments_tenant_transcript
  ON ingestion.speakersegments (tenantid, transcriptid);

-- Transcript corrections
CREATE INDEX idx_transcriptcorrections_tenant_transcript
  ON ingestion.transcriptcorrections (tenantid, transcriptid);

-- Ingestion sources
CREATE INDEX idx_ingestionsources_tenant_platform
  ON ingestion.ingestionsources (tenantid, platform);

-- CRM extracted fields
CREATE INDEX idx_crmextractedfields_tenant_call
  ON ingestion.crmextractedfields (tenantid, callid);

CREATE INDEX idx_crmextractedfields_tenant_pushed
  ON ingestion.crmextractedfields (tenantid, pushedtocrm);
```

---

### 7.1.4 RLS Policy

Every table in the `ingestion` schema must have RLS enabled and forced so that tenant isolation applies even if someone runs an unsafe query without a tenant filter at the application level. The architecture mandates that the application sets the active tenant in the database session, and the policy reads that value using `current_setting('app.tenantid')::UUID`. [file:3]

```sql
ALTER TABLE ingestion.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion.calls FORCE ROW LEVEL SECURITY;

CREATE POLICY calls_tenant_isolation ON ingestion.calls
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY calls_tenant_insert ON ingestion.calls
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY calls_tenant_update ON ingestion.calls
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY calls_tenant_delete ON ingestion.calls
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to all M-01 tables: `audiofiles`, `transcripts`, `speakersegments`, `transcriptcorrections`, `ingestionsources`, and `crmextractedfields`. [file:3]

---

### 7.1.5 Events This Module Listens To / Emits

M-01 is an event producer module and is the source of the most important upstream event in the entire platform, `call.transcription.completed`, which triggers multiple downstream modules. It also emits `crm.fields.extracted` after structured CRM-ready data is derived from the call. [file:3]

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Emits | After transcript storage is completed successfully for a captured call. [file:3] |
| `crm.fields.extracted` | Emits | After AI Data Extractor identifies structured CRM fields from a call. [file:3] |

**Downstream consumers of `call.transcription.completed`:**
- M-02 Sales Engagement [file:3]
- M-03 Revenue Graph [file:3]
- M-04 Conversation Intelligence [file:3]
- M-05 Smart Tracking [file:3]
- M-06 Insight Generation [file:3]

**Downstream consumer of `crm.fields.extracted`:**
- M-03 Revenue Graph [file:3]

---

### 7.1.6 Special Notes

- This module is the most critical upstream dependency in the platform because if transcription fails, summaries, trackers, call scoring, deal linking, and downstream coaching flows cannot run. [file:3]
- The main operational flow begins when a conferencing or dialer webhook is received, audio is stored, transcription is processed with Whisper and diarization, and the result is persisted before `call.transcription.completed` is emitted. [file:3]
- The module supports AI Data Extractor and Native Connectors as part of its feature scope, in addition to core transcription. [file:1]
- `participantlist` is a strong candidate for `JSONB` because it contains structured participant metadata coming from source systems. [file:3]
- This module is a source for downstream analytics replication because `ingestion.calls` is replicated into ClickHouse as `callevents` for dashboard and performance use cases. [file:3]
- Failure handling is important here: if audio fetch or transcription fails, downstream modules should remain unaffected because they act only when `call.transcription.completed` is successfully published. [file:3]
- For documentation consistency, add a note in implementation details that this module must support replay and reprocessing safely because BullMQ retries and webhook duplication are expected in production. [file:3]



## 📦 MODULE: M-02 Sales Engagement — Schema: `engagement`

### 7.2.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-02 [file:3] |
| Module Name | Sales Engagement [file:3] |
| Schema Name | `engagement` [file:3] |
| Phase | Phase 2 [file:3] |
| Owner | [Developer Name] |
| Description | Stores AI-assisted outreach data such as email drafts, sends, templates, flows, and rep tasks so teams can execute follow-ups and sales actions inside the platform. [file:3][file:1] |

M-02 focuses on execution after customer interactions by helping reps compose emails, manage tasks, and run structured outreach flows. Its Email Composer depends on real-time deal and contact context from M-03 Revenue Graph, which is why M-02 is allowed to call the M-03 public API for personalization. [file:3][file:1]

---

### 7.2.2 Tables in This Schema

#### Table: `emaildrafts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `draftid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for draft record. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User who created or owns the draft. [file:3] |
| `recipientcontactid` | UUID | NOT NULL | — | Target contact for the email. [file:3] |
| `dealid` | UUID | NULL | — | Optional linked deal context. [file:3] |
| `subject` | TEXT | NULL | — | Draft email subject line. [file:3] |
| `body` | TEXT | NULL | — | Draft email body content. [file:3] |
| `status` | TEXT | NOT NULL | — | Draft state such as draft, scheduled, sent. [file:3] |
| `aiconfidencescore` | NUMERIC | NULL | — | Confidence score for AI-generated draft quality. [file:3] |
| `generatedfromcallid` | UUID | NULL | — | Source call used to generate the email. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores manually created and AI-generated email drafts before sending. [file:3]
- **Written by:** M-02 Email Composer and AI email generation flow. [file:1][file:3]
- **Read by:** M-02 UI endpoints and send pipeline; can also provide context to reporting or follow-up flows. [file:3]

#### Table: `emailsends`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sendid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for email send event. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User who sent the email. [file:3] |
| `draftid` | UUID | NOT NULL | — | Source draft record. [file:3] |
| `sentat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the email was sent. [file:3] |
| `opentracked` | BOOLEAN | NOT NULL | `FALSE` | Whether open tracking is enabled or captured. [file:3] |
| `clicktracked` | BOOLEAN | NOT NULL | `FALSE` | Whether click tracking is enabled or captured. [file:3] |
| `replyreceived` | BOOLEAN | NOT NULL | `FALSE` | Whether a reply was received. [file:3] |
| `providerused` | TEXT | NULL | — | Delivery provider such as Gmail or Outlook. [file:3] |

- **Purpose:** Stores delivery records and engagement status for sent emails. [file:3]
- **Written by:** M-02 sending service when an email is dispatched. [file:3]
- **Read by:** M-02 engagement UI, M-03 Revenue Graph, M-05 Smart Tracking, and M-07 Deal Management via the `email.sent` event. [file:3]

#### Table: `emailtemplates`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `templateid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for reusable template. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Template name shown to users. [file:3] |
| `subjecttemplate` | TEXT | NOT NULL | — | Subject template with placeholders. [file:3] |
| `bodytemplate` | TEXT | NOT NULL | — | Body template with variables. [file:3] |
| `language` | TEXT | NULL | — | Template language. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the template. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores reusable email templates with personalization variables. [file:3]
- **Written by:** M-02 template management flows. [file:3]
- **Read by:** M-02 Email Composer and automated flow generation logic. [file:3]

#### Table: `emailflows`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `flowid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for flow definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Name of the outreach flow. [file:3] |
| `steps` | JSONB | NOT NULL | — | Ordered flow steps and timing rules. [file:3] |
| `triggercondition` | JSONB | NULL | — | Condition that starts the sequence. [file:3] |
| `isactive` | BOOLEAN | NOT NULL | `FALSE` | Whether the flow is active. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the flow. [file:3] |

- **Purpose:** Stores multi-step outreach sequence definitions. [file:3]
- **Written by:** M-02 flow builder and admin setup flows. [file:3]
- **Read by:** M-02 enrollment engine and future M-08 automation orchestration interfaces. [file:3]

#### Table: `flowenrollments`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `enrollmentid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for flow enrollment. [file:3] |
| `flowid` | UUID | NOT NULL | — | Linked outreach flow. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `contactid` | UUID | NOT NULL | — | Enrolled contact. [file:3] |
| `dealid` | UUID | NULL | — | Optional deal context for enrollment. [file:3] |
| `currentstep` | INTEGER | NOT NULL | `0` | Current sequence step. [file:3] |
| `status` | TEXT | NOT NULL | — | Enrollment state such as active, paused, completed. [file:3] |
| `enrolledat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the contact was enrolled. [file:3] |

- **Purpose:** Tracks which contacts are currently enrolled in outreach flows and where they are in the sequence. [file:3]
- **Written by:** M-02 automation and sequence enrollment logic. [file:3]
- **Read by:** M-02 UI and scheduler/execution workers. [file:3]

#### Table: `tasks`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `taskid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for task. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | Assigned user. [file:3] |
| `type` | TEXT | NOT NULL | — | Task type such as email, call, LinkedIn, custom. [file:3] |
| `description` | TEXT | NOT NULL | — | Task description shown to the rep. [file:3] |
| `duedate` | TIMESTAMPTZ | NULL | — | Task due date. [file:3] |
| `priority` | TEXT | NULL | — | Task priority. [file:3] |
| `source` | TEXT | NULL | — | Where the task originated from. [file:3] |
| `sourceid` | UUID | NULL | — | Upstream entity reference. [file:3] |
| `status` | TEXT | NOT NULL | — | Current task status. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Centralized task list for all rep follow-up work across sources. [file:3][file:1]
- **Written by:** M-02 task generator, follow-up workflows, and event-driven task creation logic. [file:3]
- **Read by:** M-02 task UI and managers reviewing execution queues. [file:3]

---

### 7.2.3 Indexes

```sql
CREATE INDEX idx_emaildrafts_tenant_user
  ON engagement.emaildrafts (tenantid, userid, createdat DESC);

CREATE INDEX idx_emaildrafts_tenant_contact
  ON engagement.emaildrafts (tenantid, recipientcontactid);

CREATE INDEX idx_emailsends_tenant_user
  ON engagement.emailsends (tenantid, userid, sentat DESC);

CREATE INDEX idx_emailsends_tenant_draft
  ON engagement.emailsends (tenantid, draftid);

CREATE INDEX idx_emailtemplates_tenant_name
  ON engagement.emailtemplates (tenantid, name);

CREATE INDEX idx_emailtemplates_tenant_created
  ON engagement.emailtemplates (tenantid, createdat DESC);

CREATE INDEX idx_emailflows_tenant_active
  ON engagement.emailflows (tenantid, isactive, createdby);

CREATE INDEX idx_flowenrollments_tenant_contact
  ON engagement.flowenrollments (tenantid, contactid, status);

CREATE INDEX idx_flowenrollments_tenant_flow
  ON engagement.flowenrollments (tenantid, flowid);

CREATE INDEX idx_tasks_tenant_user
  ON engagement.tasks (tenantid, userid, status, duedate);

CREATE INDEX idx_tasks_tenant_source
  ON engagement.tasks (tenantid, source, sourceid);
```

These indexes follow the tenant-first rule required for all module tables and support common M-02 access patterns such as rep inboxes, sent-email history, active flow enrollments, and due task lookups. [file:3]

---

### 7.2.4 RLS Policy

```sql
ALTER TABLE engagement.emaildrafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement.emaildrafts FORCE ROW LEVEL SECURITY;

CREATE POLICY emaildrafts_tenant_isolation ON engagement.emaildrafts
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY emaildrafts_tenant_insert ON engagement.emaildrafts
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY emaildrafts_tenant_update ON engagement.emaildrafts
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY emaildrafts_tenant_delete ON engagement.emaildrafts
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `emailsends`, `emailtemplates`, `emailflows`, `flowenrollments`, and `tasks`. `FORCE ROW LEVEL SECURITY` is mandatory for all tenant-scoped tables. [file:3]

---

### 7.2.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript is ready and a follow-up workflow or AI-generated draft can be created from call context. [file:3] |
| `email.sent` | Emits | After an email is successfully sent and logged. [file:3] |

M-02 is one of the downstream consumers of M-01 transcription output, and it emits `email.sent` so M-03 can log email activity, M-05 can detect intent-based signals in outbound communication, and M-07 can use outreach activity in deal management logic. [file:3]

---

### 7.2.6 Special Notes

- M-02 is allowed to call `GET /api/v1/revenue-graph/deals/:id` from M-03 because email personalization requires real-time deal and contact context, and this is the main approved synchronous cross-module dependency in the architecture. [file:3]
- The module includes Email Composer and centralized To-do functionality in the product roadmap, and both are part of Phase 2 commercialization. [file:1]
- `steps` and `triggercondition` in `emailflows` are strong `JSONB` candidates because sequence logic is structured but variable by tenant. [file:3]
- `email.sent` is a key platform event because it links execution activity back into the Revenue Graph and downstream analytics. [file:3]

---

## 📦 MODULE: M-03 Revenue Graph — Schema: `revenuegraph`

### 7.3.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-03 [file:3] |
| Module Name | Revenue Graph [file:3] |
| Schema Name | `revenuegraph` [file:3] |
| Phase | Phase 3 Priority 1 [file:3] |
| Owner | [Developer Name] |
| Description | Stores the structured relationship layer that connects calls, emails, meetings, accounts, contacts, and deals so every downstream module can work with business context instead of isolated interactions. [file:3][file:1] |

M-03 is the core modeling layer of the platform and is the first planned extraction candidate because many downstream modules depend on its APIs and entity-linking outputs. It is planned for Phase 1-2 deployment and is Priority #1 for Phase 3 extraction into an independent microservice. It consumes upstream events from M-01 and M-02, links interactions to the correct revenue entities, and exposes the main context APIs used across the platform. [file:3]

---

### 7.3.2 Tables in This Schema

#### Table: `accounts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `accountid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for account. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `crmaccountid` | TEXT | NULL | — | Source CRM account ID. [file:3] |
| `name` | TEXT | NOT NULL | — | Account name. [file:3] |
| `industry` | TEXT | NULL | — | Industry classification. [file:3] |
| `arr` | NUMERIC | NULL | — | Annual recurring revenue value. [file:3] |
| `segment` | TEXT | NULL | — | Customer segment. [file:3] |
| `healthscore` | NUMERIC | NULL | — | Account-level health score. [file:3] |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp. [file:3] |

- **Purpose:** Master account records synced from CRM and enriched for downstream context. [file:3]
- **Written by:** M-03 CRM sync and entity-linking flows. [file:3]
- **Read by:** Frontend, M-02, M-04, M-05, M-06, M-07, M-08, and M-10 through approved APIs. [file:3]

#### Table: `contacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `contactid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for contact. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `crmcontactid` | TEXT | NULL | — | Source CRM contact ID. [file:3] |
| `accountid` | UUID | NULL | — | Parent account reference. [file:3] |
| `name` | TEXT | NOT NULL | — | Contact full name. [file:3] |
| `email` | TEXT | NULL | — | Contact email address. [file:3] |
| `title` | TEXT | NULL | — | Contact title or role. [file:3] |
| `linkedinurl` | TEXT | NULL | — | LinkedIn profile URL if available. [file:3] |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp. [file:3] |

- **Purpose:** Master contact records linked to accounts and activities. [file:3]
- **Written by:** M-03 CRM sync and entity resolution. [file:3]
- **Read by:** Frontend and other modules using Revenue Graph APIs for personalization and context. [file:3]

#### Table: `accountcontacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `accountid` | UUID | NOT NULL | — | Linked account. [file:3] |
| `contactid` | UUID | NOT NULL | — | Linked contact. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `isprimary` | BOOLEAN | NOT NULL | `FALSE` | Marks the primary contact for the account. [file:3] |

- **Purpose:** Junction table mapping contacts to accounts. [file:3]
- **Written by:** M-03 CRM sync logic. [file:3]
- **Read by:** M-03 APIs and downstream modules that need relationship context. [file:3]

#### Table: `deals`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for deal. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `crmdealid` | TEXT | NULL | — | Source CRM deal ID. [file:3] |
| `accountid` | UUID | NULL | — | Linked account. [file:3] |
| `name` | TEXT | NOT NULL | — | Deal name. [file:3] |
| `stage` | TEXT | NULL | — | Current CRM stage. [file:3] |
| `value` | NUMERIC | NULL | — | Deal value. [file:3] |
| `closedate` | DATE | NULL | — | Expected close date. [file:3] |
| `owneruserid` | UUID | NULL | — | Deal owner user ID. [file:3] |
| `healthscore` | NUMERIC | NULL | — | Current deal health score. [file:3] |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp. [file:3] |

- **Purpose:** Master deal records used as the central business context object for many modules. [file:3]
- **Written by:** M-03 CRM sync and stage sync flows. [file:3]
- **Read by:** Frontend and most downstream modules through Revenue Graph APIs. [file:3]

#### Table: `dealcontacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | — | Linked deal. [file:3] |
| `contactid` | UUID | NOT NULL | — | Linked contact. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `role` | TEXT | NULL | — | Role such as decision maker, champion, influencer. [file:3] |

- **Purpose:** Junction table mapping contacts to deals and their role in the buying process. [file:3]
- **Written by:** M-03 CRM sync and relationship mapping flows. [file:3]
- **Read by:** M-03 APIs and downstream modules needing stakeholder context. [file:3]

#### Table: `activities`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `activityid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for activity record. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `type` | TEXT | NOT NULL | — | Activity type such as call, email, meeting. [file:3] |
| `sourceid` | UUID | NOT NULL | — | Source entity ID such as transcript, send, or meeting ID. [file:3] |
| `sourcetype` | TEXT | NOT NULL | — | Source entity type. [file:3] |
| `accountid` | UUID | NULL | — | Linked account. [file:3] |
| `dealid` | UUID | NULL | — | Linked deal. [file:3] |
| `contactid` | UUID | NULL | — | Linked contact. [file:3] |
| `userid` | UUID | NULL | — | Related internal user. [file:3] |
| `occurredat` | TIMESTAMPTZ | NOT NULL | — | When the activity happened. [file:3] |

- **Purpose:** Unified activity log across calls, emails, and meetings tied to accounts and deals. [file:3]
- **Written by:** M-03 event consumers processing `call.transcription.completed` and `email.sent`. [file:3]
- **Read by:** Frontend, M-07 Deal Management, and analytics/export workflows. [file:3]

#### Table: `crmsynclogs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `syncid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for sync log. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `crmplatform` | TEXT | NOT NULL | — | CRM platform such as Salesforce, HubSpot, Dynamics. [file:3] |
| `entitytype` | TEXT | NOT NULL | — | Synced entity type such as account, contact, deal. [file:3] |
| `status` | TEXT | NOT NULL | — | Sync result status such as success, partial, failed. [file:3] |
| `recordssynced` | INTEGER | NULL | — | Number of records synced. [file:3] |
| `errormessage` | TEXT | NULL | — | Failure message if sync failed. [file:3] |
| `syncedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the sync completed. [file:3] |

- **Purpose:** Logs CRM synchronization activity for monitoring and audit. [file:3]
- **Written by:** M-03 CRM sync jobs and manual sync endpoints. [file:3]
- **Read by:** RevOps-facing sync status endpoints and admin troubleshooting flows. [file:3]

#### Table: `datacloudexports`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `exportid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for export job. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `warehousetype` | TEXT | NOT NULL | — | Target warehouse such as Snowflake, BigQuery, Databricks, S3, or Redshift. [file:3] |
| `warehouseconfigencrypted` | TEXT | NULL | — | Encrypted warehouse connection details. [file:3] |
| `lastexportedat` | TIMESTAMPTZ | NULL | — | Last successful export time. [file:3] |
| `status` | TEXT | NOT NULL | — | Export state such as running, success, failed. [file:3] |
| `recordsexported` | INTEGER | NULL | — | Number of exported records. [file:3] |
| `idempotencykey` | TEXT | NULL | — | Prevents duplicate export runs. [file:3] |

- **Purpose:** Stores Data Cloud export configuration and export job history. [file:3][file:1]
- **Written by:** M-03 Data Cloud configuration and export flows. [file:3]
- **Read by:** RevOps export status endpoints and audit/reporting flows. [file:3]

---

### 7.3.3 Indexes

```sql
CREATE INDEX idx_accounts_tenant_name
  ON revenuegraph.accounts (tenantid, name);

CREATE UNIQUE INDEX idx_accounts_tenant_crmaccountid
  ON revenuegraph.accounts (tenantid, crmaccountid);

CREATE INDEX idx_contacts_tenant_account
  ON revenuegraph.contacts (tenantid, accountid);

CREATE UNIQUE INDEX idx_contacts_tenant_crmcontactid
  ON revenuegraph.contacts (tenantid, crmcontactid);

CREATE INDEX idx_deals_tenant_stage
  ON revenuegraph.deals (tenantid, stage, closedate);

CREATE UNIQUE INDEX idx_deals_tenant_crmdealid
  ON revenuegraph.deals (tenantid, crmdealid);

CREATE INDEX idx_activities_tenant_deal
  ON revenuegraph.activities (tenantid, dealid, occurredat DESC);

CREATE INDEX idx_activities_tenant_contact
  ON revenuegraph.activities (tenantid, contactid, occurredat DESC);

CREATE INDEX idx_crmsynclogs_tenant_entity
  ON revenuegraph.crmsynclogs (tenantid, entitytype, syncedat DESC);

CREATE UNIQUE INDEX idx_datacloudexports_idempotency
  ON revenuegraph.datacloudexports (tenantid, idempotencykey);
```

These indexes are directly aligned to documented access patterns in the Revenue Graph module, especially CRM lookup, account/deal browsing, activity timelines, and export idempotency enforcement. [file:3]

---

### 7.3.4 RLS Policy

```sql
ALTER TABLE revenuegraph.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuegraph.accounts FORCE ROW LEVEL SECURITY;

CREATE POLICY accounts_tenant_isolation ON revenuegraph.accounts
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY accounts_tenant_insert ON revenuegraph.accounts
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY accounts_tenant_update ON revenuegraph.accounts
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY accounts_tenant_delete ON revenuegraph.accounts
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `contacts`, `accountcontacts`, `deals`, `dealcontacts`, `activities`, `crmsynclogs`, and `datacloudexports`. [file:3]

---

### 7.3.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a call transcript is ready and must be linked to the correct account, contact, and deal. [file:3] |
| `crm.fields.extracted` | Listens | When AI-extracted CRM fields are available for writeback or enrichment. [file:3] |
| `email.sent` | Listens | When outbound email activity should be added to the Revenue Graph. [file:3] |
| `revenuegraph.entity.linked` | Emits | After a call or interaction has been linked to the correct account, deal, and contact. [file:3] |
| `deal.stage.changed` | Emits | After a deal stage is updated through CRM synchronization or detected stage movement. [file:3] |

M-03 is both a consumer and a publisher at the center of the event model, which is why it is the main dependency for M-04, M-05, M-06, M-07, M-08, and M-10 context access patterns. [file:3]

---

### 7.3.6 Special Notes

- M-03 is the platform’s structured data foundation, not just a storage module; it converts isolated interaction data into account, contact, and deal context that downstream AI modules require. [file:3]
- It exposes important APIs such as `GET /api/v1/revenue-graph/accounts`, `GET /api/v1/revenue-graph/deals`, and `GET /api/v1/revenue-graph/deals/:id`, and these are approved cross-module access points. [file:3]
- CRM sync belongs here, but CRM ownership boundaries still matter: M-03 can write AI-enriched fields back to CRM, but it must not own unrelated CRM business actions outside its defined boundary. [file:3]
- `datacloudexports` must be idempotent because Data Cloud sync is designed to be safely re-runnable. [file:3]
- `activities` is a prime candidate for ClickHouse replication because activity streams are later used in aggregation-heavy dashboard scenarios. [file:3]
- M-03 is marked as Phase 3 Priority 1 extraction because once it becomes independently deployable, it unlocks cleaner scaling and reuse for many downstream modules. [file:3]


## 📦 MODULE: M-04 Conversation Intelligence — Schema: `conversationintelligence`

### 7.4.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-04 [file:3] |
| Module Name | Conversation Intelligence [file:3] |
| Schema Name | `conversationintelligence` [file:3] |
| Phase | Phase 3 (Planned) [file:3] |
| Owner | [Developer Name] |
| Description | Stores AI analysis outputs for calls such as scorecards, reviews, topic tags, themes, vocabulary rules, and translation preferences so conversations become measurable, searchable, and coachable. [file:3][file:1] |

M-04 turns raw transcripts into structured intelligence by scoring calls, tagging topics, detecting themes, and applying business-language corrections. It is planned for Phase 1-2 deployment, and its Phase 3 extraction priority is not yet assigned. It depends on both M-01 transcript completion and M-03 entity linking because scoring quality improves when deal and account context is available. [file:3]

---

### 7.4.2 Tables in This Schema

#### Table: `scorecards`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `scorecardid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for scorecard. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Scorecard name. [file:3] |
| `questions` | JSONB | NOT NULL | — | Review questions and weights. [file:3] |
| `scoringconditions` | JSONB | NOT NULL | — | Rubric or scoring rules for each question. [file:3] |
| `createdby` | UUID | NOT NULL | — | Admin who created the scorecard. [file:3] |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the scorecard is active. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores admin-defined call review scorecards used for AI or manual evaluation. [file:3]
- **Written by:** M-04 scorecard management endpoints. [file:3]
- **Read by:** M-04 scoring jobs and admin/front-end scorecard views. [file:3]

#### Table: `callreviews`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `reviewid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for review result. [file:3] |
| `callid` | UUID | NOT NULL | — | Reviewed call ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `scorecardid` | UUID | NOT NULL | — | Scorecard used for evaluation. [file:3] |
| `aianswers` | JSONB | NOT NULL | — | AI answers with evidence snippets and confidence. [file:3] |
| `totalscore` | NUMERIC | NULL | — | Final score for the call. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Model confidence score. [file:3] |
| `flaggedreview` | BOOLEAN | NOT NULL | `FALSE` | Whether human review is required. [file:3] |
| `reviewtype` | TEXT | NULL | — | AI, manual, or hybrid review type. [file:3] |
| `scoredat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the review was scored. [file:3] |

- **Purpose:** Stores scorecard-based call review results. [file:3]
- **Written by:** M-04 AI scoring pipeline after transcript analysis. [file:3]
- **Read by:** Frontend review pages and M-10 Performance Coaching via API/event outputs. [file:3]

#### Table: `topics`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `topicid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for topic definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Topic name such as pricing or objection. [file:3] |
| `phrases` | JSONB | NULL | — | Keywords or seed phrases supporting the topic. [file:3] |
| `type` | TEXT | NULL | — | Global or tenant-custom topic type. [file:3] |
| `isvisible` | BOOLEAN | NOT NULL | `TRUE` | Whether the topic is shown in UI. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores topic definitions used for tagging and search experiences. [file:3]
- **Written by:** M-04 topic administration flows. [file:3]
- **Read by:** M-04 topic tagging logic and topic management UI. [file:3]

#### Table: `topictags`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `tagid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for applied tag. [file:3] |
| `callid` | UUID | NOT NULL | — | Related call. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `topicid` | UUID | NULL | — | Linked topic definition. [file:3] |
| `topicname` | TEXT | NOT NULL | — | Resolved topic name. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence of topic detection. [file:3] |
| `taggedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When tagging occurred. [file:3] |

- **Purpose:** Stores topic tags applied to individual calls. [file:3]
- **Written by:** M-04 AI topic tagging jobs. [file:3]
- **Read by:** Frontend call topic views, M-05 Smart Tracking, and M-06 Insight Generation through event/API flows. [file:3]

#### Table: `themes`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `themeid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for theme cluster. [file:3] |
| `analysisid` | UUID | NOT NULL | — | Parent analysis run. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Theme name. [file:3] |
| `summary` | TEXT | NULL | — | AI-generated summary of the theme. [file:3] |
| `callcount` | INTEGER | NULL | — | Calls represented by this theme. [file:3] |
| `accountcount` | INTEGER | NULL | — | Accounts represented by this theme. [file:3] |
| `associatedrevenue` | NUMERIC | NULL | — | Revenue associated with calls in this theme. [file:3] |

- **Purpose:** Stores clustered recurring themes found across many conversations. [file:3]
- **Written by:** M-04 Theme Spotter analysis jobs. [file:3]
- **Read by:** Frontend theme dashboards and analysis result views. [file:3]

#### Table: `themeanalyses`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `analysisid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for analysis run. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `businessquestion` | TEXT | NOT NULL | — | User-entered question driving the analysis. [file:3] |
| `filters` | JSONB | NULL | — | Date range, rep, stage, account filters. [file:3] |
| `status` | TEXT | NOT NULL | — | Job state such as queued, running, completed, failed. [file:3] |
| `callcountanalyzed` | INTEGER | NULL | — | Number of calls analyzed. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who launched the job. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores analysis job metadata for AI Theme Spotter runs. [file:3]
- **Written by:** M-04 theme analysis endpoints and workers. [file:3]
- **Read by:** Frontend analysis status and results pages. [file:3]

#### Table: `vocabularycorrections`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `vocabid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for vocabulary correction rule. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `incorrectterm` | TEXT | NOT NULL | — | Mis-transcribed term. [file:3] |
| `correctterm` | TEXT | NOT NULL | — | Correct replacement term. [file:3] |
| `language` | TEXT | NULL | — | Language for the rule. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores custom business terminology corrections for transcript enhancement. [file:3]
- **Written by:** M-04 vocabulary management endpoints. [file:3]
- **Read by:** M-04 transcription correction and topic analysis flows. [file:3]

#### Table: `translationpreferences`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `prefid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for translation preference. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `teamid` | UUID | NULL | — | Optional team scope. [file:3] |
| `userid` | UUID | NULL | — | Optional user-specific preference. [file:3] |
| `targetlanguage` | TEXT | NOT NULL | — | Preferred target language in BCP-47 style code. [file:3] |

- **Purpose:** Stores preferred output translation settings for teams or users. [file:3]
- **Written by:** M-04 translation settings endpoints. [file:3]
- **Read by:** M-04 transcript/summary translation flows. [file:3]

---

### 7.4.3 Indexes

```sql
CREATE INDEX idx_scorecards_tenant_active
  ON conversationintelligence.scorecards (tenantid, isactive, createdat DESC);

CREATE INDEX idx_callreviews_tenant_call
  ON conversationintelligence.callreviews (tenantid, callid);

CREATE INDEX idx_callreviews_tenant_scorecard
  ON conversationintelligence.callreviews (tenantid, scorecardid, scoredat DESC);

CREATE INDEX idx_topics_tenant_name
  ON conversationintelligence.topics (tenantid, name);

CREATE INDEX idx_topictags_tenant_call
  ON conversationintelligence.topictags (tenantid, callid);

CREATE INDEX idx_topictags_tenant_topic
  ON conversationintelligence.topictags (tenantid, topicname);

CREATE INDEX idx_themes_tenant_analysis
  ON conversationintelligence.themes (tenantid, analysisid);

CREATE INDEX idx_themeanalyses_tenant_status
  ON conversationintelligence.themeanalyses (tenantid, status, createdat DESC);

CREATE INDEX idx_vocabularycorrections_tenant_term
  ON conversationintelligence.vocabularycorrections (tenantid, incorrectterm);

CREATE INDEX idx_vocabularycorrections_tenant_created
  ON conversationintelligence.vocabularycorrections (tenantid, createdat DESC);

CREATE INDEX idx_translationpreferences_tenant_user
  ON conversationintelligence.translationpreferences (tenantid, userid);
```

These indexes match the module’s main access patterns for score retrieval, topic filtering, theme analysis status, and per-tenant vocabulary and language preferences. [file:3]

---

### 7.4.4 RLS Policy

```sql
ALTER TABLE conversationintelligence.scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversationintelligence.scorecards FORCE ROW LEVEL SECURITY;

CREATE POLICY scorecards_tenant_isolation ON conversationintelligence.scorecards
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY scorecards_tenant_insert ON conversationintelligence.scorecards
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY scorecards_tenant_update ON conversationintelligence.scorecards
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY scorecards_tenant_delete ON conversationintelligence.scorecards
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `callreviews`, `topics`, `topictags`, `themes`, `themeanalyses`, `vocabularycorrections`, and `translationpreferences`. [file:3]

---

### 7.4.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript becomes available and scoring/topic-tagging jobs can be queued. [file:3] |
| `revenuegraph.entity.linked` | Listens | When deal/account context is available and scoring can be finalized with business context. [file:3] |
| `call.scored` | Emits | After a call review result is written. [file:3] |
| `call.topics.tagged` | Emits | After topic tags are generated for a call. [file:3] |

M-04 must wait for M-03 entity linking before finalizing score outputs, and the architecture explicitly recommends a delayed-job approach so scoring can proceed when context arrives or after a timeout window. [file:3]

---

### 7.4.6 Special Notes

- This module uses AI service endpoints such as `POST /v1/score-call`, `POST /v1/detect-themes`, and `POST /v1/tag-topics`, but business logic still stays in TypeScript module code. [file:3]
- `questions`, `scoringconditions`, `aianswers`, and `filters` are natural `JSONB` fields because their shapes vary by tenant and use case. [file:3]
- Low-confidence AI reviews should set `flaggedreview = true`, which is important for safe human-in-the-loop workflows. [file:3]
- M-10 Performance Coaching depends on `call.scored`, while M-05 Smart Tracking and M-06 Insight Generation depend on `call.topics.tagged`, so event quality and idempotency matter here. [file:3]
- The module covers AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, AI Transcriber, and AI Translator in the product scope. [file:1]

---

## 📦 MODULE: M-05 Smart Tracking — Schema: `smarttracking`

### 7.5.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-05 [file:3] |
| Module Name | Smart Tracking [file:3] |
| Schema Name | `smarttracking` [file:3] |
| Phase | Phase 3 Priority 2 [file:3] |
| Owner | [Developer Name] |
| Description | Stores tracker definitions, AI-detected business signals, searchable index sync state, and aggregated deal-driver snapshots so teams can detect intent, risks, and patterns across conversations. [file:3][file:1] |

M-05 is the signal-detection layer that turns conversation data into actionable business alerts such as competitor mentions, pricing pressure, risk cues, and next-step gaps. It depends on M-03 entity linking for deal and account context and also consumes M-04 topic-tag output to enrich or refine detections. [file:3]

---

### 7.5.2 Tables in This Schema

#### Table: `trackers`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `trackerid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for tracker definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Tracker name. [file:3] |
| `description` | TEXT | NULL | — | Human-readable purpose of the tracker. [file:3] |
| `intentdefinition` | JSONB | NOT NULL | — | AI detection instructions, patterns, or semantic definition. [file:3] |
| `severitydefault` | TEXT | NULL | — | Default severity assigned when matched. [file:3] |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the tracker is active. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the tracker. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores tenant-defined AI trackers that describe what signals should be detected in calls or emails. [file:3]
- **Written by:** M-05 tracker configuration endpoints. [file:3]
- **Read by:** M-05 detection workers and tracker management UI. [file:3]

#### Table: `trackerdetections`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `detectionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for detection result. [file:3] |
| `trackerid` | UUID | NOT NULL | — | Source tracker definition. [file:3] |
| `callid` | UUID | NOT NULL | — | Related call identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `accountid` | UUID | NULL | — | Linked account context. [file:3] |
| `dealid` | UUID | NULL | — | Linked deal context. [file:3] |
| `contactid` | UUID | NULL | — | Linked contact context. [file:3] |
| `snippet` | TEXT | NULL | — | Transcript snippet supporting the detection. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence of the detection. [file:3] |
| `severity` | TEXT | NULL | — | Severity assigned to the signal. [file:3] |
| `detectedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the detection was created. [file:3] |

- **Purpose:** Stores every AI-detected signal matched by a tracker. [file:3]
- **Written by:** M-05 detection pipeline after transcript and context analysis. [file:3]
- **Read by:** Frontend signal views, M-06 Insight Generation, M-07 Deal Management, and M-08 Execution Automation through events/APIs. [file:3]

#### Table: `searchindexsynclog`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `syncid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for search sync log entry. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `entitytype` | TEXT | NOT NULL | — | Indexed entity type such as call, tracker, or detection. [file:3] |
| `entityid` | UUID | NOT NULL | — | Indexed record ID. [file:3] |
| `status` | TEXT | NOT NULL | — | Sync state such as queued, synced, failed. [file:3] |
| `errormessage` | TEXT | NULL | — | Search indexing failure message if any. [file:3] |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last sync completion time. [file:3] |

- **Purpose:** Tracks synchronization of searchable conversation data into the search index. [file:3]
- **Written by:** M-05 Meilisearch sync workers. [file:3]
- **Read by:** Admin diagnostics and search index health monitoring. [file:3]

#### Table: `dealdriversnapshots`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `snapshotid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for snapshot row. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | Rep or owner being measured. [file:3] |
| `trackerid` | UUID | NOT NULL | — | Tracker represented in the aggregate. [file:3] |
| `detectioncount` | INTEGER | NOT NULL | `0` | Number of detections counted. [file:3] |
| `affecteddealcount` | INTEGER | NOT NULL | `0` | Number of deals impacted by this tracker. [file:3] |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the aggregate was computed. [file:3] |

- **Purpose:** Stores aggregated signal counts for the Deal Drivers view. [file:3][file:1]
- **Written by:** M-05 aggregation jobs. [file:3]
- **Read by:** Frontend analytics views and downstream board/reporting modules. [file:3]

---

### 7.5.3 Indexes

```sql
CREATE INDEX idx_trackers_tenant_active
  ON smarttracking.trackers (tenantid, isactive, createdat DESC);

CREATE INDEX idx_trackerdetections_tenant_deal
  ON smarttracking.trackerdetections (tenantid, dealid, detectedat DESC);

CREATE INDEX idx_trackerdetections_tenant_contact
  ON smarttracking.trackerdetections (tenantid, contactid, detectedat DESC);

CREATE INDEX idx_trackerdetections_tenant_call
  ON smarttracking.trackerdetections (tenantid, callid);

CREATE INDEX idx_trackerdetections_tenant_tracker
  ON smarttracking.trackerdetections (tenantid, trackerid, detectedat DESC);

CREATE INDEX idx_searchindexsynclog_tenant_entity
  ON smarttracking.searchindexsynclog (tenantid, entitytype, entityid);

CREATE INDEX idx_searchindexsynclog_tenant_status
  ON smarttracking.searchindexsynclog (tenantid, status, syncedat DESC);

CREATE INDEX idx_dealdriversnapshots_tenant_user
  ON smarttracking.dealdriversnapshots (tenantid, userid, computedat DESC);

CREATE INDEX idx_dealdriversnapshots_tenant_tracker
  ON smarttracking.dealdriversnapshots (tenantid, trackerid, computedat DESC);
```

These indexes support the documented access patterns for deal risk analysis, contact-level signal review, tracker monitoring, and search sync operations. [file:3]

---

### 7.5.4 RLS Policy

```sql
ALTER TABLE smarttracking.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE smarttracking.trackers FORCE ROW LEVEL SECURITY;

CREATE POLICY trackers_tenant_isolation ON smarttracking.trackers
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY trackers_tenant_insert ON smarttracking.trackers
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY trackers_tenant_update ON smarttracking.trackers
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY trackers_tenant_delete ON smarttracking.trackers
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `trackerdetections`, `searchindexsynclog`, and `dealdriversnapshots`. [file:3]

---

### 7.5.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript is ready and tracker detection jobs can be queued. [file:3] |
| `revenuegraph.entity.linked` | Listens | When deal/account/contact context is available to enrich detections. [file:3] |
| `call.topics.tagged` | Listens | When M-04 topic-tag output is available and can improve signal understanding. [file:3] |
| `email.sent` | Listens | When outbound email activity may also need tracker-based signal detection. [file:3] |
| `tracker.detection.created` | Emits | After a tracker detection record is written. [file:3] |

M-05 sits in the middle of the platform’s “understand” stage because its detections feed directly into M-06 summaries and research, M-07 deal health logic, and M-08 automation triggers. [file:3]

---

### 7.5.6 Special Notes

- This module powers AI Smart Tracker, Searchable Conversation Library, and View Deal Drivers in the product map. [file:1]
- `intentdefinition` in `trackers` is naturally `JSONB` because tracker logic can vary by tenant and may include rule hints, semantic prompts, or thresholds. [file:3]
- `searchindexsynclog` exists because M-05 is responsible for searchable conversation access patterns, and search indexing is explicitly separated from PostgreSQL source-of-truth storage. [file:3]
- `trackerdetections` is a high-value event source because `tracker.detection.created` is consumed by M-06, M-07, and M-08, so idempotency and evidence-snippet quality are important. [file:3]
- Cross-module reads for deal and account context must go through the M-03 Revenue Graph API and not direct table access. [file:3]

## 📦 MODULE: M-06 Insight Generation — Schema: `insights`

### 7.6.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-06 [file:3] |
| Module Name | Insight Generation [file:3] |
| Schema Name | `insights` [file:3] |
| Phase | Phase 3 [file:3] |
| Owner | [Developer Name] |
| Description | Stores AI-generated summaries, briefs, research outputs, Ask Anything sessions, and vector embeddings so users can consume conversations as structured insights instead of raw transcripts. [file:3][file:1] |

M-06 is the main “analyze” layer of the platform because it converts transcript, topic, tracker, and deal context into human-usable outputs like call summaries, deal briefs, and question-answer responses. It consumes raw conversation events plus enrichment from M-04 and M-05, and it also owns the pgvector-based retrieval layer for semantic search and RAG. [file:3]

---

### 7.6.2 Tables in This Schema

#### Table: `callsummaries`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `summaryid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the call summary. [file:3] |
| `callid` | UUID | NOT NULL | — | Source call identifier. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `onelinesummary` | TEXT | NOT NULL | — | Short summary of the call. [file:3] |
| `keypoints` | JSONB | NOT NULL | — | Structured key takeaways. [file:3] |
| `nextsteps` | JSONB | NOT NULL | — | Extracted follow-up actions and owners. [file:3] |
| `risks` | JSONB | NULL | — | Risks identified from the conversation. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence from the AI response. [file:3] |
| `flaggedreview` | BOOLEAN | NOT NULL | `FALSE` | Whether the summary needs human review. [file:3] |
| `version` | INTEGER | NOT NULL | `1` | Summary version number for regeneration. [file:3] |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the summary was generated. [file:3] |

- **Purpose:** Stores structured AI summaries for individual calls. [file:3]
- **Written by:** M-06 summary generation flow after `call.transcription.completed`. [file:3]
- **Read by:** Frontend summary views, M-03 for CRM note push, and M-07 for deal health logic. [file:3]

#### Table: `dealbriefs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `briefid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the deal brief. [file:3] |
| `dealid` | UUID | NOT NULL | — | Related deal ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `summarytext` | TEXT | NOT NULL | — | Generated narrative deal brief. [file:3] |
| `keyrisks` | JSONB | NULL | — | Structured list of deal risks. [file:3] |
| `recentsignals` | JSONB | NULL | — | Recent summaries, detections, and movement signals. [file:3] |
| `sources` | JSONB | NULL | — | Source references used to build the brief. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence of the generated brief. [file:3] |
| `version` | INTEGER | NOT NULL | `1` | Brief version for regeneration. [file:3] |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the brief was generated. [file:3] |

- **Purpose:** Stores AI-generated briefs that summarize the state of a deal using multiple upstream signals. [file:3]
- **Written by:** M-06 deal brief generation jobs. [file:3]
- **Read by:** Frontend deal views and M-07 through the approved `GET /api/v1/insights/deals/:id/brief` API. [file:3]

#### Table: `accountbriefs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `briefid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the account brief. [file:3] |
| `accountid` | UUID | NOT NULL | — | Related account ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `summarytext` | TEXT | NOT NULL | — | Generated account-level summary. [file:3] |
| `healthsignals` | JSONB | NULL | — | Structured account health indicators. [file:3] |
| `renewalindicators` | JSONB | NULL | — | Renewal or expansion cues from interactions. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence of the generated brief. [file:3] |
| `version` | INTEGER | NOT NULL | `1` | Brief version number. [file:3] |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the brief was generated. [file:3] |

- **Purpose:** Stores AI-generated account briefs that combine account context with interaction intelligence. [file:3]
- **Written by:** M-06 account brief generation jobs. [file:3]
- **Read by:** Frontend account views and downstream account-management experiences. [file:3]

#### Table: `researchreports`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `reportid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for research report. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `question` | TEXT | NOT NULL | — | User’s research question. [file:3] |
| `filters` | JSONB | NULL | — | Scope filters such as rep, date range, or deal stage. [file:3] |
| `status` | TEXT | NOT NULL | — | Job state such as queued, running, completed, failed. [file:3] |
| `resulttext` | TEXT | NULL | — | Final generated report text. [file:3] |
| `sourcecallids` | JSONB | NULL | — | Calls used as evidence for the report. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the report request. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores deep multi-call research outputs generated by AI. [file:3]
- **Written by:** M-06 AI Deep Researcher jobs. [file:3]
- **Read by:** Frontend report views and export flows. [file:3]

#### Table: `querysessions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sessionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for Ask Anything session. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User who owns the session. [file:3] |
| `contextdealid` | UUID | NULL | — | Optional deal context for the conversation. [file:3] |
| `contextaccountid` | UUID | NULL | — | Optional account context for the conversation. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Session creation time. [file:3] |

- **Purpose:** Stores Ask Anything chat sessions. [file:3]
- **Written by:** M-06 query session endpoints. [file:3]
- **Read by:** Ask Anything UI and message retrieval endpoints. [file:3]

#### Table: `querymessages`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `messageid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for session message. [file:3] |
| `sessionid` | UUID | NOT NULL | — | Parent session ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `role` | TEXT | NOT NULL | — | Message role such as user or assistant. [file:3] |
| `content` | TEXT | NOT NULL | — | Message content. [file:3] |
| `citedsources` | JSONB | NULL | — | Stored source references shown in the UI. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Message creation time. [file:3] |

- **Purpose:** Stores individual messages within an Ask Anything conversation. [file:3]
- **Written by:** M-06 query-answer pipeline. [file:3]
- **Read by:** Ask Anything UI history retrieval endpoints. [file:3]

#### Table: `semanticembeddings`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `embeddingid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for embedding record. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `entitytype` | TEXT | NOT NULL | — | Type such as transcriptchunk, callsummary, dealbrief, accountbrief, or email. [file:3] |
| `entityid` | UUID | NOT NULL | — | Source entity ID. [file:3] |
| `chunkindex` | INTEGER | NULL | — | Chunk sequence for multi-part sources. [file:3] |
| `chunktext` | TEXT | NOT NULL | — | Source text stored for retrieval context. [file:3] |
| `embedding` | VECTOR(1536) | NOT NULL | — | pgvector embedding matching the selected model dimension. [file:3] |
| `modelversion` | TEXT | NOT NULL | — | Embedding model version identifier. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the embedding was created. [file:3] |

- **Purpose:** Stores vector embeddings used for semantic search and retrieval-augmented generation. [file:3]
- **Written by:** M-06 embedding generation flow, and in some cases shared AI embedding jobs used by M-05/M-06 workflows. [file:3]
- **Read by:** M-06 Ask Anything, AI Deep Researcher, and semantic retrieval services. [file:3]

---

### 7.6.3 Indexes

```sql
CREATE INDEX idx_callsummaries_tenant_call
  ON insights.callsummaries (tenantid, callid, generatedat DESC);

CREATE INDEX idx_dealbriefs_tenant_deal
  ON insights.dealbriefs (tenantid, dealid, generatedat DESC);

CREATE INDEX idx_accountbriefs_tenant_account
  ON insights.accountbriefs (tenantid, accountid, generatedat DESC);

CREATE INDEX idx_researchreports_tenant_status
  ON insights.researchreports (tenantid, status, createdat DESC);

CREATE INDEX idx_querysessions_tenant_user
  ON insights.querysessions (tenantid, userid, createdat DESC);

CREATE INDEX idx_querymessages_tenant_session
  ON insights.querymessages (tenantid, sessionid, createdat ASC);

CREATE INDEX idx_embeddings_tenant_entity
  ON insights.semanticembeddings (tenantid, entitytype, entityid);

CREATE INDEX idx_embeddings_tenant_ivfflat
  ON insights.semanticembeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

The `semanticembeddings` table requires both a tenant/entity lookup index and an IVFFlat vector index because retrieval performance is a core part of Ask Anything and RAG workflows. The architecture explicitly documents pgvector with a `VECTOR(1536)` column and cosine-distance search for this table. [file:3]

---

### 7.6.4 RLS Policy

```sql
ALTER TABLE insights.callsummaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights.callsummaries FORCE ROW LEVEL SECURITY;

CREATE POLICY callsummaries_tenant_isolation ON insights.callsummaries
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY callsummaries_tenant_insert ON insights.callsummaries
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY callsummaries_tenant_update ON insights.callsummaries
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY callsummaries_tenant_delete ON insights.callsummaries
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `dealbriefs`, `accountbriefs`, `researchreports`, `querysessions`, `querymessages`, and `semanticembeddings`. Every tenant-scoped table must enforce RLS. [file:3]

---

### 7.6.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript is ready and summary generation can begin. [file:3] |
| `call.topics.tagged` | Listens | When M-04 topic tags are available to enrich summary and research context. [file:3] |
| `tracker.detection.created` | Listens | When M-05 signal detections are available for briefs and risk-aware summaries. [file:3] |
| `call.summary.generated` | Emits | After a call summary is written successfully. [file:3] |

M-06 also uses approved synchronous reads across schemas through APIs, including M-03 for deal/account/contact context and M-05 for tracker detections when generating deal briefs. If the deal link is not available immediately after transcript completion, the documented flow allows a delayed retry for up to five minutes before proceeding without context. [file:3]

---

### 7.6.6 Special Notes

- This module owns the platform’s pgvector implementation for semantic search and RAG, and the `semanticembeddings.embedding` column is explicitly defined as `VECTOR(1536)` for the OpenAI text-embedding-3-small dimension. [file:3]
- Content embedded here includes transcript chunks, call summaries, deal briefs, account briefs, and outbound emails, with transcript chunking documented as 500-token chunks with 50-token overlap. [file:3]
- `keypoints`, `nextsteps`, `risks`, `filters`, `sourcecallids`, and `citedsources` are natural `JSONB` fields because the structure varies by workflow. [file:3]
- If `confidencescore < 0.7`, outputs should be marked for review instead of being blindly trusted in downstream automation. [file:3]
- This module covers AI Smart Summaries, Ask Anything GenAI Query, and AI Deep Researcher in the product map. [file:1]

---

## 📦 MODULE: M-07 Deal & Account Management — Schema: `dealmanagement`

### 7.7.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-07 [file:3] |
| Module Name | Deal & Account Management [file:3] |
| Schema Name | `dealmanagement` [file:3] |
| Phase | Phase 3 Priority 3 [file:3] |
| Owner | [Developer Name] |
| Description | Stores enriched deal records, pipeline stage definitions, health-score history, risk flags, board configuration, and deal-driver aggregates so reps and managers can manage pipeline health in one place. [file:3][file:1] |

M-07 is the execution-facing pipeline intelligence layer that turns CRM data and AI signals into deal health, risk visibility, and board experiences. It consumes signals from M-03, M-05, and M-06, and it is planned as the third extraction candidate because active board traffic can become a UI and read bottleneck at scale. [file:3]

---

### 7.7.2 Tables in This Schema

#### Table: `deals`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the deal. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `crmdealid` | TEXT | NULL | — | Source CRM deal ID. [file:3] |
| `accountid` | UUID | NULL | — | Linked account ID. [file:3] |
| `name` | TEXT | NOT NULL | — | Deal name. [file:3] |
| `stage` | TEXT | NULL | — | Current pipeline stage. [file:3] |
| `value` | NUMERIC | NULL | — | Deal value. [file:3] |
| `closedate` | DATE | NULL | — | Expected close date. [file:3] |
| `owneruserid` | UUID | NULL | — | Owner of the deal. [file:3] |
| `healthscore` | NUMERIC | NULL | — | Current computed health score. [file:3] |
| `healthcategory` | TEXT | NULL | — | Category such as healthy, at risk, or critical. [file:3] |
| `lastsignalat` | TIMESTAMPTZ | NULL | — | Last time a major signal affected this deal. [file:3] |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp. [file:3] |

- **Purpose:** Stores master deal records enriched with AI health metadata used by the Deals Board. [file:3]
- **Written by:** M-07 deal sync and health recomputation flows. [file:3]
- **Read by:** Frontend boards, M-09 forecasting context, and M-08 workflow triggers through approved APIs/events. [file:3]

#### Table: `dealstages`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `stageid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for stage definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `crmplatform` | TEXT | NOT NULL | — | CRM platform this stage belongs to. [file:3] |
| `stagename` | TEXT | NOT NULL | — | Human-readable stage name. [file:3] |
| `stageorder` | INTEGER | NOT NULL | — | Ordering of the stage in the pipeline. [file:3] |
| `isclosedwon` | BOOLEAN | NOT NULL | `FALSE` | Whether the stage is closed won. [file:3] |
| `isclosedlost` | BOOLEAN | NOT NULL | `FALSE` | Whether the stage is closed lost. [file:3] |

- **Purpose:** Stores tenant-specific pipeline stage definitions. [file:3]
- **Written by:** M-07 configuration or CRM sync flows. [file:3]
- **Read by:** Boards, stage transitions, and forecasting support logic. [file:3]

#### Table: `dealhealthscores`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `scoreid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for historical health score row. [file:3] |
| `dealid` | UUID | NOT NULL | — | Related deal ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `score` | NUMERIC | NOT NULL | — | Computed health score value. [file:3] |
| `category` | TEXT | NOT NULL | — | Score category such as healthy, at risk, critical. [file:3] |
| `activityscore` | NUMERIC | NULL | — | Activity contribution to the score. [file:3] |
| `riskflagcount` | INTEGER | NULL | — | Number of active unresolved risk flags. [file:3] |
| `pastduenextsteps` | INTEGER | NULL | — | Count of overdue next steps. [file:3] |
| `dayssincelastcontact` | INTEGER | NULL | — | Days since last interaction. [file:3] |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the score was computed. [file:3] |

- **Purpose:** Stores historical snapshots of deal health calculations. [file:3]
- **Written by:** M-07 health score computation jobs. [file:3]
- **Read by:** Frontend boards, history views, and analytics/reporting use cases. [file:3]

#### Table: `dealriskflags`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `flagid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for risk flag. [file:3] |
| `dealid` | UUID | NOT NULL | — | Related deal ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `risktype` | TEXT | NOT NULL | — | Risk classification. [file:3] |
| `severity` | TEXT | NOT NULL | — | Risk severity. [file:3] |
| `source` | TEXT | NOT NULL | — | Signal source such as tracker detection or summary. [file:3] |
| `sourceid` | UUID | NULL | — | Upstream event or entity reference. [file:3] |
| `detectedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the risk was detected. [file:3] |
| `resolvedat` | TIMESTAMPTZ | NULL | — | When the risk was resolved. [file:3] |

- **Purpose:** Stores active and historical deal risk flags. [file:3]
- **Written by:** M-07 event handlers responding to detections, summaries, and stage changes. [file:3]
- **Read by:** Deal boards, risk-detail views, and health recomputation logic. [file:3]

#### Table: `dealcontacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | — | Related deal ID. [file:3] |
| `contactid` | UUID | NOT NULL | — | Related contact ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `role` | TEXT | NULL | — | Role of the contact on the deal. [file:3] |
| `addedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the relation was added. [file:3] |

- **Purpose:** Junction table mapping contacts to deals for board and stakeholder context. [file:3]
- **Written by:** M-07 sync or relationship enrichment flows. [file:3]
- **Read by:** Deal board detail pages and stakeholder views. [file:3]

#### Table: `dealboardconfigs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `configid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for board configuration. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | Owner of the configuration. [file:3] |
| `columnorder` | JSONB | NOT NULL | — | Ordered board columns. [file:3] |
| `visiblefields` | JSONB | NOT NULL | — | Fields visible on the board. [file:3] |
| `defaultfilters` | JSONB | NULL | — | Default filter setup for the board. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores per-user Deals Board configuration and personalization. [file:3]
- **Written by:** M-07 board configuration endpoints. [file:3]
- **Read by:** Frontend board-loading endpoints. [file:3]

#### Table: `dealdrivers`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `driverid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for aggregated driver row. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | Rep or owner being measured. [file:3] |
| `trackerid` | UUID | NOT NULL | — | Tracker contributing to the driver score. [file:3] |
| `detectioncount` | INTEGER | NOT NULL | `0` | Number of detections tied to the tracker. [file:3] |
| `affecteddealcount` | INTEGER | NOT NULL | `0` | Number of deals affected by this driver. [file:3] |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the aggregate was computed. [file:3] |

- **Purpose:** Stores aggregated deal-driver counts per rep for driver analytics and board widgets. [file:3]
- **Written by:** M-07 aggregation jobs or imported downstream driver computations. [file:3]
- **Read by:** Frontend Deal Drivers view and manager analytics experiences. [file:3]

---

### 7.7.3 Indexes

```sql
CREATE INDEX idx_deals_tenant_stage
  ON dealmanagement.deals (tenantid, stage, closedate);

CREATE UNIQUE INDEX idx_deals_tenant_crmdealid
  ON dealmanagement.deals (tenantid, crmdealid);

CREATE INDEX idx_dealstages_tenant_platform
  ON dealmanagement.dealstages (tenantid, crmplatform, stageorder);

CREATE INDEX idx_dealhealthscores_tenant_deal
  ON dealmanagement.dealhealthscores (tenantid, dealid, computedat DESC);

CREATE INDEX idx_dealriskflags_tenant_deal
  ON dealmanagement.dealriskflags (tenantid, dealid, detectedat DESC);

CREATE UNIQUE INDEX idx_dealriskflags_tenant_source
  ON dealmanagement.dealriskflags (tenantid, dealid, sourceid);

CREATE INDEX idx_dealcontacts_tenant_deal
  ON dealmanagement.dealcontacts (tenantid, dealid);

CREATE INDEX idx_dealboardconfigs_tenant_user
  ON dealmanagement.dealboardconfigs (tenantid, userid);

CREATE INDEX idx_dealdrivers_tenant_user
  ON dealmanagement.dealdrivers (tenantid, userid, computedat DESC);
```

The unique index on `(tenantid, dealid, sourceid)` is especially important because the architecture explicitly calls out duplicate-prevention for repeated event deliveries during risk-flag insertion. [file:3]

---

### 7.7.4 RLS Policy

```sql
ALTER TABLE dealmanagement.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealmanagement.deals FORCE ROW LEVEL SECURITY;

CREATE POLICY deals_tenant_isolation ON dealmanagement.deals
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY deals_tenant_insert ON dealmanagement.deals
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY deals_tenant_update ON dealmanagement.deals
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY deals_tenant_delete ON dealmanagement.deals
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `dealstages`, `dealhealthscores`, `dealriskflags`, `dealcontacts`, `dealboardconfigs`, and `dealdrivers`. [file:3]

---

### 7.7.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `tracker.detection.created` | Listens | When a new detection should become a risk flag or affect deal health. [file:3] |
| `call.summary.generated` | Listens | When summaries contribute risks, next steps, and context to health scoring. [file:3] |
| `email.sent` | Listens | When outbound engagement should influence deal activity and health state. [file:3] |
| `deal.stage.changed` | Listens | When stage movement should resolve or recalculate stage-related risks. [file:3] |

M-07 does not emit a named platform event in the current registry excerpt, but it performs important state changes in response to upstream events, especially updating `deals.healthscore`, `deals.healthcategory`, and `deals.lastsignalat`. The module also has an approved cross-module read to fetch deal briefs from M-06 and deal/account/activity context from M-03 APIs. [file:3]

---

### 7.7.6 Special Notes

- The health-score update flow is explicitly defined as a pure recomputation from current database state, which makes it safe to rerun during retries and duplicate event deliveries. [file:3]
- `dealriskflags` must support unresolved versus resolved flags, and `resolvedat` is central to that lifecycle. [file:3]
- `columnorder`, `visiblefields`, and `defaultfilters` are good `JSONB` fields because board configuration is user-specific and flexible. [file:3]
- M-07 is planned as the third extraction target because active rep UI traffic and board reads can become a bottleneck before many other modules. [file:3]
- This module maps closely to Deals Boards and View Deal Drivers in the product map. [file:1]

## 📦 MODULE: M-08 Execution Automation — Schema: `execution`

### 7.8.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-08 [file:3] |
| Module Name | Execution Automation [file:3] |
| Schema Name | `execution` [file:3] |
| Phase | Phase 3 [file:3] |
| Owner | [Developer Name] |
| Description | Stores GTM sales plays, workflow definitions, workflow runs, and competitor alert settings so the platform can turn signals into guided actions and automation. [file:3][file:1] |

M-08 is the action layer that reacts to deal-stage movement and tracker detections by enrolling plays, running workflows, and sending alerts. Unlike AI-heavy modules, its core logic is explicit business-rule evaluation in TypeScript, and the architecture notes that it does not rely on separate AI service calls for its main automation behavior. [file:3]

---

### 7.8.2 Tables in This Schema

#### Table: `salesplays`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `playid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for sales play definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Sales play name. [file:3] |
| `steps` | JSONB | NOT NULL | — | Ordered steps, actions, and due offsets. [file:3] |
| `triggerconditions` | JSONB | NOT NULL | — | Conditions that determine when the play should start. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the play. [file:3] |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the play is active. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores reusable GTM sales play definitions used to guide reps through consistent execution. [file:3]
- **Written by:** M-08 play management endpoints. [file:3]
- **Read by:** M-08 enrollment logic and frontend play configuration screens. [file:3]

#### Table: `playenrollments`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `enrollmentid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for play enrollment. [file:3] |
| `playid` | UUID | NOT NULL | — | Linked sales play. [file:3] |
| `dealid` | UUID | NOT NULL | — | Deal enrolled in the play. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | Assigned rep or owner. [file:3] |
| `currentstep` | INTEGER | NOT NULL | `0` | Current play step. [file:3] |
| `status` | TEXT | NOT NULL | — | Enrollment state such as active, completed, paused, or exited. [file:3] |
| `enrolledat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Enrollment time. [file:3] |

- **Purpose:** Tracks deals that are currently enrolled in sales plays. [file:3]
- **Written by:** M-08 auto-enrollment rules and manual enrollment endpoints. [file:3]
- **Read by:** Frontend enrollment views and step-completion flows. [file:3]

#### Table: `playstepcompletions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `completionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for step completion row. [file:3] |
| `enrollmentid` | UUID | NOT NULL | — | Parent play enrollment ID. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `stepid` | INTEGER | NOT NULL | — | Step number or identifier within the play. [file:3] |
| `completedby` | UUID | NOT NULL | — | User who completed the step. [file:3] |
| `completedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Completion time. [file:3] |
| `notes` | TEXT | NULL | — | Optional notes about completion. [file:3] |

- **Purpose:** Stores completion history for each enrolled play step. [file:3]
- **Written by:** M-08 step-completion endpoints. [file:3]
- **Read by:** Frontend progress tracking and execution analytics views. [file:3]

#### Table: `workflows`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `workflowid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for workflow definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Workflow name. [file:3] |
| `triggerevent` | TEXT | NOT NULL | — | Event that starts the workflow, such as `tracker.detection.created` or `deal.stage.changed`. [file:3] |
| `branches` | JSONB | NOT NULL | — | Conditional branches for evaluation. [file:3] |
| `actions` | JSONB | NOT NULL | — | Actions such as notify, enrollplay, or updatefield. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the workflow. [file:3] |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the workflow is active. [file:3] |

- **Purpose:** Stores branching workflow automation definitions. [file:3]
- **Written by:** M-08 workflow builder and admin endpoints. [file:3]
- **Read by:** M-08 event-driven automation engine. [file:3]

#### Table: `workflowruns`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `runid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for workflow run. [file:3] |
| `workflowid` | UUID | NOT NULL | — | Linked workflow definition. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `triggereventpayload` | JSONB | NOT NULL | — | Stored event payload that triggered the run. [file:3] |
| `status` | TEXT | NOT NULL | — | Run state such as running, completed, or failed. [file:3] |
| `startedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the run started. [file:3] |
| `completedat` | TIMESTAMPTZ | NULL | — | When the run completed. [file:3] |
| `idempotencykey` | TEXT | NOT NULL | — | Prevents duplicate workflow execution for the same trigger. [file:3] |

- **Purpose:** Stores execution history of workflow automation runs. [file:3]
- **Written by:** M-08 workflow engine on event processing. [file:3]
- **Read by:** Frontend workflow-run history and debugging views. [file:3]

#### Table: `competitoralertconfigs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `configid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for alert config. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `competitornames` | JSONB | NOT NULL | — | List of competitor names to monitor. [file:3] |
| `alertchannels` | JSONB | NOT NULL | — | Delivery channels such as Slack or in-app. [file:3] |
| `minconfidence` | NUMERIC | NOT NULL | `0.7` | Minimum confidence required to alert. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the config. [file:3] |

- **Purpose:** Stores tenant-level settings for competitor mention alerts. [file:3]
- **Written by:** M-08 alert configuration endpoints. [file:3]
- **Read by:** M-08 alert-processing workers for confidence gating and routing. [file:3]

#### Table: `competitoralerts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `alertid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for alert instance. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `detectionid` | UUID | NOT NULL | — | Source tracker detection ID. [file:3] |
| `competitorname` | TEXT | NOT NULL | — | Competitor identified in the signal. [file:3] |
| `callid` | UUID | NULL | — | Related call ID. [file:3] |
| `dealid` | UUID | NULL | — | Related deal ID. [file:3] |
| `alertedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the alert was sent. [file:3] |
| `channelsnotified` | JSONB | NOT NULL | — | Channels that received the alert. [file:3] |

- **Purpose:** Stores emitted competitor mention alerts for audit and UI history. [file:3]
- **Written by:** M-08 alert workers after confidence and deduplication checks. [file:3]
- **Read by:** Frontend competitor alert timeline and audit views. [file:3]

---

### 7.8.3 Indexes

```sql
CREATE INDEX idx_salesplays_tenant_active
  ON execution.salesplays (tenantid, isactive, createdat DESC);

CREATE INDEX idx_playenrollments_tenant_deal
  ON execution.playenrollments (tenantid, dealid, status);

CREATE INDEX idx_playenrollments_tenant_user
  ON execution.playenrollments (tenantid, userid, status);

CREATE INDEX idx_playstepcompletions_tenant_enrollment
  ON execution.playstepcompletions (tenantid, enrollmentid, completedat DESC);

CREATE INDEX idx_workflows_tenant_trigger
  ON execution.workflows (tenantid, triggerevent, isactive);

CREATE INDEX idx_workflowruns_tenant_workflow
  ON execution.workflowruns (tenantid, workflowid, startedat DESC);

CREATE UNIQUE INDEX idx_workflowruns_tenant_idempotency
  ON execution.workflowruns (tenantid, idempotencykey);

CREATE INDEX idx_competitoralertconfigs_tenant
  ON execution.competitoralertconfigs (tenantid);

CREATE UNIQUE INDEX idx_competitoralerts_tenant_detection
  ON execution.competitoralerts (tenantid, detectionid);

CREATE INDEX idx_competitoralerts_tenant_alertedat
  ON execution.competitoralerts (tenantid, alertedat DESC);
```

The unique indexes on `workflowruns.idempotencykey` and `competitoralerts.detectionid` are important because the event bus can redeliver the same event, and M-08 is explicitly designed to avoid duplicate workflow runs and duplicate alerts. [file:3]

---

### 7.8.4 RLS Policy

```sql
ALTER TABLE execution.salesplays ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution.salesplays FORCE ROW LEVEL SECURITY;

CREATE POLICY salesplays_tenant_isolation ON execution.salesplays
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY salesplays_tenant_insert ON execution.salesplays
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY salesplays_tenant_update ON execution.salesplays
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY salesplays_tenant_delete ON execution.salesplays
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `playenrollments`, `playstepcompletions`, `workflows`, `workflowruns`, `competitoralertconfigs`, and `competitoralerts`. [file:3]

---

### 7.8.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `tracker.detection.created` | Listens | When a detection may trigger a competitor alert or a rule-based workflow. [file:3] |
| `deal.stage.changed` | Listens | When a stage movement should trigger workflow automation or play enrollment. [file:3] |

M-08 does not emit a named public platform event in the current registry and is described mainly as a consumer-and-actor module. Internally it may create workflow state and alerts, but those actions remain inside its module boundary. [file:3]

---

### 7.8.6 Special Notes

- Competitor alerting includes an explicit confidence gate, and the system should not send alerts when `confidencescore` is below the configured `minconfidence`. [file:3]
- `steps`, `triggerconditions`, `branches`, `actions`, `competitornames`, `alertchannels`, `triggereventpayload`, and `channelsnotified` are all natural `JSONB` fields because they are highly configurable. [file:3]
- M-08 depends on M-03 APIs for deal and account context during play enrollment and workflow condition evaluation. [file:3]
- Slack is the only external dependency explicitly called out for this module, with retry and in-app fallback behavior for alert delivery failures. [file:3]
- This module maps to Orchestrate, Workflow Automation, and Competitor Mention Alerts in the feature map. [file:1]

---

## 📦 MODULE: M-09 Forecasting — Schema: `forecasting`

### 7.9.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-09 [file:3] |
| Module Name | Forecasting [file:3] |
| Schema Name | `forecasting` [file:3] |
| Phase | Phase 3 [file:3] |
| Owner | [Developer Name] |
| Description | Stores forecast periods, user submissions, AI forecast snapshots, pipeline coverage metrics, and historical conversion rates so revenue teams can model and review expected revenue. [file:3][file:1] |

M-09 turns live pipeline state into forward-looking revenue projections and collaborative forecast submissions. It reacts to deal-stage movement from M-03, combines that with historical conversion behavior and current pipeline coverage, and then publishes forecast submissions for downstream performance analysis. [file:3]

---

### 7.9.2 Tables in This Schema

#### Table: `forecastperiods`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `periodid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for forecast period. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Period name such as Q2 FY2026. [file:3] |
| `startdate` | DATE | NOT NULL | — | Period start date. [file:3] |
| `enddate` | DATE | NOT NULL | — | Period end date. [file:3] |
| `revenuetarget` | NUMERIC | NULL | — | Revenue target for the period. [file:3] |
| `islocked` | BOOLEAN | NOT NULL | `FALSE` | Whether submissions are locked. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores forecasting windows and targets. [file:3]
- **Written by:** M-09 forecast configuration flows. [file:3]
- **Read by:** Forecast boards, submission endpoints, and AI forecast jobs. [file:3]

#### Table: `forecastsubmissions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `submissionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for forecast submission. [file:3] |
| `periodid` | UUID | NOT NULL | — | Related forecast period. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User who submitted the forecast. [file:3] |
| `submittedamount` | NUMERIC | NOT NULL | — | Forecast amount submitted by the user. [file:3] |
| `dealids` | JSONB | NULL | — | Deals included in the submission. [file:3] |
| `submittedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time of submission. [file:3] |
| `version` | INTEGER | NOT NULL | `1` | Incremented on resubmission in the same period. [file:3] |

- **Purpose:** Stores collaborative forecast submissions from reps or managers. [file:3]
- **Written by:** M-09 submission endpoints. [file:3]
- **Read by:** Forecast boards, rollups, and downstream performance analysis. [file:3]

#### Table: `aiforecastsnapshots`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `snapshotid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for AI forecast snapshot. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `periodid` | UUID | NOT NULL | — | Related forecast period. [file:3] |
| `predictedamount` | NUMERIC | NOT NULL | — | AI-predicted revenue for the period. [file:3] |
| `confidencerangelow` | NUMERIC | NULL | — | Lower bound of prediction range. [file:3] |
| `confidencerangehigh` | NUMERIC | NULL | — | Upper bound of prediction range. [file:3] |
| `modelinputs` | JSONB | NOT NULL | — | Audit trail of model inputs used. [file:3] |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Snapshot computation time. [file:3] |
| `idempotencykey` | TEXT | NOT NULL | — | Prevents duplicate snapshots for the same trigger. [file:3] |

- **Purpose:** Stores AI-generated forecast outputs for audit and trend comparison. [file:3]
- **Written by:** M-09 forecast computation jobs. [file:3]
- **Read by:** Forecast UI and historical performance analysis. [file:3]

#### Table: `pipelinecoveragemetrics`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `metricid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for coverage metric row. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `periodid` | UUID | NOT NULL | — | Related forecast period. [file:3] |
| `pipelinevalue` | NUMERIC | NOT NULL | — | Total open pipeline value for the period. [file:3] |
| `coverageratio` | NUMERIC | NULL | — | Pipeline-to-target ratio. [file:3] |
| `opendealcount` | INTEGER | NULL | — | Number of open deals in coverage. [file:3] |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time metrics were computed. [file:3] |
| `idempotencykey` | TEXT | NOT NULL | — | Prevents duplicate metric rows per trigger. [file:3] |

- **Purpose:** Stores pipeline coverage calculations used in forecast review. [file:3]
- **Written by:** M-09 forecasting calculations and scheduled recompute jobs. [file:3]
- **Read by:** Forecast boards and manager review views. [file:3]

#### Table: `historicalconversionrates`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `rateid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for conversion-rate row. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `fromstage` | TEXT | NOT NULL | — | Source stage in the conversion path. [file:3] |
| `tostage` | TEXT | NOT NULL | — | Destination stage in the conversion path. [file:3] |
| `conversionrate` | NUMERIC | NOT NULL | — | Calculated conversion rate from 0.0 to 1.0. [file:3] |
| `samplesize` | INTEGER | NULL | — | Number of deals used for the rate. [file:3] |
| `computedfromperiod` | TEXT | NULL | — | Lookback basis such as last 6 months. [file:3] |
| `lastcomputedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last recomputation time. [file:3] |

- **Purpose:** Stores historical stage-conversion rates used in AI and weighted forecasting logic. [file:3]
- **Written by:** M-09 periodic analytics jobs. [file:3]
- **Read by:** AI forecast calculations and forecasting review views. [file:3]

---

### 7.9.3 Indexes

```sql
CREATE INDEX idx_forecastperiods_tenant_dates
  ON forecasting.forecastperiods (tenantid, startdate, enddate);

CREATE INDEX idx_forecastsubmissions_tenant_period_user
  ON forecasting.forecastsubmissions (tenantid, periodid, userid, submittedat DESC);

CREATE INDEX idx_aiforecastsnapshots_tenant_period
  ON forecasting.aiforecastsnapshots (tenantid, periodid, computedat DESC);

CREATE UNIQUE INDEX idx_aiforecastsnapshots_tenant_idempotency
  ON forecasting.aiforecastsnapshots (tenantid, idempotencykey);

CREATE INDEX idx_pipelinecoveragemetrics_tenant_period
  ON forecasting.pipelinecoveragemetrics (tenantid, periodid, computedat DESC);

CREATE UNIQUE INDEX idx_pipelinecoveragemetrics_tenant_idempotency
  ON forecasting.pipelinecoveragemetrics (tenantid, idempotencykey);

CREATE INDEX idx_historicalconversionrates_tenant_path
  ON forecasting.historicalconversionrates (tenantid, fromstage, tostage);

CREATE INDEX idx_historicalconversionrates_tenant_computed
  ON forecasting.historicalconversionrates (tenantid, lastcomputedat DESC);
```

These indexes support forecast period browsing, latest-user-submission lookup, idempotent snapshot generation, and fast conversion-rate retrieval for projection logic. [file:3]

---

### 7.9.4 RLS Policy

```sql
ALTER TABLE forecasting.forecastperiods ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasting.forecastperiods FORCE ROW LEVEL SECURITY;

CREATE POLICY forecastperiods_tenant_isolation ON forecasting.forecastperiods
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY forecastperiods_tenant_insert ON forecasting.forecastperiods
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY forecastperiods_tenant_update ON forecasting.forecastperiods
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY forecastperiods_tenant_delete ON forecasting.forecastperiods
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same RLS pattern to `forecastsubmissions`, `aiforecastsnapshots`, `pipelinecoveragemetrics`, and `historicalconversionrates`. [file:3]

---

### 7.9.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `deal.stage.changed` | Listens | When pipeline movement should update projections and coverage assumptions. [file:3] |
| `forecast.submitted` | Emits | After a user forecast submission is saved. [file:3] |

M-09 is upstream of M-10 Performance Coaching because forecast submission activity and forecast accuracy outcomes are later used in dashboarding and coaching experiences. [file:3]

---

### 7.9.6 Special Notes

- This module is documented as using TypeScript business logic with ClickHouse aggregations rather than AI-service inference for its main projection workflows. [file:3]
- `dealids` and `modelinputs` are natural `JSONB` fields because they store structured but variable sets of input data. [file:3]
- Both `aiforecastsnapshots` and `pipelinecoveragemetrics` require idempotency keys to prevent duplicate rows when the same upstream trigger is retried. [file:3]
- Forecasting maps directly to AI Revenue Predictor and Forecast Boards in the product feature map. [file:1]
- The platform also references `forecastaccuracylog` in analytics/event documentation, so if you want strict completeness later, we may add it as an auxiliary forecasting table for period-close and accuracy tracking. [file:3]

## 📦 MODULE: M-10 Performance Coaching — Schema: `dashboards`

### 7.10.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-10 [file:3] |
| Module Name | Performance Coaching [file:3] |
| Schema Name | `dashboards` [file:3] |
| Phase | Phase 3, last module in the rollout order [file:3] |
| Owner | [Developer Name] |
| Description | Stores dashboard configuration and coaching/trainer data used for revenue dashboards and rep-performance views. [file:3][file:1] |

M-10 is the analytics and coaching surface of the platform. It consumes scored calls from M-04 and forecast submissions from M-09, reads large event volumes through ClickHouse for dashboard speed, and falls back to PostgreSQL aggregates if ClickHouse is unavailable. [file:3]

---

### 7.10.2 Tables in This Schema

The M-10 schema follows the same full table-definition style as M-01 through M-09. The definitions below align with the SAD table set for dashboard configuration, coaching snapshots/recommendations, and trainer scenarios/sessions. [file:3]

#### Table: `dashboardconfigs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `configid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for a saved dashboard configuration. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User owning this dashboard configuration. [file:3] |
| `layout` | JSONB | NOT NULL | — | Layout configuration for dashboard widgets. [file:3] |
| `visiblewidgets` | JSONB | NULL | — | Widget visibility/preferences payload. [file:3] |
| `daterangedefault` | TEXT | NULL | — | Default date range used in the dashboard. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Saves user- or tenant-level dashboard layout and filter preferences for revenue dashboards. [file:3]
- **Written by:** M-10 dashboard configuration endpoints/UI. [file:3]
- **Read by:** Revenue dashboard frontend loads. [file:3]

#### Table: `coachingsnapshots`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `snapshotid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for coaching snapshot. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User the coaching snapshot was computed for. [file:3] |
| `period` | TEXT | NOT NULL | — | Snapshot period key such as weekly or monthly. [file:3] |
| `talkratio` | NUMERIC | NULL | — | Talk ratio KPI for the period. [file:3] |
| `longestmonologue` | NUMERIC | NULL | — | Longest monologue duration KPI. [file:3] |
| `questionrate` | NUMERIC | NULL | — | Question-rate KPI. [file:3] |
| `interactivity` | NUMERIC | NULL | — | Interactivity KPI. [file:3] |
| `toptopics` | JSONB | NULL | — | Top topics payload used for coaching context. [file:3] |
| `callcount` | INTEGER | NULL | — | Number of calls included in the snapshot. [file:3] |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when snapshot was computed. [file:3] |

- **Purpose:** Stores pre-computed coaching aggregates so dashboards and coaching pages load quickly. [file:3]
- **Written by:** M-10 aggregation jobs over ClickHouse or PostgreSQL fallback logic. [file:3]
- **Read by:** Revenue dashboards, coaching views, and performance reporting pages. [file:3]

#### Table: `coachingrecommendations`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `recid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for recommendation row. [file:3] |
| `snapshotid` | UUID | NOT NULL | — | Linked coaching snapshot. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User the recommendation is generated for. [file:3] |
| `recommendationtext` | TEXT | NOT NULL | — | Natural-language coaching recommendation. [file:3] |
| `category` | TEXT | NULL | — | Recommendation category such as questioning or pacing. [file:3] |
| `confidencescore` | NUMERIC | NULL | — | Confidence score for recommendation quality. [file:3] |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when recommendation was generated. [file:3] |

- **Purpose:** Stores generated coaching recommendations tied to coaching snapshots. [file:3]
- **Written by:** M-10 coaching generation workflows. [file:3]
- **Read by:** Coaching UI and rep performance guidance views. [file:3]

#### Table: `trainerscenarios`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `scenarioid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for trainer scenario. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `name` | TEXT | NOT NULL | — | Trainer scenario name. [file:3] |
| `personadescription` | TEXT | NULL | — | Persona details used during simulation. [file:3] |
| `context` | TEXT | NULL | — | Business context for the scenario. [file:3] |
| `difficulty` | TEXT | NULL | — | Difficulty level of scenario. [file:3] |
| `scorecardid` | UUID | NULL | — | Optional scorecard used to evaluate the session. [file:3] |
| `createdby` | UUID | NOT NULL | — | User who created the scenario. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

- **Purpose:** Stores trainer scenario definitions for role-play and practice experiences. [file:3]
- **Written by:** M-10 trainer setup and admin flows. [file:3]
- **Read by:** Trainer session launch flows and coaching setup UI. [file:3]

#### Table: `trainersessions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sessionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for trainer session. [file:3] |
| `scenarioid` | UUID | NOT NULL | — | Scenario used for this session. [file:3] |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key. [file:3] |
| `userid` | UUID | NOT NULL | — | User completing the trainer session. [file:3] |
| `conversation` | JSONB | NOT NULL | — | Conversation transcript payload for the practice session. [file:3] |
| `scorecardresult` | JSONB | NULL | — | Structured scorecard output for the session. [file:3] |
| `status` | TEXT | NOT NULL | — | Session state such as in_progress or completed. [file:3] |
| `completedat` | TIMESTAMPTZ | NULL | — | Completion timestamp if session is finished. [file:3] |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time. [file:3] |

---

### 7.10.3 Indexes

These indexes follow tenant-first access for dashboard loading, coaching snapshots, recommendation retrieval, and trainer workflows: [file:3]

```sql
CREATE INDEX idx_dashboardconfigs_tenant_user
  ON dashboards.dashboardconfigs (tenantid, userid);

CREATE UNIQUE INDEX uq_dashboardconfigs_tenant_user
  ON dashboards.dashboardconfigs (tenantid, userid);

CREATE INDEX idx_coachingsnapshots_tenant_user_period
  ON dashboards.coachingsnapshots (tenantid, userid, period);

CREATE UNIQUE INDEX uq_coachingsnapshots_tenant_user_period
  ON dashboards.coachingsnapshots (tenantid, userid, period);

CREATE INDEX idx_coachingrecommendations_tenant_snapshot
  ON dashboards.coachingrecommendations (tenantid, snapshotid, generatedat DESC);

CREATE INDEX idx_trainerscenarios_tenant_created
  ON dashboards.trainerscenarios (tenantid, createdat DESC);

CREATE INDEX idx_trainersessions_tenant_user_status
  ON dashboards.trainersessions (tenantid, userid, status, createdat DESC);
```

These follow the global migration rule that every new table should include at least one index on `tenantid` plus the primary query key. [file:3]

---

### 7.10.4 RLS Policy

```sql
ALTER TABLE dashboards.dashboardconfigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards.dashboardconfigs FORCE ROW LEVEL SECURITY;

CREATE POLICY dashboardconfigs_tenant_isolation ON dashboards.dashboardconfigs
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY dashboardconfigs_tenant_insert ON dashboards.dashboardconfigs
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY dashboardconfigs_tenant_update ON dashboards.dashboardconfigs
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY dashboardconfigs_tenant_delete ON dashboards.dashboardconfigs
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same tenant-isolation pattern to `coachingsnapshots`, `coachingrecommendations`, `trainerscenarios`, and `trainersessions`, because the architecture states that every tenant-scoped table in every schema must enforce RLS. [file:3]

---

### 7.10.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.scored` | Listens | When new call-review results are available for coaching and score analytics. [file:3] |
| `forecast.submitted` | Listens | When forecast activity should update dashboard and performance views. [file:3] |

M-10 does not emit a named platform event in the event registry excerpt provided. It is primarily a consumer for analytics and coaching experiences. [file:3]

---

### 7.10.6 Special Notes

- M-10 uses ClickHouse for high-volume analytical queries and is the only module explicitly called out as depending on ClickHouse for dashboard performance at scale. [file:3]
- Replicated event streams for M-10 analytics include `callevents`, `activityevents`, `callscoreevents`, `trackerdetectionevents`, and `forecastsubmissionevents`. [file:3]
- If ClickHouse is down, M-10 falls back to PostgreSQL aggregates, so dashboards may become slower but should remain available. [file:3]
- This module maps to Revenue Dashboards and Sales Coaching Insights in the feature map. [file:1]

---

## 📦 MODULE: Platform Core — Schema: `public`

### 7.11.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | Platform Core [file:3] |
| Module Name | CoreModule / Platform Core [file:3][file:1] |
| Schema Name | `public` [file:3] |
| Phase | Cross-cutting foundation used by all modules, not sold as a standalone product module [file:1][file:3] |
| Owner | Platform / Core team |
| Description | Stores identity, tenancy, RBAC, audit, feature flags, integrations, and shared infrastructure services like auth, API gateway, event bus, and CI/CD support. [file:3][file:1] |

Platform Core is the foundation every module depends on. It centralizes multi-tenancy, authentication, authorization, audit logging, feature flags, integration credentials, and shared event or warehouse plumbing so feature modules stay focused on business logic. [file:3]

---

### 7.11.2 Tables in This Schema

#### Table: `tenants`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `tenantid` | UUID PK | Tenant primary key. [file:3] |
| `name` | TEXT | Customer organization name. [file:3] |
| `plan` | TEXT | Subscription plan. [file:3] |
| `status` | TEXT | Tenant status. [file:3] |
| `createdat` | TIMESTAMPTZ | Tenant creation time. [file:3] |
| `complianceconfig` | JSONB or config payload | Tenant-level compliance configuration is referenced in the architecture summary. [file:3] |

- **Purpose:** One row per customer organization using the platform. [file:3]
- **Written by:** Platform Core tenant-management flows. [file:3]
- **Read by:** All modules indirectly through tenant context and admin tooling. [file:3]

#### Table: `users`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `userid` | UUID PK | User primary key. [file:3] |
| `tenantid` | UUID NOT NULL | Tenant isolation key. [file:3] |
| `supabaseuserid` | UUID / external auth ref | Auth-provider user mapping. [file:3] |
| `email` | TEXT | User email. [file:3] |
| `fullname` / `name` | TEXT | Display name. [file:3] |
| `avatarurl` | TEXT | User avatar URL. [file:3] |
| `status` | TEXT | User status. [file:3] |
| `createdat` | TIMESTAMPTZ | Creation timestamp. [file:3] |

- **Purpose:** Stores all platform users across tenants. [file:3]
- **Written by:** Auth and user-provisioning flows in Platform Core. [file:3]
- **Read by:** RBAC, UI personalization, ownership fields, and audit flows. [file:3]

#### Table: `roles`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `roleid` | UUID PK | Role primary key. [file:3] |
| `tenantid` | UUID NOT NULL | Tenant isolation key. [file:3] |
| `name` | TEXT | Role name such as AE, SDR, Manager, Admin, or RevOps. [file:3] |
| `permissions` | JSONB | Permission set for the role. [file:3] |

- **Purpose:** Stores per-tenant role definitions for RBAC. [file:3]
- **Written by:** Platform Core role-management flows. [file:3]
- **Read by:** Guards, interceptors, and frontend authorization logic. [file:3]

#### Table: `userroles`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `userid` | UUID | Linked user. [file:3] |
| `roleid` | UUID | Linked role. [file:3] |
| `tenantid` | UUID NOT NULL | Tenant isolation key. [file:3] |
| `assignedat` | TIMESTAMPTZ | When the role was assigned. [file:3] |

- **Purpose:** Maps users to roles within a tenant. [file:3]
- **Written by:** Platform Core RBAC flows. [file:3]
- **Read by:** Authorization checks across all modules. [file:3]

#### Table: `auditlogs`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `logid` | UUID PK | Audit log primary key. [file:3] |
| `tenantid` | UUID | Tenant scope. [file:3] |
| `userid` | UUID | Acting user. [file:3] |
| `action` | TEXT | Performed action. [file:3] |
| `entitytype` / `resource` | TEXT | Entity or resource type acted on. [file:3] |
| `entityid` | UUID | Specific entity acted on. [file:3] |
| `payload` / `metadata` | JSONB | Extra immutable audit details. [file:3] |
| `createdat` | TIMESTAMPTZ | Log creation time. [file:3] |

- **Purpose:** Immutable audit trail for write operations across the platform. [file:3]
- **Written by:** `AuditService.log` in Platform Core, not directly by feature modules. [file:3]
- **Read by:** Admin audit screens, compliance flows, and investigation workflows. [file:3]

#### Table: `featureflags`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `flagid` | UUID PK | Feature flag primary key. [file:3] |
| `tenantid` | UUID NOT NULL | Tenant isolation key. [file:3] |
| `flagname` | TEXT | Feature flag name. [file:3] |
| `isenabled` | BOOLEAN | Whether the feature is enabled. [file:3] |
| `config` | JSONB | Optional rollout or flag configuration. [file:3] |

- **Purpose:** Stores tenant-level feature flag overrides for gradual rollout. [file:3]
- **Written by:** Platform Core rollout or admin tooling. [file:3]
- **Read by:** All modules during feature gating. [file:3]

#### Table: `integrations`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `integrationid` | UUID PK | Integration primary key. [file:3] |
| `tenantid` | UUID NOT NULL | Tenant isolation key. [file:3] |
| `platform` | TEXT | External platform name, such as CRM, conferencing, or email. [file:3] |
| `credentialsencrypted` | TEXT / encrypted blob | Encrypted external credentials. [file:3] |
| `status` | TEXT | Connection state. [file:3] |
| `lastconnectedat` | TIMESTAMPTZ | Last successful connection timestamp. [file:3] |

- **Purpose:** Stores connected external-system credentials and connection state. [file:3]
- **Written by:** Platform Core integration setup flows. [file:3]
- **Read by:** Modules that need delegated access to CRM, conferencing, and email providers via approved services. [file:3]

---

### 7.11.3 Indexes

```sql
CREATE INDEX idx_users_tenant_email
  ON public.users (tenantid, email);

CREATE INDEX idx_roles_tenant_name
  ON public.roles (tenantid, name);

CREATE INDEX idx_userroles_tenant_user
  ON public.userroles (tenantid, userid);

CREATE INDEX idx_auditlogs_tenant_created
  ON public.auditlogs (tenantid, createdat DESC);

CREATE INDEX idx_featureflags_tenant_flag
  ON public.featureflags (tenantid, flagname);

CREATE INDEX idx_integrations_tenant_platform
  ON public.integrations (tenantid, platform);
```

These indexes follow the documented platform rule that new tables should have a tenant-based access path plus the main lookup key. [file:3]

---

### 7.11.4 RLS Policy

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON public.users
  FOR SELECT
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY users_tenant_insert ON public.users
  FOR INSERT
  WITH CHECK (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY users_tenant_update ON public.users
  FOR UPDATE
  USING (tenantid = current_setting('app.tenantid')::UUID);

CREATE POLICY users_tenant_delete ON public.users
  FOR DELETE
  USING (tenantid = current_setting('app.tenantid')::UUID);
```

> Apply the same policy shape to `roles`, `userroles`, `featureflags`, and `integrations`. `auditlogs` may remain platform-controlled with stricter insert rules because modules are explicitly forbidden from writing to it directly. [file:3]

---

### 7.11.5 Core Rules

- No module may import a CoreModule table directly just to bypass boundaries; modules receive `tenantid` through interceptors and shared auth context. [file:3]
- No feature module may write directly to `auditlogs`; they must use `AuditService.log`. [file:3]
- No module may implement custom auth logic because JWT auth and guards belong to Platform Core. [file:3]
- The public schema is read-only for feature modules, and no module other than Platform Core may write to the public schema. [file:3]
- Direct cross-schema SQL joins are not allowed in application code, except for a documented M-03 view-based exception approved by the Tech Lead. [file:3]

---

### 7.11.6 Shared Infrastructure Notes

- Platform Core also contains the DataWarehouse sub-module that writes selected event streams into ClickHouse using BullMQ workers and the `clickhouse-client` library. Those writes are fire-and-forget and never block primary business flows. [file:3]
- Shared platform capabilities called out in the feature map include Auth, API Gateway, Event Bus, and CI/CD. [file:1]
- The system-wide multi-tenancy rule requires `tenantid UUID NOT NULL` in tenant-scoped tables, usually as the second column after the primary key. [file:3]
- Prisma middleware sets the tenant context for every query, and PostgreSQL RLS enforces the same isolation at the database layer. [file:3]


## PART 8 — ClickHouse Analytics Tables (M-10 only)

### 8.1 What Goes Into ClickHouse

| ClickHouse Table | Source (PostgreSQL) | Replication Method | Retention |
|---|---|---|---|
| `callevents` | `transcription.calls` [file:3] | CDC via Debezium -> Kafka -> ClickHouse [file:3] | 24 months [file:3] |
| `activityevents` | `revenuegraph.activities` [file:3] | CDC [file:3] | 24 months [file:3] |
| `callscoreevents` | `conversation.callreviews` [file:3] | CDC [file:3] | 24 months [file:3] |
| `trackerdetectionevents` | `conversation.trackerdetections` [file:3] | CDC [file:3] | 24 months [file:3] |
| `forecastsubmissionevents` | `forecasting.forecastsubmissions` [file:3] | CDC [file:3] | 24 months [file:3] |

For M-10, ClickHouse is used only for analytics-heavy dashboard and coaching queries over large time-series datasets, not as the source of truth. PostgreSQL remains the source of truth, while ClickHouse acts as the fast analytical read store for Revenue Dashboards and Sales Coaching Insights. [file:3]

### 8.2 Event-to-ClickHouse Write Shape

The architecture also documents the row shape written into these ClickHouse tables:

- `callevents`: `tenantid, callid, userid, duration, sourceplatform, participantcount, occurredat` [file:3]
- `activityevents`: `tenantid, activityid, dealid, contactid, activitytype, channel, occurredat` [file:3]
- `callscoreevents`: `tenantid, userid, scorecardid, totalscore, talkratio, questionrate, scoredat` [file:3]
- `trackerdetectionevents`: `tenantid, trackerid, callid, dealid, trackertype, confidencescore, detectedat` [file:3]
- `forecastsubmissionevents`: `tenantid, submissionid, periodid, userid, commitamount, submittedat` [file:3]

These writes are handled by a dedicated BullMQ worker inside the Platform Core `DataWarehouseModule`, which subscribes to the relevant events, transforms the payload, and inserts rows using the `clickhouse-client` Node.js library. [file:3]

### 8.3 How Data Reaches ClickHouse

The documented trigger path is event-driven:

- `call.transcription.completed` -> write to `callevents` [file:3]
- `activity.logged` -> write to `activityevents` [file:3]
- `call.scored` -> write to `callscoreevents` [file:3]
- `tracker.detection.created` -> write to `trackerdetectionevents` [file:3]
- `forecast.submitted` -> write to `forecastsubmissionevents` [file:3]

The worker behavior is explicitly fire-and-forget, meaning ClickHouse insertion failure must not break the primary transactional workflow. Instead, the system logs the failure to Sentry and continues, because dashboard freshness is less critical than core product correctness. [file:3]

### 8.4 Example M-10 Query Pattern

The architecture gives this M-10 ClickHouse query pattern for rep-level score analytics:

```sql
SELECT
  userid,
  avg(talkratio) AS avgtalkratio,
  count(*) AS callcount,
  max(scoredat) AS lastscoredat
FROM callscoreevents
WHERE tenantid = {tenantId:UUID}
  AND scoredat >= now() - INTERVAL 90 DAY
GROUP BY userid
ORDER BY avgtalkratio DESC;
```

This is the exact kind of query M-10 runs in ClickHouse because PostgreSQL becomes inefficient for repeated large-window aggregations across millions of rows. Query results are also cached in Redis for 5 minutes to reduce repeated dashboard load pressure. [file:3]

### 8.5 Fallback Rule

If ClickHouse is down, M-10 falls back to PostgreSQL aggregates and logs a Sentry alert. Dashboard data may become slower or temporarily stale, but dashboards should not become unavailable. [file:3]


## PART 9 — pgvector Embedding Tables (M-06 only)

### 9.1 Vector Tables

For M-06, the architecture-level canonical table is `summaries.semanticembeddings`, which stores embeddings used for semantic search and RAG retrieval. Its documented key columns are `embeddingid`, `tenantid`, `entitytype`, `entityid`, `embedding VECTOR(1536)`, `modelversion`, and `createdat`. [file:3]

The pgvector note explicitly states:

- Dimension: `1536` [file:3]
- Model alignment: OpenAI `text-embedding-3-small` [file:3]
- Index type: `IVFFlat` [file:3]
- Distance operator: cosine distance [file:3]

A practical schema form for documentation is:

```sql
CREATE TABLE summaries.semanticembeddings (
  embeddingid UUID PRIMARY KEY,
  tenantid UUID NOT NULL,
  entitytype TEXT NOT NULL,
  entityid UUID NOT NULL,
  chunkindex INTEGER,
  chunktext TEXT,
  embedding VECTOR(1536),
  modelversion TEXT,
  createdat TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_semanticembeddings_ivfflat
  ON summaries.semanticembeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

The document also shows older implementation examples using `transcriptembeddings` and `emailembeddings`, but the consolidated schema summary makes `semanticembeddings` the canonical M-06 table for transcripts, summaries, and emails. [file:3]

### 9.2 Embedding Generation Flow

Embeddings are created when new searchable text content is produced and must become available for semantic retrieval. The architecture explicitly documents one guaranteed trigger: `call.transcription.completed`, after which M-06 chunks transcript text and sends it to the AI Services Layer `POST /v1/embed`, then stores the returned vectors. [file:3]

The document also states that outbound email content is embedded after `email.sent`, and that M-05 sends email body text to `POST /v1/embed` for storage. In the consolidated M-06 schema, those embeddings are represented under `semanticembeddings` with `entitytype` values such as transcript chunk, summary, brief, or email. [file:3]

So the clean flow is:

1. A source event occurs, most clearly `call.transcription.completed`. [file:3]
2. M-06 fetches transcript text and chunks it into embedding-sized segments. [file:3]
3. M-06 calls AI Services Layer `POST /v1/embed` with the text chunks. [file:3]
4. The returned vectors are stored in `semanticembeddings`. [file:3]
5. Later, Ask Anything and deep-research flows query this table for semantic retrieval. [file:3]

The architecture also adds a re-embedding rule: when a summary or brief is regenerated with a higher version, the old embedding row is deleted and a new one is inserted so RAG does not use stale content. [file:3]

### 9.3 Semantic Search Query Pattern

The standard similarity pattern in the architecture is cosine-based nearest-neighbor search over tenant-scoped embeddings. A simple form shown in the document is:

```sql
SELECT
  chunktext,
  callid,
  1 - (embedding <=> :query_embedding) AS similarity
FROM insights.transcriptembeddings
WHERE tenantid = :tenant_id
ORDER BY embedding <=> :query_embedding
LIMIT 20;
```

Its meaning is simple:

- `embedding <=> :query_embedding` computes cosine distance between stored vectors and the query vector. [file:3]
- Lower distance means more semantically similar results, so ordering ascending returns the best matches first. [file:3]
- `1 - distance` is used to display a human-friendly similarity score. [file:3]
- `tenantid = :tenant_id` is mandatory for multi-tenant isolation. [file:3]

The more advanced RAG query pattern in the architecture uses `semanticembeddings` plus business filters, such as limiting to transcript chunks from the last 3 calls for a target account before ranking by vector similarity. That pattern is what M-06 uses for grounded Ask Anything responses. [file:3]

### 9.4 Recommended Canonical SQL for Your Document

Because your latest schema uses `semanticembeddings`, this is the cleanest standard SQL to paste in the next section:

```sql
SELECT
  se.chunktext,
  se.entitytype,
  se.entityid,
  se.chunkindex,
  1 - (se.embedding <=> :query_embedding) AS similarity
FROM summaries.semanticembeddings se
WHERE se.tenantid = :tenant_id
  AND se.entitytype = 'transcriptchunk'
ORDER BY se.embedding <=> :query_embedding
LIMIT 20;
```

Explanation:
- Searches only within the current tenant. [file:3]
- Restricts to transcript chunks, though the same table can also store summaries, deal briefs, account briefs, and emails. [file:3]
- Uses cosine distance through pgvector for semantic ranking. [file:3]
- Returns the top 20 most relevant chunks to feed into RAG or semantic search UI. [file:3]


## PART 10 — Migration Rules & Checklist

### 10.1 Migration Naming Convention

Use this naming format for every migration file: [file:3]

```text
YYYYMMDDHHMMSS_module_description.sql
```

Example: [file:3]

```text
20260416143000_ingestion_add_confidence_score_to_calls.sql
```

The architecture document shows the same convention without spaces and explains that the timestamp must come first, followed by the module name and a short action-oriented description. This keeps migrations sortable, traceable, and easy to review in deployment order. [file:3]

### 10.2 Migration Rules

All database migrations must use Prisma Migrate, and the following rules are mandatory across the platform. [file:3]

1. **One migration per module per PR.** A migration file must touch only the schema owned by the module being changed, never another module’s schema. [file:3]  
2. **Never drop a column in production.** If a column is no longer used, mark it with a `-- DEPRECATED: reason, date` comment and schedule actual removal for the next major version. The architecture warns that dropping columns without a deprecation period can break deployed services. [file:3]  
3. **All new tables must include the platform minimums:** `UUID PRIMARY KEY`, `tenantid UUID NOT NULL` as the second column, `createdat TIMESTAMPTZ DEFAULT NOW()`, and at least one index on `(tenantid, primary_lookup_column)`. [file:3]  
4. **Follow the naming convention exactly.** Migration filenames must use the `YYYYMMDDHHMMSS_module_description.sql` pattern so they remain consistent and sortable. [file:3]  
5. **Tech Lead review is mandatory.** No migration should merge to main or run in production without explicit Tech Lead sign-off. [file:3]  
6. **RLS must remain enforced.** The architecture states that RLS is defined on every table in every schema, and any migration that disables RLS or changes forced RLS behavior requires Tech Lead review with written justification. [file:3]  
7. **Do not violate schema ownership.** If your change needs data from another module, use that module’s API or event contract instead of editing its schema through your migration. [file:3]  

### 10.3 Pre-Merge Checklist (for Freshers)

Use this checklist before raising a PR for any schema or migration change. It is aligned directly with the architecture rules and written in a simpler review-friendly form. [file:3]

```text
[ ] Schema name matches module ownership
[ ] Migration touches only this module’s schema
[ ] tenantid UUID NOT NULL is the second column
[ ] UUID PRIMARY KEY is used, not SERIAL or auto-increment integer
[ ] createdat TIMESTAMPTZ DEFAULT NOW() is present
[ ] Index on (tenantid, primary_lookup_column) is added
[ ] RLS is ENABLED on the table
[ ] FORCE ROW LEVEL SECURITY is applied where required by the module pattern
[ ] No column is dropped directly; unused columns are marked -- DEPRECATED: reason, date
[ ] Migration filename follows YYYYMMDDHHMMSS_module_description.sql
[ ] No cross-schema write is introduced
[ ] Tech Lead reviewed and approved
```

### 10.4 Simple Fresher Notes

If you are new, remember these four “must-never-miss” checks before submitting a migration: tenant isolation, correct schema ownership, RLS, and Tech Lead review. In simple words, your migration should only change your module’s tables, every tenant row must stay isolated, and nothing should reach production unless the Tech Lead signs off. [file:3]


## PART 11 — Glossary

| Term | Meaning |
|---|---|
| **Schema** | A namespace inside PostgreSQL that groups related tables under one module boundary, such as `transcription`, `conversation`, `summaries`, or `forecasting`. The architecture uses schema ownership to enforce module boundaries. [file:3] |
| **RLS** | Row Level Security. A PostgreSQL database-level rule system that filters rows by `tenantid` before data is returned, even if application code forgets to add the tenant filter. In this platform, RLS is enabled on every table in every schema. [file:3] |
| **tenantid** | The organisation’s unique identifier. Every tenant-scoped row belongs to exactly one tenant, and `tenantid UUID NOT NULL` is mandatory on almost every table as the second column after the primary key. [file:3] |
| **UUID** | Universally Unique Identifier. A random, hard-to-guess ID used as the primary key instead of auto-increment integers, because the architecture standard requires `UUID PRIMARY KEY` for all new tables. [file:3] |
| **CDC** | Change Data Capture. A replication pattern that streams database changes from PostgreSQL into analytical systems like ClickHouse, usually through Debezium and Kafka in this architecture. [file:3] |
| **pgvector** | A PostgreSQL extension used to store and search embedding vectors for semantic search and RAG. In this platform it stores vectors like `VECTOR(1536)` and supports cosine-distance search with IVFFlat indexing. [file:3] |
| **Migration** | A versioned database change file managed through Prisma Migrate that creates, alters, or indexes tables in a controlled and reviewable way. [file:3] |
| **ClickHouse** | A columnar analytics database used only for M-10 dashboard and coaching queries where large aggregations would be too slow in PostgreSQL at scale. PostgreSQL remains the source of truth. [file:3] |
| **BullMQ** | The internal event bus and job queue system built on Redis. Modules use it for asynchronous events like `call.transcription.completed`, `tracker.detection.created`, and `forecast.submitted`. [file:3] |
| **Debezium** | A CDC tool that captures PostgreSQL row changes and helps stream them into Kafka and then ClickHouse for analytics replication. [file:3] |
| **Kafka** | The event-stream transport layer used in the CDC pipeline between PostgreSQL change capture and ClickHouse ingestion. [file:3] |
| **Tech Lead sign-off** | A mandatory review and approval step required before migrations, architecture changes, or platform-level document changes can be merged or promoted to production. [file:3] |
| **Module ownership** | The rule that each module owns only its own schema and may write only to that schema. If another module needs data, it must use that module’s API or event contract instead of direct table writes. [file:3] |
| **Cross-schema read** | Reading data owned by another module. This is tightly controlled and normally allowed only through APIs or documented exceptions, never through casual direct joins in application code. [file:3] |
| **IVFFlat** | The vector index type used by pgvector in this architecture for faster approximate nearest-neighbor search over embeddings. [file:3] |
| **Cosine distance** | The similarity operator used to compare embeddings in semantic search queries. Lower cosine distance means two vectors are more semantically similar. [file:3] |
| **Prisma Middleware** | Application-layer query interception that automatically adds `tenantid` filtering to database operations before they reach PostgreSQL. It works together with RLS as defense in depth. [file:3] |
| **Tenant isolation** | The platform rule that one customer’s data must never be visible to another customer. Here it is enforced by JWT tenant claims, Prisma middleware, and PostgreSQL RLS together. [file:3] |
| **Source of truth** | The system that holds the authoritative version of data. In this architecture, PostgreSQL is the source of truth, while ClickHouse and Meilisearch are optimized read stores. [file:3] |
| **Fire-and-forget write** | A non-blocking secondary write where failure should not break the main workflow. ClickHouse analytics writes follow this pattern, and failures are logged to Sentry instead. [file:3] |



