import 'server-only';

import { cookies } from 'next/headers';
import { buildAuthHeaders, roleFromCookieValue } from './backend-api.shared';

/** Server Components — attaches Bearer token from httpOnly-accessible cookies. */
export async function getServerBackendHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('access_token')?.value ||
    cookieStore.get('rbac_token')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${decodeURIComponent(token)}`;
  }

  return headers;
}

export async function serverBackendFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = {
    ...(await getServerBackendHeaders()),
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(url, { ...init, headers });
}

export { roleFromCookieValue };
