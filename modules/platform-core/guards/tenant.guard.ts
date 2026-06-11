import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { toFrontendRole } from '../auth/role-mapper';
import type { UserRole } from '@rri/database';

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
    console.log(`[TenantGuard] Path: ${request.url}, Headers:`, request.headers);
    const allowDevHeaders = process.env.ALLOW_DEV_HEADER_AUTH === 'true';
    const headerTenant = allowDevHeaders ? request.headers?.['x-tenant-id'] : undefined;
    const userTenant = request.user?.tenantId;
    const tenantId = userTenant || headerTenant;

    if (!tenantId || typeof tenantId !== 'string') {
      throw new UnauthorizedException(
        'Missing tenant context. Authenticate with a valid Bearer token.',
      );
    }

    request.tenantId = tenantId;
    request.tenantid = tenantId;

    request.userId = request.user?.sub ?? request.user?.id ?? 'anonymous';
    request.userName = request.user?.name;
    request.backendRole = request.user?.role ?? 'SALES_REP';
    request.userRole = toFrontendRole((request.user?.role ?? 'SALES_REP') as UserRole);
    if (request.user?.tenantId && !request.tenantId) {
      request.tenantId = request.user.tenantId;
      request.tenantid = request.user.tenantId;
    }
    
    return true;
  }
}
