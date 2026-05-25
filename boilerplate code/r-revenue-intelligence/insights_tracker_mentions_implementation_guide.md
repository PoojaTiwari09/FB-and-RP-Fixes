# Implementation Guide: Epic 1 - Insights (Tracker Mentions Panel)

## 1. Overview
The "Tracker Mentions" panel requires building a completely new sub-view under the currently non-existent "Insights" tab. The backend API (`getConversations`) already returns the necessary data (`topics` array on each conversation) which can be used to calculate tracker percentages locally, meaning no backend schema changes are required. However, the entire UI needs to be built from scratch.

## 2. Complexity Assessment
**Difficulty: Medium**
While the data already exists, the layout, navigation routing (Insights -> Team -> Trackers), calculation logic, and proportional horizontal bar UI all need to be constructed from scratch inside the React component.

## 3. Implementation Steps

### Step 3.1: State & Navigation Updates
1. **Extend Sidebar Logic:** 
   Update `ConversationLibraryView.tsx` to handle `activeTab === 'Insights'`.
   Add nested state `insightsTab` (e.g., `'Trackers'`, `'Topics'`).
2. **Main Content Switch:** 
   In the main `<main>` container, add a conditional render: 
   `{activeTab === 'Search' ? <SearchView /> : activeTab === 'Insights' ? <InsightsView /> : null}`

### Step 3.2: Data Calculation Logic
1. **Parse Corpus:**
   Fetch the full `corpus` of conversations.
   Count the total number of calls (`N = corpus.length`).
2. **Aggregate Trackers:**
   Iterate through all calls, extract `topics`, and maintain a hash map counting how many unique calls each tracker appeared in.
3. **Calculate Percentages:**
   Convert the counts to percentages `(count / N) * 100`.
   Find the maximum percentage value `maxPercent` to scale the horizontal bars accurately.
4. **Sorting:**
   Implement a descending sort function based on the calculated percentage.

### Step 3.3: Component Structure (InsightsView)
1. **Header Section:**
   - Title: "Insights"
   - Sub-navigation Tabs: `Team > Trackers`, `Team > Topics`. Use distinct icons (e.g., Target icon for Trackers).
   - Subtitle: `"Percentage of calls in which tracker terms or concepts were mentioned based on ${N} calls"`
2. **Table Layout:**
   - Define a 2-column grid or table: `Tracker Name` | `% of calls`.
   - Map over the aggregated tracker data.
3. **Row UI Components:**
   - **Name Cell:** `<span>{tracker.name} <Sparkles size={14}/></span>`
   - **Value Cell:** Render the text percentage `XX%`.
   - **Horizontal Bar:** Use a `<div>` with background color `var(--accent-purple)` and `width: ${(tracker.percent / maxPercent) * 100}%`.

### Step 3.4: Styling
- Add CSS classes to handle the scrollable list container.
- Ensure the horizontal bars have `transition: width 0.3s ease` for smooth loading.
- Add hover states for the table rows to match the platform's Cyberpunk/Dark UI aesthetics.
