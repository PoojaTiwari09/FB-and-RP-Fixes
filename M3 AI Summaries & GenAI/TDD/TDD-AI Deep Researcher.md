# Doc #11c — Technical Design Document (TDD): AI Deep Researcher

## 1. Document Control

- **Document title:** Technical Design Document — AI Deep Researcher
- **Feature name:** AI Deep Researcher
- **Module name:** M3 AI Summaries & GenAI
- **Architecture module mapping:** M-06 Insight Generation
- **Version:** v1.0
- **Status:** Draft
- **Owner:** Product Engineering — M3
- **Reviewers:** CTO, Tech Lead, AI Lead, Backend Lead, Product Manager, QA Lead
- **Last updated:** 2026-04-30

## 2. Purpose

### Business problem
Leaders, managers, and RevOps users often need deeper answers than a single summary or chat response can provide. They need structured analysis across many conversations, signals, and accounts to answer complex business questions such as recurring objections, expansion blockers, risk patterns, or buyer behavior trends. 

### What this feature does
AI Deep Researcher is an advanced AI analysis feature that examines large sets of conversations and related signals to generate structured, in-depth reports. It is designed for complex questions that require broader retrieval, deeper synthesis, and report-style outputs rather than a short answer flow. 

### Why it belongs in M3
M3 is the Analyze-stage module that turns structured upstream signals into directly usable outputs such as summaries, reports, and natural-language answers. AI Deep Researcher is explicitly mapped to M-06 and is described as producing structured reports over large volumes of conversations. 

### Business value
- Gives leadership and RevOps report-ready insights from large datasets.
- Reduces manual multi-call analysis time.
- Surfaces patterns that are not visible in a single call or short answer.
- Creates reusable research artifacts that teams can review, share, and export.
- Supports decision-making for deal strategy, account planning, enablement, and pipeline inspection. 

## 3. Scope

### In scope
- Creation of long-running async research jobs.
- Multi-step retrieval and synthesis over large conversation sets.
- Generation of structured research reports.
- Research status tracking and result retrieval.
- Grounded reporting using captured calls, emails, summaries, and related CRM context.
- Export/share-ready report output at the application layer. 

### Out of scope
- Short interactive Q&A; that belongs to Ask Anything.
- Single-call summarization; that belongs to AI Smart Summaries.
- Real-time streaming analysis during a call.
- Autonomous workflow execution from the report result.
- External web research outside platform data. 

### Assumptions
- Conversation, summary, and email data have already been captured and stored by upstream modules.
- Large-dataset retrieval can use stored summaries, embeddings, tracker detections, and CRM-linked entity context.
- Research reports run asynchronously due to dataset size and reasoning complexity.
- The AI Services Layer can support stronger long-context or multi-document analysis models for this feature.
- Tenant isolation applies to every stage of research retrieval and storage. 

### Upstream dependencies
- M-01 Data Ingestion for calls and transcripts.
- M-02 Sales Engagement for email content and activity context.
- M-03 Revenue Graph for account, contact, and deal relationships.
- M-04 Conversation Intelligence for topics and thematic signals.
- M-05 Smart Tracking and Search for detections and searchable context.
- M-06 shared embeddings, summaries, and query infrastructure where relevant. 

### Downstream consumers
- Frontend report UI for research creation, status tracking, and viewing.
- Sales managers, RevOps, and leadership users consuming the finished report.
- Potential export/share workflows using stored report artifacts.
- Later modules that may consume conclusions manually, though no dedicated event consumer is explicitly defined in the architecture for research report completion. 

## 4. Users and Triggers

### Primary users
- Sales Managers
- RevOps
- Leadership
- Customer Success leaders
- Strategic account owners needing cross-interaction analysis 

### Trigger types
- **User-initiated async job:** user submits a research question and scope.
- **Optional scheduled or saved workflow in later phases:** not required for Phase 3, but the design should not block future scheduling.
- **Status polling:** user checks report progress or final result. 

### Entry points
- `POST /api/v1/insights/research`
- `GET /api/v1/insights/research/:id` 

### Preconditions
- User must be authenticated and authorized.
- Tenant context must be available.
- Research question must pass validation.
- Scope filters such as date range, rep set, deal stage, or account segment must be valid if provided.
- Async worker capacity and AI service dependencies must be available. 

## 5. Functional Flow

### Happy path
1. User submits a complex research question and optional filters to `POST /api/v1/insights/research`.
2. M-06 creates a `researchreports` row with `status = queued`.
3. A background worker dequeues the research job.
4. The worker interprets the question and builds a multi-step retrieval plan.
5. The system retrieves relevant summaries, transcripts, emails, tracker detections, and CRM-linked context across the requested scope.
6. The AI workflow synthesizes findings through multi-step reasoning.
7. The final report is assembled into structured sections.
8. M-06 stores the completed report in `researchreports` and marks status `completed`.
9. Frontend retrieves the final report using `GET /api/v1/insights/research/:id`. 

### Alternate paths
- If the dataset is too broad, the retrieval plan may narrow scope using the provided filters and top-ranked source selection.
- If some source classes are missing, the report proceeds with available evidence and states coverage limitations.
- If the question is actually simple Q&A, the product may later suggest Ask Anything, but Deep Researcher still supports report generation on user request. 

### Failure paths
- Job creation succeeds but worker execution fails.
- Retrieval returns too little evidence for the requested question.
- AI reasoning step times out or exceeds internal token budget.
- Final report write fails.
- User requests unsupported scope or inaccessible data. 

### Retry behavior
- Async job retries on transient worker and AI service errors.
- Partial retrieval substeps may retry independently.
- Report status moves to `failed` if retry budget is exhausted.
- A failed report remains queryable for status inspection and retry UI decisions in the application. 

## 6. Inputs and Outputs

### Inputs
- Research question
- Tenant context
- User context
- Filters object, such as date range, rep list, deal stage, account segment, or activity subset
- Optional saved scope or current page context from the UI 

### Retrieval context
AI Deep Researcher works over a broader evidence set than Ask Anything. It can analyze large collections of conversations and linked signals, using summaries, transcripts, emails, tracker detections, topic labels, and CRM relationships to build report-grade findings. 

### Output artifacts
- Research report record
- Structured report text
- Source call or source record references
- Status metadata
- Report-ready sections suitable for export or sharing 

### Events emitted
`research.report.completed`
- Emitted when `researchreports.status` transitions to `completed` and the write is durable.
- Consumers (Phase 3): Frontend notification layer (to stop polling), future M-08 automation hooks.
- Payload includes: `eventId`, `reportId`, `tenantId`, `createdBy`, `status`, `questionSummary`, `sourceCount`, `generatedAt`.

### APIs exposed or consumed
**Exposed**
- `POST /api/v1/insights/research`
- `GET /api/v1/insights/research/:id`

**Consumed**
- AI Services Layer research/generative endpoints
- Internal retrieval services over summaries, transcripts, emails, and embeddings
- Revenue Graph context APIs and internal stores for entity scoping 

## 7. Research Job Creation

### Objective
Research jobs must be durable, traceable, and asynchronous because the feature is designed for large-volume analysis rather than immediate chat responses. The system must create a stable report record before computation begins. 

### Job creation flow
1. Validate user auth and tenant scope.
2. Validate research question and filters.
3. Insert row into `researchreports` with:
   - `reportId`
   - `tenantId`
   - `question`
   - `filters`
   - `status = queued`
   - `createdBy`
   - `createdAt`
4. Enqueue background research worker job.
5. Return `reportId` and initial status to frontend. 

### Request contract
Recommended create request:
```json
{
  "question": "What objections are most common in late-stage deals that did not progress this quarter?",
  "filters": {
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-03-31"
    },
    "dealStage": ["proposal", "negotiation"],
    "accountSegment": ["enterprise"],
    "repIds": ["uuid-1", "uuid-2"]
  }
}
```

### Response contract
Recommended create response:
```json
{
  "reportId": "uuid",
  "status": "queued",
  "createdAt": "ISO-8601 timestamp"
}
```

## 8. Multi-Step Reasoning Workflow

### Goal
AI Deep Researcher must support deeper reasoning than a short answer flow. The architecture explicitly keeps feature-specific multi-step reasoning details in this TDD, and the platform supports stateful agent-style workflows through LangGraph for multi-step AI operations. 

### Recommended workflow stages
1. **Question analysis:** identify research intent, likely entities, and required evidence classes.
2. **Scope planning:** convert user filters into a bounded retrieval plan.
3. **Evidence retrieval:** pull summaries, transcripts, emails, detections, and context in batches.
4. **Evidence clustering:** group by theme, entity, risk, stage, or timeframe.
5. **Intermediate synthesis:** summarize clusters or batches into compact findings.
6. **Cross-batch reasoning:** compare clusters to identify patterns, contradictions, and repeated signals.
7. **Report drafting:** assemble final narrative, findings, evidence references, and recommended actions.
8. **Quality pass:** validate section completeness, evidence coverage, and unsupported-claim suppression. 

### Why multi-step instead of one-shot prompting
A single prompt over a very large dataset is brittle, expensive, and hard to ground. Multi-step reasoning allows the system to reduce large evidence sets into structured intermediate findings before building the final report, improving quality, explainability, and reliability. 

### Agent pattern
The architecture documents LangGraph as the stateful framework for multi-step agentic AI workflows and explicitly notes AI Deep Researcher as a feature whose multi-step reasoning implementation belongs in its TDD. A research workflow can therefore be modeled as a graph with shared state across retrieval, clustering, synthesis, and report assembly nodes. 

## 9. Large-Dataset Retrieval Plan

### Objective
Deep Researcher must retrieve across a much larger corpus than Ask Anything while still staying bounded, tenant-safe, and cost-aware. The retrieval strategy should prioritize breadth first, then reduce to the most relevant and diverse evidence set for synthesis. 

### Retrieval sources
- Call summaries
- Deal briefs
- Account briefs
- Transcript chunks
- Email content
- Tracker detections
- Topic tags
- CRM-linked deal, account, contact, and activity context 

### Retrieval strategy
**Phase 1 — Candidate generation**
- Apply hard filters first: tenant, date range, entity scope, rep scope, stage, segment.
- Pull candidate summaries and metadata for the scoped dataset.
- Use vector search and structured filtering to find high-relevance candidates.

**Phase 2 — Evidence expansion**
- For promising candidates, fetch supporting transcript chunks, emails, and detections.
- Expand around high-signal calls or entities to capture adjacent evidence.

**Phase 3 — Evidence reduction**
- Deduplicate near-identical chunks.
- Limit repeated evidence from the same call unless needed for trend support.
- Preserve diversity across reps, accounts, and time windows when the question is comparative or trend-based. 

### Batching strategy
- Retrieve in batches by time window, entity group, or top-ranked candidate sets.
- Summarize each batch separately before global synthesis.
- Keep each intermediate batch within bounded token limits for model calls. 

### Large-scale grounding rules
- Prefer summary-first retrieval for broad scans, then drill into transcript chunks for proof.
- Preserve source record IDs for every retained finding.
- Keep a source coverage ledger throughout the workflow so the final report can show evidence-backed claims only. 

## 10. Report Structure and Sections

### Goal
The report must be structured enough for business users to read quickly and for the UI to render consistently. It should feel like an analyst brief, not a raw model dump. 

### Default report structure
- Title
- Research question
- Scope and filters used
- Executive summary
- Key findings
- Detailed analysis
- Supporting evidence
- Risks or caveats
- Recommended actions
- Appendix or source references 

### Recommended section definitions
**Executive summary**
- 3 to 7 concise bullets or short paragraphs summarizing the main answer.

**Key findings**
- Ordered findings with evidence strength and source references.

**Detailed analysis**
- Thematic or segment-based breakdown, for example by deal stage, rep group, account segment, or objection type.

**Supporting evidence**
- Referenced source calls, summaries, snippets, and notable examples.

**Risks or caveats**
- Coverage gaps, contradictory evidence, sparse sample warnings, or narrow-filter caveats.

**Recommended actions**
- Suggested next steps for managers, reps, or RevOps based on observed patterns. 

### Output style rules
- Use grounded business language.
- Prefer pattern descriptions over unsupported certainty.
- Keep the top of the report scannable.
- Make every major conclusion traceable to evidence. 

## 11. Long-Running Async Job Lifecycle

### Canonical status model
The architecture defines `researchreports` with a `status` field and identifies valid lifecycle values as:
- `queued`
- `running`
- `completed`
- `failed` 

### Lifecycle stages
1. **Queued:** report row created, waiting for worker pickup.
2. **Running:** worker is actively retrieving, analyzing, and generating.
3. **Completed:** final report persisted successfully.
4. **Failed:** processing exhausted retries or encountered unrecoverable failure. 

### Lifecycle transitions
- `queued -> running` when worker starts.
- `running -> completed` when report write succeeds.
- `running -> failed` when retries are exhausted or a fatal error occurs.
- A future retry UX may create a new report job or reset the existing job depending on product policy. 

### Status retrieval
- `GET /api/v1/insights/research/:id` returns current status.
- If completed, it returns the report content.
- If failed, it returns failure-safe status metadata without exposing internal sensitive diagnostics directly to the end user. 

### Progress tracking
The base architecture only guarantees status tracking, not fine-grained progress percentages. For Phase 3, status is sufficient, but the implementation may optionally add step-level progress metadata such as `retrieval`, `synthesis`, or `finalizing` if it stays compatible with the main report lifecycle contract. 

## 12. Export or Share Output

### Goal
Deep Researcher reports are designed to be reused, discussed, and shared across teams. Export and share behavior should therefore be part of the document design even if the first release keeps sharing simple. 

### Supported output modes
Recommended Phase 3 output modes:
- In-app report view
- Copy/export as markdown or rich text
- Download as PDF in a later UI layer if needed
- Shareable internal link with permission checks 

### Share rules
- Shared reports remain tenant-scoped.
- Recipient must have permission to view all underlying scoped entities or the system must redact restricted references.
- Shared links must require authentication unless explicit tenant policy allows otherwise. 

### Export content rules
- Preserve report sections and source references.
- Include question, filters, creation metadata, and generated timestamp.
- Avoid embedding hidden internal debugging metadata in user-facing exports. 

## 13. Data Model

### Primary tables used
- `researchreports`
- `callsummaries`
- `dealbriefs`
- `accountbriefs`
- `transcripts`
- `speakersegments`
- `trackerdetections`
- `topictags`
- `semanticembeddings`
- email-related activity tables
- linked deals/accounts/contacts/activities through entity context 

### `researchreports` table
The architecture defines `researchreports` with:
- `reportId`
- `tenantId`
- `question`
- `filters`
- `status`
- `resultText`
- `createdBy`
- `createdAt` 

### Prompt context records
The research workflow should persist enough metadata to reproduce scope, filters, source set, and report versioning decisions. Full internal prompts do not need to be exposed to the user-facing schema, but source coverage and filter application must be auditable. 

### Generated output storage
- Final report body in `resultText`
- Applied filters in `filters`
- Canonical question in `question`
- Status in `status`
- Optional source call IDs or source reference lists if stored separately or embedded as structured report metadata 

### Versioning rules
Recommended approach:
- A research job produces one immutable report artifact for that job ID.
- Re-run or refresh should create a new report ID rather than mutating historical research silently.
- This preserves auditability and comparison across time. 

### Idempotency keys
- Report creation should support client retry safely.
- Background execution should avoid duplicate worker processing for the same `reportId`.
- Export generation should be idempotent when requested repeatedly for the same completed report. 

## 14. Retrieval and AI Processing

### Retrieval scope
Deep Researcher retrieves across large scoped datasets, not just the top few chunks for one question. It should support wide initial scans over summaries and metadata, followed by deeper evidence pulls from transcripts and related records. 

### Source ranking
Recommended ranking stages:
1. Structured filter match.
2. Summary-level relevance.
3. High-signal tracker or topic evidence.
4. Transcript chunk relevance.
5. Diversity weighting across sources to avoid one-call dominance. 

### Prompt assembly
Prompt assembly should happen in stages:
- question analysis prompt,
- batch synthesis prompts,
- cross-batch comparison prompt,
- final report assembly prompt,
- optional quality-check prompt. 

### AI service endpoints
The architecture references M-06 FastAPI services including research generation and notes that AI Deep Researcher uses a stronger model for long multi-document analysis and complex reasoning over about 100 source passages. 

Recommended internal endpoints:
- `POST /v1/generate-report` as the canonical internal research-generation endpoint
- `POST /v1/embed` where embedding refresh or retrieval support is needed
- internal summarization endpoints for intermediate batch reduction where appropriate 

### Model choice
The architecture associates AI Deep Researcher with `gpt-4o` because the feature requires long multi-document analysis and complex reasoning over large evidence sets. This is distinct from lighter summary-generation paths that use smaller models. 

### Structured output schema
Recommended final report contract:
```json
{
  "reportId": "uuid",
  "title": "string",
  "question": "string",
  "scope": {
    "filters": {}
  },
  "executiveSummary": ["string"],
  "keyFindings": [
    {
      "finding": "string",
      "evidenceStrength": "low|medium|high",
      "sourceRefs": ["string"]
    }
  ],
  "detailedSections": [
    {
      "heading": "string",
      "content": "string",
      "sourceRefs": ["string"]
    }
  ],
  "caveats": ["string"],
  "recommendedActions": ["string"],
  "sourceRefs": ["string"],
  "generatedAt": "ISO-8601 timestamp"
}
```

### Confidence or grounding strategy
- Confidence is section-level, not just whole-report-level.
- Findings should carry evidence-strength or source-density metadata.
- If evidence is mixed or sparse, the report must say so clearly.
- Broad claims require multiple sources or repeated signal support. 

### Hallucination prevention rules
- No conclusions without evidence support.
- No invented trends or counts.
- No unsupported causal claims.
- Contradictory evidence must be acknowledged, not hidden.
- The system should prefer a narrower grounded report over a broader speculative one. 

## 15. Service and Integration Design

### Internal services
- `InsightGenerationModule` manages report creation, persistence, and status retrieval.
- Async worker processes long-running research jobs.
- AI Services Layer handles research reasoning and synthesis.
- Internal retrieval services gather summaries, transcripts, emails, and vector hits.
- Revenue Graph provides entity relationships for scoped analysis. 

### AI service endpoints
- Research-generation endpoint in the AI Services Layer.
- Possible intermediate summarization endpoints for batch reduction.
- Embedding service for retrieval support where required. 

### Search and retrieval dependencies
- pgvector-backed embeddings for semantic search.
- Stored summaries and briefs for high-level scanning.
- Tracker and topic signals for thematic enrichment.
- CRM-linked entity context from Revenue Graph. 

### CRM context usage
Revenue Graph context is used to map interactions to deals, accounts, contacts, and segments so reports can answer business questions in business terms rather than raw conversation IDs. Deep Researcher uses CRM context for scoping and interpretation, not direct CRM mutation. 

### Queue workers and job orchestration
Research jobs must run in background workers because they are long-running and retrieval-heavy. Queue orchestration should support retries, status updates, and safe failure transitions to `failed`. 

## 16. Security and Compliance

### Tenant isolation
All research jobs, retrieval operations, intermediate states, and persisted reports must remain tenant-scoped. No cross-tenant batching or source mixing is allowed. 

### Access control
Only authorized users can create or view research reports for a tenant and scoped entity set. If a report includes restricted underlying records, the viewer must have permission for that scope or the report must be hidden or redacted. 

### Data visibility rules
Research output inherits the strictest visibility boundary of its sources. A report is not “safe to share” merely because it is AI-generated; it remains derived customer data and must follow normal access rules. 

### Prompt data sensitivity
Research prompts may contain high volumes of sensitive conversation and CRM data. Prompt construction must stay within approved internal service boundaries and avoid unnecessary over-selection of raw content. 

### Audit logging
Log:
- report ID,
- tenant ID,
- creator user ID,
- filter set,
- worker start and end times,
- AI endpoint usage,
- final status,
- error reason on failure. 

## 17. Error Handling

### Missing context behavior
- If some scoped records are missing, continue with available evidence and note coverage limitations.
- If required scope is empty after filtering, fail fast with a user-safe explanation rather than running an empty report.
- If entity resolution fails, fall back to the raw validated filters only if tenant safety is preserved. 

### Low-confidence retrieval handling
- Broaden within the approved filters if too few sources are found.
- If evidence remains sparse, produce a limited report with explicit caveats.
- Do not inflate certainty to satisfy report shape. 

### AI generation failure handling
- Retry transient AI failures.
- Preserve intermediate progress if possible for observability, but only mark report `completed` after final persistence succeeds.
- Mark report `failed` after retry exhaustion and keep the report record queryable by status. 

### Timeout and partial-output rules
- The system may persist partial internal progress for debugging, but user-facing output should only be shown as final once the report is complete.
- If final assembly fails after successful retrieval and intermediate synthesis, the job remains failed unless a safe resumable design is implemented later.
- Avoid exposing half-finished reports as if they were complete. 

### DLQ conditions
Move worker jobs to DLQ when:
- repeated AI service failures occur,
- final report persistence repeatedly fails,
- retrieval planner enters repeated unrecoverable state,
- worker crashes exceed retry budget. 

## 18. Observability

### Logs
Capture:
- report ID,
- tenant ID,
- creator ID,
- question hash or safe redacted text,
- filter summary,
- retrieval counts,
- batch counts,
- AI model used,
- total latency,
- failure stage if applicable. 

### Metrics
Track:
- reports created,
- reports completed,
- reports failed,
- average time to completion,
- average source count,
- average batches processed,
- token usage per report,
- export/share usage rate. 

### Alerts
Alert on:
- research job failure spikes,
- queue backlog growth,
- unusually long-running jobs,
- AI timeout spikes,
- report write failures,
- abnormal source-count collapse. 

### Quality signals
- evidence coverage ratio,
- percent of findings with multiple sources,
- user reopen/share/export rate,
- repeat question rate,
- manual feedback if later added,
- report completion vs abandonment. 

### Cost monitoring
This feature should have the strongest cost monitoring in M3 because it uses the heaviest retrieval and reasoning path. Track cost per report, batch count per report, token usage, and source volume to prevent runaway large-scope jobs. 

## 19. Non-Functional Requirements

### Latency targets
AI Deep Researcher is intentionally async and does not need chat-like latency. The key NFR is predictable completion for typical scoped research jobs plus clear status visibility for the user. 

### Throughput
The system must support multiple concurrent research jobs without starving higher-priority user-facing summary or Ask Anything traffic. Worker pool isolation or concurrency limits are recommended. 

### Scalability
Scale through batch retrieval, summary-first reduction, bounded intermediate contexts, and background worker concurrency controls. 

### Reliability
Research jobs must be durable, resumable where practical, and safe to retry without duplicating final report records unexpectedly. 

## 20. Test Strategy

### Unit tests
- filter validation,
- question classification for research mode,
- retrieval-plan construction,
- batch partitioning,
- report section assembly,
- evidence-strength scoring,
- status transition logic. 

### Integration tests
- `POST /api/v1/insights/research` creates queued job.
- Worker transitions `queued -> running -> completed`.
- `GET /api/v1/insights/research/:id` returns current status and final report.
- Failure path transitions to `failed`.
- Authorization checks prevent unauthorized report access. 

### Retrieval-quality tests
- broad filtered retrieval returns relevant source sets,
- summary-first narrowing does not miss key transcript evidence,
- diverse source selection prevents one-call dominance,
- source references remain traceable through intermediate synthesis. 

### Prompt-output contract tests
- research-generation outputs match structured report schema,
- each key finding contains source references,
- unsupported sections are rejected or marked incomplete,
- caveat handling is enforced when source coverage is weak. 

### Regression and idempotency tests
- repeated create request retries do not create duplicate reports,
- worker retry does not generate multiple completed artifacts for one report ID,
- model or prompt changes do not break export shape,
- large-filter jobs remain bounded and do not exceed platform safety limits unexpectedly. 

## 21. Open Questions

- Should report progress expose only status or also step-level progress in Phase 3?
- Should export to PDF be part of the first release or handled by the frontend later?
- Should reports store normalized source-reference tables instead of embedded source lists inside `resultText` metadata?
- Should very large research scopes require admin-only permission or higher usage quotas?
- Should repeat research on the same saved filter set support cached intermediate batch summaries? 
