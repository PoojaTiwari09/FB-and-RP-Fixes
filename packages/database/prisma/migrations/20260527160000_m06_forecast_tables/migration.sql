-- M06 Forecasting & Prediction tables (centralized from module-local Prisma)

CREATE TABLE IF NOT EXISTS "forecast_periods" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "revenueTarget" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "forecast_periods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_forecast_snapshots" (
    "snapshot_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "predicted_amount" DOUBLE PRECISION NOT NULL,
    "confidence_range_low" DOUBLE PRECISION NOT NULL,
    "confidence_range_high" DOUBLE PRECISION NOT NULL,
    "model_inputs" JSONB NOT NULL,
    "input_pipeline_value" DOUBLE PRECISION,
    "region_breakdown" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,
    CONSTRAINT "ai_forecast_snapshots_pkey" PRIMARY KEY ("snapshot_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_forecast_snapshots_idempotency_key_key" ON "ai_forecast_snapshots"("idempotency_key");
CREATE INDEX IF NOT EXISTS "ai_forecast_snapshots_tenant_period_idx" ON "ai_forecast_snapshots"("tenant_id", "period_id", "computed_at");

CREATE TABLE IF NOT EXISTS "forecast_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "rep_user_id" TEXT NOT NULL,
    "lob" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "commit_forecast" DOUBLE PRECISION NOT NULL,
    "best_case_forecast" DOUBLE PRECISION,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "manager_override" DOUBLE PRECISION,
    "manager_comment" TEXT,
    "manager_id" TEXT,
    "manager_name" TEXT,
    "approved_at" TIMESTAMP(3),
    "reopened_at" TIMESTAMP(3),
    "overridden_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "forecast_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "forecast_executive_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "baseline" TEXT,
    "region" TEXT,
    "submission_id" TEXT,
    "payload" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,
    CONSTRAINT "forecast_executive_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "forecast_executive_snapshots_idempotency_key_key" ON "forecast_executive_snapshots"("idempotency_key");

CREATE TABLE IF NOT EXISTS "m06_prediction_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "m06_prediction_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "m06_prediction_jobs_idempotency_key_key" ON "m06_prediction_jobs"("idempotency_key");

ALTER TABLE "ai_forecast_snapshots" ADD CONSTRAINT "ai_forecast_snapshots_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "forecast_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forecast_submissions" ADD CONSTRAINT "forecast_submissions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "forecast_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forecast_executive_snapshots" ADD CONSTRAINT "forecast_executive_snapshots_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "forecast_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "m06_prediction_jobs" ADD CONSTRAINT "m06_prediction_jobs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "forecast_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
