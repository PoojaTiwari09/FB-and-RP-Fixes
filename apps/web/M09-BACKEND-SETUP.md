# M09 AI Trainer — Backend & Bridge Setup

This UI calls the **M09 backend translation endpoints** under `/api/trainings` and `/api/manager/trainings` (migrated from legacy `/api/v1/coaching-training`).

---

## 1. Backend Server Setup (Terminal 1)

Make sure that your PostgreSQL container is running on port `5433`:
```powershell
# From the monorepo root
docker compose up -d postgres
```

Launch the M09 API server. By default, it runs on port `4009` in standalone mode, or port `3001` under the unified API:
```powershell
# From the monorepo root
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm run dev:m09-api
```

* **Health Check Endpoint**: Verify response status at `http://localhost:4009/` (standalone mode).
* **Demo Users Seeded**: 
  - Manager: `manager@example.com`
  - Rep: `rep@example.com`
  - Password: `password123`

---

## 2. Next.js Frontend Setup (Terminal 2)

Configure environment values for Next.js to map API targets. Next.js client is located under `apps/web`:
```powershell
cd apps/web
copy .env.example .env.local
```

Ensure the API base matches the port (use `3001` for the unified NestJS server, or `4009` for standalone M09):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=false
```

Install and launch Next.js:
```powershell
pnpm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 3. Developer Persona Switching

Switch developer profiles by inserting user cookies into the browser console:

* **Manager view**:
  ```javascript
  document.cookie = "user_role=sales_manager; path=/"; location.reload();
  ```
* **Sales rep view**:
  ```javascript
  document.cookie = "user_role=sales_rep; path=/"; location.reload();
  ```
