# Doc #11g — TDD: Searchable Conversation Library

## 1. Document Control

- **Document title:** Technical Design Document — Searchable Conversation Library 
- **Feature name:** Searchable Conversation Library 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-05 Smart Tracking and Search 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Backend Lead / Search and Conversation Intelligence squads 
- **Reviewers:** AI Lead, Data Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Product note:** Searchable Conversation Library is grouped under **M2 Conversation Intelligence** in product mapping because users experience it as part of understanding and exploring conversations.   
> **Architecture note:** The system architecture places the implementation under **M-05 Smart Tracking and Search**, which owns search APIs, hybrid retrieval, indexing sync, and the search archive behavior. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Implementation owner:** M-05 Smart Tracking and Search. 
- **Supporting dependencies:** M-01 for transcripts, M-03 for entity linkage, M-04 for topic tags, and AI Services for embeddings. 
- **Primary responsibility:** Let users find, filter, analyze, export, and navigate calls and related conversation records using hybrid search. 

---

## 2. Purpose

Searchable Conversation Library gives users a searchable, filterable archive of captured and transcribed conversations so they can quickly find the right call, email, topic, or signal without manually scanning records.   
It combines traditional full-text search with semantic retrieval so users can find exact terms as well as meaning-based matches. 

This feature is grouped under conversation intelligence in the product because it helps users understand what happened in customer interactions.   
In the architecture, it lives in M-05 because that module already owns hybrid search, tracker detection, indexing sync, and the conversation search endpoints. 

### Business problem

- Teams collect many calls and emails, but raw archives are hard to explore at scale. 
- Keyword-only search misses meaning, while semantic-only search misses precise filters and exact terms. 
- Users also need operational actions like filtering, saving views, exporting, and sharing results. 

### What the feature does

- Indexes calls, emails, and related search metadata into a searchable archive. 
- Supports hybrid full-text plus semantic retrieval. 
- Allows filtering, pagination, export, and saved search workflows. 
- Surfaces a clean library view for searching across customer interactions. 

---

## 3. Scope

### In scope

- Conversation archive search across calls and emails. 
- Full-text indexing via Meilisearch. 
- Semantic retrieval using embeddings with pgvector. 
- Saved searches and reusable filter states. 
- Export and share actions on search results. 
- Search filters on conversation records and linked business context. 

### Out of scope

- Real-time in-call search during a live meeting. 
- Raw transcription generation, which belongs to transcription. 
- Deep analytical answer generation, which belongs to Ask Anything and M-06. 
- CRM relationship ownership, which belongs to M-03 Revenue Graph. 

### Assumptions

- Calls and emails are already captured and stored by upstream modules. 
- Entity linking such as deal or account mapping is available from M-03 when present. 
- Topic tags and tracker detections may enrich search quality and filtering over time. 
- Search must remain tenant-isolated. 

### Upstream dependencies

- M-01 call transcription completion. 
- M-02 outbound email events where those records are included in conversation search. 
- M-03 revenue-graph entity linking for deal, contact, and account context. 
- M-04 topic tags indexed into Meilisearch for filtered search. 
- AI Services `v1embed` for semantic search embeddings. 

### Downstream consumers

- Frontend conversation library screens. 
- Deal and account workflows that need conversation lookup. 
- Insight workflows that need search-driven discovery before analysis. 

---

## 4. Users and Triggers

### Primary users

- Sales reps searching past conversations for context. 
- Managers reviewing themes, risks, and activity patterns across calls. 
- RevOps users filtering and exporting interaction data for analysis. 
- AI and backend services performing semantic retrieval support flows. 

### Trigger types

- New transcription completed. 
- Topic tags produced and indexed. 
- Email events captured for searchable archives. 
- User-initiated search, filter, export, share, or saved search action. 

### Entry points

- `GET /api/v1/smart-tracking/conversations/search` for hybrid search. 
- `GET /api/v1/smart-tracking/conversations` for paginated archive listing with many filters. 
- Frontend conversation library screens in the M2 product experience. 

### Preconditions

- User must be authenticated with tenant context. 
- Searchable records must already be indexed or retrievable. 
- Filter inputs must be validated before passing to Meilisearch or vector retrieval. 

---

## 5. Functional Flow

### Happy path

1. A call transcript or email record is created upstream.   
2. M-05 receives the relevant event and syncs searchable fields into the search index.   
3. Search metadata such as topic tags or linked entity context is added as enrichment when available.   
4. The frontend sends a query plus filters to the conversation search API.   
5. M-05 runs full-text search in Meilisearch and semantic retrieval using embeddings and pgvector in parallel.   
6. The system merges and ranks both result sets.   
7. The user sees paginated results and can refine filters, save the search, export data, or share the result view. 

### Alternate paths

- If embedding generation is unavailable, the system falls back to text-only search. 
- If the user enters no query, the library behaves like a filtered archive list. 
- If no enrichments exist yet, search still works using base transcript and metadata fields. 

### Failure paths

- If Meilisearch write sync fails, the event should be retried and tracked with sync logs. 
- If semantic embedding generation fails, the request should degrade gracefully to full-text search. 
- If indexing lags, recently created conversations may appear late but should not corrupt source-of-truth data. 

---

## 6. Inputs and Outputs

### Inputs

- `tenantId` from request context. 
- Query string from the user. 
- Search filters object. 
- Indexed conversation records from calls, emails, and related metadata. 
- Embeddings generated through the AI Services layer. 

### Outputs

- Paginated ranked conversation results. 
- Applied filter state. 
- Search result snippets and linked metadata. 
- Saved search configurations where requested. 
- Export bundles or shared links depending on action type. 

### Business value outputs

- Faster discovery of relevant conversations. 
- Better self-serve analysis by reps, managers, and RevOps. 
- Better downstream AI because discovery is easier and cleaner. 

---

## 7. Data Model

### Architecture-backed M-05 tables

The architecture explicitly shows these M-05 tables relevant to search operations. 

- `searchindexsynclog` tracks indexing sync operations. 
- `trackers` and `trackerdetections` enrich search and downstream filtered discovery. 
- `savedsearches` stores user saved search queries and filters.
- M-05 also reads conversations and linked metadata from upstream modules rather than owning all raw transcript storage. 

### Known schema fields

#### `searchindexsynclog`
- `syncid` 
- `tenantid` 
- `entitytype` such as transcript, email, or topic tag. 
- `lastsyncedat` 
- `recordssynced` 
- `idempotencykey` with uniqueness to prevent duplicate sync runs. 

#### `savedsearches`
- `searchid` UUID
- `tenantid` UUID
- `userid` UUID
- `name` VARCHAR
- `querystring` TEXT
- `filters` JSONB
- `createdat` TIMESTAMPTZ
- `updatedat` TIMESTAMPTZ

#### Related enrichment tables

##### `trackers`
- `trackerid` 
- `tenantid` 
- `name` 
- `businessquestion` 
- `type` 
- `scope` 
- `ispublished` 

##### `trackerdetections`
- `detectionid` 
- `trackerid` 
- `callid` 
- `tenantid` 
- `dealid` 
- `contactid` 
- `snippet` 
- `timestampms` 
- `confidencescore` 
- `detectedat` 

### Search document shape

The exact Meilisearch document schema is not fully spelled out, but the architecture makes clear that M-05 indexes transcripts, emails, and topic tags into search.   
A practical v1 searchable document should include:

- `tenantId` (mandatory filterable attribute for isolation)
- `entityType` such as call or email. 
- `entityId` 
- `callId` when relevant. 
- `transcriptText` or message body. 
- `title` or subject when available. 
- `dealId`, `accountId`, `contactId` when linked. 
- `topicTags` 
- `trackerTypes` or key signals where supported. 
- `createdAt` 

---

## 8. Search and Retrieval

### Search architecture

The architecture explicitly defines this feature as **hybrid search** using **Meilisearch for full-text** and **pgvector for semantic retrieval**.   
This is the core design choice and should not be simplified into only one search mode. 

### Full-text retrieval

Meilisearch is used for typo-tolerant full-text search and broad filtered retrieval.   
The architecture also notes Meilisearch as the approved search engine for the global search bar, call library search, and contact or account search because it is easier to operate and offers good out-of-box quality for short text. 

### Semantic retrieval

Semantic search uses embeddings generated by the AI Services `v1embed` endpoint and stored or searched with pgvector.   
This gives users meaning-based retrieval beyond exact phrase matching. 

### Retrieval execution pattern

The architecture shows both searches running in parallel and then being merged and ranked.   
That means the library should not wait for one path to complete before starting the other. 

---

## 9. Service and Integration Design

### Internal services

- **M-05 Smart Tracking and Search:** owns search APIs, hybrid search orchestration, and index sync tracking. 
- **AI Services Layer:** provides `POST v1embed` for semantic retrieval support. 
- **M-01 Data Ingestion:** supplies completed transcripts. 
- **M-04 Conversation Intelligence:** supplies topic tags for filtered search enrichment. 
- **M-03 Revenue Graph:** supplies deal, contact, and account linkage context. 

### External and infrastructure dependencies

- **Meilisearch** is the primary full-text search engine. 
- **pgvector** is the semantic retrieval store or search substrate in PostgreSQL. 
- **BullMQ and Redis** support async event and indexing workflows across the platform. 
- **Better Stack** and related observability tooling track query timing and sync health. 

### Integration pattern

- Event-driven ingestion into the search index. 
- Synchronous read path for user search queries. 
- Graceful degradation to text-only search when semantic components fail. 

---

## 10. Security and Compliance

### Tenant isolation

Search must remain tenant-scoped through `tenantId` filters and the standard tenant isolation approach used across the platform.   
The architecture also raises the open design question of shared versus per-tenant Meilisearch indexing, which means tenant isolation must be explicitly enforced in either model. 

### Access control

- Only authenticated users within a tenant can search that tenant’s records. 
- Export and share actions must honor the same authorization boundaries as the underlying records. 

### Sensitive data handling

- Search indexes will contain customer conversation data, so operational logs must avoid leaking raw content broadly. 
- Shared links, if implemented, must not bypass auth unless there is a separately governed secure-sharing mechanism. 

### Auditability

- Index sync should be observable through `searchindexsynclog`. 
- Export actions should be auditable as data access operations. 

---

## 11. Error Handling

### Index sync failures

- Retry failed sync runs and keep them idempotent using `idempotencykey`. 
- Do not duplicate indexed entities on replay. 

### Query-time failures

- If semantic retrieval fails, return full-text results rather than a hard error when possible. 
- If Meilisearch is unavailable, surface a clear degraded experience and log the failure. 

### Data freshness issues

- Recently created records may be temporarily missing during sync delay. 
- The UI should avoid claiming strong real-time guarantees unless indexing lag is near zero. 

### Bad filters

- Invalid filter values should be rejected before query execution. 
- Filter builders must produce safe Meilisearch filter expressions. 

---

## 12. Observability

### Logs

Structured logs should include:

- `tenantId` 
- `query` or normalized query fingerprint where appropriate. 
- Filter count and filter names. 
- Meilisearch processing time. 
- Semantic retrieval latency. 
- Result counts before and after merge. 
- Sync job status and `idempotencykey` for indexing runs. 

### Metrics

Recommended metrics:

- Search response p50, p90, p99. 
- Meilisearch `processingTimeMs`. 
- Semantic retrieval latency. 
- Search zero-result rate. 
- Index sync lag by entity type. 
- Index sync failure rate. 
- Export job duration for conversation-library-driven exports. 

### Alerts

Recommended alerts:

- p99 search response exceeds 200ms for more than 5 minutes. 
- Index sync failures spike. 
- Meilisearch memory or CPU pressure causes degraded query times. 
- Export jobs exceed expected duration thresholds. 

---

## 13. Non-Functional Requirements

### Performance

The architecture sets a target of **under 200ms p99 for Meilisearch-powered search queries**.   
This should be treated as the baseline user-facing search performance target for the library. 

### Reliability

- Index sync must be idempotent. 
- Search should degrade gracefully when embedding search is unavailable. 
- The library should remain usable even if enrichment signals lag. 

### Scalability

- Meilisearch is the approved engine for search quality and ease of self-hosting. 
- pgvector is the approved semantic retrieval path in the current architecture. 
- Search design must account for the open question of shared versus per-tenant index scope. 

### Explainability

- Users should understand why records matched by showing snippets, matched text, tags, and linked context where possible. 
- Engineers should be able to reason about ranking using the separate text and semantic paths. 

---

## 14. Test Strategy

### Unit tests

- Filter builder correctness for Meilisearch queries. 
- Merge-and-rank logic for text plus semantic results. 
- Saved search persistence and rehydration behavior. 
- Export request validation and authorization checks. 

### Integration tests

- `call.transcription.completed` to searchable record flow. 
- `call.topics.tagged` to indexed topic-tag enrichment flow. 
- Query request to hybrid search response flow. 
- Semantic fallback to text-only search flow. 

### Performance tests

- Large result-set pagination behavior. 
- Meilisearch response timing under realistic query loads. 
- Concurrent filter-heavy search scenarios. 

### Quality evaluation tests

- Exact-match keyword queries. 
- Typo-tolerant text queries. 
- Meaning-based semantic queries. 
- Mixed queries where filter precision and semantic recall both matter. 

---

## 15. Open Questions

### Pending design decisions

- **[RESOLVED]** Use a shared Meilisearch index with mandatory `tenantId` filter enforcement. Every M-05 search query must inject `tenantId = <current_tenant>` as a mandatory server-side filter that the caller cannot override.
- What exact fields are user-visible in saved searches versus internal filter state only. 
- How should shared search links be secured and expired if implemented beyond authenticated deep links. 

### Risks

- Index lag may cause user confusion if the UI feels real-time but indexing is eventually consistent. 
- Poor merge-and-rank logic can over-favor semantic results or over-favor exact text matches. 
- Large export requests can become expensive if not batched or queued. 

### Deferred items

- Personal relevance ranking based on user behavior. 
- Cross-modal search over video or audio moments beyond transcript text. 
- Smart recommended searches and auto-suggested saved views. 

---

## 16. Feature-Specific Appendix

### 16.1 Search indexing pipeline

The architecture shows that M-05 owns index sync through `searchindexsynclog` and consumes events such as transcript completion and topic tagging to keep search data up to date.   
The tooling inventory confirms the approved indexing stack as **Meilisearch for full-text**, **pgvector for semantic retrieval**, and **BullMQ/Redis** for async processing patterns. 

#### Indexing pipeline flow

1. Upstream modules produce conversation data such as transcripts or emails.   
2. M-05 receives source events.   
3. M-05 builds or updates searchable documents.   
4. Documents are synced into Meilisearch for full-text retrieval.   
5. Embeddings are generated through `v1embed` for semantic search support.   
6. Sync state is logged in `searchindexsynclog` with idempotency protection. 

#### Important events already documented

- `call.transcription.completed` triggers search-related downstream processing in M-05. 
- `call.topics.tagged` causes topic tags to be indexed into Meilisearch for filtered search. 
- `email.sent` can also feed M-05 for search or tracking-related content flows. 

### 16.2 Supported filter dimensions

The feature mapping says the library lets users find, filter, analyze, and export calls, accounts, and customer interactions.   
The architecture also states that `GET /api/v1/smart-tracking/conversations` supports paginated calls and emails with **100+ filter params**, even though every single field is not enumerated in the snippet. 

#### Safe v1 supported filter dimensions

- Date range. 
- Entity type such as call or email. 
- Deal, account, and contact linkage. 
- Topic tags. 
- Tracker or risk-signal presence where indexed. 
- Rep or owner context where linked through conversation metadata. 
- Source platform when available from captured interaction metadata. 

#### Product-friendly interpretation

For a fresher, think of filters as **metadata gates** placed before or alongside search ranking.   
The query finds likely matches, while filters narrow the search space to only the conversations the user actually cares about. 

### 16.3 Search ranking and retrieval logic

The architecture provides the clearest answer here: search runs **full-text Meilisearch** and **semantic vector search** in parallel, then returns `mergeAndRankResults(textResults, semanticResults)`. 

#### Ranking logic in plain language

- Full-text search is strong for exact terms, names, and typo-tolerant matches. 
- Semantic search is strong for intent and meaning matches. 
- Final ranking should merge both result types into one list. 

#### Recommended simple ranking model for v1

- Give a base score from Meilisearch text relevance. 
- Give a base score from vector similarity. 
- Apply filter eligibility first, then blend scores. 
- Use recency or entity-priority tie-breakers only after primary relevance scoring. 

#### Guardrail

Do not hide exact-match results below weak semantic matches when the query clearly contains specific business terms. 

### 16.4 Saved search behavior

The feature mapping explicitly calls out filtering, analysis, export, and library behavior, which makes saved searches a natural product feature even though the architecture does not yet define a dedicated saved-search table in the provided snippet. 

#### Recommended saved search behavior

- Save the query string plus selected filters. 
- Save it per user and tenant by default. 
- Allow naming the saved search. 
- Reopen the exact same filtered library view later. 
- Keep it as a lightweight view configuration, not a copied result set. 

#### Good v1 model

A saved search should store **search intent and filter state**, not snapshot data.   
That keeps it simple, cheap, and always fresh when rerun. 

### 16.5 Export and share actions

The product mapping explicitly says the library allows users to **find, filter, analyze, and export** calls, accounts, and customer interactions.   
The architecture also includes async export patterns elsewhere in the platform, which supports a queue-based export approach for larger result sets. 

#### Recommended export behavior

- Export the currently filtered result set, not all tenant data by default. 
- Support CSV first for v1. 
- Queue large exports asynchronously. 
- Audit who exported what and when. 

#### Recommended share behavior

- v1 should prefer **shareable authenticated deep links** that reopen the same query and filter state for authorized users. 
- Avoid public anonymous links in v1 because this is customer interaction data. 

### 16.6 Product vs architecture mapping note

This feature is one of the clearest examples where **product packaging** and **engineering ownership** differ. 

#### Correct interpretation

- In the **product map**, Searchable Conversation Library belongs with M2 Conversation Intelligence because users see it as a conversation analysis workspace. 
- In the **system architecture**, the implementation belongs in M-05 Smart Tracking and Search because that module owns search APIs, indexing sync, hybrid retrieval, and filtered archive behavior. 

#### Freshers’ rule

When writing UI or roadmap docs, call it part of **M2 Conversation Intelligence**.   
When writing backend code, APIs, indexing jobs, or schemas, treat it as **M-05 Smart Tracking and Search**. 