# Frontend translator layer (`/api/...`)

Legacy UI keeps using **`/api/v1/...`** unchanged. New Figma UI uses **`/api/...`** only.

```
New UI  →  frontend-api/ (Zod in → service → mapper → exact JSON out)
              ↓
          internal services / Prisma (unchanged)
Legacy UI → /api/v1/... (unchanged)
```

## Module map

| Spec file | Module | Bridge folder | Base paths |
|-----------|--------|---------------|------------|
| `Call_List Sales_Rep.txt` | M01 | `m01-capture-transcription/frontend-api/` | `/api/calls`, `/api/brief-*`, upload |
| `smartcall_Figma_breakdown.txt` | M01 | same | `/api/smart-call/*` |
| `callsearch_screen_breakdown_v2.txt` | M02 | `m02-conversation-intelligence/frontend-api/` | `/api/search/calls`, `/api/filters/options` |
| `Ai_Call_Reviewer_Manager.txt` | M02 | `m02-frontend-call-reviews.*` | `/api/call-reviews`, `/api/analytics/*` |
| `Ai_Call_Reviewer_SalesRep.txt` | M01 | mapper `mapAiReviewerCallRow` | `GET /api/calls?view=ai-reviewer` |
| `Figma_Coaching-AI-Trainer.txt` | M09 | `m09-coaching-training/frontend-api/` | `/api/trainings`, `/api/manager/trainings` |

## Run (dev headers)

```http
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002
```

M09 uses JWT or the same dev headers via `M09FrontendAuthGuard`.

## Examples

```http
GET http://localhost:3001/api/calls?page=1&size=10
GET http://localhost:3002/api/call-reviews?page=1&size=20
GET http://localhost:3002/api/search/calls?tab=calls&page=1&size=20
GET http://localhost:4009/api/trainings
```

Specs copied under `doc/execution/integration/specs/`.
