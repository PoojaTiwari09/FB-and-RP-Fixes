# Training Module — Frontend Audit Report
*(Updated: all fixes applied, cross-referenced against `Fignma_Coaching-AI-Trainer.txt` backend spec)*

## Summary

The Training module has been audited and **12 of 16 issues have been resolved**. Issue 2 was intentional (removed). Issues 3 and 9 are deferred. Issue 8 is partially resolved (route part removed, `lastSessionId` concern remains). All fixes maintain mock/fallback data for frontend demo purposes.

---

## Issue 1 — ✅ RESOLVED: Deleted `TrainingRepView.tsx`
**Category:** Direct hardcoding — no service call  
**Severity:** 🔴 High → ✅ Resolved

### What was done
`TrainingRepView.tsx` was a dead hardcoded stub that was never imported anywhere. It was fully superseded by `app/(dashboard)/training/page.tsx` which correctly calls `fetchTrainingDashboard()`. **Deleted the file.**

---

## Issue 2 — ⏭️ REMOVED (Intentional)
**Category:** Mock not structured as fallback  
**Status:** Not an issue — `ENV.USE_MOCK_DATA` hard gate is intentional while backend is not yet live. Will be addressed when backend is available.

---

## Issue 3 — ⏳ DEFERRED: `AIAvatarPanel` User Label
**Category:** Direct hardcoding  
**Severity:** 🟢 Low

### File
[AIAvatarPanel.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Session/AIAvatarPanel.tsx) — line 49

### Status
The Figma spec labels this `"You (Sales Rep)"` as a display label, which matches the current hardcoded string. Low priority — can be parameterized when auth context provides the real username.

---

## Issue 4 — ✅ RESOLVED: `EvaluationSummary` Dynamic Subtitle
**Category:** Direct hardcoding  
**Severity:** 🟡 Medium → ✅ Resolved

### What was done
- `EvaluationSummary` now accepts `trainingTitle` prop
- Subtitle reads `"Master these questions to improve your {trainingTitle} performance"` instead of hardcoded "discovery call"
- Prop threaded through `ResultsTabSwitcher` → `EvaluationSummary`
- Results page passes `data.trainingTitle`

### Files changed
- [EvaluationSummary.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Results/EvaluationSummary.tsx)
- [ResultsTabSwitcher.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Results/ResultsTabSwitcher.tsx)
- [results/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/[trainingId]/sessions/[sessionId]/results/page.tsx)

---

## Issue 5 — ✅ RESOLVED: `CoachingPlaybook` Dynamic Subtitle
**Category:** Direct hardcoding  
**Severity:** 🟡 Medium → ✅ Resolved

### What was done
- `CoachingPlaybook` now accepts `trainingTitle` prop
- Subtitle reads `"Master these questions to improve your {trainingTitle} performance"` instead of hardcoded "discovery call"
- Setup page passes `data.trainingTitle`

### Files changed
- [CoachingPlaybook.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Setup/CoachingPlaybook.tsx)
- [[trainingId]/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/[trainingId]/page.tsx)

---

## Issue 6 — ✅ RESOLVED: Dashboard Dynamic Subtitle
**Category:** Direct hardcoding  
**Severity:** 🟢 Low → ✅ Resolved

### What was done
Dashboard subtitle changed from static `"My Trainings"` to dynamic `"{total} trainings · {inProgress} in progress"` computed from live data.

### Files changed
- [training/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/page.tsx)

---

## Issue 7 — ✅ RESOLVED: `connectToSession` WebSocket Wired
**Category:** Missing endpoint wiring  
**Severity:** 🟡 Medium → ✅ Resolved

### What was done
- `connectToSession()` now called in `useTrainingSession.ts` mount `useEffect` with proper cleanup (`disconnect()` on unmount)
- Service stub documented with expected WebSocket contract (events: `ai_reply`, `scorecard_update`, `session_ended`)
- Dev-mode console info when WebSocket not yet implemented

### Files changed
- [useTrainingSession.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/hooks/useTrainingSession.ts)
- [trainingSession.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSession.service.ts)

---

## Issue 8 — ⚠️ PARTIAL: `lastSessionId` Not in Backend Spec
**Category:** Inconsistency with expected API contract  
**Severity:** 🟡 Medium

### Remaining concern
The spec's `GET /api/trainings` response **does not include `lastSessionId`**. The "Review" link in `TrainingTableRow.tsx` currently depends on `lastSessionId` to build the results URL (`/training/:id/sessions/:lastSessionId/results`).

This field must either be:
1. Confirmed with the backend team and added to the spec
2. Replaced with a different navigation pattern (e.g., `/training/:id/results/latest` where the backend resolves "latest")

### Files affected
- [trainingDashboard.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingDashboard.types.ts) — `lastSessionId` field
- `TrainingTableRow.tsx` — uses `lastSessionId` for "Review" href

---

## Issue 9 — ⏳ DEFERRED: Voice Selection UI Missing
**Category:** Missing endpoint wiring + missing UI  
**Severity:** 🔴 High

### Status
Voice selection UI (2x2 radio grid), `voices[]` type/mock/adapter, and `selectedVoiceId` wiring to `createTrainingSession` are not yet implemented. This is a full feature build that requires a new component and state management.

### What's needed
1. Add `VoiceOption` type and `voices[]` to `TrainingSetupPage`
2. Add mock data for 4 voice options
3. Build `VoiceSelector` component (2x2 radio grid)
4. Wire selected voice state to `TrainingSetupFooter` → `createTrainingSession(trainingId, selectedVoiceId)`

---

## Issue 10 — ✅ RESOLVED: `backgroundForTrainee` Added to Meeting Context
**Category:** Inconsistency with expected API contract  
**Severity:** 🟡 Medium → ✅ Resolved

### What was done
- Added `backgroundForTrainee: string` to `MeetingContext` type
- Updated setup and session mocks with realistic background text
- Updated `adaptTrainingSetup` and `adaptSessionContext` adapters to extract the field (handles camelCase and snake_case)
- Updated `BackgroundTab.tsx` to render the background under Meeting Context when present
- Also mapped spec field names in adapters: `motivationsAndPriorities`→`motivations`, `meetingScenario`→`scenario`, `repObjective`→`objective`, `contactPersona.title`→`jobTitle`

### Files changed
- [trainingSession.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingSession.types.ts)
- [trainingSetup.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingSetup.types.ts)
- [trainingSetup.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingSetup.mock.ts)
- [trainingSession.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingSession.mock.ts)
- [trainingSetup.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSetup.service.ts)
- [trainingSession.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSession.service.ts)
- [BackgroundTab.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Session/BackgroundTab.tsx)

---

## Issue 11 — ✅ RESOLVED: `whyItMatters` + Boolean Tag Mapping
**Category:** Missing endpoint wiring  
**Severity:** 🟡 Medium → ✅ Resolved

### What was done
- Added `whyItMatters: string | null` to `PlaybookQuestion` in shared types
- All mocks updated with realistic `whyItMatters` text (null for questions where not applicable)
- Adapters now handle spec's boolean fields (`highImpact`, `missedInLastAttempt`) by converting to `tags[]` array; also handles if backend already sends `tags[]` directly
- `PlaybookQuestionItem.tsx` renders an expandable `<details>` section for "Why this question matters" when the field is non-null

### Files changed
- [shared.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/shared/types/shared.types.ts)
- [trainingSetup.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingSetup.mock.ts)
- [trainingSession.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingSession.mock.ts)
- [trainingSetup.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSetup.service.ts)
- [trainingSession.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSession.service.ts)
- [PlaybookQuestionItem.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Setup/PlaybookQuestionItem.tsx)

---

## Issue 12 — ✅ RESOLVED: Session Resume Restores Timer + Transcript
**Category:** Inconsistency with expected API contract  
**Severity:** 🔴 High → ✅ Resolved

### What was done
- Created `SessionData` type containing full session state: `context`, `sessionId`, `status`, `elapsedSeconds`, `messageCount`, `selectedVoiceId`, `messages[]`
- Replaced `fetchSessionContext()` with `fetchSessionData()` that returns `SessionData` (backward-compat wrapper kept)
- Adapter maps spec's `role`→`sender` and `timestamp`→`timestampSeconds` for restored messages
- `useTrainingSession` now restores transcript, timer, and paused state from `SessionData` on mount
- Mock fallback returns empty messages + zero elapsed time (correct for new sessions in demo mode)

### Files changed
- [trainingSession.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingSession.types.ts)
- [trainingSession.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSession.service.ts)
- [useTrainingSession.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/hooks/useTrainingSession.ts)

---

## Issue 13 — ✅ RESOLVED: POST Messages Contract Fixed
**Category:** Inconsistency with expected API contract  
**Severity:** 🔴 High → ✅ Resolved

### What was done
- Added `InputType = 'text' | 'voice'` type
- `sendSessionMessage()` now accepts `inputType` parameter and includes it in the request body
- Created `SendMessageResponse` type with `aiReplyText`, `aiReplyId`, `aiReplyTimestamp`, `audioUrl`, `scorecardUpdate`
- Adapter maps spec response shape: `aiResponse.{text, id, timestamp, audioUrl}` + `scorecardUpdate`
- `useTrainingSession.sendMessage()` now uses `SendMessageResponse`:
  - Constructs AI message with proper ID and timestamp from response
  - Applies `scorecardUpdate` to `sectionStatuses` state (feeds ScorecardTab)
  - Attempts audio playback via `new Audio(audioUrl).play()` when URL provided
- Mock fallback returns proper `SendMessageResponse` with empty audioUrl and null scorecardUpdate

### Files changed
- [trainingSession.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingSession.types.ts)
- [trainingSession.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingSession.service.ts)
- [useTrainingSession.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/hooks/useTrainingSession.ts)

---

## Issue 14 — ✅ RESOLVED: `performanceBreakdown[]` Added
**Category:** Missing endpoint wiring  
**Severity:** 🔴 High → ✅ Resolved

### What was done
- Added `PerformanceBreakdownItem` type with `category`, `score`, `maxScore`, `percentage`, `description`, `strengths[]`, `areasForImprovement[]`
- Added `performanceBreakdown: PerformanceBreakdownItem[]` to `TrainingResultsPage`
- Mock includes 4 realistic breakdown items (Opening & Rapport, Discovery, Objection Handling, Closing & Next Steps)
- Adapter extracts from `performanceBreakdown` or `performance_breakdown` fields
- Created new `PerformanceBreakdown.tsx` component with collapsible cards showing progress bar, score, description, strengths (green), and areas for improvement (amber)
- Wired through `ResultsTabSwitcher` → `EvaluationSummary` → `PerformanceBreakdown`

### Files changed
- [trainingResults.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingResults.types.ts)
- [trainingResults.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingResults.mock.ts)
- [trainingResults.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingResults.service.ts)
- [PerformanceBreakdown.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Results/PerformanceBreakdown.tsx) — **NEW**
- [EvaluationSummary.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Results/EvaluationSummary.tsx)
- [ResultsTabSwitcher.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Results/ResultsTabSwitcher.tsx)
- [results/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/[trainingId]/sessions/[sessionId]/results/page.tsx)

---

## Issue 15 — ✅ RESOLVED: Results Field Names Aligned with Spec
**Category:** Inconsistency with expected API contract  
**Severity:** 🔴 High → ✅ Resolved

### What was done
The adapter now maps all spec field names to frontend field names:

| Spec field | Frontend field | Mapping |
|---|---|---|
| `overallRating` ("Good") | `performanceTier` + `tierLabel` | `mapPerformanceTier()` derives tier slug from label |
| `overallDescription` | `summaryText` | Direct mapping with fallback |
| `highlightBadges[].type: 'warning'` | `performanceTags[].type: 'warning'` | Type changed from `'negative'` to `'warning'` in types + mock |
| `coachingPlaybook[].categoryName` | `scoredSections[].title` | Adapter checks `categoryName` first |
| `coachingPlaybook[].rating` | `scoredSections[].status` | Adapter checks `rating` first |
| `transcript[].role` | `transcript[].sender` | Adapter maps `role`→`sender` |
| `transcript[].speakerLabel` | `transcript[].senderLabel` | Adapter maps `speakerLabel`→`senderLabel` |
| `transcript[].timestamp` | `transcript[].timestampSeconds` | Adapter maps `timestamp`→`timestampSeconds` |
| `transcript[].quality: 'good'/'could-improve'` | `quality: 'good-example'/'missed-opportunity'` | `mapQuality()` converts values |

### Files changed
- [trainingResults.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingResults.types.ts)
- [trainingResults.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingResults.mock.ts)
- [trainingResults.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingResults.service.ts)

---

## Issue 16 — ✅ RESOLVED: ScorecardTab Live Status
**Category:** Missing endpoint wiring  
**Severity:** 🟡 Medium → ✅ Resolved

### What was done
- Added `ScorecardSectionStatus = 'not-started' | 'in-progress' | 'completed'` type
- `useTrainingSession` now manages `sectionStatuses: Record<string, ScorecardSectionStatus>` state, initialized as `'not-started'` for all sections
- When `sendSessionMessage()` returns a `scorecardUpdate`, statuses are merged into state
- `ScorecardTab` replaced hardcoded "Pending" with dynamic status rendering:
  - **Not Started** — gray pill
  - **In Progress** — blue pill
  - **Completed** — green pill
- Props threaded: `useTrainingSession` → session page → `SessionSidebar` → `ScorecardTab`

### Files changed
- [trainingSession.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingSession.types.ts)
- [useTrainingSession.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/hooks/useTrainingSession.ts)
- [ScorecardTab.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Session/ScorecardTab.tsx)
- [SessionSidebar.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Session/SessionSidebar.tsx)
- [sessions/[sessionId]/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/[trainingId]/sessions/[sessionId]/page.tsx)

---

## Status Summary

| # | Issue | Status |
|---|-------|--------|
| 1 | `TrainingRepView.tsx` dead stub | ✅ Resolved — deleted |
| 2 | `USE_MOCK_DATA` hard gate | ⏭️ Removed — intentional |
| 3 | `AIAvatarPanel` user label | ⏳ Deferred — matches spec |
| 4 | `EvaluationSummary` hardcoded subtitle | ✅ Resolved |
| 5 | `CoachingPlaybook` hardcoded subtitle | ✅ Resolved |
| 6 | Dashboard static subtitle | ✅ Resolved |
| 7 | WebSocket stub never called | ✅ Resolved |
| 8 | `lastSessionId` not in spec | ⚠️ Needs backend confirmation |
| 9 | Voice selection UI missing | ⏳ Deferred — full feature build |
| 10 | `backgroundForTrainee` missing | ✅ Resolved |
| 11 | `whyItMatters` + boolean tags | ✅ Resolved |
| 12 | Session resume — timer/transcript lost | ✅ Resolved |
| 13 | POST messages contract wrong | ✅ Resolved |
| 14 | `performanceBreakdown[]` missing | ✅ Resolved |
| 15 | Results field name mismatches | ✅ Resolved |
| 16 | ScorecardTab hardcoded "Pending" | ✅ Resolved |

## What's Correct ✅

- All endpoint URLs match the spec
- All adapters handle both camelCase and snake_case field names
- All adapters map spec field names to frontend field names
- All mock fallbacks are preserved for frontend demo
- TypeScript compiles cleanly with zero errors
- All components consume data only via props
