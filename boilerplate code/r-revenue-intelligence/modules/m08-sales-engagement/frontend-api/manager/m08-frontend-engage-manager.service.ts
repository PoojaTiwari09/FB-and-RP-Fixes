import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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

    let list = tasks.filter((t) => {
      if (query.assigneeId === 'me') return true;
      return t.assigneeId === query.assigneeId;
    });

    const todayStr = query.date;
    const now = new Date();
    const isCurrentlySnoozed = (t: any) => {
      if (!t.snoozedUntil) return false;
      return new Date(t.snoozedUntil) > now;
    };

    const getCounts = (taskList: any[]) => ({
      today: taskList.filter((t) => t.dueDate === todayStr && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t)).length,
      inProgress: taskList.filter((t) => t.status.toLowerCase() === 'in_progress' && !isCurrentlySnoozed(t)).length,
      upcoming: taskList.filter(
        (t) => t.dueDate !== todayStr && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t),
      ).length,
      completed: taskList.filter((t) => t.status.toLowerCase() === 'completed').length,
      snoozed: taskList.filter((t) => isCurrentlySnoozed(t)).length,
    });

    let channelFilteredList = list;
    if (query.channel && query.channel !== 'all') {
      channelFilteredList = list.filter((t) => t.channel.toLowerCase() === query.channel?.toLowerCase());
    }
    const tabCounts = getCounts(channelFilteredList);

    const currentTab = query.tab || 'today';
    switch (currentTab) {
      case 'today':
        list = channelFilteredList.filter(
          (t) => t.dueDate === todayStr && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t),
        );
        break;
      case 'inProgress':
        list = channelFilteredList.filter((t) => t.status.toLowerCase() === 'in_progress' && !isCurrentlySnoozed(t));
        break;
      case 'upcoming':
        list = channelFilteredList.filter(
          (t) =>
            t.dueDate !== todayStr && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t),
        );
        break;
      case 'completed':
        list = channelFilteredList.filter((t) => t.status.toLowerCase() === 'completed');
        break;
      case 'snoozed':
        list = channelFilteredList.filter((t) => isCurrentlySnoozed(t));
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
      sorted.sort(
        (a, b) =>
          (order[String(a.priority).toUpperCase()] ?? 1) - (order[String(b.priority).toUpperCase()] ?? 1),
      );
    } else if (sortBy === 'recent_activity') {
      sorted.sort((a, b) =>
        String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
      );
    } else {
      sorted.sort((a, b) => {
        const d = String(a.dueDate).localeCompare(String(b.dueDate));
        return d !== 0 ? d : String(a.dueTime || '').localeCompare(String(b.dueTime || ''));
      });
    }

    const page = query.page || 1;
    const size = query.size || 50;
    const total = sorted.length;
    const totalPages = Math.ceil(total / size) || 1;
    const pagedTasks = sorted.slice((page - 1) * size, page * size);

    const atRisk = pagedTasks.filter((t) => t.aiSignalType === 'risk').length;
    const dueToday = pagedTasks.filter((t) => t.dueDate === todayStr).length;

    const groups: { groupLabel: string; count: number; tasks: any[] }[] = [];
    const highPriority = pagedTasks.filter((t) => t.priority.toUpperCase() === 'HIGH');
    const normalPriority = pagedTasks.filter((t) => t.priority.toUpperCase() !== 'HIGH');
    
    // Normalize mapping helper for tasks
    const mapTask = (t: any) => ({
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
      assigneeId: t.assigneeId || 'me',
      assigneeName: t.assigneeName || 'Alex Morgan',
      assigneeRole: t.assigneeRole || 'Account Executive',
      arr: t.arr || '',
      todoType: t.todoType || 'manual',
      entityType: t.entityType || 'lead',
      workflowName: t.workflowName || '',
      workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
      totalWorkflowSteps: t.totalWorkflowSteps || undefined,
      aiSignal: t.aiSignal || '',
      aiSignalType: t.aiSignalType || '',
      snoozedUntil: t.snoozedUntil,
    });

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
      snooze: tabCounts.snoozed,
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

  async fetchSummary(tenantId: string, assigneeId: string, date: string) {
    const tasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
    });

    const list =
      assigneeId === 'me'
        ? tasks
        : tasks.filter((t) => t.assigneeId === assigneeId);

    const now = new Date();
    const isCurrentlySnoozed = (t: any) => {
      if (!t.snoozedUntil) return false;
      return new Date(t.snoozedUntil) > now;
    };

    const activeList = list.filter((t) => !isCurrentlySnoozed(t));

    const todayTasks = activeList.filter((t) => t.dueDate === date);
    const completedToday = todayTasks.filter((t) => t.status.toLowerCase() === 'completed').length;
    const totalToday = todayTasks.length;
    const highPriorityRemaining = todayTasks.filter(
      (t) => t.priority.toUpperCase() === 'HIGH' && t.status.toLowerCase() !== 'completed',
    ).length;
    const atRisk = activeList.filter(
      (t) => t.isAtRisk && t.status.toLowerCase() !== 'completed',
    ).length;
    const completionPercentage =
      totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    return {
      status: 'success',
      data: {
        totalToday,
        completedToday,
        atRisk,
        dueToday: totalToday,
        highPriorityRemaining,
        completionPercentage,
        headerAlert: `${highPriorityRemaining} high-priority deals need attention today — ${atRisk} at risk of slipping`,
      },
    };
  }

  async fetchTeamMembers(tenantId: string) {
    // Return seeded members
    const members = [
      { id: 'me', name: 'Alex Morgan', role: 'Account Executive' },
      { id: 'sarah', name: 'Sarah Chen', role: 'Senior AE' },
      { id: 'michael', name: 'Michael Rodriguez', role: 'Account Executive' },
      { id: 'jennifer', name: 'Jennifer Kim', role: 'Team Lead' },
      { id: 'david', name: 'David Park', role: 'Account Executive' },
      { id: 'emily', name: 'Emily Thompson', role: 'Senior AE' },
    ];
    return { status: 'success', data: members };
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
        assigneeId: t.assigneeId || 'me',
        assigneeName: t.assigneeName || 'Alex Morgan',
        assigneeRole: t.assigneeRole || 'Account Executive',
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
    const d = await this.prisma.emailDraft.findFirst({
      where: { tenantId, taskId },
    });

    if (!d) {
      return {
        status: 'success',
        data: {
          to: 'client@company.com',
          fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
          subject: 'Outreach Follow-up',
          body: 'Hi, following up on our connection.',
        },
      };
    }

    return {
      status: 'success',
      data: {
        to: d.contactEmail || '',
        fromOptions: d.fromLabel ? [d.fromLabel] : ['alex.morgan@relanto.ai (Gmail)'],
        subject: d.subject,
        body: d.bodyHtml,
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
    const newTask = await this.prisma.engageTask.create({
      data: {
        tenantId,
        taskId,
        title: body.title,
        contactName: body.contactName || 'New Contact',
        companyName: body.companyName || 'New Company',
        channel: (body.channel || 'custom').toUpperCase(),
        status: 'PENDING',
        dueDate: body.dueDate || new Date().toISOString().split('T')[0],
        dueTime: body.dueTime || null,
        scheduledTime: body.dueTime || null,
        dueDateTime: body.dueDate ? `${body.dueDate}T${body.dueTime || '00:00:00'}` : new Date().toISOString(),
        priority: (body.priority || 'NORMAL').toUpperCase(),
        assigneeId: body.assigneeId || 'me',
        assigneeName: body.assigneeName || 'Alex Morgan',
        assigneeRole: body.assigneeRole || 'Account Executive',
        todoType: body.todoType || 'manual',
        entityType: body.entityType || 'lead',
        interactionCount: 0,
        isOverdue: false,
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

  async reassignTask(tenantId: string, taskId: string, newAssigneeId: string) {
    const updated = await this.prisma.engageTask.update({
      where: { taskId },
      data: {
        assigneeId: newAssigneeId,
        assigneeName: newAssigneeId === 'me' ? 'Alex Morgan' : 'Sarah Chen',
        assigneeRole: newAssigneeId === 'me' ? 'Account Executive' : 'Senior AE',
      },
    });

    return {
      status: 'success',
      data: {
        taskId: updated.taskId,
        assigneeId: updated.assigneeId,
        assigneeName: updated.assigneeName,
        assigneeRole: updated.assigneeRole,
        updatedAt: updated.updatedAt.toISOString(),
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
    await this.prisma.engageTask.update({
      where: { taskId },
      data: { notes },
    });
    return { status: 'success', data: { ok: true } };
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

  async updateTask(tenantId: string, taskId: string, body: any) {
    const updated = await this.prisma.engageTask.update({
      where: { taskId },
      data: body,
    });
    return { status: 'success', data: updated };
  }
}

