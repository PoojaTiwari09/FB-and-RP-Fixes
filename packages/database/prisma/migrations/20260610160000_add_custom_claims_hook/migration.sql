-- Create the Supabase custom access token hook function
-- This maps the UserRole from public."User" to granular permissions

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    claims jsonb;
    user_role public."UserRole";
    user_tenant uuid;
    user_permissions jsonb;
BEGIN
    -- Fetch the user's role and tenant from the public."User" table
    -- The event->>'user_id' is the Supabase Auth user ID, which matches our User.id
    SELECT role, tenantid INTO user_role, user_tenant 
    FROM public."User" 
    WHERE id = (event->>'user_id')::uuid;

    -- Map the role to granular permissions array
    IF user_role = 'ADMIN' THEN
        user_permissions := '["task.view", "task.create", "task.delete", "task.assign", "opportunity.view", "opportunity.create", "opportunity.update", "opportunity.delete", "customer.view", "customer.create", "customer.update", "customer.delete", "report.view", "report.export", "user.view", "user.invite", "user.manage", "settings.view", "settings.manage", "ai.query", "ai.report"]'::jsonb;
    ELSIF user_role = 'MANAGER' THEN
        user_permissions := '["task.view", "task.create", "task.update", "task.assign", "opportunity.view", "opportunity.create", "opportunity.update", "customer.view", "customer.create", "customer.update", "report.view", "report.export", "user.view", "user.invite", "ai.query", "ai.report"]'::jsonb;
    ELSIF user_role = 'SALES_REP' THEN
        user_permissions := '["task.view", "task.create", "task.update", "opportunity.view", "opportunity.create", "opportunity.update", "customer.view", "customer.create", "customer.update", "ai.query"]'::jsonb;
    ELSIF user_role = 'ANALYST' THEN
        user_permissions := '["report.view", "report.export", "ai.query", "ai.report"]'::jsonb;
    ELSIF user_role = 'EXECUTIVE' THEN
        user_permissions := '["opportunity.view", "customer.view", "report.view", "report.export", "ai.query", "ai.report"]'::jsonb;
    ELSE
        user_permissions := '[]'::jsonb;
    END IF;

    -- Inject into the JWT claims
    claims := event->'claims';
    
    -- Ensure claims object exists
    IF claims IS NULL THEN
        claims := '{}'::jsonb;
    END IF;

    -- Inject tenantId, role, and permissions into app_metadata inside the claims
    claims := jsonb_set(claims, '{app_metadata, tenantId}', to_jsonb(user_tenant), true);
    claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role), true);
    claims := jsonb_set(claims, '{app_metadata, permissions}', user_permissions, true);

    -- Also put them at the top level for easy access in our JwtStrategy
    claims := jsonb_set(claims, '{tenantId}', to_jsonb(user_tenant), true);
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role), true);
    claims := jsonb_set(claims, '{permissions}', user_permissions, true);

    -- Update the event with the new claims
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
EXCEPTION
    WHEN OTHERS THEN
        -- If user is not found or error occurs, return unmodified event
        RETURN event;
END;
$$;

-- Note: To fully activate this hook, it must be registered in the Supabase Dashboard
-- under Authentication > Hooks > Custom Access Token.
