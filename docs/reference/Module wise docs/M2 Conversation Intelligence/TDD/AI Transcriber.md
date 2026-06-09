# Doc #11f — TDD: AI Transcriber

## 1. Document Control

- **Document Title:** Technical Design Document — AI Transcriber
- **Feature Name:** AI Transcriber (Vocabulary Correction Engine)
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Tech Lead / Conversation Intelligence Squad
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

AI Transcriber improves transcript quality by correcting business-specific terms that base ASR often gets wrong, such as product names, competitor names, acronyms, and domain jargon. Its goal is not to replace speech-to-text, but to refine transcript outputs so downstream AI and human users work from cleaner text.

This feature is product-positioned under M2 Conversation Intelligence because users experience it as part ofcall readability and downstream AI quality. Under v3.0, the vocabulary correction rules registry and correction logs are managed inside M2.

### Business Problem
- Base ASR mishears company-specific terms, product names, competitor names, acronyms, and jargon.
- Those errors reduce trust in transcripts and hurt downstream tagging, summaries, trackers, and extraction quality.
- Teams need tenant-specific correction behavior because each customer has its own vocabulary.

### What the Feature Does
- Maintains a tenant-specific vocabulary correction dictionary.
- Applies mis-transcription mapping rules after ASR completes.
- Stores correction logs for auditability.
- Produces corrected transcript versions while preserving source traceability.

---

## 3. Scope

### In Scope
- Custom vocabulary source and rule management.
- Post-transcription correction pipeline.
- Mapping of incorrect terms to corrected terms.
- Transcript versioning for corrected outputs.
- Historic reprocessing policy for old transcripts when vocabulary rules are updated.

### Out of Scope
- Raw speech-to-text generation itself, which is the core responsibility of M1 Capture & Transcription.
- Speaker diarization (handled by the M1 transcription stack using speaker-labeled segments).
- General-purpose grammatical rewriting of transcript sentences.
- Translation to another language (handled by AI Translator).

### Assumptions
- A raw transcript already exists from Whisper or fallback ASR.
- Vocabulary is tenant-scoped.
- Corrected transcript text improves downstream AI quality without hiding the original raw transcript.

### Upstream Dependencies
- **M1 Capture & Transcription:** completed ASR outputs.
- **M2 Vocabulary Registry:** tenant-specific custom vocabulary from `vocabulary_corrections`.

### Downstream Consumers
- **M10 Data & Compliance:** Revenue Graph context building.
- **M2 features:** AI Call Reviewer, AI Topic Tagger, AI Smart Tracker.
- **M3 AI Summaries & GenAI:** benefits from cleaner transcript text.

---

## 4. Users and Triggers

### Primary Users
- RevOps or admins configuring vocabulary correction rules for their tenant.
- Reps and managers reading improved transcripts.
- AI pipelines consuming corrected text downstream.

### Trigger Types
- New transcript produced by ASR.
- New vocabulary rules added or changed.
- Scheduled or manual reprocessing of older transcripts.

### Entry Points
- API: `POST /api/v1/m02-conversation-intelligence/vocabulary` creates vocabulary correction rules.
- API: `GET /api/v1/m02-conversation-intelligence/vocabulary` lists vocabulary correction rules.
- Internal correction job triggered immediately after raw transcription.

---

## 5. Functional Flow

### Happy Path
1. M1 receives completed ASR output from Whisper or AssemblyAI fallback.
2. The raw transcript is saved in `m01_capture_transcription.transcripts`.
3. M2 loads active tenant vocabulary correction rules from `m02_conversation_intelligence.vocabulary_corrections`.
4. The correction engine applies mis-transcription mapping rules to the transcript text.
5. Each applied correction is logged in `m02_conversation_intelligence.transcript_corrections` for auditing.
6. The corrected transcript is saved in the `corrected_text` field in `m01_capture_transcription.transcripts`, incrementing `correction_version`.
7. Downstream modules consume the corrected transcript.

---

## 6. Inputs and Outputs

### Inputs
- `tenantId` (UUID)
- `transcriptId` (UUID)
- Raw transcript text and speaker segments.
- Active vocabulary rules from `vocabulary_corrections`.

### Outputs
- Corrected transcript text.
- Correction audit records in `transcript_corrections`.
- Transcript version metadata.

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `vocabulary_corrections` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `vocabId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `incorrect_term` (VARCHAR) -> mapped to `incorrectTerm`
- `correct_term` (VARCHAR) -> mapped to `correctTerm`
- `language` (VARCHAR)
- `is_active` (BOOLEAN) -> mapped to `isActive`

### `transcript_corrections` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `correctionId`
- `transcript_id` (UUID, Indexed) -> mapped to `transcriptId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `original_term` (VARCHAR) -> mapped to `originalTerm`
- `corrected_term` (VARCHAR) -> mapped to `correctedTerm`
- `applied_at` (TIMESTAMP) -> mapped to `appliedAt`

### Transcription Table Versioning Extension (M1 Owned)
- `raw_text` (TEXT, original Whisper output)
- `corrected_text` (TEXT, current display-ready version)
- `correction_version` (INTEGER, defaults to 0)
- `correction_status` (VARCHAR, e.g. `not_applied`, `completed`, `failed`)
- `correction_updated_at` (TIMESTAMP)

---

## 8. AI and Rule Processing

- **Task:** Vocabulary correction.
- **Processing Mode:** Targeted exact-token or phrase replacement mapping.
- **Precedence Rule:** Longer phrase matches are applied before shorter ones to avoid partial conflicts.

---

## 16. Appendix: Mis-transcription Mapping Rules

```typescript
export interface VocabularyRule {
  vocabId: string;
  incorrectTerm: string;
  correctTerm: string;
  language: string;
  isActive: boolean;
}

export function applyVocabularyCorrections(
  rawText: string,
  rules: VocabularyRule[]
): { correctedText: string; appliedCount: number } {
  let correctedText = rawText;
  let appliedCount = 0;

  // Sort rules: longer incorrectTerm first to avoid partial replacement conflicts
  const sortedRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.incorrectTerm.length - a.incorrectTerm.length);

  for (const rule of sortedRules) {
    const regex = new RegExp(`\\b${rule.incorrectTerm}\\b`, 'gi');
    if (regex.test(correctedText)) {
      correctedText = correctedText.replace(regex, rule.correctTerm);
      appliedCount++;
    }
  }

  return { correctedText, appliedCount };
}
```