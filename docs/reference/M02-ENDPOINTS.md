# ⚡ M02 — Conversation Intelligence: Complete Endpoint Reference

> **Total Endpoint Count: 35**
> - NestJS Backend API Endpoints: **25**
> - Live Assist Client-Side Integration Endpoints: **10**

This document provides a comprehensive, high-fidelity reference for **all** backend API endpoints and integrations belonging to **Module 2: Conversation Intelligence**, including the real-time **Live Assist Sales Co-Pilot** feature.

---

## 🏗️ Architecture & Database

| Component | Technology | Details |
|:---|:---|:---|
| **Backend Framework** | NestJS (TypeScript) | `apps/m02-api` — port `3002` |
| **Database** | **PostgreSQL** | Connected via Prisma ORM (`@rri/database` shared package) |
| **ORM** | Prisma Client | Schema at `modules/m02-conversation-intelligence/prisma/schema.prisma` |
| **DB Connection** | `DATABASE_URL` env var | Standard PostgreSQL connection string |
| **Frontend** | Vite + React | `apps/web/src/modules/m02-conversation-intelligence` — port `5175` |
| **AI Providers** | Groq, OpenRouter, OpenAI | Client-side direct calls for Live Assist |
| **Multi-Tenancy** | Row-Level Security (RLS) | `app.current_tenant_id` PostgreSQL session parameter |

> **Note:** Module 2 is connected to **PostgreSQL** (not Supabase). The `PrismaService` extends `PrismaClient` from the shared `@rri/database` package and connects via `DATABASE_URL`. Live Assist session data that was previously optional Supabase persistence now uses in-memory storage on the client, with PostgreSQL as the sole backend database.

---

## 🌐 Global Configuration

| Setting | Value |
|:---|:---|
| **API Base URL** | `http://localhost:3002/api/v1` |
| **Tenant Header** | `x-tenant-id` (required on all guarded routes) |
| **User Header** | `x-user-id` (required for user-scoped operations) |
| **Service Auth** | `x-service-key` (for service-to-service ingestion) |
| **Guard** | `TenantGuard` — rejects requests without valid tenant context (HTTP 401) |
| **Validation** | Global `ValidationPipe` + Zod schemas |

---

## 🛠️ NestJS Backend API Endpoints (25 Endpoints)

---

### #0 — Root Health / Info _(1 endpoint)_

Registered directly in `main.ts` outside the module controllers.

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 1 | **GET** | `/` | None | Returns API status, version, web URL, and sample API path. |

---

### #1 — Primary Conversation Surface _(6 endpoints)_

**Controller:** `M02ConversationIntelligenceController`
**Base Path:** `api/v1/conversation-intelligence`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 2 | **GET** | `/api/v1/conversation-intelligence/conversations` | `x-tenant-id` | Paginated list of conversations. Query params: `channel`, `sentiment`, `agent`, `datePreset`, `startDate`, `endDate`. |
| 3 | **GET** | `/api/v1/conversation-intelligence/conversations/search` | `x-tenant-id` | Hybrid pgvector semantic + lexical search. Query params: `query`, `limit`, `page`. |
| 4 | **GET** | `/api/v1/conversation-intelligence/conversations/:id` | `x-tenant-id` | Single conversation by UUID. Supports `targetLanguage` query param for on-the-fly translation. |
| 5 | **POST** | `/api/v1/conversation-intelligence/saved-searches` | `x-tenant-id`, `x-user-id` | Save a search config. Body: `{ name, query, filters }`. |
| 6 | **GET** | `/api/v1/conversation-intelligence/saved-searches` | `x-tenant-id`, `x-user-id` | List all saved searches for the authenticated user. |
| 7 | **GET** | `/api/v1/conversation-intelligence/findAll` | `x-tenant-id` | **[Legacy]** All conversations without pagination metadata. |

---

### #2 — Smart Trackers _(7 endpoints)_

**Controller:** `TrackerController`
**Base Path:** `api/v1/conversation-intelligence/trackers`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 8 | **POST** | `/api/v1/conversation-intelligence/trackers` | `x-tenant-id` | Create a smart keyword tracker. Body: `{ name, keywords[], isActive, speakerScope?, timingCondition?, timingMinutes? }`. |
| 9 | **GET** | `/api/v1/conversation-intelligence/trackers` | `x-tenant-id` | List all trackers for the workspace. |
| 10 | **GET** | `/api/v1/conversation-intelligence/trackers/stats` | `x-tenant-id` | Tracker statistics: `{ totalTrackers, activeTrackers, totalDetections, detectionsThisMonth }`. |
| 11 | **GET** | `/api/v1/conversation-intelligence/trackers/detections` | `x-tenant-id` | All historical tracker detections across the workspace. |
| 12 | **GET** | `/api/v1/conversation-intelligence/trackers/detections/:entityId` | `x-tenant-id` | Detections for a specific conversation. Query: `entityType` (`"call"` or `"email"`, default `"call"`). |
| 13 | **PUT** | `/api/v1/conversation-intelligence/trackers/:id` | `x-tenant-id` | Update a tracker configuration (toggle active, update keywords). |
| 14 | **DELETE** | `/api/v1/conversation-intelligence/trackers/:id` | `x-tenant-id` | Permanently delete a tracker. |

---

### #3 — AI Topic Taxonomy & Management _(6 endpoints)_

**Controller:** `TopicManagementController`
**Base Path:** `api/v1/m02-conversation-intelligence/topics`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 15 | **POST** | `/api/v1/m02-conversation-intelligence/topics` | `x-tenant-id` | Create a topic model. Body: `{ topics: [{ name, description }], type? }`. |
| 16 | **GET** | `/api/v1/m02-conversation-intelligence/topics` | `x-tenant-id` | List all topic models/taxonomies for the tenant. |
| 17 | **DELETE** | `/api/v1/m02-conversation-intelligence/topics/:id` | `x-tenant-id` | Delete a topic model by ID. |
| 18 | **POST** | `/api/v1/m02-conversation-intelligence/topics/topics` | `x-tenant-id` | Add a topic definition to the active model. |
| 19 | **DELETE** | `/api/v1/m02-conversation-intelligence/topics/remove` | `x-tenant-id` | Remove a specific topic. Body: `{ topicName }`. |
| 20 | **POST** | `/api/v1/m02-conversation-intelligence/topics/seed` | `x-tenant-id` | Seed 8 default sales topics (pricing, objections, ROI, etc.) if no model exists. |

---

### #4 — Topic Tagging (Per-Conversation) _(4 endpoints)_

**Controller:** `TopicTagController`
**Base Path:** `api/v1/m02-conversation-intelligence`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 21 | **GET** | `/api/v1/m02-conversation-intelligence/conversations/:id/topics` | `x-tenant-id` | Get all topic tags (AI + manual) for a conversation. |
| 22 | **POST** | `/api/v1/m02-conversation-intelligence/conversations/:id/topics` | `x-tenant-id` | Manually apply a tag. Body: `{ topicName, explanation? }`. |
| 23 | **DELETE** | `/api/v1/m02-conversation-intelligence/topics/tags/:tagId` | `x-tenant-id` | Delete a specific topic tag by tag ID. |
| 24 | **POST** | `/api/v1/m02-conversation-intelligence/conversations/batch-tag` | `x-tenant-id` | Batch AI tagging run over un-tagged transcripts. Body: `{ limit? }` (default: 50). |

---

### #5 — Multi-Language & AI Translation _(3 endpoints)_

**Controller:** `TranslationController`
**Base Path:** `api/v1/m02-conversation-intelligence/translate`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 25 | **POST** | `/api/v1/m02-conversation-intelligence/translate` | `x-tenant-id` | Translate text or a conversation entity. Body: `{ text, sourceLang, targetLang, entityType?, entityId? }`. |
| 26 | **GET** | `/api/v1/m02-conversation-intelligence/translate/settings` | `x-tenant-id` | Get workspace translation preferences. |
| 27 | **POST** | `/api/v1/m02-conversation-intelligence/translate/settings` | `x-tenant-id` | Update translation preferences. Body: `{ defaultLanguage?, fallbackLanguage?, supportedLanguages?[] }`. |

---

### #6 — Vocabulary Correction Rules _(4 endpoints)_

**Controller:** `VocabularyCorrectionController`
**Base Path:** `api/v1/conversation-intelligence/vocabulary`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 28 | **POST** | `/api/v1/conversation-intelligence/vocabulary` | `x-tenant-id` | Create a correction rule. Body: `{ incorrectTerm, correctTerm, language?, category?, mispronunciations?[], variations?[] }`. |
| 29 | **GET** | `/api/v1/conversation-intelligence/vocabulary` | `x-tenant-id` | List all vocabulary correction rules. |
| 30 | **GET** | `/api/v1/conversation-intelligence/vocabulary/stats` | `x-tenant-id` | Rule statistics: `{ totalRules, categoriesCount }`. |
| 31 | **DELETE** | `/api/v1/conversation-intelligence/vocabulary/:id` | `x-tenant-id` | Delete a correction rule by ID. |

---

### #7 — Core System Ingestion _(1 endpoint)_

**Controller:** `ConversationIngestController`
**Base Path:** `api/v1/conversation-intelligence/ingest`

| # | Method | Full Path | Auth | Description |
|:--|:-------|:----------|:-----|:------------|
| 32 | **POST** | `/api/v1/conversation-intelligence/ingest/from-transcription` | `x-service-key` | Service-to-service callback from M01 after transcription. Body: `{ tenantId, callId, transcript, duration? }`. |

---

## 🧠 Live Assist Client-Side Integration Endpoints (3 endpoints)

The **Live Assist Sales Co-Pilot** runs client-side with a local event engine and calls external AI APIs directly from the browser. These are **not** NestJS routes — they are third-party API calls made by the frontend `gemini.js` service.

---

### #8 — AI Model Providers _(2 endpoints)_

| # | Method | External Endpoint | Auth | Description |
|:--|:-------|:------------------|:-----|:------------|
| 33 | **POST** | `https://api.groq.com/openai/v1/chat/completions` | `Authorization: Bearer <GROQ_KEY>` | Primary low-latency LLM for real-time coaching. Models: `llama-3.1-8b-instant` (fast), `llama-3.3-70b-versatile` (deep). |
| 34 | **POST** | `https://openrouter.ai/api/v1/chat/completions` | `Authorization: Bearer <OPENROUTER_KEY>` | Fallback LLM provider. Models: `deepseek/deepseek-r1`, `meta-llama/llama-3.3-70b-instruct`, `anthropic/claude-3.5-sonnet`. |

---

### #9 — Audio Transcription _(1 endpoint)_

| # | Method | External Endpoint | Auth | Description |
|:--|:-------|:------------------|:-----|:------------|
| 35 | **POST** | `https://api.groq.com/openai/v1/audio/transcriptions` | `Authorization: Bearer <GROQ_KEY>` | Whisper large-v3 audio transcription. Payload: `multipart/form-data` with raw WebM audio blob. |

---

## 📊 Live Assist Feature — Routed NestJS-to-FastAPI Endpoints

These endpoints are called by the frontend `api-client.js` via the **routed post** pattern: it first tries NestJS (`/api/v1/...`), then falls back to FastAPI (`http://localhost:8000/...`). They are routed through the NestJS backend when available.

| Frontend Function | NestJS Route | FastAPI Fallback | Description |
|:---|:---|:---|:---|
| `summarizeText()` | `/api/v1/documents/analyze/text` | `/ai/summarize/text` | Summarize text with AI model |
| `summarizeFile()` | `/api/v1/upload/file` | `/ai/summarize/upload` | Upload and summarize a file |
| `ragChat()` | `/api/v1/chat/ask` | `/ai/rag/ask` | RAG-powered chat over documents |
| `compareDocuments()` | `/api/v1/compare/documents` | `/ai/compare/documents` | Compare multiple documents |
| `versionDiff()` | `/api/v1/version/diff` | `/ai/version/diff` | Diff two document versions |
| `extractInsights()` | `/api/v1/documents/extract/insights` | `/ai/extract/insights` | Extract insights from text |
| `checkBackendHealth()` | `/health` | `/health` | Check NestJS and FastAPI availability |

> **Note:** These are client-side routed calls defined in `api-client.js`. They attempt NestJS first, fall back to FastAPI, and finally fall back to direct Groq mode if both are unavailable. They are **not** counted in the core endpoint total as they are pass-through/proxy routes.

---

## 🗃️ PostgreSQL Database Schema (13 Tables)

All tables use UUID primary keys, `tenant_id` for multi-tenancy, and Row-Level Security (RLS) policies.

| # | Table Name | Purpose | Key Columns |
|:--|:-----------|:--------|:------------|
| 1 | `m01_calls` | Call recordings from M01 | `tenant_id`, `title`, `duration_seconds`, `transcript` |
| 2 | `m02_emails` | Email conversations | `tenant_id`, `subject`, `body`, `sender`, `recipient` |
| 3 | `m02_saved_searches` | User saved search configs | `tenant_id`, `user_id`, `name`, `query_string`, `filters` |
| 4 | `m02_search_index_sync_logs` | Search index sync tracking | `tenant_id`, `entity_type`, `sync_status`, `idempotency_key` |
| 5 | `m02_trackers` | Smart keyword tracker definitions | `tenant_id`, `name`, `keywords[]` |
| 6 | `m02_tracker_detections` | Keyword detection results | `tenant_id`, `tracker_id`, `matched_keyword`, `snippet` |
| 7 | `m02_embeddings` | Semantic vector embeddings | `tenant_id`, `entity_type`, `vector[]`, `content_chunk` |
| 8 | `m02_folders` | Library folder organization | `tenant_id`, `name`, `library_type`, `created_by` |
| 9 | `m02_folder_items` | Folder ↔ conversation links | `folder_id`, `entity_type`, `entity_id` |
| 10 | `m02_folder_access_logs` | Folder usage tracking | `tenant_id`, `folder_id`, `user_id`, `entity_id` |
| 11 | `m02_topic_models` | Topic taxonomy definitions | `tenant_id`, `topics` (JSONB), `type` |
| 12 | `m02_topic_tags` | Per-conversation topic tags | `call_id`, `tenant_id`, `topic_name`, `source`, `confidence_score` |
| 13 | `m02_conversation_intelligence` | Core conversation records | `tenantId`, `name` |

---

## 📋 Endpoint Count Summary

| Feature Area | Controller | Endpoints |
|:---|:---|---:|
| Root Health / Info | `main.ts` | 1 |
| Primary Conversation Surface | `m02.controller.ts` | 6 |
| Smart Trackers | `tracker.controller.ts` | 7 |
| AI Topic Taxonomy | `topic-management.controller.ts` | 6 |
| Topic Tagging (Per-Conversation) | `topic-tag.controller.ts` | 4 |
| Multi-Language & Translation | `translation.controller.ts` | 3 |
| Vocabulary Correction Rules | `vocabulary-correction.controller.ts` | 4 |
| Core System Ingestion | `ingest.controller.ts` | 1 |
| **NestJS Backend Subtotal** | | **32** |
| Live Assist — AI Model Providers | `gemini.js` (client-side) | 2 |
| Live Assist — Audio Transcription | `gemini.js` (client-side) | 1 |
| **Live Assist Client-Side Subtotal** | | **3** |
| **GRAND TOTAL** | | **35** |

---

*Generated from source code analysis on 2026-05-28. Source files: 7 NestJS controllers + `main.ts` + `gemini.js` + `api-client.js`.*
