\timing on
SELECT count(*) AS transcript_rows FROM transcripts;
SELECT count(*) AS uuid_tenant_calls FROM call_records WHERE "tenantId" = '00000000-0000-0000-0000-000000000001';
SELECT count(*) AS dev_tenant_calls FROM call_records WHERE "tenantId" = 'dev-tenant-001';

EXPLAIN (ANALYZE, BUFFERS)
SELECT t.id
  FROM transcripts t
  JOIN call_records cr ON cr.id = t."callId"
 WHERE cr."tenantId" = '00000000-0000-0000-0000-000000000001'
   AND to_tsvector('english', t."fullText") @@ plainto_tsquery('english', 'demo')
 ORDER BY ts_rank(to_tsvector('english', t."fullText"), plainto_tsquery('english', 'demo')) DESC
 LIMIT 100;
