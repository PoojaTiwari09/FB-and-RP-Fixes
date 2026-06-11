import { cookies } from 'next/headers';
import type { UserRole, UserSession } from '@shared/types/shared.types';
import { roleFromCookieValue } from './backend-api.shared';

export async function getUserSession(): Promise<UserSession> {
  const cookieStore = await cookies();
  const role = roleFromCookieValue(cookieStore.get('user_role')?.value);

  const rbacUserStr = cookieStore.get('rbac_user_json')?.value;
  if (rbacUserStr) {
    try {
      const rawUser = rbacUserStr.startsWith('%') ? decodeURIComponent(rbacUserStr) : rbacUserStr;
      const u = JSON.parse(rawUser);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        teamId: u.tenantId ?? 'team-relanto',
      };
    } catch (e) {
      console.error('Failed to parse rbac_user_json:', e);
    }
  }

  return {
    id: 'anonymous',
    name: 'Guest',
    email: 'guest@relanto.com',
    role: 'sales_rep',
    teamId: 'team-relanto',
  };
}

export async function getUserRole(): Promise<UserRole> {
  const session = await getUserSession();
  return session.role;
}

export async function requireRole(allowed: UserRole[]): Promise<UserSession> {
  const session = await getUserSession();
  if (!allowed.includes(session.role)) {
    throw new Error(`Unauthorized: requires one of [${allowed.join(', ')}]`);
  }
  return session;
}
