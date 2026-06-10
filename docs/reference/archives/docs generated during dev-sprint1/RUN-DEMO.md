# Running the Unified Demo

The entire application runs consolidated under the **`r-revenue-intelligence-monorepo`** root:

| Workspace Path | Service / Port |
| :--- | :--- |
| `.` | Unified API (M01+M02+M09) on **:3001** |
| `apps/web` | Next.js UI on **:3000** |
| `docker-compose.yml` | PostgreSQL **:5438**, Redis **:6379**, Meilisearch **:7700** |

---

## 1. First-Time Environment Bootstrap

Run this command once from the repository root:
```powershell
.\setup-first-time.ps1
```

---

## 2. Daily Execution Loop (Start / Stop)

### Booting the services
```powershell
.\start-demo.ps1
```
This script launches two background Windows terminals: **Unified API :3001** and **Unified UI :3000**.
- Central UI Console: `http://localhost:3000/engage`
- Unified API Health: `http://localhost:3001/`

### Verifying connection health
```powershell
.\verify-demo-apis.ps1
```

### Stopping services
To cleanly release ports and terminate background node scripts:
```powershell
.\stop-demo.ps1
```

---

## 3. Configuration & Developer Utilities

* **AssemblyAI Keys**: Edit keys under `apps/web/.env.local` or set `ASSEMBLYAI_API_KEY` in the root `.env` followed by running `.\scripts\sync-env.ps1`.
* **Cookie-Based Role Switching**:
  Switch roles in the browser console for testing manager/rep views:
  ```javascript
  document.cookie = "user_role=sales_manager; path=/"; location.reload();
  ```
  Or for sales reps:
  ```javascript
  document.cookie = "user_role=sales_rep; path=/"; location.reload();
  ```
* **Coaching Login Credentials**:
  - Email: `manager@example.com` or `rep@example.com`
  - Password: `password123`
