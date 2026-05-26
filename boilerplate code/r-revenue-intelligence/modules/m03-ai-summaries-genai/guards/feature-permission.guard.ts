/**
 * Feature Permission Guard
 * Checks if RESEARCH feature is enabled for the user's org/team.
 * TC-DR-31: Org-level feature flag enforcement.
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class FeaturePermissionGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const client = this.supabase.getClient();
    if (!client) {
      // If no Supabase, allow (demo mode)
      return true;
    }

    try {
      // Check team-level permission first, then org-level
      let policy = null;

      if (user.teamId) {
        const teamResult = await client
          .from('permission_policies')
          .select('*')
          .eq('org_id', user.orgId)
          .eq('team_id', user.teamId)
          .eq('feature', 'RESEARCH')
          .single();

        if (teamResult.data) {
          policy = teamResult.data;
        }
      }

      // Fallback to org-level
      if (!policy) {
        const orgResult = await client
          .from('permission_policies')
          .select('*')
          .eq('org_id', user.orgId)
          .is('team_id', null)
          .eq('feature', 'RESEARCH')
          .single();

        if (orgResult.data) {
          policy = orgResult.data;
        }
      }

      if (policy && !policy.is_enabled) {
        throw new ForbiddenException('Deep Research feature is disabled for your organization.');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      // If permission check fails, allow in demo mode
      return true;
    }
  }
}
