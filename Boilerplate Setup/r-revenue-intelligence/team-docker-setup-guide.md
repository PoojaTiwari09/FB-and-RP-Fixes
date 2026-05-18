# 🐳 R-Revenue Intelligence Team Docker Setup Guide

This guide explains how to set up, configure, and run the complete R-Revenue Intelligence platform locally using Docker Compose and standard environment files (`.env`).

---

## 🏗️ Architecture Overview

The local environment mirrors our Phase 1 modular monolith architecture to prevent "works on my machine" issues. It runs the following containers:

1. **`api`**: NestJS Backend (Port: `3001`)
2. **`ai-services`**: FastAPI AI Logic Layer (Port: `8000`)
3. **`transcription-service`**: FastAPI Audio Processing (Port: `8001`)
4. **`postgres`**: PostgreSQL 16 with pgvector (Port: `5432`)
5. **`redis`**: Redis Cache & Message Broker (Port: `6379`)
6. **`meilisearch`**: Search Index (Port: `7700`)
7. **`clickhouse`**: Analytics Database (Port: `8123`, `9000`)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Ensure the Docker Engine daemon is running)
2. **Node.js** (v20+) & **pnpm** (For local package management)

---

## 🚀 Step 1: Clone and Configure Environment Variables

We use standard `.env` configuration files for local offline development. 

### 1. Copy the Local Environment Templates
From the root of the project (`Boilerplate Setup/r-revenue-intelligence`), run:

**On macOS/Linux:**
```bash
cp .env.example .env
cp .env.example packages/database/.env
```

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item .env.example packages/database/.env
```

### 2. Populate API Keys
Open `.env` (in the project root) and `.env` (in `packages/database/.env`), and populate your private API keys (`OPENAI_API_KEY`, etc.) as needed for local testing.

---

## 🏃‍♂️ Step 2: Running the Stack

To build and start the entire local environment, run:

```bash
docker compose up -d --build
```

### Verify Running Containers
Check that all services are up and healthy:
```bash
docker compose ps
```
*Note: The `api` container automatically waits for the `postgres` and `redis` services to pass their health checks before booting up.*

---

## 🔧 Step 3: Database Migrations and Seeding

Once the database container is healthy, you need to apply Prisma migrations and seed the database with initial development mock data.

Run the following scripts from the project root:
```bash
pnpm install
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```
*Note: During `pnpm run db:migrate`, when prompted to "Enter a name for the new migration:", type `init` and hit Enter.*

---

## 🛑 Useful Docker Commands

Here are some common commands you will need for daily development:

**View logs for all services:**
```bash
docker compose logs -f
```

**View logs for a specific service (e.g., api):**
```bash
docker compose logs -f api
```

**Stop all services:**
```bash
docker compose down
```

**Completely wipe the database and persistent volumes (Use with caution!):**
```bash
docker compose down -v
```

---

## ⚠️ Optional: Advanced Secrets Management (Doppler)
If the project leads decide to synchronize credentials cloud-wide using Doppler:
1. Authenticate locally: `doppler login`
2. Configure the workspace: `doppler setup` (Select project `revenue_dashboard` and config `dev`)
3. Launch via Doppler: `doppler run -- docker compose up -d --build`
