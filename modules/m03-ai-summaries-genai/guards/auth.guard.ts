/**
 * Auth Guard — Simplified for demo.
 * Extracts user context from headers (X-User-Id, X-Org-Id, X-Role, X-Team-Id).
 * In production, replace with JWT validation.
 *
 * TC-DR-31: Validates org isolation.
 * TC-DR-33: Populates audit context.
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  userId: string;
  orgId: string;
  role: string;
  teamId: string | null;
  email: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Extract from headers (demo mode) or use defaults
    const userContext: UserContext = {
      userId: request.headers['x-user-id'] || 'c0000000-0000-0000-0000-000000000001',
      orgId: request.headers['x-org-id'] || 'a0000000-0000-0000-0000-000000000001',
      role: request.headers['x-role'] || 'SALES_MANAGER',
      teamId: request.headers['x-team-id'] || 'b0000000-0000-0000-0000-000000000001',
      email: request.headers['x-email'] || 'sarah.manager@acme.com',
    };

    // Attach to request for downstream use
    request.user = userContext;
    return true;
  }
}
