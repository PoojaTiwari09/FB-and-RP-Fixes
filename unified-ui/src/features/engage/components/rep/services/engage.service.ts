import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import type {
  Task,
  TaskSummary,
  TaskDetail,
  RecentActivity,
  ContactDetails,
  EmailDraft,
  LinkedInDraft,
  FilterOptions,
  EmailTemplate,
} from '../types/engage.types';

const ENGAGE_BASE = `${ENV.M08_API_BASE_URL}/api/engage`;

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${ENGAGE_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getBridgeHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function getTasks(): Promise<Task[]> {
  return apiRequest<Task[]>('/tasks');
}

export async function getTaskSummary(): Promise<TaskSummary> {
  return apiRequest<TaskSummary>('/tasks/summary');
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  return apiRequest<RecentActivity[]>(`/activity/recent?limit=${limit}`);
}

export async function getTaskDetail(taskId: string): Promise<TaskDetail | undefined> {
  return apiRequest<TaskDetail | undefined>(`/tasks/${taskId}/detail`);
}

export async function getContactDetails(contactId: string): Promise<ContactDetails | undefined> {
  return apiRequest<ContactDetails | undefined>(`/contacts/${contactId}/details`);
}

export async function getEmailDraft(taskId: string): Promise<EmailDraft | undefined> {
  return apiRequest<EmailDraft | undefined>(`/tasks/${taskId}/email-draft`);
}

export async function getLinkedInDraft(taskId: string): Promise<LinkedInDraft | undefined> {
  return apiRequest<LinkedInDraft | undefined>(`/tasks/${taskId}/linkedin-draft`);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return apiRequest<FilterOptions>('/filters/options');
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return apiRequest<EmailTemplate[]>('/email-templates');
}

// --- Write Endpoints ---

export async function createTask(task: Partial<Task>): Promise<any> {
  return apiRequest<any>('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
}

export async function saveNotes(taskId: string, notes: string): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
}

export async function sendEmail(taskId: string, emailData: any): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData),
  });
}

export async function saveDraft(taskId: string, draftData: any): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/save-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftData),
  });
}

export async function rephraseEmail(taskId: string, emailData: any): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/ai-rephrase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData),
  });
}

export async function markComplete(taskId: string): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/mark-complete`, {
    method: 'POST',
  });
}

export async function skipTask(taskId: string): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/skip`, {
    method: 'POST',
  });
}

export async function dismissTask(taskId: string): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/dismiss`, {
    method: 'POST',
  });
}

export async function reassignTask(taskId: string, newAssigneeId: string): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/reassign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newAssigneeId }),
  });
}

export async function updateTask(taskId: string, fields: Partial<Task>): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}
