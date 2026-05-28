# M09 — Backend Performance Report

**Date:** 2026-05-27  
**Mode:** `AI_MOCK_MODE` / no `GROQ_API_KEY` (mock LLM)

## Latency (client-side, smoke harness)

| Endpoint | Approx. ms |
|----------|------------|
| `GET /test/health` | 27–62 |
| `POST /test/seed` | 70–79 |
| `POST /test/smoke` (full E2E) | 97 |
| `POST /sessions/send-message` | 20 |
| `POST /sessions/end` | 29 |
| `GET /scenarios` | 13–18 |
| 5× parallel `/test/health` | all < 100 ms |

## Observations

- In-memory repository avoids Prisma round-trips for dev smoke — very fast.
- Unified `trainerscenarios` read may add ~10–20 ms when DB populated; not on critical path for mock smoke.
- No N+1 detected in smoke flow (single scenario list, single session thread).
- `SchedulerService` 12h job — no impact on request path.

## With live Groq

Expect `POST /sessions/send-message` to rise to **500–3000 ms** depending on model and prompt size. Use `AI_MOCK_MODE=true` for CI smoke; use `GROQ_API_KEY` for integration tests only.

## Recommendations

- Add response cache for `/scenarios` per `org_id` (short TTL) when list grows.
- Use `withTenantContext` only on unified writes that must enforce RLS, not every read in dev.
