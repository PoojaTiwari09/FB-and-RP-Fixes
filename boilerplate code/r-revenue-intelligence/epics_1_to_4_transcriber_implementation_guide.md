# Epic 1-4: AI Transcriber & Vocabulary Management

These use cases **are currently NOT solved in the codebase**. While the Prisma database has starter models (`M02VocabularyCorrection` and `M02TranscriptCorrection`), there is no backend CRUD logic for them, the Admin UI does not exist, and the `TranscriptDetailModal` currently just renders raw unformatted text without timestamps, underlines, or tooltips.

This implementation plan outlines the architecture and tasks required to upgrade the system to meet these Epics.

## User Review Required
> [!WARNING]
> **Transcript Data Model**: Currently, `conversation.transcript` is a raw text string in the frontend. Epic 1 requires speaker labels, timestamps, and specific inline term replacements. We will need to either parse the raw string dynamically in the frontend (if it has a predictable format like `[00:12] REP: ...`), or fetch an array of utterance objects from the backend. Please confirm if parsing the raw string via regex is acceptable for now.

## Open Questions
> [!IMPORTANT]
> 1. **Search Snippet Generation (Epic 2)**: Do you want the backend to generate the highlight snippet (e.g., extracting the sentence around the keyword), or should the frontend fetch the full transcript and extract the snippet dynamically on the search results page?
> 2. **Vocabulary Categories (Epic 4)**: The requested categories are "Product, Competitor, Acronym, Industry term, Custom". Do these need to be hardcoded enums, or dynamic tags? (Assuming hardcoded for now).

---

## Proposed Changes

### 1. Database Layer (`schema.prisma`)
The existing schema needs minor adjustments to perfectly align with the new metadata fields.

#### [MODIFY] `schema.prisma`
Update `M02VocabularyCorrection`:
```prisma
model M02VocabularyCorrection {
  // ... existing fields
  correctTerm    String   @map("correct_term") @db.VarChar(255) // Field 1
  category       String   @default("Custom") @db.VarChar(50) // Field 2
  mispronunciations String[] @default([]) // Field 3
  variations     String[] @default([]) // Field 4
  // ...
}
```

---

### 2. Backend Layer
We need endpoints to handle the Admin UI actions and supply the transcript metadata.

#### [MODIFY] `m02.controller.ts` & Repository
- **Vocabulary CRUD**: Implement `GET`, `POST`, `PUT`, `DELETE` for `M02VocabularyCorrection` to support Epics 3 & 4.
- **KPI Endpoint**: Implement `GET /api/v1/m02-conversation-intelligence/transcriber/stats` to calculate:
  - `% Transcripts enhanced`
  - `Terms in vocabulary` count
  - `Corrections this month` count
- **Enhanced Search**: Update `getConversations` search logic to check against `M02VocabularyCorrection` lists. If a user searches for "Gong", it should also match "gawng" or whatever mispronunciations are linked to "Gong".

---

### 3. Frontend Layer - Admin Panels (Epic 3 & 4)

#### [NEW] `AITranscriberAdminView.tsx`
- **Quality Overview (Epic 3)**: 
  - Build the dashboard with the 3 KPI metric cards.
  - Render the "Recently added terms" data table with distinct color-coded category badges.
- **Vocabulary Modal (Epic 4)**:
  - Build the `AddTermModal` overlay.
  - Include validation for required fields (Correct Term, Category).
  - Map the Mispronunciations and Variations inputs to string arrays.

---

### 4. Frontend Layer - User Interfaces (Epic 1 & 2)

#### [MODIFY] `ConversationLibraryView.tsx`
- **AI-Enhanced Search (Epic 2)**: 
  - Update the `SearchResult` rendering loop to parse the `snippet` and inject Highlight Chips around matched corrected terms and AI-recognised product names.

#### [MODIFY] `TranscriptDetailModal.tsx`
- **AI-Enhanced Transcript View (Epic 1)**:
  - Refactor the UI to use the exact three tabs: `Summary`, `Transcript` (default), `Scorecard`.
  - Add the "Transcript enhanced by AI Transcriber" green dot badge.
  - Implement a `Search transcript...` input that filters the visible lines.
  - **Dynamic Rendering Engine**: Build a parser that splits the raw transcript into lines, detects `SPEAKER + TIMESTAMP`, and formats them distinctly.
  - **Inline Replacements**: During parsing, use a regex map built from the active vocabulary to wrap corrected terms in a `<span class="underline ...">` with a `title` or custom tooltip component showing `"Corrected from: {original}"`.
  - Add the footer empty state / note.

---

## Verification Plan

### Automated Tests
1. **Vocabulary Resolution**: Verify that searching for a mispronunciation string in the frontend filter successfully triggers the backend to return calls containing the corrected canonical term.

### Manual Verification
1. Open the **AI Transcriber Dashboard** and verify KPI metrics load correctly.
2. Add a new Vocabulary Term via the modal, ensuring it immediately populates the recent list and bumps the KPI count.
3. Open a Transcript Detail modal, verify the new tab layout, the green badge, and hover over an underlined term to verify the tooltip renders correctly.
