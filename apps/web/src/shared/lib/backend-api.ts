/**
 * Client-safe backend fetch (no next/headers).
 * For Server Components, use backend-api.server.ts instead.
 */
export {
  BACKEND_ORG_ID,
  BACKEND_MANAGER_USER_ID,
  BACKEND_REP_USER_ID,
  buildBackendHeaders,
  getClientBackendHeaders,
  roleFromCookieValue,
  type BackendRole,
} from './backend-api.shared';

import { getClientBackendHeaders } from './backend-api.shared';

export async function backendFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = {
    ...getClientBackendHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(url, { ...init, headers });
}
