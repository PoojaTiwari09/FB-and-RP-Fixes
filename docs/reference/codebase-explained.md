# Revenue Intelligence Platform - Codebase Explained

This document provides a deep-dive, step-by-step technical explanation of the architecture, data flow, and underlying codebase execution for the entire Revenue Intelligence Platform. 

The platform is designed as a **Modular Monolith** using NestJS, Next.js, and Prisma. Below is a detailed breakdown of what happens under the hood in each module, mapping exactly to the services, queues, and databases utilized.

---

## 1. Core Platform Architecture (`platform-core` & `apps/`)

### 1.1 The Unified API (`apps/unified-api/src/app.module.ts`)
The Unified API is the central NestJS backend that ties most modules together. 
- **Initialization**: It imports core `MxxModule` classes (M01, M02, M04, M06, M09, M11) along with `EngageBridgeModule` (from M08). Note that some modules like M03, M05, M07, and M10 are currently not directly imported here. It configures global utilities like `@nestjs/config` for env vars, `BullModule` for Redis-backed job queues (connecting to `REDIS_HOST:REDIS_PORT`), and `EventEmitterModule` for synchronous/asynchronous cross-module pub/sub communication.
- **Port**: Runs on port `3001` and serves as the single GraphQL/REST endpoint for the Next.js frontend (running on port `3000`).

### 1.2 The Shared Database (`packages/database/prisma/schema.prisma`)
- Uses **Prisma ORM** connecting to a PostgreSQL database utilizing the `pgvector` extension.
- **Schemas**: The platform relies on `schema.prisma` as the single source of truth for all domain entities (`Tenant`, `CallRecord`, `Transcript`, `Deal`, `Account`, `Dashboard`, `DashboardSnapshot`, `AiBrief`, etc.). 

---

## 2. In-Depth Module Execution Workflows

### M01: Capture & Transcription (`m01-capture-transcription`)
**Goal**: Ingest audio (Zoom, Teams, dialer) and turn it into text, redacting PII, and triggering the platform pipeline.

**Execution Steps**:
1. **Ingestion**: Audio is submitted via `UploadController` (direct upload) or `WebhookController` (Zoom/Teams).
2. **Queueing**: `CallService.createCall` creates a `CallRecord` in the database with status `pending` and dispatches a job to the Redis `m01-queue`.
3. **Worker Processing (`m01.worker.ts` containing `M01CaptureTranscriptionWorker`)**:
   - The worker picks up the job. It validates the `ASSEMBLYAI_API_KEY`.
   - If the audio is local, it uploads it to AssemblyAI. If public, it passes the URL directly.
   - It submits an async transcription request to AssemblyAI using the `universal-2` model with `speaker_labels: true`.
4. **Speaker Normalization**: AssemblyAI returns raw speaker labels (A, B). The worker normalizes these to "Speaker 1", "Speaker 2" before downstream extractors assign "Rep" or "Customer" identities.
5. **Persistence & Redaction**: The transcript text and `Utterance` rows are saved to the database. `PiiRedactionService` scrubs sensitive data before the final save.
6. **Event Emission**: Finally, the worker emits a `transcription.completed` event via the platform `EventPublisherModule`.

### M02: Conversation Intelligence (`m02-conversation-intelligence`)
**Goal**: Analyze the raw transcript for keywords, topics, and coaching moments.

**Execution Steps**:
1. **Ingestion Listener**: `ConversationIngestService` listens for `transcription.completed`. It locates the shared `CallRecord` in PostgreSQL, creates a `SyncLog`, and emits `call.scored`.
2. **AI Topic Tagging (`AiTopicTaggerService`)**: 
   - Uses a tiered fallback system for analyzing transcripts against the platform taxonomy.
   - **Tier 1**: Groq API (`llama-3.3-70b-versatile`). Returns a structured JSON array of `topicName`, `confidenceScore`, `explanation`, and `evidenceSnippet`.
   - **Tier 2**: Gemini API (`gemini-2.0-flash`) as an automated fallback if Groq rate limits.
   - **Tier 3**: Basic keyword matching (e.g. matching "pricing", "roi", "crm solutions").
3. **Scorecard Evaluation**: Based on topics and talk ratio, automated rubrics evaluate the rep's performance.
4. **Manager Dashboards**: Results are exposed via `M02FrontendCallReviewsController`.

### M03: AI Summaries & GenAI (`m03-ai-summaries-genai`)
**Goal**: Use LLMs (Large Language Models) to synthesize unstructured call data.

**Execution Steps**:
1. **Trigger**: Listens to `transcription.completed` events.
2. **Summary Generation (`m03.worker.ts` containing `M03AiSummariesGenaiWorker`)**: The worker constructs a prompt containing the full transcript text and queries the LLM to generate `summary`, `keyHighlights`, and `nextSteps`.
3. **Persistence**: Saves the output to the DB and emits `call.summary.generated`.
4. **Briefs & Reports**: The `BriefService` generates custom "AI Briefs" summarizing an account's historical interactions before a rep's next meeting, querying the `AiBrief` table.

### M04: Deal Intelligence (`m04-deal-intelligence`)
**Goal**: Manage pipeline health, CRM synchronization, and deal risk.

**Execution Steps**:
1. **Incremental Sync (`deal-sync.service.ts` containing `DealSyncService`)**: A cron job (`@Cron(CronExpression.EVERY_5_MINUTES)`) runs automatically.
2. **HubSpot Fetch**: Queries the HubSpot API (`HubSpotClientService.getDeals`) with pagination for deals created or modified recently.
3. **Data Mapping**: HubSpot stages (e.g., `APPOINTMENT_SCHEDULED`, `CLOSED_WON`) are mapped to internal canonical stages (e.g., `PROSPECTING`, `CLOSED_WON`) and Forecast Categories.
4. **Database Upsert**: `dealRepository.create` or `dealRepository.save` is invoked. 
5. **AI Scoring**: Each deal is scored dynamically (`AIScoreService`) based on velocity, missing MEDDPICC fields, and Deal Drivers.
6. **Warnings**: `DealWarningService` flags deals (e.g., "No activity in 14 days") and surfaces them on the rep's Deal Board.

### M05: Account Intelligence (`m05-account-intelligence`)
**Goal**: Track the broader account relationship and stakeholder map.

**Execution Steps**:
1. **CRM Account Sync**: Similar to M04, `SyncService` pulls Company data from HubSpot to populate the `Account` Prisma model.
2. **Relationship Mapping**: Aggregates all contacts under an account. Tracks recent activities (`ActivitiesService`) across all deals associated with the account.
3. **To-Dos**: Manages rep action items (`TodosService`) natively inside the platform.

### M06: Forecasting & Prediction (`m06-forecasting-prediction`)
**Goal**: Consolidate human intuition with machine learning predictions.

**Execution Steps**:
1. **Human Forecasts**: Reps submit their pipeline commitments via `ForecastBoardsController`.
2. **AI Predictions (`M06PredictionQueueService`)**: Submits jobs to `m06-queue` where the worker evaluates historical win rates, M04 Deal Scores, and pipeline velocity to generate a machine-predicted forecast.
3. **Executive Snapshots**: Periodically captures the forecast in `AiForecastSnapshot` table to track forecast accuracy over time.

### M07: Revenue Dashboards (`m07-revenue-dashboards`)
**Goal**: Serve high-level BI (Business Intelligence) analytics.

**Execution Steps**:
1. **Widget Rendering**: The frontend queries `M07DealAccountController` (found in `m07.controller.ts`).
2. **Data Aggregation**: The backend computes complex Prisma aggregates over `Deal`, `CallRecord`, and `Coaching` data.
3. **Snapshotting**: To maintain fast load times, historical metrics are computed and stored in the `dashboard_snapshots` (RLS-enabled) and `dashboardconfigs` tables.

### M08: Sales Engagement (`m08-sales-engagement`)
**Goal**: Execute outbound workflows and automated playbooks.

**Execution Steps**:
1. **Auto-Enrollment (`m08.worker.ts` containing `M08SalesEngagementWorker`)**: Listens on `m08-queue` for jobs like `process-auto-enrollment`.
2. **Playbook Execution**: If a deal hits a certain risk threshold, the worker evaluates triggers and automatically enrolls the deal (`dealId`) into a predefined playbook (`playId`).
3. **Workflow Runs**: `WorkflowRunsWorker` executes multi-step sequences.
4. **Task Generation**: `M08TaskService` creates actionable tasks (e.g., "Send follow-up email").

### M09: Coaching & Training (`m09-coaching-training`)
**Goal**: Simulate sales scenarios for rep onboarding.

**Execution Steps**:
1. **Scenario Initialization**: A rep starts a session. `ScenariosService` loads a persona (e.g., "Angry IT Buyer") from `trainerscenarios`.
2. **LLM Roleplay (`LlmService`)**: The platform acts as the buyer. The rep responds.
3. **Scoring**: After the session, the LLM evaluates the rep's handling of objections based on predefined scorecards and saves to `trainersessions`.

### M10: Data & Compliance (`m10-data-compliance`)
**Goal**: Maintain data integrity and export capabilities.

**Execution Steps**:
1. **Revenue Graph**: Uses `entity-resolution` algorithms to ensure Calls, Deals, Contacts, and Accounts are perfectly linked in the DB.
2. **Data Cloud**: Runs scheduled batch exports of sanitized data to enterprise data warehouses.

### M11: AI Deep Researcher (`m11-ai-deep-researcher`)
**Goal**: Autonomous research on the open web and internal codebase.

**Execution Steps**:
1. **Analysis Trigger (`AiDeepResearcherService.runAnalysis`)**: An asynchronous job is dispatched.
2. **Decomposition**: The AI breaks down complex queries (e.g., "What patterns distinguish our won deals from lost deals?") into sub-tasks.
3. **Database Extraction**: It queries `CallRecord`, `Deal`, and `User` tables to fetch current metrics.
4. **Synthesis**: Sends a heavy context prompt (transcripts + deals) to Groq (`llama-3.1-8b-instant`).
5. **Report Generation**: Outputs a structured JSON report detailing objection ranks, rep performance, evidence snippets, and recommendations.

---

## Summary of Platform Event Flow
1. **External Event** -> (e.g. Call ends, HubSpot Deal changes)
2. **Ingestion Controller/Cron** -> (e.g. `WebhookController`, `handleIncrementalSync`)
3. **Message Queue (BullMQ)** -> (Job sent to Redis: `m01-queue`, `m06-queue`, `m08-queue`)
4. **Worker Execution** -> (Workers process external APIs, Groq/Gemini models, or AssemblyAI)
5. **Database Mutation** -> (Prisma persists `CallRecord`, `Deal`, `AiExtractionResult`)
6. **Event Emission** -> (NestJS EventEmitter publishes `domain.action` like `transcription.completed`)
7. **Downstream Modules React** -> (M02/M03/M08 listen to the event and trigger their own processes autonomously).
