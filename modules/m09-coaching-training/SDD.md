# Software Design Document (SDD) - m09-coaching-training

## 1. System Architecture
The `m09-coaching-training` module is structured using the Module-Provider-Controller (MPC) design pattern in NestJS.

```
m09-coaching-training/
├── controllers/      # Route handlers, requests validation, HTTP responses
├── interfaces/       # Strongly typed TypeScript contracts
├── schemas/          # class-validator DTOs for incoming request parsing
├── repositories/     # Database queries (Supabase client/Prisma client)
├── services/         # Pure business logic and flow orchestration
├── events/           # Application-level events
├── workers/          # Background processors (coaching agent, analytics precomputation)
└── prisma/           # Database migration blueprint schemas
```

## 2. Scoped Features
- **Sales Coaching Insights (1-11)**: Dashboards, rep comparisons, interaction analytics, exports, scheduled refreshing.
- **AI Trainer (12-23)**: Scenario builder, Turn-by-Turn conversations, scorecards, retries, training assignments, manager reviews, secure tenant isolation.

## 3. Data Flow Model
1. Rep requests starting a session via `/api/m09/sessions/start`.
2. Controller parses and validates using `StartSessionDto`.
3. `SessionsService` creates a record in `training_sessions` using `SessionsRepository`.
4. Chat messages are processed in real-time by sending transcripts to `LlmService` (Groq Llama-3.1-8b). ElevenLabs generates TTS audio.
5. On ending the session, `evaluateSession()` triggers, computes objective metrics, prompts Llama-3.3-70b, stores scorecard in `feedback_json`, and triggers `CoachingAgentWorker` asynchronously.
6. The `CoachingAgentWorker` observes past attempts, determines weakest skills, generates a coaching action, inserts a coaching note, auto-assigns next best scenario, and issues manager email alerts if scores fall below threshold.
