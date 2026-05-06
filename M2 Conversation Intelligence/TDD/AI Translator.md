# Doc #11e — TDD: AI Translator

## 1. Document Control

- **Document title:** Technical Design Document — AI Translator 
- **Feature name:** AI Translator 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-04 Conversation Intelligence 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Tech Lead / Conversation Intelligence squad 
- **Reviewers:** AI Lead, Backend Lead, Frontend Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Product note:** AI Translator is grouped inside **M2 Conversation Intelligence pack** because it helps multilingual teams understand call content and AI-generated outputs.   
> **Architecture note:** Internal implementation ownership belongs to **M-04 Conversation Intelligence**, where the architecture explicitly places AI Translator alongside AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, and AI Transcriber. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Architecture view owner:** M-04 Conversation Intelligence. 
- **Primary responsibility:** Translate transcripts and AI-generated outputs into the preferred language of the workspace or user. 

---

## 2. Purpose

AI Translator converts conversation content and AI-generated outputs into a preferred language so multilingual users can consume the same revenue intelligence without language friction.   
The feature supports transcripts as well as downstream outputs such as summaries, briefs, and notes. 

This feature belongs in the M2 product pack because it improves understanding of calls and conversation-derived insights.   
In the architecture, it sits in M-04 because translation is treated as part of the Understand-stage conversation intelligence pipeline. 

### Business problem

- Sales, RevOps, and leadership teams may work across different languages inside the same workspace. 
- Raw transcripts may be captured in one language while managers want insights in another. 
- Summaries and briefs lose adoption if users cannot read them comfortably. 

### What the feature does

- Detects the source language of transcript content. 
- Selects the target language using preference hierarchy across workspace, team, and user levels. 
- Produces translated versions of transcripts and AI-generated outputs such as summaries, briefs, and notes. 
- Preserves original content while storing translated text in a governed, tenant-safe way. 

---

## 3. Scope

### In scope

- Source language detection for transcript or text input. 
- Target language resolution using `translationpreferences`. 
- Translation of transcripts. 
- Translation of AI-generated outputs including summaries, briefs, and notes. 
- Fallback behavior and quality warning signals when translation quality is weak or uncertain. 

### Out of scope

- Raw ASR transcription, which belongs to Call Transcription in M-01. 
- Vocabulary correction, which belongs to AI Transcriber and `vocabularycorrections` (owned by M-01 Data Ingestion schema and managed via M-01 APIs). 
- Semantic summarization logic, which belongs to M-06 Insight Generation. 
- Email generation localization logic in Email Composer, except where it later consumes translated or preferred-language content. 

### Assumptions

- Original source content remains the system-of-record text. 
- Translation is an AI-processing step, not a manual editing replacement. 
- Translation preferences are tenant-scoped and may exist at workspace, team, or user level. 
- Translation may run asynchronously through the approved AI services architecture. 

### Upstream dependencies

- Transcript text from M-01 and M-03-linked conversation context. 
- AI-generated outputs from M-06 for summaries and briefs. 
- Preference configuration from `translationpreferences`. 

### Downstream consumers

- Conversation views that show translated transcript text. 
- Summary, brief, and note surfaces that need localized reading output. 
- Any future multilingual UI workflows that consume translated artifacts. 

---

## 4. Users and Triggers

### Primary users

- Sales managers reviewing calls in a language different from the original conversation. 
- RevOps and leadership users consuming translated summaries and briefs. 
- Global teams working in multilingual accounts or regions. 

### Trigger types

- New transcript available for translation. 
- User requests translated viewing of transcript content. 
- New summary or brief becomes available and needs translated rendering. 
- Preference change at workspace, team, or user level requiring future outputs to follow a different target language. 

### Entry points

- Internal translation job triggered after transcript availability. 
- Internal translation job triggered after summary or brief generation. 
- Read APIs in M-04 or M-06 that serve original plus translated content depending on requested preference. 

### Preconditions

- Source text must exist. 
- Tenant context must be known. 
- Target language must resolve successfully from explicit request or preference hierarchy. 

---

## 5. Functional Flow

### Happy path

1. A transcript, summary, brief, or note becomes available.   
2. The system determines the source language from content or existing metadata.   
3. The system resolves the target language using preference hierarchy: user first, then team, then workspace default.   
4. If source and target language are the same, the system skips translation and marks the original as display-ready.   
5. If translation is required, the product service enqueues an async translation job to the AI services layer.   
6. The AI service returns translated text and quality metadata.   
7. The translated output is stored as a language-specific derived artifact while preserving the original text.   
8. UI surfaces show translated content with original-language traceability. 

### Alternate paths

- A user may request a different language than the default preference, which should override stored preferences for that request context. 
- Existing translated content may be reused if the same entity and target language were already processed. 
- Partial translation may be allowed for some entities if only transcript or summary is available at that time. 

### Failure paths

- If source language cannot be confidently detected, the system should still allow translation using best-effort detection but mark the result with a quality warning. 
- If AI translation fails, the UI should continue showing the original text rather than blocking access. 
- If target language preference is missing everywhere, workspace default should be used; if even that is missing, original text remains visible with no translation attempt. 

---

## 6. Inputs and Outputs

### Inputs

- `tenantId` 
- Source text, such as transcript body, summary text, brief text, or notes. 
- Source entity metadata, such as `callId`, `summaryId`, `briefId`, or note identifier. 
- Language preference records from `translationpreferences`. 

### Outputs

- Source language metadata. 
- Target language metadata. 
- Translated text for the requested entity. 
- Quality flags or warnings when translation confidence is weak or fallback behavior is used. 

### Covered content types

- **Transcripts** are explicitly in scope. 
- **Summaries** are explicitly in scope. 
- **Briefs** are explicitly in scope. 
- **Notes** are called out in the feature mapping as part of AI-generated outputs and should be treated as supported derived text where present. 

---

## 7. Data Model

### Known architecture tables

- `translationpreferences` stores target language preferences at workspace, team, and user level. 
- `transcripts` already stores source-language-related metadata through `languagedetected`. 
- `callsummaries`, `dealbriefs`, and `accountbriefs` hold source generated outputs that may require translated variants. 

### Existing preference schema

The architecture defines `translationpreferences` with at least these fields: 

- `prefid` 
- `tenantid` 
- `teamid` 
- `userid` 
- `targetlanguage` 

### Recommended derived storage model

To keep ownership clean and understandable, translated text should be stored as **derived, language-specific child records** rather than overwriting source text. A schema migration must be created to add the `translatedtexts` table to the M-04 `conversationintelligence` schema with proper RLS enforcement. 

### Recommended translation artifact table

```sql
translatedtexts (
  translationid UUID PRIMARY KEY,
  tenantid UUID NOT NULL,
  entitytype VARCHAR NOT NULL,      -- transcript | callsummary | dealbrief | accountbrief | note
  entityid UUID NOT NULL,
  sourcelanguage VARCHAR NOT NULL,
  targetlanguage VARCHAR NOT NULL,
  translatedtext TEXT NOT NULL,
  qualitystatus VARCHAR NOT NULL,   -- success | warning | fallback | failed
  warningcode VARCHAR NULL,         -- low_confidence | source_uncertain | provider_fallback
  modelversion VARCHAR NULL,
  createdat TIMESTAMPTZ DEFAULT NOW,
  UNIQUE (tenantid, entitytype, entityid, targetlanguage)
)
```

### Storage rules

- Original text remains authoritative and immutable from the translator’s point of view. 
- One translated artifact per entity per target language prevents duplicate storage. 
- Translation preferences stay separate from translation outputs. 
- Language tags should use a standard normalized code format, such as BCP-47 style strings, to avoid messy duplicates like `en`, `EN`, and `english`. 

---

## 8. AI Processing

### AI task performed

AI Translator performs language detection and language translation over transcripts and derived AI outputs.   
The architecture places this under M-04 as part of the AI processing done during the Understand stage. 

### Processing mode

- Translation must follow the platform rule that AI calls happen through Python AI services, not directly inside TypeScript product code. 
- Translation should run asynchronously through BullMQ-backed workflows where processing is not trivial or may be retried. 

### Expected AI contract

The AI service should return structured JSON, not only plain translated text, because the platform prefers machine-readable outputs with confidence or warning metadata. 

### Example response shape

```json
{
  "entityType": "transcript",
  "entityId": "uuid",
  "sourceLanguage": "es",
  "targetLanguage": "en",
  "translatedText": "The customer asked for a revised proposal next week.",
  "qualityStatus": "success",
  "warningCode": null,
  "modelVersion": "v1",
  "latencyMs": 420
}
```

### Quality model

- Success means translation completed with no significant warning. 
- Warning means output is usable but should be labeled carefully, such as uncertain source-language detection. 
- Fallback means an alternate provider or degraded translation path was used. 
- Failed means the original text should be shown with no translated replacement. 

---

## 9. Service and Integration Design

### Internal services

- **NestJS M-04 service:** owns business rules, preference resolution, entity routing, persistence, and API behavior. 
- **Python AI service:** performs language detection and translation and returns structured JSON. 
- **BullMQ + Redis:** handle async orchestration, retries, and resilience. 

### Integration pattern

- Product services must call internal AI services through approved internal APIs or queues. 
- Business logic such as preference hierarchy and storage decisions stays in TypeScript product services. 
- AI service returns translation results but does not decide authorization, tenancy, or presentation logic. 

### External dependencies

The architecture names OpenAI as the primary approved LLM provider and LiteLLM as the gateway pattern for provider abstraction and fallback.   
That means translation should fit the same approved provider-routing discipline rather than calling random providers directly from feature code. 

---

## 10. Security and Compliance

### Tenant isolation

Translation preferences and translated outputs are tenant-scoped and must follow the platform’s shared PostgreSQL plus RLS model. 

### Access control

- Users can only view translated outputs for entities they are already allowed to view. 
- Translation does not create a new permission boundary; it is just another representation of the same underlying content. 

### Sensitive data handling

- Translated text can contain the same sensitive customer information as the original transcript or summary. 
- Storage, logging, and export behavior must treat translated artifacts as sensitive customer data. 

### Compliance note

The architecture says customer data and AI-generated outputs belong to the client and must not be used for shared model training without explicit written consent.   
That rule applies equally to translated text. 

---

## 11. Error Handling

### Detection failures

- If source language detection is uncertain, continue with best-effort translation only when allowed by policy, and attach a warning flag. 
- If source detection completely fails, keep the original visible and mark translation unavailable. 

### Translation failures

- Provider timeout or temporary AI failure should trigger retry through async queue handling. 
- Permanent failure should not block transcript or summary access. 
- Existing cached translation may be reused when the fresh regeneration attempt fails. 

### Preference resolution failures

- If user preference does not exist, fall back to team preference. 
- If team preference does not exist, fall back to workspace preference. 
- If none exist, do not guess beyond configured defaults; show original text. 

### Quality warnings

Warnings should be surfaced when:

- Source language detection confidence is low. 
- Translation used a fallback provider or degraded path. 
- Source text is noisy, incomplete, or mixed-language enough that output may be unreliable. 

---

## 12. Observability

### Logs

Structured logs should include:

- `tenantId` 
- `entityType` 
- `entityId` 
- `sourceLanguage` 
- `targetLanguage` 
- `qualityStatus` 
- `warningCode` 
- AI latency and retry count. 

### Metrics

Recommended metrics:

- Translation requests by entity type. 
- Language pairs requested most often. 
- Translation success, warning, fallback, and failure rates. 
- Average latency by entity type and language pair. 
- Cache reuse rate for already translated artifacts. 
- Source-language detection uncertainty rate. 

### Alerts

Recommended alerts:

- Spike in failed translation jobs. 
- Sudden increase in warning-rate for one language pair. 
- Repeated fallback-provider activation. 
- Queue backlog for translation jobs. 

---

## 13. Non-Functional Requirements

### Performance

- Translation should not block basic reading of original content. 
- User-facing reads should prefer stored translation artifacts over on-demand regeneration. 

### Scalability

- Translation demand may grow with every transcript, summary, and brief, so deduplicated per-language storage is important. 
- Async orchestration is required to keep UI paths fast. 

### Reliability

- Same entity and same target language should not create duplicate translation rows. 
- Retries must be idempotent. 

### Explainability

- UI should make it clear when text is translated rather than original. 
- Warning labels should be understandable to a non-technical user, for example, “Translation may be imperfect because source language was unclear.” 

---

## 14. Test Strategy

### Unit tests

- Source-language detection routing. 
- Preference hierarchy resolution. 
- Same-language skip logic. 
- Quality warning mapping. 
- Duplicate artifact prevention. 

### Integration tests

- Transcript translation pipeline. 
- Summary translation pipeline. 
- Brief translation pipeline. 
- Note translation pipeline where note entities exist. 
- Translation preference updates affecting later outputs. 

### Contract tests

- AI service response schema for detect-and-translate. 
- Persistence schema for translated text artifacts. 

### Quality evaluation tests

- Golden datasets for common language pairs. 
- Mixed-language transcript samples. 
- Business terminology preservation checks, especially after AI Transcriber corrections upstream. 
- Human review workflow for weak-confidence or warning-tagged translations. 

---

## 15. Open Questions

### Pending design decisions

- Should transcript segment-level translation be stored in addition to full transcript translation for playback-aligned UIs. 
- **[RESOLVED]** Translation will happen lazily (on-demand) when a user or system first requests a specific language pair. The only proactive exception is auto-translation to the workspace default language if it differs from the source. 
- Should summaries and briefs be translated from original transcript context or from already generated English-first outputs when both exist. 

### Risks

- Mixed-language calls can reduce source-language detection quality. 
- Translation can flatten nuance in pricing, objections, legal wording, or next-step commitments. 
- Re-translating AI-generated summaries may compound information loss compared with translating raw transcript evidence. 

### Deferred items

- Multi-language side-by-side viewer. 
- User-editable translated notes. 
- Domain-specific translation memory for organization-specific vocabulary. 

---

## 16. Feature-Specific Appendix

### 16.1 Source language detection

The architecture already stores `languagedetected` on `transcripts`, which gives AI Translator a natural starting point for transcript-level source language resolution.   
The feature mapping also says AI Translator converts transcripts and AI-generated outputs into the preferred language, which means source-language detection must cover both captured and derived text. 

#### Recommended source-language detection order

1. Use existing `transcripts.languagedetected` when translating a transcript.   
2. Use inherited source-language metadata from the source entity when translating summaries or briefs derived from one primary source language.   
3. Run AI language detection directly on text when metadata is absent or unreliable.   
4. If confidence is low, proceed only with a warning flag. 

#### Practical rule

Treat source-language detection as metadata resolution first, AI re-detection second.   
This reduces cost, avoids duplicate work, and keeps behavior consistent across downstream entities. 

### 16.2 Target language selection hierarchy

The architecture defines `translationpreferences` with `tenantid`, `teamid`, `userid`, and `targetlanguage`, and the feature mapping explicitly calls for preference support at user or workspace level.   
For a clean hierarchy, the effective target language should resolve in this order: **user -> team -> workspace**. 

#### Resolution logic

1. If the user has an explicit language preference, use it.   
2. Else if the user’s team has a language preference, use it.   
3. Else use workspace default language for the tenant.   
4. Else do not translate and show original. 

#### Example

If a workspace default is Spanish, a team default is French, and a specific manager has English preference, that manager should see English because user preference is the most specific level. 

### 16.3 Translation coverage

The feature mapping explicitly says AI Translator converts **call transcripts** and AI-generated outputs such as **summaries, briefs, and notes** into the preferred language.   
The architecture also repeats that AI Translator translates **transcripts, summaries, and briefs** into the preferred language of the user or workspace. 

#### Required v1 coverage

- Full call transcript text. 
- Call summaries. 
- Deal briefs. 
- Account briefs. 
- Notes or other AI-generated derived text where present in the product flow. 

#### Coverage rule

Do not limit AI Translator to transcript-only mode.   
It must cover both primary conversation text and major downstream AI outputs, otherwise the multilingual experience becomes inconsistent. 

### 16.4 Storage strategy for translated text

The architecture explicitly defines source entities and translation preferences but does not recommend overwriting source text anywhere.   
That means the safest strategy is: **store translated text as derived artifacts, keep original text unchanged, and key each translation by entity plus target language**. 

#### Recommended strategy

- Keep source transcript in `transcripts.rawtext` or equivalent source fields untouched. 
- Keep source summaries and briefs in their original module-owned tables untouched. 
- Store translations in a dedicated translation artifact table owned by the feature’s module boundary. 
- Reuse stored artifacts on read instead of retranslating each time. 

#### Why this is the right pattern

It preserves auditability, avoids data loss, supports multiple target languages, and respects module data ownership. 

### 16.5 Fallback and quality warning behavior

The broader architecture and tool inventory both require structured AI outputs, fallback-aware provider routing, and human-review or warning-oriented handling for lower-confidence AI results.   
AI Translator should follow the same discipline. 

#### Fallback behavior

- If primary translation provider fails temporarily, retry through queue rules first. 
- If the platform has an approved fallback provider path through LiteLLM or equivalent routing, use it and mark the output as `fallback`. 
- If fallback also fails, return the original text and mark translation unavailable. 

#### Quality warning behavior

Raise a visible warning when:

- Source language is uncertain. 
- Translation was generated through fallback path. 
- Text is mixed-language or low-quality enough to reduce reliability. 
- Critical business terms appear unstable after translation. 

#### Example UI labels

- “Translated from Spanish.” 
- “Translation may be imperfect because the source language was unclear.” 
- “Fallback translation path used.” 

### 16.6 Simple implementation guidance

To keep the design easy even for freshers, think of AI Translator as a **four-step pipeline**. 

1. Find the original text.   
2. Detect the source language.   
3. Resolve the target language from user, team, then workspace preference.   
4. Translate once, store once per target language, and reuse later. 

#### Engineering rule of thumb

- Do not overwrite source text. 
- Do not put translation logic in frontend code. 
- Do not put business preference logic in Python AI code. 
- Keep business rules in TypeScript, AI inference in Python, and storage keyed by entity plus language. 