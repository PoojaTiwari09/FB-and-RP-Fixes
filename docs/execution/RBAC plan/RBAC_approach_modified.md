# Modified RBAC Architecture Plan: Supabase + Fine-Grained Permissions

This document outlines an optimized architecture plan that achieves the enterprise-grade "Fine-Grained Permissions" and "Row-Level Security (RLS)" requirements of the New Architecture Plan, **without the massive cost and disruption of migrating away from Supabase.**

By leveraging Supabase's native extensibility, we can achieve the exact same security posture while saving weeks of engineering effort.

---

## 1. System Architecture Overview (The Hybrid Approach)

1. **Identity Provider**: Supabase Auth (Retained).
2. **Authentication Flow**: Next.js frontend uses Supabase SDK to authenticate. Supabase issues a JWT.
3. **Custom Claims Injection**: We use a PostgreSQL Trigger on the `public.users` table to automatically inject the `tenantId`, `role`, and a fine-grained `permissions` array directly into the Supabase JWT's `app_metadata`.
4. **Backend Validation**: NestJS and FastAPI receive the Supabase JWT, mathematically verify its signature, and extract the custom claims.
5. **Granular Authorization**: A new NestJS `PermissionsGuard` checks the `permissions` array (e.g., `["task.create"]`) instead of coarse roles.
6. **Data Isolation (RLS)**: Prisma middleware sets `SET LOCAL app.current_tenant`, enforcing strict Row-Level Security at the database layer.

---

## 2. Implementation Steps

### Phase 1: Injecting Custom Claims into Supabase JWTs ✅ (COMPLETED)

Instead of using Auth0 Rules, we use Supabase's native database triggers to map roles to fine-grained permissions and inject them into the token.

**1. Define the Permissions Matrix in the Database**
Create a table or use a hardcoded PostgreSQL function that maps `UserRole` to an array of permissions.
```sql
-- Example Mapping
ADMIN -> ["task.view", "task.create", "task.delete", "team.manage"]
MANAGER -> ["task.view", "task.create", "team.manage"]
SALES_REP -> ["task.view", "task.create"]
```

**2. Create a Supabase JWT Trigger**
Whenever a user logs in or their role changes, a database trigger updates their `app_metadata`.
```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    claims jsonb;
    user_role public."UserRole";
    user_tenant uuid;
    user_permissions jsonb;
BEGIN
    -- Fetch the user's role and tenant from your custom users table
    SELECT role, tenant_id INTO user_role, user_tenant FROM public.users WHERE id = (event->>'user_id')::uuid;

    -- Map the role to granular permissions
    IF user_role = 'ADMIN' THEN
        user_permissions := '["task.view", "task.create", "task.delete", "user.manage"]'::jsonb;
    ELSIF user_role = 'SALES_REP' THEN
        user_permissions := '["task.view", "task.create"]'::jsonb;
    END IF;

    -- Inject into the JWT claims
    claims := event->'claims';
    claims := jsonb_set(claims, '{tenantId}', to_jsonb(user_tenant));
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{permissions}', user_permissions);

    -- Update the event
    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;
```

---

### Phase 2: Backend JWT Validation Updates ✅ (COMPLETED)

Since Supabase is still signing the token, we do not need to implement JWKS manually. We simply update the existing NestJS `JwtStrategy` to read the new arrays.

**NestJS Configuration (`jwt.strategy.ts`)**
```typescript
async validate(payload: any) {
  // Payload now automatically contains the injected custom claims!
  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role,
    permissions: payload.permissions || [], // e.g. ["task.view", "task.create"]
  };
}
```

---

### Phase 3: Implementing Granular Authorization ✅ (COMPLETED)

We shift the application from checking "Is this user an Admin?" to checking "Does this user have permission to do X?".

**1. Create the Decorator (`permissions.decorator.ts`)**
```typescript
import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
```

**2. Create the Guard (`permissions.guard.ts`)**
```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    // Check if the user's JWT permissions array includes the required permissions
    return requiredPermissions.every(permission => user.permissions.includes(permission));
  }
}
```

**3. Refactor Controllers**
Replace `@Roles(UserRole.ADMIN)` with `@RequirePermissions('user.manage')` across all 11 modules.

---

### Phase 4: Database Row Level Security (RLS) via Prisma ✅ (COMPLETED)

This remains exactly identical to the "New Architecture" plan. 

**1. Enable RLS on all Business Tables**
```sql
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "tasks"
FOR ALL USING ("tenant_id" = current_setting('app.current_tenant')::uuid);
```

**2. Prisma Context Wrapper (`prisma.service.ts`)**
Wrap all queries to ensure the database physically isolates the data.
```typescript
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const tenantId = getContextTenantId(); // Retrieved from AsyncLocalStorage / Request Scope
        return prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
          return query(args);
        });
      },
    },
  },
});
```

---

## 3. Advantages of this Modified Approach

1. **Zero Migration Risk**: Existing users do not need to reset passwords. You don't need to write complex user-migration scripts to copy hashes from Supabase to Auth0.
2. **Enterprise Ready**: You gain the exact same Granular Permissions feature that enterprise clients demand, without the Auth0 enterprise price tag.
3. **Faster Time to Market**: This approach can be implemented in ~1 week by a single senior engineer, whereas an Identity Provider migration would take multiple weeks and pose a high risk of breaking the frontend login flows.
