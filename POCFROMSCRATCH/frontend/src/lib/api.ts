/**
 * Typed fetch wrappers for the NestJS API
 */
import type {
  BoardConfig,
  AccountsResponse,
  AccountDetail,
  ActivityInfo,
  TeamMember,
  PermissionProfile,
  TodoItem,
  AIBrief,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }
  return res.json();
}

// ── Boards ────────────────────────────────────────────────────────────
export async function fetchBoards(): Promise<BoardConfig[]> {
  const data = await fetchJson<{ boards: BoardConfig[] }>(`${API_URL}/boards`);
  return data.boards;
}

export async function fetchBoard(slug: string): Promise<BoardConfig> {
  const data = await fetchJson<{ board: BoardConfig }>(`${API_URL}/boards/${slug}`);
  return data.board;
}

export async function fetchTeam(): Promise<TeamMember[]> {
  const data = await fetchJson<{ team: TeamMember[] }>(`${API_URL}/boards/team`);
  return data.team;
}

export async function fetchPermissions(role: string): Promise<PermissionProfile> {
  const data = await fetchJson<{ permissions: PermissionProfile }>(`${API_URL}/boards/permissions/${role}`);
  return data.permissions;
}

// ── Accounts ──────────────────────────────────────────────────────────
export async function fetchAccounts(params: {
  board_slug: string;
  tab_id?: string;
  rep_id?: string;
  period?: string;
  sort_field?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}): Promise<AccountsResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  return fetchJson<AccountsResponse>(`${API_URL}/accounts?${searchParams}`);
}

export async function fetchAccountDetail(hubspotId: string): Promise<AccountDetail> {
  return fetchJson<AccountDetail>(`${API_URL}/accounts/${hubspotId}`);
}

// ── Activities ────────────────────────────────────────────────────────
export async function fetchActivities(
  companyHubspotId: string,
  type?: string,
  limit?: number,
  fromDate?: string,
  toDate?: string,
  page?: number,
  pageSize?: number,
): Promise<{ activities: ActivityInfo[], total: number }> {
  const params = new URLSearchParams();
  if (type && type !== 'ALL') params.set('type', type);
  if (limit) params.set('limit', String(limit));
  if (fromDate) params.set('from_date', fromDate);
  if (toDate) params.set('to_date', toDate);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('page_size', String(pageSize));
  
  const data = await fetchJson<{ activities: ActivityInfo[], total: number }>(
    `${API_URL}/activities/${companyHubspotId}?${params}`,
  );
  return data;
}

// ── Edits ─────────────────────────────────────────────────────────────
export async function editCompany(
  hubspotId: string,
  field: string,
  value: string,
  role: string,
): Promise<{ success: boolean; hubspot_updated: boolean; supabase_updated: boolean }> {
  return fetchJson(`${API_URL}/edits/company/${hubspotId}`, {
    method: 'PATCH',
    body: JSON.stringify({ field, value, role }),
  });
}

export async function editDeal(
  dealId: string,
  field: string,
  value: string,
  role: string,
): Promise<{ success: boolean; hubspot_updated: boolean; supabase_updated: boolean }> {
  return fetchJson(`${API_URL}/edits/deal/${dealId}`, {
    method: 'PATCH',
    body: JSON.stringify({ field, value, role }),
  });
}

export async function editSupplementary(
  companyHubspotId: string,
  field: string,
  value: string,
  role: string,
): Promise<{ success: boolean; supabase_updated: boolean }> {
  return fetchJson(`${API_URL}/edits/supplementary/${companyHubspotId}`, {
    method: 'PATCH',
    body: JSON.stringify({ field, value, role }),
  });
}

// ── Todos ─────────────────────────────────────────────────────────────
export async function fetchTodos(companyHubspotId: string): Promise<TodoItem[]> {
  const data = await fetchJson<{ todos: TodoItem[] }>(`${API_URL}/todos/${companyHubspotId}`);
  return data.todos;
}

export async function createTodo(
  companyHubspotId: string,
  type: 'todo' | 'note',
  content: string,
  role: string,
): Promise<TodoItem> {
  const data = await fetchJson<{ todo: TodoItem }>(`${API_URL}/todos/${companyHubspotId}`, {
    method: 'POST',
    body: JSON.stringify({ type, content, role }),
  });
  return data.todo;
}

export async function updateTodo(
  todoId: string,
  updates: { content?: string; completed?: boolean },
): Promise<TodoItem> {
  const data = await fetchJson<{ todo: TodoItem }>(`${API_URL}/todos/${todoId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.todo;
}

export async function deleteTodo(todoId: string): Promise<void> {
  await fetchJson(`${API_URL}/todos/${todoId}`, { method: 'DELETE' });
}

// ── AI ────────────────────────────────────────────────────────────────
export async function generateSummary(
  companyHubspotId: string,
  scope: string,
  periodDays: number,
  briefType: string = 'full',
  forceRefresh: boolean = false,
): Promise<{ brief: AIBrief; generated_at: string; cached: boolean; insufficient_data: boolean }> {
  return fetchJson(`${AI_URL}/ai/summary`, {
    method: 'POST',
    body: JSON.stringify({
      company_hubspot_id: companyHubspotId,
      scope,
      period_days: periodDays,
      brief_type: briefType,
      force_refresh: forceRefresh,
    }),
  });
}

export async function askAI(
  companyHubspotId: string,
  message: string,
  conversationHistory: { role: string; content: string }[],
): Promise<{ reply: string; citations: any[]; insufficient_data: boolean }> {
  return fetchJson(`${AI_URL}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({
      company_hubspot_id: companyHubspotId,
      message,
      conversation_history: conversationHistory,
    }),
  });
}

// ── Board Updates (Admin/Manager) ─────────────────────────────────────
export async function updateBoard(slug: string, data: any): Promise<BoardConfig> {
  const result = await fetchJson<{ board: BoardConfig }>(`${API_URL}/boards/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result.board;
}

export async function duplicateBoard(slug: string): Promise<BoardConfig> {
  const result = await fetchJson<{ board: BoardConfig }>(`${API_URL}/boards/${slug}/duplicate`, {
    method: 'POST',
  });
  return result.board;
}

export async function deleteBoard(slug: string): Promise<{ success: boolean; deleted_slug: string }> {
  return fetchJson(`${API_URL}/boards/${slug}`, { method: 'DELETE' });
}

export async function createBoard(step: number, data: any): Promise<{ step?: number; valid?: boolean; board?: BoardConfig }> {
  return fetchJson(`${API_URL}/boards`, {
    method: 'POST',
    body: JSON.stringify({ step, data }),
  });
}

export async function addColumn(slug: string, col: {
  field_key: string;
  label?: string;
  visible_to_roles?: string[];
}): Promise<{ column: any }> {
  return fetchJson(`${API_URL}/boards/${slug}/columns`, {
    method: 'POST',
    body: JSON.stringify(col),
  });
}

export async function updateColumn(slug: string, colId: string, updates: {
  label?: string;
  display_order?: number;
  visible_to_roles?: string[];
  width?: number;
}): Promise<{ column: any }> {
  return fetchJson(`${API_URL}/boards/${slug}/columns/${colId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteColumn(slug: string, colId: string): Promise<{ success: boolean }> {
  return fetchJson(`${API_URL}/boards/${slug}/columns/${colId}`, { method: 'DELETE' });
}

export async function updateBriefConfig(slug: string, config: {
  ai_briefs_enabled?: boolean;
  brief_type?: string;
  brief_period_days?: number;
}): Promise<{ board: BoardConfig }> {
  return fetchJson(`${API_URL}/boards/${slug}/brief-config`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  });
}

// ── Sync ──────────────────────────────────────────────────────────────
export async function triggerSync(role: string): Promise<{
  success: boolean;
  companies?: number;
  contacts?: number;
  deals?: number;
  duration_ms?: number;
  synced_at?: string;
  error?: string;
  message?: string;
}> {
  return fetchJson(`${API_URL}/sync/trigger`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function fetchSyncStatus(): Promise<{
  last_sync: {
    success: boolean;
    companies: number;
    contacts: number;
    deals: number;
    duration_ms: number;
    synced_at: string;
    error?: string;
  } | null;
  next_sync_in_seconds: number | null;
  is_syncing: boolean;
}> {
  return fetchJson(`${API_URL}/sync/status`);
}
