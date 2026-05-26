# Execution Steps: AI Revenue Predictor (M6 Module)

## 1. Prerequisites
- **Node.js**: v20+
- **pnpm**: v9.x (`npm install -g pnpm`)
- **Docker & Docker Compose**: latest version
- **Doppler CLI**: installed (`doppler login`)
- **Python**: 3.12 (for testing the FastAPI service locally without Docker)

## 2. Environment Setup
1. Authenticate with Doppler to fetch secrets:
   ```bash
   doppler login
   doppler setup -p r-revenue-intelligence -c dev
   ```
2. Pull secrets locally into an `.env` file (if needed by your IDE or local scripts):
   ```bash
   doppler secrets download --no-file --format env > .env
   ```

## 3. Database Setup
Ensure your local Postgres container is running, or set your `DATABASE_URL` appropriately. Then run:
```bash
# Navigate to the M6 module
cd modules/m06-forecasting-prediction

# Run Prisma Migrations
pnpm db:migrate

# Seed Historical Data
pnpx ts-node seeds/historical-seed.ts
```

**Expected Output from Seed:**
```
Seed completed successfully!
```

## 4. Start All Services
From the monorepo root:
```bash
# Start required infra (Postgres, Redis) and the Python prediction service
docker-compose up -d
```
*Note: The FastAPI prediction service runs in Docker, accessible on port 8000.*

## 5. Run the App
From the monorepo root, start the Next.js and NestJS development servers:
```bash
pnpm dev
```
- **Next.js Web UI**: `http://localhost:3000`
- **NestJS API**: `http://localhost:3001`
- **FastAPI Prediction**: `http://localhost:8000`

## 6. Run Tests
To run tests specifically for the M6 module:
```bash
cd modules/m06-forecasting-prediction

# Run Unit Tests
pnpm test

# Run Integration Tests
pnpm test:integration
```

## 7. Verify the Feature
1. **Log In**: Authenticate as the demo rep (`rep-01`).
2. **View Dashboard**: Navigate to the forecasting module in the Next.js app to see the **AI Revenue Projection Dashboard**.
3. **Change Baseline**: Toggle between "Avg of last 2 periods" and "Same period last year". Observe UI updates.
4. **Enter Forecast**: Fill out "Commit Forecast" and "Best Case Forecast" for "Enterprise Software". 
5. **Save Draft**: Click "Save Draft" and watch the Activity Log append "Draft created".
6. **Submit**: Click "Submit Forecast". The form fields should lock (read-only mode), and the Lifecycle Tracker moves to "Submitted".
7. **See the Math**: Click the "See the math →" link to open the slide-in drawer showing the exact breakdown of ₹142.6Cr.

## 8. Troubleshooting
- **Prisma Shadow DB Issues**: If migration fails because of shadow DB permissions, ensure your Postgres user has the `CREATEDB` privilege or define `SHADOW_DATABASE_URL` in Doppler.
- **Redis Connection Refused**: Make sure your local Docker container for Redis is running (`docker ps | grep redis`). Check `REDIS_URL` in Doppler.
- **BullMQ Queue Not Draining**: Verify that the NestJS worker module (`M06ForecastingPredictionWorker`) successfully connected to Redis. You will see logs in the NestJS console if the connection drops.
- **Python Service Unavailable**: If NestJS cannot reach the Python service, verify it is running on port 8000. `curl http://localhost:8000/docs` should return the Swagger UI.
