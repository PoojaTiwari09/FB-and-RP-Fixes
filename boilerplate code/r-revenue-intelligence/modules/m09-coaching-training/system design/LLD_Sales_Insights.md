# Low-Level Design (LLD): Sales Coaching Insights Module

This document details the sequence diagrams and data flows for the core functionalities within the **Sales Coaching Insights** module.

## 1. Team Coaching Dashboard & Radar Charts (F001, F002)

Generates the high-level team metrics, radar charts comparing skills (Discovery, Objections, etc.), and identifies at-risk reps.

```mermaid
sequenceDiagram
    actor Manager
    participant AnalyticsCtrl as Analytics Controller
    participant AnalyticsSvc as Analytics Service
    participant DB as PostgreSQL DB

    Manager->>AnalyticsCtrl: GET /analytics/dashboard
    AnalyticsCtrl->>AnalyticsSvc: getDashboardStats(orgId, managerId)
    AnalyticsSvc->>DB: Fetch All Rep IDs for Manager
    AnalyticsSvc->>DB: Fetch All TrainingSessions for Reps
    
    Note over AnalyticsSvc: Filter out notes/practices.<br/>Iterate through feedback_json.
    AnalyticsSvc->>AnalyticsSvc: Tally Valid Sessions & Total Scores
    AnalyticsSvc->>AnalyticsSvc: Calculate Averages (Discovery, Closing, etc.)
    AnalyticsSvc->>AnalyticsSvc: Rank Reps (Top Performers vs At-Risk)
    
    AnalyticsSvc-->>Manager: Return Aggregated Stats & Score Trends
    
    Manager->>AnalyticsCtrl: GET /analytics/compare/{repId}
    AnalyticsCtrl->>AnalyticsSvc: getRepComparison(repId)
    AnalyticsSvc->>AnalyticsSvc: Aggregate Team Avg vs Rep Avg
    AnalyticsSvc-->>Manager: Return Radar Chart Data (Team vs Rep)
```

## 2. Topic & Tracker Insights (F005)

Scans the feedback data across the team to identify which objections (e.g., Price, Competitor) are most common.

```mermaid
sequenceDiagram
    actor Manager
    participant AnalyticsCtrl as Analytics Controller
    participant AnalyticsSvc as Analytics Service
    participant DB as PostgreSQL DB

    Manager->>AnalyticsCtrl: GET /analytics/topics
    AnalyticsCtrl->>AnalyticsSvc: getTopicInsights(orgId, managerId)
    AnalyticsSvc->>DB: Fetch All Sessions for Team
    
    loop For Each Session
        AnalyticsSvc->>AnalyticsSvc: Stringify feedback_json to lowercase
        loop For Each Keyword (Budget, Price, ROI, etc.)
            alt Keyword Found
                AnalyticsSvc->>AnalyticsSvc: Increment Topic Counter
            end
        end
    end
    
    AnalyticsSvc->>AnalyticsSvc: Calculate Impact (High > 5, Low < 2)
    AnalyticsSvc->>AnalyticsSvc: Sort by Frequency
    AnalyticsSvc-->>Manager: Return Top 5 Topics/Objections
```

## 3. Interaction Analytics (F004)

Extracts objective metrics from the LLM scorecard (Talk Ratio, Questions Asked).

```mermaid
sequenceDiagram
    actor Manager
    participant AnalyticsCtrl as Analytics Controller
    participant AnalyticsSvc as Analytics Service
    participant DB as PostgreSQL DB

    Manager->>AnalyticsCtrl: GET /analytics/interactions
    AnalyticsCtrl->>AnalyticsSvc: getInteractionAnalytics(orgId, managerId)
    AnalyticsSvc->>DB: Fetch Team Sessions
    
    loop For Each Session
        Note over AnalyticsSvc: Parse feedback_json.objective_metrics
        AnalyticsSvc->>AnalyticsSvc: Sum Talk Ratios
        AnalyticsSvc->>AnalyticsSvc: Sum Questions Asked
        AnalyticsSvc->>AnalyticsSvc: Sum Closing Attempts
    end
    
    AnalyticsSvc->>AnalyticsSvc: Calculate Averages across valid sessions
    AnalyticsSvc-->>Manager: Return Averages (Talk Ratio, Questions, etc.)
```

## 4. Manager Coaching Notes & Recommendations (F007, Manual Feedback)

Allows managers to push manual feedback or system to generate automated recommendations.

```mermaid
sequenceDiagram
    actor Manager
    participant CoachingCtrl as Coaching Controller
    participant CoachingSvc as Coaching Service
    participant DB as PostgreSQL DB

    Manager->>CoachingCtrl: POST /coaching/notes {repId, content, priority}
    CoachingCtrl->>CoachingSvc: createNote(...)
    CoachingSvc->>DB: Insert CoachingNote (is_agent_generated: false)
    CoachingSvc-->>Manager: Note Created
    
    Manager->>CoachingCtrl: POST /coaching/recommendations {repId, text}
    CoachingCtrl->>CoachingSvc: pushRecommendation(...)
    CoachingSvc->>DB: Insert CoachingRecommendation
    CoachingSvc-->>Manager: Recommendation Pushed
```

## 5. CSV Export (F010)

Generates downloadable reports of rep performance.

```mermaid
sequenceDiagram
    actor Manager
    participant AnalyticsCtrl as Analytics Controller
    participant AnalyticsSvc as Analytics Service
    participant DB as PostgreSQL DB

    Manager->>AnalyticsCtrl: GET /analytics/export
    AnalyticsCtrl->>AnalyticsSvc: exportCsv(orgId, managerId)
    AnalyticsSvc->>AnalyticsSvc: Call getRepsWithStats()
    
    Note over AnalyticsSvc: Construct CSV String Format
    loop For Each Rep Stat
        AnalyticsSvc->>AnalyticsSvc: Append row (Name, Email, Score, Status)
    end
    
    AnalyticsSvc-->>Manager: Return CSV String
```
