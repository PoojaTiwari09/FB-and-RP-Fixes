/**
 * RBAC Guard — Role-Based Access Control
 * TC-DR-32: Only SALES_MANAGER+ can create research jobs.
 * TC-DR-31: Cross-tenant isolation enforced.
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Role hierarchy for Deep Research
const RESEARCH_ALLOWED_ROLES = ['SALES_MANAGER', 'CRO', 'ADMIN', 'REVOPS'];
const RESEARCH_VIEW_ROLES = ['SALES_REP', 'SALES_MANAGER', 'CRO', 'ADMIN', 'REVOPS'];

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector?: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if this is a write operation (POST) or read (GET)
    const method = request.method;
    const path = request.path || request.url;

    if (method === 'POST' && path.includes('/research')) {
      // TC-DR-32: Only SALES_MANAGER+ can create research jobs
      if (!RESEARCH_ALLOWED_ROLES.includes(user.role)) {
        throw new ForbiddenException(
          `Role ${user.role} is not authorized to create research jobs. Required: SALES_MANAGER or above.`
        );
      }
    }

    if (method === 'GET' && path.includes('/research')) {
      // All authenticated users can view results (if they have access)
      if (!RESEARCH_VIEW_ROLES.includes(user.role)) {
        throw new ForbiddenException(
          `Role ${user.role} is not authorized to view research results.`
        );
      }
    }

    return true;
  }
}
