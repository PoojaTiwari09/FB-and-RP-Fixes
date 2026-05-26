# Module Analysis — `m03-ai-summaries-genai`

> Order #5 in the lifecycle (per your chart): "Generates AI summaries, deal briefs, answers natural language questions (Ask Anything)". Depends on M02 (`tracker.detection.created`) + M01 (`call.transcription.completed`).

---

## 1. Purpose

Three product surfaces in one module:

1. **AI Smart Summaries** — call briefs, deal briefs, account briefs, contact briefs.
2. **AI Deep Researcher** — multi-step research jobs.
3. **Ask Anything (GenAI Query)** — RAG over the Revenue Graph.

Maps to TDDs:

* `M3 AI Summaries & GenAI/TDD/TDD-AI Smart Summaries.md`
* `M3 AI Summaries & GenAI/TDD/TDD-AI Deep Researcher.md`
* `M3 AI Summaries & GenAI/TDD/TDD-Ask Anything.md`

---

## 2. Layout

```
modules/m03-ai-summaries-genai/
├── m03-ai-summaries-genai.module.ts
├── prisma/schema.prisma                placeholder model (single row)
├── controllers/
│   ├── m03.controller.ts               base CRUD
│   ├── feedback.controller.ts          POST /feedback (rating + comment)
│   ├── query.controller.ts             Ask Anything chat endpoint
│   └── research.controller.ts          Deep Researcher kickoff + polling
├── services/
│   ├── m03.service.ts
│   ├── supabase.service.ts             ⚠ LEGACY — Supabase client
│   ├── cross-object-joiner.service.ts  joins Calls/Deals/Accounts/Activities for RAG context
│   ├── feedback.service.ts
│   ├── query.service.ts
│   ├── report.service.ts
│   └── research.service.ts
├── repositories/m03.repository.ts
├── workers/m03.worker.ts               BullMQ on m03-queue (research jobs)
└── (typical) database/, schemas/, seeds/, events/, interfaces/
```

---

## 3. Frontend (multiple realities)

`apps/web/src/modules/m03-ai-summaries-genai/` is a **vendored Vite + Next.js hybrid** mini-app:

* `package.json`, `tsconfig.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `proxy.py` (Python helper that proxies to Supabase).
* `app/` (Next.js–style layout) and `src/` (Vite–style entry).
* `modules/lib/supabase.js`, `modules/services/gemini.js`, `modules/services/embeddings.js`, `modules/data/seed.sql`, `modules/data/crm.js`, `modules/hooks/useSupabaseData.js`.
* `src/pages/AskAnythingPage.jsx`, `DeepResearchPage.jsx`, `ResearchReportPage.jsx`, `SharedBriefPage.jsx`, `SmartSummariesPage.jsx`, `SmartSummariesAdminPage.jsx`.
* `src/extracted/` — auto-extracted copies of API routes and components from an upstream Next.js app (also contains `src_app_api_*_route.ts` files).
* Reads from Supabase directly (browser-side `@supabase/supabase-js`). Calls Gemini directly from the browser.

> **MISMATCH:** the architectural rule "AI Inference vs Business Separation" + tenant isolation are violated by the vendored UI talking to Supabase + Gemini from the browser. Move the calls to `apps/api`/`apps/ai-services` (see `implementation_changes.md` §C4).

Top-level Next routes: `apps/web/src/app/m3/page.tsx` is the only thing that imports from this folder.

---

## 4. API surface

Base path: `/api/v1/ai-summaries` (inferred from `m03.controller.ts` patterns).

| Method | Path | Handler |
| ------ | ---- | ------- |
| GET    | `/briefs` | list account/deal/call/contact briefs |
| POST   | `/briefs/regenerate/:entity/:id` | enqueue regen |
| POST   | `/query` | Ask Anything chat |
| POST   | `/research` | kick off deep researcher |
| GET    | `/research/:jobId` | poll research status |
| POST   | `/feedback` | submit thumbs up/down + comment |

---

## 5. Algorithms / RAG

`cross-object-joiner.service.ts` materializes a join across Calls + Transcripts + Deals + Accounts + Activities and chunks them into ~500-token windows. Chunks are vectorized via the embeddings service (`modules/services/embeddings.js` on the frontend; should be `apps/ai-services` on the backend).

Storage of chunks today: `transcript_chunks` (in unified schema) and `ai_chat_history` for the chat log. `AccountBriefs`, `AiBriefs`, `AiBriefsCache` are populated by the worker.

---

## 6. Events / Queues

Queue: `m03-queue`.

| Direction | Event |
| --------- | ----- |
| IN  | `call.transcription.completed` (from M01) — recomputes call brief |
| IN  | `tracker.detection.created` (from M02) — refreshes brief context |
| OUT | `call.summary.generated` |
| OUT | `account.brief.refreshed` |

---

## 7. Database (unified schema mapping)

| Unified model | Notes |
| ------------- | ----- |
| `AiBriefs` | Per-entity brief blobs. ⚠ `generatedSummary` typed `Float?` — should be `String?` (see implementation_changes §B3). |
| `AiBriefsCache` | Cache of accountBriefs by `companyHubspotId + scope + periodDays`. |
| `AccountBriefs` | High-level account summary. |
| `AiChatHistory` | Ask Anything chat log. |
| `TranscriptChunks` | Pre-chunked transcript text with embeddings (eventually `vector`). |

---

## 8. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | Frontend bypasses the API and calls Supabase + Gemini directly. |
| HIGH | `supabase.service.ts` on backend still imports `@supabase/supabase-js`. Should be deleted after frontend cutover. |
| HIGH | `AiBriefs.generatedSummary` typed `Float?` in unified schema — clearly wrong. |
| MEDIUM | Two competing entry points (`app/page.tsx` Next vs `src/pages/*` Vite) — pick one. |
| MEDIUM | `proxy.py` is a leftover dev script — should not ship with the app. |
| LOW | `m03.repository.ts` is a thin mock — flesh out. |

---

## 9. Smoke checklist

* `POST /api/v1/ai-summaries/feedback` with `{ rating: 5 }` returns 201.
* `POST /api/v1/ai-summaries/query` with `{ q:'show pipeline for Acme' }` returns a 200 (mock answer if `OPENAI_API_KEY` is absent).
* `POST /api/v1/ai-summaries/research` returns 202 with `jobId`.
* `GET /api/v1/ai-summaries/research/:jobId` returns `status:'pending'|'running'|'completed'|'failed'`.
