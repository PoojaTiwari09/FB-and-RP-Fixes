# M03 Runtime Risk Report

**Date:** 2026-05-27

## Mitigated (this pass)

| Risk | Mitigation |
|------|------------|
| API key exposure in browser | Gemini/Supabase stubs; AI on server |
| Tenant leakage on briefs | `org_id`/`tenantId` checks in repository + smoke test |
| Supabase single point of failure | Removed from Nest path |
| FastAPI down | Research simulation + query mock in Nest |
| Invalid summary type | `String? @db.Text` |

## Residual (medium)

| Risk | Notes |
|------|-------|
| Demo auth headers only | M01 JWT not wired to M03 `AuthGuard` yet |
| FastAPI still has Supabase | Sidecar; bypass if not started |
| Dual persistence (Prisma + memory) | Brief may not survive API restart until migration applied |
| `prisma migrate deploy` P3005 | Needs DB baseline before prod |

## Residual (low)

| Risk | Notes |
|------|-------|
| Legacy `src/extracted/` confusion | Documented as non-runtime |
| Client-side rate limit only | Server rate limits recommended later |

## Monitoring recommendations

- Log `BriefService` / `QueryService` mode: `mock` vs `gemini` vs `fastapi`
- Alert on 500 rate for `/api/v1/ai-summaries-genai/*`
- Track research job stuck in `PROCESSING` > 10m
