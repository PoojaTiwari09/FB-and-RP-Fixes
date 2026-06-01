import { Injectable } from '@nestjs/common';
import {
  INITIAL_MOCK_TASKS,
  MOCK_TEAM_MEMBERS,
  MOCK_RECENT_ACTIVITY,
  MOCK_EMAIL_TEMPLATES,
  mockFetchTasksResponse,
  mockFetchSummaryResponse,
  mockFetchTaskDetailResponse,
  mockFetchRecentActivityResponse,
  mockFetchTeamMembersResponse,
  mockFetchFiltersConfigResponse,
  mockFetchEmailDraftResponse,
  mockFetchLinkedInScriptResponse,
  mockFetchContactDetailResponse,
  mockCreateTaskApiResponse,
  mockReassignTaskApiResponse,
  mockSkipTaskResponse,
  mockDismissTaskResponse,
  mockActionResponse,
  mockSearchLinkedEntitiesResponse,
} from './m08-engage-manager.seed';

type EngageTask = Record<string, unknown>;

function getRelativeDateStr(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

@Injectable()
export class M08FrontendEngageManagerService {
  private tasks: EngageTask[] = INITIAL_MOCK_TASKS() as EngageTask[];

  fetchTasks(query: {
    assigneeId: string;
    date: string;
    tab: string;
    channel?: string;
    search?: string;
    groupBy?: string;
    sortBy?: string;
    filters?: Record<string, unknown> | null;
    page?: number;
    size?: number;
  }) {
    let list = this.tasks.filter((t) => {
      if (query.assigneeId === 'me') return true;
      return t.assigneeId === query.assigneeId;
    });

    const todayStr = query.date;
    const getCounts = (taskList: EngageTask[]) => ({
      today: taskList.filter((t) => t.dueDate === todayStr && t.status !== 'completed').length,
      inProgress: taskList.filter((t) => t.status === 'in_progress').length,
      upcoming: taskList.filter(
        (t) => t.dueDate !== todayStr && t.status !== 'completed' && !t.snoozedUntil,
      ).length,
      completed: taskList.filter((t) => t.status === 'completed').length,
    });

    let channelFilteredList = list;
    if (query.channel && query.channel !== 'all') {
      channelFilteredList = list.filter((t) => t.channel === query.channel);
    }
    const tabCounts = getCounts(channelFilteredList);

    switch (query.tab) {
      case 'today':
        list = channelFilteredList.filter(
          (t) => t.dueDate === todayStr && t.status !== 'completed',
        );
        break;
      case 'inProgress':
        list = channelFilteredList.filter((t) => t.status === 'in_progress');
        break;
      case 'upcoming':
        list = channelFilteredList.filter(
          (t) =>
            t.dueDate !== todayStr && t.status !== 'completed' && !t.snoozedUntil,
        );
        break;
      case 'completed':
        list = channelFilteredList.filter((t) => t.status === 'completed');
        break;
      default:
        list = channelFilteredList;
    }

    if (query.search?.trim()) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (t) =>
          String(t.title).toLowerCase().includes(q) ||
          String(t.contactName).toLowerCase().includes(q) ||
          String(t.companyName).toLowerCase().includes(q),
      );
    }

    const sorted = [...list];
    const sortBy = query.sortBy || 'due_date';
    if (sortBy === 'priority') {
      const order: Record<string, number> = { high: 0, normal: 1, low: 2 };
      sorted.sort(
        (a, b) =>
          (order[String(a.priority)] ?? 1) - (order[String(b.priority)] ?? 1),
      );
    } else if (sortBy === 'recent_activity') {
      sorted.sort((a, b) =>
        String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
      );
    } else {
      sorted.sort((a, b) => {
        const d = String(a.dueDate).localeCompare(String(b.dueDate));
        return d !== 0 ? d : String(a.dueTime).localeCompare(String(b.dueTime));
      });
    }

    const page = query.page || 1;
    const size = query.size || 50;
    const total = sorted.length;
    const totalPages = Math.ceil(total / size) || 1;
    const pagedTasks = sorted.slice((page - 1) * size, page * size);

    const atRisk = pagedTasks.filter((t) => t.aiSignalType === 'risk').length;
    const dueToday = pagedTasks.filter((t) => t.dueDate === todayStr).length;

    const groups: { groupLabel: string; count: number; tasks: EngageTask[] }[] = [];
    const highPriority = pagedTasks.filter((t) => t.priority === 'high');
    const normalPriority = pagedTasks.filter((t) => t.priority !== 'high');
    if (highPriority.length) {
      groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority });
    }
    if (normalPriority.length || !highPriority.length) {
      groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority });
    }

    return mockFetchTasksResponse(groups, tabCounts, { atRisk, dueToday }, {
      page,
      size,
      total,
      totalPages,
    });
  }

  fetchSummary(assigneeId: string, date: string) {
    const list =
      assigneeId === 'me'
        ? this.tasks
        : this.tasks.filter((t) => t.assigneeId === assigneeId);
    const todayTasks = list.filter((t) => t.dueDate === date);
    const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
    const totalToday = todayTasks.length;
    const highPriorityRemaining = todayTasks.filter(
      (t) => t.priority === 'high' && t.status !== 'completed',
    ).length;
    const atRisk = list.filter(
      (t) => t.aiSignalType === 'risk' && t.status !== 'completed',
    ).length;
    const completionPercentage =
      totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    return mockFetchSummaryResponse({
      totalToday,
      completedToday,
      atRisk,
      dueToday: totalToday,
      highPriorityRemaining,
      completionPercentage,
      headerAlert: `${highPriorityRemaining} high-priority deals need attention today — ${atRisk} at risk of slipping`,
    });
  }

  fetchTeamMembers() {
    return mockFetchTeamMembersResponse(MOCK_TEAM_MEMBERS);
  }

  fetchRecentActivity() {
    return mockFetchRecentActivityResponse(MOCK_RECENT_ACTIVITY);
  }

  fetchFiltersConfig() {
    return mockFetchFiltersConfigResponse({
      flows: [
        'Enterprise Outbound Q2 2026',
        'Mid-Market Follow-up',
        'Social Selling Campaign',
      ],
      entityTypes: ['account', 'deal', 'lead'],
      localTimes: ['morning', 'business_hours', 'custom'],
    });
  }

  fetchTaskDetail(taskId: string) {
    const task = this.tasks.find((t) => t.id === taskId) || this.tasks[0];
    return mockFetchTaskDetailResponse(task);
  }

  fetchEmailDraft(taskId: string) {
    const task = this.tasks.find((t) => t.id === taskId);
    return mockFetchEmailDraftResponse(
      task?.emailDraft || {
        to: 'client@company.com',
        fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
        subject: 'Outreach Follow-up',
        body: 'Hi, following up on our connection.',
      },
    );
  }

  fetchLinkedInScript(taskId: string) {
    const task = this.tasks.find((t) => t.id === taskId);
    return mockFetchLinkedInScriptResponse({
      messageScript: task?.linkedinScript?.messageScript || 'Hi, would love to connect.',
      mutualConnections: task?.mutualConnections || 5,
      linkedInProfileUrl: 'https://linkedin.com',
    });
  }

  fetchContactDetail(contactId: string) {
    return mockFetchContactDetailResponse({
      id: contactId,
      name: 'Sarah Chen',
      role: 'VP of Sales',
      companyName: 'Acme Corp',
    });
  }

  searchLinkedEntities(search: string) {
    const list = [
      {
        id: 'contact_sarah_chen_001',
        name: 'Sarah Chen',
        type: 'contact',
        subLabel: 'VP of Sales · Acme Corp',
      },
    ];
    const q = search.toLowerCase();
    const filtered = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) || i.subLabel.toLowerCase().includes(q),
    );
    return mockSearchLinkedEntitiesResponse(filtered);
  }

  createTask(body: Record<string, unknown>) {
    const newId = `task_new_${Date.now()}`;
    const newTask: EngageTask = {
      id: newId,
      title: body.title,
      contactName: 'New Contact',
      companyName: 'Linked Entity',
      channel: 'custom',
      status: 'pending',
      dueDate: body.dueDate,
      dueTime: body.dueTime,
      assigneeId: body.assigneeId || 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      priority: 'normal',
      interactionCount: 0,
      isOverdue: false,
      scheduledTime: body.dueTime,
      dueDateTime: `Today, ${body.dueTime}`,
    };
    this.tasks = [newTask, ...this.tasks];
    return mockCreateTaskApiResponse(newTask);
  }

  reassignTask(taskId: string, newAssigneeId: string) {
    const member =
      MOCK_TEAM_MEMBERS.find((m) => m.id === newAssigneeId) || MOCK_TEAM_MEMBERS[0];
    this.tasks = this.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            assigneeId: member.id,
            assigneeName: member.name,
            assigneeRole: member.role,
            updatedAt: new Date().toISOString(),
          }
        : t,
    );
    const updated = this.tasks.find((t) => t.id === taskId)!;
    return mockReassignTaskApiResponse(updated);
  }

  markComplete(taskId: string) {
    this.tasks = this.tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'completed', updatedAt: new Date().toISOString() } : t,
    );
    return { status: 'success', data: { ok: true } };
  }

  skipTask(taskId: string) {
    return mockSkipTaskResponse(taskId);
  }

  dismissTask(taskId: string) {
    return mockDismissTaskResponse(taskId);
  }

  logAction(taskId: string, action: string) {
    return mockActionResponse(taskId, action);
  }

  emailTemplates() {
    return { status: 'success', data: { templates: MOCK_EMAIL_TEMPLATES } };
  }
}
