// ============================================================
// Revenue / Accounts — TypeScript Types
// Derived from: final-api-endpoints_1.md
// All shapes mirror exact API response structures.
// ============================================================

// ─── Alert Banner ───────────────────────────────────────────
export interface AlertBannerData {
  totalARR: number;       // e.g. 2100000
  accountCount: number;   // e.g. 18
  inactiveDays: number;   // e.g. 14
}

// ─── KPI Summary Cards ──────────────────────────────────────
export interface KpiCard {
  label: string;   // "Accounts" | "Renewal" | "Upsell" | "Churn"
  value: number;   // dollar value
  count: number;   // number of accounts
}

export type KpiSummaryResponse = KpiCard[];

// ─── Viewing Filter ─────────────────────────────────────────
export interface ViewerTeam {
  id: string;
  name: string;
  memberCount: number;
}

export interface ViewerRep {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface ViewersResponse {
  teams: ViewerTeam[];
  reps: ViewerRep[];
}

// ─── Account List ────────────────────────────────────────────
export interface AccountOwner {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export type ActivityType = 'Meeting' | 'Call' | 'Email' | 'Note';

export interface ActivityDot {
  type: ActivityType;
  timestamp: string;   // ISO 8601
  label: string;
}

export interface AccountRow {
  accountId: string;
  accountName: string;
  owner: AccountOwner;
  exitARR: number;
  contactsCount: number;
  activity: ActivityDot[];
  lastActivity: string;   // relative label e.g. "Yesterday"
  managerNote: string | null;
  openDeals: number;
  renewalDate: string;    // ISO date
}

export interface AccountListParams {
  viewing?: string[];    // repIds or teamIds
  period?: string;
  noActivity?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface AccountListResponse {
  accounts: AccountRow[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// ─── Activity Recent (tooltip) ───────────────────────────────
export interface RecentActivity {
  type: ActivityType;
  datetime: string;
  with: string;
  subject: string;
}

// ─── Account Drawer — Overview ────────────────────────────────
export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskObjection {
  title: string;
  severity: RiskSeverity;
  mentionedCount: number;
  lastMentioned: string;  // relative
}

export interface AccountOverviewData {
  risksAndObjections: RiskObjection[];
}

// ─── Account Drawer — Activity Feed ──────────────────────────
export interface ActivityFeedItem {
  type: ActivityType;
  datetime: string;
  with: string;
  subject: string;
  createdBy: string;
}

export interface ActivityFeedParams {
  page?: number;
  size?: number;
  type?: 'all' | ActivityType;
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Account Drawer — Briefs ──────────────────────────────────
export interface AccountBriefs {
  briefContent: string;   // structured content from AI
}

// ─── Account Drawer — Todos ──────────────────────────────────
export interface Todo {
  id: string;
  title: string;
  dueDate: string;       // ISO date
  assignee: string;
  completed: boolean;
}

export interface TodosResponse {
  todos: Todo[];
}

// ─── Account Drawer — Notes ──────────────────────────────────
export interface NotesData {
  notes: string;
  updatedAt: string;     // ISO 8601
}

// ─── Account Drawer — CRM ────────────────────────────────────
export interface CrmField {
  label: string;
  value: string;
}

export interface CrmData {
  crmFields: CrmField[];
}

// ─── AI Chat ─────────────────────────────────────────────────
export interface AiChatRequest {
  message: string;
  sessionId: string;
}

export interface AiChatResponse {
  reply: string;
}

// ─── Generic API Error ───────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode?: number;
}
