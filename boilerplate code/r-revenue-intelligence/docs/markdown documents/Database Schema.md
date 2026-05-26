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

This document defines the database design standards for R-Revenue Intelligence, including the database technologies used, schema ownership boundaries, multi-tenancy enforcement rules, table design expectations, indexing standards, and migration rules. It must be read before creating any new table, writing any migration, or querying data owned by another module, because schema ownership and cross-schema access rules are enforced during code review and violations should not be merged. 

### 2.2 Who Should Read This

This document should be read by all backend developers, database designers, tech leads, interns working on schema changes, and any engineer creating tables, indexes, migrations, or module-level data contracts. It is also important for reviewers because database ownership, tenant isolation, and migration quality are review gates, not optional guidelines. 

### 2.3 Golden Rules (Non-Negotiable)

- Every table must include `tenantid UUID NOT NULL` as the second column after the primary key unless it is an approved exception such as a pure join table with tenant enforcement through foreign keys or a platform-scoped internal table. 
- Every new table must use a `UUID PRIMARY KEY`; serial integers are not allowed. 
- Every new table must include `createdat TIMESTAMPTZ DEFAULT NOW()`. 
- Every table must have at least one index on `(tenantid, primary_lookup_column)` to support efficient tenant-scoped queries. 
- Row Level Security must be enabled on every tenant-scoped table so PostgreSQL enforces tenant isolation at the storage layer. 
- A module may write only to its own schema; writing into another module’s schema is not permitted. 
- Direct cross-schema reads in application code are not allowed unless they are explicitly documented as approved read contracts. 
- Never drop a column directly in production; mark it as deprecated first and schedule removal in a later major version. 
- Each migration file must touch only the schema owned by the module being changed. 
- No migration may be merged or run in production without Tech Lead review and explicit sign-off. 

---

## PART 3 — Database Technology Stack

### 3.1 Stores at a Glance

| Store | Technology | Version | What It Stores |
|-------|------------|---------|----------------|
| Primary DB | Supabase PostgreSQL | PostgreSQL 16 | All core platform data such as users, calls, transcripts, deals, accounts, forecasts, emails, and coaching data.  |
| Analytics | ClickHouse | 24.x latest stable | High-volume time-series and aggregation-heavy analytical data for Revenue Dashboards and Coaching Insights.  |
| Vector | pgvector | PostgreSQL 16 extension | Embeddings for semantic search, Ask Anything RAG, and AI Deep Researcher workflows.  |
| Search | Meilisearch | Latest stable | Full-text search across transcripts, emails, topic tags, and conversation library content.  |
| Cache/Queue | Redis | 7.x | Session data, rate limits, and BullMQ queue backing store for asynchronous processing.  |

### 3.2 Source of Truth Rule

Supabase PostgreSQL is the source of truth for all primary platform data, while ClickHouse, pgvector, and Meilisearch receive replicated or derived data from PostgreSQL for analytics, vector retrieval, and search use cases. Redis is not a source of truth and is treated only as a temporary operational store, so loss of Redis data must not break core platform correctness. 



## PART 4 — Multi-Tenancy & Security

### 4.1 How Tenant Isolation Works

R-Revenue Intelligence uses a shared database model, but each tenant’s data is isolated using three protection layers working together: the application layer adds tenant scope automatically through Prisma middleware, PostgreSQL enforces Row Level Security so only rows for the active tenant can be read or changed, and Supabase JWT tokens carry a signed `tenantid` claim that identifies which tenant the user belongs to. This means developers do not need to manually add tenant filters in every query, and even if application logic is bypassed accidentally, the database still blocks cross-tenant access as a defense-in-depth safeguard. 

### 4.2 Prisma Middleware (Layer 1)

The application layer uses a global Prisma middleware to automatically scope all database operations to the current tenant stored in request context. If a request does not have a valid tenant context, the middleware fails immediately instead of allowing an unsafe query to reach the database. 

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

This middleware automatically adds the current `tenantid` to query filters and inserts, so each request stays inside its own tenant boundary. It also hard-fails when tenant context is missing, which prevents silent cross-tenant data leaks caused by developer mistakes or missing guards. 

### 4.3 Row Level Security — RLS (Layer 2)

PostgreSQL Row Level Security is the database-level enforcement layer, and it applies even if application code is bypassed through raw SQL or an accidental unscoped query. The application sets `app.tenantid` at the start of the database session, and every RLS policy uses that value to allow access only to rows belonging to the active tenant. 

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

**Important:** `FORCE ROW LEVEL SECURITY` is mandatory because without it, privileged connections can bypass RLS entirely. With `FORCE`, the protection still applies even to the table owner or service-level connections, making it the critical safeguard for tenant isolation. 

### 4.4 JWT Claim (Layer 3)

The `tenantid` is embedded as a custom claim inside the Supabase-issued JWT at sign-in or token refresh time, and the NestJS JWT guard reads that verified claim before any business logic runs. Because the token is signed by Supabase using RS256, a user cannot spoof another tenant’s identity by editing the token payload; if the signature is invalid or the `tenantid` claim is missing, the request is rejected before it reaches the application or database. 

### 4.5 Mandatory Column Checklist

Every new table must include the following minimum structure and security requirements. These rules are enforced in code review, and migrations that break them should not be approved. 

- [ ] `<entity>id UUID PRIMARY KEY` 
- [ ] `tenantid UUID NOT NULL` as the second column, always, unless it is an approved exception such as a pure join table with tenant enforcement through foreign keys or a platform-scoped internal table 
- [ ] `createdat TIMESTAMPTZ DEFAULT NOW()` 
- [ ] Index on `(tenantid, <primary_lookup_column>)` for efficient tenant-scoped queries 
- [ ] `ENABLE ROW LEVEL SECURITY` applied on the table 
- [ ] `FORCE ROW LEVEL SECURITY` applied on the table 



## PART 5 — Schema Ownership Map

### 5.1 Schema Registry

R-Revenue Intelligence follows a schema-per-module design in PostgreSQL, where each module owns its own schema and is responsible for writing only to the tables inside that schema. This creates clear ownership boundaries, reduces accidental coupling, and allows a module to be extracted later with minimal redesign because the boundary already exists in both code and data layout. 

| Schema Name | Owner Module | Key Tables |
|-------------|--------------|------------|
| `platform` | Platform Core | `tenants`, `users`, `roles`, `auditlogs`, `featureflags`, `integrations`  |
| `ingestion` | M-01 Data Ingestion | `calls`, `audiofiles`, `transcripts`, `speakersegments`, `transcriptcorrections`, `ingestionsources`, `crmextractedfields`, `semanticembeddings`  |
| `engagement` | M-02 Sales Engagement | `emaildrafts`, `emailsends`, `emailtemplates`, `emailflows`, `flowenrollments`, `tasks`  |
| `revenuegraph` | M-03 Revenue Graph | `accounts`, `contacts`, `accountcontacts`, `deals`, `dealcontacts`, `activities`, `crmsynclogs`, `datacloudexports`  |
| `conversationintelligence` | M-04 Conversation Intelligence | `scorecards`, `callreviews`, `topics`, `topictags`, `themes`, `themeanalyses`, `vocabularycorrections`, `translationpreferences`  |
| `smarttracking` | M-05 Smart Tracking | `trackers`, `trackerdetections`, `searchindexsynclog`, `dealdriversnapshots`  |
| `insights` | M-06 Insight Generation | `callsummaries`, `dealbriefs`, `accountbriefs`, `researchreports`, `querysessions`, `querymessages`, `summaryevidencelinks`, `summaryhistory`  |
| `dealmanagement` | M-07 Deal & Account Mgmt | `deals`, `dealstages`, `dealhealthscores`, `dealriskflags`, `dealcontacts`, `dealboardconfigs`, `dealdrivers`  |
| `execution` | M-08 Execution Automation | `salesplays`, `playenrollments`, `playstepcompletions`, `workflows`, `workflowruns`, `competitoralertconfigs`, `competitoralerts`  |
| `forecasting` | M-09 Forecasting | `forecastperiods`, `forecastsubmissions`, `aiforecastsnapshots`, `pipelinecoveragemetrics`, `historicalconversionrates`, `forecastaccuracylog`  |
| `dashboards` | M-10 Performance & Coaching | `dashboardconfigs`, `coachingsnapshots`, `coachingrecommendations`, `trainerscenarios`, `trainersessions`  |

### 5.2 Schema Write Rules

A module may write only to its own schema, and cross-schema writes are not permitted under the architecture rules of the platform. If a module needs to affect data owned by another module, it must do so through that module’s API or event contract instead of issuing direct writes, and any PR that violates schema ownership should be rejected in review. 

Additional write rules to enforce during review:

- A migration file must touch only the schema owned by the module being changed. 
- A module must never create, update, or delete rows in another module’s tables directly. 
- Platform Core is the only owner allowed to write to the `platform` schema; all other modules treat it as read-only. 

---

## PART 6 — Cross-Schema Read Contracts

### 6.1 Permitted Cross-Schema Reads

Cross-schema reads are tightly controlled in R-Revenue Intelligence, and modules are not allowed to query another module’s tables directly from application code unless that access pattern is explicitly documented as an approved contract. The standard rule is simple: if data belongs to another module, call that module’s API or consume its event instead of reading its tables directly. 

| Reader Module | Data It Needs | How To Access |
|---------------|---------------|---------------|
| M-02 Sales Engagement | Contact and deal context for email personalization | `GET /api/v1/revenue-graph/deals/:id` via M-03 API  |
| M-04 Conversation Intelligence | Deal stage and account segment for scorecard context | `GET /api/v1/revenue-graph/deals/:id` via M-03 API  |
| M-05 Smart Tracking | Deal and account context to enrich detections | `GET /api/v1/revenue-graph/deals/:id` via M-03 API  |
| M-06 Insight Generation | Deal, account, and contact context for summaries and briefs | `GET /api/v1/revenue-graph/deals/:id` via M-03 API  |
| M-06 Insight Generation | Tracker detections for deal brief generation | `GET /api/v1/smart-tracking/trackers/:id/detections` via M-05 API  |
| M-07 Deal Management | Accounts, contacts, deals, and activities | `GET /api/v1/revenue-graph/deals/:id` via M-03 API  |
| M-07 Deal Management | Deal briefs and account briefs | `GET /api/v1/insights/deals/:id/brief` via M-06 API  |
| M-08 Execution Automation | Deal and account context for play enrollment | `GET /api/v1/revenue-graph/deals/:id` via M-03 API  |
| M-10 Performance Coaching | Call scores and topic distributions | M-04 API  |
| M-10 Performance Coaching | Deal outcomes and win-rate context | M-03 API  |
| M-10 Performance Coaching | Historical forecast submissions | M-09 API  |

### 6.2 Cross-Schema Read Rule

If a required read is not listed in the approved contracts table, it must be treated as disallowed until a Tech Lead reviews and documents the access pattern. Direct Prisma queries or raw SQL joins across schemas are architecture violations, and the only named exception in the SAD is a future Phase 3 PostgreSQL view for M-07 reading M-03 `revenuegraph` data for performance, which still requires explicit Tech Lead approval. 

### 6.3 Review Checklist for Cross-Module Reads

Use this checklist during design and PR review to keep the boundary clean:

- [ ] Is the data owned by another module? 
- [ ] If yes, is there an approved API or event contract for it? 
- [ ] Is the read path listed in the cross-schema read contracts table? 
- [ ] Is the code avoiding direct Prisma or raw SQL cross-schema joins? 
- [ ] If this is a new dependency, has it been reviewed and documented before implementation? 

**Important rule:** If it is not documented here, you cannot read it directly. Call the owning module’s API instead. 




## PART 7 — Module Schema Sections

## 📦 MODULE: M-01 Data Ingestion — Schema: `ingestion`

### 7.1.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-01  |
| Module Name | Data Ingestion  |
| Schema Name | `ingestion`  |
| Phase | Phase 1  |
| Owner | [Developer Name] |
| Description | Stores everything required to capture customer interactions, process recordings, generate transcripts, and extract structured CRM-ready data from conversations.  |

M-01 is the foundation module of the platform because every major downstream capability depends on a completed transcript or extracted call data being produced here first. It is already marked as deployed in the platform module roadmap and is the starting point for the full revenue intelligence lifecycle. 

---

### 7.1.2 Tables in This Schema

#### Table: `calls`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `callid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for each captured call record.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `sourceplatform` | TEXT | NOT NULL | — | Source system such as Zoom, Teams, Meet, or dialer.  |
| `recordingurl` | TEXT | NULL | — | Original source recording URL.  |
| `storageurl` | TEXT | NULL | — | Internal storage location after upload.  |
| `duration` | INTEGER | NULL | — | Call duration in seconds.  |
| `participantlist` | JSONB | NULL | — | Participants captured from the source event.  |
| `calendareventid` | UUID | NULL | — | Optional linked calendar event identifier.  |
| `status` | TEXT | NOT NULL | — | Processing status such as pending, audio stored, completed, failed.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Master record for every captured customer call in the system. 
- **Written by:** M-01 Data Ingestion webhook handlers and transcription pipeline. 
- **Read by:** M-01 internal services, M-03 via `call.transcription.completed`, and ClickHouse replication for analytics events. 

#### Table: `audiofiles`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `fileid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for audio file metadata row.  |
| `callid` | UUID | NOT NULL | — | Related call identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `storagebucket` | TEXT | NOT NULL | — | Bucket name where the file is stored.  |
| `storagepath` | TEXT | NOT NULL | — | Path to the stored audio file.  |
| `filesizebytes` | BIGINT | NULL | — | File size in bytes.  |
| `format` | TEXT | NULL | — | Audio format such as mp3, wav, or m4a.  |
| `uploadedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when the file was uploaded.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Standard audit creation timestamp used across all tenant tables.  |

- **Purpose:** Stores metadata for raw audio files uploaded to platform storage. 
- **Written by:** M-01 storage ingestion flow after call capture. 
- **Read by:** M-01 transcription service and internal retry/reprocessing flows. 

#### Table: `transcripts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `transcriptid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for transcript record.  |
| `callid` | UUID | NOT NULL | — | Parent call identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `rawtext` | TEXT | NOT NULL | — | Full transcript text for the call.  |
| `languagedetected` | TEXT | NULL | — | Detected transcript language.  |
| `wordcount` | INTEGER | NULL | — | Total transcript word count.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence score returned by transcription process.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores the full raw transcript generated for each processed call. 
- **Written by:** M-01 transcription callback flow after ASR and diarization complete. 
- **Read by:** M-04 Conversation Intelligence, M-05 Smart Tracking, M-06 Insight Generation, and search/indexing flows triggered after `call.transcription.completed`. 

#### Table: `speakersegments`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `segmentid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for each speaker segment.  |
| `transcriptid` | UUID | NOT NULL | — | Parent transcript identifier.  |
| `callid` | UUID | NOT NULL | — | Parent call identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `speakerlabel` | TEXT | NOT NULL | — | Speaker label such as Speaker 1 or Speaker 2.  |
| `text` | TEXT | NOT NULL | — | Transcript segment text.  |
| `starttime` | NUMERIC | NOT NULL | — | Segment start timestamp in the call.  |
| `endtime` | NUMERIC | NOT NULL | — | Segment end timestamp in the call.  |

- **Purpose:** Stores speaker-labeled transcript chunks with timestamps for playback, analysis, and downstream AI processing. 
- **Written by:** M-01 transcription service output merge step. 
- **Read by:** M-04 scoring and topic tagging, M-06 summaries, and any transcript playback or citation-linked features. 

#### Table: `transcriptcorrections`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `correctionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for correction log entry.  |
| `transcriptid` | UUID | NOT NULL | — | Parent transcript identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `originalterm` | TEXT | NOT NULL | — | Original incorrectly transcribed term.  |
| `correctedterm` | TEXT | NOT NULL | — | Corrected term applied by the system.  |
| `appliedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when the correction was applied.  |

- **Purpose:** Logs business vocabulary corrections applied to transcripts for auditability and quality improvement. 
- **Written by:** M-01 vocabulary correction step during transcript processing. 
- **Read by:** M-01 internal QA/reprocessing flows and audit/debug use cases. 

#### Table: `ingestionsources`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sourceid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for connected ingestion source.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `platform` | TEXT | NOT NULL | — | Connected source type such as Zoom or Teams.  |
| `webhooksecret` | TEXT | NULL | — | Secret used to validate source webhooks.  |
| `status` | TEXT | NOT NULL | — | Current connection status.  |
| `lastwebhookat` | TIMESTAMPTZ | NULL | — | Last successful webhook received time.  |

- **Purpose:** Stores connected conferencing or capture sources and their webhook configuration. 
- **Written by:** M-01 connector setup and admin configuration flows. 
- **Read by:** M-01 webhook validation and source health monitoring flows. 

#### Table: `crmextractedfields`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `extractionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for extracted CRM field row.  |
| `callid` | UUID | NOT NULL | — | Parent call identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `fieldname` | TEXT | NOT NULL | — | Name of the CRM field extracted from conversation.  |
| `fieldvalue` | TEXT | NULL | — | Extracted field value.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence for the extracted value.  |
| `pushedtocrm` | BOOLEAN | NOT NULL | `FALSE` | Whether the value was synced to CRM.  |
| `pushedat` | TIMESTAMPTZ | NULL | — | When the CRM push was completed.  |

- **Purpose:** Stores AI-extracted CRM fields from calls before and after sync to the connected CRM. 
- **Written by:** M-01 AI Data Extractor flow. 
- **Read by:** M-03 Revenue Graph and CRM sync flows through the `crm.fields.extracted` event. 

---

### 7.1.3 Indexes

All M-01 tables must follow the tenant-first indexing rule so tenant-scoped queries remain efficient and RLS-filtered access does not degrade as data volume grows. The architecture document explicitly requires an index on `(tenantid, primary_lookup_column)` for every table, and any table expected to exceed 10,000 rows must not rely on sequential scans. 

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

Every table in the `ingestion` schema must have RLS enabled and forced so that tenant isolation applies even if someone runs an unsafe query without a tenant filter at the application level. The architecture mandates that the application sets the active tenant in the database session, and the policy reads that value using `current_setting('app.tenantid')::UUID`. 

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

> Apply the same RLS pattern to all M-01 tables: `audiofiles`, `transcripts`, `speakersegments`, `transcriptcorrections`, `ingestionsources`, and `crmextractedfields`. 

---

### 7.1.5 Events This Module Listens To / Emits

M-01 is an event producer module and is the source of the most important upstream event in the entire platform, `call.transcription.completed`, which triggers multiple downstream modules. It also emits `crm.fields.extracted` after structured CRM-ready data is derived from the call. 

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Emits | After transcript storage is completed successfully for a captured call.  |
| `crm.fields.extracted` | Emits | After AI Data Extractor identifies structured CRM fields from a call.  |

**Downstream consumers of `call.transcription.completed`:**
- M-02 Sales Engagement 
- M-03 Revenue Graph 
- M-04 Conversation Intelligence 
- M-05 Smart Tracking 
- M-06 Insight Generation 

**Downstream consumer of `crm.fields.extracted`:**
- M-03 Revenue Graph 

---

### 7.1.6 Special Notes

- This module is the most critical upstream dependency in the platform because if transcription fails, summaries, trackers, call scoring, deal linking, and downstream coaching flows cannot run. 
- The main operational flow begins when a conferencing or dialer webhook is received, audio is stored, transcription is processed with Whisper and diarization, and the result is persisted before `call.transcription.completed` is emitted. 
- The module supports AI Data Extractor and Native Connectors as part of its feature scope, in addition to core transcription. 
- `participantlist` is a strong candidate for `JSONB` because it contains structured participant metadata coming from source systems. 
- This module is a source for downstream analytics replication because `ingestion.calls` is replicated into ClickHouse as `callevents` for dashboard and performance use cases. 
- Failure handling is important here: if audio fetch or transcription fails, downstream modules should remain unaffected because they act only when `call.transcription.completed` is successfully published. 
- For documentation consistency, add a note in implementation details that this module must support replay and reprocessing safely because BullMQ retries and webhook duplication are expected in production. 



## 📦 MODULE: M-02 Sales Engagement — Schema: `engagement`

### 7.2.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-02  |
| Module Name | Sales Engagement  |
| Schema Name | `engagement`  |
| Phase | Phase 2  |
| Owner | [Developer Name] |
| Description | Stores AI-assisted outreach data such as email drafts, sends, templates, flows, and rep tasks so teams can execute follow-ups and sales actions inside the platform.  |

M-02 focuses on execution after customer interactions by helping reps compose emails, manage tasks, and run structured outreach flows. Its Email Composer depends on real-time deal and contact context from M-03 Revenue Graph, which is why M-02 is allowed to call the M-03 public API for personalization. 

---

### 7.2.2 Tables in This Schema

#### Table: `emaildrafts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `draftid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for draft record.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User who created or owns the draft.  |
| `recipientcontactid` | UUID | NOT NULL | — | Target contact for the email.  |
| `dealid` | UUID | NULL | — | Optional linked deal context.  |
| `subject` | TEXT | NULL | — | Draft email subject line.  |
| `body` | TEXT | NULL | — | Draft email body content.  |
| `status` | TEXT | NOT NULL | — | Draft state such as draft, scheduled, sent.  |
| `aiconfidencescore` | NUMERIC | NULL | — | Confidence score for AI-generated draft quality.  |
| `generatedfromcallid` | UUID | NULL | — | Source call used to generate the email.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores manually created and AI-generated email drafts before sending. 
- **Written by:** M-02 Email Composer and AI email generation flow. 
- **Read by:** M-02 UI endpoints and send pipeline; can also provide context to reporting or follow-up flows. 

#### Table: `emailsends`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sendid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for email send event.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User who sent the email.  |
| `draftid` | UUID | NOT NULL | — | Source draft record.  |
| `sentat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the email was sent.  |
| `opentracked` | BOOLEAN | NOT NULL | `FALSE` | Whether open tracking is enabled or captured.  |
| `clicktracked` | BOOLEAN | NOT NULL | `FALSE` | Whether click tracking is enabled or captured.  |
| `replyreceived` | BOOLEAN | NOT NULL | `FALSE` | Whether a reply was received.  |
| `providerused` | TEXT | NULL | — | Delivery provider such as Gmail or Outlook.  |

- **Purpose:** Stores delivery records and engagement status for sent emails. 
- **Written by:** M-02 sending service when an email is dispatched. 
- **Read by:** M-02 engagement UI, M-03 Revenue Graph, M-05 Smart Tracking, and M-07 Deal Management via the `email.sent` event. 

#### Table: `emailtemplates`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `templateid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for reusable template.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Template name shown to users.  |
| `subjecttemplate` | TEXT | NOT NULL | — | Subject template with placeholders.  |
| `bodytemplate` | TEXT | NOT NULL | — | Body template with variables.  |
| `language` | TEXT | NULL | — | Template language.  |
| `createdby` | UUID | NOT NULL | — | User who created the template.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores reusable email templates with personalization variables. 
- **Written by:** M-02 template management flows. 
- **Read by:** M-02 Email Composer and automated flow generation logic. 

#### Table: `emailflows`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `flowid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for flow definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Name of the outreach flow.  |
| `steps` | JSONB | NOT NULL | — | Ordered flow steps and timing rules.  |
| `triggercondition` | JSONB | NULL | — | Condition that starts the sequence.  |
| `isactive` | BOOLEAN | NOT NULL | `FALSE` | Whether the flow is active.  |
| `createdby` | UUID | NOT NULL | — | User who created the flow.  |

- **Purpose:** Stores multi-step outreach sequence definitions. 
- **Written by:** M-02 flow builder and admin setup flows. 
- **Read by:** M-02 enrollment engine and future M-08 automation orchestration interfaces. 

#### Table: `flowenrollments`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `enrollmentid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for flow enrollment.  |
| `flowid` | UUID | NOT NULL | — | Linked outreach flow.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `contactid` | UUID | NOT NULL | — | Enrolled contact.  |
| `dealid` | UUID | NULL | — | Optional deal context for enrollment.  |
| `currentstep` | INTEGER | NOT NULL | `0` | Current sequence step.  |
| `status` | TEXT | NOT NULL | — | Enrollment state such as active, paused, completed.  |
| `enrolledat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the contact was enrolled.  |

- **Purpose:** Tracks which contacts are currently enrolled in outreach flows and where they are in the sequence. 
- **Written by:** M-02 automation and sequence enrollment logic. 
- **Read by:** M-02 UI and scheduler/execution workers. 

#### Table: `tasks`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `taskid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for task.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | Assigned user.  |
| `type` | TEXT | NOT NULL | — | Task type such as email, call, LinkedIn, custom.  |
| `description` | TEXT | NOT NULL | — | Task description shown to the rep.  |
| `duedate` | TIMESTAMPTZ | NULL | — | Task due date.  |
| `priority` | TEXT | NULL | — | Task priority.  |
| `source` | TEXT | NULL | — | Where the task originated from.  |
| `sourceid` | UUID | NULL | — | Upstream entity reference.  |
| `status` | TEXT | NOT NULL | — | Current task status.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Centralized task list for all rep follow-up work across sources. 
- **Written by:** M-02 task generator, follow-up workflows, and event-driven task creation logic. 
- **Read by:** M-02 task UI and managers reviewing execution queues. 

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

These indexes follow the tenant-first rule required for all module tables and support common M-02 access patterns such as rep inboxes, sent-email history, active flow enrollments, and due task lookups. 

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

> Apply the same RLS pattern to `emailsends`, `emailtemplates`, `emailflows`, `flowenrollments`, and `tasks`. `FORCE ROW LEVEL SECURITY` is mandatory for all tenant-scoped tables. 

---

### 7.2.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript is ready and a follow-up workflow or AI-generated draft can be created from call context.  |
| `email.sent` | Emits | After an email is successfully sent and logged.  |

M-02 is one of the downstream consumers of M-01 transcription output, and it emits `email.sent` so M-03 can log email activity, M-05 can detect intent-based signals in outbound communication, and M-07 can use outreach activity in deal management logic. 

---

### 7.2.6 Special Notes

- M-02 is allowed to call `GET /api/v1/revenue-graph/deals/:id` from M-03 because email personalization requires real-time deal and contact context, and this is the main approved synchronous cross-module dependency in the architecture. 
- The module includes Email Composer and centralized To-do functionality in the product roadmap, and both are part of Phase 2 commercialization. 
- `steps` and `triggercondition` in `emailflows` are strong `JSONB` candidates because sequence logic is structured but variable by tenant. 
- `email.sent` is a key platform event because it links execution activity back into the Revenue Graph and downstream analytics. 

---

## 📦 MODULE: M-03 Revenue Graph — Schema: `revenuegraph`

### 7.3.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-03  |
| Module Name | Revenue Graph  |
| Schema Name | `revenuegraph`  |
| Phase | Phase 3 Priority 1  |
| Owner | [Developer Name] |
| Description | Stores the structured relationship layer that connects calls, emails, meetings, accounts, contacts, and deals so every downstream module can work with business context instead of isolated interactions.  |

M-03 is the core modeling layer of the platform and is the first planned extraction candidate because many downstream modules depend on its APIs and entity-linking outputs. It is planned for Phase 1-2 deployment and is Priority #1 for Phase 3 extraction into an independent microservice. It consumes upstream events from M-01 and M-02, links interactions to the correct revenue entities, and exposes the main context APIs used across the platform. 

---

### 7.3.2 Tables in This Schema

#### Table: `accounts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `accountid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for account.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `crmaccountid` | TEXT | NULL | — | Source CRM account ID.  |
| `name` | TEXT | NOT NULL | — | Account name.  |
| `industry` | TEXT | NULL | — | Industry classification.  |
| `arr` | NUMERIC | NULL | — | Annual recurring revenue value.  |
| `segment` | TEXT | NULL | — | Customer segment.  |
| `healthscore` | NUMERIC | NULL | — | Account-level health score.  |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp.  |

- **Purpose:** Master account records synced from CRM and enriched for downstream context. 
- **Written by:** M-03 CRM sync and entity-linking flows. 
- **Read by:** Frontend, M-02, M-04, M-05, M-06, M-07, M-08, and M-10 through approved APIs. 

#### Table: `contacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `contactid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for contact.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `crmcontactid` | TEXT | NULL | — | Source CRM contact ID.  |
| `accountid` | UUID | NULL | — | Parent account reference.  |
| `name` | TEXT | NOT NULL | — | Contact full name.  |
| `email` | TEXT | NULL | — | Contact email address.  |
| `title` | TEXT | NULL | — | Contact title or role.  |
| `linkedinurl` | TEXT | NULL | — | LinkedIn profile URL if available.  |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp.  |

- **Purpose:** Master contact records linked to accounts and activities. 
- **Written by:** M-03 CRM sync and entity resolution. 
- **Read by:** Frontend and other modules using Revenue Graph APIs for personalization and context. 

#### Table: `accountcontacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `accountid` | UUID | NOT NULL | — | Linked account.  |
| `contactid` | UUID | NOT NULL | — | Linked contact.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `isprimary` | BOOLEAN | NOT NULL | `FALSE` | Marks the primary contact for the account.  |

- **Purpose:** Junction table mapping contacts to accounts. 
- **Written by:** M-03 CRM sync logic. 
- **Read by:** M-03 APIs and downstream modules that need relationship context. 

#### Table: `deals`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for deal.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `crmdealid` | TEXT | NULL | — | Source CRM deal ID.  |
| `accountid` | UUID | NULL | — | Linked account.  |
| `name` | TEXT | NOT NULL | — | Deal name.  |
| `stage` | TEXT | NULL | — | Current CRM stage.  |
| `value` | NUMERIC | NULL | — | Deal value.  |
| `closedate` | DATE | NULL | — | Expected close date.  |
| `owneruserid` | UUID | NULL | — | Deal owner user ID.  |
| `healthscore` | NUMERIC | NULL | — | Current deal health score.  |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp.  |

- **Purpose:** Master deal records used as the central business context object for many modules. 
- **Written by:** M-03 CRM sync and stage sync flows. 
- **Read by:** Frontend and most downstream modules through Revenue Graph APIs. 

#### Table: `dealcontacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | — | Linked deal.  |
| `contactid` | UUID | NOT NULL | — | Linked contact.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `role` | TEXT | NULL | — | Role such as decision maker, champion, influencer.  |

- **Purpose:** Junction table mapping contacts to deals and their role in the buying process. 
- **Written by:** M-03 CRM sync and relationship mapping flows. 
- **Read by:** M-03 APIs and downstream modules needing stakeholder context. 

#### Table: `activities`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `activityid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for activity record.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `type` | TEXT | NOT NULL | — | Activity type such as call, email, meeting.  |
| `sourceid` | UUID | NOT NULL | — | Source entity ID such as transcript, send, or meeting ID.  |
| `sourcetype` | TEXT | NOT NULL | — | Source entity type.  |
| `accountid` | UUID | NULL | — | Linked account.  |
| `dealid` | UUID | NULL | — | Linked deal.  |
| `contactid` | UUID | NULL | — | Linked contact.  |
| `userid` | UUID | NULL | — | Related internal user.  |
| `occurredat` | TIMESTAMPTZ | NOT NULL | — | When the activity happened.  |

- **Purpose:** Unified activity log across calls, emails, and meetings tied to accounts and deals. 
- **Written by:** M-03 event consumers processing `call.transcription.completed` and `email.sent`. 
- **Read by:** Frontend, M-07 Deal Management, and analytics/export workflows. 

#### Table: `crmsynclogs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `syncid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for sync log.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `crmplatform` | TEXT | NOT NULL | — | CRM platform such as Salesforce, HubSpot, Dynamics.  |
| `entitytype` | TEXT | NOT NULL | — | Synced entity type such as account, contact, deal.  |
| `status` | TEXT | NOT NULL | — | Sync result status such as success, partial, failed.  |
| `recordssynced` | INTEGER | NULL | — | Number of records synced.  |
| `errormessage` | TEXT | NULL | — | Failure message if sync failed.  |
| `syncedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the sync completed.  |

- **Purpose:** Logs CRM synchronization activity for monitoring and audit. 
- **Written by:** M-03 CRM sync jobs and manual sync endpoints. 
- **Read by:** RevOps-facing sync status endpoints and admin troubleshooting flows. 

#### Table: `datacloudexports`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `exportid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for export job.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `warehousetype` | TEXT | NOT NULL | — | Target warehouse such as Snowflake, BigQuery, Databricks, S3, or Redshift.  |
| `warehouseconfigencrypted` | TEXT | NULL | — | Encrypted warehouse connection details.  |
| `lastexportedat` | TIMESTAMPTZ | NULL | — | Last successful export time.  |
| `status` | TEXT | NOT NULL | — | Export state such as running, success, failed.  |
| `recordsexported` | INTEGER | NULL | — | Number of exported records.  |
| `idempotencykey` | TEXT | NULL | — | Prevents duplicate export runs.  |

- **Purpose:** Stores Data Cloud export configuration and export job history. 
- **Written by:** M-03 Data Cloud configuration and export flows. 
- **Read by:** RevOps export status endpoints and audit/reporting flows. 

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

These indexes are directly aligned to documented access patterns in the Revenue Graph module, especially CRM lookup, account/deal browsing, activity timelines, and export idempotency enforcement. 

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

> Apply the same RLS pattern to `contacts`, `accountcontacts`, `deals`, `dealcontacts`, `activities`, `crmsynclogs`, and `datacloudexports`. 

---

### 7.3.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a call transcript is ready and must be linked to the correct account, contact, and deal.  |
| `crm.fields.extracted` | Listens | When AI-extracted CRM fields are available for writeback or enrichment.  |
| `email.sent` | Listens | When outbound email activity should be added to the Revenue Graph.  |
| `revenue_graph.entity.linked` | Emits | After a call or interaction has been linked to the correct account, deal, and contact.  |
| `deal.stage.changed` | Emits | After a deal stage is updated through CRM synchronization or detected stage movement.  |

M-03 is both a consumer and a publisher at the center of the event model, which is why it is the main dependency for M-04, M-05, M-06, M-07, M-08, and M-10 context access patterns. 

---

### 7.3.6 Special Notes

- M-03 is the platform’s structured data foundation, not just a storage module; it converts isolated interaction data into account, contact, and deal context that downstream AI modules require. 
- It exposes important APIs such as `GET /api/v1/revenue-graph/accounts`, `GET /api/v1/revenue-graph/deals`, and `GET /api/v1/revenue-graph/deals/:id`, and these are approved cross-module access points. 
- CRM sync belongs here, but CRM ownership boundaries still matter: M-03 can write AI-enriched fields back to CRM, but it must not own unrelated CRM business actions outside its defined boundary. 
- `datacloudexports` must be idempotent because Data Cloud sync is designed to be safely re-runnable. 
- `activities` is a prime candidate for ClickHouse replication because activity streams are later used in aggregation-heavy dashboard scenarios. 
- M-03 is marked as Phase 3 Priority 1 extraction because once it becomes independently deployable, it unlocks cleaner scaling and reuse for many downstream modules. 


## 📦 MODULE: M-04 Conversation Intelligence — Schema: `conversationintelligence`

### 7.4.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-04  |
| Module Name | Conversation Intelligence  |
| Schema Name | `conversationintelligence`  |
| Phase | Phase 3 (Planned)  |
| Owner | [Developer Name] |
| Description | Stores AI analysis outputs for calls such as scorecards, reviews, topic tags, themes, vocabulary rules, and translation preferences so conversations become measurable, searchable, and coachable.  |

M-04 turns raw transcripts into structured intelligence by scoring calls, tagging topics, detecting themes, and applying business-language corrections. It is planned for Phase 1-2 deployment, and its Phase 3 extraction priority is not yet assigned. It depends on both M-01 transcript completion and M-03 entity linking because scoring quality improves when deal and account context is available. 

---

### 7.4.2 Tables in This Schema

#### Table: `scorecards`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `scorecardid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for scorecard.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Scorecard name.  |
| `questions` | JSONB | NOT NULL | — | Review questions and weights.  |
| `scoringconditions` | JSONB | NOT NULL | — | Rubric or scoring rules for each question.  |
| `createdby` | UUID | NOT NULL | — | Admin who created the scorecard.  |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the scorecard is active.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores admin-defined call review scorecards used for AI or manual evaluation. 
- **Written by:** M-04 scorecard management endpoints. 
- **Read by:** M-04 scoring jobs and admin/front-end scorecard views. 

#### Table: `callreviews`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `reviewid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for review result.  |
| `callid` | UUID | NOT NULL | — | Reviewed call ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `scorecardid` | UUID | NOT NULL | — | Scorecard used for evaluation.  |
| `aianswers` | JSONB | NOT NULL | — | AI answers with evidence snippets and confidence.  |
| `totalscore` | NUMERIC | NULL | — | Final score for the call.  |
| `confidencescore` | NUMERIC | NULL | — | Model confidence score.  |
| `flaggedreview` | BOOLEAN | NOT NULL | `FALSE` | Whether human review is required.  |
| `reviewtype` | TEXT | NULL | — | AI, manual, or hybrid review type.  |
| `scoredat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the review was scored.  |

- **Purpose:** Stores scorecard-based call review results. 
- **Written by:** M-04 AI scoring pipeline after transcript analysis. 
- **Read by:** Frontend review pages and M-10 Performance Coaching via API/event outputs. 

#### Table: `topics`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `topicid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for topic definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Topic name such as pricing or objection.  |
| `phrases` | JSONB | NULL | — | Keywords or seed phrases supporting the topic.  |
| `type` | TEXT | NULL | — | Global or tenant-custom topic type.  |
| `isvisible` | BOOLEAN | NOT NULL | `TRUE` | Whether the topic is shown in UI.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores topic definitions used for tagging and search experiences. 
- **Written by:** M-04 topic administration flows. 
- **Read by:** M-04 topic tagging logic and topic management UI. 

#### Table: `topictags`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `tagid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for applied tag.  |
| `callid` | UUID | NOT NULL | — | Related call.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `topicid` | UUID | NULL | — | Linked topic definition.  |
| `topicname` | TEXT | NOT NULL | — | Resolved topic name.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence of topic detection.  |
| `taggedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When tagging occurred.  |

- **Purpose:** Stores topic tags applied to individual calls. 
- **Written by:** M-04 AI topic tagging jobs. 
- **Read by:** Frontend call topic views, M-05 Smart Tracking, and M-06 Insight Generation through event/API flows. 

#### Table: `themes`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `themeid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for theme cluster.  |
| `analysisid` | UUID | NOT NULL | — | Parent analysis run.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Theme name.  |
| `summary` | TEXT | NULL | — | AI-generated summary of the theme.  |
| `callcount` | INTEGER | NULL | — | Calls represented by this theme.  |
| `accountcount` | INTEGER | NULL | — | Accounts represented by this theme.  |
| `associatedrevenue` | NUMERIC | NULL | — | Revenue associated with calls in this theme.  |

- **Purpose:** Stores clustered recurring themes found across many conversations. 
- **Written by:** M-04 Theme Spotter analysis jobs. 
- **Read by:** Frontend theme dashboards and analysis result views. 

#### Table: `themeanalyses`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `analysisid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for analysis run.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `businessquestion` | TEXT | NOT NULL | — | User-entered question driving the analysis.  |
| `filters` | JSONB | NULL | — | Date range, rep, stage, account filters.  |
| `status` | TEXT | NOT NULL | — | Job state such as queued, running, completed, failed.  |
| `callcountanalyzed` | INTEGER | NULL | — | Number of calls analyzed.  |
| `createdby` | UUID | NOT NULL | — | User who launched the job.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores analysis job metadata for AI Theme Spotter runs. 
- **Written by:** M-04 theme analysis endpoints and workers. 
- **Read by:** Frontend analysis status and results pages. 

#### Table: `vocabularycorrections`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `vocabid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for vocabulary correction rule.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `incorrectterm` | TEXT | NOT NULL | — | Mis-transcribed term.  |
| `correctterm` | TEXT | NOT NULL | — | Correct replacement term.  |
| `language` | TEXT | NULL | — | Language for the rule.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores custom business terminology corrections for transcript enhancement. 
- **Written by:** M-04 vocabulary management endpoints. 
- **Read by:** M-04 transcription correction and topic analysis flows. 

#### Table: `translationpreferences`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `prefid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for translation preference.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `teamid` | UUID | NULL | — | Optional team scope.  |
| `userid` | UUID | NULL | — | Optional user-specific preference.  |
| `targetlanguage` | TEXT | NOT NULL | — | Preferred target language in BCP-47 style code.  |

- **Purpose:** Stores preferred output translation settings for teams or users. 
- **Written by:** M-04 translation settings endpoints. 
- **Read by:** M-04 transcript/summary translation flows. 

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

These indexes match the module’s main access patterns for score retrieval, topic filtering, theme analysis status, and per-tenant vocabulary and language preferences. 

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

> Apply the same RLS pattern to `callreviews`, `topics`, `topictags`, `themes`, `themeanalyses`, `vocabularycorrections`, and `translationpreferences`. 

---

### 7.4.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript becomes available and scoring/topic-tagging jobs can be queued.  |
| `revenue_graph.entity.linked` | Listens | When deal/account context is available and scoring can be finalized with business context.  |
| `call.scored` | Emits | After a call review result is written.  |
| `call.topics.tagged` | Emits | After topic tags are generated for a call.  |

M-04 must wait for M-03 entity linking before finalizing score outputs, and the architecture explicitly recommends a delayed-job approach so scoring can proceed when context arrives or after a timeout window. 

---

### 7.4.6 Special Notes

- This module uses AI service endpoints such as `POST /v1/score-call`, `POST /v1/detect-themes`, and `POST /v1/tag-topics`, but business logic still stays in TypeScript module code. 
- `questions`, `scoringconditions`, `aianswers`, and `filters` are natural `JSONB` fields because their shapes vary by tenant and use case. 
- Low-confidence AI reviews should set `flaggedreview = true`, which is important for safe human-in-the-loop workflows. 
- M-10 Performance Coaching depends on `call.scored`, while M-05 Smart Tracking and M-06 Insight Generation depend on `call.topics.tagged`, so event quality and idempotency matter here. 
- The module covers AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, AI Transcriber, and AI Translator in the product scope. 

---

## 📦 MODULE: M-05 Smart Tracking — Schema: `smarttracking`

### 7.5.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-05  |
| Module Name | Smart Tracking  |
| Schema Name | `smarttracking`  |
| Phase | Phase 3 Priority 2  |
| Owner | [Developer Name] |
| Description | Stores tracker definitions, AI-detected business signals, searchable index sync state, and aggregated deal-driver snapshots so teams can detect intent, risks, and patterns across conversations.  |

M-05 is the signal-detection layer that turns conversation data into actionable business alerts such as competitor mentions, pricing pressure, risk cues, and next-step gaps. It depends on M-03 entity linking for deal and account context and also consumes M-04 topic-tag output to enrich or refine detections. 

---

### 7.5.2 Tables in This Schema

#### Table: `trackers`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `trackerid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for tracker definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Tracker name.  |
| `description` | TEXT | NULL | — | Human-readable purpose of the tracker.  |
| `intentdefinition` | JSONB | NOT NULL | — | AI detection instructions, patterns, or semantic definition.  |
| `severitydefault` | TEXT | NULL | — | Default severity assigned when matched.  |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the tracker is active.  |
| `createdby` | UUID | NOT NULL | — | User who created the tracker.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores tenant-defined AI trackers that describe what signals should be detected in calls or emails. 
- **Written by:** M-05 tracker configuration endpoints. 
- **Read by:** M-05 detection workers and tracker management UI. 

#### Table: `trackerdetections`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `detectionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for detection result.  |
| `trackerid` | UUID | NOT NULL | — | Source tracker definition.  |
| `callid` | UUID | NOT NULL | — | Related call identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `accountid` | UUID | NULL | — | Linked account context.  |
| `dealid` | UUID | NULL | — | Linked deal context.  |
| `contactid` | UUID | NULL | — | Linked contact context.  |
| `snippet` | TEXT | NULL | — | Transcript snippet supporting the detection.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence of the detection.  |
| `severity` | TEXT | NULL | — | Severity assigned to the signal.  |
| `detectedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the detection was created.  |

- **Purpose:** Stores every AI-detected signal matched by a tracker. 
- **Written by:** M-05 detection pipeline after transcript and context analysis. 
- **Read by:** Frontend signal views, M-06 Insight Generation, M-07 Deal Management, and M-08 Execution Automation through events/APIs. 

#### Table: `searchindexsynclog`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `syncid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for search sync log entry.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `entitytype` | TEXT | NOT NULL | — | Indexed entity type such as call, tracker, or detection.  |
| `entityid` | UUID | NOT NULL | — | Indexed record ID.  |
| `status` | TEXT | NOT NULL | — | Sync state such as queued, synced, failed.  |
| `errormessage` | TEXT | NULL | — | Search indexing failure message if any.  |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last sync completion time.  |

- **Purpose:** Tracks synchronization of searchable conversation data into the search index. 
- **Written by:** M-05 Meilisearch sync workers. 
- **Read by:** Admin diagnostics and search index health monitoring. 

#### Table: `dealdriversnapshots`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `snapshotid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for snapshot row.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | Rep or owner being measured.  |
| `trackerid` | UUID | NOT NULL | — | Tracker represented in the aggregate.  |
| `detectioncount` | INTEGER | NOT NULL | `0` | Number of detections counted.  |
| `affecteddealcount` | INTEGER | NOT NULL | `0` | Number of deals impacted by this tracker.  |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the aggregate was computed.  |

- **Purpose:** Stores aggregated signal counts for the Deal Drivers view. 
- **Written by:** M-05 aggregation jobs. 
- **Read by:** Frontend analytics views and downstream board/reporting modules. 

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

These indexes support the documented access patterns for deal risk analysis, contact-level signal review, tracker monitoring, and search sync operations. 

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

> Apply the same RLS pattern to `trackerdetections`, `searchindexsynclog`, and `dealdriversnapshots`. 

---

### 7.5.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript is ready and tracker detection jobs can be queued.  |
| `revenue_graph.entity.linked` | Listens | When deal/account/contact context is available to enrich detections.  |
| `call.topics.tagged` | Listens | When M-04 topic-tag output is available and can improve signal understanding.  |
| `email.sent` | Listens | When outbound email activity may also need tracker-based signal detection.  |
| `tracker.detection.created` | Emits | After a tracker detection record is written.  |

M-05 sits in the middle of the platform’s “understand” stage because its detections feed directly into M-06 summaries and research, M-07 deal health logic, and M-08 automation triggers. 

---

### 7.5.6 Special Notes

- This module powers AI Smart Tracker, Searchable Conversation Library, and View Deal Drivers in the product map. 
- `intentdefinition` in `trackers` is naturally `JSONB` because tracker logic can vary by tenant and may include rule hints, semantic prompts, or thresholds. 
- `searchindexsynclog` exists because M-05 is responsible for searchable conversation access patterns, and search indexing is explicitly separated from PostgreSQL source-of-truth storage. 
- `trackerdetections` is a high-value event source because `tracker.detection.created` is consumed by M-06, M-07, and M-08, so idempotency and evidence-snippet quality are important. 
- Cross-module reads for deal and account context must go through the M-03 Revenue Graph API and not direct table access. 

## 📦 MODULE: M-06 Insight Generation — Schema: `insights`

### 7.6.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-06  |
| Module Name | Insight Generation  |
| Schema Name | `insights`  |
| Phase | Phase 3  |
| Owner | [Developer Name] |
| Description | Stores AI-generated summaries, briefs, research outputs, Ask Anything sessions, and vector embeddings so users can consume conversations as structured insights instead of raw transcripts.  |

M-06 is the main “analyze” layer of the platform because it converts transcript, topic, tracker, and deal context into human-usable outputs like call summaries, deal briefs, and question-answer responses. It consumes raw conversation events plus enrichment from M-04 and M-05, and it also owns the pgvector-based retrieval layer for semantic search and RAG. 

---

### 7.6.2 Tables in This Schema

#### Table: `callsummaries`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `summaryid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the call summary.  |
| `callid` | UUID | NOT NULL | — | Source call identifier.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `onelinesummary` | TEXT | NOT NULL | — | Short summary of the call.  |
| `keypoints` | JSONB | NOT NULL | — | Structured key takeaways.  |
| `nextsteps` | JSONB | NOT NULL | — | Extracted follow-up actions and owners.  |
| `risks` | JSONB | NULL | — | Risks identified from the conversation.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence from the AI response.  |
| `flaggedreview` | BOOLEAN | NOT NULL | `FALSE` | Whether the summary needs human review.  |
| `version` | INTEGER | NOT NULL | `1` | Summary version number for regeneration.  |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the summary was generated.  |

- **Purpose:** Stores structured AI summaries for individual calls. 
- **Written by:** M-06 summary generation flow after `call.transcription.completed`. 
- **Read by:** Frontend summary views, M-03 for CRM note push, and M-07 for deal health logic. 

#### Table: `dealbriefs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `briefid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the deal brief.  |
| `dealid` | UUID | NOT NULL | — | Related deal ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `summarytext` | TEXT | NOT NULL | — | Generated narrative deal brief.  |
| `keyrisks` | JSONB | NULL | — | Structured list of deal risks.  |
| `recentsignals` | JSONB | NULL | — | Recent summaries, detections, and movement signals.  |
| `sources` | JSONB | NULL | — | Source references used to build the brief.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence of the generated brief.  |
| `version` | INTEGER | NOT NULL | `1` | Brief version for regeneration.  |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the brief was generated.  |

- **Purpose:** Stores AI-generated briefs that summarize the state of a deal using multiple upstream signals. 
- **Written by:** M-06 deal brief generation jobs. 
- **Read by:** Frontend deal views and M-07 through the approved `GET /api/v1/insights/deals/:id/brief` API. 

#### Table: `accountbriefs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `briefid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the account brief.  |
| `accountid` | UUID | NOT NULL | — | Related account ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `summarytext` | TEXT | NOT NULL | — | Generated account-level summary.  |
| `healthsignals` | JSONB | NULL | — | Structured account health indicators.  |
| `renewalindicators` | JSONB | NULL | — | Renewal or expansion cues from interactions.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence of the generated brief.  |
| `version` | INTEGER | NOT NULL | `1` | Brief version number.  |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the brief was generated.  |

- **Purpose:** Stores AI-generated account briefs that combine account context with interaction intelligence. 
- **Written by:** M-06 account brief generation jobs. 
- **Read by:** Frontend account views and downstream account-management experiences. 

#### Table: `researchreports`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `reportid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for research report.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `question` | TEXT | NOT NULL | — | User’s research question.  |
| `filters` | JSONB | NULL | — | Scope filters such as rep, date range, or deal stage.  |
| `status` | TEXT | NOT NULL | — | Job state such as queued, running, completed, failed.  |
| `resulttext` | TEXT | NULL | — | Final generated report text.  |
| `sourcecallids` | JSONB | NULL | — | Calls used as evidence for the report.  |
| `createdby` | UUID | NOT NULL | — | User who created the report request.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores deep multi-call research outputs generated by AI. 
- **Written by:** M-06 AI Deep Researcher jobs. 
- **Read by:** Frontend report views and export flows. 

#### Table: `querysessions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sessionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for Ask Anything session.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User who owns the session.  |
| `contextdealid` | UUID | NULL | — | Optional deal context for the conversation.  |
| `contextaccountid` | UUID | NULL | — | Optional account context for the conversation.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Session creation time.  |

- **Purpose:** Stores Ask Anything chat sessions. 
- **Written by:** M-06 query session endpoints. 
- **Read by:** Ask Anything UI and message retrieval endpoints. 

#### Table: `querymessages`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `messageid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for session message.  |
| `sessionid` | UUID | NOT NULL | — | Parent session ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `role` | TEXT | NOT NULL | — | Message role such as user or assistant.  |
| `content` | TEXT | NOT NULL | — | Message content.  |
| `citedsources` | JSONB | NULL | — | Stored source references shown in the UI.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Message creation time.  |

- **Purpose:** Stores individual messages within an Ask Anything conversation. 
- **Written by:** M-06 query-answer pipeline. 
- **Read by:** Ask Anything UI history retrieval endpoints. 

#### Table: `semanticembeddings`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `embeddingid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for embedding record.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `entitytype` | TEXT | NOT NULL | — | Type such as transcriptchunk, callsummary, dealbrief, accountbrief, or email.  |
| `entityid` | UUID | NOT NULL | — | Source entity ID.  |
| `chunkindex` | INTEGER | NULL | — | Chunk sequence for multi-part sources.  |
| `chunktext` | TEXT | NOT NULL | — | Source text stored for retrieval context.  |
| `embedding` | VECTOR(1536) | NOT NULL | — | pgvector embedding matching the selected model dimension.  |
| `modelversion` | TEXT | NOT NULL | — | Embedding model version identifier.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the embedding was created.  |

- **Purpose:** Stores vector embeddings used for semantic search and retrieval-augmented generation. 
- **Written by:** M-06 embedding generation flow, and in some cases shared AI embedding jobs used by M-05/M-06 workflows. 
- **Read by:** M-06 Ask Anything, AI Deep Researcher, and semantic retrieval services. 

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

The `semanticembeddings` table requires both a tenant/entity lookup index and an IVFFlat vector index because retrieval performance is a core part of Ask Anything and RAG workflows. The architecture explicitly documents pgvector with a `VECTOR(1536)` column and cosine-distance search for this table. 

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

> Apply the same RLS pattern to `dealbriefs`, `accountbriefs`, `researchreports`, `querysessions`, `querymessages`, and `semanticembeddings`. Every tenant-scoped table must enforce RLS. 

---

### 7.6.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.transcription.completed` | Listens | When a transcript is ready and summary generation can begin.  |
| `call.topics.tagged` | Listens | When M-04 topic tags are available to enrich summary and research context.  |
| `tracker.detection.created` | Listens | When M-05 signal detections are available for briefs and risk-aware summaries.  |
| `call.summary.generated` | Emits | After a call summary is written successfully.  |

M-06 also uses approved synchronous reads across schemas through APIs, including M-03 for deal/account/contact context and M-05 for tracker detections when generating deal briefs. If the deal link is not available immediately after transcript completion, the documented flow allows a delayed retry for up to five minutes before proceeding without context. 

---

### 7.6.6 Special Notes

- This module owns the platform’s pgvector implementation for semantic search and RAG, and the `semanticembeddings.embedding` column is explicitly defined as `VECTOR(1536)` for the OpenAI text-embedding-3-small dimension. 
- Content embedded here includes transcript chunks, call summaries, deal briefs, account briefs, and outbound emails, with transcript chunking documented as 500-token chunks with 50-token overlap. 
- `keypoints`, `nextsteps`, `risks`, `filters`, `sourcecallids`, and `citedsources` are natural `JSONB` fields because the structure varies by workflow. 
- If `confidencescore < 0.7`, outputs should be marked for review instead of being blindly trusted in downstream automation. 
- This module covers AI Smart Summaries, Ask Anything GenAI Query, and AI Deep Researcher in the product map. 

---

## 📦 MODULE: M-07 Deal & Account Management — Schema: `dealmanagement`

### 7.7.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-07  |
| Module Name | Deal & Account Management  |
| Schema Name | `dealmanagement`  |
| Phase | Phase 3 Priority 3  |
| Owner | [Developer Name] |
| Description | Stores enriched deal records, pipeline stage definitions, health-score history, risk flags, board configuration, and deal-driver aggregates so reps and managers can manage pipeline health in one place.  |

M-07 is the execution-facing pipeline intelligence layer that turns CRM data and AI signals into deal health, risk visibility, and board experiences. It consumes signals from M-03, M-05, and M-06, and it is planned as the third extraction candidate because active board traffic can become a UI and read bottleneck at scale. 

---

### 7.7.2 Tables in This Schema

#### Table: `deals`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for the deal.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `crmdealid` | TEXT | NULL | — | Source CRM deal ID.  |
| `accountid` | UUID | NULL | — | Linked account ID.  |
| `name` | TEXT | NOT NULL | — | Deal name.  |
| `stage` | TEXT | NULL | — | Current pipeline stage.  |
| `value` | NUMERIC | NULL | — | Deal value.  |
| `closedate` | DATE | NULL | — | Expected close date.  |
| `owneruserid` | UUID | NULL | — | Owner of the deal.  |
| `healthscore` | NUMERIC | NULL | — | Current computed health score.  |
| `healthcategory` | TEXT | NULL | — | Category such as healthy, at risk, or critical.  |
| `lastsignalat` | TIMESTAMPTZ | NULL | — | Last time a major signal affected this deal.  |
| `syncedat` | TIMESTAMPTZ | NULL | — | Last CRM sync timestamp.  |

- **Purpose:** Stores master deal records enriched with AI health metadata used by the Deals Board. 
- **Written by:** M-07 deal sync and health recomputation flows. 
- **Read by:** Frontend boards, M-09 forecasting context, and M-08 workflow triggers through approved APIs/events. 

#### Table: `dealstages`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `stageid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for stage definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `crmplatform` | TEXT | NOT NULL | — | CRM platform this stage belongs to.  |
| `stagename` | TEXT | NOT NULL | — | Human-readable stage name.  |
| `stageorder` | INTEGER | NOT NULL | — | Ordering of the stage in the pipeline.  |
| `isclosedwon` | BOOLEAN | NOT NULL | `FALSE` | Whether the stage is closed won.  |
| `isclosedlost` | BOOLEAN | NOT NULL | `FALSE` | Whether the stage is closed lost.  |

- **Purpose:** Stores tenant-specific pipeline stage definitions. 
- **Written by:** M-07 configuration or CRM sync flows. 
- **Read by:** Boards, stage transitions, and forecasting support logic. 

#### Table: `dealhealthscores`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `scoreid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for historical health score row.  |
| `dealid` | UUID | NOT NULL | — | Related deal ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `score` | NUMERIC | NOT NULL | — | Computed health score value.  |
| `category` | TEXT | NOT NULL | — | Score category such as healthy, at risk, critical.  |
| `activityscore` | NUMERIC | NULL | — | Activity contribution to the score.  |
| `riskflagcount` | INTEGER | NULL | — | Number of active unresolved risk flags.  |
| `pastduenextsteps` | INTEGER | NULL | — | Count of overdue next steps.  |
| `dayssincelastcontact` | INTEGER | NULL | — | Days since last interaction.  |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the score was computed.  |

- **Purpose:** Stores historical snapshots of deal health calculations. 
- **Written by:** M-07 health score computation jobs. 
- **Read by:** Frontend boards, history views, and analytics/reporting use cases. 

#### Table: `dealriskflags`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `flagid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for risk flag.  |
| `dealid` | UUID | NOT NULL | — | Related deal ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `risktype` | TEXT | NOT NULL | — | Risk classification.  |
| `severity` | TEXT | NOT NULL | — | Risk severity.  |
| `source` | TEXT | NOT NULL | — | Signal source such as tracker detection or summary.  |
| `sourceid` | UUID | NULL | — | Upstream event or entity reference.  |
| `detectedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the risk was detected.  |
| `resolvedat` | TIMESTAMPTZ | NULL | — | When the risk was resolved.  |

- **Purpose:** Stores active and historical deal risk flags. 
- **Written by:** M-07 event handlers responding to detections, summaries, and stage changes. 
- **Read by:** Deal boards, risk-detail views, and health recomputation logic. 

#### Table: `dealcontacts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `dealid` | UUID | NOT NULL | — | Related deal ID.  |
| `contactid` | UUID | NOT NULL | — | Related contact ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `role` | TEXT | NULL | — | Role of the contact on the deal.  |
| `addedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the relation was added.  |

- **Purpose:** Junction table mapping contacts to deals for board and stakeholder context. 
- **Written by:** M-07 sync or relationship enrichment flows. 
- **Read by:** Deal board detail pages and stakeholder views. 

#### Table: `dealboardconfigs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `configid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for board configuration.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | Owner of the configuration.  |
| `columnorder` | JSONB | NOT NULL | — | Ordered board columns.  |
| `visiblefields` | JSONB | NOT NULL | — | Fields visible on the board.  |
| `defaultfilters` | JSONB | NULL | — | Default filter setup for the board.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores per-user Deals Board configuration and personalization. 
- **Written by:** M-07 board configuration endpoints. 
- **Read by:** Frontend board-loading endpoints. 

#### Table: `dealdrivers`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `driverid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for aggregated driver row.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | Rep or owner being measured.  |
| `trackerid` | UUID | NOT NULL | — | Tracker contributing to the driver score.  |
| `detectioncount` | INTEGER | NOT NULL | `0` | Number of detections tied to the tracker.  |
| `affecteddealcount` | INTEGER | NOT NULL | `0` | Number of deals affected by this driver.  |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time the aggregate was computed.  |

- **Purpose:** Stores aggregated deal-driver counts per rep for driver analytics and board widgets. 
- **Written by:** M-07 aggregation jobs or imported downstream driver computations. 
- **Read by:** Frontend Deal Drivers view and manager analytics experiences. 

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

The unique index on `(tenantid, dealid, sourceid)` is especially important because the architecture explicitly calls out duplicate-prevention for repeated event deliveries during risk-flag insertion. 

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

> Apply the same RLS pattern to `dealstages`, `dealhealthscores`, `dealriskflags`, `dealcontacts`, `dealboardconfigs`, and `dealdrivers`. 

---

### 7.7.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `tracker.detection.created` | Listens | When a new detection should become a risk flag or affect deal health.  |
| `call.summary.generated` | Listens | When summaries contribute risks, next steps, and context to health scoring.  |
| `email.sent` | Listens | When outbound engagement should influence deal activity and health state.  |
| `deal.stage.changed` | Listens | When stage movement should resolve or recalculate stage-related risks.  |

M-07 does not emit a named platform event in the current registry excerpt, but it performs important state changes in response to upstream events, especially updating `deals.healthscore`, `deals.healthcategory`, and `deals.lastsignalat`. The module also has an approved cross-module read to fetch deal briefs from M-06 and deal/account/activity context from M-03 APIs. 

---

### 7.7.6 Special Notes

- The health-score update flow is explicitly defined as a pure recomputation from current database state, which makes it safe to rerun during retries and duplicate event deliveries. 
- `dealriskflags` must support unresolved versus resolved flags, and `resolvedat` is central to that lifecycle. 
- `columnorder`, `visiblefields`, and `defaultfilters` are good `JSONB` fields because board configuration is user-specific and flexible. 
- M-07 is planned as the third extraction target because active rep UI traffic and board reads can become a bottleneck before many other modules. 
- This module maps closely to Deals Boards and View Deal Drivers in the product map. 

## 📦 MODULE: M-08 Execution Automation — Schema: `execution`

### 7.8.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-08  |
| Module Name | Execution Automation  |
| Schema Name | `execution`  |
| Phase | Phase 3  |
| Owner | [Developer Name] |
| Description | Stores GTM sales plays, workflow definitions, workflow runs, and competitor alert settings so the platform can turn signals into guided actions and automation.  |

M-08 is the action layer that reacts to deal-stage movement and tracker detections by enrolling plays, running workflows, and sending alerts. Unlike AI-heavy modules, its core logic is explicit business-rule evaluation in TypeScript, and the architecture notes that it does not rely on separate AI service calls for its main automation behavior. 

---

### 7.8.2 Tables in This Schema

#### Table: `salesplays`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `playid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for sales play definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Sales play name.  |
| `steps` | JSONB | NOT NULL | — | Ordered steps, actions, and due offsets.  |
| `triggerconditions` | JSONB | NOT NULL | — | Conditions that determine when the play should start.  |
| `createdby` | UUID | NOT NULL | — | User who created the play.  |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the play is active.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores reusable GTM sales play definitions used to guide reps through consistent execution. 
- **Written by:** M-08 play management endpoints. 
- **Read by:** M-08 enrollment logic and frontend play configuration screens. 

#### Table: `playenrollments`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `enrollmentid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for play enrollment.  |
| `playid` | UUID | NOT NULL | — | Linked sales play.  |
| `dealid` | UUID | NOT NULL | — | Deal enrolled in the play.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | Assigned rep or owner.  |
| `currentstep` | INTEGER | NOT NULL | `0` | Current play step.  |
| `status` | TEXT | NOT NULL | — | Enrollment state such as active, completed, paused, or exited.  |
| `enrolledat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Enrollment time.  |

- **Purpose:** Tracks deals that are currently enrolled in sales plays. 
- **Written by:** M-08 auto-enrollment rules and manual enrollment endpoints. 
- **Read by:** Frontend enrollment views and step-completion flows. 

#### Table: `playstepcompletions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `completionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for step completion row.  |
| `enrollmentid` | UUID | NOT NULL | — | Parent play enrollment ID.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `stepid` | INTEGER | NOT NULL | — | Step number or identifier within the play.  |
| `completedby` | UUID | NOT NULL | — | User who completed the step.  |
| `completedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Completion time.  |
| `notes` | TEXT | NULL | — | Optional notes about completion.  |

- **Purpose:** Stores completion history for each enrolled play step. 
- **Written by:** M-08 step-completion endpoints. 
- **Read by:** Frontend progress tracking and execution analytics views. 

#### Table: `workflows`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `workflowid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for workflow definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Workflow name.  |
| `triggerevent` | TEXT | NOT NULL | — | Event that starts the workflow, such as `tracker.detection.created` or `deal.stage.changed`.  |
| `branches` | JSONB | NOT NULL | — | Conditional branches for evaluation.  |
| `actions` | JSONB | NOT NULL | — | Actions such as notify, enrollplay, or updatefield.  |
| `createdby` | UUID | NOT NULL | — | User who created the workflow.  |
| `isactive` | BOOLEAN | NOT NULL | `TRUE` | Whether the workflow is active.  |

- **Purpose:** Stores branching workflow automation definitions. 
- **Written by:** M-08 workflow builder and admin endpoints. 
- **Read by:** M-08 event-driven automation engine. 

#### Table: `workflowruns`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `runid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for workflow run.  |
| `workflowid` | UUID | NOT NULL | — | Linked workflow definition.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `triggereventpayload` | JSONB | NOT NULL | — | Stored event payload that triggered the run.  |
| `status` | TEXT | NOT NULL | — | Run state such as running, completed, or failed.  |
| `startedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the run started.  |
| `completedat` | TIMESTAMPTZ | NULL | — | When the run completed.  |
| `idempotencykey` | TEXT | NOT NULL | — | Prevents duplicate workflow execution for the same trigger.  |

- **Purpose:** Stores execution history of workflow automation runs. 
- **Written by:** M-08 workflow engine on event processing. 
- **Read by:** Frontend workflow-run history and debugging views. 

#### Table: `competitoralertconfigs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `configid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for alert config.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `competitornames` | JSONB | NOT NULL | — | List of competitor names to monitor.  |
| `alertchannels` | JSONB | NOT NULL | — | Delivery channels such as Slack or in-app.  |
| `minconfidence` | NUMERIC | NOT NULL | `0.7` | Minimum confidence required to alert.  |
| `createdby` | UUID | NOT NULL | — | User who created the config.  |

- **Purpose:** Stores tenant-level settings for competitor mention alerts. 
- **Written by:** M-08 alert configuration endpoints. 
- **Read by:** M-08 alert-processing workers for confidence gating and routing. 

#### Table: `competitoralerts`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `alertid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for alert instance.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `detectionid` | UUID | NOT NULL | — | Source tracker detection ID.  |
| `competitorname` | TEXT | NOT NULL | — | Competitor identified in the signal.  |
| `callid` | UUID | NULL | — | Related call ID.  |
| `dealid` | UUID | NULL | — | Related deal ID.  |
| `alertedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the alert was sent.  |
| `channelsnotified` | JSONB | NOT NULL | — | Channels that received the alert.  |

- **Purpose:** Stores emitted competitor mention alerts for audit and UI history. 
- **Written by:** M-08 alert workers after confidence and deduplication checks. 
- **Read by:** Frontend competitor alert timeline and audit views. 

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

The unique indexes on `workflowruns.idempotencykey` and `competitoralerts.detectionid` are important because the event bus can redeliver the same event, and M-08 is explicitly designed to avoid duplicate workflow runs and duplicate alerts. 

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

> Apply the same RLS pattern to `playenrollments`, `playstepcompletions`, `workflows`, `workflowruns`, `competitoralertconfigs`, and `competitoralerts`. 

---

### 7.8.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `tracker.detection.created` | Listens | When a detection may trigger a competitor alert or a rule-based workflow.  |
| `deal.stage.changed` | Listens | When a stage movement should trigger workflow automation or play enrollment.  |

M-08 does not emit a named public platform event in the current registry and is described mainly as a consumer-and-actor module. Internally it may create workflow state and alerts, but those actions remain inside its module boundary. 

---

### 7.8.6 Special Notes

- Competitor alerting includes an explicit confidence gate, and the system should not send alerts when `confidencescore` is below the configured `minconfidence`. 
- `steps`, `triggerconditions`, `branches`, `actions`, `competitornames`, `alertchannels`, `triggereventpayload`, and `channelsnotified` are all natural `JSONB` fields because they are highly configurable. 
- M-08 depends on M-03 APIs for deal and account context during play enrollment and workflow condition evaluation. 
- Slack is the only external dependency explicitly called out for this module, with retry and in-app fallback behavior for alert delivery failures. 
- This module maps to Orchestrate, Workflow Automation, and Competitor Mention Alerts in the feature map. 

---

## 📦 MODULE: M-09 Forecasting — Schema: `forecasting`

### 7.9.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-09  |
| Module Name | Forecasting  |
| Schema Name | `forecasting`  |
| Phase | Phase 3  |
| Owner | [Developer Name] |
| Description | Stores forecast periods, user submissions, AI forecast snapshots, pipeline coverage metrics, and historical conversion rates so revenue teams can model and review expected revenue.  |

M-09 turns live pipeline state into forward-looking revenue projections and collaborative forecast submissions. It reacts to deal-stage movement from M-03, combines that with historical conversion behavior and current pipeline coverage, and then publishes forecast submissions for downstream performance analysis. 

---

### 7.9.2 Tables in This Schema

#### Table: `forecastperiods`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `periodid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for forecast period.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Period name such as Q2 FY2026.  |
| `startdate` | DATE | NOT NULL | — | Period start date.  |
| `enddate` | DATE | NOT NULL | — | Period end date.  |
| `revenuetarget` | NUMERIC | NULL | — | Revenue target for the period.  |
| `islocked` | BOOLEAN | NOT NULL | `FALSE` | Whether submissions are locked.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores forecasting windows and targets. 
- **Written by:** M-09 forecast configuration flows. 
- **Read by:** Forecast boards, submission endpoints, and AI forecast jobs. 

#### Table: `forecastsubmissions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `submissionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for forecast submission.  |
| `periodid` | UUID | NOT NULL | — | Related forecast period.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User who submitted the forecast.  |
| `submittedamount` | NUMERIC | NOT NULL | — | Forecast amount submitted by the user.  |
| `dealids` | JSONB | NULL | — | Deals included in the submission.  |
| `submittedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time of submission.  |
| `version` | INTEGER | NOT NULL | `1` | Incremented on resubmission in the same period.  |

- **Purpose:** Stores collaborative forecast submissions from reps or managers. 
- **Written by:** M-09 submission endpoints. 
- **Read by:** Forecast boards, rollups, and downstream performance analysis. 

#### Table: `aiforecastsnapshots`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `snapshotid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for AI forecast snapshot.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `periodid` | UUID | NOT NULL | — | Related forecast period.  |
| `predictedamount` | NUMERIC | NOT NULL | — | AI-predicted revenue for the period.  |
| `confidencerangelow` | NUMERIC | NULL | — | Lower bound of prediction range.  |
| `confidencerangehigh` | NUMERIC | NULL | — | Upper bound of prediction range.  |
| `modelinputs` | JSONB | NOT NULL | — | Audit trail of model inputs used.  |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Snapshot computation time.  |
| `idempotencykey` | TEXT | NOT NULL | — | Prevents duplicate snapshots for the same trigger.  |

- **Purpose:** Stores AI-generated forecast outputs for audit and trend comparison. 
- **Written by:** M-09 forecast computation jobs. 
- **Read by:** Forecast UI and historical performance analysis. 

#### Table: `pipelinecoveragemetrics`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `metricid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for coverage metric row.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `periodid` | UUID | NOT NULL | — | Related forecast period.  |
| `pipelinevalue` | NUMERIC | NOT NULL | — | Total open pipeline value for the period.  |
| `coverageratio` | NUMERIC | NULL | — | Pipeline-to-target ratio.  |
| `opendealcount` | INTEGER | NULL | — | Number of open deals in coverage.  |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Time metrics were computed.  |
| `idempotencykey` | TEXT | NOT NULL | — | Prevents duplicate metric rows per trigger.  |

- **Purpose:** Stores pipeline coverage calculations used in forecast review. 
- **Written by:** M-09 forecasting calculations and scheduled recompute jobs. 
- **Read by:** Forecast boards and manager review views. 

#### Table: `historicalconversionrates`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `rateid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for conversion-rate row.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `fromstage` | TEXT | NOT NULL | — | Source stage in the conversion path.  |
| `tostage` | TEXT | NOT NULL | — | Destination stage in the conversion path.  |
| `conversionrate` | NUMERIC | NOT NULL | — | Calculated conversion rate from 0.0 to 1.0.  |
| `samplesize` | INTEGER | NULL | — | Number of deals used for the rate.  |
| `computedfromperiod` | TEXT | NULL | — | Lookback basis such as last 6 months.  |
| `lastcomputedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last recomputation time.  |

- **Purpose:** Stores historical stage-conversion rates used in AI and weighted forecasting logic. 
- **Written by:** M-09 periodic analytics jobs. 
- **Read by:** AI forecast calculations and forecasting review views. 

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

These indexes support forecast period browsing, latest-user-submission lookup, idempotent snapshot generation, and fast conversion-rate retrieval for projection logic. 

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

> Apply the same RLS pattern to `forecastsubmissions`, `aiforecastsnapshots`, `pipelinecoveragemetrics`, and `historicalconversionrates`. 

---

### 7.9.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `deal.stage.changed` | Listens | When pipeline movement should update projections and coverage assumptions.  |
| `forecast.submitted` | Emits | After a user forecast submission is saved.  |

M-09 is upstream of M-10 Performance Coaching because forecast submission activity and forecast accuracy outcomes are later used in dashboarding and coaching experiences. 

---

### 7.9.6 Special Notes

- This module is documented as using TypeScript business logic with ClickHouse aggregations rather than AI-service inference for its main projection workflows. 
- `dealids` and `modelinputs` are natural `JSONB` fields because they store structured but variable sets of input data. 
- Both `aiforecastsnapshots` and `pipelinecoveragemetrics` require idempotency keys to prevent duplicate rows when the same upstream trigger is retried. 
- Forecasting maps directly to AI Revenue Predictor and Forecast Boards in the product feature map. 
- The platform also references `forecastaccuracylog` in analytics/event documentation, so if you want strict completeness later, we may add it as an auxiliary forecasting table for period-close and accuracy tracking. 

## 📦 MODULE: M-10 Performance Coaching — Schema: `dashboards`

### 7.10.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | M-10  |
| Module Name | Performance Coaching  |
| Schema Name | `dashboards`  |
| Phase | Phase 3, last module in the rollout order  |
| Owner | [Developer Name] |
| Description | Stores dashboard configuration and coaching/trainer data used for revenue dashboards and rep-performance views.  |

M-10 is the analytics and coaching surface of the platform. It consumes scored calls from M-04 and forecast submissions from M-09, reads large event volumes through ClickHouse for dashboard speed, and falls back to PostgreSQL aggregates if ClickHouse is unavailable. 

---

### 7.10.2 Tables in This Schema

The M-10 schema follows the same full table-definition style as M-01 through M-09. The definitions below align with the SAD table set for dashboard configuration, coaching snapshots/recommendations, and trainer scenarios/sessions. 

#### Table: `dashboardconfigs`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `configid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for a saved dashboard configuration.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User owning this dashboard configuration.  |
| `layout` | JSONB | NOT NULL | — | Layout configuration for dashboard widgets.  |
| `visiblewidgets` | JSONB | NULL | — | Widget visibility/preferences payload.  |
| `daterangedefault` | TEXT | NULL | — | Default date range used in the dashboard.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Saves user- or tenant-level dashboard layout and filter preferences for revenue dashboards. 
- **Written by:** M-10 dashboard configuration endpoints/UI. 
- **Read by:** Revenue dashboard frontend loads. 

#### Table: `coachingsnapshots`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `snapshotid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for coaching snapshot.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User the coaching snapshot was computed for.  |
| `period` | TEXT | NOT NULL | — | Snapshot period key such as weekly or monthly.  |
| `talkratio` | NUMERIC | NULL | — | Talk ratio KPI for the period.  |
| `longestmonologue` | NUMERIC | NULL | — | Longest monologue duration KPI.  |
| `questionrate` | NUMERIC | NULL | — | Question-rate KPI.  |
| `interactivity` | NUMERIC | NULL | — | Interactivity KPI.  |
| `toptopics` | JSONB | NULL | — | Top topics payload used for coaching context.  |
| `callcount` | INTEGER | NULL | — | Number of calls included in the snapshot.  |
| `computedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when snapshot was computed.  |

- **Purpose:** Stores pre-computed coaching aggregates so dashboards and coaching pages load quickly. 
- **Written by:** M-10 aggregation jobs over ClickHouse or PostgreSQL fallback logic. 
- **Read by:** Revenue dashboards, coaching views, and performance reporting pages. 

#### Table: `coachingrecommendations`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `recid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for recommendation row.  |
| `snapshotid` | UUID | NOT NULL | — | Linked coaching snapshot.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User the recommendation is generated for.  |
| `recommendationtext` | TEXT | NOT NULL | — | Natural-language coaching recommendation.  |
| `category` | TEXT | NULL | — | Recommendation category such as questioning or pacing.  |
| `confidencescore` | NUMERIC | NULL | — | Confidence score for recommendation quality.  |
| `generatedat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Timestamp when recommendation was generated.  |

- **Purpose:** Stores generated coaching recommendations tied to coaching snapshots. 
- **Written by:** M-10 coaching generation workflows. 
- **Read by:** Coaching UI and rep performance guidance views. 

#### Table: `trainerscenarios`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `scenarioid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for trainer scenario.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `name` | TEXT | NOT NULL | — | Trainer scenario name.  |
| `personadescription` | TEXT | NULL | — | Persona details used during simulation.  |
| `context` | TEXT | NULL | — | Business context for the scenario.  |
| `difficulty` | TEXT | NULL | — | Difficulty level of scenario.  |
| `scorecardid` | UUID | NULL | — | Optional scorecard used to evaluate the session.  |
| `createdby` | UUID | NOT NULL | — | User who created the scenario.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

- **Purpose:** Stores trainer scenario definitions for role-play and practice experiences. 
- **Written by:** M-10 trainer setup and admin flows. 
- **Read by:** Trainer session launch flows and coaching setup UI. 

#### Table: `trainersessions`

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `sessionid` | UUID | NOT NULL | `gen_random_uuid()` | Primary key for trainer session.  |
| `scenarioid` | UUID | NOT NULL | — | Scenario used for this session.  |
| `tenantid` | UUID | NOT NULL | — | Tenant isolation key.  |
| `userid` | UUID | NOT NULL | — | User completing the trainer session.  |
| `conversation` | JSONB | NOT NULL | — | Conversation transcript payload for the practice session.  |
| `scorecardresult` | JSONB | NULL | — | Structured scorecard output for the session.  |
| `status` | TEXT | NOT NULL | — | Session state such as in_progress or completed.  |
| `completedat` | TIMESTAMPTZ | NULL | — | Completion timestamp if session is finished.  |
| `createdat` | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation time.  |

---

### 7.10.3 Indexes

These indexes follow tenant-first access for dashboard loading, coaching snapshots, recommendation retrieval, and trainer workflows: 

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

These follow the global migration rule that every new table should include at least one index on `tenantid` plus the primary query key. 

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

> Apply the same tenant-isolation pattern to `coachingsnapshots`, `coachingrecommendations`, `trainerscenarios`, and `trainersessions`, because the architecture states that every tenant-scoped table in every schema must enforce RLS. 

---

### 7.10.5 Events This Module Listens To / Emits

| Event Name | Direction | Trigger |
|------------|-----------|---------|
| `call.scored` | Listens | When new call-review results are available for coaching and score analytics.  |
| `forecast.submitted` | Listens | When forecast activity should update dashboard and performance views.  |

M-10 does not emit a named platform event in the event registry excerpt provided. It is primarily a consumer for analytics and coaching experiences. 

---

### 7.10.6 Special Notes

- M-10 uses ClickHouse for high-volume analytical queries and is the only module explicitly called out as depending on ClickHouse for dashboard performance at scale. 
- Replicated event streams for M-10 analytics include `callevents`, `activityevents`, `callscoreevents`, `trackerdetectionevents`, and `forecastsubmissionevents`. 
- If ClickHouse is down, M-10 falls back to PostgreSQL aggregates, so dashboards may become slower but should remain available. 
- This module maps to Revenue Dashboards and Sales Coaching Insights in the feature map. 

---

## 📦 MODULE: Platform Core — Schema: `public`

### 7.11.1 Module Overview

| Field | Value |
|-------|-------|
| Module ID | Platform Core  |
| Module Name | CoreModule / Platform Core  |
| Schema Name | `public`  |
| Phase | Cross-cutting foundation used by all modules, not sold as a standalone product module  |
| Owner | Platform / Core team |
| Description | Stores identity, tenancy, RBAC, audit, feature flags, integrations, and shared infrastructure services like auth, API gateway, event bus, and CI/CD support.  |

Platform Core is the foundation every module depends on. It centralizes multi-tenancy, authentication, authorization, audit logging, feature flags, integration credentials, and shared event or warehouse plumbing so feature modules stay focused on business logic. 

---

### 7.11.2 Tables in This Schema

#### Table: `tenants`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `tenantid` | UUID PK | Tenant primary key.  |
| `name` | TEXT | Customer organization name.  |
| `plan` | TEXT | Subscription plan.  |
| `status` | TEXT | Tenant status.  |
| `createdat` | TIMESTAMPTZ | Tenant creation time.  |
| `complianceconfig` | JSONB or config payload | Tenant-level compliance configuration is referenced in the architecture summary.  |

- **Purpose:** One row per customer organization using the platform. 
- **Written by:** Platform Core tenant-management flows. 
- **Read by:** All modules indirectly through tenant context and admin tooling. 

#### Table: `users`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `userid` | UUID PK | User primary key.  |
| `tenantid` | UUID NOT NULL | Tenant isolation key.  |
| `supabaseuserid` | UUID / external auth ref | Auth-provider user mapping.  |
| `email` | TEXT | User email.  |
| `fullname` / `name` | TEXT | Display name.  |
| `avatarurl` | TEXT | User avatar URL.  |
| `status` | TEXT | User status.  |
| `createdat` | TIMESTAMPTZ | Creation timestamp.  |

- **Purpose:** Stores all platform users across tenants. 
- **Written by:** Auth and user-provisioning flows in Platform Core. 
- **Read by:** RBAC, UI personalization, ownership fields, and audit flows. 

#### Table: `roles`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `roleid` | UUID PK | Role primary key.  |
| `tenantid` | UUID NOT NULL | Tenant isolation key.  |
| `name` | TEXT | Role name such as AE, SDR, Manager, Admin, or RevOps.  |
| `permissions` | JSONB | Permission set for the role.  |

- **Purpose:** Stores per-tenant role definitions for RBAC. 
- **Written by:** Platform Core role-management flows. 
- **Read by:** Guards, interceptors, and frontend authorization logic. 

#### Table: `userroles`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `userid` | UUID | Linked user.  |
| `roleid` | UUID | Linked role.  |
| `tenantid` | UUID NOT NULL | Tenant isolation key.  |
| `assignedat` | TIMESTAMPTZ | When the role was assigned.  |

- **Purpose:** Maps users to roles within a tenant. 
- **Written by:** Platform Core RBAC flows. 
- **Read by:** Authorization checks across all modules. 

#### Table: `auditlogs`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `logid` | UUID PK | Audit log primary key.  |
| `tenantid` | UUID | Tenant scope.  |
| `userid` | UUID | Acting user.  |
| `action` | TEXT | Performed action.  |
| `entitytype` / `resource` | TEXT | Entity or resource type acted on.  |
| `entityid` | UUID | Specific entity acted on.  |
| `payload` / `metadata` | JSONB | Extra immutable audit details.  |
| `createdat` | TIMESTAMPTZ | Log creation time.  |

- **Purpose:** Immutable audit trail for write operations across the platform. 
- **Written by:** `AuditService.log` in Platform Core, not directly by feature modules. 
- **Read by:** Admin audit screens, compliance flows, and investigation workflows. 

#### Table: `featureflags`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `flagid` | UUID PK | Feature flag primary key.  |
| `tenantid` | UUID NOT NULL | Tenant isolation key.  |
| `flagname` | TEXT | Feature flag name.  |
| `isenabled` | BOOLEAN | Whether the feature is enabled.  |
| `config` | JSONB | Optional rollout or flag configuration.  |

- **Purpose:** Stores tenant-level feature flag overrides for gradual rollout. 
- **Written by:** Platform Core rollout or admin tooling. 
- **Read by:** All modules during feature gating. 

#### Table: `integrations`

| Column | Data Type / Shape | Description |
|--------|-------------------|-------------|
| `integrationid` | UUID PK | Integration primary key.  |
| `tenantid` | UUID NOT NULL | Tenant isolation key.  |
| `platform` | TEXT | External platform name, such as CRM, conferencing, or email.  |
| `credentialsencrypted` | TEXT / encrypted blob | Encrypted external credentials.  |
| `status` | TEXT | Connection state.  |
| `lastconnectedat` | TIMESTAMPTZ | Last successful connection timestamp.  |

- **Purpose:** Stores connected external-system credentials and connection state. 
- **Written by:** Platform Core integration setup flows. 
- **Read by:** Modules that need delegated access to CRM, conferencing, and email providers via approved services. 

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

These indexes follow the documented platform rule that new tables should have a tenant-based access path plus the main lookup key. 

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

> Apply the same policy shape to `roles`, `userroles`, `featureflags`, and `integrations`. `auditlogs` may remain platform-controlled with stricter insert rules because modules are explicitly forbidden from writing to it directly. 

---

### 7.11.5 Core Rules

- No module may import a CoreModule table directly just to bypass boundaries; modules receive `tenantid` through interceptors and shared auth context. 
- No feature module may write directly to `auditlogs`; they must use `AuditService.log`. 
- No module may implement custom auth logic because JWT auth and guards belong to Platform Core. 
- The public schema is read-only for feature modules, and no module other than Platform Core may write to the public schema. 
- Direct cross-schema SQL joins are not allowed in application code, except for a documented M-03 view-based exception approved by the Tech Lead. 

---

### 7.11.6 Shared Infrastructure Notes

- Platform Core also contains the DataWarehouse sub-module that writes selected event streams into ClickHouse using BullMQ workers and the `clickhouse-client` library. Those writes are fire-and-forget and never block primary business flows. 
- Shared platform capabilities called out in the feature map include Auth, API Gateway, Event Bus, and CI/CD. 
- The system-wide multi-tenancy rule requires `tenantid UUID NOT NULL` in tenant-scoped tables, usually as the second column after the primary key. 
- Prisma middleware sets the tenant context for every query, and PostgreSQL RLS enforces the same isolation at the database layer. 


## PART 8 — ClickHouse Analytics Tables (M-10 only)

### 8.1 What Goes Into ClickHouse

| ClickHouse Table | Source (PostgreSQL) | Replication Method | Retention |
|---|---|---|---|
| `callevents` | `transcription.calls`  | CDC via Debezium -> Kafka -> ClickHouse  | 24 months  |
| `activityevents` | `revenuegraph.activities`  | CDC  | 24 months  |
| `callscoreevents` | `conversation.callreviews`  | CDC  | 24 months  |
| `trackerdetectionevents` | `conversation.trackerdetections`  | CDC  | 24 months  |
| `forecastsubmissionevents` | `forecasting.forecastsubmissions`  | CDC  | 24 months  |

For M-10, ClickHouse is used only for analytics-heavy dashboard and coaching queries over large time-series datasets, not as the source of truth. PostgreSQL remains the source of truth, while ClickHouse acts as the fast analytical read store for Revenue Dashboards and Sales Coaching Insights. 

### 8.2 Event-to-ClickHouse Write Shape

The architecture also documents the row shape written into these ClickHouse tables:

- `callevents`: `tenantid, callid, userid, duration, sourceplatform, participantcount, occurredat` 
- `activityevents`: `tenantid, activityid, dealid, contactid, activitytype, channel, occurredat` 
- `callscoreevents`: `tenantid, userid, scorecardid, totalscore, talkratio, questionrate, scoredat` 
- `trackerdetectionevents`: `tenantid, trackerid, callid, dealid, trackertype, confidencescore, detectedat` 
- `forecastsubmissionevents`: `tenantid, submissionid, periodid, userid, commitamount, submittedat` 

These writes are handled by a dedicated BullMQ worker inside the Platform Core `DataWarehouseModule`, which subscribes to the relevant events, transforms the payload, and inserts rows using the `clickhouse-client` Node.js library. 

### 8.3 How Data Reaches ClickHouse

The documented trigger path is event-driven:

- `call.transcription.completed` -> write to `callevents` 
- `activity.logged` -> write to `activityevents` 
- `call.scored` -> write to `callscoreevents` 
- `tracker.detection.created` -> write to `trackerdetectionevents` 
- `forecast.submitted` -> write to `forecastsubmissionevents` 

The worker behavior is explicitly fire-and-forget, meaning ClickHouse insertion failure must not break the primary transactional workflow. Instead, the system logs the failure to Sentry and continues, because dashboard freshness is less critical than core product correctness. 

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

This is the exact kind of query M-10 runs in ClickHouse because PostgreSQL becomes inefficient for repeated large-window aggregations across millions of rows. Query results are also cached in Redis for 5 minutes to reduce repeated dashboard load pressure. 

### 8.5 Fallback Rule

If ClickHouse is down, M-10 falls back to PostgreSQL aggregates and logs a Sentry alert. Dashboard data may become slower or temporarily stale, but dashboards should not become unavailable. 


## PART 9 — pgvector Embedding Tables (M-06 only)

### 9.1 Vector Tables

For M-06, the architecture-level canonical table is `summaries.semanticembeddings`, which stores embeddings used for semantic search and RAG retrieval. Its documented key columns are `embeddingid`, `tenantid`, `entitytype`, `entityid`, `embedding VECTOR(1536)`, `modelversion`, and `createdat`. 

The pgvector note explicitly states:

- Dimension: `1536` 
- Model alignment: OpenAI `text-embedding-3-small` 
- Index type: `IVFFlat` 
- Distance operator: cosine distance 

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

The document also shows older implementation examples using `transcriptembeddings` and `emailembeddings`, but the consolidated schema summary makes `semanticembeddings` the canonical M-06 table for transcripts, summaries, and emails. 

### 9.2 Embedding Generation Flow

Embeddings are created when new searchable text content is produced and must become available for semantic retrieval. The architecture explicitly documents one guaranteed trigger: `call.transcription.completed`, after which M-06 chunks transcript text and sends it to the AI Services Layer `POST /v1/embed`, then stores the returned vectors. 

The document also states that outbound email content is embedded after `email.sent`, and that M-05 sends email body text to `POST /v1/embed` for storage. In the consolidated M-06 schema, those embeddings are represented under `semanticembeddings` with `entitytype` values such as transcript chunk, summary, brief, or email. 

So the clean flow is:

1. A source event occurs, most clearly `call.transcription.completed`. 
2. M-06 fetches transcript text and chunks it into embedding-sized segments. 
3. M-06 calls AI Services Layer `POST /v1/embed` with the text chunks. 
4. The returned vectors are stored in `semanticembeddings`. 
5. Later, Ask Anything and deep-research flows query this table for semantic retrieval. 

The architecture also adds a re-embedding rule: when a summary or brief is regenerated with a higher version, the old embedding row is deleted and a new one is inserted so RAG does not use stale content. 

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

- `embedding <=> :query_embedding` computes cosine distance between stored vectors and the query vector. 
- Lower distance means more semantically similar results, so ordering ascending returns the best matches first. 
- `1 - distance` is used to display a human-friendly similarity score. 
- `tenantid = :tenant_id` is mandatory for multi-tenant isolation. 

The more advanced RAG query pattern in the architecture uses `semanticembeddings` plus business filters, such as limiting to transcript chunks from the last 3 calls for a target account before ranking by vector similarity. That pattern is what M-06 uses for grounded Ask Anything responses. 

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
- Searches only within the current tenant. 
- Restricts to transcript chunks, though the same table can also store summaries, deal briefs, account briefs, and emails. 
- Uses cosine distance through pgvector for semantic ranking. 
- Returns the top 20 most relevant chunks to feed into RAG or semantic search UI. 


## PART 10 — Migration Rules & Checklist

### 10.1 Migration Naming Convention

Use this naming format for every migration file: 

```text
YYYYMMDDHHMMSS_module_description.sql
```

Example: 

```text
20260416143000_ingestion_add_confidence_score_to_calls.sql
```

The architecture document shows the same convention without spaces and explains that the timestamp must come first, followed by the module name and a short action-oriented description. This keeps migrations sortable, traceable, and easy to review in deployment order. 

### 10.2 Migration Rules

All database migrations must use Prisma Migrate, and the following rules are mandatory across the platform. 

1. **One migration per module per PR.** A migration file must touch only the schema owned by the module being changed, never another module’s schema.   
2. **Never drop a column in production.** If a column is no longer used, mark it with a `-- DEPRECATED: reason, date` comment and schedule actual removal for the next major version. The architecture warns that dropping columns without a deprecation period can break deployed services.   
3. **All new tables must include the platform minimums:** `UUID PRIMARY KEY`, `tenantid UUID NOT NULL` as the second column, `createdat TIMESTAMPTZ DEFAULT NOW()`, and at least one index on `(tenantid, primary_lookup_column)`.   
4. **Follow the naming convention exactly.** Migration filenames must use the `YYYYMMDDHHMMSS_module_description.sql` pattern so they remain consistent and sortable.   
5. **Tech Lead review is mandatory.** No migration should merge to main or run in production without explicit Tech Lead sign-off.   
6. **RLS must remain enforced.** The architecture states that RLS is defined on every table in every schema, and any migration that disables RLS or changes forced RLS behavior requires Tech Lead review with written justification.   
7. **Do not violate schema ownership.** If your change needs data from another module, use that module’s API or event contract instead of editing its schema through your migration.   

### 10.3 Pre-Merge Checklist (for Freshers)

Use this checklist before raising a PR for any schema or migration change. It is aligned directly with the architecture rules and written in a simpler review-friendly form. 

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

If you are new, remember these four “must-never-miss” checks before submitting a migration: tenant isolation, correct schema ownership, RLS, and Tech Lead review. In simple words, your migration should only change your module’s tables, every tenant row must stay isolated, and nothing should reach production unless the Tech Lead signs off. 


## PART 11 — Glossary

| Term | Meaning |
|---|---|
| **Schema** | A namespace inside PostgreSQL that groups related tables under one module boundary, such as `transcription`, `conversation`, `summaries`, or `forecasting`. The architecture uses schema ownership to enforce module boundaries.  |
| **RLS** | Row Level Security. A PostgreSQL database-level rule system that filters rows by `tenantid` before data is returned, even if application code forgets to add the tenant filter. In this platform, RLS is enabled on every table in every schema.  |
| **tenantid** | The organisation’s unique identifier. Every tenant-scoped row belongs to exactly one tenant, and `tenantid UUID NOT NULL` is mandatory on almost every table as the second column after the primary key.  |
| **UUID** | Universally Unique Identifier. A random, hard-to-guess ID used as the primary key instead of auto-increment integers, because the architecture standard requires `UUID PRIMARY KEY` for all new tables.  |
| **CDC** | Change Data Capture. A replication pattern that streams database changes from PostgreSQL into analytical systems like ClickHouse, usually through Debezium and Kafka in this architecture.  |
| **pgvector** | A PostgreSQL extension used to store and search embedding vectors for semantic search and RAG. In this platform it stores vectors like `VECTOR(1536)` and supports cosine-distance search with IVFFlat indexing.  |
| **Migration** | A versioned database change file managed through Prisma Migrate that creates, alters, or indexes tables in a controlled and reviewable way.  |
| **ClickHouse** | A columnar analytics database used only for M-10 dashboard and coaching queries where large aggregations would be too slow in PostgreSQL at scale. PostgreSQL remains the source of truth.  |
| **BullMQ** | The internal event bus and job queue system built on Redis. Modules use it for asynchronous events like `call.transcription.completed`, `tracker.detection.created`, and `forecast.submitted`.  |
| **Debezium** | A CDC tool that captures PostgreSQL row changes and helps stream them into Kafka and then ClickHouse for analytics replication.  |
| **Kafka** | The event-stream transport layer used in the CDC pipeline between PostgreSQL change capture and ClickHouse ingestion.  |
| **Tech Lead sign-off** | A mandatory review and approval step required before migrations, architecture changes, or platform-level document changes can be merged or promoted to production.  |
| **Module ownership** | The rule that each module owns only its own schema and may write only to that schema. If another module needs data, it must use that module’s API or event contract instead of direct table writes.  |
| **Cross-schema read** | Reading data owned by another module. This is tightly controlled and normally allowed only through APIs or documented exceptions, never through casual direct joins in application code.  |
| **IVFFlat** | The vector index type used by pgvector in this architecture for faster approximate nearest-neighbor search over embeddings.  |
| **Cosine distance** | The similarity operator used to compare embeddings in semantic search queries. Lower cosine distance means two vectors are more semantically similar.  |
| **Prisma Middleware** | Application-layer query interception that automatically adds `tenantid` filtering to database operations before they reach PostgreSQL. It works together with RLS as defense in depth.  |
| **Tenant isolation** | The platform rule that one customer’s data must never be visible to another customer. Here it is enforced by JWT tenant claims, Prisma middleware, and PostgreSQL RLS together.  |
| **Source of truth** | The system that holds the authoritative version of data. In this architecture, PostgreSQL is the source of truth, while ClickHouse and Meilisearch are optimized read stores.  |
| **Fire-and-forget write** | A non-blocking secondary write where failure should not break the main workflow. ClickHouse analytics writes follow this pattern, and failures are logged to Sentry instead.  |



