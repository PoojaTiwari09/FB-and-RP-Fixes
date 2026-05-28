# Software Design Document (SDD)
## AI Theme Spotter — M2 Conversation Intelligence

| Field | Value |
|---|---|
| **Module** | M2 – Conversation Intelligence |
| **Feature** | AI Theme Spotter |
| **Platform** | Revenue Intelligence Portal |
| **Storage** | PostgreSQL (direct — no Prisma) |
| **AI Engine** | Groq LLM + Transcript Embeddings |
| **Async Processing** | BullMQ + Redis |
| **Status** | Design Phase |

---

## 1. Feature Overview

**AI Theme Spotter** is an AI-powered conversation analysis feature that automatically identifies recurring themes, topics, and patterns across large volumes of customer call transcripts and email threads.

Instead of reading individual calls, revenue teams ask a **business question** (e.g., "What are customers most concerned about?"), and the system groups all matching conversations into named themes — each backed by representative quotes, deal outcome data, and trend charts.

Theme Spotter helps revenue leaders:
- **Understand what is happening across all deals** — not just individual calls
- **Detect emerging risks and opportunities** from conversation patterns
- **Correlate themes to deal outcomes** (won/lost/stalled)
- **Act on insights immediately** through alerts and review workflows

---

## 2. Sidebar Integration

AI Theme Spotter appears as a **top-level sidebar item** in the Revenue Intelligence Portal — at the same level as AI Call Reviewer and AI Smart Tracker.

```
SIDEBAR
├── Home
├── Engage
├── Search
├── AI Call Reviewer
├── AI Smart Tracker
├── AI Theme Spotter      ← New main sidebar item
├── Company library
├── Deals
├── Coaching
├── Insights
└── Activity
```

- Clicking **AI Theme Spotter** opens its own dedicated dashboard page.
- It is **not** placed inside Search or any sub-menu.
- It is an independent primary navigation item.

---

## 3. Main Features To Implement

### 3.1 Theme Spotter Dashboard

The main landing page for AI Theme Spotter. Shows:
- Summary statistic cards (total themes, calls analyzed, new themes, alerts active)
- Theme card grid displaying all detected themes
- Global filters to scope analysis by date range, deal stage, team, or scope
- Access to theme analysis job creation

### 3.2 Theme Analysis Job Creation

Users define a **business question** and configure scope filters to create a theme analysis job.

| Field | Description |
|---|---|
| Business Question | Natural language question (e.g., "What do customers say about pricing?") |
| Date Range | Conversation date window to analyze |
| Deal Stage | Filter by pipeline stage (optional) |
| Scope | Calls, Emails, or Both |
| Team Filter | Filter by specific team or rep (optional) |

- On submission, the job is queued via **BullMQ + Redis** for async processing
- Job status is tracked: `PENDING → PROCESSING → COMPLETED → FAILED`
- On completion, detected themes appear in the dashboard

### 3.3 Theme Card Grid

Each detected theme is displayed as a card in the dashboard grid.

Each theme card shows:
- **Theme Name** (AI-generated label)
- **Summary** (1–2 sentence AI-generated description)
- **Call Count** — number of conversations mentioning this theme
- **Account Count** — number of unique accounts involved
- **Associated Revenue** — total pipeline value of deals in those conversations
- **Trend indicator** — rising / stable / declining
- **Detection Confidence** — percentage confidence from AI clustering

### 3.4 Summary Statistic Cards

Four top-level stats at the top of the dashboard:

| Card | What it shows |
|---|---|
| Total Themes | Count of all detected themes across all analyses |
| Calls Analyzed | Total conversation count processed |
| New Themes | Themes detected since last review |
| Active Alerts | Number of configured alerts currently active |

### 3.5 Global Filters

Filters applied across the entire dashboard view:
- **Date range picker** — scope conversations by time window
- **Deal stage filter** — e.g., Discovery, Proposal, Negotiation, Closed
- **Scope filter** — Calls / Emails / Both
- **Team / Rep filter** — narrow to a specific team or individual

Filters persist during the session and update all dashboard components reactively.

### 3.6 Theme Trend Analysis

Each theme has a trend chart showing how frequently it appeared over time.

- X-axis: time (days / weeks / months)
- Y-axis: occurrence count
- Trend label: Rising / Stable / Declining
- Useful to spot emerging patterns or fading concerns

### 3.7 Theme Deep Dive

Clicking a theme card opens the **Theme Deep Dive** panel, which shows:
- Full theme name and AI-generated summary
- All conversations where the theme was detected
- Representative quotes from those conversations
- Deal outcome correlation for conversations containing this theme
- Theme breakdown by team and deal stage

### 3.8 Representative Quotes

For each theme, the AI surfaces the most relevant quoted snippets from transcripts.

Each quote shows:
- The exact matched text from the transcript
- Source (call ID or email thread reference)
- Speaker side (Customer / Agent)
- Confidence score for the quote relevance

### 3.9 Deal Outcome Correlation

Shows how the theme correlates with deal results:

| Outcome | Count | % of Theme Mentions |
|---|---|---|
| Closed Won | — | — |
| Closed Lost | — | — |
| Stalled / At Risk | — | — |
| Open / In Progress | — | — |

This helps teams understand if a theme (e.g., "pricing concern") correlates with losing deals.

### 3.10 Theme Search & Sorting

On the dashboard:
- **Search bar** — filter themes by name or keyword in summary
- **Sort options** — by call count, confidence score, revenue impact, or date detected
- **Category filter** — filter by theme type if categorized

### 3.11 Export Options

Users can export theme results for reporting or sharing:
- Export individual theme details (CSV or JSON)
- Export full analysis results
- Export representative quotes

### 3.12 Alert Configuration

Users can configure alerts to be notified when a theme exceeds a threshold.

Alert configuration fields:
- **Theme** — which theme to monitor
- **Trigger condition** — e.g., "mention count > 10 in 7 days"
- **Notification channel** — in-app notification (email/webhook as future extension)
- **Active / Inactive** toggle

### 3.13 Alert Trigger Management

The **Alert Trigger Management** section shows:
- All configured alerts and their current status
- Last triggered timestamp
- Current trigger count vs. threshold
- Toggle to enable / disable each alert

### 3.14 New Theme Review Workflow

When AI detects a new theme not seen before, it enters a **Review Queue** before being added to the main dashboard.

Review queue shows:
- New theme name and AI summary
- Number of supporting conversations
- Confidence score from AI clustering
- Action buttons: **Accept** or **Reject**

### 3.15 Theme Accept / Reject Flow

| Action | Result |
|---|---|
| **Accept** | Theme is promoted to the main dashboard and becomes visible to all users |
| **Reject** | Theme is discarded and moved to Archived Themes |

Accepted themes can still be archived later manually.

### 3.16 Archived Themes

A separate view listing all rejected or manually archived themes. Archived themes:
- Are not shown in the main dashboard
- Retain all their detection data and quotes
- Can be **restored** (un-archived) if needed

### 3.17 Call Evidence View

Within Theme Deep Dive, each supporting conversation can be opened to see:
- Full transcript snippet where the theme was detected
- Highlighted matched segment
- Metadata: date, duration, deal stage, rep name
- Confidence score for this specific detection

### 3.18 Theme Detection Results

After an analysis job completes, the results section shows:
- Total themes detected
- Per-theme confidence breakdown
- Conversations grouped under each theme
- New vs. existing themes identified

### 3.19 Trend Charts

Visual charts in the dashboard showing:
- Theme frequency over time (line chart per theme)
- Top rising themes (ranked list)
- Theme volume heatmap by week

### 3.20 Theme Breakdown by Team / Deal Stage

Within each theme, a breakdown table showing:
- Which teams have the most conversations mentioning this theme
- Which deal stages appear most frequently with this theme
- Useful for targeted coaching and deal strategy adjustments

### 3.21 Detection Confidence Display

Every theme and detection result shows a confidence score:
- Displayed as a percentage (e.g., `87% Conf`)
- Color-coded: Green (≥70%), Amber (40–69%), Red (<40%)
- High confidence = strong AI clustering agreement
- Low confidence = borderline theme — may need manual review

---

## 4. Main APIs

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/m02-conversation-intelligence/theme-analyses` | Create a new theme analysis job |
| `GET` | `/api/v1/m02-conversation-intelligence/theme-analyses/:id` | Fetch status and results of an analysis job |
| `GET` | `/api/v1/m02-conversation-intelligence/theme-analyses` | List all analysis jobs for a tenant |
| `GET` | `/api/v1/m02-conversation-intelligence/themes` | Get all detected themes for a tenant |
| `GET` | `/api/v1/m02-conversation-intelligence/themes/:id` | Get theme deep dive data |
| `PATCH` | `/api/v1/m02-conversation-intelligence/themes/:id/accept` | Accept a new theme from review queue |
| `PATCH` | `/api/v1/m02-conversation-intelligence/themes/:id/reject` | Reject a theme → moves to archived |
| `GET` | `/api/v1/m02-conversation-intelligence/themes/archived` | List archived themes |
| `POST` | `/api/v1/m02-conversation-intelligence/alerts` | Create an alert configuration |
| `GET` | `/api/v1/m02-conversation-intelligence/alerts` | List all configured alerts |
| `PATCH` | `/api/v1/m02-conversation-intelligence/alerts/:id` | Update alert config (enable/disable/threshold) |
| `POST` | `/internal/detect-themes` | Internal endpoint called by BullMQ worker to trigger AI theme detection |

All external APIs require tenant header: `x-tenant-id`.

---

## 5. AI Services Used

### Groq LLM

- Used for **theme synthesis** — generating theme names and summaries from grouped conversations
- Used for **clustering validation** — verifying that grouped conversations share the same underlying intent
- Receives batches of transcript excerpts and a business question prompt
- Returns structured JSON: theme name, summary, representative quotes, confidence score

### Transcript Embeddings

- Each conversation transcript is converted to a **vector embedding**
- Similar conversations are grouped by embedding similarity (cosine distance)
- Grouped conversations are sent to Groq LLM for theme labelling
- Enables the system to detect themes **without keyword matching** — true semantic grouping

### BullMQ + Redis

- Theme analysis jobs are **queued asynchronously** using BullMQ with Redis as the queue backend
- When a user creates a theme analysis job, it is placed in the queue immediately
- A background worker processes each job: loads transcripts → generates embeddings → clusters → calls Groq LLM → saves results
- Job status is polled by the frontend until `COMPLETED` or `FAILED`

### PostgreSQL

- All analysis jobs, themes, detections, quotes, and alerts are stored in PostgreSQL
- Direct SQL queries — no Prisma ORM
- Tenant-scoped data using `tenant_id` column on all tables

### Fallback Handling

If Groq LLM is unavailable:
- The system falls back to **keyword frequency clustering** using the business question keywords
- Themes are still generated but with lower confidence scores
- Detection source is recorded internally as `RULE_BASED_FALLBACK` (not shown in UI)
- The UI always shows clean results regardless of which engine was used

---

## 6. PostgreSQL Tables

### `theme_analyses`

Stores each theme analysis job created by a user.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `tenant_id` | VARCHAR | Tenant identifier |
| `business_question` | TEXT | The natural language question for this analysis |
| `filters` | JSONB | Applied filters (date range, deal stage, team, scope) |
| `status` | VARCHAR | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `call_count_analyzed` | INTEGER | Number of conversations processed in this analysis |
| `created_at` | TIMESTAMP | Job creation time |
| `updated_at` | TIMESTAMP | Last status update time |

### `themes`

Stores each detected theme produced by an analysis job.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `analysis_id` | UUID | Foreign key → `theme_analyses.id` |
| `tenant_id` | VARCHAR | Tenant identifier |
| `name` | VARCHAR | AI-generated theme name |
| `summary` | TEXT | AI-generated 1–2 sentence summary |
| `call_count` | INTEGER | Number of conversations containing this theme |
| `account_count` | INTEGER | Number of unique accounts involved |
| `associated_revenue` | DECIMAL | Total pipeline value of deals in matched conversations |
| `confidence_score` | DECIMAL | AI clustering confidence (0.0 – 1.0) |
| `status` | VARCHAR | `PENDING_REVIEW`, `ACCEPTED`, `REJECTED`, `ARCHIVED` |
| `detection_source` | VARCHAR | `GROQ_AI` or `RULE_BASED_FALLBACK` |
| `trend` | VARCHAR | `RISING`, `STABLE`, `DECLINING` |
| `created_at` | TIMESTAMP | Detection timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `theme_quotes`

Stores representative quotes extracted per theme.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `theme_id` | UUID | Foreign key → `themes.id` |
| `tenant_id` | VARCHAR | Tenant identifier |
| `conversation_id` | VARCHAR | Source call or email ID |
| `snippet` | TEXT | Extracted quote text |
| `speaker_side` | VARCHAR | `agent`, `customer`, `any` |
| `confidence_score` | DECIMAL | Quote relevance confidence |
| `created_at` | TIMESTAMP | |

### `theme_alerts`

Stores alert configurations per theme.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `theme_id` | UUID | Foreign key → `themes.id` |
| `tenant_id` | VARCHAR | Tenant identifier |
| `condition_type` | VARCHAR | e.g., `COUNT_THRESHOLD`, `TREND_CHANGE` |
| `threshold_value` | INTEGER | Trigger threshold value |
| `time_window_days` | INTEGER | Rolling window for condition check |
| `is_active` | BOOLEAN | Alert enabled/disabled |
| `last_triggered_at` | TIMESTAMP | Last time this alert fired |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

## 7. Core UI Sections

| Section | Description |
|---|---|
| **Dashboard** | Main view — summary stats, theme card grid, global filters, trend charts |
| **Theme Cards** | Grid of detected themes with name, summary, call count, revenue, confidence |
| **Theme Deep Dive** | Detailed view per theme — quotes, deal outcomes, breakdown by team/deal stage |
| **Call Evidence View** | Individual conversation transcript with highlighted matched segment |
| **Alert Configuration** | Create and manage alert rules per theme |
| **Archived Themes** | List of rejected/archived themes — can be restored |
| **Review Workflow** | Queue of new themes awaiting Accept / Reject decision |

---

## 8. Simple Sample Test Cases

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Open AI Theme Spotter from sidebar | Theme Spotter dashboard loads correctly |
| 2 | Create theme analysis job with a business question | Job created, status shows `PENDING` then `PROCESSING` |
| 3 | Apply global filters (date range, deal stage) | Dashboard updates to show only matching theme data |
| 4 | Analysis job completes | Themes appear in dashboard card grid |
| 5 | Open Theme Deep Dive | Theme details, quotes, and deal outcome data load |
| 6 | Export analysis results | File downloads successfully with correct data |
| 7 | Configure an alert with a threshold | Alert saved, appears in alert management list |
| 8 | Accept a new theme from Review Workflow | Theme promoted to main dashboard |
| 9 | Reject a theme from Review Workflow | Theme moves to Archived Themes view |
| 10 | Open Archived Themes | Rejected themes listed correctly |
| 11 | Restore an archived theme | Theme returns to dashboard |
| 12 | PostgreSQL persistence | Refreshing the page retains all themes, jobs, and alerts |
| 13 | AI fails during analysis | Fallback runs, themes still generated with lower confidence |
| 14 | Search themes by keyword | Matching themes filtered correctly |
| 15 | Sort themes by call count | Themes reorder correctly by selected sort field |

---

## 9. Constraints

| Constraint | Detail |
|---|---|
| **No RBAC** | No role-based access control — all users within a tenant see the same data |
| **No Prisma** | All database operations use direct PostgreSQL queries via `pg` client |
| **PostgreSQL only** | No other database or ORM used |
| **Main features only** | Implement core features as listed — no advanced extensions at this stage |
| **Existing UI style** | Follow Revenue Intelligence Portal component patterns exactly — no new design systems |
| **No disruption** | Existing features (AI Call Reviewer, AI Smart Tracker, Search) must not be modified |
| **Async processing** | Theme analysis runs async via BullMQ — not blocking the API request |
| **Tenant-scoped** | All data is isolated per `tenant_id` — no cross-tenant data access |
