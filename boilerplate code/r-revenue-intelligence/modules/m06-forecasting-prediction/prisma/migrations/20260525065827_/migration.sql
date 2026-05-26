-- AlterTable
ALTER TABLE "ai_forecast_snapshots" ADD COLUMN     "regionBreakdown" JSONB;

-- AlterTable
ALTER TABLE "crm_deals" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "hubspotId" TEXT,
ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "lob" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "repUserId" TEXT,
ADD COLUMN     "riskReason" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seed';

-- AlterTable
ALTER TABLE "forecast_audit_log" ADD COLUMN     "actorName" TEXT;

-- AlterTable
ALTER TABLE "forecast_periods" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "forecast_submissions" ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "historical_conversion_rates" ADD COLUMN     "periodName" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "teamName" TEXT;

-- CreateTable
CREATE TABLE "quotas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "repUserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotas_tenantId_periodId_repUserId_key" ON "quotas"("tenantId", "periodId", "repUserId");
