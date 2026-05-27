# M03 UI Architecture Decision

**Date:** 2026-05-27  
**Decision:** **Vite + React** is canonical; Next.js artifacts are reference-only.

## Evidence

| Signal | Canonical |
|--------|-----------|
| `index.html` → `src/main.jsx` → `src/App.jsx` | Vite |
| Active routes in `src/pages/*` | Vite |
| `vite.config.js` dev server + proxy | Vite |
| `app/page.tsx` | Legacy Next — not in build path |

## Actions taken

- Added `app/EXAMPLE_ONLY.md` documenting Next artifacts as non-runtime
- Did **not** delete `src/extracted/` (large reference tree) — excluded from production path
- Removed `proxy.py` (HubSpot CORS dev script; unused by Vite build)
- Unified API proxy to Nest `:3001`

## Deployment assumption

Ship the Vite module under `apps/web/src/modules/m03-ai-summaries-genai/` with `pnpm vite build` (or monorepo web build that includes this module). Do not deploy `app/page.tsx` as a Next entry.
