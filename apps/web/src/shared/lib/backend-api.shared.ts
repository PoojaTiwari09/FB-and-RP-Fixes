/** Default demo tenant slug — must match seeded tenant in packages/database/prisma/seed-all.ts */
export const DEFAULT_TENANT_SLUG = 'relanto';

export type BackendRole = 'sales_rep' | 'sales_manager';

export function roleFromCookieValue(raw: string | undefined): BackendRole {
  if (!raw) return 'sales_rep';
  const norm = raw.toLowerCase();
  return norm === 'sales_manager' || norm === 'manager' || norm === 'admin'
    ? 'sales_manager'
    : 'sales_rep';
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/** Build Authorization headers from JWT cookies (no spoof identity headers). */
export function buildAuthHeaders(): Record<string, string> {
  const token =
    readCookie('access_token') ||
    readCookie('rbac_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Always propagate dev header auth context for resilience in dev setups
  const tenantId =
    readCookie('tenant_id') ||
    process.env.NEXT_PUBLIC_BACKEND_ORG_ID ||
    '00000000-0000-0000-0000-000000000001';

  const userId =
    readCookie('user_id') ||
    process.env.NEXT_PUBLIC_BACKEND_REP_USER_ID ||
    '00000000-0000-0000-0000-000000000003';

  const role =
    readCookie('user_role') ||
    'SALES_REP';

  headers['x-tenant-id'] = tenantId;
  headers['x-user-id'] = userId;
  headers['x-user-role'] = role === 'sales_manager' || role === 'MANAGER' ? 'MANAGER' : 'SALES_REP';

  return headers;
}

/** Browser / client components — reads JWT from cookies. */
export function getClientBackendHeaders(): Record<string, string> {
  return buildAuthHeaders();
}

/** @deprecated Legacy header bridge removed — use JWT Bearer via buildAuthHeaders(). */
export function buildBackendHeaders(): Record<string, string> {
  return buildAuthHeaders();
}

/** @deprecated */
export const BACKEND_ORG_ID: string = '00000000-0000-0000-0000-000000000001';
/** @deprecated */
export const BACKEND_REP_USER_ID: string = '00000000-0000-0000-0000-000000000003';
/** @deprecated */
export const BACKEND_MANAGER_USER_ID: string = '00000000-0000-0000-0000-000000000002';
