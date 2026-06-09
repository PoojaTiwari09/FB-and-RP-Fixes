/** Matches m09-api dev seed (see m09-memory.store.ts). */
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_REP_USER_ID = 'me';
const DEFAULT_MANAGER_USER_ID = '00000000-0000-0000-0000-000000000002';

function envOrDefault(raw: string | undefined, fallback: string): string {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;
  return trimmed;
}

export const BACKEND_ORG_ID = envOrDefault(
  process.env.NEXT_PUBLIC_BACKEND_ORG_ID ?? process.env.BACKEND_ORG_ID,
  DEFAULT_ORG_ID,
);
export const BACKEND_REP_USER_ID = envOrDefault(
  process.env.NEXT_PUBLIC_BACKEND_REP_USER_ID ?? process.env.BACKEND_REP_USER_ID,
  DEFAULT_REP_USER_ID,
);
export const BACKEND_MANAGER_USER_ID = envOrDefault(
  process.env.NEXT_PUBLIC_BACKEND_MANAGER_USER_ID ?? process.env.BACKEND_MANAGER_USER_ID,
  DEFAULT_MANAGER_USER_ID,
);

export type BackendRole = 'sales_rep' | 'sales_manager';

export function roleFromCookieValue(raw: string | undefined): BackendRole {
  return raw === 'sales_manager' ? 'sales_manager' : 'sales_rep';
}

export function buildBackendHeaders(role: BackendRole = 'sales_rep'): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': BACKEND_ORG_ID,
    'x-org-id': BACKEND_ORG_ID,
    'x-user-id': role === 'sales_manager' ? BACKEND_MANAGER_USER_ID : BACKEND_REP_USER_ID,
  };
}

/** Browser / client components — reads document.cookie. */
export function getClientBackendHeaders(): Record<string, string> {
  if (typeof document === 'undefined') {
    return buildBackendHeaders('sales_rep');
  }
  const match = document.cookie.match(/(?:^|;\s*)user_role=([^;]+)/);
  const role = roleFromCookieValue(match?.[1] ? decodeURIComponent(match[1]) : undefined);
  return buildBackendHeaders(role);
}
