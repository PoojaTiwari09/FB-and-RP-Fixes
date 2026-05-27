# M09 — Runtime Stability Report

**Date:** 2026-05-27

## Boot validation

| Check | Result |
|-------|--------|
| `M09CoachingTrainingModule` loads in unified API | PASS |
| `PrismaService` connects (`SELECT 1`) | PASS |
| `LlmService` constructs without `ConfigService` (optional + env fallback) | PASS |
| `SchedulerService` initializes | PASS (log: 12h refresh) |
| No duplicate Nest package DI crash on M09 | PASS (pnpm overrides from M01/M02 pass) |

## API stability (smoke window)

| Endpoint | p50 latency | Errors |
|----------|-------------|--------|
| `GET /test/health` | ~30–60 ms | 0 |
| `POST /test/smoke` | ~97 ms | 0 |
| `POST /sessions/send-message` | ~20 ms (mock) | 0 |
| `POST /sessions/end` | ~29 ms (mock) | 0 |
| 5× parallel health | all 200 | 0 |

## Fixes applied this session

1. Repository no longer calls non-existent `prisma.trainingScenario` on unified client.
2. UUID-safe unified persistence (no `scenario-1` strings in Postgres UUID columns).
3. Test controller seed uses repository, not raw Prisma legacy models.
4. Health endpoint no longer counts legacy tables.

## Known non-critical items

- Standalone M09 `main.ts` double-prefix (`/api/api/...`) if run alone — unified API path is correct.
- `M09Worker` coaching agent runs in-process (not BullMQ) — acceptable for dev.
