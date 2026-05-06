# M3 AI Summaries & GenAI — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M3 AI Summaries & GenAI/` including root docs and all TDDs  
**Files reviewed:**
- `Module README-M3 AI Summaries & GenAI.md`
- `M3 Environment Variables Registry.md`
- `M3 Sequence Diagrams.md`
- `TDD/TDD-AI Smart Summaries.md`
- `TDD/TDD-Ask Anything.md`
- `TDD/TDD-AI Deep Researcher.md`

**Cross-reference documents:**
- `docs/markdown documents/System_architecture.md`
- `docs/markdown documents/Module boundary document.md`
- `docs/markdown documents/Event Schema registry.md`
- `docs/markdown documents/Database Schema.md`

**Misplaced file detected:**
- `M2-drift-analysis.md` — found inside the M3 folder. This file belongs in the `M2 Conversation Intelligence/` folder.

---

## Executive Summary

The M3 documentation suite is well-written and architecturally consistent at a high level. All three TDDs correctly map to M-06 Insight Generation, the event-driven / async-first architecture pattern is described correctly, and the AI services separation (TypeScript orchestrates, Python infers) is maintained throughout. However, **12 specific drifts** were identified ranging from **critical** (missing owned table in README, misplaced file, unresolved open questions blocking schema design) to **medium** (AI endpoint naming inconsistency, missing env var, sequence diagram inconsistency). All are documented below with concrete recommended actions.

---

## Severity Legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Blocks implementation or creates structural architectural ambiguity |
| 🟠 High | Will cause confusion or bugs; should be fixed before dev begins |
| 🟡 Medium | Inconsistency creating documentation or schema debt |
| 🟢 Low | Minor quality, naming, or formatting issue |

---

## Drift #1 — Misplaced File: `M2-drift-analysis.md` in M3 Folder

**Severity:** 🟠 High  
**File:** `M3 AI Summaries & GenAI/M2-drift-analysis.md`

### What was found

The M3 folder root contains a file named `M2-drift-analysis.md`. This file documents drift findings for the M2 Conversation Intelligence module and has no relationship to M3. It was clearly placed in the wrong directory.

### Impact

- New engineers scanning the M3 folder for documentation will find an M2 file, creating confusion about what the M3 module actually owns.
- Future drift audits of the M3 folder will be contaminated by a file that does not belong.
- File management automation or documentation indexing tools may incorrectly associate the M2 analysis with M3.

### Recommended fix

Move `M3 AI Summaries & GenAI/M2-drift-analysis.md` to `M2 Conversation Intelligence/M2-drift-analysis.md`.  
The correct M2 drift analysis already exists in the `M2 Conversation Intelligence/` folder (written by a prior audit). The copy in the M3 folder should be deleted.

---

## Drift #2 — README Omits `querymessages` from Owned Data Tables

**Severity:** 🔴 Critical  
**File:** `Module README-M3 AI Summaries & GenAI.md` — Section 7 (Data Ownership)

### What was found

The README Section 7 lists the tables M3 owns:

```
- callsummaries
- dealbriefs
- accountbriefs
- researchreports
- querysessions
```

The `Ask Anything` TDD (Section 12, line 325) explicitly states:

> "The architecture defines `querysessions` for conversation sessions and `querymessages` for individual turns with content and cited sources."

And the TDD data model section (line 351) lists `querymessages` as a primary table used by Ask Anything. Yet `querymessages` is **completely absent** from the README's owned tables list.

### Impact

- A developer reading the README as the module entry point will not know that `querymessages` is an M-06-owned table.
- Database schema migration work for Ask Anything will likely miss creating this table under the correct schema.
- Cross-module teams will not know that session messages (with cited sources) are owned by M3/M-06.

### Recommended fix

Update README Section 7 to add `querymessages`:

```markdown
### Owned data
M3 owns:
- `callsummaries`
- `dealbriefs`
- `accountbriefs`
- `researchreports`
- `querysessions`
- `querymessages`
```

Also add `querymessages` to the Database Schema document under the M-06 `insightgeneration` schema with at minimum:

```sql
CREATE TABLE insightgeneration.querymessages (
  messageid       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessionid       UUID NOT NULL REFERENCES insightgeneration.querysessions(sessionid),
  tenantid        UUID NOT NULL,
  role            VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  citedsources    JSONB NULL,
  createdat       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_querymessages_session ON insightgeneration.querymessages (sessionid, tenantid);

ALTER TABLE insightgeneration.querymessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE insightgeneration.querymessages FORCE ROW LEVEL SECURITY;
```

---

## Drift #3 — AI Deep Researcher Has No Completion Event Defined

**Severity:** 🔴 Critical  
**File:** `TDD/TDD-AI Deep Researcher.md` — Section 6 (Events emitted), Section 11 (Job Lifecycle)

### What was found

The AI Deep Researcher TDD (Section 6, line 147) explicitly states:

> "No specific report-completed event is explicitly defined in the architecture for Phase 3. The canonical lifecycle is async job creation plus status polling through the research report API."

This is a deliberate choice, but it creates a serious downstream gap. The system architecture shows that modules like M-07 Deal and Account Management and M-08 Execution and Automation need to react to significant AI insights and analysis completion. Without an event, every downstream consumer must poll the REST API, which violates the platform's event-driven architecture mandate.

The contrast with AI Smart Summaries is stark: `call.summary.generated` is a properly defined event. There is no equivalent `research.report.completed` event anywhere in the system.

### This is an open question — answered here

A `research.report.completed` event **must be defined** for Phase 3. The reasons:

1. **Event-driven mandate:** The platform uses BullMQ-backed event-driven architecture by design. Polling-only APIs for long-running jobs contradict this.
2. **Downstream consumers need to react:** Any future automation or deal-enrichment that needs to incorporate research findings cannot know when to act without an event.
3. **Observability:** Without an event, there is no central trace for when a report completes, making debugging and monitoring harder.

**Recommended event schema:**

```json
{
  "eventId": "uuid",
  "reportId": "uuid",
  "tenantId": "uuid",
  "createdBy": "uuid",
  "status": "completed",
  "questionSummary": "string (first 200 chars)",
  "sourceCount": 0,
  "generatedAt": "ISO-8601 timestamp"
}
```

**Producer:** M-06 Insight Generation  
**Consumers (Phase 3):** Frontend notification layer (to stop polling), future M-08 automation hooks  
**Emission rule:** Only emit after `researchreports.status` is set to `completed` and the write is durable.

### Recommended fix

1. Add `research.report.completed` to the TDD events section.
2. Add the event schema to the Event Schema Registry.
3. Update the Sequence Diagram SD-03 to show event emission after `status = completed`.

---

## Drift #4 — AI Endpoint Naming Inconsistency: Research Endpoint

**Severity:** 🟠 High  
**Files:** `TDD/TDD-AI Deep Researcher.md` vs `M3 Environment Variables Registry.md`

### What was found

The AI Deep Researcher TDD (Section 14, lines 431-433) gives a vague endpoint definition:

> "Recommended internal endpoints:
> - `POST /v1/research` or equivalent internal research-generation endpoint
> - `POST /v1/embed` where embedding refresh or retrieval support is needed
> - internal summarization endpoints for intermediate batch reduction where appropriate"

The phrase **"or equivalent"** and **"where appropriate"** means the research endpoint has no stable canonical path defined, unlike:
- `POST /v1/summarize` (clearly defined in AI Smart Summaries TDD)
- `POST /v1/embed` (clearly defined in both Ask Anything and env registry)
- `POST /v1/answer-query` (clearly defined in Ask Anything TDD)

The env registry does not define any env var for the research AI endpoint path (e.g. `AI_RESEARCH_PATH` or equivalent).

### Impact

- Engineers building the research worker will invent their own endpoint names, creating fragmented AI service contracts.
- Contract tests cannot be written without a stable endpoint path.
- The Python AI service team has no canonical endpoint name to implement against.

### Recommended fix

1. **Canonicalize the endpoint** in the TDD as: `POST /v1/generate-report`
2. Add to the env registry:

| Variable | Required | Example | Used By | Purpose |
|---|---|---|---|---|
| `AI_RESEARCH_ENDPOINT` | Yes | `/v1/generate-report` | Research worker | Canonical path for the AI research-generation endpoint. Separate from summary and answer endpoints due to model and context differences. |

3. Update TDD Section 14 to remove the "or equivalent" hedge and state the canonical path definitively.

---

## Drift #5 — `semanticembeddings` Table Ownership Not Defined

**Severity:** 🟠 High  
**Files:** `TDD/TDD-Ask Anything.md` (Section 13), `TDD/TDD-AI Deep Researcher.md` (Section 13), `Module README-M3 AI Summaries & GenAI.md` (Section 7)

### What was found

Both Ask Anything and AI Deep Researcher TDDs reference `semanticembeddings` as a primary table used for vector retrieval. However:

- The README Section 7 does not list `semanticembeddings` as a table M3 owns.
- No M3 document claims ownership of this table.
- No M3 document states which module owns it.
- The README Section 7 mentions: *"vector generation and retrieval support are shared platform capabilities rather than M3-exclusive source systems"* — but does not say which module owns the table.

This creates a real module boundary ambiguity. If M-05 (Smart Tracking and Search) or M-01 (Data Ingestion) generates embeddings, M3 should read from those tables as a consumer, not own them. If M-06 generates its own embeddings, the table must be under M-06's schema and listed in its data ownership section.

### This is an open question — answered here

**Architecture decision:** `semanticembeddings` is a **shared platform-layer table** owned by the embedding generation pipeline (most likely M-01 or a dedicated embeddings module). M3/M-06 is a **consumer**, not an owner. M-05 also consumes it for search.

This is consistent with the platform's single-responsibility rule: transcript embedding is a post-ingestion operation that happens once and is shared across M3, M4, M5.

### Recommended fix

1. Update README Section 7 to explicitly state:

> *"M3 consumes but does NOT own `semanticembeddings`. Embedding storage is managed by the embedding generation pipeline (M-01 or platform layer). M3 reads embeddings through approved internal service calls or read-only access to the shared embedding table."*

2. Add a **Cross-module read contract** note in the Module Boundary document clarifying which module owns `semanticembeddings`.
3. Add this ownership decision to the Database Schema document.

---

## Drift #6 — SD-01 Sequence Diagram Missing Topic Tag and Tracker Detection Enrichment Path

**Severity:** 🟡 Medium  
**File:** `M3 Sequence Diagrams.md` — SD-01

### What was found

The SD-01 sequence diagram (Summary Generation flow) shows only the primary path:

1. `call.transcription.completed` → M-06 → fetch transcript → fetch Revenue Graph context → AI summarize → store → emit `call.summary.generated`

But the AI Smart Summaries TDD (Section 4 and 5) explicitly describes two additional trigger paths:

- **`call.topics.tagged`**: M3 consumes this event and enriches summary structure with topic information.
- **`tracker.detection.created`**: M3 refreshes affected deal briefs using debounce rules.

Neither of these event-driven paths appears in SD-01 or any other sequence diagram. SD-04 shows downstream consumers of `call.summary.generated` but does not address the topic-tag or tracker-detection enrichment flows that feed **into** M3.

### Recommended fix

Either:
1. Extend SD-01 with an alternate path section showing the topic-tag enrichment path (from `call.topics.tagged` to summary enrichment).
2. Create a new **SD-05** specifically for the deal-brief refresh flow triggered by `tracker.detection.created`, showing the debounce logic and the update to `dealbriefs`.

At minimum, add a prose section in the sequence diagram doc describing these flows with their debounce rules, even if full Mermaid diagrams are deferred.

---

## Drift #7 — Ask Anything: No Hybrid Search Decision Documented

**Severity:** 🟡 Medium  
**File:** `TDD/TDD-Ask Anything.md` — Section 21 (Open Questions), Section 9 (Retrieval)

### What was found

The Ask Anything TDD Open Questions (line 612) explicitly records:

> "Should Ask Anything support optional hybrid retrieval using Meilisearch plus pgvector, or remain vector-first in Phase 3?"

The Environment Variables Registry (line 104) includes:

```
RETRIEVAL_ENABLE_HYBRID_SEARCH | Yes | true | All envs | Ask, research
```

This variable is marked **Required = Yes** with a default of `true`, which implies hybrid search is **already expected to be on**. But the TDD Open Questions section still marks this as undecided.

These two documents are directly contradictory: the env registry declares hybrid search required and enabled, while the TDD Open Questions treats it as a pending design choice.

### This is an open question — answered here

The env registry's position should be treated as the architectural decision: **Hybrid search (Meilisearch + pgvector) is the default retrieval mode for Ask Anything.** This aligns with M-05's hybrid search architecture (also used for Searchable Conversation Library) and is already wired into the env registry.

**Implementation contract:**
- Always run pgvector semantic search.
- Supplement with Meilisearch full-text results when `RETRIEVAL_ENABLE_HYBRID_SEARCH = true`.
- Merge and rank results before prompt assembly.
- Fall back to pgvector-only if Meilisearch is unavailable.

### Recommended fix

1. Update the Ask Anything TDD Section 21 to mark this question resolved: *"Resolved: Hybrid retrieval (Meilisearch + pgvector) is the default Phase 3 retrieval mode, as declared in the env registry."*
2. Update TDD Section 9 (Retrieval Scope and Filters) to describe the hybrid retrieval architecture explicitly, not just vector search.
3. Add `MEILISEARCH_URL` and `MEILISEARCH_API_KEY` to the **Required** column for the Ask Anything minimum variable set (Section 6B of env registry), since hybrid search is now confirmed default behavior.

---

## Drift #8 — Open Question: Source References — Inline vs Normalized Table

**Severity:** 🟠 High  
**File:** `TDD/TDD-AI Smart Summaries.md` — Section 20 (Open Questions)

### Open question recorded

> "Should source references be stored inline in the summary tables or normalized into separate evidence-link tables?"

### Answer

**Source references must be stored in a normalized evidence-link table**, not inline in summary tables. The reasons:

1. **Queryability:** Inline JSONB source arrays cannot be queried efficiently when downstream systems need to find "which summaries cited this call" or "how many summaries reference this deal."
2. **Re-use across summary types:** Call summaries, deal briefs, and account briefs all produce source references. A normalized table lets all three share the same evidence infrastructure.
3. **Audit and compliance:** The platform's audit-first design requires evidence references to be individually traceable, not buried in opaque JSON blobs.
4. **AI Translator compatibility:** If summaries are later translated, the source references must remain linked to the original entity, not to the translated text blob.

**Recommended normalized table:**

```sql
CREATE TABLE insightgeneration.summaryevidencelinks (
  linkid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantid        UUID NOT NULL,
  summarytype     VARCHAR NOT NULL,  -- callsummary | dealbrief | accountbrief
  summaryid       UUID NOT NULL,
  sectionname     VARCHAR NULL,
  sourcetype      VARCHAR NOT NULL,  -- transcript | trackerdetection | topictag | activity | email
  sourceentityid  UUID NOT NULL,
  snippet         TEXT NULL,
  createdat       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_summaryevidence_summary ON insightgeneration.summaryevidencelinks (tenantid, summarytype, summaryid);
CREATE INDEX idx_summaryevidence_source ON insightgeneration.summaryevidencelinks (sourceentityid);
```

### Recommended fix

1. Update TDD Section 20 to mark this resolved with the normalized evidence-link table decision.
2. Add `summaryevidencelinks` to the README Section 7 owned tables list.
3. Add the table to the Database Schema document under the M-06 schema.
4. Update all three output storage sections (call summary, deal brief, account brief) in the TDD to reference `summaryevidencelinks` for evidence-link storage rather than inline JSONB.

---

## Drift #9 — Open Question: Regeneration — New Row vs Version History Table

**Severity:** 🟡 Medium  
**File:** `TDD/TDD-AI Smart Summaries.md` — Section 20 (Open Questions)

### Open question recorded

> "Should regeneration create a new row version or append version history in a companion history table?"

### Answer

**Regeneration should update the active row with an incremented version field AND append the prior version to a companion history table.**

The reasoning:
- Consumers (frontend, M-07, M-08) should always read the **latest** version from the primary table without needing to filter by version number. A single-row-with-version approach serves this efficiently.
- Auditability and debugging require access to prior versions. A history table preserves this without bloating the primary table.
- This is consistent with the platform's immutable-source-plus-derived-output pattern used for transcripts (rawtext vs correctedtext) and for scorecards in M-04.

**Recommended implementation:**
- `callsummaries`, `dealbriefs`, `accountbriefs`: keep latest version in the primary row with `version` integer and `updatedat` timestamp.
- Create a `summaryhistory` companion table that stores prior versions with `parentid`, `summarytype`, `version`, `snapshotdat`, and snapshot JSON columns.

### Recommended fix

Update TDD Section 20 to mark this resolved. Add `summaryhistory` to the README owned tables list and to the Database Schema document.

---

## Drift #10 — Minimum Env Var Sets Miss `MEILISEARCH_URL` Despite Hybrid Search Being Default

**Severity:** 🟡 Medium  
**File:** `M3 Environment Variables Registry.md` — Section 6 (Minimum Required Variables by Flow)

### What was found

The env registry Section 5 marks `MEILISEARCH_URL` and `MEILISEARCH_API_KEY` as **Optional** (no `Yes` in the Required column). But:

- `RETRIEVAL_ENABLE_HYBRID_SEARCH` is marked **Required = Yes** with default `true`.
- The hybrid search mode is now the resolved default for Ask Anything (Drift #7 above).
- Hybrid search cannot work without `MEILISEARCH_URL`.

If `MEILISEARCH_URL` is absent and `RETRIEVAL_ENABLE_HYBRID_SEARCH=true`, the application will either fail at runtime or silently degrade to vector-only search. Neither behavior is safe without explicit documentation and startup validation.

### Recommended fix

1. Mark `MEILISEARCH_URL` as **Required = Yes** in the env registry variable table.
2. Mark `MEILISEARCH_API_KEY` as **Required in non-local envs** with a note that it can be empty string for local unsecured Meilisearch.
3. Add both to the minimum required variables list for Section 6B (Ask Anything) and Section 6C (AI Deep Researcher, which also uses hybrid search).
4. Add startup validation: if `RETRIEVAL_ENABLE_HYBRID_SEARCH=true` and `MEILISEARCH_URL` is empty or invalid, the service must fail fast with a clear config error.

---

## Drift #11 — Module README References M-03 as Both Upstream Dependency AND Downstream Consumer

**Severity:** 🟡 Medium  
**File:** `Module README-M3 AI Summaries & GenAI.md` — Section 3 (Module Boundaries)

### What was found

The README Section 3 correctly lists M-03 Revenue Graph as an **upstream dependency** (line 52):

> "M-03 Revenue Graph for deal, account, and contact context"

But the same section also lists M-03 as a **downstream consumer** (line 59):

> "M-03 Revenue Graph in some summary propagation flows"

This bidirectional dependency is architecturally unusual and is not explained anywhere. If M3 depends on M-03 to get entity context for summary generation, and M-03 simultaneously depends on M3's generated summaries for "summary propagation," a circular dependency exists in the module communication design.

The AI Smart Summaries TDD (Section 3, lines 66-67) further says:

> "M-03 Revenue Graph, which consumes `call.summary.generated` and can write summary-derived activity notes and AI-extracted fields into CRM sync workflows."

This confirms the bidirectional flow. It is not a circular dependency in the blocking sense (because M-03 consumes events asynchronously), but it needs to be explicitly documented as an **event-driven, non-blocking bidirectional relationship** to prevent engineers from implementing synchronous request chains.

### Recommended fix

Add a clarifying note to the README and Module Boundary document:

> *"M-03 Revenue Graph is both an upstream dependency (M3 fetches entity context from M-03 via API during summary generation) and an event-driven downstream consumer (M-03 subscribes to `call.summary.generated` to propagate AI-extracted activity notes into CRM sync workflows). This is a valid non-circular pattern because the M-03 consumption of M3 events is asynchronous and does not create a blocking dependency during summary generation."*

This prevents implementation of a synchronous call-back pattern that would create an actual circular dependency at runtime.

---

## Drift #12 — Open Questions: Session Retention Policy Not Defined

**Severity:** 🟡 Medium  
**File:** `TDD/TDD-Ask Anything.md` — Section 21 (Open Questions)

### Open question recorded

> "Should session retention be configurable by tenant policy?"

### Answer

**Yes, session retention must be configurable by tenant policy**, and it must also have a platform-level maximum. The reasons:

1. **Customer data governance:** Customer conversation content is captured in `querysessions` and `querymessages` via cited source snippets. Some tenants may have data-retention SLAs that require session deletion after 30, 90, or 180 days.
2. **GDPR/compliance:** The platform's Security Architecture requires that customer-owned data be deletable on request. Session messages containing conversation evidence qualify as customer data.
3. **Cost:** Unbounded session history growth inflates database storage costs for long-running tenants.

**Recommended default:**
- Platform default: **90 days** of session retention.
- Tenant-configurable: 30, 60, 90, 180 days via workspace settings.
- Hard maximum: **365 days** regardless of tenant preference.

**Implementation requirement:**
- Add a `session_retention_days` field to workspace/tenant settings.
- Add a nightly background job that soft-deletes or archives sessions older than the configured retention window.
- `querymessages` must cascade-delete when a session is deleted.

### Recommended fix

1. Update TDD Section 21 to mark this resolved.
2. Add a `SESSION_RETENTION_DEFAULT_DAYS` environment variable to the env registry.
3. Add session retention documentation to the Security Architecture document.

---

## Summary Table

| # | Drift | Files Affected | Severity | Action |
|---|---|---|---|---|
| 1 | `M2-drift-analysis.md` misplaced in M3 folder | M3 folder root | 🟠 High | Move/delete the misplaced file |
| 2 | `querymessages` table missing from README owned data list | README, DB Schema | 🔴 Critical | Add `querymessages` to README §7 and DB schema |
| 3 | No `research.report.completed` event defined despite async job lifecycle | AI Deep Researcher TDD, Event Schema Registry, SD-03 | 🔴 Critical | Define and register the event; update SD-03 |
| 4 | Research AI endpoint has no canonical path (`/v1/research` is vague) | AI Deep Researcher TDD, Env Registry | 🟠 High | Canonicalize as `POST /v1/generate-report`; add env var |
| 5 | `semanticembeddings` ownership undefined across M3 docs | README, both TDDs | 🟠 High | Declare M3 as consumer, not owner; document the owner |
| 6 | SD-01 missing topic-tag enrichment and tracker-detection deal-brief refresh flows | Sequence Diagrams | 🟡 Medium | Add enrichment flows to SD-01 or create SD-05 |
| 7 | Hybrid search decision contradicted between TDD Open Questions and Env Registry | Ask Anything TDD, Env Registry | 🟡 Medium | Resolved: hybrid search is default; update TDD; mark MEILISEARCH vars required |
| 8 | Source references storage model unresolved (inline vs normalized table) | AI Smart Summaries TDD | 🟠 High | Resolved: normalized `summaryevidencelinks` table |
| 9 | Regeneration strategy unresolved (new row vs version history) | AI Smart Summaries TDD | 🟡 Medium | Resolved: update row + companion `summaryhistory` table |
| 10 | `MEILISEARCH_URL` marked optional despite hybrid search being required | Env Registry | 🟡 Medium | Mark as Required; add to minimum var sets |
| 11 | M-03 listed as both upstream dependency and downstream consumer without explanation | README | 🟡 Medium | Add clarifying note about async non-circular pattern |
| 12 | Session retention policy for `querysessions`/`querymessages` undefined | Ask Anything TDD | 🟡 Medium | Resolved: 90-day default, configurable, 365-day max |

---

## Critical Path Recommendation

Before any M3 implementation begins, the following must be resolved in order:

1. **Drift #2** — Add `querymessages` to the README and create the DB migration for it. This is the first table any Ask Anything implementation will try to write to.
2. **Drift #8** — Decide on normalized evidence links before writing any summary output code. Inline JSON storage is hard to migrate once production data exists.
3. **Drift #3** — Define `research.report.completed` event before the Deep Researcher worker is implemented. Adding an event after the fact requires coordinating all downstream consumers.
4. **Drift #4** — Canonicalize the research AI endpoint path. The Python AI services team needs a stable endpoint name to implement against.
5. **Drift #5** — Document `semanticembeddings` ownership before writing any retrieval code. The wrong module owning this table will create cross-boundary violations.

Drifts #6, #7, #9, #10, #11, and #12 should be resolved before the first deployment to staging but are not strictly code-blocking in the earliest implementation phase.

---

## Notes on Documents with No Drift

The following aspects were reviewed and found to be fully consistent and well-aligned. No changes recommended:

- **Product-to-architecture mapping:** All three TDDs correctly identify `M3 AI Summaries & GenAI` as the product label and `M-06 Insight Generation` as the architecture module. This two-layer naming is consistently applied.
- **Async-first for heavy features:** Summary generation, deal brief refresh, and research jobs are all correctly described as BullMQ-backed async workflows. No synchronous AI calls from product code appear anywhere.
- **`call.summary.generated` event schema:** The event is well-defined in the Smart Summaries TDD (Section 19) with correct payload fields, producer identification, consumer list, and emission rules.
- **Hallucination prevention rules:** All three TDDs include explicit rules against fabricated facts, unsupported claims, and invented citations. This is above average for module-level documentation.
- **Confidence score gating:** The 0.7 threshold for review flagging is consistently applied across all three features and aligned with the env registry (`SUMMARY_CONFIDENCE_MIN=0.70`).
- **Tenant isolation:** Every TDD enforces tenant-scoped retrieval, storage, and event payloads. RLS is documented and required.
- **Cost monitoring:** The env registry includes `AI_COST_BUDGET_DAILY_USD` and `AI_COST_ALERT_THRESHOLD_PCT`, and the Deep Researcher TDD specifically calls out cost monitoring as its most important observability concern. This is architecturally sound.
- **Idempotency:** All three features document idempotency keys. Duplicate event handling for `call.transcription.completed` is explicitly modeled.
- **Secret management:** All secrets route through Doppler. No hardcoded credentials in any env var examples.
- **LiteLLM gateway pattern:** The env registry correctly positions LiteLLM as the provider abstraction layer, and no TypeScript code is documented calling OpenAI directly.
