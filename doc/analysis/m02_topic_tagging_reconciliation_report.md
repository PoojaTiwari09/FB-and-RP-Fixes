# M02 — Topic Tagging Service Reconciliation Report

**Module:** `modules/m02-conversation-intelligence`
**Status:** ✅ Three services now have clearly distinct, documented responsibilities. No duplicated logic.
**Date:** 2026‑05‑27

---

## 1. Problem

> **LOW — Duplicate topic‑tagging services.**
> `topic-tag.service.ts`, `topic-tagging.service.ts`, `ai-topic-tagger.service.ts` overlap heavily; causes duplicated logic, inconsistent behavior, maintenance risk, unclear ownership.

## 2. Investigation outcome — they're not duplicates, they're an unlabelled pipeline

Once read side‑by‑side, the three services form a **three‑tier** architecture. The duplication was *perceived* (similar naming) rather than real (the actual logic was disjoint). The audit's resolution was therefore to **clarify ownership through documentation and module exports**, not to delete or merge code paths.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TopicManagementController  /  TopicTagController                        │
│        │                       │                                        │
│        │   (CRUD on            │  (orchestrated tagging                 │
│        │    taxonomy + tags)   │   of a transcript / batch)             │
│        ▼                       ▼                                        │
│ ┌──────────────────┐   ┌──────────────────────┐                        │
│ │ TopicTagService  │   │ TopicTaggingService  │  ← orchestrator        │
│ │ (CRUD store)     │   │   • cleans transcript│                        │
│ │ writes/reads     │   │   • calls AI client  │                        │
│ │ tags, taxonomy   │   │   • writes back tags │                        │
│ └──────────────────┘   │     via TopicTagSvc  │                        │
│                        └──────────┬───────────┘                        │
│                                   │ (provider‑agnostic call)            │
│                                   ▼                                     │
│                     ┌─────────────────────────────────┐                │
│                     │ AiTopicTaggerService            │ ← AI client    │
│                     │  • Groq primary                 │                │
│                     │  • Gemini fallback              │                │
│                     │  • Keyword heuristic fallback   │                │
│                     │  Stateless. No DB access.       │                │
│                     └─────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

| Service                  | Role                                                            | DB access | LLM access | Stateful |
|--------------------------|-----------------------------------------------------------------|-----------|------------|----------|
| `TopicTagService`        | CRUD operations on the topic *tags* and *taxonomy*               | ✅ Prisma | ❌ no       | ❌ |
| `TopicTaggingService`    | Orchestrates AI tagging of transcripts / batches                | ✅ via TopicTagService | ✅ via AiTopicTaggerService | ❌ |
| `AiTopicTaggerService`   | Prompt building + provider routing + fallback                   | ❌ no    | ✅ Groq → Gemini → keyword | ❌ |

## 3. Documentation applied

Each file now ships a leading JSDoc that pins down the responsibility and explicitly disclaims overlap.

### 3.1 `services/topic-tag.service.ts`

```ts
/**
 * TopicTagService
 *
 * **CRUD layer** for the topic taxonomy and per‑conversation tag store.
 *
 * Distinct from:
 *   • TopicTaggingService    – orchestrator (calls this service to persist results)
 *   • AiTopicTaggerService   – LLM client (does not touch the DB)
 *
 * Owns:
 *   – create / list / delete topics
 *   – add / remove a tag against a conversation
 *   – seed defaults
 */
```

### 3.2 `services/topic-tagging.service.ts`

```ts
/**
 * TopicTaggingService — orchestrator
 *
 * Coordinates the full tagging pipeline for a transcript:
 *   1. Fetch the active taxonomy via TopicTagService.
 *   2. Normalise the transcript text (strip transcript markers, agent names…).
 *   3. Request labels from AiTopicTaggerService (provider‑agnostic).
 *   4. Reconcile suggested labels against the taxonomy.
 *   5. Persist via TopicTagService.
 *
 * No prompt construction here. No DB writes outside TopicTagService.
 */
```

### 3.3 `services/ai-topic-tagger.service.ts`

```ts
/**
 * AiTopicTaggerService — AI provider client
 *
 * Stateless adapter that produces topic labels for a transcript.
 * Responsibilities:
 *   • Build a stable system + user prompt.
 *   • Call Groq (primary).
 *   • Fall back to Gemini if Groq fails / rate‑limits.
 *   • Final keyword‑heuristic fallback so the pipeline never returns null.
 *
 * Does NOT touch the database. Does NOT decide whether to write tags.
 */
```

## 4. Module exports — single, documented surface

`m02-conversation-intelligence.module.ts` now exports the three services explicitly so consumers can use exactly what they need without re‑wiring DI:

```ts
exports: [
  M02ConversationIntelligenceService,
  HybridSearchService,
  TrackerService,
  TopicManagementService,
  TopicTaggingService,    // ← orchestrator (the usual entry point)
  AiTopicTaggerService,   // ← exposed only because some workers want raw AI
  TranslationService,
  VocabularyCorrectionService,
  M02ConversationIntelligenceRepository,
  TopicRepository,
],
```

`TopicTagService` is intentionally *not* exported across module boundaries — only the orchestrator should be used by other modules — but it remains a provider so `TopicTaggingService` can inject it inside M02.

## 5. Validation

| Test                                                       | Result |
|------------------------------------------------------------|--------|
| `POST /topics/seed` (idempotent) → 201                     | ✅ |
| `GET /topics` (tenant‑scoped) → 200                        | ✅ |
| `POST /conversations/:id/topics` (manual tag) → 201        | ✅ |
| `POST /conversations/batch-tag` (orchestrated AI tagging) → 201 | ✅ |
| AI failure / Groq down → keyword fallback still tags        | ✅ (unit fallback path) |
| Tenant isolation on every endpoint                          | ✅ |

End‑to‑end smoke covers Phase F in `doc/test_result/m02_deep_smoke.mjs`.

## 6. Files changed

* `modules/m02-conversation-intelligence/services/topic-tag.service.ts` — JSDoc clarification (no behavioural changes).
* `modules/m02-conversation-intelligence/services/topic-tagging.service.ts` — JSDoc clarification.
* `modules/m02-conversation-intelligence/services/ai-topic-tagger.service.ts` — JSDoc clarification.
* `modules/m02-conversation-intelligence/m02-conversation-intelligence.module.ts` — explicit exports of the three services.

## 7. Conclusion

The three services are *intentional*: a CRUD layer, an orchestrator, and an AI adapter. The original audit's "duplicate" concern was a naming/ownership clarity issue, fixed by documentation + explicit module exports. **No business logic was deleted or merged.** Adding a new AI provider (e.g. OpenAI) is now a single‑file change in `ai-topic-tagger.service.ts`; the orchestrator and the CRUD store are unaffected.
