# Doc #11g — TDD: Searchable Conversation Library

## 1. Document Control

- **Document Title:** Technical Design Document — Searchable Conversation Library
- **Feature Name:** Searchable Conversation Library
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Backend Lead / Search and Conversation Intelligence Squads
- **Reviewers:** AI Lead, Data Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

Searchable Conversation Library gives users a searchable, filterable archive of captured and transcribed conversations so they can quickly find the right call, email, topic, or signal without manually scanning records. It combines traditional full-text search with semantic retrieval so users can find exact terms as well as meaning-based matches.

This feature is grouped under M2 Conversation Intelligence in the product mapping because users experience it as part of understanding and exploring conversations. It handles hybrid search, tracker detection, indexing sync, and the conversation search endpoints.

### Business Problem
- Teams collect many calls and emails, but raw archives are hard to explore at scale.
- Keyword-only search misses meaning, while semantic-only search misses precise filters and exact terms.
- Users also need operational actions like filtering, saving views, exporting, and sharing results.

### What the Feature Does
- Indexes calls, emails, and related search metadata into a searchable archive.
- Supports hybrid full-text plus semantic retrieval.
- Allows filtering, pagination, export, and saved search workflows.
- Surfaces a clean library view for searching across customer interactions.

---

## 3. Scope

### In Scope
- Conversation archive search across calls and outbound emails.
- Full-text indexing via Meilisearch.
- Semantic retrieval using embeddings with pgvector.
- Saved searches and reusable filter states.
- Export and share actions on search results.
- Search filters on conversation records and linked business context.

### Out of Scope
- Real-time in-call search during a live meeting.
- Raw transcription generation (handled by M1 Capture & Transcription).
- Deep analytical answer generation (handled by Ask Anything and M3).

### Assumptions
- Calls and emails are already captured and stored by upstream modules.
- Entity linking (deal or account mapping) is available from M10 Data & Compliance.
- Topic tags and tracker detections enrich search quality and filtering.
- Search must remain tenant-isolated.

### Upstream Dependencies
- **M1 Capture & Transcription:** call transcription completion.
- **M8 Sales Engagement:** outbound email events.
- **M10 Data & Compliance:** revenue-graph entity linking for deal, contact, and account context.
- **M2 Topic Tagger:** topic tags.
- **AI Services Layer:** `POST /internal/generate-embeddings` for semantic search embeddings.

### Downstream Consumers
- Frontend conversation library screens.
- Deal and account workflows needing conversation lookup.

---

## 4. Users and Triggers

### Primary Users
- Sales reps searching past conversations for context.
- Managers reviewing themes, risks, and activity patterns across calls.
- RevOps users filtering and exporting interaction data for analysis.

### Trigger Types
- New transcription completed.
- Topic tags produced and indexed.
- Email events captured.
- User-initiated search, filter, export, share, or saved search action.

### Entry Points
- API: `GET /api/v1/m02-conversation-intelligence/conversations/search` for hybrid search.
- API: `GET /api/v1/m02-conversation-intelligence/conversations` for paginated archive listing.
- API: `POST /api/v1/m02-conversation-intelligence/saved-searches`.

---

## 5. Functional Flow

### Happy Path
1. A call transcript or email record is created upstream.
2. M2 receives the relevant event and enqueues an indexing job.
3. The background worker syncs searchable fields into Meilisearch and generates semantic embeddings using the private endpoint `POST /internal/generate-embeddings`.
4. The generated embedding is stored in the `m02_conversation_intelligence` pgvector column.
5. The frontend sends a query plus filters to the conversation search API.
6. M2 runs full-text search in Meilisearch and semantic retrieval using pgvector in parallel, enforcing a mandatory tenant filter: `tenantId = <current_tenant>`.
7. The system merges and ranks both result sets.
8. The user sees paginated, ranked results.

---

## 6. Inputs and Outputs

### Inputs
- `tenantId` (UUID) from request context.
- Query string.
- Search filters object.

### Outputs
- Paginated, ranked conversation results.
- Applied filter state.
- Search result snippets.
- Saved search configurations.

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `search_index_sync_log` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `syncId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `entity_type` (VARCHAR) -> mapped to `entityType` (transcript, email, topic_tag)
- `last_synced_at` (TIMESTAMP) -> mapped to `lastSyncedAt`
- `records_synced` (INTEGER) -> mapped to `recordsSynced`
- `idempotency_key` (VARCHAR, Unique) -> mapped to `idempotencyKey`

### `saved_searches` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `searchId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `user_id` (UUID, Indexed) -> mapped to `userId`
- `name` (VARCHAR)
- `query_string` (TEXT) -> mapped to `queryString`
- `filters` (JSONB)
- `created_at` (TIMESTAMP) -> mapped to `createdAt`
- `updated_at` (TIMESTAMP)

---

## 8. Search and Retrieval

- **Architecture:** Hybrid search (Meilisearch for typo-tolerant full-text search, pgvector for semantic retrieval).
- **Internal AI Endpoint:** `POST /internal/generate-embeddings`
- **Isolation Constraint:** Use a shared Meilisearch index with mandatory server-side `tenantId` filter enforcement.
- **Latency Expectation:** Under 200ms p99 for Meilisearch-powered search queries.

---

## 16. Appendix: Hybrid Search Blending Logic

```typescript
export interface SearchResult {
  entityId: string;
  entityType: 'call' | 'email';
  score: number;
  snippet?: string;
}

export function blendHybridResults(
  textResults: SearchResult[],
  semanticResults: SearchResult[],
  textWeight: number = 0.5,
  semanticWeight: number = 0.5
): SearchResult[] {
  const blendedMap = new Map<string, SearchResult>();

  // 1. Process text results
  textResults.forEach((res) => {
    blendedMap.set(res.entityId, {
      entityId: res.entityId,
      entityType: res.entityType,
      score: res.score * textWeight,
      snippet: res.snippet,
    });
  });

  // 2. Process semantic results
  semanticResults.forEach((res) => {
    const existing = blendedMap.get(res.entityId);
    if (existing) {
      existing.score += res.score * semanticWeight;
    } else {
      blendedMap.set(res.entityId, {
        entityId: res.entityId,
        entityType: res.entityType,
        score: res.score * semanticWeight,
        snippet: res.snippet,
      });
    }
  });

  // 3. Sort blended results by combined score desc
  return Array.from(blendedMap.values()).sort((a, b) => b.score - a.score);
}
```