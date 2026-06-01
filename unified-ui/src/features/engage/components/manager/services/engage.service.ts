import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';

const API_BASE = ENV.M08_API_BASE_URL;
import type { Task, FilterState, TaskType, SortOption, GroupByOption, StatusTab } from '../types/engage.types';
import {
  INITIAL_MOCK_TASKS,
  MOCK_RECENT_ACTIVITY,
  MOCK_EMAIL_TEMPLATES,
  MOCK_TEAM_MEMBERS,
  mockFetchTasksResponse,
  mockFetchSummaryResponse,
  mockFetchTaskDetailResponse,
  mockFetchRecentActivityResponse,
  mockCreateTaskApiResponse,
  mockReassignTaskApiResponse,
  mockSkipTaskResponse,
  mockDismissTaskResponse,
  mockActionResponse,
  mockSearchLinkedEntitiesResponse,
  mockFetchEmailDraftResponse,
  mockFetchLinkedInScriptResponse,
  mockFetchContactDetailResponse,
  mockFetchTeamMembersResponse,
  mockFetchFiltersConfigResponse
} from '../mocks/engage.mock';

// Memory fallback + localStorage persistence for client-side state in mock mode
const STORE_KEY = 'engage_tasks_store_v8';
let inMemoryTasks: Task[] = [];

function getTasksStore(): Task[] {
  if (typeof window === 'undefined') {
    if (inMemoryTasks.length === 0) {
      inMemoryTasks = INITIAL_MOCK_TASKS();
    }
    return inMemoryTasks;
  }

  const stored = localStorage.getItem(STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Task[];
      // Hydration check: verify task_005 exists AND has correct assigneeId
      const task005 = parsed.find(t => t.id === 'task_005');
      const isValid = task005 && task005.assigneeId === 'sarah';

      console.log('[Engage DEBUG] Hydration check — task_005 exists:', !!task005,
        '| assigneeId:', task005?.assigneeId,
        '| isValid:', isValid);

      if (isValid) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTaskIds = ['task_001', 'task_002', 'task_003', 'task_004', 'task_005',
          'task_014', 'task_015'];
        const updated = parsed.map(t => {
          if (todayTaskIds.includes(t.id)) {
            return { ...t, dueDate: todayStr };
          }
          return t;
        });
        saveTasksStore(updated);
        return updated;
      }
      // Stale data — reseed
      console.log('[Engage DEBUG] Stale localStorage detected, reseeding INITIAL_MOCK_TASKS');
      localStorage.removeItem(STORE_KEY);
    } catch (e) {
      console.error('[Engage DEBUG] Failed to parse stored tasks, reseeding', e);
    }
  }

  const initial = INITIAL_MOCK_TASKS();
  localStorage.setItem(STORE_KEY, JSON.stringify(initial));
  console.log('[Engage DEBUG] Seeded localStorage with', initial.length, 'tasks. task_005 assigneeId:', initial.find(t => t.id === 'task_005')?.assigneeId);
  return initial;
}

function saveTasksStore(tasks: Task[]) {
  inMemoryTasks = tasks;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
  }
}

// Normalize backend field names to match frontend Task model
function normalizeTask(backendTask: any): Task {
  if (!backendTask) return backendTask;
  return {
    id: backendTask.id || backendTask.task_id || '',
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

// ─── Backend Availability Cache ───────────────────────────────────────────────
// Checks the backend ONCE on first call and caches the result for the session.
// • Backend DOWN: first call waits ≤1.5s, every call after is instant (mock).
// • Backend UP:   all calls go to the real API with a 5s per-request timeout.
// ──────────────────────────────────────────────────────────────────────────────
let _backendAvailable: boolean | null = null;

async function isBackendAvailable(): Promise<boolean> {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1500);
    // Any HTTP response (even 404) means the server is reachable.
    await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(id);
    _backendAvailable = true;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

async function apiFetch(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  // Skip network entirely if backend was already found to be unavailable.
  const available = await isBackendAvailable();
  if (!available) throw new Error('backend unavailable — using mock');

  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method,
      ...options,
      signal: controller.signal,
      headers: { ...getBridgeHeaders(), ...(options?.headers as Record<string, string>) },
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API ${method} ${endpoint} responded with ${res.status}`);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Service exports
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

  try {
    // API Endpoint: GET /api/tasks
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
  } catch (error) {
    console.warn('[engage.service] GET /api/tasks failed, using mock data:', error);
    const allTasks = getTasksStore();

    // 1. Filter by assignee
    // When assigneeId is 'me', show ALL tasks (Sales Manager view — full team visibility)
    let list = allTasks.filter(t => {
      if (query.assigneeId === 'me') {
        return true; // Manager view: show all team tasks
      }
      return t.assigneeId === query.assigneeId;
    });

    // 2. Filter by tab status
    const todayStr = query.date;

    // Tab calculations before tab filter (so tab badges show totals correctly)
    const getCounts = (taskList: Task[]) => {
      return {
        today: taskList.filter(t => t.dueDate === todayStr && t.status !== 'completed').length,
        inProgress: taskList.filter(t => t.status === 'in_progress').length,
        upcoming: taskList.filter(t => t.dueDate !== todayStr && t.status !== 'completed' && !t.snoozedUntil).length,
        completed: taskList.filter(t => t.status === 'completed').length,
      };
    };

    // Apply channel filter first for dynamic tab counts!
    let channelFilteredList = list;
    if (query.channel && query.channel !== 'all') {
      channelFilteredList = list.filter(t => t.channel === query.channel);
    }
    const tabCounts = getCounts(channelFilteredList);

    // Apply active status tab filter
    switch (query.tab) {
      case 'today':
        list = channelFilteredList.filter(t => t.dueDate === todayStr && t.status !== 'completed');
        break;
      case 'inProgress':
        list = channelFilteredList.filter(t => t.status === 'in_progress');
        break;
      case 'upcoming':
        list = channelFilteredList.filter(t => t.dueDate !== todayStr && t.status !== 'completed' && !t.snoozedUntil);
        break;
      case 'completed':
        list = channelFilteredList.filter(t => t.status === 'completed');
        break;
    }

    // 3. Apply advanced Filter Drawer filters
    if (query.filters) {
      const f = query.filters;
      list = list.filter(task => {
        // Due Date
        if (f.dueDate) {
          const taskDate = task.dueDate;
          const tomorrowStr = getRelativeDateStr(1);
          switch (f.dueDate) {
            case 'today':
              if (taskDate !== todayStr) return false;
              break;
            case 'tomorrow':
              if (taskDate !== tomorrowStr) return false;
              break;
            case 'this-week':
              const nextWeekStr = getRelativeDateStr(7);
              if (taskDate < todayStr || taskDate > nextWeekStr) return false;
              break;
            case 'overdue':
              if (!task.isOverdue) return false;
              break;
          }
        }
        // To-Do Type
        if (f.todoTypes.size > 0 && (!task.todoType || !f.todoTypes.has(task.todoType))) {
          return false;
        }
        // Flow Name
        if (f.flowNames.size > 0 && (!task.workflowName || !f.flowNames.has(task.workflowName))) {
          return false;
        }
        // Entity Type
        if (f.entityTypes.size > 0 && (!task.entityType || !f.entityTypes.has(task.entityType))) {
          return false;
        }
        return true;
      });
    }

    // 4. Apply search bar filter
    if (query.search && query.search.trim()) {
      const searchLower = query.search.toLowerCase();
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(searchLower) ||
          t.contactName.toLowerCase().includes(searchLower) ||
          t.companyName.toLowerCase().includes(searchLower) ||
          (t.aiSignal && t.aiSignal.toLowerCase().includes(searchLower))
      );
    }

    // 5. Apply sorting
    const sorted = [...list];
    const sortBy = query.sortBy || 'due_date';
    switch (sortBy) {
      case 'due_date':
        sorted.sort((a, b) => {
          const dateCompare = a.dueDate.localeCompare(b.dueDate);
          if (dateCompare !== 0) return dateCompare;
          return a.dueTime.localeCompare(b.dueTime);
        });
        break;
      case 'recent_activity':
        sorted.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        break;
      case 'priority':
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
    }

    // Pagination
    const page = query.page || 1;
    const size = query.size || 50;
    const total = sorted.length;
    const totalPages = Math.ceil(total / size) || 1;
    const pagedTasks = sorted.slice((page - 1) * size, page * size);

    // Status pills (At Risk & Due Today counts for currently filtered view)
    const atRisk = pagedTasks.filter(t => t.aiSignalType === 'risk').length;
    const dueToday = pagedTasks.filter(t => t.dueDate === todayStr).length;

    // 6. Grouping
    const groups: { groupLabel: string; count: number; tasks: Task[] }[] = [];
    const groupBy = query.groupBy || 'none';

    if (groupBy === 'none') {
      const highPriority = pagedTasks.filter(t => t.priority === 'high');
      const normalPriority = pagedTasks.filter(t => t.priority !== 'high');

      if (highPriority.length > 0) {
        groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority });
      }
      if (normalPriority.length > 0 || highPriority.length === 0) {
        groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority });
      }
    } else if (groupBy === 'flow') {
      const flows = new Map<string, Task[]>();
      pagedTasks.forEach(t => {
        const key = t.workflowName || 'No Flow';
        if (!flows.has(key)) flows.set(key, []);
        flows.get(key)!.push(t);
      });
      flows.forEach((tasks, label) => {
        groups.push({ groupLabel: label, count: tasks.length, tasks });
      });
    } else if (groupBy === 'step_number') {
      const steps = new Map<string, Task[]>();
      pagedTasks.forEach(t => {
        const key = t.workflowStep && t.totalWorkflowSteps
          ? `Step ${t.workflowStep} of ${t.totalWorkflowSteps}`
          : 'No Step';
        if (!steps.has(key)) steps.set(key, []);
        steps.get(key)!.push(t);
      });
      steps.forEach((tasks, label) => {
        groups.push({ groupLabel: label, count: tasks.length, tasks });
      });
    }

    const responsePayload = mockFetchTasksResponse(
      groups,
      tabCounts,
      { atRisk, dueToday },
      { page, size, total, totalPages }
    );
    return responsePayload.data;
  }
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
  try {
    // API Endpoint: GET /api/tasks/summary
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn('[engage.service] GET /api/tasks/summary failed, using mock data:', error);
    const allTasks = getTasksStore();
    const list = allTasks.filter(t => t.assigneeId === assigneeId);

    const todayTasks = list.filter(t => t.dueDate === date);
    const completedToday = todayTasks.filter(t => t.status === 'completed').length;
    const totalToday = todayTasks.length;

    const atRisk = list.filter(t => t.aiSignalType === 'risk' && t.status !== 'completed').length;
    const dueToday = totalToday;
    const highPriorityRemaining = todayTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    let headerAlert = `${highPriorityRemaining} high-priority deal${highPriorityRemaining === 1 ? '' : 's'} need attention today — ${atRisk} at risk of slipping`;
    if (highPriorityRemaining === 0) {
      headerAlert = `All high-priority tasks complete! ${todayTasks.filter(t => t.status !== 'completed').length} tasks remaining today.`;
    }

    const rawSummary = {
      totalToday,
      completedToday,
      atRisk,
      dueToday,
      highPriorityRemaining,
      completionPercentage,
      headerAlert,
    };

    const responsePayload = mockFetchSummaryResponse(rawSummary);
    return responsePayload.data;
  }
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
  try {
    // API Endpoint: POST /api/tasks
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
  } catch (error) {
    console.warn('[engage.service] POST /api/tasks failed, using mock data:', error);
    const allTasks = getTasksStore();
    const newId = `task_new_${Date.now()}`;
    const channelMap: Record<string, 'email' | 'call' | 'linkedin' | 'custom'> = {
      email: 'email',
      call: 'call',
      linkedin_message: 'linkedin',
      linkedin_connection: 'linkedin',
      custom: 'custom',
    };

    const newTask: Task = {
      id: newId,
      title: body.title,
      contactName: body.linkedToId.replace('contact_', '').replace('_', ' '),
      companyName: 'Linked Entity',
      channel: channelMap[body.taskType] || 'custom',
      scheduledTime: body.dueTime,
      dueDateTime: `Today, ${body.dueTime}`,
      isOverdue: false,
      interactionCount: 0,
      priority: 'normal',
      status: 'pending',
      dueDate: body.dueDate,
      dueTime: body.dueTime,
      assigneeId: body.assigneeId || 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      notes: body.description || '',
    };

    saveTasksStore([newTask, ...allTasks]);

    const responsePayload = mockCreateTaskApiResponse(newTask);
    return responsePayload.data;
  }
}

export async function searchLinkedEntities(search: string): Promise<{
  id: string;
  name: string;
  type: string;
  subLabel: string;
}[]> {
  const endpoint = `/api/search/linked-to?search=${encodeURIComponent(search)}`;
  try {
    // API Endpoint: GET /api/search/linked-to
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data.results;
  } catch (error) {
    console.warn('[engage.service] GET /api/search/linked-to failed, using mock data:', error);
    const list = [
      { id: 'contact_sarah_chen_001', name: 'Sarah Chen', type: 'contact', subLabel: 'VP of Sales · Acme Corp' },
      { id: 'account_acme_corp_001', name: 'Acme Corp', type: 'account', subLabel: 'Technology · 500-1000 employees' },
      { id: 'deal_q2_enterprise_001', name: 'Q2 Enterprise — Acme Corp', type: 'deal', subLabel: 'Negotiation · $180,000' },
      { id: 'contact_michael_rodriguez_002', name: 'Michael Rodriguez', type: 'contact', subLabel: 'IT Director · TechFlow Inc' },
      { id: 'account_techflow_inc_002', name: 'TechFlow Inc', type: 'account', subLabel: 'SaaS · 200-500 employees' },
      { id: 'deal_techflow_renewal_002', name: 'TechFlow Security Upgrade', type: 'deal', subLabel: 'Proposal · $95,000' }
    ];

    const query = search.toLowerCase();
    const filtered = list.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.subLabel.toLowerCase().includes(query)
    );

    const responsePayload = mockSearchLinkedEntitiesResponse(filtered);
    return responsePayload.data.results;
  }
}

export async function reassignTask(
  taskId: string,
  body: { newAssigneeId: string; scope: string; reason?: string }
): Promise<{ taskId: string; assigneeId: string; assigneeName: string; assigneeRole: string; updatedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/reassign`;
  try {
    // API Endpoint: PATCH /api/tasks/:taskId/reassign
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
  } catch (error) {
    console.warn(`[engage.service] PATCH ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const assignee = MOCK_TEAM_MEMBERS.find(m => m.id === body.newAssigneeId) || MOCK_TEAM_MEMBERS[0];

    let updatedTasks = allTasks.map(task => {
      const matchTask = task.id === taskId;
      const matchFuture = body.scope === 'this_and_future_tasks' && task.contactName === (allTasks.find(t => t.id === taskId)?.contactName);

      if (matchTask || matchFuture) {
        return {
          ...task,
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          assigneeRole: assignee.role,
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    saveTasksStore(updatedTasks);
    const updatedTask = updatedTasks.find(t => t.id === taskId)!;

    const responsePayload = mockReassignTaskApiResponse(updatedTask);
    return responsePayload.data;
  }
}

export async function fetchTaskDetail(taskId: string): Promise<Task> {
  const endpoint = `/api/tasks/${taskId}/detail`;
  try {
    // API Endpoint: GET /api/tasks/:taskId/detail
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn(`[engage.service] GET ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const task = allTasks.find(t => t.id === taskId) || allTasks[0];

    const responsePayload = mockFetchTaskDetailResponse(task);
    return responsePayload.data;
  }
}

export async function saveTaskNotes(taskId: string, notes: string): Promise<Task> {
  const endpoint = `/api/tasks/${taskId}/notes`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/notes
    const res = await apiFetch('POST', endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const updated = allTasks.map(t => (t.id === taskId ? { ...t, notes, updatedAt: new Date().toISOString() } : t));
    saveTasksStore(updated);

    const updatedTask = updated.find(t => t.id === taskId)!;
    const responsePayload = mockFetchTaskDetailResponse(updatedTask);
    return responsePayload.data;
  }
}

export async function fetchEmailDraft(taskId: string): Promise<Task['emailDraft']> {
  const endpoint = `/api/tasks/${taskId}/email-draft`;
  try {
    // API Endpoint: GET /api/tasks/:taskId/email-draft
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn(`[engage.service] GET ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const task = allTasks.find(t => t.id === taskId);
    let draft = task?.emailDraft || {
      to: 'client@company.com',
      fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
      subject: 'Outreach Follow-up',
      body: 'Hi, following up on our connection.'
    };
    if (draft && task?.contactName === 'Sarah Chen') {
      draft = {
        ...draft,
        to: 'sarah.chen@acmecorp.com'
      };
    }

    const responsePayload = mockFetchEmailDraftResponse(draft);
    return responsePayload.data;
  }
}

export async function sendEmail(
  taskId: string,
  body: { to: string; from: string; subject: string; body: string; notes?: string }
): Promise<void> {
  const endpoint = `/api/tasks/${taskId}/send-email`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/send-email
    await apiFetch('POST', endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const updated = allTasks.map(t =>
      t.id === taskId
        ? { ...t, status: 'completed' as const, notes: body.notes || t.notes, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasksStore(updated);
    return;
  }
}

export async function saveEmailDraft(
  taskId: string,
  body: { to: string; from: string; subject: string; body: string }
): Promise<void> {
  const endpoint = `/api/tasks/${taskId}/save-draft`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/save-draft
    await apiFetch('POST', endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const updated = allTasks.map(t =>
      t.id === taskId
        ? { ...t, emailDraft: { ...t.emailDraft, ...body, fromOptions: t.emailDraft?.fromOptions || [body.from] }, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasksStore(updated);
    return;
  }
}

export async function rephraseEmail(
  taskId: string,
  body: { currentBody: string; tone?: string }
): Promise<string> {
  const endpoint = `/api/tasks/${taskId}/ai-rephrase`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/ai-rephrase
    const res = await apiFetch('POST', endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    return payload.data.rephrasedBody;
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const tone = body.tone || 'professional';
    if (tone === 'concise') {
      return 'Hi Sarah,\n\nQuick follow-up on the Q2 renewal — I\'ve attached an ROI calculator tailored to Acme Corp\'s workflow showing a 3x efficiency gain in 90 days.\n\nCan we connect for 20 minutes before your May 28 board meeting to review?\n\nBest,\nAlex';
    }
    return 'Hi Sarah,\n\nI hope you are doing well. I wanted to follow up on our productive discussion regarding the Q2 contract renewal. Following up, I\'ve attached an ROI calculator matching your workflow showing a 3x efficiency gain in 90 days.\n\nLet\'s coordinate a brief sync next week. Let me know if that works.\n\nBest,\nAlex';
  }
}

export async function fetchEmailTemplates(): Promise<{ id: string; name: string; subject: string; body: string }[]> {
  const endpoint = '/api/email-templates?assigneeId=me';
  try {
    // API Endpoint: GET /api/email-templates
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data.templates;
  } catch (error) {
    console.warn('[engage.service] GET /api/email-templates failed, using mock data:', error);
    return MOCK_EMAIL_TEMPLATES;
  }
}

export async function fetchLinkedInScript(taskId: string): Promise<Task['linkedinScript'] & { mutualConnections?: number; linkedInProfileUrl?: string }> {
  const endpoint = `/api/tasks/${taskId}/linkedin-script`;
  try {
    // API Endpoint: GET /api/tasks/:taskId/linkedin-script
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn(`[engage.service] GET ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const task = allTasks.find(t => t.id === taskId);
    const script = {
      messageScript: task?.linkedinScript?.messageScript || 'Hi, would love to connect.',
      mutualConnections: task?.mutualConnections || 5,
      linkedInProfileUrl: 'https://linkedin.com'
    };

    const responsePayload = mockFetchLinkedInScriptResponse(script);
    return responsePayload.data;
  }
}

export async function markTaskComplete(taskId: string, notes?: string): Promise<void> {
  const endpoint = `/api/tasks/${taskId}/mark-complete`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/mark-complete
    await apiFetch('POST', endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const updated = allTasks.map(t =>
      t.id === taskId
        ? { ...t, status: 'completed' as const, notes: notes || t.notes, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasksStore(updated);
    return;
  }
}

export async function snoozeTask(taskId: string, durationDays: number): Promise<void> {
  const endpoint = `/api/tasks/${taskId}`;
  try {
    // API Endpoint: PATCH /api/tasks/:taskId (snooze)
    await apiFetch('PATCH', endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: getRelativeDateStr(durationDays) }),
    });
  } catch (error) {
    console.warn(`[engage.service] PATCH ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const newDate = getRelativeDateStr(durationDays);
    const updated = allTasks.map(t =>
      t.id === taskId
        ? { ...t, dueDate: newDate, snoozedUntil: newDate, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasksStore(updated);
    return;
  }
}

export async function fetchContactDetail(contactId: string): Promise<any> {
  const endpoint = `/api/contacts/${contactId}/detail`;
  try {
    // API Endpoint: GET /api/contacts/:contactId/detail
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn(`[engage.service] GET ${endpoint} failed, using mock data:`, error);
    const detail = {
      id: contactId,
      name: 'Sarah Chen',
      role: 'VP of Sales',
      companyName: 'Acme Corp',
      phone: '+1 (555) 123-4567',
      email: 'sarah.chen@acmecorp.com',
      linkedInUrl: 'https://linkedin.com/in/sarah-chen-demo',
      engagementTimeline: [
        { relativeTime: '2 hours ago', label: 'LinkedIn profile viewed', type: 'linkedin' },
        { relativeTime: '1 day ago', label: 'Link clicked', type: 'link' },
        { relativeTime: '3 days ago', label: 'Phone call', type: 'call' },
        { relativeTime: '1 week ago', label: 'Meeting scheduled', type: 'meeting' }
      ],
      accountInfo: {
        industry: 'Technology',
        size: '500-1000',
        website: 'acmecorp.com'
      },
      dealInfo: {
        dealName: 'Q2 Enterprise',
        stage: 'Negotiation',
        value: '$180,000',
        closeDate: 'Jun 30, 2026'
      },
      notes: 'Requested case study from similar scale companies and IT compliance documents.'
    };

    const responsePayload = mockFetchContactDetailResponse(detail);
    return responsePayload.data;
  }
}

function getRelativeDateStr(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

export async function skipTask(taskId: string): Promise<{ taskId: string; status: string; action: string; updatedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/skip`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/skip
    const res = await apiFetch('POST', endpoint);
    const payload = await res.json();
    return {
      taskId: payload.data.taskId || payload.data.id,
      status: payload.data.status,
      action: payload.data.action || 'skipped',
      updatedAt: payload.data.updatedAt || payload.data.updated_at,
    };
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const updated = allTasks.map(t =>
      t.id === taskId
        ? { ...t, status: 'completed' as const, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasksStore(updated);
    const responsePayload = mockSkipTaskResponse(taskId);
    return responsePayload.data;
  }
}

export async function dismissTask(taskId: string): Promise<{ taskId: string; status: string; action: string; updatedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/dismiss`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/dismiss
    const res = await apiFetch('POST', endpoint);
    const payload = await res.json();
    return {
      taskId: payload.data.taskId || payload.data.id,
      status: payload.data.status,
      action: payload.data.action || 'dismissed',
      updatedAt: payload.data.updatedAt || payload.data.updated_at,
    };
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const allTasks = getTasksStore();
    const updated = allTasks.map(t =>
      t.id === taskId
        ? { ...t, status: 'completed' as const, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasksStore(updated);
    const responsePayload = mockDismissTaskResponse(taskId);
    return responsePayload.data;
  }
}

export async function logTaskAction(
  taskId: string,
  action: string,
  notes?: string
): Promise<{ taskId: string; action: string; loggedAt: string }> {
  const endpoint = `/api/tasks/${taskId}/action`;
  try {
    // API Endpoint: POST /api/tasks/:taskId/action
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
  } catch (error) {
    console.warn(`[engage.service] POST ${endpoint} failed, using mock data:`, error);
    const responsePayload = mockActionResponse(taskId, action);
    return responsePayload.data;
  }
}

export async function fetchRecentActivity(): Promise<any[]> {
  const endpoint = '/api/activities/recent';
  try {
    // API Endpoint: GET /api/activities/recent
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn('[engage.service] GET /api/activities/recent failed, using mock data:', error);
    const responsePayload = mockFetchRecentActivityResponse(MOCK_RECENT_ACTIVITY);
    return responsePayload.data;
  }
}

export async function fetchFilterConfig(): Promise<{ flows: string[]; entityTypes: string[]; localTimes: string[] }> {
  const endpoint = '/api/tasks/filters-config';
  try {
    // API Endpoint: GET /api/tasks/filters-config
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn('[engage.service] GET /api/tasks/filters-config failed, using mock data:', error);
    const config = {
      flows: [
        'Enterprise Outbound Q2 2026',
        'Mid-Market Follow-up',
        'Social Selling Campaign',
        'Product Launch Sequence',
        'Customer Onboarding',
        'Renewal Outreach',
      ],
      entityTypes: ['account', 'deal', 'lead'],
      localTimes: ['morning', 'business_hours', 'custom'],
    };
    const responsePayload = mockFetchFiltersConfigResponse(config);
    return responsePayload.data;
  }
}

export async function fetchTeamMembers(): Promise<any[]> {
  const endpoint = '/api/team/members';
  try {
    // API Endpoint: GET /api/team/members
    const res = await apiFetch('GET', endpoint);
    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.warn('[engage.service] GET /api/team/members failed, using mock data:', error);
    const responsePayload = mockFetchTeamMembersResponse(MOCK_TEAM_MEMBERS);
    return responsePayload.data;
  }
}
