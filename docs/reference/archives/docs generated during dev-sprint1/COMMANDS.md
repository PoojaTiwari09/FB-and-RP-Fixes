# Execution Command List

This document lists developer commands for setup, database migrations, and execution within the consolidated monorepo.

---

## Prerequisites
* **Node.js**: version `20.x` or later.
* **pnpm**: version `10.14.x` (enforced via package.json engine constraint). Do not run `npm install`.

---

## 1. Directory Context
All workspace commands must be executed directly from the monorepo root:
```powershell
cd r-revenue-intelligence-monorepo
```

---

## 2. Dependency Setup
Install node dependencies and generate Prisma clients across all workspace apps:
```powershell
pnpm install
```

---

## 3. Launch Commands

### Running Unified Monolith Mode (Recommended)
Launches the NestJS backend and Next.js frontend concurrently:
```powershell
.\start-demo.ps1
```
* **Frontend UI**: `http://localhost:3000/engage`
* **Backend Monolithic API**: `http://localhost:3001`

### Running Standalone Modules
Launches individual Vite clients and independent NestJS microservices:
```powershell
.\scripts\start-all.ps1
```

---

## 4. Prisma & Database Management

Ensure that the environment variable `DATABASE_URL` is set:
```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
```

### Sync DB Schema
```powershell
pnpm run db:migrate
```

### Generate Prisma Client
```powershell
pnpm run db:generate
```

---

## 5. Port Diagnostics & Cleanup

If you need to query active ports:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

To free all ports immediately and stop background Node processes:
```powershell
.\scripts\free_ports_all.ps1
```
