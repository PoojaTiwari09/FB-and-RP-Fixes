// ── Shared TypeScript Types ────────────────────────────────────────────

export type Role = 'rep' | 'manager' | 'admin';
export type PanelTab = 'overview' | 'timeline' | 'briefs' | 'todos' | 'notes' | 'crm';
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING';
export type Direction = 'OUTBOUND' | 'INBOUND' | 'N/A';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
}

export interface BoardConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  default_sort_field: string;
  default_sort_dir: string;
  date_filter_enabled: boolean;
  ai_briefs_enabled: boolean;
  brief_type: string;
  brief_period_days: number;
  tabs: BoardTab[];
  columns: ColumnConfig[];
}

export interface BoardTab {
  id: string;
  label: string;
  order: number;
  is_default: boolean;
  filter_logic: FilterLogic;
}

export interface FilterLogic {
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface FilterCondition {
  field: string;
  op: string;
  value: any;
}

export interface ColumnConfig {
  id: string;
  field_key: string;
  label: string;
  order: number;
  width: number;
  sortable: boolean;
  editable: boolean;
  visible_to_roles: Role[];
}

export interface PermissionProfile {
  role: Role;
  can_view_all_reps: boolean;
  can_edit_board_config: boolean;
  can_edit_columns: boolean;
  can_inline_edit: boolean;
  can_view_ai_briefs: boolean;
  can_trigger_sync: boolean;
}

export interface AccountSummary {
  hubspot_id: string;
  local_id: string;
  name: string;
  domain: string;
  segment: string;
  industry: string;
  type: string;
  exit_arr: number;
  contacts_count: number;
  assigned_rep: { id: string; name: string };
  last_activity_date: string | null;
  last_activity_days: number | null;
  zero_activity_flag: boolean;
  manager_note: string | null;
  next_qbr_date: string | null;
  ai_risk_score: number;
  health_score?: number | null;
  risk_label: string;
  strategic_priority: boolean;
  open_deals_summary: {
    count: number;
    total_amount: number;
  };
  renewal_date: string | null;
  activities_21d: ActivityDot[];
}

export interface ActivityDot {
  id: string;
  type: ActivityType;
  direction: Direction;
  timestamp: string;
  days_ago: number;
  rep_talk_pct?: number;
  client_talk_pct?: number;
  duration_seconds?: number;
  outcome?: string;
  subject?: string;
  is_future: boolean;
}

export interface AccountDetail extends AccountSummary {
  city: string;
  country: string;
  employee_count: number;
  board: string;
  contacts: ContactInfo[];
  deals: DealInfo[];
  activities: ActivityInfo[];
  supplementary: SupplementaryInfo | null;
}

export interface ContactInfo {
  hubspot_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  is_primary: boolean;
}

export interface DealInfo {
  hubspot_id: string;
  local_id: string;
  name: string;
  stage: string;
  amount: number;
  adjusted_amount: number;
  deal_type: string;
  close_date: string;
  assigned_rep_id: string;
}

export interface ActivityInfo {
  id: string;
  local_id: string;
  type: ActivityType;
  direction: Direction;
  timestamp: string;
  body: string;
  duration_seconds?: number;
  rep_talk_pct?: number;
  client_talk_pct?: number;
  call_outcome?: string;
  subject?: string;
  snippet?: string;
  title?: string;
  attendee_contact_ids?: string[];
  assigned_rep_id: string;
}

export interface SupplementaryInfo {
  manager_note: string | null;
  next_qbr_date: string | null;
  ai_risk_score: number;
  risk_label: string;
  strategic_priority: boolean;
}

export interface AccountsResponse {
  total: number;
  page: number;
  page_size: number;
  summary: {
    all_count: number;
    all_arr: number;
    tab_counts: Record<string, { count: number; arr: number }>;
  };
  accounts: AccountSummary[];
}

export interface SummaryCard {
  tab_id: string;
  label: string;
  arr: number;
  count: number;
  is_active: boolean;
}

export interface AIBrief {
  status: string;
  key_risks: string[];
  recommended_steps: string[];
  citations: {
    activity_id: string;
    type: string;
    date: string;
    summary: string;
  }[];
  insufficient_data: boolean;
}

export interface TodoItem {
  id: string;
  company_hubspot_id: string;
  created_by_role: string;
  type: 'todo' | 'note';
  content: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
