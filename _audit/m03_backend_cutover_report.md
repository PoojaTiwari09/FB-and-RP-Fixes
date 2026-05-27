# M03 Backend Cutover Report

**Date:** 2026-05-27  
**Status:** Complete

## Objective

Route all M03 AI flows through NestJS (`apps/api`) instead of browser-direct Supabase/Gemini/FastAPI.

## Architecture (new)

```
Vite UI → /api/v1/ai-summaries-genai/* (NestJS :3001)
         ├─ WorkspaceController (CRM seed + chat history)
         ├─ QueryController → QueryService (FastAPI optional, mock fallback)
         ├─ ResearchController → ResearchService → m03DataStore
         ├─ BriefController → BriefService → M03Repository (Prisma + memory)
         └─ M03TestController (/test/health, /test/smoke)
```

## Frontend changes

- Added `src/api/m03Api.js` as sole HTTP client
- `useM03Workspace.js` replaces `useSupabaseData.js` for active pages
- `ChatPanel.jsx` calls `askQuery()` — no browser Gemini
- `SummaryDetailPanel.jsx` / `EntityListPanel.jsx` use Nest brief + workspace APIs
- Vite proxy: all `/api` → `http://localhost:3001`

## Backend changes

- New controllers: `brief`, `workspace`, `m03-test`, `BriefCompatController` (`/api/ai-summaries/:type-brief/:id`)
- Services refactored: `research`, `report`, `feedback`, `cross-object-joiner` use `m03DataStore`
- `QueryService` mock fallback when FastAPI offline

## Validation

`test_case/testm3.py` — **9/9 PASS**

## Remaining (non-blocking)

- FastAPI `main.py` still contains legacy Supabase paths (optional sidecar; Nest is canonical)
- M03 auth uses demo headers (`x-org-id`, `x-user-id`) — align with M01 JWT in a follow-up
