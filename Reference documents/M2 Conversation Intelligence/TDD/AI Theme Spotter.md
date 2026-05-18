# Doc #11c — TDD: AI Theme Spotter

## 1. Document Control

- **Document Title:** Technical Design Document — AI Theme Spotter
- **Feature Name:** AI Theme Spotter
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Tech Lead / Conversation Intelligence Squad
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

AI Theme Spotter analyzes customer conversations at scale to detect recurring themes, trends, objections, and insights that are not visible at an individual call level. Its purpose is to help teams move from single-call understanding to pattern detection across many calls, accounts, reps, segments, or time ranges.

This feature belongs in the M2 module because M2 is the central system for understanding customer conversations and generating structured signals. The main value is for managers, RevOps, product teams, and leadership who need trend-level insights from large datasets of call activity.

### Business Problem
- Individual calls show isolated signals, but leadership needs repeated patterns across many conversations.
- Teams need a way to ask business questions such as “What objections are increasing?” or “What themes appear in renewal-risk calls?” and get grouped answers from many calls.
- Large-scale conversation analysis must be asynchronous, trackable, and exportable because it runs over large datasets.

### What the Feature Does
- Creates a theme-analysis job based on a business question and selected filters.
- Loads a filtered set of calls and transcript embeddings.
- Clusters similar transcript passages into proto-themes.
- Uses LLM synthesis to name and summarize each theme.
- Enriches themes with counts and revenue-related metadata.
- Stores job status and result outputs for later viewing, export, and drill-down.

---

## 3. Scope

### In Scope
- Batch creation of theme-analysis jobs.
- Filtering a call dataset by tenant and user-selected business filters.
- Embedding-based clustering of relevant transcript passages.
- LLM-based synthesis of cluster labels and summaries.
- Storage of analysis jobs in `theme_analyses` and resulting clusters in `themes`.
- Read APIs for viewing results.
- Explicit job states: queued, running, completed, and failed.

### Out of Scope
- Real-time theme generation during a live call.
- Single-call topic tagging (handled by AI Topic Tagger).
- Intent-tracker detection (handled by AI Smart Tracker).
- Dashboard-specific charting implementation details.
- Warehouse-level analytics exports beyond product feature exports.

### Assumptions
- Relevant transcripts already exist in the platform.
- Transcript chunk embeddings are available or can be generated through approved embedding workflows.
- Theme Spotter is invoked as an async batch job because the dataset can include up to 500 calls.
- Tenant isolation and row-level access controls are enforced for all selected data and outputs.

### Upstream Dependencies
- **M1 Capture & Transcription:** Ingestion pipeline must already have completed and stored transcripts.
- **M10 Data & Compliance:** Revenue Graph context is used for account, deal, and revenue enrichment.
- AI Services Layer provides theme-detection and synthesis capabilities.

### Downstream Usage
- Frontend users view completed theme analyses via results APIs.
- Product teams drill down from a theme to supporting calls and filters.
- Export workflows package results for analysis outside the immediate screen flow.

---

## 4. Users and Triggers

### Primary Users
- Sales managers looking for repeated objections or coaching patterns.
- RevOps users analyzing trends by segment, rep, or stage.
- Product and leadership teams looking for market, pricing, and product-feedback patterns.

### Trigger Type
- This is a user-initiated async batch workflow, not an automatic event after every call.

### Entry Points
- API: `POST /api/v1/m02-conversation-intelligence/theme-analyses` to create a new analysis job.
- API: `GET /api/v1/m02-conversation-intelligence/theme-analyses/:id` to fetch results and status.

---

## 5. Functional Flow

### Happy Path
1. An authorized user submits a business question and dataset filters.
2. M2 creates a `theme_analyses` record with initial status `queued`.
3. A BullMQ-backed async job starts processing the analysis.
4. The system loads the filtered call set and fetches transcript chunk embeddings.
5. Clustering groups similar transcript passages into proto-themes.
6. For each cluster, the system samples central passages and calls the LLM to name and summarize the theme.
7. The system enriches each theme with metadata such as call count, account count, and associated revenue.
8. The resulting themes are written to `themes`, linked to the parent `theme_analyses` record.
9. The analysis status is updated to `completed`, and results become available through the read API.

---

## 6. Inputs and Outputs

### Inputs
- `tenantId` (UUID)
- `businessQuestion`
- `filters` JSON object, such as date range, rep, deal stage, or account segment.
- Matching transcript passages and embeddings.

### Output Records
- `theme_analyses` stores the parent analysis job record.
- `themes` stores each synthesized theme linked to the analysis.

### APIs Exposed
- `POST /api/v1/m02-conversation-intelligence/theme-analyses` (Creates the job)
- `GET /api/v1/m02-conversation-intelligence/theme-analyses/:id` (Returns results of a theme analysis)

### AI Endpoints Involved
- `POST /internal/detect-themes` (Private AI service capability for theme analysis)

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `theme_analyses` Table
- `id` (UUID, Primary Key) -> mapped to `analysisId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `business_question` (TEXT) -> mapped to `businessQuestion`
- `filters` (JSONB)
- `status` (VARCHAR) -> queued, running, completed, failed
- `created_by` (UUID) -> mapped to `createdBy`
- `call_count_analyzed` (INTEGER) -> mapped to `callCountAnalyzed`
- `created_at` (TIMESTAMP) -> mapped to `createdAt`
- `updated_at` (TIMESTAMP)

### `themes` Table
- `id` (UUID, Primary Key) -> mapped to `themeId`
- `analysis_id` (UUID, Indexed) -> mapped to `analysisId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `name` (VARCHAR)
- `summary` (TEXT)
- `call_count` (INTEGER) -> mapped to `callCount`
- `account_count` (INTEGER) -> mapped to `accountCount`
- `associated_revenue` (DECIMAL) -> mapped to `associatedRevenue`

---

## 8. AI Processing

- **Task:** Theme clustering & synthesis.
- **Internal AI Endpoint:** `POST /internal/detect-themes`
- **Batch limit:** Max 500 calls per run.

---

## 9. Service and Integration Design

- **NestJS M2 Service:** owns API creation, job records, queue orchestration, persistence, and results APIs.
- **Python AI Service:** owns theme clustering and synthesis logic.
- **BullMQ + Redis:** manage async batch execution.

---

## 16. Appendix: Theme Cluster Synthesis Logic

```typescript
export interface Theme {
  name: string;
  summary: string;
  callCount: number;
  accountCount: number;
  associatedRevenue: number;
}

export interface ThemeAnalysisJob {
  analysisId: string;
  tenantId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  callCountAnalyzed: number;
  themes: Theme[];
}

export function validateThemeAnalysisLimits(callCount: number): boolean {
  const HARD_LIMIT = 500;
  return callCount <= HARD_LIMIT;
}
```