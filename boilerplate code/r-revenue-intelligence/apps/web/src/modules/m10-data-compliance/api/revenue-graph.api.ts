// M10 Revenue Graph — API Client
// All calls go to /api/v1/m10-data-compliance (canonical prefix per TDD §7)
// Falls back to rich mock data if the backend is not reachable (local dev).

import type {
  Account, Deal, Contact, CrmSyncStatus, RelationshipGraph,
  PaginatedResponse,
} from '../types/revenue-graph.types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PREFIX = `${BASE}/api/v1/m10-data-compliance`;

// ─── Mock Data (used when backend is not reachable) ───────────────────────────
const MOCK_ACCOUNTS: Account[] = [
  { accountId: '11111111-1111-1111-1111-111111111111', tenantId: 'demo', name: 'ACME Corporation', domain: 'acme.com', region: 'NA', industry: 'Manufacturing', crmSource: 'salesforce', crmSyncedAt: '2026-05-19T06:00:00Z' },
  { accountId: '22222222-2222-2222-2222-222222222222', tenantId: 'demo', name: 'Globex Corp', domain: 'globex.com', region: 'EMEA', industry: 'Technology', crmSource: 'hubspot', crmSyncedAt: '2026-05-19T05:45:00Z' },
  { accountId: '33333333-3333-3333-3333-333333333333', tenantId: 'demo', name: 'Initech Systems', domain: 'initech.com', region: 'APAC', industry: 'Finance', crmSource: 'dynamics365' },
];

const MOCK_DEALS: Deal[] = [
  { dealId: 'd1111111-1111-1111-1111-111111111111', tenantId: 'demo', name: 'ACME Enterprise Renewal Q2', stage: 'Negotiation', amount: 285000, currency: 'USD', isActive: true, account: { accountId: '11111111-1111-1111-1111-111111111111', name: 'ACME Corporation' } },
  { dealId: 'd2222222-2222-2222-2222-222222222222', tenantId: 'demo', name: 'Globex Platform Expansion', stage: 'Proposal', amount: 150000, currency: 'USD', isActive: true, account: { accountId: '22222222-2222-2222-2222-222222222222', name: 'Globex Corp' } },
  { dealId: 'd3333333-3333-3333-3333-333333333333', tenantId: 'demo', name: 'Initech Pilot Program', stage: 'Qualified', amount: 65000, currency: 'USD', isActive: true, account: { accountId: '33333333-3333-3333-3333-333333333333', name: 'Initech Systems' } },
  { dealId: 'd4444444-4444-4444-4444-444444444444', tenantId: 'demo', name: 'ACME Add-on Modules 2025', stage: 'Closed Won', amount: 42000, currency: 'USD', isActive: false, account: { accountId: '11111111-1111-1111-1111-111111111111', name: 'ACME Corporation' } },
];

const MOCK_SYNC: CrmSyncStatus = {
  tenantId: 'demo',
  syncStates: [
    { crmSource: 'salesforce', entityType: 'accounts', status: 'completed', lastSyncedAt: '2026-05-19T06:00:00Z', recordsSynced: 142 },
    { crmSource: 'salesforce', entityType: 'contacts', status: 'completed', lastSyncedAt: '2026-05-19T06:01:00Z', recordsSynced: 389 },
    { crmSource: 'salesforce', entityType: 'deals', status: 'completed', lastSyncedAt: '2026-05-19T06:02:00Z', recordsSynced: 67 },
    { crmSource: 'hubspot', entityType: 'accounts', status: 'completed', lastSyncedAt: '2026-05-19T05:45:00Z', recordsSynced: 88 },
    { crmSource: 'hubspot', entityType: 'deals', status: 'completed', lastSyncedAt: '2026-05-19T05:46:00Z', recordsSynced: 34 },
    { crmSource: 'dynamics365', entityType: 'accounts', status: 'idle', recordsSynced: 0 },
  ],
};

async function apiFetch<T>(path: string, opts?: RequestInit, mockFallback?: T): Promise<T> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const res = await fetch(`${PREFIX}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  } catch {
    if (mockFallback !== undefined) return mockFallback;
    throw new Error('Failed to fetch');
  }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export const fetchAccounts = (params?: {
  page?: number; limit?: number; search?: string;
}): Promise<PaginatedResponse<Account>> => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  const mock: PaginatedResponse<Account> = { data: MOCK_ACCOUNTS, total: MOCK_ACCOUNTS.length, page: 1, limit: 50 };
  return apiFetch<PaginatedResponse<Account>>(`/accounts?${q}`, undefined, mock);
};

export const fetchAccountById = (id: string): Promise<Account> =>
  apiFetch<Account>(`/accounts/${id}`, undefined, MOCK_ACCOUNTS.find(a => a.accountId === id) ?? MOCK_ACCOUNTS[0]);

// ─── Deals ───────────────────────────────────────────────────────────────────

export const fetchDeals = (params?: {
  accountId?: string; isActive?: boolean; stage?: string; page?: number; limit?: number;
}): Promise<PaginatedResponse<Deal>> => {
  const q = new URLSearchParams();
  if (params?.accountId) q.set('accountId', params.accountId);
  if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
  if (params?.stage) q.set('stage', params.stage);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const mock: PaginatedResponse<Deal> = { data: MOCK_DEALS, total: MOCK_DEALS.length, page: 1, limit: 50 };
  return apiFetch<PaginatedResponse<Deal>>(`/deals?${q}`, undefined, mock);
};

export const fetchDealById = (id: string): Promise<Deal> =>
  apiFetch<Deal>(`/deals/${id}`, undefined, MOCK_DEALS.find(d => d.dealId === id) ?? MOCK_DEALS[0]);

export const fetchDealRelationship = (id: string): Promise<RelationshipGraph> =>
  apiFetch<RelationshipGraph>(`/deals/${id}/relationship`, undefined, {
    dealId: id, dealName: 'ACME Enterprise Renewal Q2', stage: 'Negotiation', amount: 285000,
    account: { accountId: '11111111-1111-1111-1111-111111111111', name: 'ACME Corporation', domain: 'acme.com' },
    contacts: [{ contactId: 'c1111111-1111-1111-1111-111111111111', name: 'John Smith', email: 'john.smith@acme.com', role: 'primary' }],
    recentActivities: [{ activityId: 'act-001', sourceType: 'call', sourcePlatform: 'zoom', occurredAt: '2026-05-18T14:30:00Z', status: 'linked' }],
  });

// ─── Contacts ────────────────────────────────────────────────────────────────

export const fetchContactById = (id: string): Promise<Contact> =>
  apiFetch<Contact>(`/contacts/${id}`, undefined, {
    contactId: id, tenantId: 'demo', email: 'john.smith@acme.com',
    name: 'John Smith', title: 'VP of Procurement', accountId: '11111111-1111-1111-1111-111111111111',
  });

// ─── CRM Sync ────────────────────────────────────────────────────────────────

export const fetchCrmSyncStatus = (): Promise<CrmSyncStatus> =>
  apiFetch<CrmSyncStatus>('/crm-sync-status', undefined, MOCK_SYNC);

export const triggerCrmSync = (body: {
  crmSource: 'salesforce' | 'hubspot' | 'dynamics365';
  entityTypes: string[];
  fullSync?: boolean;
}): Promise<{ message: string; jobIds: string[] }> =>
  apiFetch('/crm-sync', { method: 'POST', body: JSON.stringify(body) },
    { message: `Mock sync triggered for ${body.crmSource}`, jobIds: ['mock-job-001'] });
