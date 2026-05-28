# M01 — Capture & Transcription API

| | Value |
|--|--------|
| **Web** | http://localhost:5174 |
| **API** | http://localhost:3001 |
| **Base path** | `/api/v1` |
| **pnpm** | `dev:m01-api`, `dev:m01-web` |

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `VITE_M01_STANDALONE=true` | Vite standalone mode |
| `VITE_M01_API_URL` | Empty = use Vite proxy to 3001; or `http://localhost:3001` |
| `NEXT_PUBLIC_M01_API_URL` | Next.js override |
| `VITE_TENANT_ID` / `NEXT_PUBLIC_TENANT_ID` | `x-tenant-id` header |

**Client files**

| File | Role |
|------|------|
| `apps/web/src/modules/m01-capture-transcription/lib/api-env.js` | `m01ApiV1()`, `DEV_TENANT_ID` |
| `apps/web/src/modules/m01-capture-transcription/api/calls.api.ts` | Calls CRUD |
| `apps/web/src/modules/m01-capture-transcription/api/ai-extractor.api.ts` | AI field extractor |
| `apps/web/src/modules/m01-capture-transcription/api/integrations.api.ts` | Connectors |

**Resolved API root:** `{M01_API}/api/v1/capture-transcription` (via `m01ApiV1('/capture-transcription')`)

---

## Frontend ↔ backend mapping (calls)

| Frontend function | Method | Backend path |
|-------------------|--------|--------------|
| `listCalls()` | GET | `/api/v1/capture-transcription/calls` |
| `getCall(id)` | GET | `/api/v1/capture-transcription/calls/:id` |
| `createCall(data)` | POST | `/api/v1/capture-transcription/calls` |
| `uploadAudio(file)` | POST | `/api/v1/capture-transcription/calls/upload` |
| `searchTranscripts(q)` | GET | `/api/v1/capture-transcription/calls/search?q=...` |
| `searchWithinCall(callId, q)` | GET | `/api/v1/capture-transcription/calls/:id/search?q=...` |
| `createNote` / `updateNote` / `deleteNote` | POST/PUT/DELETE | `/api/v1/capture-transcription/calls/:id/notes[...]` |
| `shareCall` | POST | `/api/v1/capture-transcription/calls/:id/share` |
| `updateUtterance` | PATCH | `/api/v1/capture-transcription/utterances/:id` |
| `getNextSteps` / `addNextStep` / … | GET/POST/PATCH/DELETE | `/api/v1/capture-transcription/calls/:id/next-steps[...]` |
| `extractAI(callId)` | POST | `/api/v1/capture-transcription/calls/:id/extract-ai` |
| `deleteCall(callId)` | DELETE | `/api/v1/capture-transcription/calls/:id` |

**Headers:** `Content-Type: application/json`, `x-tenant-id` (upload uses multipart, tenant header only).

---

## AI extractor (`/api/v1/ai-extractor`)

| Frontend | Method | Path |
|----------|--------|------|
| List fields | GET | `/api/v1/ai-extractor/fields` |
| Create field | POST | `/api/v1/ai-extractor/fields` |
| Update field | PATCH | `/api/v1/ai-extractor/fields/:id` |
| Delete field | DELETE | `/api/v1/ai-extractor/fields/:id` |
| Toggle / test field | POST | `/api/v1/ai-extractor/fields/:id/toggle`, `.../test` |
| Extraction results | GET | `/api/v1/ai-extractor/calls/:callId/results` |
| Run extraction | POST | `/api/v1/ai-extractor/calls/:callId/extract` |

---

## Integrations (`/api/v1/integrations`)

| Method | Path |
|--------|------|
| GET | `/api/v1/integrations` |
| POST | `/api/v1/integrations/:provider/connect` |
| POST | `/api/v1/integrations/:provider/disconnect` |

---

## Webhooks (server-to-server)

| Method | Path |
|--------|------|
| POST | `/api/v1/webhooks/zoom` |
| POST | `/api/v1/webhooks/teams` |

---

## Health / root

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | Service info JSON (`m01-api`) |

---

## Full route list

See [BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) section `m01-capture-transcription`.
