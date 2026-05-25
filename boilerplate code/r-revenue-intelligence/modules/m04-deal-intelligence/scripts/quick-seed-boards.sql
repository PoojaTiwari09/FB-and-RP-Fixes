-- Quick seed script to create sample boards
-- Run this with: psql -U postgres -d deal_intelligence_dealboards -f scripts/quick-seed-boards.sql

-- Get the admin user ID
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE role = 'ADMIN' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found';
    END IF;
    
    -- Delete existing boards (optional)
    DELETE FROM deal_boards;
    
    -- Create sample boards
    INSERT INTO deal_boards (id, name, description, audience, status, owner_id, is_locked, allow_rep_column_reorder, prevent_manual_deal_override, published_at, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'Q1 2024 Pipeline', 'Active deals for Q1 2024 forecast', ARRAY['AE', 'MANAGER']::text[], 'PUBLISHED', admin_id, false, false, true, NOW(), NOW(), NOW()),
        (gen_random_uuid(), 'High Risk Deals', 'Deals requiring immediate attention', ARRAY['MANAGER', 'EXEC']::text[], 'PUBLISHED', admin_id, false, false, true, NOW(), NOW(), NOW()),
        (gen_random_uuid(), 'Closing This Month', 'Deals expected to close within 30 days', ARRAY['AE', 'MANAGER']::text[], 'PUBLISHED', admin_id, false, false, true, NOW(), NOW(), NOW());
    
    RAISE NOTICE 'Successfully created 3 sample boards';
END $$;
