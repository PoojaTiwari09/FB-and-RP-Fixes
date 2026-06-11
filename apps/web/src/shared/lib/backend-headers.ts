import { buildAuthHeaders } from './backend-api.shared';

/** @deprecated Use buildAuthHeaders — identity via JWT Bearer only. */
export const BACKEND_ORG_ID =
  process.env.NEXT_PUBLIC_BACKEND_ORG_ID ?? '00000000-0000-0000-0000-000000000001';

/** Bridge headers for M01/M02/M09 API calls — JWT Bearer from login cookies. */
export function getBridgeHeaders(): Record<string, string> {
  return buildAuthHeaders();
}
