-- 008_audit_logs.sql
-- Audit trail for all admin write operations on Deal Drivers entities.
-- Referenced by board-warning-config.controller.ts and warning-definitions.controller.ts.

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  VARCHAR(64) NOT NULL,   -- 'board_warning_config' | 'warning_definition'
  entity_id    UUID        NOT NULL,
  action       VARCHAR(16) NOT NULL,   -- 'CREATE' | 'UPDATE' | 'DELETE'
  actor_id     UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  changes      JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);
