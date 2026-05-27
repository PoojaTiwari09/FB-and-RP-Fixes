-- M03: AI briefs + chat history (generatedSummary as TEXT, not float)
CREATE TABLE IF NOT EXISTS "public"."ai_briefs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "briefType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "generatedSummary" TEXT,
    "generationStatus" TEXT DEFAULT 'pending',
    "sourceReferences" JSONB,
    "llmModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_briefs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_briefs_tenantId_briefType_entityId_key"
    ON "public"."ai_briefs"("tenantId", "briefType", "entityId");
CREATE INDEX IF NOT EXISTS "ai_briefs_tenantId_briefType_idx"
    ON "public"."ai_briefs"("tenantId", "briefType");

CREATE TABLE IF NOT EXISTS "public"."ai_chat_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_chat_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_chat_history_tenantId_createdAt_idx"
    ON "public"."ai_chat_history"("tenantId", "createdAt");
