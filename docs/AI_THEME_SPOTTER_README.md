# AI Theme Spotter

> **Module:** M2 – Conversation Intelligence | **Platform:** Revenue Intelligence Portal  
> **Storage:** PostgreSQL | **AI Engine:** Groq AI (with Rule-Based Fallback)

---

## Overview

The **AI Theme Spotter** is an AI-powered recurring pattern detection engine within the M2 Conversation Intelligence module. It allows revenue teams to ask **business questions** about their customer conversations and receive back **automatically detected themes** — recurring patterns, concerns, and signals that appear across multiple calls and accounts.

Unlike individual call scoring (AI Call Reviewer) or signal-level detection (AI Smart Tracker), the Theme Spotter operates at the **aggregate level** — identifying patterns that span many conversations and linking them to pipeline impact.

---

## Business Purpose

Revenue leaders need to understand what customers are consistently talking about — not just in one call, but across the entire portfolio. Manually reading hundreds of transcripts to spot patterns is impossible at scale.

The AI Theme Spotter solves this by:

- **Letting teams ask business questions** (e.g., "Why are deals stalling in Q3?")
- **Automatically analyzing conversation transcripts** to detect recurring themes
- **Linking themes to business metrics** — call count, account count, pipeline value
- **Providing a review workflow** so teams can accept, reject, or archive themes
- **Enabling alert configuration** to monitor theme frequency over time

---

## Sidebar Integration

**AI Theme Spotter** is a top-level item in the Revenue Intelligence Portal sidebar — at the same level as AI Call Reviewer, AI Smart Tracker, Search, and Deals.

```
SIDEBAR
├── Home
├── Engage
├── Search
├── AI Call Reviewer
├── AI Smart Tracker
├── AI Theme Spotter    ← Main navigation item
├── Company library
├── Deals
└── ...
```

It is **not** nested inside Search or any sub-menu. It is an independent primary module.

---

## Theme Spotter vs. Smart Tracker — Key Difference

| Feature | AI Smart Tracker | AI Theme Spotter |
|---|---|---|
| **Detection level** | Individual signal per conversation | Aggregate theme across many conversations |
| **User defines** | A specific tracker with a business question | A broad business question about patterns |
| **Output** | Detection records per call | Themed groups with call counts and pipeline values |
| **Use case** | "Alert me when a customer mentions a competitor" | "What are customers most concerned about this quarter?" |
| **Review workflow** | No (detections are instant) | Yes — Accept / Reject / Archive |
| **Alerts** | Not supported | Configurable threshold and trend alerts |

**Theme Spotter is NOT individual signal detection.** It discovers broad, recurring patterns across the entire conversation corpus.

---

## Main Features

| Feature | Description |
|---|---|
| Theme Analysis Job | Ask a business question and trigger AI analysis across all conversations |
| Theme Card Grid | Visual grid of all detected themes with stats and trends |
| Summary Dashboard | Total themes, calls analyzed, pending reviews, active alerts |
| Deep Dive Panel | Detailed view of a theme with representative quotes, deal correlations |
| Review Workflow | Accept or Reject AI-detected themes before they appear on the main dashboard |
| Archived Themes | View and restore previously rejected or archived themes |
| Alert Configuration | Set up threshold and trend-change alerts per accepted theme |
| Search & Filtering | Search themes by name, filter by trend direction |

---

## Theme Analysis Job Creation

### Running an Analysis

1. Click **"+ Analyze Conversations"** from the dashboard header
2. Enter a **business question** in natural language
   - Example: "What are the most common customer concerns?"
   - Example: "Why are deals stalling in the pipeline?"
   - Example: "What product features are customers requesting?"
3. Click **"Run Analysis"**

### What happens step by step

```
User clicks "+ Analyze Conversations"
        ↓
User enters a Business Question
        ↓
System creates a Theme Analysis job (status: PENDING)
        ↓
Job moves to PROCESSING status
        ↓
System loads all available conversation transcripts
        ↓
Groq AI receives:
  - The business question as analysis instruction
  - Excerpts from up to 20 conversations as input
        ↓
Groq AI identifies 3-5 recurring themes:
  - Theme name and summary
  - Estimated call count and account count
  - Associated pipeline revenue
  - Confidence score
  - Trend direction (Rising / Stable / Declining)
  - Representative quotes from conversations
        ↓
[If Groq AI fails → Rule-Based Fallback activates]
        ↓
Fallback uses keyword pattern matching against known categories:
  - Pricing & Cost Concerns
  - Competitor Comparisons
  - Product Feature Requests
  - Timeline & Procurement Delays
  - Onboarding & Support Needs
        ↓
Themes stored in PostgreSQL with status: PENDING_REVIEW
        ↓
Quotes extracted and stored per theme
        ↓
Job status updated to COMPLETED
        ↓
Dashboard refreshes — new themes appear in "Pending Review" tab
```

---

## Scan Progress Feedback (UI)

While analysis is in progress, the UI displays real-time status messages:

```
"Submitting analysis job..."
        ↓
"Loading conversations..."
        ↓
"Analyzing patterns via Groq AI..."
        ↓
"Detecting recurring themes..."
        ↓
"Saving results..."
        ↓
"✓ Analysis complete — new themes ready for review"
```

---

## Theme Review Workflow

This is one of the most important concepts in the AI Theme Spotter.

### Why Themes Need Review

AI-detected themes are suggestions, not facts. They may include false positives, overly broad categorizations, or low-confidence patterns. The review workflow lets human analysts validate AI results before they appear on the main dashboard.

### Review States

| State | Behavior |
|---|---|
| **PENDING_REVIEW** | Theme detected by AI — waiting for human decision. Appears in "Pending Review" tab only |
| **ACCEPTED** | Theme validated by analyst — appears on main "All Themes" dashboard |
| **REJECTED** | Theme dismissed by analyst — moves to Archived tab |
| **ARCHIVED** | Theme manually archived — can be restored later |

### Accepting a Theme

Click **"Accept"** on any pending theme card. The theme moves to the main dashboard and becomes visible in the "All Themes" view.

### Rejecting a Theme

Click **"Reject"** on any pending theme card. The theme moves to the Archived tab with REJECTED status.

### Archiving an Accepted Theme

Click **"Archive"** on any accepted theme card from the main dashboard. Useful for themes that are no longer relevant.

### Restoring an Archived Theme

Click **"Restore"** on any archived/rejected theme. The theme returns to PENDING_REVIEW status for re-evaluation.

---

## Dashboard Views

### All Themes Tab

Shows all **accepted** themes. Each theme card displays:
- Theme name and summary
- Trend badge (Rising / Stable / Declining)
- Confidence score
- Call count, account count, pipeline value
- Deep Dive and Archive actions

### Pending Review Tab

Shows themes in **PENDING_REVIEW** status with a warning banner indicating how many themes need review. Each card has Accept and Reject buttons.

### Archived Tab

Shows **REJECTED** and **ARCHIVED** themes with restore functionality.

### Alerts Tab

Shows configured alert rules with enable/disable toggles and a "New Alert" creation form.

---

## Theme Deep Dive Panel

Clicking **"Deep Dive →"** on any theme card opens a detailed overlay panel showing:

| Section | Content |
|---|---|
| **Theme Summary** | Full AI-generated description of the theme pattern |
| **Deal Outcome Correlation** | Visual bars showing % of deals that were Closed Won, Closed Lost, Stalled, or In Progress |
| **Representative Quotes** | Actual conversation excerpts that match this theme, with speaker side and confidence |
| **Stats** | Calls Matched, Accounts, Pipeline Value |

---

## Alert Configuration

Alerts allow teams to be notified when a theme's frequency changes.

### Creating an Alert

1. Go to the **Alerts** tab
2. Click **"+ New Alert"**
3. Select an **accepted theme** from the dropdown
4. Choose a **condition type**:
   - **Mention Count Threshold** — triggers when theme mentions exceed N in a time window
   - **Trend Change** — triggers when the theme's trend direction shifts
5. Set **threshold value** and **time window** (in days)
6. Click **"Save Alert"**

### Alert States

| State | Behavior |
|---|---|
| **Active** | Alert is monitoring and will trigger when conditions are met |
| **Inactive** | Alert is paused — no monitoring |

Alerts can be toggled between Active and Inactive at any time.

---

## AI & Detection Architecture

### Groq AI Integration

**Groq AI** is the primary theme detection engine. It analyzes conversation excerpts against a business question to identify recurring patterns.

- The user's **Business Question** is sent as the analysis instruction to Groq AI
- **Conversation transcript excerpts** (up to 20, limited to 300 characters each) are the input corpus
- Groq AI identifies 3-5 themes with names, summaries, call counts, and representative quotes
- Returns a structured JSON array of theme objects

### Rule-Based Fallback Detection

| Evaluator | When it runs |
|---|---|
| **Groq AI** | Always tried first |
| **Rule-Based Fallback** | Activates silently if Groq AI call fails |

The fallback uses keyword pattern matching against five known business signal categories:

| Fallback Pattern | Keywords |
|---|---|
| Pricing & Cost Concerns | price, cost, expensive, budget, discount |
| Competitor Comparisons | competitor, alternative, salesforce, hubspot, compare |
| Product Feature Requests | feature, integration, api, dashboard, report, export |
| Timeline & Procurement Delays | delay, timeline, procurement, legal, contract |
| Onboarding & Support Needs | support, training, onboard, help, setup |

**The fallback is completely invisible to the end user.** Theme results appear the same in the UI regardless of which engine generated them.

---

## Seeded Conversation Corpus

In development and demo environments, when no conversations are provided, the system uses **seeded demo transcripts** — 8 pre-loaded conversation snippets that simulate realistic sales call scenarios covering pricing, competition, integration needs, procurement delays, and onboarding requests.

This allows full end-to-end demonstration of the theme detection flow without needing real customer data.

---

## Dashboard Statistics

| Stat Card | What it measures |
|---|---|
| **Total Themes** | All themes detected (any status) |
| **Calls Analyzed** | Sum of calls matched across all themes |
| **New Themes** | Themes with PENDING_REVIEW status awaiting analyst decision |
| **Active Alerts** | Alert configurations currently enabled and monitoring |

---

## PostgreSQL Storage

All theme data is stored directly in PostgreSQL (no Prisma ORM).

| Table | What it stores |
|---|---|
| `theme_analyses` | Analysis job records — business question, status, call count, timestamps |
| `themes` | Detected theme records — name, summary, stats, confidence, status, trend |
| `theme_quotes` | Representative quotes per theme — snippet, speaker side, confidence |
| `theme_alerts` | Alert configuration — theme ID, condition type, threshold, active status |

---

## Example Themes

### Theme: Pricing & Cost Concerns

```
Name:           Pricing & Cost Concerns
Trend:          ↑ Rising
Confidence:     87%
Calls:          18
Accounts:       12
Pipeline:       $245,000

Summary:
"Customers frequently raise questions about pricing tiers, discounts,
 and budget constraints during sales conversations."

Quote:
"The pricing feels quite steep compared to what we expected for this tier."
  — Customer, 91% confidence
```

### Theme: Competitor Comparisons

```
Name:           Competitor Comparisons
Trend:          → Stable
Confidence:     82%
Calls:          14
Accounts:       9
Pipeline:       $178,000

Summary:
"Prospects consistently compare the platform to Salesforce and HubSpot,
 asking for differentiation rationale."

Quote:
"We are also evaluating Salesforce — how do you differentiate on AI features?"
  — Customer, 88% confidence
```

### Theme: Integration & API Needs

```
Name:           Integration & API Needs
Trend:          ↑ Rising
Confidence:     78%
Calls:          11
Accounts:       8
Pipeline:       $132,000

Summary:
"Teams express strong need for CRM integration, API access,
 and data export capabilities before committing."

Quote:
"Our CRM integration is critical — if the API does not support it we cannot proceed."
  — Customer, 81% confidence
```

---

## Real-World Business Use Cases

| Theme Detected | Business Action Triggered |
|---|---|
| **Pricing & Cost Concerns** | Product marketing reviews pricing positioning; sales leadership considers discount programs |
| **Competitor Comparisons** | Competitive intelligence team updates battlecards; enablement creates competitor comparison decks |
| **Integration & API Needs** | Product team prioritizes API roadmap; engineering accelerates CRM integration |
| **Procurement Delays** | Revenue ops adjusts forecast timelines; deal-specific follow-up cadences created |
| **Onboarding Requests** | Customer success team scales onboarding resources; training documentation updated |

---

## End-to-End Flow Summary

```
User navigates to AI Theme Spotter in sidebar
        ↓
Clicks "+ Analyze Conversations"
        ↓
Enters business question:
  "What are customers most concerned about?"
        ↓
Clicks "Run Analysis"
        ↓
System creates Theme Analysis job (PENDING → PROCESSING)
        ↓
Groq AI analyzes conversation corpus
  [If Groq AI fails → Fallback keyword detection activates]
        ↓
3-5 themes detected with stats, quotes, and trends
        ↓
Themes stored in PostgreSQL as PENDING_REVIEW
        ↓
Analyst reviews themes in "Pending Review" tab
        ↓
Accept → Theme moves to main dashboard
Reject → Theme moves to Archived
        ↓
Analyst configures alerts on accepted themes
        ↓
System monitors theme frequency and triggers alerts
        ↓
Revenue team takes action based on detected patterns
```

---

## Component Architecture

The frontend is built with modular React components for maintainability:

| Component | Responsibility |
|---|---|
| `ThemeSpotterDashboard.tsx` | Main orchestrator — state, API calls, view switching |
| `ThemeSummaryCards.tsx` | Top-level stat cards |
| `ThemeFilters.tsx` | Tab bar and search/trend filters |
| `ThemeCardGrid.tsx` | Grid renderer for theme cards |
| `ThemeCard.tsx` | Individual theme card with actions |
| `ThemeDeepDivePanel.tsx` | Detailed overlay with quotes and correlations |
| `ThemeReviewPanel.tsx` | Pending review workflow with Accept/Reject |
| `ArchivedThemesPanel.tsx` | Archived themes with restore |
| `ThemeAlertsPanel.tsx` | Alert configuration and management |
| `themeSpotterTypes.ts` | TypeScript type definitions |
| `themeSpotterMockData.ts` | Demo/fallback data for development |
