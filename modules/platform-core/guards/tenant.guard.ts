import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';

/**
 * TenantGuard
 *
 * Reads the tenant identifier from `x-tenant-id` (or `req.user.tenantId`
 * once JWT auth is in place) and writes it onto `req.tenantId` so every
 * downstream controller / service / repository can scope its queries.
 *
 * Throws UnauthorizedException(401) explicitly when missing — previously
 * the guard returned `false` which NestJS surfaced as a generic 403 with
 * no error body, making debugging tenant-isolation issues painful.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerTenant = request.headers?.['x-tenant-id'];
    const userTenant   = request.user?.tenantId;
    const tenantId     = headerTenant || userTenant;

    if (!tenantId || typeof tenantId !== 'string') {
      throw new UnauthorizedException(
        'Missing tenant identifier. Set the x-tenant-id header or authenticate.',
      );
    }

    request.tenantId = tenantId;
    
    // RBAC: Extract User ID and Role
    const headerUser = request.headers?.['x-user-id'];
    const headerRole = request.headers?.['x-user-role'];
    
    request.userId = request.user?.id ?? headerUser ?? 'anonymous';
    request.userRole = request.user?.role ?? headerRole ?? 'SALES_REP';
    
    return true;
  }
}
