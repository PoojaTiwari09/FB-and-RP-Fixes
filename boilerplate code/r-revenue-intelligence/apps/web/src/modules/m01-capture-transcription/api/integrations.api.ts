// ── Integrations API (shared platform connectors) ─────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'dev-tenant-001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id':  DEV_TENANT_ID,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IntegrationStatus {
  provider:       string;
  name:           string;
  icon:           string;
  color:          string;
  status:         'connected' | 'disconnected' | 'expired';
  accountEmail:   string | null;
  accountName:    string | null;
  connectedAt:    string | null;
  hasCredentials: boolean;
}

export interface ConnectResponse {
  status?:          string;
  message?:         string;
  authorizationUrl?: string;
  accountEmail?:    string;
  accountName?:     string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** List all integration statuses */
export const listIntegrations = () =>
  apiFetch<IntegrationStatus[]>('/api/v1/integrations');

/** Connect a provider (returns authorizationUrl for OAuth or simulates connection) */
export const connectProvider = (provider: string) =>
  apiFetch<ConnectResponse>(`/api/v1/integrations/${provider}/connect`, { method: 'POST' });

/** Disconnect a provider */
export const disconnectProvider = (provider: string) =>
  apiFetch<{ status: string; message: string }>(`/api/v1/integrations/${provider}/disconnect`, { method: 'POST' });
