-- M10 Data & Compliance — migration
-- Adds compliance, GDPR, ePrivacy tables and destinationName column.
-- Run against: revenue_intelligence database (revenuegraph schema)
-- Apply: psql $DATABASE_URL -f migration.sql
--        or: cd packages/database && npx prisma db push

-- ─── Add destinationName to existing connections table ────────────────────────
ALTER TABLE revenuegraph.m10_data_cloud_connections
  ADD COLUMN IF NOT EXISTS "destinationName" TEXT NOT NULL DEFAULT 'default';

-- ─── Compliance Policies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_compliance_policies (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid       UUID        NOT NULL,
  name           TEXT        NOT NULL,
  description    TEXT,
  channel        TEXT        NOT NULL,
  region         TEXT,
  "regionFamily" TEXT        NOT NULL DEFAULT 'GLOBAL',
  "ruleDefinition" JSONB     NOT NULL DEFAULT '{}',
  "isActive"     BOOLEAN     NOT NULL DEFAULT TRUE,
  version        INTEGER     NOT NULL DEFAULT 1,
  "createdBy"    TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_compliance_policies_tenant_active
  ON revenuegraph.m10_compliance_policies (tenantid, "isActive");

CREATE INDEX IF NOT EXISTS idx_m10_compliance_policies_tenant_channel
  ON revenuegraph.m10_compliance_policies (tenantid, channel);

-- ─── CRM Opt-Outs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_crm_optouts (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid        UUID        NOT NULL,
  "contactEmail"  TEXT        NOT NULL,
  channel         TEXT        NOT NULL,
  "isOptedOut"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "lastSyncedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT m10_crm_optouts_tenantid_contactemail_channel_key
    UNIQUE (tenantid, "contactEmail", channel)
);

CREATE INDEX IF NOT EXISTS idx_m10_crm_optouts_tenant_email
  ON revenuegraph.m10_crm_optouts (tenantid, "contactEmail");

-- ─── Consent Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_consent_logs (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid        UUID        NOT NULL,
  "contactEmail"  TEXT        NOT NULL,
  "consentType"   TEXT        NOT NULL,
  status          TEXT        NOT NULL,
  source          TEXT        NOT NULL,
  "loggedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_consent_logs_tenant_email
  ON revenuegraph.m10_consent_logs (tenantid, "contactEmail");

-- ─── Compliance Audit Entries ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_compliance_audit_entries (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid             UUID        NOT NULL,
  "correlationId"      TEXT        NOT NULL UNIQUE,
  "recipientEmail"     TEXT        NOT NULL,
  channel              TEXT        NOT NULL,
  decision             TEXT        NOT NULL,
  "reasonCode"         TEXT        NOT NULL,
  explanation          TEXT,
  "triggeredPolicyId"  UUID,
  "evaluationMetadata" JSONB       NOT NULL DEFAULT '{}',
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT m10_compliance_audit_entries_policy_fkey
    FOREIGN KEY ("triggeredPolicyId")
    REFERENCES revenuegraph.m10_compliance_policies(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_m10_compliance_audit_entries_tenant
  ON revenuegraph.m10_compliance_audit_entries (tenantid);

CREATE INDEX IF NOT EXISTS idx_m10_compliance_audit_entries_tenant_email
  ON revenuegraph.m10_compliance_audit_entries (tenantid, "recipientEmail");

-- ─── GDPR Data Subject Requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_gdpr_data_subject_requests (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid         UUID        NOT NULL,
  "contactEmail"   TEXT        NOT NULL,
  "requestType"    TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',
  "requestDate"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completionDate" TIMESTAMPTZ,
  details          JSONB,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_gdpr_dsar_tenant_email
  ON revenuegraph.m10_gdpr_data_subject_requests (tenantid, "contactEmail");

CREATE INDEX IF NOT EXISTS idx_m10_gdpr_dsar_tenant_status
  ON revenuegraph.m10_gdpr_data_subject_requests (tenantid, status);

-- ─── GDPR Processing Records (RoPA) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_gdpr_processing_records (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid         UUID        NOT NULL,
  purpose          TEXT        NOT NULL,
  "dataCategories" TEXT[]      NOT NULL DEFAULT '{}',
  "lawfulBasis"    TEXT        NOT NULL,
  "retentionPeriod" TEXT       NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_gdpr_processing_records_tenant
  ON revenuegraph.m10_gdpr_processing_records (tenantid);

-- ─── GDPR Data Breach Records ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_gdpr_data_breach_records (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid         UUID        NOT NULL,
  "incidentDate"   TIMESTAMPTZ NOT NULL,
  "detectionDate"  TIMESTAMPTZ NOT NULL,
  description      TEXT        NOT NULL,
  "affectedData"   TEXT[]      NOT NULL DEFAULT '{}',
  status           TEXT        NOT NULL DEFAULT 'investigating',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_gdpr_data_breach_records_tenant
  ON revenuegraph.m10_gdpr_data_breach_records (tenantid);

-- ─── ePrivacy Consents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_eprivacy_consents (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid        UUID        NOT NULL,
  "contactEmail"  TEXT        NOT NULL,
  channel         TEXT        NOT NULL,
  purpose         TEXT        NOT NULL,
  status          TEXT        NOT NULL,
  source          TEXT        NOT NULL,
  "loggedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_eprivacy_consents_tenant_email
  ON revenuegraph.m10_eprivacy_consents (tenantid, "contactEmail");

-- ─── Suppression Entries ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_suppression_entries (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid        UUID        NOT NULL,
  "contactEmail"  TEXT        NOT NULL,
  reason          TEXT        NOT NULL,
  "addedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT m10_suppression_entries_tenantid_contactemail_key
    UNIQUE (tenantid, "contactEmail")
);

-- ─── GDPR Deletion Log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenuegraph.m10_gdpr_deletions (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantid         UUID        NOT NULL,
  "dsarId"         UUID        NOT NULL,
  "contactEmail"   TEXT        NOT NULL,
  "tablesAffected" TEXT[]      NOT NULL DEFAULT '{}',
  "deletedRows"    INTEGER     NOT NULL DEFAULT 0,
  "executionDate"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m10_gdpr_deletions_tenant_dsar
  ON revenuegraph.m10_gdpr_deletions (tenantid, "dsarId");
