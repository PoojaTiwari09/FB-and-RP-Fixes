-- AlterTable
ALTER TABLE "forecast_submissions" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "managerComment" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "managerOverride" DOUBLE PRECISION,
ADD COLUMN     "overriddenAt" TIMESTAMP(3),
ADD COLUMN     "reopenedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "repId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
