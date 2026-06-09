import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';

const API_BASE = ENV.M08_API_BASE_URL;
import type { Task, FilterState, TaskType, SortOption, GroupByOption, StatusTab } from '../types/engage.types';

// Normalize backend field names to match frontend Task model
function normalizeTask(backendTask: any): Task {
  if (!backendTask) return backendTask;
  return {
    id: backendTask.id || backendTask.task_id || backendTask.taskId || '',
    title: backendTask.title || backendTask.taskName || backendTask.task_name || '',
    contactName: backendTask.contactName || backendTask.contact_name || '',
    companyName: backendTask.companyName || backendTask.company_name || '',
    channel: backendTask.channel || 'custom',
    scheduledTime: backendTask.scheduledTime || backendTask.scheduled_time || '',
    dueDateTime: backendTask.dueDateTime || backendTask.due_date_time || '',
    isOverdue: backendTask.isOverdue ?? backendTask.is_overdue ?? false,
    interactionCount: backendTask.interactionCount ?? backendTask.interaction_count ?? 0,
    priority: backendTask.priority || 'normal',
    status: backendTask.status || 'pending',
    dueDate: backendTask.dueDate || backendTask.due_date || '',
    dueTime: backendTask.dueTime || backendTask.due_time || '',
    assigneeId: backendTask.assigneeId || backendTask.assignee_id || '',
    assigneeName: backendTask.assigneeName || backendTask.assignee_name || '',
    assigneeRole: backendTask.assigneeRole || backendTask.assignee_role || '',
    aiSignal: backendTask.aiSignal || backendTask.ai_signal || '',
    aiSignalType: backendTask.aiSignalType || backendTask.ai_signal_type || undefined,
    arr: backendTask.arr || '',
    aiInsight: backendTask.aiInsight || backendTask.ai_insight || '',
    recommendedNextSteps: backendTask.recommendedNextSteps || backendTask.recommended_next_steps || [],
    recentActivity: backendTask.recentActivity || backendTask.recent_activity || [],
    notes: backendTask.notes || '',
    todoType: backendTask.todoType || backendTask.todo_type || 'manual',
    entityType: backendTask.entityType || backendTask.entity_type || 'lead',
    workflowName: backendTask.workflowName || backendTask.workflow_name || '',
    workflowStep: backendTask.workflowStep || backendTask.workflow_step || undefined,
    totalWorkflowSteps: backendTask.totalWorkflowSteps || backendTask.total_workflow_steps || undefined,
    mutualConnections: backendTask.mutualConnections || backendTask.mutual_connections || undefined,
    emailDraft: backendTask.emailDraft || backendTask.email_draft || undefined,
    linkedinScript: backendTask.linkedinScript || backendTask.linkedin_script || undefined,
    snoozedUntil: backendTask.snoozedUntil || backendTask.snoozed_until || undefined,
    updatedAt: backendTask.updatedAt || backendTask.updated_at || undefined,
    createdAt: backendTask.createdAt || backendTask.created_at || undefined,
    localTime: backendTask.localTime || backendTask.local_time || backendTask.scheduledTime || backendTask.scheduled_time || undefined,
  };
}

async function apiFetch(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    method,
    ...options,
    headers: {
      ...getBridgeHeaders(),
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) throw new Error(`API ${method} ${endpoint} responded with ${res.status}`);
  return res;
}

export async function fetchTasks(query: {
  assigneeId: string;
  date: string;
  tab: StatusTab;
  channel?: TaskType;
  search?: string;
  groupBy?: GroupByOption;
  sortBy?: SortOption;
  filters?: FilterState | null;
  page?: number;
  size?: number;
}): Promise<{
  groups: { groupLabel: string; count: number; tasks: Task[] }[];
  tabCounts: Record<StatusTab, number>;
  statusPills: { atRisk: number; dueToday: number };
  pagination: { page: number; size: number; total: number; totalPages: number };
}> {
  const params = new URLSearchParams({
    assigneeId: query.assigneeId,
    date: query.date,
    tab: query.tab,
    channel: query.channel || 'all',
    groupBy: query.groupBy || 'none',
    sortBy: query.sortBy || 'due_date',
    page: String(query.page || 1),
    size: String(query.size || 50),
  });
  if (query.search) params.set('search', query.search);
  const endpoint = `/api/tasks?${params.toString()}`;

  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  const groupsNormalized = (payload.data.groups || []).map((g: any) => ({
    groupLabel: g.groupLabel,
    count: g.count,
    tasks: (g.tasks || []).map(normalizeTask),
  }));
  return {
    groups: groupsNormalized,
    tabCounts: payload.data.tabCounts,
    statusPills: payload.data.statusPills,
    pagination: payload.data.pagination || { page: 1, size: 50, total: 0, totalPages: 1 },
  };
}

export async function fetchSummary(assigneeId: string, date: string): Promise<{
  totalToday: number;
  completedToday: number;
  atRisk: number;
  dueToday: number;
  highPriorityRemaining: number;
  completionPercentage: number;
  headerAlert: string;
}> {
  const endpoint = `/api/tasks/summary?assigneeId=${assigneeId}&date=${date}`;
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}

export async function createTask(body: {
  taskType: string;
  title: string;
  linkedToId: string;
  linkedToType: string;
  dueDate: string;
  dueTime: string;
  description?: string;
  assigneeId?: string;
}): Promise<{ taskId: string; status: string; createdAt: string }> {
  const endpoint = '/api/tasks';
  const res = await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json();
  return {
    taskId: payload.data.taskId || payload.data.id,
    status: payload.data.status,
    createdAt: payload.data.createdAt || payload.data.created_at,
  };
}

export async function searchLinkedEntities(search: string): Promise<{
  id: string;
  name: string;
  type: string;
  subLabel: string;
}[]> {
  const endpoint = `/api/search/linked-to?search=${encodeURIComponent(search)}`;
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data.results;
}

export async function reassignTask(
  taskId: string,
  body: { newAssigneeId: string; scope: string; reason?: string }
): Promise<{ taskId: string; assigneeId: string; assigneeName: string; assigneeRole: string; updatedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/reassign`;
  const res = await apiFetch('PATCH', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json();
  return {
    taskId: payload.data.taskId || payload.data.id,
    assigneeId: payload.data.assigneeId || payload.data.assignee_id,
    assigneeName: payload.data.assigneeName || payload.data.assignee_name,
    assigneeRole: payload.data.assigneeRole || payload.data.assignee_role,
    updatedAt: payload.data.updatedAt || payload.data.updated_at,
  };
}

export async function fetchTaskDetail(taskId: string): Promise<Task> {
  const endpoint = `/api/tasks/${taskId}/detail`;
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return normalizeTask(payload.data);
}

export async function saveTaskNotes(taskId: string, notes: string): Promise<Task> {
  const endpoint = `/api/tasks/${taskId}/notes`;
  const res = await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  const payload = await res.json();
  return normalizeTask(payload.data);
}

export async function fetchEmailDraft(taskId: string): Promise<Task['emailDraft']> {
  const endpoint = `/api/tasks/${taskId}/email-draft`;
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}

export async function sendEmail(
  taskId: string,
  body: { to: string; from: string; subject: string; body: string; notes?: string }
): Promise<void> {
  const endpoint = `/api/tasks/${taskId}/send-email`;
  await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function saveEmailDraft(
  taskId: string,
  body: { to: string; from: string; subject: string; body: string }
): Promise<void> {
  const endpoint = `/api/tasks/${taskId}/save-draft`;
  await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function rephraseEmail(
  taskId: string,
  body: {
    currentBody: string;
    tone?: string;
    subject?: string;
    contactName?: string;
    companyName?: string;
  }
): Promise<string> {
  const endpoint = `/api/tasks/${taskId}/ai-rephrase`;
  const res = await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json();
  return payload.data.rephrasedBody;
}

export async function fetchEmailTemplates(): Promise<{ id: string; name: string; subject: string; body: string }[]> {
  const endpoint = '/api/email-templates?assigneeId=me';
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data.templates;
}

export async function fetchLinkedInScript(taskId: string): Promise<Task['linkedinScript'] & { mutualConnections?: number; linkedInProfileUrl?: string }> {
  const endpoint = `/api/tasks/${taskId}/linkedin-script`;
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}

export async function markTaskComplete(taskId: string, notes?: string): Promise<void> {
  const endpoint = `/api/tasks/${taskId}/mark-complete`;
  await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
}

export async function snoozeTask(taskId: string, snoozedUntil: string): Promise<void> {
  const endpoint = `/api/tasks/${taskId}`;
  await apiFetch('PATCH', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snoozedUntil }),
  });
}

export async function fetchContactDetail(contactId: string): Promise<any> {
  const endpoint = `/api/contacts/${contactId}/detail`;
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}

export async function skipTask(taskId: string): Promise<{ taskId: string; status: string; action: string; updatedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/skip`;
  const res = await apiFetch('POST', endpoint);
  const payload = await res.json();
  return {
    taskId: payload.data.taskId || payload.data.id,
    status: payload.data.status,
    action: payload.data.action || 'skipped',
    updatedAt: payload.data.updatedAt || payload.data.updated_at,
  };
}

export async function dismissTask(taskId: string): Promise<{ taskId: string; status: string; action: string; updatedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/dismiss`;
  const res = await apiFetch('POST', endpoint);
  const payload = await res.json();
  return {
    taskId: payload.data.taskId || payload.data.id,
    status: payload.data.status,
    action: payload.data.action || 'dismissed',
    updatedAt: payload.data.updatedAt || payload.data.updated_at,
  };
}

export async function logTaskAction(
  taskId: string,
  action: string,
  notes?: string
): Promise<{ taskId: string; action: string; loggedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/action`;
  const res = await apiFetch('POST', endpoint, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes }),
  });
  const payload = await res.json();
  return {
    taskId: payload.data.taskId || payload.data.id,
    action: payload.data.action,
    loggedAt: payload.data.loggedAt || payload.data.logged_at,
  };
}

export async function fetchRecentActivity(): Promise<any[]> {
  const endpoint = '/api/activities/recent';
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}

export async function fetchFilterConfig(): Promise<{ flows: string[]; entityTypes: string[]; localTimes: string[] }> {
  const endpoint = '/api/tasks/filters-config';
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}

export async function fetchTeamMembers(): Promise<any[]> {
  const endpoint = '/api/team/members';
  const res = await apiFetch('GET', endpoint);
  const payload = await res.json();
  return payload.data;
}
