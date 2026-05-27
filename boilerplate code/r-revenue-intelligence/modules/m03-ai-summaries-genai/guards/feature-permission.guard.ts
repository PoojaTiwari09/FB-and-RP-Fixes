import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/** RESEARCH feature flag — enabled by default in dev (Supabase permission_policies removed). */
@Injectable()
export class FeaturePermissionGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
