-- M09: Row-level security for AI trainer tables (dashboards schema)
-- Apply when DATABASE_URL connects as a role that owns these tables.

ALTER TABLE dashboards.trainerscenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards.trainersessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_trainerscenarios ON dashboards.trainerscenarios;
CREATE POLICY tenant_isolation_trainerscenarios ON dashboards.trainerscenarios
  FOR ALL
  USING (
    tenantid = COALESCE(
      NULLIF(current_setting('app.current_tenant', true), '')::uuid,
      tenantid
    )
  )
  WITH CHECK (
    tenantid = COALESCE(
      NULLIF(current_setting('app.current_tenant', true), '')::uuid,
      tenantid
    )
  );

DROP POLICY IF EXISTS tenant_isolation_trainersessions ON dashboards.trainersessions;
CREATE POLICY tenant_isolation_trainersessions ON dashboards.trainersessions
  FOR ALL
  USING (
    tenantid = COALESCE(
      NULLIF(current_setting('app.current_tenant', true), '')::uuid,
      tenantid
    )
  )
  WITH CHECK (
    tenantid = COALESCE(
      NULLIF(current_setting('app.current_tenant', true), '')::uuid,
      tenantid
    )
  );
