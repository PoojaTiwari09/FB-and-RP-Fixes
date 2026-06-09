/**
 * Standalone M10 dev auth — header-based user + tenant (no JWT).
 * Enable with M10_STANDALONE_AUTH=true in apps/m10-api/.env
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

const DEMO_TENANT = '00000000-0000-0000-0000-000000000001';
const DEMO_USER = '00000000-0000-0000-0000-000000000002';

@Injectable()
export class M10DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['x-org-id'] as string) ||
      DEMO_TENANT;
    const userId = (req.headers['x-user-id'] as string) || DEMO_USER;

    req.user = {
      userId,
      tenantId,
      email: (req.headers['x-email'] as string) || 'dev@m10.local',
    };
    req.tenantId = tenantId;
    return true;
  }
}
