import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  M09_DEV_ORG_ID,
  M09_DEV_REP_ID,
} from '../repositories/m09-memory.store';

/**
 * JWT for production; dev fallback: x-tenant-id (org) + x-user-id (rep).
 */
@Injectable()
export class M09FrontendAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization;

    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = this.jwt.verify(auth.split(' ')[1]);
        req.user = {
          id: payload.sub,
          org_id: payload.org_id || payload.tenantId || M09_DEV_ORG_ID,
          role: payload.role || 'rep',
        };
        req.orgId = req.user.org_id;
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const orgId = req.headers['x-tenant-id'] || req.headers['x-org-id'] || M09_DEV_ORG_ID;
    const userId = req.headers['x-user-id'] || M09_DEV_REP_ID;
    req.user = { id: userId, org_id: orgId, role: 'rep' };
    req.orgId = orgId;
    return true;
  }
}
