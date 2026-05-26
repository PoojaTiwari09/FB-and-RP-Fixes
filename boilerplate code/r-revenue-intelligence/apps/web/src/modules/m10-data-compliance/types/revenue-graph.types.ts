// M10 Revenue Graph — TypeScript Types (Frontend)
// Mirrors the backend response DTOs for type-safe API consumption.

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type LinkingStatus = 'received' | 'normalized' | 'mapping_in_progress' | 'linked' | 'linked_low_confidence' | 'unresolved' | 'failed' | 'dead_lettered';
export type CrmSource = 'salesforce' | 'hubspot' | 'dynamics365';

export interface ActivitySummary {
  activityId: string;
  sourceType: string;
  sourcePlatform?: string;
  occurredAt: string;
  status: string;
}

export interface Account {
  accountId: string;
  tenantId: string;
  name: string;
  domain?: string;
  region?: string;
  industry?: string;
  crmSource?: string;
  crmSyncedAt?: string;
  recentActivities?: ActivitySummary[];
  activeDealsCount?: number;
  contactsCount?: number;
}

export interface Contact {
  contactId: string;
  tenantId: string;
  email: string;
  name?: string;
  title?: string;
  accountId?: string;
  accountName?: string;
  crmSource?: string;
}

export interface Deal {
  dealId: string;
  tenantId: string;
  name: string;
  stage?: string;
  amount?: number;
  currency?: string;
  closeDate?: string;
  isActive: boolean;
  account?: { accountId: string; name: string };
  contacts?: Array<{ contactId: string; name?: string; email: string }>;
  recentActivities?: ActivitySummary[];
}

export interface RelationshipGraph {
  dealId: string;
  dealName: string;
  stage: string;
  amount?: number;
  account?: { accountId: string; name: string; domain?: string };
  contacts: Array<{ contactId: string; name?: string; email: string; role?: string }>;
  recentActivities: ActivitySummary[];
  confidenceLevel?: string;
}

export interface CrmSyncState {
  crmSource: string;
  entityType: string;
  status: string;
  lastSyncedAt?: string;
  recordsSynced: number;
  errorMessage?: string;
}

export interface CrmSyncStatus {
  tenantId: string;
  syncStates: CrmSyncState[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LinkedEntity {
  entityType: string;
  entityId: string;
  confidence: string;
  signals: string[];
  aiAssisted: boolean;
}
