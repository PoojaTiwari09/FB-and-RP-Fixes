# M09 — Sales AI Coaching & Training Backend

> **NestJS · Prisma · Supabase PostgreSQL · Groq LLM · ElevenLabs TTS**

A production-ready AI-powered sales coaching and training platform. Sales reps practice conversations with AI personas, get 5-dimension scorecards, and managers get full analytics dashboards.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Push schema to Supabase (creates all tables)
npx prisma db push

# 3. Seed demo data
npm run seed

# 4. Start the server
npm run start:dev
```

Server runs at → **http://localhost:4001/api**
Swagger UI → **http://localhost:4001/api/docs**

---

## 🔑 Environment Variables (`.env`)

```env
PORT=4001

# Supabase (Connection Pooling)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

JWT_SECRET="your-secret-key"

# AI Services (optional — falls back to mock mode if missing)
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=sk_...

FRONTEND_URL=http://localhost:3000
```

> If `GROQ_API_KEY` is missing, AI responses are mocked so the frontend still works.

---

## 👤 Demo Credentials (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@demo.com` | `password123` |
| Rep 1 | `rep1@demo.com` | `password123` |
| Rep 2 | `rep2@demo.com` | `password123` |
| Rep 3 | `rep3@demo.com` | `password123` |

---

## 🏗️ Project Structure

```
m09-coaching-training/
├── main.ts                           # Entry point — Swagger, CORS, Pipes
├── m09-coaching-training.module.ts   # Root module — JWT, Config, Prisma
├── controllers/
│   ├── auth.controller.ts            # POST /auth/register  POST /auth/login
│   └── m09.controller.ts             # All feature controllers + Guards
├── services/
│   └── m09.service.ts                # Business logic — LLM, Analytics, etc.
├── repositories/
│   └── m09.repository.ts             # All Prisma DB queries
├── schemas/
│   └── m09.schema.ts                 # DTOs (RegisterDto, LoginDto, etc.)
├── prisma/
│   └── schema.prisma                 # DB schema — 7 models
├── database/
│   └── prisma.service.ts             # PrismaClient wrapper
├── workers/
│   └── m09.worker.ts                 # OODA coaching agent + scheduler
├── interfaces/
│   └── coaching.interfaces.ts        # IChatMessage, IScores, IFeedback
├── entities/
│   ├── user.entity.ts
│   └── session.entity.ts
├── events/
│   ├── training-completed.event.ts
│   ├── ai-session-created.event.ts
│   ├── coaching-feedback.event.ts
│   └── analytics-generated.event.ts
└── seeds/
    └── seed.ts                       # Demo data seeder
```

---

## 📡 API Reference

### 🔓 Auth (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account → returns JWT |
| `POST` | `/api/auth/login` | Login → returns JWT |

**Register body:**
```json
{
  "email": "user@company.com",
  "password": "Password123",
  "name": "John Smith",
  "role": "rep",
  "org_id": "org-demo",
  "manager_id": "optional-uuid"
}
```

**Login body:**
```json
{ "email": "manager@demo.com", "password": "password123" }
```

> All subsequent requests need: `Authorization: Bearer <token>`

---

### 🎯 AI Training Sessions

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/sessions/start` | rep | Start AI practice session |
| `POST` | `/api/sessions/send-message` | rep | Send text message to AI persona |
| `POST` | `/api/sessions/send-voice` | rep | Upload audio → transcribe → AI reply |
| `POST` | `/api/sessions/end` | rep | End session → 5-dimension scorecard |
| `POST` | `/api/sessions/retry` | rep | Retry the same scenario |
| `POST` | `/api/sessions/analyze-call` | rep | Upload recorded call → full analysis |
| `GET` | `/api/sessions` | rep | All my sessions |
| `GET` | `/api/sessions/my` | rep | My sessions (alias) |
| `GET` | `/api/sessions/:id` | any | Session detail + transcript |
| `GET` | `/api/sessions/voices` | public | Available ElevenLabs voices |

**Start session body:**
```json
{ "scenarioId": "uuid", "voiceId": "optional-voice-id" }
```

**Send message body:**
```json
{ "sessionId": "uuid", "message": "We can help you reduce ramp time..." }
```

---

### 🎭 Scenarios (AI Personas)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/scenarios` | any | List all org scenarios |
| `GET` | `/api/scenarios/:id` | any | Get scenario detail |
| `POST` | `/api/scenarios` | manager | Create new scenario |
| `PATCH` | `/api/scenarios/:id` | manager | Update scenario |
| `DELETE` | `/api/scenarios/:id` | manager | Delete scenario |

**Create scenario body:**
```json
{
  "persona_name": "Skeptical CFO",
  "persona_type": "executive",
  "difficulty": "advanced",
  "context_text": "You are a CFO scrutinizing software costs...",
  "custom_prompt": "Focus on ROI objections",
  "voice_id": "optional"
}
```

---

### 📈 Analytics

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics/dashboard` | manager | Team KPIs + coaching metrics |
| `GET` | `/api/analytics/reps` | manager | All reps with performance stats |
| `GET` | `/api/analytics/team` | manager | Team-level breakdown |
| `GET` | `/api/analytics/activity` | manager | Session activity over time |
| `GET` | `/api/analytics/interactions` | manager | Call quality metrics |
| `GET` | `/api/analytics/topics` | manager | Keyword/topic insights |
| `GET` | `/api/analytics/benchmarks` | manager | Team rankings |
| `GET` | `/api/analytics/manager-review` | manager | Rep review for manager |
| `GET` | `/api/analytics/call-drilldown/:id` | manager | Full session breakdown |
| `GET` | `/api/analytics/training-report` | manager | Assignment completion report |
| `GET` | `/api/analytics/export` | manager | Download CSV (coaching) |
| `GET` | `/api/analytics/export-training` | manager | Download CSV (training) |
| `GET` | `/api/analytics/my` | rep | Personal performance |
| `GET` | `/api/analytics/my-notes` | rep | My coaching notes |
| `GET` | `/api/analytics/my-assignments` | rep | My training assignments |

---

### 🏋️ Training Assignments

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/training/assignments` | manager | Bulk assign scenario to reps |
| `GET` | `/api/training/assignments` | any | List assignments (role-aware) |
| `PATCH` | `/api/training/assignments/:id` | manager | Update status/priority/deadline |

**Create assignment body:**
```json
{
  "repIds": ["uuid1", "uuid2"],
  "scenarioId": "uuid",
  "deadline": "2026-06-01T00:00:00Z",
  "priority": "High"
}
```

---

### 🎓 Coaching

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/coaching/notes` | any | Get notes (manager: all; rep: own) |
| `POST` | `/api/coaching/notes` | manager | Create coaching note for rep |
| `GET` | `/api/coaching/recommendations` | rep | AI-generated recommendations |

---

### 🔧 Test Helpers (Dev Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/test/health` | DB health + row counts |
| `POST` | `/api/test/seed` | Seed basic test data |
| `POST` | `/api/test/smoke` | Full end-to-end flow test |

---

## 🔐 Auth Flow

```
1. POST /api/auth/register  →  { token, user }
2. POST /api/auth/login     →  { token, user }
3. All requests: Authorization: Bearer <token>
4. JWT verified + user loaded from DB on every request
5. Role check via @Roles() decorator
```

**Roles:** `admin` | `org_admin` | `manager` | `rep` | `trainer`

---

## 🗃️ Database Models

| Model | Description |
|-------|-------------|
| `User` | All users — reps, managers, admins |
| `TrainingScenario` | AI persona configs created by managers |
| `TrainingSession` | Practice sessions — transcript + feedback |
| `TrainingAssignment` | Scenario assignments with deadlines |
| `CoachingNote` | Manual + AI-generated coaching notes |
| `CoachingRecommendation` | AI-generated rep improvement tips |
| `AiVoice` | Available ElevenLabs voice options |

---

## 🤖 AI Features

| Feature | Provider | How |
|---------|----------|-----|
| AI Persona Conversations | Groq (llama-3.1-8b-instant) | Full context in every turn |
| Live Coaching Tips | Groq | Generated with each reply |
| 5-Dimension Scorecard | Groq | At session end |
| Voice TTS Replies | ElevenLabs | Base64 audio returned |
| Voice Input → Text | Groq Whisper | Upload audio, get transcript |
| Call Analysis | Groq | Upload recording → insights |
| Mock Fallback | Built-in | Auto-activates if no API keys |

**5 Scorecard Dimensions:**
1. Opening / Rapport Building
2. Discovery & Needs Assessment
3. Objection Handling
4. Talk-to-Listen Ratio
5. Closing & Next Steps

---

## ⚙️ Background Workers

| Worker | Runs | Does |
|--------|------|------|
| `SchedulerService` | Every 12h | Refreshes analytics |
| `M09Worker.runCoachingAgent()` | On demand | OODA coaching agent loop |
| `M09Worker.checkOverdueAssignments()` | On demand | Flags overdue assignments |

---

## 🛠️ Useful Commands

```bash
npm run start:dev        # Start with hot reload
npm run start:prod       # Production start
npm run seed             # Seed demo data
npm run build            # Compile TypeScript
npx prisma db push       # Push schema to Supabase
npx prisma studio        # Visual DB browser
npx prisma generate      # Regenerate Prisma client
```

---

## ❗ Common Issues

| Error | Fix |
|-------|-----|
| `EADDRINUSE :::4001` | Kill the existing process: `lsof -ti:4001 \| xargs kill` |
| `Invalid API key` | Check `GROQ_API_KEY` and `ELEVENLABS_API_KEY` in `.env` |
| `DATABASE_URL` errors | Ensure password `@` is encoded as `%40` in the URL |
| `Permission denied` on `nest` | Run `chmod +x node_modules/.bin/nest` |
| JWT invalid | Make sure `JWT_SECRET` is set in `.env` |

---

## 📋 Feature Completion Status

| Category | Status |
|----------|--------|
| Auth (register/login/JWT/RBAC) | ✅ 100% |
| AI Sessions (text + voice + scoring) | ✅ 100% |
| Scenario Builder | ✅ 100% |
| Analytics (10+ endpoints) | ✅ 100% |
| Training Assignments | ✅ 100% |
| Coaching Notes & Recommendations | ✅ 100% |
| CSV Export | ✅ 100% |
| Background Workers | ✅ 100% |
| Swagger Docs | ✅ Live at `/api/docs` |
| Topic Insights (real data) | ⚠️ Stubbed |
| Refresh Tokens | ❌ Not built |
| PDF Export | ❌ Not built |
| Rate Limiting | ❌ Not built (add before prod) |
