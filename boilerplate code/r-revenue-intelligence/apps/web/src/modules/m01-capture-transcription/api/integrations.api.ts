// ── Integrations API (shared platform connectors) ─────────────────────────────

import { m01ApiV1, DEV_TENANT_ID } from '../lib/api-env';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${m01ApiV1()}${path.replace(/^\/api\/v1/, '')}`, {
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
  apiFetch<IntegrationStatus[]>('/integrations');

/** Connect a provider (returns authorizationUrl for OAuth or simulates connection) */
export const connectProvider = (provider: string) =>
  apiFetch<ConnectResponse>(`/integrations/${provider}/connect`, { method: 'POST' });

/** Disconnect a provider */
export const disconnectProvider = (provider: string) =>
  apiFetch<{ status: string; message: string }>(`/integrations/${provider}/disconnect`, { method: 'POST' });
