import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { appendEngageTaskNote, parseEngageTaskNotes } from '../m08-task-notes.util';
import { buildAutoEmailDraft } from '../m08-email-draft.util';
import { ENGAGE_TEAM_MEMBERS, mapTaskAssignee, resolveTeamMember } from '../m08-team-members.util';

function normalizeEngageStatus(status: string): string {
  return String(status || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function isCompletedStatus(status: string): boolean {
  return normalizeEngageStatus(status) === 'COMPLETED';
}

@Injectable()
export class M08FrontendEngageManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchTasks(
    tenantId: string,
    query: {
      assigneeId: string;
      date: string;
      tab: string;
      channel?: string;
      search?: string;
      groupBy?: string;
      sortBy?: string;
      page?: number;
      size?: number;
    }
  ) {
    const tasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
    });

    const todayStrRaw = new Date().toISOString().split('T')[0];

    const normalizedTasks = tasks.map((t) => {
      const isCompleted = isCompletedStatus(t.status);
      // Check if task is overdue - any task with past due date that's not completed
      let isOverdue = t.isOverdue;
      if (!isCompleted && t.dueDate && t.dueDate < todayStrRaw) {
        isOverdue = true;
      }
      // Automatically elevate overdue tasks to HIGH priority
      const priority = isOverdue ? 'HIGH' : t.priority;
      return {
        ...t,
        isOverdue,
        priority,
      };
    });

    let list = normalizedTasks.filter((t) => {
      if (query.assigneeId === 'me') return true;
      return t.assigneeId === query.assigneeId;
    });

    const todayStr = query.date;
    const getCounts = (taskList: any[]) => ({
      today: taskList.filter((t) => !isCompletedStatus(t.status)).length,
      inProgress: taskList.filter((t) => normalizeEngageStatus(t.status) === 'IN_PROGRESS').length,
      upcoming: taskList.filter((t) => normalizeEngageStatus(t.status) === 'PENDING').length,
      completed: taskList.filter((t) => isCompletedStatus(t.status)).length,
    });

    let channelFilteredList = list;
    if (query.channel && query.channel !== 'all') {
      channelFilteredList = list.filter((t) => t.channel.toLowerCase() === query.channel?.toLowerCase());
    }
    const tabCounts = getCounts(channelFilteredList);

    const currentTab = query.tab || 'today';
    switch (currentTab) {
      case 'today':
        list = channelFilteredList.filter((t) => !isCompletedStatus(t.status));
        break;
      case 'inProgress':
        list = channelFilteredList.filter((t) => normalizeEngageStatus(t.status) === 'IN_PROGRESS');
        break;
      case 'upcoming':
        list = channelFilteredList.filter((t) => normalizeEngageStatus(t.status) === 'PENDING');
        break;
      case 'completed':
        list = channelFilteredList.filter((t) => isCompletedStatus(t.status));
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
      const order: Record<string, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };
      sorted.sort((a, b) => {
        const pDiff = (order[String(a.priority).toUpperCase()] ?? 1) - (order[String(b.priority).toUpperCase()] ?? 1);
        if (pDiff !== 0) return pDiff;
        
        // Within HIGH priority, sort overdue tasks first, then by due date
        if (String(a.priority).toUpperCase() === 'HIGH') {
          const aOverdue = a.isOverdue ? 1 : 0;
          const bOverdue = b.isOverdue ? 1 : 0;
          const overdueDiff = bOverdue - aOverdue;
          if (overdueDiff !== 0) return overdueDiff;
          
          return String(a.dueDate).localeCompare(String(b.dueDate));
        }
        
        return String(a.dueDate).localeCompare(String(b.dueDate));
      });
    } else if (sortBy === 'recent_activity') {
      sorted.sort((a, b) =>
        String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
      );
    } else {
      // Default sorting: priority first, then within HIGH priority sort overdue first
      sorted.sort((a, b) => {
        const priorityOrder: Record<string, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };
        const pDiff = (priorityOrder[String(a.priority).toUpperCase()] ?? 1) - (priorityOrder[String(b.priority).toUpperCase()] ?? 1);
        if (pDiff !== 0) return pDiff;

        // Within HIGH priority, sort overdue tasks first by how overdue they are
        if (String(a.priority).toUpperCase() === 'HIGH') {
          const aOverdue = a.isOverdue ? 1 : 0;
          const bOverdue = b.isOverdue ? 1 : 0;
          const overdueDiff = bOverdue - aOverdue;
          if (overdueDiff !== 0) return overdueDiff;
        }

        const dDiff = String(a.dueDate).localeCompare(String(b.dueDate));
        if (dDiff !== 0) return dDiff;

        return String(a.dueTime || '').localeCompare(String(b.dueTime || ''));
      });
    }

    const page = query.page || 1;
    const size = query.size || 50;
    const total = sorted.length;
    const totalPages = Math.ceil(total / size) || 1;
    const pagedTasks = sorted.slice((page - 1) * size, page * size);

    const atRisk = channelFilteredList.filter(
      (t) => t.isAtRisk && !isCompletedStatus(t.status),
    ).length;
    const dueToday = channelFilteredList.filter((t) => !isCompletedStatus(t.status)).length;

    const groups: { groupLabel: string; count: number; tasks: any[] }[] = [];
    const highPriority = pagedTasks.filter((t) => t.priority.toUpperCase() === 'HIGH');
    const normalPriority = pagedTasks.filter((t) => t.priority.toUpperCase() !== 'HIGH');
    
    // Normalize mapping helper for tasks
    const mapTask = (t: any) => {
      const assignee = mapTaskAssignee(t);
      return {
      id: t.taskId,
      title: t.title,
      contactName: t.contactName,
      companyName: t.companyName,
      channel: t.channel.toLowerCase(),
      scheduledTime: t.scheduledTime || '',
      dueDateTime: t.dueDateTime || '',
      isOverdue: t.isOverdue,
      isAtRisk: t.isAtRisk,
      interactionCount: t.interactionCount,
      priority: t.priority.toLowerCase(),
      status: t.status.toLowerCase(),
      dueDate: t.dueDate,
      dueTime: t.dueTime || '',
      assigneeId: assignee.assigneeId,
      assigneeName: assignee.assigneeName,
      assigneeRole: assignee.assigneeRole,
      arr: t.arr || '',
      todoType: t.todoType || 'manual',
      entityType: t.entityType || 'lead',
      workflowName: t.workflowName || '',
      workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
      totalWorkflowSteps: t.totalWorkflowSteps || undefined,
      aiSignal: t.aiSignal || '',
      aiSignalType: t.aiSignalType || '',
      aiInsight: t.aiInsight || '',
      recommendedNextSteps: t.recommendedNextSteps || [],
      recentActivity: (t.recentActivity as any) || [],
      notes: t.notes || '',
    };
    };

    if (highPriority.length) {
      groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority.map(mapTask) });
    }
    if (normalPriority.length || !highPriority.length) {
      groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority.map(mapTask) });
    }

    // Capitalize status tab names to match response expected
    const normalizedTabCounts = {
      today: tabCounts.today,
      inProgress: tabCounts.inProgress,
      upcoming: tabCounts.upcoming,
      completed: tabCounts.completed,
    };

    return {
      status: 'success',
      data: {
        groups,
        tabCounts: normalizedTabCounts,
        statusPills: { atRisk, dueToday },
        pagination: {
          page,
          size,
          total,
          totalPages,
        },
      },
    };
  }

  async fetchSummary(tenantId: string, assigneeId: string, _date: string) {
    const tasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
    });

    const list =
      assigneeId === 'me'
        ? tasks
        : tasks.filter((t) => t.assigneeId === assigneeId);

    const todayStrSummary = new Date().toISOString().split('T')[0];
    const openTasks = list.filter((t) => !isCompletedStatus(t.status));
    const completedToday = list.filter((t) => isCompletedStatus(t.status)).length;
    const totalToday = openTasks.length;
    // Dynamically promote overdue tasks to HIGH when calculating high priority count
    const highPriorityRemaining = openTasks.filter((t) => {
      const isOverdue = t.isOverdue || (t.dueDate && t.dueDate < todayStrSummary);
      return isOverdue || String(t.priority).toUpperCase() === 'HIGH';
    }).length;
    const atRisk = openTasks.filter((t) => t.isAtRisk).length;
    const inProgress = list.filter((t) => normalizeEngageStatus(t.status) === 'IN_PROGRESS').length;
    const upcoming = list.filter((t) => normalizeEngageStatus(t.status) === 'PENDING').length;
    const completionPercentage =
      list.length > 0 ? Math.round((completedToday / list.length) * 100) : 0;

    return {
      status: 'success',
      data: {
        totalToday,
        completedToday,
        atRisk,
        dueToday: totalToday,
        highPriorityRemaining,
        completionPercentage,
        headerAlert: `${highPriorityRemaining} high-priority deals need attention today${
          atRisk > 0 ? ` — ${atRisk} at risk of slipping` : ''
        }`,
        inProgressCount: inProgress,
        upcomingCount: upcoming,
      },
    };
  }

  async fetchTeamMembers(_tenantId: string) {
    return { status: 'success', data: [...ENGAGE_TEAM_MEMBERS] };
  }

  async fetchRecentActivity(tenantId: string) {
    const activities = await this.prisma.engageActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: 'success',
      data: activities.map((a) => ({
        id: a.activityId,
        contactName: a.contactName,
        companyName: a.company || '',
        activityType: a.channelType.toLowerCase(),
        description: a.summary,
        timeAgo: a.timeAgoLabel || '1h ago',
      })),
    };
  }

  async fetchFiltersConfig(tenantId: string) {
    return {
      status: 'success',
      data: {
        flows: [
          'Enterprise Outbound Q2 2026',
          'Mid-Market Follow-up',
          'Social Selling Campaign',
        ],
        entityTypes: ['account', 'deal', 'lead'],
        localTimes: ['morning', 'business_hours', 'custom'],
      },
    };
  }

  async fetchTaskDetail(tenantId: string, taskId: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) throw new NotFoundException('Task not found');

    const assignee = mapTaskAssignee(t);

    return {
      status: 'success',
      data: {
        id: t.taskId,
        title: t.title,
        contactName: t.contactName,
        companyName: t.companyName,
        channel: t.channel.toLowerCase(),
        scheduledTime: t.scheduledTime || '',
        dueDateTime: t.dueDateTime || '',
        isOverdue: t.isOverdue,
        isAtRisk: t.isAtRisk,
        interactionCount: t.interactionCount,
        priority: t.priority.toLowerCase(),
        status: t.status.toLowerCase(),
        dueDate: t.dueDate,
        dueTime: t.dueTime || '',
        assigneeId: assignee.assigneeId,
        assigneeName: assignee.assigneeName,
        assigneeRole: assignee.assigneeRole,
        arr: t.arr || '',
        todoType: t.todoType || 'manual',
        entityType: t.entityType || 'lead',
        workflowName: t.workflowName || '',
        workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
        totalWorkflowSteps: t.totalWorkflowSteps || undefined,
        aiSignal: t.aiSignal || '',
        aiSignalType: t.aiSignalType || '',
        aiInsight: t.aiInsight || '',
        recommendedNextSteps: t.recommendedNextSteps || [],
        recentActivity: (t.recentActivity as any) || [],
        notes: t.notes || '',
      },
    };
  }

  async fetchEmailDraft(tenantId: string, taskId: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) throw new NotFoundException('Task not found');

    const d = await this.prisma.emailDraft.findFirst({
      where: { tenantId, taskId },
    });

    if (d) {
      return {
        status: 'success',
        data: {
          to: d.contactEmail || '',
          fromOptions: d.fromLabel ? [d.fromLabel] : ['alex.chen@company.com (Gmail)'],
          subject: d.subject,
          body: d.bodyHtml,
        },
      };
    }

    const contact = t.contactId
      ? await this.prisma.engageContact.findFirst({
          where: { tenantId, contactId: t.contactId },
        })
      : null;

    const auto = buildAutoEmailDraft(t, contact);
    return {
      status: 'success',
      data: {
        to: auto.contactEmail || '',
        fromOptions: auto.fromLabel ? [auto.fromLabel] : ['alex.chen@company.com (Gmail)'],
        subject: auto.subject,
        body: auto.bodyHtml,
      },
    };
  }

  async fetchLinkedInScript(tenantId: string, taskId: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) throw new NotFoundException('Task not found');

    const contact = await this.prisma.engageContact.findFirst({
      where: { tenantId, contactId: t.contactId || '' },
    });

    return {
      status: 'success',
      data: {
        messageScript: (t as any).messageScript || 'Hi, would love to connect.',
        mutualConnections: (t as any).mutualConnections || 5,
        linkedInProfileUrl: contact?.linkedInUrl || 'https://linkedin.com',
      },
    };
  }

  async fetchContactDetail(tenantId: string, contactId: string) {
    const c = await this.prisma.engageContact.findFirst({
      where: { tenantId, contactId },
    });
    if (!c) throw new NotFoundException('Contact not found');

    return {
      status: 'success',
      data: {
        id: c.contactId,
        name: c.contactName,
        role: c.jobTitle || '',
        companyName: c.company || '',
      },
    };
  }

  async searchLinkedEntities(tenantId: string, search: string) {
    const contacts = await this.prisma.engageContact.findMany({
      where: { tenantId },
    });

    const list = contacts.map((c) => ({
      id: c.contactId,
      name: c.contactName,
      type: 'contact',
      subLabel: `${c.jobTitle || 'Executive'} · ${c.company || 'Company'}`,
    }));

    const q = search.toLowerCase();
    const filtered = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) || i.subLabel.toLowerCase().includes(q),
    );

    return {
      status: 'success',
      data: {
        results: filtered,
      },
    };
  }

  async createTask(tenantId: string, body: Record<string, any>) {
    const taskId = `task_${Date.now()}`;
    const assignee = resolveTeamMember(body.assigneeId || 'me');

    let contactName = body.contactName || 'New Contact';
    let companyName = body.companyName || 'New Company';
    let contactId: string | null = body.contactId || null;

    if (body.linkedToId && body.linkedToType === 'contact') {
      const contact = await this.prisma.engageContact.findFirst({
        where: { tenantId, contactId: body.linkedToId },
      });
      if (contact) {
        contactId = contact.contactId;
        contactName = contact.contactName;
        companyName = contact.company || companyName;
      }
    }

    const todayStrCreate = new Date().toISOString().split('T')[0];
    const dueDateCreate = body.dueDate || todayStrCreate;
    const isOverdueCreate = dueDateCreate < todayStrCreate;
    const priorityCreate = (isOverdueCreate ? 'HIGH' : (body.priority || 'NORMAL')).toUpperCase();

    const newTask = await this.prisma.engageTask.create({
      data: {
        tenantId,
        taskId,
        title: body.title,
        contactId,
        contactName,
        companyName,
        channel: (body.taskType || body.channel || 'custom').toUpperCase(),
        status: 'PENDING',
        dueDate: dueDateCreate,
        dueTime: body.dueTime || null,
        scheduledTime: body.dueTime || null,
        dueDateTime: body.dueDate ? `${body.dueDate}T${body.dueTime || '00:00:00'}` : new Date().toISOString(),
        priority: priorityCreate,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        assigneeRole: assignee.role,
        todoType: body.todoType || 'manual',
        entityType: body.entityType || 'lead',
        interactionCount: 0,
        isOverdue: isOverdueCreate,
        isAtRisk: false,
        recommendedNextSteps: body.recommendedNextSteps || [],
      },
    });

    return {
      status: 'success',
      data: {
        taskId: newTask.taskId,
        status: newTask.status,
        createdAt: newTask.createdAt.toISOString(),
      },
    };
  }

  async reassignTask(
    tenantId: string,
    taskId: string,
    body: { newAssigneeId: string; scope?: string; reason?: string },
  ) {
    const { newAssigneeId, scope = 'this_task_only', reason } = body;
    if (!newAssigneeId?.trim()) {
      throw new NotFoundException('newAssigneeId is required');
    }

    const task = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const member = resolveTeamMember(newAssigneeId);
    const assigneeData = {
      assigneeId: member.id,
      assigneeName: member.name,
      assigneeRole: member.role,
    };

    if (scope === 'this_and_future_tasks') {
      const contactFilter = task.contactId
        ? { tenantId, contactId: task.contactId }
        : { tenantId, contactName: task.contactName, companyName: task.companyName };

      await this.prisma.engageTask.updateMany({
        where: contactFilter,
        data: assigneeData,
      });
    } else {
      await this.prisma.engageTask.update({
        where: { taskId: task.taskId },
        data: assigneeData,
      });
    }

    if (reason?.trim()) {
      const noteText = `Reassigned to ${member.name}${reason.trim() ? `: ${reason.trim()}` : ''}`;
      const updatedNotes = appendEngageTaskNote(task.notes, noteText, 'Manager');
      await this.prisma.engageTask.update({
        where: { taskId: task.taskId },
        data: { notes: updatedNotes },
      });
    }

    const updated = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    const assignee = mapTaskAssignee(updated!);

    return {
      status: 'success',
      data: {
        taskId: updated!.taskId,
        assigneeId: assignee.assigneeId,
        assigneeName: assignee.assigneeName,
        assigneeRole: assignee.assigneeRole,
        updatedAt: updated!.updatedAt.toISOString(),
      },
    };
  }

  async markComplete(tenantId: string, taskId: string) {
    await this.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });
    return { status: 'success', data: { ok: true } };
  }

  async skipTask(tenantId: string, taskId: string) {
    await this.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });

    return {
      status: 'success',
      data: {
        taskId,
        status: 'completed',
        action: 'skipped',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async dismissTask(tenantId: string, taskId: string) {
    await this.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });

    return {
      status: 'success',
      data: {
        taskId,
        status: 'completed',
        action: 'dismissed',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async logAction(tenantId: string, taskId: string, action: string) {
    return {
      status: 'success',
      data: {
        taskId,
        action,
        loggedAt: new Date().toISOString(),
      },
    };
  }

  async emailTemplates(tenantId: string) {
    const templates = await this.prisma.emailTemplate.findMany({
      where: { tenantId },
    });

    const mapped = templates.map((t) => ({
      id: t.templateId,
      name: t.templateName,
      subject: t.subject,
      body: t.bodyHtml,
    }));

    return {
      status: 'success',
      data: {
        templates: mapped.length ? mapped : [],
      },
    };
  }

  async saveNotes(tenantId: string, taskId: string, notes: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) throw new NotFoundException('Task not found');

    const serialized = appendEngageTaskNote(t.notes, notes);
    const saved = parseEngageTaskNotes(serialized)[0];

    await this.prisma.engageTask.update({
      where: { taskId },
      data: { notes: serialized },
    });

    return {
      status: 'success',
      data: {
        noteId: saved.noteId,
        taskId,
        note: saved.note,
        authorName: saved.authorName,
        timestamp: saved.createdAt,
        createdAt: saved.createdAt,
      },
    };
  }

  async saveDraft(tenantId: string, taskId: string, body: any) {
    const draft = await this.prisma.emailDraft.upsert({
      where: { taskId },
      update: {
        subject: body.subject,
        bodyHtml: body.body || body.bodyHtml || '',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        fromEmail: body.fromEmail,
        fromLabel: body.fromLabel,
      },
      create: {
        tenantId,
        taskId,
        subject: body.subject,
        bodyHtml: body.body || body.bodyHtml || '',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        fromEmail: body.fromEmail,
        fromLabel: body.fromLabel,
      },
    });

    return { status: 'success', data: draft };
  }

  async sendEmail(tenantId: string, taskId: string, body: any) {
    const t = await this.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });

    await this.prisma.engageActivity.create({
      data: {
        tenantId,
        activityId: `act_${Date.now()}`,
        contactName: t.contactName,
        company: t.companyName,
        channelType: 'EMAIL',
        summary: `Sent email: ${body.subject || 'Outreach'}`,
        occurredAt: new Date().toISOString(),
        timeAgoLabel: 'Just now',
      },
    });

    return { status: 'success', data: { ok: true } };
  }

  async rephraseEmail(tenantId: string, taskId: string, body: any) {
    const text = body.body || body.bodyHtml || '';
    const rephrasedBody = text
      ? `${text}\n\n[AI Rephrased: Clearer, more concise call-to-action added.]`
      : 'Hi Sarah,\n\nFollowing up on our Q2 renewal. Let me know if you would like to run through the ROI projections.\n\nBest,\nAlex';

    return {
      status: 'success',
      data: {
        rephrasedBody,
      },
    };
  }
}
