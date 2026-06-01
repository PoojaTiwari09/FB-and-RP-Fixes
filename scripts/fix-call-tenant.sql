-- Align legacy demo rows with UI x-tenant-id (NEXT_PUBLIC_BACKEND_ORG_ID)
UPDATE call_records
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" = 'dev-tenant-001';

UPDATE transcripts
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" = 'dev-tenant-001';

UPDATE call_notes
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" = 'dev-tenant-001';
