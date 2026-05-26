# Low-Level Design (LLD): AI Trainer Module

This document provides detailed sequence diagrams and flows for the core functionalities within the **AI Trainer** module.

## 1. AI Practice Sessions & Turn-by-Turn Conversation (F013, F014)

This flow describes how a Sales Rep initiates and participates in a mock training session with an AI persona.

```mermaid
sequenceDiagram
    actor Rep
    participant SessionsCtrl as Sessions Controller
    participant SessionsSvc as Sessions Service
    participant LLMSvc as LLM Service
    participant GroqAPI as Groq LLM API
    participant DB as PostgreSQL DB

    Rep->>SessionsCtrl: POST /sessions/start {scenarioId}
    SessionsCtrl->>SessionsSvc: startSession(dto, userId)
    SessionsSvc->>DB: Fetch Scenario Details (Persona, Prompt)
    SessionsSvc->>DB: Create TrainingSession (Status: Active)
    SessionsSvc-->>Rep: Return sessionId & System Context

    loop Conversation Turn
        Rep->>SessionsCtrl: POST /sessions/send-message {sessionId, message}
        SessionsCtrl->>SessionsSvc: sendMessage(dto)
        SessionsSvc->>DB: Fetch TrainingSession (messages_json)
        SessionsSvc->>SessionsSvc: Append User Message to messages_json
        
        SessionsSvc->>LLMSvc: generateChatReply(messages, context)
        LLMSvc->>GroqAPI: POST Completion Request
        GroqAPI-->>LLMSvc: AI Reply Text
        
        SessionsSvc->>SessionsSvc: Append AI Reply to messages_json
        SessionsSvc->>DB: Update TrainingSession (save history)
        SessionsSvc-->>Rep: Return AI Reply Text
    end
```

## 2. Session Scorecard Evaluation (F015)

When a rep concludes a session, the backend evaluates the full transcript to generate a comprehensive scorecard.

```mermaid
sequenceDiagram
    actor Rep
    participant SessionsCtrl as Sessions Controller
    participant SessionsSvc as Sessions Service
    participant LLMSvc as LLM Service
    participant GroqAPI as Groq LLM API
    participant DB as PostgreSQL DB

    Rep->>SessionsCtrl: POST /sessions/end {sessionId}
    SessionsCtrl->>SessionsSvc: endSession(sessionId)
    SessionsSvc->>DB: Fetch TrainingSession (messages_json)
    
    SessionsSvc->>LLMSvc: evaluateSession(transcript)
    LLMSvc->>GroqAPI: POST Completion Request (JSON Mode)
    Note over GroqAPI: Analyzes Opening, Discovery,<br/>Closing, Objections
    GroqAPI-->>LLMSvc: Return Scorecard JSON Object
    
    SessionsSvc->>DB: Update TrainingSession (feedback_json = Scorecard)
    SessionsSvc->>DB: Update TrainingAssignment (best_score) if applicable
    SessionsSvc-->>Rep: Return Scorecard Details
```

## 3. Persona Configuration & Scenario Builder (F011, F012)

Managers can create scenarios manually or generate them dynamically from real call audio.

```mermaid
sequenceDiagram
    actor Manager
    participant ScenariosCtrl as Scenarios Controller
    participant ScenariosSvc as Scenarios Service
    participant LLMSvc as LLM Service
    participant DB as PostgreSQL DB

    alt Manual Creation
        Manager->>ScenariosCtrl: POST /scenarios {persona, custom_prompt}
        ScenariosCtrl->>ScenariosSvc: create(dto)
        ScenariosSvc->>DB: Insert TrainingScenario
        ScenariosSvc-->>Manager: Scenario Created
    else Audio Upload Generation
        Manager->>ScenariosCtrl: POST /scenarios/analyze-audio (Audio File)
        ScenariosCtrl->>ScenariosSvc: analyzeAudioForScenario(buffer)
        
        ScenariosSvc->>LLMSvc: transcribeAudio(tmpFile)
        LLMSvc-->>ScenariosSvc: Raw Transcript
        
        ScenariosSvc->>LLMSvc: diarizeTranscript(transcript)
        LLMSvc-->>ScenariosSvc: Diarized Messages (Rep vs Client)
        
        ScenariosSvc->>LLMSvc: generatePersonaFromTranscript(transcript)
        LLMSvc-->>ScenariosSvc: JSON Persona Profile
        
        ScenariosSvc-->>Manager: Return Extracted Persona details
        Manager->>ScenariosCtrl: POST /scenarios (Save Extracted Persona)
    end
```

## 4. Training Assignments & Completion Tracking (F017, F018)

Managers assign scenarios, and a background process tracks overdue assignments.

```mermaid
sequenceDiagram
    participant Manager
    participant TrainingCtrl as Training Controller
    participant DB as PostgreSQL DB
    participant Scheduler as Scheduler Service (Cron)

    Manager->>TrainingCtrl: POST /training/assignments {repIds, scenarioId, deadline}
    TrainingCtrl->>DB: Bulk Insert TrainingAssignment (Status: Pending)
    
    loop Twice Daily (Every 12h)
        Scheduler->>Scheduler: runRefreshCycle()
        Scheduler->>DB: findOverdueAssignments()
        Note right of DB: Where status != Completed <br/>AND deadline < now()
        DB-->>Scheduler: List of Overdue Assignments
        Scheduler->>DB: updateAssignmentById (Status: Overdue)
    end
```
