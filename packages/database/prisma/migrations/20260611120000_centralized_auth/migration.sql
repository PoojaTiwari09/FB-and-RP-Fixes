-- Centralized JWT auth: tenant/user status + refresh tokens

CREATE TYPE "public"."TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

ALTER TABLE "public"."Tenant"
  ADD COLUMN IF NOT EXISTS "status" "public"."TenantStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "public"."RefreshToken" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "public"."RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "public"."RefreshToken"("expiresAt");

ALTER TABLE "public"."RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
