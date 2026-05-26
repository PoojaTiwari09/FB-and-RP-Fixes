# Module Analysis — `m09-coaching-training`

> Order #10 in the lifecycle (per your chart): "Coaching insights, AI trainer scenarios, rep benchmarking". Depends on M06 (`forecast.submitted`) and the full pipeline.

---

## 1. Purpose

Two product surfaces:

1. **Sales Coaching Insights** — rep benchmarking: talk ratio, longest monologue, question rate, interactivity, top topics.
2. **AI Trainer** — simulated roleplay scenarios (persona + context + difficulty + scorecard).

Maps to TDDs:

* `M9 Coaching & Training/TDD/TDD-Sales Coaching Insights.md`
* `M9 Coaching & Training/TDD/TDD-AI Trainer.md`
* `M9 Coaching & Training/drift analysis m9.md`

---

## 2. Layout

```
modules/m09-coaching-training/
├── m09-coaching-training.module.ts            (uses ConfigModule + JwtModule.register)
├── prisma/schema.prisma
├── controllers/
│   ├── m09.controller.ts                       AppController + Sessions + Scenarios + Coaching + Training + Analytics + Test + JwtAuthGuard + RolesGuard (everything in one file)
│   └── auth.controller.ts                      login/logout
├── services/
│   ├── m09.service.ts                          LlmService + SessionsService + ScenariosService + CoachingService + TrainingService + AnalyticsService + SchedulerService (all in one file)
│   └── prisma.service.ts
├── repositories/m09.repository.ts
├── workers/m09.worker.ts                       (queue name TBD)
└── seeds/, schemas/, interfaces/, events/, database/, migrations/
```

> ⚠ `m09.controller.ts` and `m09.service.ts` aggregate **many** classes per file (Sessions / Scenarios / Coaching / Training / Analytics / Test + guards). Split into per-feature files when stabilising.

---

## 3. Frontend

`apps/web/src/modules/m09-coaching-training/` is its own Vite app (74 files):

* Roleplay simulator UI (probably calling `apps/api` for AI completion).
* Coaching dashboards (rep snapshots + recommendations).

Not part of `pnpm dev`. See `implementation_changes.md` §F4.

---

## 4. API surface

Base path: `/api/v1/coaching-training`.

| Method | Path |
| ------ | ---- |
| POST   | `/auth/login`, `/auth/logout`, `/auth/refresh` |
| GET    | `/scenarios`, `/scenarios/:id` |
| POST   | `/scenarios` (creates `trainerscenarios` row) |
| POST   | `/sessions` (start a roleplay) |
| GET    | `/sessions/:id` |
| POST   | `/sessions/:id/turns` (push a user message → LLM reply) |
| POST   | `/sessions/:id/complete` (compute scorecard) |
| GET    | `/coaching/snapshots?userId=&period=` (read `coachingsnapshots`) |
| POST   | `/coaching/recommendations/generate` (writes `coachingrecommendations`) |
| GET    | `/analytics/leaderboard?period=2026Q2` |

---

## 5. Database (unified + secondary schemas)

The dashboards-schema tables in `packages/database/prisma/schema.prisma` are owned by M09:

| Model | Notes |
| ----- | ----- |
| `coachingsnapshots` (dashboards) | per-tenant + per-user + per-period snapshot (talk ratio, top topics, etc.). |
| `coachingrecommendations` (dashboards) | text recommendations with confidence. |
| `trainerscenarios` (dashboards) | persona + context + difficulty + scorecard. |
| `trainersessions` (dashboards) | conversation JSON + scorecard result + status. |
| `TrainingSessions` (unified, also `training_sessions`) | similar to `trainersessions`; ⚠ duplicate field `sessionid`. |
| `TrainingSessionScores` (unified) | per-criterion score with evaluator type/id. |

> Pick one of `trainersessions` or `TrainingSessions` (and similarly `coachingsnapshots`/`CoachingSnapshots`). The dashboards-schema versions have RLS comments — preserve those. See §B2 of `implementation_changes.md`.

---

## 6. Events

| Direction | Event |
| --------- | ----- |
| IN  | `forecast.submitted` (M06) | refresh rep leaderboard. |
| IN  | `deal.risk.flagged` (M04) | trigger coaching recommendation. |
| OUT | `coaching.recommendation.created` |
| OUT | `trainer.session.completed` |

---

## 7. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | Auth provided locally (`auth.controller.ts` + `JwtModule.register` with `fallback_secret`). Should live in a shared platform-auth module instead of M04 + M09 each owning their own. |
| HIGH | All controllers + services squeezed into single files — hard to test individually. |
| MEDIUM | LLM provider is hard-coded to OpenAI/Gemini in `LlmService` — make pluggable. |
| MEDIUM | RLS policies declared via Prisma `///` comments in `dashboards.*` models but no actual `CREATE POLICY` SQL. |
| LOW | Vendored frontend includes voice-simulation assets — heavy and shouldn't ship in the main bundle. |

---

## 8. Smoke checklist

* `POST /api/v1/coaching-training/auth/login` with default credentials returns a JWT.
* `GET /api/v1/coaching-training/scenarios` returns seeded `trainerscenarios`.
* `POST /api/v1/coaching-training/sessions` creates a `trainersessions` row in status `started`.
* `POST /api/v1/coaching-training/sessions/:id/turns` returns an AI reply (or stub).
* `GET /api/v1/coaching-training/coaching/snapshots?userId=u1&period=2026Q2` returns `[]`.
