-- CreateTable
CREATE TABLE "forecast_periods" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "revenueTarget" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_forecast_snapshots" (
    "snapshotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "predictedAmount" DOUBLE PRECISION NOT NULL,
    "confidenceRangeLow" DOUBLE PRECISION NOT NULL,
    "confidenceRangeHigh" DOUBLE PRECISION NOT NULL,
    "modelInputs" JSONB NOT NULL,
    "inputPipelineValue" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "ai_forecast_snapshots_pkey" PRIMARY KEY ("snapshotId")
);

-- CreateTable
CREATE TABLE "pipeline_coverage_metrics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "openPipelineValue" DOUBLE PRECISION NOT NULL,
    "weightedPipelineValue" DOUBLE PRECISION NOT NULL,
    "closedWonAmount" DOUBLE PRECISION NOT NULL,
    "coverageRatio" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_coverage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_conversion_rates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "computedFromPeriod" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_conversion_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "repUserId" TEXT NOT NULL,
    "lob" TEXT NOT NULL,
    "commitForecast" DOUBLE PRECISION NOT NULL,
    "bestCaseForecast" DOUBLE PRECISION,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_audit_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "forecastSubmissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_forecast_snapshots_idempotencyKey_key" ON "ai_forecast_snapshots"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "ai_forecast_snapshots" ADD CONSTRAINT "ai_forecast_snapshots_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "forecast_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_submissions" ADD CONSTRAINT "forecast_submissions_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "forecast_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
