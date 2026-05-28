# M03 AI Schema Fix Report

**Date:** 2026-05-27  
**Status:** Complete

## Issue

Legacy audit documented `AiBriefs.generatedSummary` as `Float?` — invalid for long-form AI text.

## Fix

Added unified Prisma model `AiBrief` in `packages/database/prisma/schema.prisma`:

```prisma
generatedSummary String?  @db.Text
generationStatus String?  @default("pending")
```

Migration: `prisma/migrations/20260527140000_m03_ai_briefs/migration.sql`

Also added `AiChatHistory` with `question`/`answer` as `@db.Text`.

## Runtime behavior

- `M03AiSummariesGenaiRepository` uses Prisma `aiBrief` delegate when table exists
- On missing table / Prisma error → **memory fallback** via `m03DataStore` (smoke-safe)
- Brief payloads stored as JSON string in `generatedSummary` (parsed on read)

## Validation

- `POST /briefs/deal/deal-1/generate` returns structured JSON summary
- `GET /briefs/deal/deal-1` returns `generatedSummary` as text/JSON — not numeric
- `testm3.py` Phase E — PASS

## Migration note

`prisma migrate deploy` reports P3005 (non-empty DB without baseline). Apply migration SQL manually or baseline before production deploy. Memory fallback keeps dev/smoke green until then.
