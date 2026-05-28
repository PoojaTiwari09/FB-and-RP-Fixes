# M03 Scalability Report

**Date:** 2026-05-27

## Current design

| Component | Scale characteristic |
|-----------|---------------------|
| `m03DataStore` | In-process Map — single instance only |
| Research jobs | Memory + optional FastAPI — no distributed queue yet |
| Bull `m03-queue` | Registered; worker not on hot path for smoke |
| Brief/chat Prisma | Indexed `(tenantId, briefType)` — OK for moderate volume |

## Bottlenecks

1. **In-memory store** — not horizontally scalable; replace with Prisma tables for jobs/reports
2. **Synchronous brief generation** — blocks request thread; should move to async worker
3. **Query 60s axios timeout** — acceptable for dev; add circuit breaker for prod
4. **No response caching at API layer** — ChatPanel still has client cache only

## Safe optimizations (future)

- Persist `research_jobs` / `research_reports` in PostgreSQL
- Redis cache for briefs by `(tenantId, briefType, entityId)`
- Background Gemini via worker + job status polling (M01/M02 pattern)
- Stream SSE for long summaries

## Load test suggestion

- 10 concurrent `/query` — expect mock < 100ms each
- 3 concurrent research jobs per user — enforced in `ResearchController`
