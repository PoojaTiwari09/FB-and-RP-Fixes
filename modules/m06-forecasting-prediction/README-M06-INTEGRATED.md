# M06 — Forecasting & Prediction (Integrated Monorepo Guide)

This document covers the **AI Revenue Predictor** and **Forecast Boards** features in the integrated environment (shared `apps/unified-api` + `apps/web` setup).

---

## 1. Environment Placement & Architecture

In the unified setup, the components reside in:

| Layer | Workspace Location | Local Port |
| :--- | :--- | :---: |
| **Backend** | `modules/m06-forecasting-prediction/` imported by **`apps/unified-api`** | **3001** |
| **Frontend** | `apps/web/src/features/forecast-boards/` & `ai-revenue-predictor/` | **3000** |
| **Database** | `packages/database/` (Prisma) | PostgreSQL **5433** (Docker) |
| **Queue** | BullMQ `m06-queue` (Redis **6379**) | Redis (Docker) |
| **Python AI** | `apps/ai-services/` | **8000** (Docker) |

---

## 2. API Endpoints Map

The forecasting service exposes endpoints under the NestJS server on port `3001`:

### 2.1 Forecast Boards
* **Prefix**: `/api/v1/m06-forecasting-prediction`
* **Controller**: `controllers/forecast-periods.controller.ts` (`ForecastPeriodsController`)
* **Key routes**:
  - `GET /periods`: Retrieve quarters list
  - `GET /periods/:id/board`: Load collaborative grid (quotas, coverage, AI predictions)
  - `POST /periods/:id/submit`: Save a versioned forecast submission

### 2.2 AI Revenue Predictor
* **Prefix**: `/api/v1/forecasting`
* **Key routes**:
  - `GET /periods/:id/ai-prediction`: Load ML forecast projections & explainability factors
  - `POST /periods/:id/ai-prediction/run`: Enqueue background scoring job
  - `GET /team/board`: Team rollup board (manager dashboard)
  - `GET /executive/board`: CRO organization-wide rollup board

---

## 3. UI Routes & Frontend Code

* **Web Console Route**: `http://localhost:3000/forecast-boards` and `http://localhost:3000/ai-revenue-predictor`
* **Source UI Code location**:
  - `apps/web/src/features/forecast-boards/`: Collaborative submit matrices
  - `apps/web/src/features/ai-revenue-predictor/`: AI explaining drawers, manager override controls

---

## 4. Quick Start commands

To start the database and servers together, execute commands from the **monorepo root**:

```powershell
# 1. Start Docker services
docker compose up -d postgres redis

# 2. Seed M06 forecasting data
.\seed-m06.ps1

# 3. Launch UI and API
.\start-demo.ps1
```

Once running:
* Frontend runs at `http://localhost:3000/engage`
* Swagger docs run at `http://localhost:3001/api/docs`
