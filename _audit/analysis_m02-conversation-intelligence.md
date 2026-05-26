# Module Analysis — `m02-conversation-intelligence`

> Order #3 in the lifecycle (per your chart): "Scores calls, detects themes, tags topics using AI". Depends on M01 (`call.transcription.completed`) + M10 (`revenue_graph.entity.linked`).

---

## 1. Purpose

Conversation intelligence layer:

* Hybrid (full-text + semantic) search over conversations.
* Theme/topic spotting (AI Theme Spotter, AI Topic Tagger).
* Tracker management (keyword tracker detections per call).
* Translation (multilingual transcripts).
* Vocabulary corrections.

Maps to TDDs:

* `M2 Conversation Intelligence/TDD/AI Call Reviewer.md`
* `M2 Conversation Intelligence/TDD/AI Smart tracker.md`
* `M2 Conversation Intelligence/TDD/AI Theme Spotter.md`
* `M2 Conversation Intelligence/TDD/AI topic tagger.md`
* `M2 Conversation Intelligence/TDD/AI Transcriber.md`
* `M2 Conversation Intelligence/TDD/AI Translator.md`
* `M2 Conversation Intelligence/TDD/Searchable Conversation Library.md`

Module README copies: `README_AI_TOPIC_TAGGER.md`, `README_AI_TRANSCRIBER.md`, `README_AI_TRANSLATOR.md`, `README_SEARCHABLE_LIBRARY.md`, `TRACKER_FEATURE_GUIDE.md` (in module folder).

---

## 2. Layout

```
modules/m02-conversation-intelligence/
├── m02-conversation-intelligence.module.ts
├── prisma/schema.prisma                       12 models (M02Email, M02Tracker, M02Embedding, M02SavedSearch, …)
├── controllers/
│   ├── m02.controller.ts                      conversations + saved-searches
│   ├── topic-management.controller.ts
│   ├── topic-tag.controller.ts
│   ├── tracker.controller.ts
│   ├── translation.controller.ts
│   └── vocabulary-correction.controller.ts
├── services/
│   ├── m02.service.ts
│   ├── hybrid-search.service.ts               PURE JS stemmer + Levenshtein + fuzzy match
│   ├── ai-topic-tagger.service.ts
│   ├── topic-management.service.ts
│   ├── topic-tag.service.ts
│   ├── topic-tagging.service.ts
│   ├── tracker.service.ts
│   ├── translation.service.ts
│   └── vocabulary-correction.service.ts
├── repositories/m02.repository.ts, topic.repository.ts
├── database/, schemas/, seeds/, interfaces/, events/, migrations/
└── features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/
    └── (vendored mini-monorepo with its own apps/api, apps/web, package.json,
         docker-compose, .env.example. Treat as reference; NOT part of root build.)
```

---

## 3. Frontend

`apps/web/src/modules/m02-conversation-intelligence/`:

* `components/ConversationLibraryView.tsx` — the main view, fed by `/api/v1/conversation-intelligence/conversations`.
* `components/ConversationCard.tsx`, `SearchFilters.tsx`, `SavedSearchesSidebar.tsx`, `TrackerManagement.tsx`, `TranscriptDetailModal.tsx`, `TranslationSettingsModal.tsx`.
* `components/types.ts` — local DTO types (mirror `interfaces/search.interface.ts` on backend; drift is possible).
* `index.tsx` — module export.

Top-level page: `apps/web/src/app/conversation-intelligence/page.tsx`.

---

## 4. API surface

Base path: `/api/v1/conversation-intelligence`.

| Method | Path | Handler |
| ------ | ---- | ------- |
| GET    | `/conversations` | `M02Controller.list` |
| GET    | `/conversations/search` | `M02Controller.search` (parallel full-text + semantic) |
| GET    | `/conversations/:id` | `M02Controller.findById` |
| POST   | `/saved-searches` | `M02Controller.saveSearch` |
| GET    | `/saved-searches` | `M02Controller.getSavedSearches` |
| *      | `/topics`, `/topic-tags`, `/trackers`, `/translation`, `/vocabulary-corrections` | dedicated controllers |
| GET    | `/findAll` | legacy boilerplate — remove |

> Defaults `tenantId = 'tenant-123'` and `userId = 'user-456'` when missing from request. ⚠ Removes the safety of `TenantGuard`. Recommend removing the default and trusting `req.tenantId`.

---

## 5. Algorithms

`HybridSearchService` is a hand-written hybrid scorer:

* Stemmer (English suffix stripping for `-ing`, `-tion`, `-able`, `-ed`, `-ly`, …).
* Levenshtein edit distance for fuzzy match (`≤ 1` for short words, `≤ 2` otherwise).
* Final score = `lexicalScore * α + semanticScore * (1-α)` where `semanticScore` is currently a placeholder (returns 0 unless `vector` columns are populated).

Real pgvector usage is **declared** (`M02Embedding.vector Float[]`) but not yet plugged into the search query. To make the semantic half real, switch the column to `Unsupported("vector(1536)")` and use Prisma raw queries.

---

## 6. Events

| Direction | Event | Notes |
| --------- | ----- | ----- |
| IN  | `call.transcription.completed` | Triggers topic tagging + theme detection + embedding generation. |
| IN  | `revenue_graph.entity.linked` | Refreshes conversation metadata after CRM linking. |
| OUT | `tracker.detection.created` | Consumed by M05 (Account Intelligence) and M03 (summary regeneration). |
| OUT | `theme.detected` | Consumed by M07 (dashboards) and M09 (coaching). |

---

## 7. Database (unified schema mapping)

| App concept | Unified model | Notes |
| ----------- | ------------- | ----- |
| Tracker definitions | `Trackers` (in unified) | Keywords + scope. |
| Tracker detections | `TrackerDetections` (in unified) | Per call/transcript matches. |
| Topics | `Topics` / `TopicTags` | Add if missing. |
| Saved searches | `M02SavedSearch` (in module schema) | Move into unified as `SavedSearches`. |
| Embeddings | `M02Embedding` (in module schema) | Move into unified as `Embeddings`; convert `Float[]` to `vector` with pgvector. |
| Folders / library | `M02Folder`, `M02FolderItem`, `M02FolderAccessLog` | New tables for the library UI. |

---

## 8. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | Semantic half of `HybridSearchService` is unimplemented. |
| HIGH | Defaults `tenantId='tenant-123'` make tenant guards bypassable. |
| MEDIUM | Vendored `features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/` is a separate mini-monorepo with its own deps — confusing for new readers. Move out or mark `EXAMPLE_ONLY`. |
| MEDIUM | No code path actually reads the `m02_emails` table. |
| LOW | Two services do almost the same thing: `topic-tag.service.ts` + `topic-tagging.service.ts` + `ai-topic-tagger.service.ts`. Pick one. |

---

## 9. Smoke checklist

* `GET /conversations` returns `[]` on a fresh DB.
* `GET /conversations/search?q=demo` returns `[]`.
* `POST /saved-searches` with `{ name:'q1', queryString:'pricing' }` returns 201.
* `POST /trackers` with `{ name:'pricing', keywords:['price','discount'] }` returns 201.
* After enqueuing a transcript via M01, `tracker.detection.created` is logged by `EventPublisherService`.
