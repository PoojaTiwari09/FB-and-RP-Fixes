# Monorepo Execution Steps

Run all commands from a PowerShell terminal in the monorepo root:
`C:\Users\Relanto\OneDrive\INTEGRATION-105\r-revenue-intelligence-monorepo`

---

## 1. Docker Compose (Database & Redis)

Start the local database and cache services:

```powershell
# Start containers
docker compose up -d

# Verify containers are running (revenue_intel_db, revenue_intel_redis)
docker ps
```

---

## 2. Setup Environment & Dependencies (First Time Only)

Configure the workspace, install packages, and generate database schemas automatically:

```powershell
# Run first-time setup
.\setup-first-time.ps1
```

---

## 3. Daily Start

Launch both the Unified API and the Frontend UI services:

```powershell
# Start API (port 3001) and UI (port 3000)
.\start-demo.ps1
```

---

## 4. Verify API Status

Ensure the services are online and responding:

```powershell
# Check health of the endpoints
.\verify-demo-apis.ps1
```

---

## 5. Stop Demo

Shut down all processes and release listening ports:

```powershell
# Stop dev servers and release ports
.\stop-demo.ps1

# Stop docker containers (optional)
docker compose down
```
