# Doc #11e — TDD: AI Translator

## 1. Document Control

- **Document Title:** Technical Design Document — AI Translator
- **Feature Name:** AI Translator
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Tech Lead / Conversation Intelligence Squad
- **Reviewers:** AI Lead, Backend Lead, Frontend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

AI Translator converts conversation content and AI-generated outputs into a preferred language so multilingual users can consume the same revenue intelligence without language friction. The feature supports transcripts as well as downstream outputs such as summaries, briefs, and notes.

This feature belongs in the M2 module because M2 is the central system for understanding customer conversations and generating structured signals. In the architecture, translation is treated as part of the Understand-stage conversation intelligence pipeline.

### Business Problem
- Sales, RevOps, and leadership teams may work across different languages inside the same workspace.
- Raw transcripts may be captured in one language while managers want insights in another.
- Summaries and briefs lose adoption if users cannot read them comfortably in their localized language.

### What the Feature Does
- Detects the source language of transcript content.
- Selects the target language using preference hierarchy across workspace, team, and user levels.
- Produces translated versions of transcripts and AI-generated outputs (summaries, briefs, and notes).
- Preserves original content while storing translated text in a governed, tenant-safe way.

---

## 3. Scope

### In Scope
- Source language detection for transcript or text input.
- Target language resolution using `translation_preferences`.
- Translation of transcripts.
- Translation of AI-generated outputs including summaries, briefs, and notes.
- Fallback behavior and quality warning signals when translation quality is weak or uncertain.

### Out of Scope
- Raw ASR transcription (handled by M1 Capture & Transcription).
- Vocabulary correction (handled by AI Transcriber vocabulary configuration).
- Semantic summarization logic (handled by M3 AI Summaries & GenAI).
- Email generation localization logic.

### Assumptions
- Original source content remains the system-of-record text.
- Translation is an AI-processing step, not a manual editing replacement.
- Translation preferences are tenant-scoped and may exist at workspace, team, or user level.
- Translation runs asynchronously through approved internal AI services.

### Upstream Dependencies
- **M1 Capture & Transcription:** Transcript text.
- **M10 Data & Compliance:** Linked conversation context.
- **M3 AI Summaries & GenAI:** AI-generated summaries and briefs.
- **M2 Vocabulary Registry:** Vocabulary configurations from `vocabulary_corrections`.

### Downstream Consumers
- Multilingual conversation views.
- Summary and brief surfaces needing localized reading outputs.

---

## 4. Users and Triggers

### Primary Users
- Sales managers reviewing calls in a language different from the original conversation.
- RevOps and leadership users consuming translated summaries and briefs.
- Global teams working in multilingual accounts or regions.

### Trigger Types
- New transcript available for translation.
- User requests translated viewing of transcript content.
- New summary or brief becomes available.

### Entry Points
- Internal translation job triggered after transcript availability.
- Read API: `GET /api/v1/m02-conversation-intelligence/translations/:id` to fetch translated transcripts.
- Preference APIs: `GET /api/v1/m02-conversation-intelligence/translation-preferences`.

---

## 5. Functional Flow

### Happy Path
1. A transcript, summary, brief, or note becomes available.
2. The system determines the source language from metadata.
3. The system resolves the target language using preference hierarchy: user preference first, then team preference, then workspace default.
4. If source and target language are the same, the system skips translation and shows the original text.
5. If translation is required, M2 enqueues an async translation job.
6. The background worker calls the private AI endpoint `POST /internal/translate`.
7. The AI service returns translated text and quality metadata.
8. The translated output is stored as a language-specific derived artifact in `translated_texts`.
9. UI surfaces show translated content with original-language traceability.

---

## 6. Inputs and Outputs

### Inputs
- `tenantId` (UUID)
- Source text to translate.
- Language preference records from `translation_preferences`.

### Outputs
- Source and target language metadata.
- Translated text for the requested entity.
- Quality flags or warnings when translation confidence is weak.

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `translation_preferences` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `prefId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `team_id` (UUID, Optional, Indexed) -> mapped to `teamId`
- `user_id` (UUID, Optional, Indexed) -> mapped to `userId`
- `target_language` (VARCHAR) -> mapped to `targetLanguage`

### `translated_texts` Table (M2 Owned)
- `id` (UUID, Primary Key) -> mapped to `translationId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `entity_type` (VARCHAR) -> mapped to `entityType` (transcript, callsummary, dealbrief, accountbrief, note)
- `entity_id` (UUID, Indexed) -> mapped to `entityId`
- `source_language` (VARCHAR) -> mapped to `sourceLanguage`
- `target_language` (VARCHAR) -> mapped to `targetLanguage`
- `translated_text` (TEXT) -> mapped to `translatedText`
- `quality_status` (VARCHAR) -> mapped to `qualityStatus` (success, warning, fallback, failed)
- `warning_code` (VARCHAR, Optional) -> mapped to `warningCode` (low_confidence, source_uncertain, provider_fallback)
- `model_version` (VARCHAR, Optional) -> mapped to `modelVersion`
- `created_at` (TIMESTAMP) -> mapped to `createdAt`

---

## 8. AI Processing

- **Task:** Language detection and translation.
- **Internal AI Endpoint:** `POST /internal/translate`
- **Quality Model:** Cache translation results to avoid duplicate translation costs.

---

## 16. Appendix: Target Language Selection Hierarchy

```typescript
export interface TranslationPreference {
  prefId: string;
  tenantId: string;
  teamId: string | null;
  userId: string | null;
  targetLanguage: string;
}

export function resolveTargetLanguage(
  userId: string,
  teamId: string | null,
  preferences: TranslationPreference[],
  workspaceDefault: string = 'en'
): string {
  // 1. Check user preference
  const userPref = preferences.find((p) => p.userId === userId);
  if (userPref) {
    return userPref.targetLanguage;
  }

  // 2. Check team preference
  if (teamId) {
    const teamPref = preferences.find((p) => p.teamId === teamId && p.userId === null);
    if (teamPref) {
      return teamPref.targetLanguage;
    }
  }

  // 3. Check workspace default preference
  const workspacePref = preferences.find((p) => p.teamId === null && p.userId === null);
  if (workspacePref) {
    return workspacePref.targetLanguage;
  }

  return workspaceDefault;
}
```