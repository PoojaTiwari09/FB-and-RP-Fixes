# Doc #11a — Technical Design Document (TDD): AI Smart Summaries

## 1. Document Control

- **Document title:** Technical Design Document — AI Smart Summaries
- **Feature name:** AI Smart Summaries
- **Module name:** M3 AI Summaries & GenAI
- **Architecture module mapping:** M-06 Insight Generation
- **Version:** v1.0
- **Status:** Draft
- **Owner:** Product Engineering — M3
- **Reviewers:** CTO, Tech Lead, AI Lead, Backend Lead, Product Manager, QA Lead
- **Last updated:** 2026-04-30

## 2. Purpose

### Business problem
Revenue teams spend too much time reading long call transcripts, piecing together deal context from multiple interactions, and manually preparing notes for follow-up, CRM updates, and internal reviews. AI Smart Summaries solves this by converting conversation and CRM signals into short, structured, directly usable outputs. 

### What this feature does
AI Smart Summaries automatically generates structured call summaries and briefs by analyzing transcripts, tracker detections, topic tags, deal context, account context, and related CRM signals. The feature produces concise outputs that help reps, managers, and RevOps quickly understand what happened, what matters, what is risky, and what should happen next. 

### Why it belongs in M3
M3 is the module responsible for turning structured signals from earlier modules into human-readable, downstream-consumable outputs such as summaries, briefs, reports, and generated answers. This aligns directly with M-06 Insight Generation in the architecture. 

### Business value
- Reduces time spent reviewing calls and account history.
- Improves rep follow-through by extracting next steps and risks.
- Improves manager visibility with structured deal and account briefs.
- Creates reusable AI outputs that downstream systems can consume.
- Supports CRM note sync and deal/account management workflows. 

## 3. Scope

### In scope
- AI-generated **call summaries** for completed calls.
- AI-generated **deal briefs** combining recent deal-related signals.
- AI-generated **account briefs** combining account-level conversation and activity signals.
- Structured summary storage, versioning, review flags, and regeneration behavior.
- Event emission for downstream consumers.
- Source-linked traceability from summary sections to originating evidence.
- Use of conversation, tracker, topic, and CRM context for summary generation. 

### Out of scope
- Real-time in-call summarization.
- User-authored note editing workflows.
- Full report generation for complex analytical questions; that belongs to AI Deep Researcher.
- Conversational question answering; that belongs to Ask Anything.
- CRM schema design and cross-platform sync logic outside the summary payload boundary. 

### Assumptions
- A transcript exists for the call before summary generation starts.
- Revenue Graph can provide deal/account/contact context where linkage exists.
- Topic tags and tracker detections may arrive slightly after transcript completion.
- AI Services Layer returns structured JSON for summary outputs.
- Multi-tenant isolation is enforced by platform middleware and tenant-scoped storage. 

### Upstream dependencies
- M-01 Data Ingestion for `call.transcription.completed` and transcript records.
- M-03 Revenue Graph for linked deal, account, and contact context.
- M-04 Conversation Intelligence for topic tags.
- M-05 Smart Tracking for tracker detections and signal enrichment.
- Platform Core for tenant resolution, auth, eventing, and persistence. 

### Downstream consumers
- M-03 Revenue Graph, which consumes `call.summary.generated` and can write summary-derived activity notes and AI-extracted fields into CRM sync workflows.
- M-07 Deal and Account Management, which reads deal briefs and account briefs for UI and health/risk visibility.
- M-08 Execution and Automation, indirectly through downstream workflows that use summary outputs and related signals.
- Frontend applications that display call summaries, deal briefs, and account briefs. 

## 4. Users and Triggers

### Primary users
- Account Executives
- Sales Managers
- Customer Success Managers
- RevOps
- Leadership users reviewing deal and account state 

### Trigger types
- **Event-driven:** automatic summary generation after `call.transcription.completed`.
- **Signal-driven refresh:** deal brief refresh after `tracker.detection.created`.
- **Context enrichment refresh:** summary enhancement when topic tags become available.
- **User-initiated:** explicit regenerate action for a call summary or brief. 

### Entry points
- `GET /api/v1/insights/calls/:id/summary`
- `GET /api/v1/insights/deals/:id/brief`
- `GET /api/v1/insights/accounts/:id/brief`
- Internal event consumer for `call.transcription.completed`
- Internal event consumer for `tracker.detection.created`
- Internal event consumer for `call.topics.tagged` 

### Preconditions
- Tenant context must be present and verified.
- A completed transcript must exist for call summary generation.
- Deal or account linkage should exist for deal/account brief generation; if missing, the system may proceed with reduced context where permitted.
- Required AI and database dependencies must be available. 

## 5. Functional Flow

### Happy path
1. M-06 receives `call.transcription.completed`.
2. M-06 loads transcript content and speaker-labeled segments from storage.
3. M-06 requests linked deal, account, and contact context from M-03.
4. M-06 optionally includes topic tags and tracker detections if already available.
5. M-06 assembles a structured prompt payload and calls `POST /v1/summarize` on the AI Services Layer.
6. AI Services Layer returns structured summary JSON.
7. M-06 stores the generated call summary in `callsummaries`.
8. M-06 emits `call.summary.generated`.
9. Downstream modules consume the summary event for CRM and deal/account workflows. 

### Alternate paths
- If deal linkage is not ready, M-06 waits up to 5 minutes using a delayed job, then proceeds without deal context if still unresolved.
- If topic tags are not yet available, the base summary is generated first and can later be enriched or regenerated.
- If multiple tracker detections arrive quickly for the same deal, deal brief refresh is debounced to avoid repeated regeneration. 

### Failure paths
- Transcript not found.
- Revenue Graph context fetch fails.
- AI Services Layer times out or returns invalid schema.
- Database write fails.
- Event publish fails.
- Downstream CRM write fails after summary creation. 

### Retry behavior
- AI summary generation retries up to 3 times on timeout or transient failures.
- Database write operations retry through worker retry policy, then move to DLQ on exhaustion.
- Revenue Graph context fetch waits and retries in delayed fashion for newly linked calls.
- Brief refresh jobs use deduplicated job IDs plus debounce windows to avoid duplicate work. 

## 6. Inputs and Outputs

### Inputs
- Call transcript raw text
- Speaker-labeled transcript segments
- Call metadata
- Deal context
- Account context
- Contact context
- Topic tags
- Tracker detections
- CRM-extracted fields where available
- User or tenant language preference if translation/localization is enabled later in the roadmap 

### Retrieval context
AI Smart Summaries is not pure single-document summarization. It aggregates context from the current call plus linked CRM entities and supporting signals from topic tagging and smart tracking. Deal briefs and account briefs are multi-source outputs that rely on broader context than one transcript alone. 

### Output artifacts
- Call summary payload
- Deal brief payload
- Account brief payload
- Stored summary records with version and confidence metadata
- Review flags for low-confidence outputs
- Event message for downstream consumers 

### Events emitted
- `call.summary.generated` 

### APIs exposed or consumed
**Exposed**
- `GET /api/v1/insights/calls/:id/summary`
- `GET /api/v1/insights/deals/:id/brief`
- `GET /api/v1/insights/accounts/:id/brief`

**Consumed**
- M-03 Revenue Graph APIs for deal/account/contact context
- M-05 Smart Tracking APIs for detections
- AI Services Layer `POST /v1/summarize` 

## 7. Summary Types

### Call summary
A call summary is the shortest and most immediate output. It is generated from one completed call and includes concise takeaways, next steps, risks, evidence snippets, and confidence metadata. The canonical storage table is `callsummaries`. 

### Deal brief
A deal brief is a multi-source summary of the current state of a specific deal. It combines recent call outputs, tracker detections, topic tags, and linked CRM context to provide a usable view of deal status, recent signals, and key risks. The canonical storage table is `dealbriefs`. 

### Account brief
An account brief is a broader, account-level summary that synthesizes interactions and health signals across the account. It is intended for account planning, renewal awareness, expansion planning, and executive review. The canonical storage table is `accountbriefs`. 

## 8. Input Aggregation Rules

### Call summary aggregation rules
- The primary source is the transcript for the target call.
- Include speaker segments for evidence extraction and section grounding.
- Include linked deal/account/contact context if available at generation time.
- Include topic tags when already present.
- Include tracker detections relevant to the same call when already present.
- Do not include unrelated call history by default in the initial call summary unless an explicit “expanded summary” mode is introduced later. 

### Deal brief aggregation rules
- Use the linked deal as the root entity.
- Pull recent summaries, recent tracker detections, relevant topic tags, stage, value, participants, and recent activities tied to the deal.
- Rank recency first, then signal severity, then source confidence.
- Debounce refresh for 60 seconds when multiple tracker detections arrive in a burst.
- Exclude signals outside tenant scope or outside the linked deal boundary. 

### Account brief aggregation rules
- Use the linked account as the root entity.
- Aggregate across related deals, calls, contacts, and account-level engagement signals.
- Prefer the most recent and highest-confidence items, but preserve meaningful trend indicators when present.
- Avoid duplicating the same evidence across multiple sections.
- Keep the brief concise enough for workspace UI display while preserving traceability. 

### General aggregation rules
- Tenant isolation is mandatory in all retrieval.
- Missing context should degrade gracefully instead of blocking the entire output where possible.
- Summaries must prefer structured upstream facts over freeform inference.
- The system must preserve source references for each generated section or extracted claim.
- Duplicate evidence chunks should be deduplicated before prompt assembly. 

## 9. Template or Section Configuration

### Goal
AI Smart Summaries must support a stable structure so outputs are predictable for users, downstream services, and UI rendering. The system should separate **template configuration** from the prompt text so that feature teams can adjust sections without rewriting core orchestration logic. 

### Default call summary template
- One-line summary
- Key points
- Next steps
- Risks
- Topics discussed
- Evidence snippets
- Confidence score
- Review flag 

### Default deal brief template
- Deal overview
- Current stage and momentum
- Key risks
- Recent signals
- Open questions
- Recommended next actions
- Source links
- Confidence score 

### Default account brief template
- Account overview
- Relationship and engagement health
- Recent conversation themes
- Renewal/expansion signals
- Key risks
- Recommended actions
- Source links
- Confidence score 

### Configuration rules
- Templates are versioned and referenced in generation metadata.
- Sections may be hidden or reordered by configuration, but required system sections must remain available for downstream consumers.
- Each section can declare max length, required evidence count, optionality, and formatting type.
- Templates can vary by summary type and later by tenant tier or workspace configuration.
- Any template change that impacts output schema must trigger contract test updates. 

## 10. Source-Link Traceability

### Objective
Every summary output must be traceable back to the evidence used to generate it. This is required for trust, reviewability, and downstream debugging. 

### Traceability design
- Each generated section stores one or more supporting source references.
- A source reference points to the originating entity, such as transcript segment, call, deal signal, tracker detection, or topic tag.
- For transcript-based evidence, the system should preserve call ID, transcript segment ID if available, speaker label, and timestamp range when available.
- For tracker-based evidence, preserve detection ID and snippet.
- For CRM-context-derived content, preserve the source entity and field origin. 

### UI expectation
Users should be able to expand a section and see where the content came from, such as “from call transcript at 12:43” or “from tracker detection in linked deal call.” This mirrors the architecture’s broader emphasis on grounded outputs and cited answer payloads in retrieval-heavy features. 

### Guardrails
- If a claim has no supporting source, it must not be presented as a factual extracted point.
- Low-evidence sections may be omitted, down-scored, or flagged for review.
- Summaries must clearly separate grounded evidence from model-generated phrasing. 

## 11. Data Model

### Primary tables used
- `callsummaries`
- `dealbriefs`
- `accountbriefs`
- `transcripts`
- `speakersegments`
- `trackerdetections`
- `topictags`
- `deals`
- `accounts`
- `contacts`
- `activities`
- `crmextractedfields`
- `semanticembeddings` for optional retrieval and reuse patterns 

### Prompt context records
Prompt assembly uses transcript content, linked business entities, topic tags, tracker detections, and relevant recent activities. The assembled context is derived at runtime and should be auditable through run logs or persisted source references rather than by storing unrestricted raw prompt strings in user-facing tables. 

### Generated output storage
- `callsummaries` stores call-level outputs with key points, next steps, risks, confidence score, review flag, version, and generation time.
- `dealbriefs` stores deal-level outputs with summary text, key risks, recent signals, confidence score, version, and generation time.
- `accountbriefs` stores account-level outputs with summary text, health signals, confidence score, version, and generation time. 
- All three use `summaryevidencelinks` for evidence-link storage rather than inline JSONB source references.

### Versioning rules
- Version starts at `1` for first generation.
- Version increments only on explicit regeneration or refresh that replaces the prior record semantics.
- Regeneration updates the active row with an incremented version field AND appends the prior version to the companion `summaryhistory` table.
- Consumers should read the latest version by default from the primary row.
- Prior versions should remain available for audit/debug use in the `summaryhistory` table. 

### Idempotency keys
- Call summary generation must be idempotent on `(callId, version)`.
- Duplicate `call.transcription.completed` events must not create duplicate version-1 summaries.
- Deal brief refresh jobs should use deterministic job IDs, such as `brief-{dealId}`, to deduplicate queued work. 

## 12. Retrieval and AI Processing

### Retrieval scope
AI Smart Summaries retrieves only the context needed to produce grounded summary outputs. The scope differs by summary type:
- Call summary: current call transcript plus linked context and same-call signals.
- Deal brief: deal-centric recent history and signals.
- Account brief: account-centric recent history and health signals. 

### Source ranking
Recommended ranking order:
1. Primary transcript evidence from the target interaction.
2. Linked deal/account/contact context from Revenue Graph.
3. High-confidence tracker detections.
4. Topic tags and structured AI labels.
5. Recent relevant activities and CRM-extracted fields. 

### Prompt assembly
Prompt assembly should include:
- Summary type
- Entity identifiers and tenant context
- Structured business context
- Ranked evidence blocks
- Output schema contract
- Style and brevity rules
- Hallucination prevention rules
- Traceability requirements for section evidence 

### AI service endpoint
- `POST /v1/summarize` on the AI Services Layer 

### Structured output schema
At minimum, the summary service must return a typed JSON contract aligned to summary type.

**Call summary contract**
```json
{
  "oneLineSummary": "string",
  "keyPoints": [
    {
      "point": "string",
      "evidenceSnippet": "string",
      "sourceRef": "string"
    }
  ],
  "nextSteps": [
    {
      "action": "string",
      "owner": "string|null",
      "dueDate": "string|null",
      "sourceRef": "string"
    }
  ],
  "risks": [
    {
      "riskType": "string",
      "severity": "low|medium|high|critical",
      "snippet": "string",
      "sourceRef": "string"
    }
  ],
  "topicsDiscussed": ["string"],
  "confidenceScore": 0.0,
  "flaggedForReview": false
}
```

**Deal brief contract**
```json
{
  "summaryText": "string",
  "keyRisks": [
    {
      "riskType": "string",
      "severity": "low|medium|high|critical",
      "sourceCallId": "uuid|null",
      "sourceRef": "string"
    }
  ],
  "recentSignals": [
    {
      "signalType": "string",
      "description": "string",
      "sourceRef": "string"
    }
  ],
  "confidenceScore": 0.0
}
```

**Account brief contract**
```json
{
  "summaryText": "string",
  "healthSignals": [
    {
      "signalType": "string",
      "trend": "positive|neutral|negative",
      "source": "string",
      "sourceRef": "string"
    }
  ],
  "confidenceScore": 0.0
}
```

### Confidence or grounding strategy
- Confidence is derived from model output plus source completeness checks.
- Any output below `0.7` confidence is flagged for review.
- Missing or sparse evidence reduces confidence and may suppress specific sections.
- Traceability coverage should be part of the confidence computation. 

### Hallucination prevention rules
- Do not invent facts not present in transcript, tracker detections, topic tags, or CRM context.
- Do not present uncertain inferences as confirmed facts.
- Prefer omission over fabrication.
- Every major claim must map to source evidence.
- If context is insufficient, say so in structured output rather than guessing. 

## 13. Service and Integration Design

### Internal services
- `InsightGenerationModule` in NestJS orchestrates summary generation and persistence.
- BullMQ workers process event-driven jobs and refresh jobs.
- AI Services Layer performs summarization.
- Revenue Graph supplies linked business context.
- Smart Tracking supplies detection evidence. 

### AI service endpoints
- `POST /v1/summarize` for structured summary generation 

### Search and retrieval dependencies
AI Smart Summaries is less retrieval-heavy than Ask Anything, but it still depends on structured context retrieval from internal services and storage tables. Where embeddings are used later for summary reuse or semantic context expansion, retrieval must remain tenant-scoped and bounded to the relevant entity context. 

### CRM context usage
Revenue Graph provides deal, account, and contact context such as stage, account name, participants, and linked entities. That context is used to improve summary relevance and to enable downstream CRM note sync after event emission. 

### Queue workers and job orchestration
- `call.transcription.completed` triggers call summary generation.
- `tracker.detection.created` triggers debounced deal brief refresh.
- `call.topics.tagged` can enrich or regenerate summary structure where applicable.
- Failed jobs retry per queue policy and then move to DLQ. 

## 14. Security and Compliance

### Tenant isolation
All summary generation, retrieval, storage, and event payloads must be tenant-scoped. Platform middleware automatically injects tenant context and query scoping, and this behavior must not be bypassed. 

### Access control
Only authenticated users with access to the underlying call, deal, or account should be able to retrieve summaries and briefs. API guards and role checks apply at the route layer. 

### Data visibility rules
Summary outputs must not expose data from calls, contacts, or deals outside the requesting user’s permitted business scope. If a user cannot access the source entity, they cannot access the generated summary artifact derived from it. 

### Prompt data sensitivity
Prompt payloads may contain sensitive sales and customer information. Prompt construction must minimize unnecessary fields, avoid leaking cross-tenant data, and follow approved internal AI service boundaries. 

### Audit logging
Generation attempts, failures, review flags, and regeneration actions must be logged with tenant ID, entity ID, version, timing, and status for debugging and compliance review. 

## 15. Error Handling

### Missing context behavior
- If transcript is missing, fail summary generation and retry according to queue policy.
- If deal/account context is missing, proceed with reduced context where allowed and lower confidence.
- If topic tags or tracker detections are missing, generate the best grounded output possible and allow later refresh. 

### Low-confidence retrieval handling
- Flag output for review when confidence is below threshold.
- Suppress weakly grounded sections instead of filling them with speculative text.
- Record missing evidence reasons in logs or metadata. 

### AI generation failure handling
- Retry up to 3 times for transient AI service failures.
- If retries fail, mark the generation as failed and raise observability alerts.
- For call summary generation, no silent success should be recorded without a persisted summary artifact. 

### Timeout and partial-output rules
- Call summaries may fail cleanly if the core generation step times out.
- Deal and account briefs may return the latest cached version if refresh generation fails, provided the API clearly marks freshness state in implementation.
- Partial sections may be allowed only if schema contract remains valid and traceability is preserved. 

### DLQ conditions
Move jobs to DLQ when retries are exhausted due to:
- repeated AI service timeout,
- repeated database write failure,
- invalid structured response,
- unrecoverable context retrieval failure. 

## 16. Observability

### Logs
Capture:
- generation request ID,
- tenant ID,
- entity ID,
- summary type,
- model endpoint,
- latency,
- token or prompt size metadata,
- confidence,
- retry count,
- final status. 

### Metrics
Track:
- summaries generated per type,
- average generation latency,
- failure rate,
- retry rate,
- review-flag rate,
- regeneration rate,
- context-missing rate,
- downstream event publish success rate. 

### Alerts
Alert on:
- AI service timeout spikes,
- DLQ growth,
- summary generation failure rate above threshold,
- database write failure spikes,
- event publish failures,
- abnormal confidence degradation. 

### Quality signals
- evidence coverage ratio,
- average confidence score,
- user regenerate frequency,
- user copy/use rate if instrumentation is added,
- downstream consumption success,
- manual review override frequency. 

### Cost monitoring
Track model-call volume, average tokens per summary type, and cost by tenant and summary type to detect runaway prompt growth or noisy refresh patterns. 

## 17. Non-Functional Requirements

### Latency targets
Recommended targets:
- Call summary generation: near-real-time async completion after transcript readiness.
- Deal brief refresh: async, usually within a small number of minutes after signal bursts settle.
- API retrieval of stored summaries: low-latency read path from database.  
The architecture’s post-call pipeline targets summary generation within the broader post-call agent timing envelope. 

### Throughput
The system must support many concurrent post-call summary jobs across tenants and queue-based burst handling after business-hour call peaks. 

### Scalability
Scale through queue workers, bounded prompt assembly, deduplicated refresh jobs, and efficient tenant-scoped reads. 

### Reliability
Summary generation must be retry-safe, idempotent, and resilient to upstream delay in context linking or signal arrival. 

## 18. Test Strategy

### Unit tests
- Prompt assembly per summary type
- Input ranking and deduplication
- Confidence threshold logic
- Schema validation
- Traceability mapping
- Version increment rules
- Idempotency key behavior 

### Integration tests
- `call.transcription.completed` to stored call summary
- Revenue Graph context fetch and fallback behavior
- `tracker.detection.created` to debounced deal brief refresh
- `call.topics.tagged` enrichment path
- `call.summary.generated` event publish and consumer compatibility 

### Retrieval-quality tests
- Verify correct evidence selection from transcript and linked business context.
- Verify duplicate evidence suppression.
- Verify recent/high-severity deal signals are prioritized in deal briefs.
- Verify account brief aggregation does not mix entities across accounts. 

### Prompt-output contract tests
- Ensure AI service output always matches required JSON schema.
- Validate required fields by summary type.
- Validate sourceRef presence for evidence-backed sections.
- Reject malformed or under-specified model responses. 

### Regression and idempotency tests
- Duplicate event delivery should not create duplicate version-1 summaries.
- Reprocessing same call should be skipped unless regenerate is explicitly requested.
- Multiple rapid tracker detections should still result in one debounced brief refresh.
- Old template versions should not break stored-summary reads. 

## 19. Event Schema

### `call.summary.generated`
This event is emitted by M-06 after a call summary is successfully persisted. The architecture defines the payload fields and identifies Revenue Graph as a consumer, while broader module mapping also shows downstream summary consumption by deal/account workflows. 

**Queue name**
- `call.summary.generated` 

**Producer**
- M-06 Insight Generation 

**Consumers**
- M-03 Revenue Graph
- M-07 Deal and Account Management, via downstream use of generated summary outputs and reads from M-06-backed artifacts in architecture flows and module relationships. 

**Payload schema**
```json
{
  "eventId": "uuid",
  "summaryId": "uuid",
  "callId": "uuid",
  "tenantId": "uuid",
  "confidenceScore": 0.0,
  "flaggedReview": false,
  "generatedAt": "ISO-8601 timestamp"
}
```

**Emission rules**
- Emit only after summary persistence succeeds.
- Do not emit for failed or partial writes.
- Preserve idempotency by associating event emission with the persisted summary version.
- Include the exact persisted `summaryId` used for downstream joins. 

## 20. Open Questions

- Should deal brief and account brief refresh events be formalized into separate emitted events in Phase 3, or remain read-driven from stored artifacts?
- Should summary template configuration be tenant-configurable in Phase 3 or platform-default only?
- Resolved: Source references must be stored in a normalized `summaryevidencelinks` table, not inline.
- Resolved: Regeneration updates the active row with an incremented version AND appends the prior version to a companion `summaryhistory` table.
- Should translated summaries be handled in this feature or deferred to the translation capability roadmap? 
