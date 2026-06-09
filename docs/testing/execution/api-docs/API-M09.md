# M09 — Coaching & Training API

| | Value |
|--|--------|
| **Web** | http://localhost:5176 |
| **API** | http://localhost:4009 |
| **Base URL** | `http://localhost:4009/api/v1/coaching-training` |
| **pnpm** | `dev:m09-api`, `dev:m09-web` |

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4009/api/v1/coaching-training` (in `.env.local`) |

**Client:** `apps/web/src/modules/m09-coaching-training/lib/api.ts` (axios `apiClient`)

All paths below are **relative to base URL** (already includes `/api/v1/coaching-training`).

**Auth:** `POST /auth/login` → JWT in `localStorage.auth_token` → `Authorization: Bearer ...`

---

## Frontend ↔ backend mapping

### Auth (`services/auth.service.ts`)

| Frontend | Method | Path |
|----------|--------|------|
| `authService.login` | POST | `/auth/login` |
| Register (if used) | POST | `/auth/register` |

### AI Trainer — sessions (`services/sessions.service.ts`)

| Frontend | Method | Path |
|----------|--------|------|
| `getMySessions` | GET | `/sessions/my` |
| `startSession` | POST | `/sessions/start` |
| `sendMessage` | POST | `/sessions/send-message` |
| `endSession` | POST | `/sessions/end` |
| `pauseSession` | PATCH | `/sessions/:sessionId` |
| `submitFinalToManager` | POST | `/sessions/submit-to-manager` or `/training/submit-session` |
| `retrySession` | POST | `/sessions/retry` |
| `getHint` | GET | `/sessions/:sessionId/hint` |
| Page load | GET | `/sessions/:id` |

### Scenarios (`services/scenarios.service.ts`)

| Frontend | Method | Path |
|----------|--------|------|
| `findAll` | GET | `/scenarios` |
| `findOne` | GET | `/scenarios/:id` |
| `create` | POST | `/scenarios` |
| `update` | PATCH | `/scenarios/:id` |
| `delete` | DELETE | `/scenarios/:id` |
| `transcribeAudio` | POST | `/scenarios/transcribe` |
| `analyzeAudio` | POST | `/scenarios/analyze-audio` |
| `generatePersona` | POST | `/scenarios/generate-persona` |

### Training assignments (`services/assignments.service.ts`)

| Frontend | Method | Path |
|----------|--------|------|
| `getMyAssignments` | GET | `/analytics/my-assignments` |
| `getAssignments` | GET | `/training/assignments` |
| `createAssignments` | POST | `/training/assignments` |
| `updateAssignment` | PATCH | `/training/assignments/:id` |
| `deleteAssignment` | DELETE | `/training/assignments/:id` |

### Coaching (`services/coaching.service.ts`)

| Frontend | Method | Path |
|----------|--------|------|
| `getRecommendations` | GET | `/coaching/recommendations` |
| `pushRecommendation` | POST | `/coaching/recommendations` |

### Analytics / manager (`services/analytics.service.ts`)

| Frontend | Method | Path |
|----------|--------|------|
| `getDashboard` | GET | `/analytics/dashboard` |
| `getReps` | GET | `/analytics/reps` |
| `getTeam` | GET | `/analytics/team` |
| `getCallDrilldown` | GET | `/analytics/call-drilldown/:sessionId` |
| `getRepComparison` | GET | `/analytics/compare/:repId` |
| `getBenchmarks` | GET | `/analytics/benchmarks` |
| `getManagerReview` | GET | `/analytics/manager-review` |
| `approveReview` / `rejectReview` | POST | `/analytics/manager-review/:id/approve`, `.../reject` |
| `getActivityMetrics` | GET | `/analytics/activity` |
| `getInteractionAnalytics` | GET | `/analytics/interactions` |
| `getTopicInsights` | GET | `/analytics/topics` |
| `getMyAnalytics` | GET | `/analytics/my` |
| `exportReport` | GET | `/analytics/export` or `/analytics/export-training` |
| Training report page | GET | `/analytics/training-report` |

---

## Backend controller prefixes (Nest)

| Controller prefix | Domain |
|-------------------|--------|
| `/api/v1/coaching-training/auth` | Login/register |
| `/api/v1/coaching-training/sessions` | AI Trainer runtime |
| `/api/v1/coaching-training/scenarios` | Scenario CRUD + audio |
| `/api/v1/coaching-training/coaching` | Coaching notes/recommendations |
| `/api/v1/coaching-training/training` | Assignments |
| `/api/v1/coaching-training/analytics` | Manager/rep analytics |
| `/api/v1/coaching-training/test` | Health, seed, smoke |

> Note: Extracted route list shows duplicate paths from code generation — **use the service paths above** as the frontend contract.

---

## Test / dev

| Method | Path |
|--------|------|
| GET | `/api/v1/coaching-training/test/health` (if exposed on test controller) |
| POST | `/api/v1/coaching-training/test/seed` |
| POST | `/api/v1/coaching-training/test/smoke` |

---

## Full route list

[BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) → `m09-coaching-training` (reference only; prefer tables above).
