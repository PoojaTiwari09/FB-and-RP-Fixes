-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dealName" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "probability" DOUBLE PRECISION,
    "isClosedWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosedLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);
