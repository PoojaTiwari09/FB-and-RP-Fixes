# Doc #11f — TDD: AI Transcriber

## 1. Document Control

- **Document title:** Technical Design Document — AI Transcriber 
- **Feature name:** AI Transcriber 
- **Product module:** M2 Conversation Intelligence pack 
- **Architecture owner module:** M-01 Data Ingestion, with conversation-consumption surfaces in M-04. 
- **Version:** v0.1 Draft 
- **Status:** Draft 
- **Owner:** Tech Lead / Transcription and Conversation Intelligence squads 
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager 
- **Last updated:** April 2026 

> **Product note:** AI Transcriber is grouped inside **M2 Conversation Intelligence pack** because users experience it as part of better conversation understanding.   
> **Architecture note:** The actual correction pipeline and persistent transcript correction storage belong to **M-01 Data Ingestion**, because the architecture defines vocabulary correction as a post-transcription step before storage and provides `vocabularycorrections` and `transcriptcorrections` in the transcription domain. 

### Ownership clarity

- **Product view owner:** M2 Conversation Intelligence pack. 
- **Pipeline and storage owner:** M-01 Data Ingestion. 
- **Consumer owner:** M-04 Conversation Intelligence and all downstream modules that read improved transcript text. 
- **Primary responsibility:** Correct business-specific mis-transcriptions such as product names, competitor names, acronyms, and industry jargon. 

---

## 2. Purpose

AI Transcriber improves transcript quality by correcting business-specific terms that base ASR often gets wrong, such as product names, competitor names, acronyms, and domain jargon.   
Its goal is not to replace speech-to-text, but to refine transcript output so downstream AI and human users work from cleaner text. 

This feature is product-positioned under conversation intelligence because users experience the improvement in call readability and downstream AI quality.   
Architecturally, however, it must run in the transcription pipeline because the system defines vocabulary correction as a **post-transcription, pre-storage** step. 

### Business problem

- Base ASR can mishear company-specific terms, product names, competitor names, acronyms, and jargon. 
- Those errors reduce trust in transcripts and also hurt downstream tagging, summaries, trackers, and extraction quality. 
- Teams need tenant-specific correction behavior because each customer has its own vocabulary. 

### What the feature does

- Maintains a tenant-specific vocabulary correction dictionary. 
- Applies mis-transcription mapping rules after ASR completes. 
- Stores correction logs for auditability. 
- Produces corrected transcript versions while preserving source traceability. 

---

## 3. Scope

### In scope

- Custom vocabulary source and rule management. 
- Post-transcription correction pipeline. 
- Mapping of incorrect terms to corrected terms. 
- Transcript versioning for corrected output. 
- Historic reprocessing policy for old transcripts when vocabulary improves. 

### Out of scope

- Raw speech-to-text generation itself, which is the core transcription service responsibility. 
- Speaker diarization, which is handled by the transcription stack using speaker-labeled segments. 
- General-purpose grammatical rewriting of transcript sentences. 
- Translation to another language, which belongs to AI Translator. 

### Assumptions

- A raw transcript already exists from Whisper or fallback ASR. 
- Correction is deterministic enough to be safely logged and replayed. 
- Vocabulary is tenant-scoped. 
- Corrected transcript text should improve downstream AI quality without hiding the original transcription record. 

### Upstream dependencies

- Transcription completion from M-01 transcription service. 
- Tenant-specific custom vocabulary from `vocabularycorrections`. 

### Downstream consumers

- M-03 Revenue Graph linking and context building. 
- M-04 conversation features such as tagging, review, and translation. 
- M-05 smart tracking and M-06 summaries, which benefit from cleaner transcript text. 

---

## 4. Users and Triggers

### Primary users

- RevOps or admins configuring vocabulary correction rules for their tenant. 
- Reps and managers reading improved transcripts. 
- AI pipelines consuming corrected text downstream. 

### Trigger types

- New transcript produced by ASR. 
- New vocabulary rules added or changed. 
- Manual or scheduled historic reprocessing of older transcripts. 

### Entry points

- Internal correction job triggered immediately after raw transcription. 
- Admin CRUD surface for vocabulary correction rules. 
- Internal reprocessing job for historic transcripts after vocabulary updates. 

### Preconditions

- `tenantId` must be known. 
- Transcript must exist. 
- Active vocabulary rules for the transcript language or general tenant scope must be retrievable. 

---

## 5. Functional Flow

### Happy path

1. M-01 receives completed ASR output from Whisper or AssemblyAI fallback.   
2. The transcript is available as raw text plus speaker segments and metadata.   
3. M-01 loads active tenant vocabulary correction rules from `vocabularycorrections`.   
4. The correction engine applies mis-transcription mapping rules to the transcript text and, where needed, speaker-labeled segment text.   
5. Each applied correction is logged in `transcriptcorrections` with original term, corrected term, and timestamp.   
6. The corrected transcript is stored as the current display-ready version while preserving raw traceability and version history.   
7. Downstream modules consume the corrected transcript rather than the noisy raw text where supported. 

### Alternate paths

- If no active vocabulary rules exist for the tenant, the raw transcript becomes the effective display version. 
- If a transcript language is known, language-matched correction rules can be applied first. 
- Historic reprocessing can regenerate corrected versions of older transcripts when important new rules are added. 

### Failure paths

- If correction processing fails, raw transcript must still be stored so the pipeline does not block. 
- If one rule conflicts with another, deterministic priority rules must prevent unstable replacement loops. 
- If correction confidence is ambiguous, the system should prefer preserving the raw term over making a risky rewrite. 

---

## 6. Inputs and Outputs

### Inputs

- `tenantId` 
- `transcriptId` 
- Raw transcript text and speaker-labeled segments. 
- Detected language metadata when available. 
- Active vocabulary rules from `vocabularycorrections`. 

### Outputs

- Corrected transcript text. 
- Corrected segment text where segment-level storage is supported. 
- Correction audit records in `transcriptcorrections`. 
- Transcript version metadata for corrected output lifecycle. 

### Business value outputs

- Better human-readable transcripts. 
- Better downstream AI accuracy for topics, trackers, summaries, extraction, and search. 

---

## 7. Data Model

### Architecture-backed tables

- `transcripts` stores transcript body and language metadata. 
- `speakersegments` stores speaker-labeled segment text. 
- `transcriptcorrections` stores applied correction logs per transcript. 
- `vocabularycorrections` stores tenant-configurable term mappings. 

### Known schema fields

#### `vocabularycorrections`
- `vocabid` 
- `tenantid` 
- `incorrectterm` 
- `correctterm` 
- `language` 
- `isactive` 

#### `transcriptcorrections`
- `correctionid` 
- `transcriptid` 
- `tenantid` 
- `originalterm` 
- `correctedterm` 
- `appliedat` 

#### `transcripts`
- `transcriptid` 
- `callid` 
- `tenantid` 
- `rawtext` 
- `languagedetected` 
- `wordcount` 
- `confidencescore` 
- `createdat` 

### Recommended versioning extension

The architecture already includes correction logs, but this TDD should formalize corrected transcript versioning so old and new corrected outputs stay traceable.   
A simple, fresher-friendly design is to keep raw transcript text immutable and add version metadata for corrected outputs. 

### Recommended transcript version fields

```sql
ALTER TABLE transcripts
ADD COLUMN correctedtext TEXT NULL,
ADD COLUMN correctionversion INTEGER DEFAULT 0,
ADD COLUMN correctionstatus VARCHAR DEFAULT 'not_applied',
ADD COLUMN correctionupdatedat TIMESTAMPTZ NULL;
```

### Versioning rule

- `rawtext` is the original ASR output and should never be overwritten. 
- `correctedtext` is the latest approved corrected version for UI and downstream AI consumption. 
- `correctionversion` increments whenever the applied correction result changes materially. 
- `transcriptcorrections` remains the detailed audit log of what changed. 

---

## 8. AI and Rule Processing

### Processing type

AI Transcriber is primarily a **correction layer** over transcript output, using tenant-specific vocabulary mappings to fix repeat ASR mistakes.   
This is closer to governed text normalization than open-ended generation. 

### Pipeline location

The architecture explicitly says vocabulary correction is applied **post-transcription before storage**.   
That means this feature must execute after ASR completion but before transcript output is considered final for downstream use. 

### Processing mode

- Main pipeline orchestration remains in TypeScript product services. 
- Heavy ASR remains in the Python transcription service. 
- Correction logic can be deterministic rule application in the product layer, with optional AI assistance only if later approved. 

### Important rule

Do not turn vocabulary correction into uncontrolled sentence rewriting.   
The approved feature intent is targeted correction of business-specific mis-transcriptions, not creative paraphrasing. 

---

## 9. Service and Integration Design

### Internal services

- **Transcription Service:** produces raw ASR output with language and confidence metadata. 
- **M-01 Data Ingestion service:** stores transcript records, applies vocabulary corrections, and logs transcript corrections. 
- **Downstream consumers:** read corrected transcript data after M-01 finalization. 

### Integration pattern

- ASR is handled by Whisper first, with AssemblyAI as documented fallback. 
- Correction logic is triggered inside the M-01 flow after transcription completes. 
- Resulting transcript state is published through the standard event-driven downstream flow rather than direct schema writes by other modules. 

### External dependencies

- Whisper is the primary transcription path. 
- AssemblyAI is the fallback ASR path. 
- pyannote supports speaker diarization in the broader transcription pipeline. 

---

## 10. Security and Compliance

### Tenant isolation

Vocabulary rules and correction logs are tenant-scoped and must follow the same RLS and tenant ownership rules as other transcription data. 

### Access control

- Only authorized admins or RevOps users should manage vocabulary correction rules. 
- Transcript readers only see corrected text for transcripts they already have permission to access. 

### Sensitive data handling

- Corrected transcripts contain the same sensitive customer information as raw transcripts. 
- Logs and debugging must avoid exposing entire transcript bodies unnecessarily. 

### Auditability

- Every applied term correction should remain traceable through `transcriptcorrections`. 
- Historic reprocessing should record version increments and timestamped updates. 

---

## 11. Error Handling

### Correction failures

- If correction logic fails, store raw transcript and mark correction as failed or skipped. 
- Downstream pipeline should continue with raw text rather than blocking the entire call-processing lifecycle. 

### Rule conflicts

- Exact-term rules should be deterministic. 
- If multiple active rules could match the same span, the system must apply a stable precedence order rather than chaining unpredictable replacements. 

### Risky replacements

- Prefer exact or clearly bounded term replacement over broad fuzzy replacement for v1. 
- If a replacement would alter too many occurrences or touch ordinary language, the safer behavior is to skip and log for review. 

### Historic job failures

- Reprocessing jobs should be retryable and idempotent. 
- A failed historic batch must not corrupt current transcript versions. 

---

## 12. Observability

### Logs

Structured logs should include:

- `tenantId` 
- `transcriptId` 
- `callId` 
- Rule count loaded. 
- Correction count applied. 
- `correctionVersion` 
- Whether transcript was raw-only, corrected, reprocessed, or failed. 

### Metrics

Recommended metrics:

- Number of corrections applied per transcript. 
- Correction hit rate by tenant. 
- Most frequently corrected terms. 
- Historic reprocessing jobs completed. 
- Correction failure rate. 
- Downstream quality lift metrics, such as fewer flagged transcript mistakes in QA review. 

### Alerts

Recommended alerts:

- Spike in correction job failures. 
- Sudden drop in correction hit rate after a deploy. 
- Reprocessing backlog growth. 
- Rule conflict detection spikes. 

---

## 13. Non-Functional Requirements

### Performance

- Correction must be fast enough to stay inside the post-transcription pipeline without creating noticeable downstream delay. 
- Historic reprocessing should be background-only and never block new transcription flow. 

### Reliability

- The same transcript plus same correction-rule set should produce the same corrected output. 
- Reprocessing should be idempotent when no material correction changes exist. 

### Scalability

- Rule lookups must remain tenant-scoped and indexed efficiently. 
- Historic backfills should run as queues or batches, not as synchronous admin requests. 

### Explainability

- Users and support teams should be able to see what changed and why. 
- Logs and versioning should make correction behavior understandable even for a fresher debugging the issue. 

---

## 14. Test Strategy

### Unit tests

- Exact-match term replacement. 
- Case normalization behavior. 
- Language-filtered rule selection. 
- Rule conflict precedence. 
- Version increment behavior. 

### Integration tests

- ASR output to corrected transcript flow. 
- `vocabularycorrections` CRUD to correction application flow. 
- `transcriptcorrections` audit insertion. 
- Historic reprocessing workflow on existing transcripts. 

### Contract tests

- Transcript persistence schema includes correction fields where adopted. 
- Downstream consumers can read corrected transcript without schema confusion. 

### Quality evaluation tests

- Golden samples with known business names and acronyms. 
- False-correction checks to ensure generic words are not wrongly rewritten. 
- Before-vs-after downstream task quality tests for topic tagging, smart tracking, and summaries. 

---

## 15. Open Questions

### Pending design decisions

- Should corrected segment text be stored physically in `speakersegments`, or computed from corrected full transcript mapping when needed. 
- Should admins approve some high-impact vocabulary rules before they become active. 
- Should transcript correction trigger re-embedding or re-tagging for already processed downstream artifacts. 

### Risks

- Over-aggressive correction rules can introduce false positives. 
- Historic reprocessing can create mismatch between old downstream outputs and new transcript text if not coordinated. 
- Multi-language transcripts may need language-specific rules to avoid incorrect substitutions. 

### Deferred items

- UI diff viewer between raw and corrected transcript. 
- Suggested vocabulary mining from repeated correction candidates. 
- Confidence-based correction recommendations from AI rather than admin-only dictionaries. 

---

## 16. Feature-Specific Appendix

### 16.1 Custom vocabulary source

The architecture explicitly defines a `vocabularycorrections` table with tenant-scoped incorrect and correct term mappings plus language and active-state fields.   
The feature mapping says AI Transcriber corrects business-specific terms such as product names, competitor names, acronyms, and industry jargon, which defines the business source of the vocabulary set. 

#### Vocabulary sources in v1

- Admin-entered product names. 
- Competitor names. 
- Acronyms and abbreviations. 
- Industry jargon and internal business terminology. 

#### Recommended sourcing model

Start with **tenant-managed vocabulary lists** as the primary source.   
Later, the system can suggest candidate terms from repeated transcript errors, but that should be a future enhancement rather than the v1 source of truth. 

### 16.2 Mis-transcription mapping rules

The feature intent is to correct known mis-transcribed terms, so the safest v1 rule style is **explicit incorrect -> correct term mapping**. 

#### Core rule format

```json
{
  "incorrectTerm": "gong",
  "correctTerm": "Gong",
  "language": "en",
  "isActive": true
}
```

#### Recommended rule behavior

- Prefer exact token or phrase replacement. 
- Respect language when provided. 
- Apply only active rules. 
- Log every applied correction. 
- Avoid recursive replacement loops. 

#### Practical precedence order

1. Longer phrase matches before shorter ones.   
2. Language-specific rules before generic rules.   
3. Exact-case-preserving output where possible, but corrected business spelling wins over ASR spelling. 

### 16.3 Correction pipeline timing

The architecture is very explicit here: vocabulary correction is **applied post-transcription before storage**.   
This is one of the most important implementation constraints for AI Transcriber. 

#### Timing sequence

1. Audio is transcribed by Whisper or fallback provider.   
2. Raw transcript text is returned.   
3. M-01 applies vocabulary corrections.   
4. Corrected transcript becomes the main persisted readable version.   
5. Downstream events and consumers use the corrected transcript path. 

#### Why timing matters

If correction happens too late, downstream modules like topic tagging, trackers, summaries, and extraction may work from noisier text and produce worse outputs. 

### 16.4 Historic reprocessing policy

The extra requirement asks for historic reprocessing, and the architecture supports replayable, queue-based processing patterns plus correction logging and versioning-friendly storage. 

#### Recommended policy

- Do **not** automatically reprocess all history for every small rule change. 
- Reprocess historic transcripts only when a new rule is important enough to improve major business terminology quality. 
- Run historic reprocessing as an async batch job by tenant, date range, or selected transcript set. 
- Increment transcript correction version only when the corrected output actually changes. 

#### Good default

Use **forward-only application by default**, with admin-triggered or threshold-triggered historic backfill for important vocabulary updates. 

### 16.5 Corrected transcript versioning

The architecture already preserves raw text and transcript correction logs, which gives a strong base for transcript versioning.   
This TDD should formalize a simple version model that freshers can easily understand. 

#### Recommended version model

- `rawtext` = original ASR text, immutable. 
- `correctedtext` = latest corrected transcript. 
- `correctionversion` = integer version of corrected output. 
- `transcriptcorrections` = audit trail of applied term substitutions. 

#### Example

```json
{
  "transcriptId": "uuid",
  "rawText": "We are also looking at kong and relanto eye.",
  "correctedText": "We are also looking at Gong and Relanto AI.",
  "correctionVersion": 2
}
```

This keeps debugging easy because engineers can always compare the raw and corrected versions directly. 

### 16.6 Simple implementation guidance

For a fresher, the clean mental model is: **ASR first, correction second, storage third, downstream AI after that**. 

#### Rule of thumb

- Do not overwrite raw transcript text. 
- Do not let other modules write transcript corrections directly. 
- Do not use AI Transcriber for freeform rewriting. 
- Keep correction rules tenant-owned, logged, versioned, and easy to replay. 