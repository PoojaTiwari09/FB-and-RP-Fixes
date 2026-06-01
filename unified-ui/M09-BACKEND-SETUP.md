# M09 AI Trainer — link to backend bridge

This UI talks to the **M09 translator API** at `/api/trainings` and `/api/manager/trainings` (not legacy `/api/v1/coaching-training`).

## 1. Backend (Terminal 1)

```powershell
cd "c:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"

docker compose -f "..\..\docker-compose.yml" up -d
# Or from repo root: cd to r-revenue-intelligence-monorepo then: docker compose up -d

$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm install
pnpm run db:generate
pnpm run dev:m09-api
```

Wait for: `M09 API listening on http://localhost:4009`

Health check: http://localhost:4009/

Demo logins (legacy UI / Swagger): `manager@example.com` / `rep@example.com` — password `password123`  
Bridge dev headers (used by this UI): `x-tenant-id` + `x-user-id` (see `.env.example`).

## 2. Frontend (Terminal 2)

```powershell
cd "c:\Users\Relanto\Downloads\final_product\Revenue-Intelligence-UI\Revenue-Intelligence-UI"

copy .env.example .env.local
# Ensure:
#   NEXT_PUBLIC_API_BASE_URL=http://localhost:4009
#   NEXT_PUBLIC_USE_MOCK_DATA=false

npm install
npm run dev
```

Open: **http://localhost:3000**

## 3. Demo roles (browser console)

**Manager**

```javascript
document.cookie = "user_role=sales_manager; path=/";
location.reload();
```

**Sales rep**

```javascript
document.cookie = "user_role=sales_rep; path=/";
location.reload();
```

The UI sends `x-user-id` for manager vs rep to match backend seed users.

## 4. Verify backend is used

- Network tab: calls go to `http://localhost:4009/api/trainings` or `/api/manager/trainings`
- Backend terminal shows incoming requests
- If API fails, UI falls back to mock data (check `NEXT_PUBLIC_USE_MOCK_DATA` is `false`)

## 5. Optional: chat without Groq

Session messages call `POST /api/trainings/.../messages` first; Groq in the browser is only a fallback.
