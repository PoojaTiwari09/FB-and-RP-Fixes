# Run the unified demo (single repo)

Everything runs from **`r-revenue-intelligence-monorepo`**:

| Path | Role |
|------|------|
| `boilerplate code/r-revenue-intelligence` | Unified API (M01+M02+M09) on **:3001** |
| `unified-ui` | Next.js UI on **:3000** |
| `docker-compose.yml` | Postgres **:5433**, Redis **:6379** |

## First time

```powershell
cd C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo
.\setup-first-time.ps1
```

## Every session (reset ports + start)

```powershell
cd C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo
.\stop-demo.ps1
.\start-demo.ps1
```

Wait for two PowerShell windows: **Unified API :3001** and **Unified UI :3000**.

- **App:** http://localhost:3000/engage  
- **AI Call Reviewer:** http://localhost:3000/calls/ai-reviewer  
- **API health:** http://localhost:3001  

```powershell
.\verify-demo-apis.ps1
```

## AssemblyAI

In the UI: **AssemblyAI API Key** on the calls list, or set `ASSEMBLYAI_API_KEY` in `unified-ui/.env.local`.

## Manager role (browser console)

```javascript
document.cookie = "user_role=sales_manager; path=/"; location.reload();
```

## Login (M09 training)

- `manager@example.com` / `rep@example.com`  
- Password: `password123`

## Stop

```powershell
.\stop-demo.ps1
docker stop revenue_intel_db revenue_intel_redis   # optional
```
