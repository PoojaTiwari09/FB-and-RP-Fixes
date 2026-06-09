import { cookies } from 'next/headers';
import type { UserRole, UserSession } from '@shared/types/shared.types';

// In production: replace with real JWT validation / session decoding.
// The cookie `user_role` drives all role decisions server-side.
// Set it to 'sales_manager' or 'sales_rep' to switch personas.

const MOCK_SESSIONS: Record<UserRole, UserSession> = {
  sales_manager: {
    id: 'mgr-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'sales_manager',
    teamId: 'team-west',
  },
  sales_rep: {
    id: 'rep-001',
    name: 'Alex Chen',
    email: 'alex.chen@company.com',
    role: 'sales_rep',
    teamId: 'team-west',
  },
};

export async function getUserSession(): Promise<UserSession> {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get('user_role')?.value;
  const role: UserRole = rawRole === 'sales_manager' ? 'sales_manager' : 'sales_rep';

  const rbacUserStr = cookieStore.get('rbac_user_json')?.value;
  if (rbacUserStr) {
    try {
      const rawUser = rbacUserStr.startsWith('%') ? decodeURIComponent(rbacUserStr) : rbacUserStr;
      const u = JSON.parse(rawUser);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: role, // Use the role from user_role cookie to support manager switching views if needed
        teamId: 'team-relanto',
      };
    } catch (e) {
      console.error('Failed to parse rbac_user_json:', e);
    }
  }

  return MOCK_SESSIONS[role];
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
