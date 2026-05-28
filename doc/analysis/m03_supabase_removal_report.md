# M03 Supabase Removal Report

**Date:** 2026-05-27  
**Status:** Complete (NestJS layer)

## Removed

| Item | Action |
|------|--------|
| `config/supabase.service.ts` | Deleted |
| `config/supabase.module.ts` | Deleted |
| `SupabaseModule` import in `m03-ai-summaries-genai.module.ts` | Removed |
| Nest services using Supabase | Migrated to `m03-data.store.ts` + Prisma repository |

## Frontend

| Item | Action |
|------|--------|
| `src/lib/supabase.js` | Stubbed (returns `null`) |
| `useSupabaseData.js` | Superseded by `useM03Workspace.js` on active routes |
| Browser `@supabase/supabase-js` usage in active Vite pages | Removed from ChatPanel, SummaryDetailPanel, EntityListPanel, BriefHistoryDrawer |

## Not removed (documented legacy)

- `database/supabase_schema.sql`, `seeds/supabase_seed.sql` — reference only
- `fastapi/main.py` + `fastapi/requirements.txt` — still lists `supabase` for optional FastAPI sidecar
- `src/extracted/*` Next.js artifacts — quarantined under `app/EXAMPLE_ONLY.md`

## Runtime dependency check

- No `SUPABASE_*` env required for M03 NestJS smoke tests
- Grep of `modules/m03-ai-summaries-genai` shows no live `@supabase/supabase-js` imports in Nest code
