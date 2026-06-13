-- ── Local M06 dev DB setup (run as postgres superuser) ──────────────────
-- Database: m06_pooja  (already created)
-- Run: psql -U postgres -p 5432 -d m06_pooja -f setup-local-db.sql

-- 1. Create dedicated user (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'revenue_user') THEN
    CREATE ROLE revenue_user LOGIN PASSWORD 'revenue_pass';
  END IF;
END$$;

-- 2. Grant ownership / access
GRANT ALL PRIVILEGES ON DATABASE m06_pooja TO revenue_user;
GRANT ALL ON SCHEMA public       TO revenue_user;
GRANT ALL ON SCHEMA ingestion    TO revenue_user;
GRANT ALL ON SCHEMA dashboards   TO revenue_user;
GRANT ALL ON SCHEMA revenuegraph TO revenue_user;

-- 3. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Done!
SELECT 'Local m06_pooja database is ready.' AS status;
