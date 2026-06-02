import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class M08FrontendEngageService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks(tenantId: string) {
    const dbTasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Map DB fields to frontend format expected by the rep engage components
    return dbTasks.map((t) => ({
      taskId: t.taskId,
      contactId: t.contactId || '',
      contactName: t.contactName,
      company: t.companyName,
      channelType: t.channel.toUpperCase(),
      sequenceName: t.sequenceName || '',
      sequenceStep: t.sequenceStep || '',
      scheduledTime: t.scheduledTime || '',
      dueDateTime: t.dueDateTime || '',
      interactionCount: t.interactionCount,
      priority: t.priority.toUpperCase(),
      status: t.status.toUpperCase(),
      isOverdue: t.isOverdue,
      isAtRisk: t.isAtRisk,
    }));
  }

  async getTaskSummary(tenantId: string) {
    const tasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
    });

    const totalTasksToday = tasks.filter((t) => t.status !== 'COMPLETED').length;
    const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const upcomingCount = tasks.filter((t) => t.status === 'PENDING').length;
    const atRiskCount = tasks.filter((t) => t.isAtRisk && t.status !== 'COMPLETED').length;
    const dueTodayCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
    const highPriorityCount = tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;

    const total = completedCount + upcomingCount + inProgressCount;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      totalTasksToday,
      completedCount,
      inProgressCount,
      upcomingCount,
      atRiskCount,
      dueTodayCount,
      highPriorityCount,
      progressPercent,
    };
  }

  async getRecentActivity(tenantId: string, limit: number) {
    const activities = await this.prisma.engageActivity.findMany({
      where: { tenantId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((a) => ({
      activityId: a.activityId,
      contactId: a.contactId || '',
      contactName: a.contactName,
      company: a.company || '',
      channelType: a.channelType,
      summary: a.summary,
      occurredAt: a.occurredAt,
      timeAgoLabel: a.timeAgoLabel || '',
    }));
  }

  async getTaskDetail(tenantId: string, taskId: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) return null;

    return {
      taskId: t.taskId,
      taskTitle: t.title,
      contactId: t.contactId || '',
      contactName: t.contactName,
      company: t.companyName,
      arrValue: t.arr || '',
      scheduledDateTime: t.dueDateTime || '',
      aiInsight: t.aiInsight || '',
      recommendedNextSteps: t.recommendedNextSteps || [],
      recentActivity: (t.recentActivity as any) || [],
      existingNotes: t.notes || '',
    };
  }

  async getContactDetails(tenantId: string, contactId: string) {
    const c = await this.prisma.engageContact.findFirst({
      where: { tenantId, contactId },
    });
    if (!c) return null;

    return {
      contactId: c.contactId,
      contactName: c.contactName,
      jobTitle: c.jobTitle || '',
      company: c.company || '',
      phone: c.phone || '',
      email: c.email || '',
      linkedInUrl: c.linkedInUrl || '',
      engagementTimeline: (c.engagementTimeline as any) || [],
      accountInfo: (c.accountInfo as any) || {},
      dealInfo: (c.dealInfo as any) || {},
    };
  }

  async getEmailDraft(tenantId: string, taskId: string) {
    const d = await this.prisma.emailDraft.findFirst({
      where: { tenantId, taskId },
    });
    if (!d) return null;

    return {
      taskId: d.taskId,
      contactName: d.contactName || '',
      contactEmail: d.contactEmail || '',
      fromEmail: d.fromEmail || '',
      fromLabel: d.fromLabel || '',
      subject: d.subject,
      bodyHtml: d.bodyHtml,
    };
  }

  async getLinkedInDraft(tenantId: string, taskId: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) return null;

    const contact = await this.prisma.engageContact.findFirst({
      where: { tenantId, contactId: t.contactId || '' },
    });

    const recentAct = t.recentActivity as any[];
    const mutualConnections = (t as any).mutualConnections || 5;

    return {
      taskId: t.taskId,
      contactId: t.contactId || '',
      contactName: t.contactName,
      contactTitle: contact?.jobTitle || '',
      contactCompany: t.companyName,
      linkedInProfileUrl: contact?.linkedInUrl || 'https://linkedin.com',
      mutualConnections,
      messageScript: (t as any).messageScript || `Hi ${t.contactName},\n\nI noticed we share several mutual connections and wanted to connect.\n\nBest,\nAlex`,
      sequenceName: t.sequenceName || '',
      sequenceStep: t.sequenceStep || '',
      dueDateTime: t.dueDateTime || '',
    };
  }

  async getFilterOptions(tenantId: string) {
    const templates = await this.prisma.emailTemplate.findMany({
      where: { tenantId },
    });

    const flowNames = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))).map((cat) => ({
      flowId: `flow_${cat}`,
      flowName: cat,
    }));

    return {
      flowNames: flowNames.length ? flowNames : [{ flowId: 'flow-001', flowName: 'General Outreach' }],
      crmFields: {
        account: [
          { fieldId: 'a-001', fieldLabel: 'Industry', fieldType: 'DROPDOWN', options: ['Technology', 'FinTech', 'SaaS'] },
          { fieldId: 'a-002', fieldLabel: 'ARR', fieldType: 'NUMBER' },
        ],
        contact: [
          { fieldId: 'c-001', fieldLabel: 'Job Title', fieldType: 'TEXT' },
        ],
      },
    };
  }

  async getEmailTemplates(tenantId: string) {
    const templates = await this.prisma.emailTemplate.findMany({
      where: { tenantId },
    });

    return templates.map((t) => ({
      templateId: t.templateId,
      templateName: t.templateName,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      category: t.category || '',
    }));
  }

  // --- Write Operations ---

  async createTask(tenantId: string, body: any) {
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

  async updateTask(tenantId: string, taskId: string, body: any) {
    const updated = await this.prisma.engageTask.update({
      where: { taskId },
      data: body,
    });
    return { status: 'success', data: updated };
  }

  async saveNotes(tenantId: string, taskId: string, notes: string) {
    const updated = await this.prisma.engageTask.update({
      where: { taskId },
      data: { notes },
    });
    return { status: 'success', data: updated };
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

  async saveDraft(tenantId: string, taskId: string, body: any) {
    const draft = await this.prisma.emailDraft.upsert({
      where: { taskId },
      update: {
        subject: body.subject,
        bodyHtml: body.bodyHtml || body.body || '',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        fromEmail: body.fromEmail,
        fromLabel: body.fromLabel,
      },
      create: {
        tenantId,
        taskId,
        subject: body.subject,
        bodyHtml: body.bodyHtml || body.body || '',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        fromEmail: body.fromEmail,
        fromLabel: body.fromLabel,
      },
    });

    return { status: 'success', data: draft };
  }

  async rephraseEmail(tenantId: string, taskId: string, body: any) {
    const text = body.bodyHtml || body.body || '';
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
      data: { status: 'COMPLETED' }, // skip completed
    });
    return { status: 'success', data: { ok: true, action: 'skipped' } };
  }

  async dismissTask(tenantId: string, taskId: string) {
    await this.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' }, // dismiss completed
    });
    return { status: 'success', data: { ok: true, action: 'dismissed' } };
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
    return { status: 'success', data: updated };
  }
}
