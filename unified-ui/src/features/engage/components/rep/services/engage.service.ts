import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import type {
  Task,
  TaskSummary,
  TaskDetail,
  TaskNote,
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
  const text = await res.text();
  if (!text.trim()) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
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

export async function fetchTaskNotes(taskId: string): Promise<TaskNote[]> {
  return apiRequest<TaskNote[]>(`/tasks/${taskId}/notes`);
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

export async function rephraseEmail(
  taskId: string,
  emailData: {
    subject?: string;
    body?: string;
    bodyHtml?: string;
    contactName?: string;
    company?: string;
    tone?: string;
  },
): Promise<{ rephrasedBody: string }> {
  const res = await fetch('/api/engage/rephrase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, ...emailData }),
  });

  const text = await res.text();
  if (!res.ok) {
    let message = `Rephrase failed (${res.status})`;
    try {
      const err = JSON.parse(text) as { error?: string };
      if (err.error) message = err.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (!text.trim()) {
    throw new Error('Rephrase returned an empty response');
  }

  const payload = JSON.parse(text) as {
    rephrasedBody?: string;
    data?: { rephrasedBody?: string };
  };

  const rephrasedBody = payload.rephrasedBody || payload.data?.rephrasedBody;
  if (!rephrasedBody) {
    throw new Error('Rephrase response missing body text');
  }

  return { rephrasedBody };
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
