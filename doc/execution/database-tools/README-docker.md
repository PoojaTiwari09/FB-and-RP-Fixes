# 🐘 Local PostgreSQL Setup (Docker)

This folder contains a **Dockerized PostgreSQL** database configured to work with the Prisma schema.
All tables you create via `prisma migrate` are stored in a **named Docker volume** — they are **never lost when the container stops**.

---

## Prerequisites

| Tool | Minimum Version | Download |
|------|----------------|----------|
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| pnpm / npm | any | pre-installed with Node |

---

## Quick Start (Every Team Member)

### 1. Start the Database Container

```bash
# From this folder (PRISMA_TEST/)
docker compose up -d
```

This pulls `postgres:16-alpine`, creates the database, and mounts a named volume called **`revenue_intel_pgdata`**.

### 2. Copy the environment file

```bash
cp .env.example .env
```

> `.env` is already pre-filled with the correct credentials. No changes needed for local dev.

### 3. Push the Prisma schema to the database

```bash
# If you're running Prisma for the FIRST TIME (no migrations folder):
npx prisma db push --schema=./schema.prisma

# OR if there are existing migration files:
npx prisma migrate deploy --schema=./schema.prisma
```

### 4. Generate the Prisma client

```bash
npx prisma generate --schema=./schema.prisma
```

### 5. Verify in Prisma Studio (optional visual browser)

```bash
npx prisma studio --schema=./schema.prisma
```

Open http://localhost:5555 to browse all your tables.

---

## Container Lifecycle

| Command | What happens to your data |
|---------|--------------------------|
| `docker compose up -d` | Starts container. Data intact. |
| `docker compose down` | Stops container. ✅ **Data is PRESERVED** in the volume. |
| `docker compose down -v` | Stops container AND **deletes all data** (nuclear reset). |
| `docker compose restart` | Restarts container. Data intact. |

---

## Connection Details

| Field | Value |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `revenue_intelligence` |
| Username | `revenue_user` |
| Password | `revenue_pass` |
| Schema | `public` |

---

## How it Works (Volume Persistence)

```
docker compose up
       │
       ▼
 postgres:16-alpine container
       │
       │  reads/writes data to
       ▼
 Named Volume: revenue_intel_pgdata
       │
       │  physically stored on your machine at
       ▼
 (Docker-managed path, e.g. /var/lib/docker/volumes/revenue_intel_pgdata)
```

Because the volume lives **outside the container**, stopping or removing the container does NOT delete your tables or data.

---

## Sharing with Others

Commit these files to Git:
- ✅ `docker-compose.yml`
- ✅ `.env.example`
- ✅ `schema.prisma`
- ❌ `.env` (add to `.gitignore` — contains local credentials)

Each teammate clones the repo, runs `docker compose up -d`, copies `.env.example` → `.env`, and runs `prisma db push` once.

---

## Troubleshooting

**Port 5432 already in use:**
```bash
# Find what's using it
netstat -aon | findstr :5432   # Windows
# Change the host port in docker-compose.yml: "5433:5432"
# Update DATABASE_URL in .env to use port 5433
```

**Container not healthy:**
```bash
docker compose logs postgres
```

**Reset everything cleanly:**
```bash
docker compose down -v
docker compose up -d
npx prisma db push --schema=./schema.prisma
```
