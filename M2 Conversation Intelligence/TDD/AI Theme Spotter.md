# Doc #11c — TDD: AI Theme Spotter

## 1. Document Control

- **Document title:** Technical Design Document — AI Theme Spotter 
- **Feature name:** AI Theme Spotter 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-04 Conversation Intelligence 
- **Internal architecture placement:** Primary ownership is in M-04 because theme detection is part of the Conversation Intelligence responsibility that analyzes completed call transcripts to detect recurring themes, trends, objections, and insights across calls. 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Tech Lead / Conversation Intelligence squad 
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Module note:** For product planning and business-facing documentation, AI Theme Spotter is grouped under **M2 Conversation Intelligence pack**.   
> **Architecture note:** Internal implementation ownership remains in **M-04 Conversation Intelligence**, where theme analyses, themes, and related batch jobs are stored and executed. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Architecture view owner:** M-04 Conversation Intelligence. 
- **Primary pattern:** This is a batch-style, long-running analysis workflow over large call sets rather than a per-call synchronous feature. 

---

## 2. Purpose

AI Theme Spotter analyzes customer conversations at scale to detect recurring themes, trends, objections, and insights that are not visible at an individual call level.   
Its purpose is to help teams move from single-call understanding to pattern detection across many calls, accounts, reps, segments, or time ranges. 

This feature belongs in M2 because it is part of the Conversation Intelligence layer that helps users understand what is happening across conversations, not just inside one transcript.   
The main value is for managers, RevOps, product teams, and leadership who need trend-level insight from large datasets of call activity. 

### Business problem

- Individual calls show isolated signals, but leadership needs repeated patterns across many conversations. 
- Teams need a way to ask business questions such as “What objections are increasing?” or “What themes appear in renewal-risk calls?” and get grouped answers from many calls. 
- Large-scale conversation analysis must be asynchronous, trackable, and exportable because it runs over large datasets. 

### What the feature does

- Creates a theme-analysis job based on a business question and selected filters. 
- Loads a filtered set of calls and transcript embeddings. 
- Clusters similar transcript passages into proto-themes. 
- Uses LLM synthesis to name and summarize each theme. 
- Enriches themes with counts and revenue-related metadata. 
- Stores job status and result outputs for later viewing, export, and drill-down. 

---

## 3. Scope

### In scope

- Batch creation of theme-analysis jobs. 
- Filtering a call dataset by tenant and user-selected business filters. 
- Embedding-based clustering of relevant transcript passages. 
- LLM-based synthesis of cluster labels and summaries. 
- Storage of analysis jobs in `themeanalyses` and resulting clusters in `themes`. 
- Read APIs for viewing results. 
- Explicit job states such as queued, running, completed, and failed. 

### Out of scope

- Real-time theme generation during a live call. 
- Single-call topic tagging, which belongs to AI Topic Tagger. 
- Intent-tracker detection, which belongs to Smart Tracking. 
- Dashboard-specific charting implementation details. 
- Warehouse-level analytics exports beyond product feature exports. 

### Assumptions

- Relevant transcripts already exist in the platform. 
- Transcript chunk embeddings are available or can be generated through approved embedding workflows. 
- Theme Spotter is invoked as an async batch job because the dataset can include up to 500 calls in the documented agent flow. 
- Tenant isolation and row-level access controls are enforced for all selected data and outputs. 

### Upstream dependencies

- M-01 transcription pipeline must already have completed and stored transcripts. 
- M-03 Revenue Graph context can be used for account, deal, and revenue enrichment. 
- AI services layer provides theme-detection and synthesis capabilities. 
- Embedding availability is required for clustering-based theme generation. 

### Downstream usage

- Frontend users view a completed theme analysis via results APIs. 
- Product teams can drill down from a theme to supporting calls and filters. 
- Export workflows can package results for analysis outside the immediate screen flow. 

---

## 4. Users and Triggers

### Primary users

- Sales managers looking for repeated objections or coaching patterns. 
- RevOps users analyzing trends by segment, rep, or stage. 
- Product and leadership teams looking for market, pricing, and product-feedback patterns. 

### Trigger type

- This is a user-initiated async batch workflow, not an automatic event after every call. 

### Entry points

- `POST /api/v1/conversation-intelligence/theme-analyses` to create a new analysis job. 
- `GET /api/v1/conversation-intelligence/theme-analyses/:id` to fetch results and status. 

### Preconditions

- User must have permission to create tenant-level theme analyses. 
- Filter payload must be valid and tenant-safe. 
- There must be enough matching call data for meaningful clustering and synthesis. 

---

## 5. Functional Flow

### Happy path

1. An authorized user submits a business question and dataset filters.   
2. M-04 creates a `themeanalyses` record with initial status `queued`.   
3. A BullMQ-backed async job starts processing the analysis.   
4. The system loads the filtered call set and fetches transcript chunk embeddings.   
5. Clustering groups similar transcript passages into proto-themes.   
6. For each cluster, the system samples central passages and calls the LLM to name and summarize the theme.   
7. The system enriches each theme with metadata such as call count, account count, and associated revenue.   
8. The resulting themes are written to `themes`, linked to the parent `themeanalyses` record.   
9. The analysis status is updated to `completed`, and results become available through the read API. 

### Alternate paths

- If the dataset is small, the system still creates a formal analysis job and returns a completed-but-small result set rather than bypassing job tracking. 
- If clustering produces few strong clusters, the system may return fewer themes rather than forcing weak synthetic groups. 
- If filters are valid but no calls match, the job should complete with zero analyzed calls and no themes rather than fail. 

### Failure paths

- Invalid filters or unauthorized access cause create-time request rejection. 
- AI synthesis or embedding/clustering failures move the analysis to `failed` with diagnostics logged for support teams. 
- Partial cluster synthesis failures may either retry per cluster or fail the full job, depending on implementation policy. 

### Design principle

- Because this is a batch feature across large call sets, job status, progress, and final outputs must be explicit and queryable. 

---

## 6. Inputs and Outputs

### Inputs

- `tenantId` 
- `businessQuestion` 
- `filters` JSON object, such as date range, rep, deal stage, or account segment. 
- Matching transcript passages and embeddings. 

### Output records

- `themeanalyses` stores the parent analysis job record. 
- `themes` stores each synthesized theme linked to the analysis. 

### APIs exposed

- `POST /api/v1/conversation-intelligence/theme-analyses` creates the job. 
- `GET /api/v1/conversation-intelligence/theme-analyses/:id` returns results of a theme analysis. 

### AI endpoints involved

- `POST /v1/detect-themes` is listed as the AI service capability for theme analysis. 
- LLM-based synthesis is used to name and summarize clusters. 

### User-visible outputs

- Analysis status. 
- Total calls analyzed. 
- List of themes with summaries and counts. 
- Drill-down into supporting call sets and filtered subsets. 
- Export-ready result structures. 

---

## 7. Data Model

### Tables used

- `themeanalyses` stores analysis job metadata. 
- `themes` stores clustered theme outputs. 
- Transcript/embedding stores provide analysis input data. 

### Fields owned

#### `themeanalyses`
- `analysisid` 
- `tenantid` 
- `businessquestion` 
- `filters` JSONB 
- `status` (`queued`, `running`, `completed`, `failed`) 
- `createdby` 
- `createdat` 
- `callcountanalyzed` is referenced in schema summary as a useful result field for analysis jobs. 

#### `themes`
- `themeid` 
- `analysisid` 
- `tenantid` 
- `name` 
- `summary` 
- `callcount` 
- `accountcount` 
- `associatedrevenue` 

### Required indexes

- `idxThemeAnalysesTenantStatus` on tenant, status, and created time supports listing and monitoring jobs. 

### Validation rules

- Every analysis and theme row must include `tenantid`. 
- Filters must be valid JSON and limited to supported filter keys. 
- Theme rows must always reference a parent `analysisid`. 

### Idempotency notes

- Re-submitted identical jobs should not accidentally overwrite prior completed analyses unless explicit rerun behavior is defined. 
- Worker retries must avoid duplicate theme rows for the same analysis. 

---

## 8. AI Processing

### AI task performed

AI Theme Spotter is a two-stage analytical workflow: first it clusters similar transcript passages, then it uses an LLM to synthesize a human-readable theme name and summary for each cluster. 

### Architecture-defined agent behavior

The architecture describes a ThemeSpotterAgent that clusters a batch of calls, up to 500, around business questions using embedding similarity and LLM-based theme synthesis.   
The documented model path uses embeddings for clustering and `gpt-4o` for theme synthesis. 

### Processing nodes

- `loadcallbatch`: filter calls by tenant, date range, and user-selected criteria, then fetch transcript chunk embeddings. 
- `clusterembeddings`: run k-means clustering on transcript embeddings with auto-selected `k`. 
- `synthesizethemes`: sample top central passages from each cluster and ask the LLM to name and summarize the common theme. 
- `enrichwithmetadata`: count distinct calls, accounts, deals, and revenue-linked context. 
- `storeresults`: write theme outputs and mark the analysis complete. 

### Input payload

Recommended create-job payload:

```json
{
  "businessQuestion": "What objections are appearing most often in late-stage deals?",
  "filters": {
    "dateRange": {
      "from": "2026-03-01",
      "to": "2026-03-31"
    },
    "dealStage": ["proposal", "negotiation"],
    "accountSegment": ["enterprise"],
    "ownerUserIds": ["uuid-1", "uuid-2"]
  }
}
```

This aligns with the architecture, which stores `businessquestion` and filter JSON in `themeanalyses`. 

### Output schema

Recommended result payload:

```json
{
  "analysisId": "uuid",
  "status": "completed",
  "callCountAnalyzed": 184,
  "themes": [
    {
      "themeId": "uuid",
      "name": "Pricing pushback",
      "summary": "Buyers repeatedly questioned budget fit, discounting, and ROI justification.",
      "callCount": 63,
      "accountCount": 41,
      "associatedRevenue": 1825000
    },
    {
      "themeId": "uuid",
      "name": "Security review delays",
      "summary": "Multiple deals slowed because procurement and security review steps were unclear or unresolved.",
      "callCount": 27,
      "accountCount": 19,
      "associatedRevenue": 910000
    }
  ]
}
```

### Batch-processing note

- This is intentionally a long-running offline-style analysis flow, so correctness, status visibility, and resumable operations matter more than instant response time. 

---

## 9. Service and Integration Design

### Internal services

- **NestJS M-04 service:** owns API creation, job records, queue orchestration, persistence, and results APIs. 
- **Python AI services:** own theme clustering and synthesis logic. 
- **BullMQ + Redis:** manage async batch execution. 
- **Embedding pipeline:** supplies transcript embeddings for clustering. 

### Data systems involved

- PostgreSQL stores source-of-truth analysis records and themes. 
- pgvector-style embedding storage supports similarity-based clustering workflows. 

### Integration pattern

- Product services do not directly embed model-specific logic; they orchestrate approved Python AI endpoints and persist structured outputs. 

---

## 10. Security and Compliance

### Tenant isolation

All analysis jobs, filters, source calls, and stored results must remain tenant-scoped. 

### Access control

- Only authorized users should create theme analyses. 
- Read access to results must follow tenant RBAC and data-scope rules. 

### Sensitive data handling

- Theme analyses derive insight from transcripts and may expose recurring objections, pricing patterns, and sensitive commercial signals. 
- Exported outputs must preserve tenant boundaries and approved access patterns. 

### Audit logging

- Job creation, retries, cancellations if supported later, and exports should be audit logged. 

---

## 11. Error Handling

### Create-time validation errors

- Reject malformed filter payloads, unsupported filter keys, and empty invalid business questions. 

### Runtime job failures

- If loading embeddings, clustering, or synthesis fails, the job status must move to `failed`. 
- Diagnostics should be visible in logs and monitoring systems, not only in UI messaging. 

### Partial-result policy

- The safer default is to only mark `completed` when the full analysis pipeline finishes and results are stored consistently. 
- If future versions support partial completion, that should use an explicit status model rather than silently mixing complete and incomplete outputs. 

### Retry behavior

- Async retries should use BullMQ policies with bounded attempts and backoff. 
- Retried jobs must avoid duplicate themes or duplicate analysis-finalization updates. 

---

## 12. Observability

### Logs

Structured logs should include:

- `analysisId` 
- `tenantId` 
- Job status transition. 
- Filter summary. 
- Selected call count. 
- Cluster count. 
- Theme count. 

### Metrics

Recommended metrics:

- Theme-analysis job create rate. 
- Status counts by `queued`, `running`, `completed`, `failed`. 
- Average job duration. 
- Calls analyzed per job. 
- Theme count per completed job. 
- AI synthesis latency and failure rate. 

### Alerts

Recommended alerts:

- High failure rate for theme-analysis jobs. 
- Jobs stuck in `running` beyond SLA threshold. 
- Large queue backlog for theme analyses. 
- Sudden drop in theme generation volume after model or clustering changes. 

### Progress tracking

Because this feature is batch-style and long-running, progress indicators should be explicit, for example dataset loaded, clustering done, synthesis done, and storage done.   
Even if the first version only stores coarse statuses, the design should leave room for percent progress and stage-level progress later. 

---

## 13. Non-Functional Requirements

### Performance

- The create endpoint must respond quickly by creating a job, not by performing the analysis inline. 
- Large dataset analysis must execute asynchronously. 

### Scalability

- Theme Spotter must support multi-call analysis at batch scale, including documented analysis flows up to 500 calls per run. 
- Queue-based execution should isolate heavy analysis work from user-facing APIs. 

### Reliability

- Job status transitions must be durable and queryable. 
- Completed analyses must be reproducible from stored filters, inputs, and model versions where practical. 

### Usability

- Users must be able to tell whether the job is queued, still running, failed, or completed. 
- Results should support both summary view and drill-down into supporting call sets. 

---

## 14. Test Strategy

### Unit tests

- Filter validation and normalization. 
- Job state transition logic. 
- Result aggregation and metadata enrichment. 
- Export payload builders. 

### Integration tests

- `POST /theme-analyses` creates a persisted queued job. 
- Worker loads filtered data and writes theme results. 
- `GET /theme-analyses/:id` returns status and completed outputs. 
- Retry flow does not create duplicate result rows. 

### Contract tests

- AI theme-detection endpoint request and response schemas. 
- Database persistence contracts for `themeanalyses` and `themes`. 

### Evaluation tests

- Golden datasets for recurring-objection and trend-analysis quality. 
- Cluster stability tests across model/version changes. 
- Theme-summary regression tests to catch label drift. 

### Load and endurance tests

- Large-batch runs with maximum supported dataset sizes. 
- Queue-concurrency tests for multiple simultaneous theme-analysis jobs. 
- Stuck-job and restart recovery tests. 

---

## 15. Open Questions

### Pending design decisions

- **[RESOLVED]** There will be a hard limit of 500 calls per analysis in the public API. Exceeding this limit will return a 422 Unprocessable Entity error. 
- Should progress be stage-based only, or should percent-complete estimates be exposed? 
- Should completed analyses be rerunnable from the same saved filter set with version comparison? 

### Risks

- Weak clustering can produce vague or duplicated themes. 
- Overly broad filters can create noisy outputs with low practical value. 
- Long-running jobs without explicit progress can confuse users and create duplicate submissions. 

### Deferred items

- Theme comparison between two date ranges. 
- Scheduled recurring theme analyses. 
- Auto-generated alerts from newly emerging themes. 

---

## 16. Feature-Specific Appendix

### 16.1 Theme analysis job creation

AI Theme Spotter is explicitly represented as a job-based workflow in the architecture through the `themeanalyses` table and the `POST /api/v1/conversation-intelligence/theme-analyses` endpoint.   
The feature mapping describes Theme Spotter as large-scale analysis across conversations, which makes explicit job creation the correct UX and backend pattern. 

#### Create-job contract

Recommended request:

```json
{
  "businessQuestion": "What recurring objections are appearing in enterprise renewal calls?",
  "filters": {
    "dateRange": { "from": "2026-04-01", "to": "2026-04-30" },
    "accountSegment": ["enterprise"],
    "callType": ["renewal"]
  }
}
```

#### Create-job response

Recommended immediate response:

```json
{
  "analysisId": "uuid",
  "status": "queued",
  "createdAt": "2026-04-29T09:15:00Z"
}
```

#### Why this matters

- The API should return fast with a job reference. 
- Heavy theme computation must happen in the background. 
- Batch features need explicit lifecycle tracking from the start. 

### 16.2 Dataset selection and filters

The architecture stores `filters` directly on `themeanalyses` as JSONB, and the documented batch agent begins by filtering calls by tenant, date range, and user-selected criteria.   
The feature mapping also positions Theme Spotter as analysis across large call sets, not a per-call feature. 

#### Supported filter examples

- Date range. 
- Rep or owner. 
- Deal stage. 
- Account segment. 
- Possibly language, call type, region, or account list in later versions. 

#### Dataset-selection rules

- Always filter within tenant scope first. 
- Validate allowed filter keys before job creation. 
- Store the exact filter payload for reproducibility and auditing. 

#### Practical rule for freshers

Think of filters as the “SQL where clause” for the analysis job.   
If the wrong calls go into the batch, the best AI model still gives the wrong business insight. 

### 16.3 Clustering and trend computation

The architecture describes ThemeSpotterAgent as using embedding similarity and k-means clustering over transcript embeddings, followed by LLM-based theme synthesis.   
The feature mapping defines the business goal as finding recurring themes and trends across many calls. 

#### Core computation pipeline

1. Load filtered call batch.   
2. Fetch transcript chunk embeddings.   
3. Run k-means clustering with auto-selected `k`.   
4. Sample top central passages per cluster.   
5. Ask the LLM to identify the shared theme and summarize it.   
6. Compute trend-style metadata such as call counts, account counts, and associated revenue. 

#### Trend computation outputs

- `callCount` shows how widespread the theme is. 
- `accountCount` shows how broadly the theme appears across customers. 
- `associatedRevenue` helps prioritize business impact. 

#### Engineering note

Clustering finds groups; the LLM explains those groups in human language.   
That separation is important because it keeps the system more structured and easier to debug. 

### 16.4 Long-running job lifecycle

The architecture explicitly models `themeanalyses.status` with states `queued`, `running`, `completed`, and `failed`.   
This should be treated as a first-class product contract, not just an internal implementation detail, because Theme Spotter is a long-running batch analysis feature. 

#### Required lifecycle states

- `queued`: job accepted and waiting to run. 
- `running`: worker is actively processing dataset loading, clustering, or synthesis. 
- `completed`: all outputs stored successfully. 
- `failed`: job ended unsuccessfully and needs retry or inspection. 

#### Recommended future lifecycle extensions

- `cancelled` for user-aborted jobs. 
- `partial` only if the team explicitly decides to support partial-result delivery. 

#### Progress model

Recommended progress checkpoints:

- Job created.
- Dataset loaded.
- Clustering completed.
- Theme synthesis completed.
- Metadata enrichment completed.
- Results stored.
- Job marked completed. 

### 16.5 Export and drill-down behavior

The feature mapping says the conversation library and related intelligence capabilities should support finding, filtering, analyzing, and exporting calls and customer interactions.   
For Theme Spotter, export and drill-down should therefore be built around theme results and the supporting calls behind each theme. 

#### Drill-down behavior

From each theme, the user should be able to:

- View the supporting calls that contributed to the theme. 
- Reapply the original analysis filters plus the selected theme. 
- Open underlying transcripts or account/deal context for validation. 

#### Export behavior

Recommended exports:

- Analysis metadata: business question, filters, creation time, job status. 
- Theme summary rows: theme name, summary, call count, account count, associated revenue. 
- Supporting call references for offline review where permission allows. 

#### Product note

Export should preserve the difference between the summary layer and the evidence layer.   
In simple words: users need both the “what pattern did we find?” view and the “show me the calls behind it” view. 