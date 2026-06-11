const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'relanto';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  frontendRole: 'sales_rep' | 'sales_manager';
  tenantId: string;
  tenantSlug: string;
  permissions: string[];
}

export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthUser;
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

function authUrl(path: string): string {
  return `${BACKEND_URL}/api/v1/auth${path}`;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data;
}

export function persistAuthSession(payload: AuthTokenPayload): void {
  const maxAge = payload.expiresIn;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `access_token=${encodeURIComponent(payload.accessToken)}; path=/; max-age=${maxAge}${secure}; SameSite=Lax`;
  document.cookie = `refresh_token=${encodeURIComponent(payload.refreshToken)}; path=/; max-age=${7 * 24 * 60 * 60}${secure}; SameSite=Lax`;
  document.cookie = `rbac_token=${encodeURIComponent(payload.accessToken)}; path=/; max-age=${maxAge}${secure}; SameSite=Lax`;
  document.cookie = `user_id=${encodeURIComponent(payload.user.id)}; path=/; max-age=${maxAge}${secure}; SameSite=Lax`;
  document.cookie = `user_role=${encodeURIComponent(payload.user.frontendRole)}; path=/; max-age=${maxAge}${secure}; SameSite=Lax`;
  document.cookie = `rbac_user_json=${encodeURIComponent(JSON.stringify(payload.user))}; path=/; max-age=${maxAge}${secure}; SameSite=Lax`;
}

export function clearAuthSession(): void {
  const expired = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `access_token=; ${expired}`;
  document.cookie = `refresh_token=; ${expired}`;
  document.cookie = `rbac_token=; ${expired}`;
  document.cookie = `user_id=; ${expired}`;
  document.cookie = `user_role=; ${expired}`;
  document.cookie = `rbac_user_json=; ${expired}`;
}

export async function loginRequest(email: string, password: string): Promise<AuthTokenPayload> {
  const res = await fetch(authUrl('/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tenantSlug: TENANT_SLUG }),
  });
  return parseEnvelope<AuthTokenPayload>(res);
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
  role: 'sales_rep' | 'sales_manager';
}): Promise<AuthTokenPayload> {
  const res = await fetch(authUrl('/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantName: 'Relanto',
      tenantSlug: TENANT_SLUG,
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    }),
  });
  return parseEnvelope<AuthTokenPayload>(res);
}

export async function logoutRequest(): Promise<void> {
  const refreshMatch = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  const accessMatch = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  const refreshToken = refreshMatch?.[1] ? decodeURIComponent(refreshMatch[1]) : undefined;
  const accessToken = accessMatch?.[1] ? decodeURIComponent(accessMatch[1]) : undefined;

  if (accessToken) {
    await fetch(authUrl('/logout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    }).catch(() => undefined);
  }

  clearAuthSession();
}
