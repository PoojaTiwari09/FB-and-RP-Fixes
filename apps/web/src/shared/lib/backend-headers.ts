/** Dev headers for M01/M02 bridge APIs (TenantGuard). */
export const BACKEND_ORG_ID =
  process.env.NEXT_PUBLIC_BACKEND_ORG_ID ?? '00000000-0000-0000-0000-000000000001';

export function getBridgeHeaders(): Record<string, string> {
  let userId = 'anonymous';
  let userRole = 'SALES_REP';

  if (typeof document !== 'undefined') {
    const matchUser = document.cookie.match(/(?:^|; )user_id=([^;]*)/);
    if (matchUser && matchUser[1]) {
      userId = matchUser[1];
    }
    const matchRole = document.cookie.match(/(?:^|; )user_role=([^;]*)/);
    if (matchRole && matchRole[1]) {
      userRole = matchRole[1];
    }
  }

  return {
    'Content-Type': 'application/json',
    'x-tenant-id': BACKEND_ORG_ID,
    'x-org-id': BACKEND_ORG_ID,
    'x-user-id': userId,
    'x-user-role': userRole,
  };
}
