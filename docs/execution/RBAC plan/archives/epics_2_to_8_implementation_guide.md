# Epic 2-8: Advanced Smart Trackers & Topic Management

This implementation plan outlines the architecture and tasks required to upgrade the Conversation Intelligence module to support robust AI Smart Trackers, detailed Admin Panels, and cross-surface consistency (Epics 2 through 8).

## User Review Required
> [!WARNING]
> **Database Schema Changes**: This plan requires modifying `M02Tracker` in `schema.prisma` to support Epic 6 (Timing and Scope) and Epic 7 (Status). We will need to run a Prisma migration. Please confirm if modifying the DB schema is acceptable.

## Open Questions
> [!IMPORTANT]
> 1. **Retroactive Tagging (Epic 5 & 8)**: Should retroactive tagging actually re-run the LLM on historical transcripts, or just do a fast regex/keyword scan on the stored transcripts? (A keyword scan is much cheaper and faster).
> 2. **Navigation**: Should the new Tracker List (Epic 7) and Tracker Add/Edit (Epic 6) pages be rendered as modal overlays like `ManageTopicsModal`, or should they live on a completely separate `/settings` route?

---

## Proposed Changes

### 1. Database Layer (`schema.prisma`)
The existing schema needs upgrades to support the new metadata.

#### [MODIFY] `schema.prisma`
Add new columns to `M02Tracker`:
```prisma
model M02Tracker {
  // ... existing fields
  isActive        Boolean  @default(true) @map("is_active")
  speakerScope    String   @default("ANYONE") @map("speaker_scope") // ANYONE, REP, PROSPECT
  timingCondition String   @default("ANYTIME") @map("timing_condition") // ANYTIME, FIRST_N, LAST_N
  timingMinutes   Int?     @map("timing_minutes")
}
```
*Note: `M02TopicModel` stores topics as a `Json` column. We will enforce a TypeScript interface for the JSON to include `color`, `speakerScope`, `callTypes`, `linkedTrackerId`, and `keywords` (Epic 4 & 5).*

---

### 2. Backend Layer
We need new endpoints to handle the Admin UI actions and the cross-sync logic.

#### [MODIFY] `topic.repository.ts` & `m02.controller.ts`
- **Tracker CRUD**: Implement `GET`, `POST`, `PUT`, `DELETE` for Trackers to support Epic 6 & 7.
- **Cross-Surface Sync (Epic 8)**: In the `saveTopic` logic, if a `linkedTrackerId` is provided and keywords are added, automatically append those keywords to the associated `M02Tracker` record.
- **Retroactive Tagging Trigger**: Implement an endpoint `/api/v1/m02-conversation-intelligence/trackers/retroactive-sync` that performs a regex scan on all existing `M02ConversationIntelligenceRecord` transcripts for the new keywords.

---

### 3. Frontend Layer - Admin Panels (Epics 4, 5, 6, 7)

#### [MODIFY] `ConversationLibraryView.tsx` (or new Admin Component)
- **Topic Admin Panel (Epic 4 & 5)**: 
  - Redesign `ManageTopicsModal` into a split 2-panel layout.
  - **Left Panel**: Form inputs for Name, Description, Color Swatches, Scope dropdown, and Call Type pill buttons.
  - **Right Panel**: Keyword pill manager (`+` button, removable `x` tags), Smart Tracker linking dropdown, and Active/Retroactive toggle switches.
- **Tracker Admin Panel (Epic 6 & 7)**:
  - Build a new `TrackerSettingsList` view showing a data table of Trackers, Status, Scope, and Keywords.
  - Build a `TrackerEditModal` for Epic 6 with the Timing (First N / Last N minutes) and Speaker scope configurations.

---

### 4. Frontend Layer - User Interfaces (Epics 2 & 3)

#### [MODIFY] `ConversationLibraryView.tsx`
- **Search Filters (Epic 2)**: 
  - Replace the native `<select>` Tracker dropdown with a custom Multi-Select component.
  - Render selected trackers as Chip components below the input.
  - Implement a Hover Tooltip for each chip displaying the Name, Description, Keywords, and Scope.

#### [MODIFY] `TranscriptDetailModal.tsx`
- **Call Details Output (Epic 3)**:
  - Add a new visual section below the AI Summary for "Tracker Results".
  - Calculate frequency counts (e.g., "Mentioned 3 times") by running a regex match of the Tracker's keywords against the raw `transcript` text.
  - Render empty states securely if no trackers were triggered.
