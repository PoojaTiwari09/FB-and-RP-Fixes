# Theme Spotter API Integration Analysis

This document provides a comprehensive review of the API contracts between the frontend (`themeSpotterService.ts`) and the backend (`ThemeSpotterController`) for the Theme Spotter feature, outlining exactly what is expected and what changes are required for smooth functionality.

## API Contract Matrix

Here is the breakdown of every endpoint the frontend requests, what it expects to receive, and the current backend status.

| Frontend Call | Endpoint Requested | Method | Expected Payload / Response | Backend Status |
|---|---|---|---|---|
| `fetchThemes` | `/api/theme-spotter/themes` | `GET` | Array of Theme objects | **✅ Exact Match** |
| `fetchThemeById` | `/api/theme-spotter/themes/:id` | `GET` | Single Theme object | **✅ Exact Match** |
| `fetchThemeTrend` | `/api/theme-spotter/themes/:id/trend` | `GET` | Array: `[{ label, value }]` | **✅ Exact Match** |
| `fetchThemeRepBreakdown` | `/api/theme-spotter/themes/:id/rep-breakdown`| `GET` | Array: `[{ id, name, initials, count }]` | **✅ Exact Match** |
| `fetchThemeStageBreakdown`| `/api/theme-spotter/themes/:id/stage-breakdown`| `GET` | Array: `[{ stage, count, percentage }]` | **✅ Exact Match** |
| `fetchThemeQuotes` | `/api/theme-spotter/themes/:id/quotes` | `GET` | Array: `[{ id, quote, company, callName, timestamp }]` | **✅ Exact Match** |
| `submitThemeAnalysis` | `/api/v1/m02-conversation-intelligence/theme-analyses` | `POST` | Req: `{ businessQuestion, filters }`<br/>Res: `{ success, analysisId, status, message }` | **✅ Exact Match** |
| `getThemeAnalysis` | `/api/v1/m02-conversation-intelligence/theme-analyses/:id`| `GET` | Res: `{ status, themes: [...] }` | **✅ Exact Match** |
| `fetchThemeCalls` | `/api/theme-spotter/themes/:id/calls` | `GET` | Array of Call objects | **❌ Missing in Backend** |
| `fetchCallDetails` | `/api/theme-spotter/calls/:callId` | `GET` | Single Call object | **❌ Missing in Backend** |
| `fetchCallSummary` | `/api/theme-spotter/calls/:callId/summary` | `GET` | Call summary object | **❌ Missing in Backend** |
| `fetchCallTranscript` | `/api/theme-spotter/calls/:callId/transcript` | `GET` | Array of transcript messages | **❌ Missing in Backend** |
| `fetchCallScorecard` | `/api/theme-spotter/calls/:callId/scorecard` | `GET` | Call scorecard object | **❌ Missing in Backend** |
| `fetchCallAudio` | `/api/theme-spotter/calls/:callId/audio` | `GET` | `{ audioUrl: string }` | **❌ Missing in Backend** |
| `exportThemeSpotter` | `/api/theme-spotter/export` | `POST` | Req: `{ view, activeThemeId, activeCallId }`<br/>Res: `{ success: true }` | **❌ Missing in Backend** |

---

## Required Backend Changes

To achieve smooth functionality without the frontend having to "catch" network errors and fallback to local mock files, the following exact changes must be made to the **backend**:

### 1. Update the Data Source in `ThemeSpotterController`
The backend currently hardcodes `mockData` at the top of the controller, but this object lacks the `"calls"` property completely. 
- **Change Required:** We need to copy the `"calls"` JSON object from the frontend's `mocks/data.json` into the `mockData` object inside `theme-spotter.controller.ts`.
- **Change Required:** We need to add the `callIdsForTheme` mapping to the backend so it knows which calls belong to which theme (e.g., `theme_001` has `call_001`, `call_002`, etc.).

### 2. Add 7 Missing Controller Methods
We must add the following endpoints to `theme-spotter.controller.ts`:

1. **`@Get('api/theme-spotter/themes/:id/calls')`**
   - Returns an array of call objects by filtering the newly added `mockData.calls` based on the `callIdsForTheme` mapping.

2. **`@Get('api/theme-spotter/calls/:callId')`**
   - Returns `mockData.calls[callId]`. Throws a `NotFoundException` if it doesn't exist.

3. **`@Get('api/theme-spotter/calls/:callId/summary')`**
   - Returns `mockData.calls[callId].summary`.

4. **`@Get('api/theme-spotter/calls/:callId/transcript')`**
   - Returns `mockData.calls[callId].transcript`.

5. **`@Get('api/theme-spotter/calls/:callId/scorecard')`**
   - Returns `mockData.calls[callId].scorecard`.

6. **`@Get('api/theme-spotter/calls/:callId/audio')`**
   - Returns `{ audioUrl: mockData.calls[callId].audioUrl || '' }`.

7. **`@Post('api/theme-spotter/export')`**
   - Accepts a generic body (`@Body() body: any`).
   - Returns `{ success: true, message: 'Export successful' }`.

## Conclusion
The payloads and data contract structures are fully aligned. The **only mismatch** is that 7 endpoints are simply unimplemented on the backend side, causing the frontend to rely on its local fallback mechanisms. Implementing these routes using the provided mock JSON structures will fix all integration issues.
