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
import {
  MOCK_TASKS,
  MOCK_TASK_SUMMARY,
  MOCK_TASK_DETAILS,
  MOCK_RECENT_ACTIVITY,
  MOCK_CONTACT_DETAILS,
  MOCK_EMAIL_DRAFTS,
  MOCK_LINKEDIN_DRAFTS,
  MOCK_FILTER_OPTIONS,
  MOCK_EMAIL_TEMPLATES,
} from '../mocks/engage.mock';

const ENGAGE_BASE = `${ENV.M08_API_BASE_URL}/api/engage`;

async function engageFetch<T>(path: string, fallback: T): Promise<T> {
  if (ENV.USE_MOCK_DATA) return fallback;
  try {
    const res = await fetch(`${ENGAGE_BASE}${path}`, {
      cache: 'no-store',
      headers: getBridgeHeaders(),
    });
    if (!res.ok) throw new Error(`Engage API ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`engageFetch ${path}: using mock fallback`, error);
    return fallback;
  }
}

export async function getTasks(): Promise<Task[]> {
  return engageFetch('/tasks', MOCK_TASKS);
}

export async function getTaskSummary(): Promise<TaskSummary> {
  return engageFetch('/tasks/summary', MOCK_TASK_SUMMARY);
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  return engageFetch(`/activity/recent?limit=${limit}`, MOCK_RECENT_ACTIVITY.slice(0, limit));
}

export async function getTaskDetail(taskId: string): Promise<TaskDetail | undefined> {
  const data = await engageFetch<TaskDetail | null>(`/tasks/${taskId}/detail`, MOCK_TASK_DETAILS[taskId] ?? null);
  return data ?? undefined;
}

export async function getContactDetails(contactId: string): Promise<ContactDetails | undefined> {
  const data = await engageFetch<ContactDetails | null>(
    `/contacts/${contactId}/details`,
    MOCK_CONTACT_DETAILS[contactId] ?? null,
  );
  return data ?? undefined;
}

export async function getEmailDraft(taskId: string): Promise<EmailDraft | undefined> {
  const data = await engageFetch<EmailDraft | null>(
    `/tasks/${taskId}/email-draft`,
    MOCK_EMAIL_DRAFTS[taskId] ?? null,
  );
  return data ?? undefined;
}

export async function getLinkedInDraft(taskId: string): Promise<LinkedInDraft | undefined> {
  const data = await engageFetch<LinkedInDraft | null>(
    `/tasks/${taskId}/linkedin-draft`,
    MOCK_LINKEDIN_DRAFTS[taskId] ?? null,
  );
  return data ?? undefined;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return engageFetch('/filters/options', MOCK_FILTER_OPTIONS);
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return engageFetch('/email-templates', MOCK_EMAIL_TEMPLATES);
}
