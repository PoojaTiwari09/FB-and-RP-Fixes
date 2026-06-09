/** Dev headers for M01/M02 bridge APIs (TenantGuard). */
export const BACKEND_ORG_ID =
  process.env.NEXT_PUBLIC_BACKEND_ORG_ID ?? '00000000-0000-0000-0000-000000000001';
export const BACKEND_USER_ID =
  process.env.NEXT_PUBLIC_BACKEND_USER_ID ?? 'me';

export function getBridgeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': BACKEND_ORG_ID,
    'x-org-id': BACKEND_ORG_ID,
    'x-user-id': BACKEND_USER_ID,
  };
}
