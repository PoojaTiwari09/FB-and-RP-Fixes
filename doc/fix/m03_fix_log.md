# M03 Fix Log

**Date:** 2026-05-27

| # | Issue | Fix |
|---|-------|-----|
| 1 | Frontend bypasses backend (Supabase/Gemini) | `m03Api.js`, `useM03Workspace`, ChatPanel → `askQuery` |
| 2 | Legacy `supabase.service.ts` | Deleted; services use `m03DataStore` |
| 3 | `generatedSummary` Float? | `AiBrief.generatedSummary String? @db.Text` |
| 4 | Next vs Vite conflict | Vite canonical; `app/EXAMPLE_ONLY.md` |
| 5 | `proxy.py` dev leftover | Deleted |
| 6 | Thin `m03.repository.ts` | Prisma + memory repository |
| 7 | Vite proxy port 3000/8000 | Single proxy → `:3001` |
| 8 | Brief API 500 without migration | Repository try/catch → memory fallback |
| 9 | `testm3.py` harness | Added with 9 cases |
| 10 | QueryService hard fail offline | `mockAnswer()` server-side fallback |

## Files touched (high level)

- `modules/m03-ai-summaries-genai/**` — services, controllers, repository, module
- `packages/database/prisma/schema.prisma` + migration
- `apps/web/.../m03-ai-summaries-genai/src/**` — API client, hooks, components
- `doc/test_result/doc/test_result/doc/test_result/test_case/testm3.py`, `test3.md`
