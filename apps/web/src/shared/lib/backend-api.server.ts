import 'server-only';

import { cookies } from 'next/headers';

import {
  buildBackendHeaders,
  roleFromCookieValue,
  type BackendRole,
} from './backend-api.shared';

/** Server Components / Route handlers / Server Actions — reads user_role cookie. */
export async function getServerBackendHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const role = roleFromCookieValue(cookieStore.get('user_role')?.value);
  return buildBackendHeaders(role);
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
