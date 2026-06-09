# M02 — Conversation Intelligence API

| | Value |
|--|--------|
| **Web** | http://localhost:5175 |
| **API** | http://localhost:3002 |
| **Base paths** | `/api/v1/conversation-intelligence`, `/api/v1/m02-conversation-intelligence` |
| **pnpm** | `dev:m02-api`, `dev:m02-web` |

---

## Frontend configuration

| Variable | Purpose |
|----------|---------|
| `VITE_M02_STANDALONE=true` | Proxy `/api` → 3002 |
| `VITE_M02_API_URL` | Direct API root (optional) |
| `NEXT_PUBLIC_M02_API_URL` | Next.js |
| `VITE_TENANT_ID`, `VITE_USER_ID` | `x-tenant-id`, `x-user-id` |

**Client files**

| File | Role |
|------|------|
| `apps/web/.../m02-conversation-intelligence/lib/api-env.js` | `m02ApiV1()` → `http://localhost:3002/api/v1` |
| `apps/web/.../ConversationLibraryView.tsx` | Main library UI (many `fetch` calls) |
| `apps/web/.../TrackerManagement.tsx` | Trackers |

**API prefix used in UI:** `m02ApiV1()` = `{host}/api/v1` — paths below are appended (e.g. `/conversation-intelligence/...`).

---

## Frontend ↔ backend mapping (primary UI)

| UI area | Method | Backend path (after `/api/v1`) |
|---------|--------|--------------------------------|
| Conversation search | GET | `/conversation-intelligence/conversations/search` |
| List conversations | GET | `/conversation-intelligence/conversations` |
| Conversation detail | GET | `/conversation-intelligence/conversations/:id` |
| Saved searches | GET/POST | `/conversation-intelligence/saved-searches` |
| Upload transcript | POST | `/conversation-intelligence/upload-transcript` |
| Trackers list | GET | `/conversation-intelligence/trackers` |
| Tracker stats / detections | GET | `/conversation-intelligence/trackers/stats`, `.../detections` |
| Create/update/delete tracker | POST/PUT/DELETE | `/conversation-intelligence/trackers`, `.../trackers/:id` |
| Vocabulary | GET/POST/DELETE | `/conversation-intelligence/vocabulary`, `.../vocabulary/:id` |
| Vocabulary stats | GET | `/conversation-intelligence/vocabulary/stats` |
| Topics list | GET | `/m02-conversation-intelligence/topics?tenantId=` |
| Add/remove topic | POST | `/m02-conversation-intelligence/topics/add`, `.../remove` |
| Conversation topics | GET/POST/DELETE | `/conversation-intelligence/conversations/:id/topics`, `/m02-.../topics/tags/:tagId` |
| M01 ingest hook | POST | `/conversation-intelligence/ingest/from-transcription` |
| Translate | POST | `/m02-conversation-intelligence/translate` |
| Translate settings | GET/POST | `/m02-conversation-intelligence/translate/settings` |

---

## Headers

```http
Content-Type: application/json
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002
```

---

## Cross-module links (UI only)

| Button | Target web |
|--------|------------|
| M01 | `VITE_M01_WEB_URL` → 5174 |
| M03 | `VITE_M03_WEB_URL` → 5177 |
| M09 | `VITE_M09_WEB_URL` → 5176/login |

---

## Full route list

[BACKEND-ROUTES-REFERENCE.md](./BACKEND-ROUTES-REFERENCE.md) → `m02-conversation-intelligence`.
