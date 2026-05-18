# Doc #11b — Technical Design Document (TDD): Ask Anything

## 1. Document Control

- **Document title:** Technical Design Document — Ask Anything
- **Feature name:** Ask Anything
- **Module name:** M3 AI Summaries & GenAI
- **Architecture module mapping:** M-06 Insight Generation
- **Version:** v1.0
- **Status:** Draft
- **Owner:** Product Engineering — M3
- **Reviewers:** CTO, Tech Lead, AI Lead, Backend Lead, Product Manager, QA Lead
- **Last updated:** 2026-04-30

## 2. Purpose

### Business problem
Sales, RevOps, and managers often need answers from a large volume of calls, emails, and CRM-linked context, but manually searching transcripts and piecing together evidence is slow and unreliable. Ask Anything solves this by letting users ask natural-language questions and receive grounded answers from captured interactions and business context. 

### What this feature does
Ask Anything is an AI-powered conversational interface inside R-Revenue Intelligence that answers natural-language questions about calls, emails, deals, accounts, and contacts. It uses retrieval-augmented generation (RAG) to retrieve relevant context, synthesize an answer, and return cited sources in the product response. 

### Why it belongs in M3
M3 exists to convert structured and semi-structured upstream signals into directly usable outputs such as summaries, reports, and natural-language answers. Ask Anything is explicitly part of M-06 Insight Generation and is implemented as a real-time answer-generation capability over prior interaction data and CRM context. 

### Business value
- Reduces manual analysis time for reps and managers.
- Makes conversation and CRM knowledge queryable in plain language.
- Improves trust with grounded, cited answers.
- Supports iterative follow-up questions through stored conversation sessions.
- Gives non-technical users fast access to deal and account intelligence. 

## 3. Scope

### In scope
- Natural-language questions about calls, emails, deals, accounts, and contacts.
- Retrieval-augmented answering using embeddings and vector search.
- Source citation or source-reference inclusion in product answers.
- Session persistence for follow-up questions.
- Context-aware queries scoped to tenant and optional entity context such as deal or account.
- Grounded answer generation from stored platform data and related CRM context. 

### Out of scope
- Long-running multi-step research jobs over very large data windows; those belong to AI Deep Researcher.
- Real-time in-call assistant behavior.
- Free web search or internet-grounded answering.
- Autonomous action-taking such as updating CRM or sending emails directly from the answer flow.
- Unbounded cross-tenant or cross-workspace knowledge search. 

### Assumptions
- Relevant embeddings exist for searchable content such as transcripts, summaries, and emails.
- Tenant-scoped vector retrieval is available through pgvector-backed search.
- Query sessions are persisted and linked to a user and tenant.
- AI Services Layer supports query embedding and answer generation with citations.
- User authorization is enforced before data retrieval begins. 

### Upstream dependencies
- M-01 Data Ingestion for calls and transcripts.
- M-02 Sales Engagement for emails and email activity context.
- M-03 Revenue Graph for deal, account, and contact relationships.
- M-04 Conversation Intelligence for topics and derived conversation metadata.
- M-05 Smart Tracking and Search for searchable signals and supporting retrieval surfaces.
- Platform Core for auth, tenant context, APIs, and persistence. 

### Downstream consumers
- Frontend Ask Anything chat interface.
- Sales reps and managers using session history for follow-up questions.
- Potential downstream internal analytics on query usage, question types, and answer quality.
- M3 session history and stored query messages for continuity and auditability. 

## 4. Users and Triggers

### Primary users
- Account Executives
- Sales Managers
- Customer Success Managers
- RevOps
- Leadership users needing fast answers from interaction history 

### Trigger types
- **User-initiated sync request:** user submits a natural-language question.
- **Follow-up session request:** user asks a follow-up question in an existing session.
- **Contextual entry:** user opens Ask Anything from a deal, account, or call context and submits a query. 

### Entry points
- `POST /api/v1/insights/ask`
- `GET /api/v1/insights/ask/sessions/:id` 

### Preconditions
- User must be authenticated and tenant context must be available.
- Session must either exist or be created at first question.
- Retrieval indexes and embeddings must be available for relevant content types.
- Query must pass validation for size, auth scope, and supported input shape. 

## 5. Functional Flow

### Happy path
1. User submits a question to `POST /api/v1/insights/ask`.
2. M-06 receives the query plus optional contextual metadata such as deal or account scope.
3. M-06 embeds the query using the AI Services Layer.
4. M-06 retrieves relevant chunks using pgvector semantic search and tenant/context filters.
5. M-06 sends the query, retrieved chunks, and query context to `POST /v1/answer-query`.
6. AI Services Layer returns a grounded answer with cited sources.
7. M-06 persists the assistant response into the query session history.
8. M-06 returns the answer payload to the frontend. 

### Alternate paths
- If the query is scoped to a deal or account, retrieval is restricted to that entity context.
- If the session already exists, prior messages are included as follow-up context.
- If semantic retrieval is weak, the system may still return a limited answer that explicitly states insufficient supporting evidence rather than guessing. 

### Failure paths
- Embedding generation fails.
- Vector retrieval returns no relevant chunks.
- AI answer generation times out or fails schema validation.
- Session write fails after answer generation.
- User requests data outside permitted access scope. 

### Retry behavior
- Embedding and answer-generation calls retry according to AI service retry policy.
- Session persistence retries for transient database failures.
- Retrieval failure may fall back to a narrower or text-light response only if the system can still preserve grounding; otherwise the request fails with a clear user-safe response. 

## 6. Inputs and Outputs

### Inputs
- User natural-language query
- Tenant context
- User context
- Optional `sessionId`
- Optional `dealId`
- Optional `accountId`
- Optional UI-applied filters such as date range or entity scope
- Prior messages in the existing session, when present 

### Retrieval context
Ask Anything uses RAG over tenant-scoped embeddings and linked business context. The architecture shows it retrieving relevant chunks with vector search and passing those chunks, along with query context, into answer generation. Relevant searchable artifacts include transcripts, summaries, emails, and linked CRM context represented through the product data model. 

### Output artifacts
- Answer text
- Cited or source-linked references
- Session message persistence
- Query response metadata such as timestamps and source set
- Stored assistant message in session history 

### Events emitted
No dedicated Ask Anything event emission is explicitly defined in the architecture for Phase 3. The feature is primarily request/response plus session persistence. 

### APIs exposed or consumed
**Exposed**
- `POST /api/v1/insights/ask`
- `GET /api/v1/insights/ask/sessions/:id`

**Consumed**
- AI Services Layer `POST /v1/embed`
- AI Services Layer `POST /v1/answer-query`
- Internal vector search service over pgvector
- Revenue Graph and related entity-resolution context as needed for scoping 

## 7. Supported Question Types

### Core supported types
Ask Anything supports natural-language questions about:
- Calls
- Emails
- Deals
- Accounts
- Contacts 

### Recommended supported query categories
- **Fact lookup:** “What was promised in the last call with Acme?”
- **Summary lookup:** “Give me the key takeaways from recent calls on this deal.”
- **Risk discovery:** “What risks are showing up in this account?”
- **Next-step discovery:** “What follow-ups were agreed with the buyer?”
- **Entity-specific questions:** “What did the champion say about budget?”
- **Comparative context within scope:** “How has this account’s sentiment changed across recent conversations?”  
These categories align with the product’s purpose of contextual, data-backed answers from interactions and CRM-linked context. 

### Not supported or deliberately limited
- Open-ended internet questions.
- Questions requiring unsupported external datasets.
- Questions that imply actions rather than answers, such as “update CRM now.”
- Questions outside the user’s authorization scope.
- Questions that require fully autonomous long-form report generation across very large corpora; those should be redirected to AI Deep Researcher. 

## 8. Query Interpretation

### Goal
The system must translate a freeform question into a retrieval plan and answering strategy without changing the user’s intent. Query interpretation should identify the likely entity scope, time scope, content type, and whether the current session context should shape retrieval. 

### Interpretation steps
1. Normalize the raw user query.
2. Resolve session context such as current deal or account.
3. Detect entity references, such as account name, contact name, deal, or call.
4. Detect retrieval hints, such as recency, stage, person, or activity type.
5. Build a structured `QueryContext` object for downstream retrieval and answer generation. 

### QueryContext fields
Recommended fields:
- `tenantId`
- `userId`
- `sessionId`
- `dealId`
- `accountId`
- `contactId`
- `timeRange`
- `entityTypes`
- `contentTypes`
- `questionType`
- `followUpToMessageId`  
The architecture explicitly references a `QueryContext` object in the Ask Anything flow. 

### Follow-up interpretation
If the user asks a follow-up such as “What about pricing?” the system should resolve that against the current session and entity context rather than treating it as a brand-new global query. Session history and current context therefore directly shape query interpretation. 

### Ambiguity handling
- Prefer existing session context when the query is short or referential.
- If multiple entities match and confidence is low, ask a clarification question or constrain to the current workspace context.
- Do not silently broaden scope beyond the user-visible context without an explicit signal. 

## 9. Retrieval Scope and Filters

### Retrieval scope
The Ask Anything architecture uses hybrid retrieval (Meilisearch + pgvector) as the default Phase 3 retrieval mode. It runs pgvector semantic search, supplements with Meilisearch full-text results when `RETRIEVAL_ENABLE_HYBRID_SEARCH = true`, merges and ranks results before prompt assembly, and falls back to pgvector-only if Meilisearch is unavailable. Retrieval should be tenant-scoped first, then narrowed by entity context such as deal or account, then ranked by relevance and any structured filters. 

### Searchable sources
Recommended searchable sources for Ask Anything:
- Transcript chunks
- Call summaries
- Deal briefs
- Account briefs
- Email content and sent email records
- Tracker detections and related snippets
- Topic-tag-derived context
- CRM-linked activity context where represented in product storage 

### Filters
Supported filters should include:
- `tenantId` (mandatory)
- `dealId`
- `accountId`
- `contactId`
- `callId`
- content type
- date range
- participant or rep
- activity source type where available 

### Ranking strategy
Recommended ranking order:
1. Hard filters and tenant scope.
2. Semantic similarity score.
3. Entity-match strength.
4. Recency.
5. Source quality, such as summary vs raw chunk depending on question type.
6. Diversity control to avoid returning near-duplicate chunks. 

### Limits
- Default retrieval limit: top 20 chunks, matching the architecture’s Ask Anything flow.
- Use bounded chunk counts to control latency and cost.
- Apply deduplication before answer generation. 

## 10. Grounded Answer Generation

### Objective
Ask Anything must answer from retrieved evidence, not from model guesswork. The generated answer should be grounded in retrieved chunks and business context, with explicit source references in the final response. 

### Answer generation flow
- Embed query.
- Retrieve top relevant chunks.
- Pass `query`, `chunks`, and `context` to `POST /v1/answer-query`.
- Request output format `answerWithCitations`.
- Persist answer text plus source references into the session. 

### Answer rules
- Every factual claim should be supportable by retrieved context.
- If evidence is incomplete, answer conservatively and state the limitation.
- Separate direct evidence from inferred synthesis.
- Use concise language suitable for sales users.
- Preserve current session scope unless the user explicitly broadens it. 

### Grounding guardrails
- No unsupported facts.
- No cross-tenant retrieval.
- No use of hidden or inaccessible entities.
- No fabricated citations.
- No answer should imply certainty beyond what sources support. 

## 11. Citation or Source-Reference Strategy in Product Response

### Product requirement
The architecture explicitly describes Ask Anything as returning an answer with cited sources, and persisted session messages include `sources` or `citedSources` metadata. This means source-reference display is a product-level behavior, not just a back-end debug detail. 

### Source-reference design
Each response should include:
- Answer text
- Ordered source list
- Source type, such as transcript, summary, email, tracker detection, or brief
- Source entity ID
- Snippet or excerpt where safe to display
- Timestamp or segment reference for transcript-based evidence when available 

### UI behavior
The product should show citations inline or as expandable source chips/cards. A user should be able to understand which call, email, or record supported the answer without leaving the chat flow. 

### Storage behavior
`querymessages` should store:
- `messageId`
- `sessionId`
- `tenantId`
- `role`
- `content`
- `citedSources`
- `createdAt` 

### Citation quality rules
- Each answer must contain at least one source reference unless the response is a refusal due to no evidence.
- Repeated duplicate references should be collapsed.
- Source references must only point to records the user is authorized to view.
- If source quality is weak, the answer should explicitly note low grounding confidence. 

## 12. Session and Follow-Up Handling

### Session model
Ask Anything uses persistent conversation sessions stored in M-06. The architecture defines `querysessions` for conversation sessions and `querymessages` for individual turns with content and cited sources. 

### Session rules
- A new session is created for the first user question unless a valid `sessionId` is provided.
- Each assistant response is appended to the session history.
- Sessions are tenant- and user-scoped.
- Sessions can optionally carry entity context such as `contextDealId` and `contextAccountId`. 

### Follow-up behavior
Follow-up questions should:
- reuse existing session context,
- interpret short references using prior turns,
- narrow retrieval to previously established entity scope unless broadened,
- preserve answer grounding with new retrieval on each turn rather than relying only on chat memory. 

### Session persistence
The architecture shows assistant messages persisted with `role`, `content`, `sources`, and timestamp. Recommended implementation should persist both user and assistant turns so the complete session is reproducible for product continuity and debugging. 

### Session retrieval
- `GET /api/v1/insights/ask/sessions/:id` returns full Ask Anything session history.
- Returned messages should include role, content, and source references in display-ready shape. 

## 13. Data Model

### Primary tables used
- `querysessions`
- `querymessages`
- `semanticembeddings`
- `transcripts`
- `speakersegments`
- `callsummaries`
- `dealbriefs`
- `accountbriefs`
- email-related conversation tables
- linked deal/account/contact/activity tables through scoped retrieval and joins where needed 

### Prompt context records
Prompt context is assembled from retrieved chunks plus structured query context. The system should preserve enough request metadata and cited-source mapping to reproduce why a given answer was returned, without exposing raw internal prompt internals in user-facing storage. 

### Generated output storage
- `querysessions` stores session header and context metadata.
- `querymessages` stores each turn, including cited sources.
- Embeddings remain in `semanticembeddings` and are reused for retrieval, not regenerated unnecessarily on every request. 

### Versioning rules
Ask Anything responses are turn-based rather than versioned like summaries. The canonical history is the ordered message sequence in a session. If answer regeneration is later added, regenerated answers should create a new assistant turn or a revision marker rather than silently overwriting the old content. 

### Idempotency keys
- API requests should include request IDs for safe retry handling.
- Duplicate writes of the same assistant message should be prevented through request-level idempotency or transactional message persistence.
- Session creation should avoid duplicates for client retries on network failure. 

## 14. Retrieval and AI Processing

### Retrieval scope
Ask Anything uses retrieval over tenant-scoped embeddings for transcripts, summaries, and emails, and combines that with optional entity context such as `dealId` or `accountId`. The architecture’s retrieval flow shows a vector search with tenant ID and optional deal filter, returning up to 20 chunks. 

### Source ranking
Recommended source ranking:
1. Exact entity-scoped matches.
2. High-semantic-similarity transcript chunks.
3. Relevant summaries and briefs.
4. Email records tied to the same context.
5. Tracker and topic-derived supporting signals. 

### Prompt assembly
Prompt assembly should include:
- user query,
- interpreted query type,
- session context,
- retrieved chunks,
- answering rules,
- citation requirements,
- refusal behavior when evidence is insufficient. 

### AI service endpoints
- `POST /v1/embed`
- `POST /v1/answer-query` 

### Structured output schema
Recommended Ask Anything answer contract:
```json
{
  "text": "string",
  "sources": [
    {
      "sourceType": "transcript|summary|email|dealBrief|accountBrief|trackerDetection|activity",
      "entityId": "uuid",
      "snippet": "string",
      "callId": "uuid|null",
      "timestampStart": "number|null",
      "timestampEnd": "number|null"
    }
  ],
  "confidenceScore": 0.0,
  "grounded": true,
  "needsClarification": false
}
```

### Confidence or grounding strategy
- Confidence should consider retrieval quality, semantic score, source count, and evidence consistency.
- Answers with weak evidence should be marked lower confidence and worded conservatively.
- No-evidence answers should be a graceful refusal or clarification request, not a speculative response. 

### Hallucination prevention rules
- Only answer from retrieved and authorized evidence.
- Never invent calls, messages, contacts, or facts.
- Never cite sources not present in the retrieval set.
- Prefer “I could not find enough evidence” over guessed content.
- Re-run retrieval on follow-ups instead of answering only from session memory. 

## 15. Service and Integration Design

### Internal services
- `InsightGenerationModule` orchestrates Ask Anything request handling.
- AI Services Layer provides embeddings and answer generation.
- pgvector-backed retrieval service performs semantic search.
- Revenue Graph provides entity context and relationships as needed for scoping.
- Platform Core provides auth, tenant context, and storage. 

### AI service endpoints
- `POST /v1/embed` for query embeddings.
- `POST /v1/answer-query` for grounded answer synthesis with citations. 

### Search and retrieval dependencies
- `semanticembeddings` table for vector search.
- pgvector similarity search.
- Searchable content derived from transcripts, summaries, briefs, and emails.
- Entity scoping from Revenue Graph. 

### CRM context usage
CRM-linked deal, account, and contact relationships are used to narrow retrieval and improve answer relevance. Ask Anything should not directly mutate CRM state; it uses CRM context for better answers, not for direct side effects. 

### Queue workers and job orchestration
Ask Anything is primarily synchronous from the user perspective, but it still depends on precomputed embeddings and previously ingested/stored data. Heavy indexing and embedding generation happen upstream or asynchronously outside the request’s critical path. 

## 16. Security and Compliance

### Tenant isolation
Every query, retrieval operation, session, and source reference must be strictly tenant-scoped. RLS, middleware, and tenant interceptors form the defense-in-depth boundary for Ask Anything. 

### Access control
A user must not receive answers grounded in entities they are not allowed to access. Authorization checks must apply before retrieval and again before returning source references. 

### Data visibility rules
If the user can see a deal but not a restricted contact or call, returned source references must respect the narrower permission boundary. Source references shown in the UI must never leak hidden records. 

### Prompt data sensitivity
Prompt payloads may contain sensitive customer conversation content. The system must minimize unnecessary context, avoid over-broad retrieval, and keep all prompt traffic within approved internal AI service boundaries. 

### Audit logging
Log:
- query request ID,
- tenant ID,
- user ID,
- session ID,
- retrieval latency,
- answer latency,
- source count,
- confidence,
- failure reason where applicable. 

## 17. Error Handling

### Missing context behavior
- If session context is missing, proceed as a standalone query.
- If expected entity context is missing or deleted, remove that scope and answer only from valid accessible context.
- If no relevant evidence is found, return a safe “not enough evidence” response. 

### Low-confidence retrieval handling
- Return a conservative answer or a clarification prompt.
- Clearly indicate limited evidence.
- Avoid definitive claims when source strength is weak. 

### AI generation failure handling
- Retry transient failures.
- On repeated failure, return a user-safe error and do not persist a partial assistant message as final.
- Log the failure with request and session correlation IDs. 

### Timeout and partial-output rules
- If retrieval succeeds but answer generation times out, do not fabricate a partial answer.
- If answer generation succeeds but session persistence fails, treat the request as failed for continuity unless the product explicitly supports ephemeral answers.
- If only low-quality evidence is available, answer with limitation messaging instead of a full synthesized response. 

### DLQ conditions
Ask Anything is mostly request/response, so DLQ use is limited compared with background jobs. Any async indexing or upstream embedding workflows that support Ask Anything should use normal retry and DLQ handling outside this user-facing request path. 

## 18. Observability

### Logs
Capture:
- query text hash or safe redacted form,
- request ID,
- session ID,
- tenant ID,
- user ID,
- retrieval filter set,
- source count,
- chosen model endpoint,
- total latency,
- failure type. 

### Metrics
Track:
- queries per day,
- average answer latency,
- retrieval hit rate,
- no-evidence rate,
- clarification rate,
- follow-up session rate,
- average sources per answer,
- answer failure rate,
- confidence distribution. 

### Alerts
Alert on:
- AI endpoint timeouts,
- retrieval service latency spikes,
- source count collapse,
- abnormal no-evidence spikes,
- session write failures,
- tenant-isolation or auth enforcement exceptions. 

### Quality signals
- citation coverage,
- user thumbs-up/down if later added,
- follow-up rate after answer,
- abandonment after no-evidence response,
- source click-through rate,
- regeneration or repeat-question frequency. 

### Cost monitoring
Track tokens per answer, average retrieved chunk count, embedding call rate, and cost by tenant or workspace to prevent prompt bloat and inefficient retrieval fan-out. 

## 19. Non-Functional Requirements

### Latency targets
Ask Anything is a user-facing interactive feature, so answer latency must be low enough for chat-like usage. Performance should rely on precomputed embeddings, bounded retrieval size, and efficient session reads. 

### Throughput
The system must handle concurrent interactive queries across tenants without blocking on heavy upstream indexing work. 

### Scalability
Scale through efficient vector indexing, capped retrieval sizes, reusable embeddings, and stateless request orchestration in NestJS plus separate AI services. 

### Reliability
Ask Anything must fail safely, preserve session integrity, and never sacrifice grounding for speed. 

## 20. Test Strategy

### Unit tests
- Query interpretation logic
- Session-context resolution
- Retrieval filter construction
- Source deduplication
- Citation formatting contract
- Confidence and no-evidence thresholds
- Authorization checks for source-return paths 

### Integration tests
- `POST /api/v1/insights/ask` end-to-end with retrieval and answer generation
- `GET /api/v1/insights/ask/sessions/:id` session history retrieval
- Deal-scoped and account-scoped query behavior
- Follow-up query behavior in existing sessions
- Unauthorized entity access rejection 

### Retrieval-quality tests
- Relevant chunks are returned for common query types.
- Deal/account filters reduce false positives.
- Duplicate chunks are suppressed.
- Recent and entity-relevant evidence outranks older generic evidence. 

### Prompt-output contract tests
- `POST /v1/answer-query` returns valid `answerWithCitations` schema.
- Each factual answer includes one or more source entries unless the response is a refusal.
- Invalid source references are rejected.
- Grounded/no-evidence behavior is enforced. 

### Regression and idempotency tests
- Repeated request retries do not duplicate session messages.
- Short follow-up questions resolve correctly against prior context.
- Model changes do not break source-reference structure.
- Security regressions do not allow cross-entity or cross-tenant leakage. 

## 21. Open Questions

- Resolved: Hybrid retrieval (Meilisearch + pgvector) is the default Phase 3 retrieval mode, as declared in the env registry.
- Should the product ask clarification questions automatically when entity ambiguity is high, or should it choose the current page context by default?
- Should source references show raw snippets, redacted snippets, or only links depending on user role?
- Should answer confidence be exposed directly in the UI or only used internally for phrasing and review logic?
- Resolved: Session retention must be configurable by tenant policy. Default is 90 days, configurable to 30, 60, 90, 180 days via workspace settings, with a hard maximum of 365 days. 

