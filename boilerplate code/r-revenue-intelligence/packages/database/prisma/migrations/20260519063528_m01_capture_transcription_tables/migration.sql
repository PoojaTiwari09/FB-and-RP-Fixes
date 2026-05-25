-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateTable
CREATE TABLE "call_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "callDate" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "callType" TEXT NOT NULL,
    "callSource" TEXT NOT NULL,
    "participants" TEXT[],
    "callOwner" TEXT NOT NULL,
    "accountId" TEXT,
    "opportunityId" TEXT,
    "audioUrl" TEXT,
    "transcriptStatus" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "summary" TEXT,
    "keyHighlights" JSONB,
    "nextSteps" TEXT[],
    "talkRatio" JSONB,
    "assemblyAiJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utterances" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isLowConfidence" BOOLEAN NOT NULL DEFAULT false,
    "sequenceIndex" INTEGER NOT NULL,

    CONSTRAINT "utterances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_shares" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "sharedByUserId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "sharedWithType" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_records_tenantId_idx" ON "call_records"("tenantId");

-- CreateIndex
CREATE INDEX "call_records_tenantId_callDate_idx" ON "call_records"("tenantId", "callDate");

-- CreateIndex
CREATE INDEX "call_records_tenantId_transcriptStatus_idx" ON "call_records"("tenantId", "transcriptStatus");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_callId_key" ON "transcripts"("callId");

-- CreateIndex
CREATE INDEX "transcripts_tenantId_idx" ON "transcripts"("tenantId");

-- CreateIndex
CREATE INDEX "utterances_transcriptId_idx" ON "utterances"("transcriptId");

-- CreateIndex
CREATE INDEX "utterances_transcriptId_sequenceIndex_idx" ON "utterances"("transcriptId", "sequenceIndex");

-- CreateIndex
CREATE INDEX "call_notes_callId_idx" ON "call_notes"("callId");

-- CreateIndex
CREATE INDEX "call_notes_tenantId_idx" ON "call_notes"("tenantId");

-- CreateIndex
CREATE INDEX "call_shares_tenantId_idx" ON "call_shares"("tenantId");

-- CreateIndex
CREATE INDEX "call_shares_callId_idx" ON "call_shares"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "call_shares_callId_sharedWithId_sharedWithType_key" ON "call_shares"("callId", "sharedWithId", "sharedWithType");

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utterances" ADD CONSTRAINT "utterances_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_notes" ADD CONSTRAINT "call_notes_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_shares" ADD CONSTRAINT "call_shares_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
