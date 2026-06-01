import { Injectable } from '@nestjs/common';
import {
  MOCK_TASKS,
  MOCK_TASK_SUMMARY,
  MOCK_RECENT_ACTIVITY,
  MOCK_TASK_DETAILS,
  MOCK_CONTACT_DETAILS,
  MOCK_EMAIL_DRAFTS,
  MOCK_LINKEDIN_DRAFTS,
  MOCK_FILTER_OPTIONS,
  MOCK_EMAIL_TEMPLATES,
} from './m08-frontend-engage.seed';

@Injectable()
export class M08FrontendEngageService {
  getTasks() {
    return MOCK_TASKS;
  }

  getTaskSummary() {
    return MOCK_TASK_SUMMARY;
  }

  getRecentActivity(limit: number) {
    return MOCK_RECENT_ACTIVITY.slice(0, Math.max(1, limit));
  }

  getTaskDetail(taskId: string) {
    return MOCK_TASK_DETAILS[taskId] ?? null;
  }

  getContactDetails(contactId: string) {
    return MOCK_CONTACT_DETAILS[contactId] ?? null;
  }

  getEmailDraft(taskId: string) {
    return MOCK_EMAIL_DRAFTS[taskId] ?? null;
  }

  getLinkedInDraft(taskId: string) {
    return MOCK_LINKEDIN_DRAFTS[taskId] ?? null;
  }

  getFilterOptions() {
    return MOCK_FILTER_OPTIONS;
  }

  getEmailTemplates() {
    return MOCK_EMAIL_TEMPLATES;
  }
}
