import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  appendEngageTaskNote,
  latestEngageTaskNote,
  parseEngageTaskNotes,
} from './m08-task-notes.util';
import { buildAutoEmailDraft } from './m08-email-draft.util';
import { rephraseEmailWithGroq } from './m08-groq-rephrase.util';
import {
  buildTaskTitle,
  resolveDueDateTime,
  resolveSequenceName,
  resolveSequenceStep,
} from './m08-task-format.util';
import { resolveTeamMember, mapTaskAssignee } from './m08-team-members.util';

@Injectable()
export class M08FrontendEngageService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks(tenantId: string) {
    const dbTasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const mappedTasks = dbTasks.map((t) => {
      const isCompleted = t.status.toUpperCase() === 'COMPLETED';
      let isOverdue = t.isOverdue;
      if (!isCompleted && t.dueDate && t.dueDate < todayStr) {
        isOverdue = true;
      }
      const priority = (isOverdue ? 'HIGH' : t.priority).toUpperCase();

      return {
        taskId: t.taskId,
        contactId: t.contactId || '',
        contactName: t.contactName,
        company: t.companyName,
        channelType: t.channel.toUpperCase(),
        sequenceName: resolveSequenceName(t),
        sequenceStep: resolveSequenceStep(t),
        scheduledTime: t.scheduledTime || '',
        dueDateTime: resolveDueDateTime(t),
        interactionCount: t.interactionCount,
        priority,
        status: t.status.toUpperCase(),
        isOverdue,
        isAtRisk: t.isAtRisk,
        dueDate: t.dueDate,
        dueTime: t.dueTime || '',
        createdAt: t.createdAt,
      };
    });

    // Properly sort tasks: Priority First, then Due Date Ascending, then Due Time Ascending, then CreatedAt Descending
    mappedTasks.sort((a, b) => {
      const priorityOrder: Record<string, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };
      const pDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      if (pDiff !== 0) return pDiff;

      if (a.dueDate && b.dueDate) {
        const dDiff = a.dueDate.localeCompare(b.dueDate);
        if (dDiff !== 0) return dDiff;
      } else if (a.dueDate) {
        return -1;
      } else if (b.dueDate) {
        return 1;
      }

      if (a.dueTime && b.dueTime) {
        const tDiff = a.dueTime.localeCompare(b.dueTime);
        if (tDiff !== 0) return tDiff;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return mappedTasks.map(({ dueDate, dueTime, createdAt, ...rest }) => rest);
  }

  async getTaskSummary(tenantId: string) {
    const tasks = await this.prisma.engageTask.findMany({
      where: { tenantId },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const totalTasksToday = tasks.filter((t) => t.status !== 'COMPLETED').length;
    const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const upcomingCount = tasks.filter((t) => t.status === 'PENDING').length;
    const atRiskCount = tasks.filter((t) => t.isAtRisk && t.status !== 'COMPLETED').length;
    const dueTodayCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
    
    // Dynamically calculate high priority count including overdue tasks
    const highPriorityCount = tasks.filter((t) => {
      const isCompleted = t.status === 'COMPLETED';
      if (isCompleted) return false;
      const isOverdue = t.isOverdue || (t.dueDate && t.dueDate < todayStr);
      return isOverdue || t.priority === 'HIGH';
    }).length;

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
      taskTitle: buildTaskTitle(t),
      contactId: t.contactId || '',
      contactName: t.contactName,
      company: t.companyName,
      arrValue: t.arr || '',
      scheduledDateTime: resolveDueDateTime(t),
      aiInsight: t.aiInsight || '',
      recommendedNextSteps: t.recommendedNextSteps || [],
      recentActivity: (t.recentActivity as any) || [],
      existingNotes: latestEngageTaskNote(t.notes) || '',
    };
  }

  async getNotes(tenantId: string, taskId: string) {
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) return [];

    return parseEngageTaskNotes(t.notes).map((n) => ({
      noteId: n.noteId,
      taskId: t.taskId,
      note: n.note,
      authorName: n.authorName,
      timestamp: n.createdAt,
      createdAt: n.createdAt,
    }));
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
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!t) return null;

    const d = await this.prisma.emailDraft.findFirst({
      where: { tenantId, taskId },
    });

    if (d) {
      return {
        taskId: d.taskId,
        contactName: d.contactName || t.contactName,
        contactEmail: d.contactEmail || '',
        fromEmail: d.fromEmail || 'alex.chen@company.com',
        fromLabel: d.fromLabel || 'alex.chen@company.com (Gmail)',
        subject: d.subject,
        bodyHtml: d.bodyHtml,
        sequenceName: t.sequenceName || '',
        sequenceStep: t.sequenceStep || '',
        dueDateTime: t.dueDateTime || '',
      };
    }

    const contact = t.contactId
      ? await this.prisma.engageContact.findFirst({
          where: { tenantId, contactId: t.contactId },
        })
      : null;

    return buildAutoEmailDraft(t, contact);
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
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = body.dueDate || todayStr;
    const isOverdue = dueDate < todayStr;
    const priority = (isOverdue ? 'HIGH' : (body.priority || 'NORMAL')).toUpperCase();

    const newTask = await this.prisma.engageTask.create({
      data: {
        tenantId,
        taskId,
        title: body.title,
        contactName: body.contactName || 'New Contact',
        companyName: body.companyName || 'New Company',
        channel: (body.channel || 'custom').toUpperCase(),
        status: 'PENDING',
        dueDate,
        dueTime: body.dueTime || null,
        scheduledTime: body.dueTime || null,
        dueDateTime: body.dueDate ? `${body.dueDate}T${body.dueTime || '00:00:00'}` : new Date().toISOString(),
        priority,
        assigneeId: body.assigneeId || 'me',
        assigneeName: body.assigneeName || 'Alex Morgan',
        assigneeRole: body.assigneeRole || 'Account Executive',
        todoType: body.todoType || 'manual',
        entityType: body.entityType || 'lead',
        interactionCount: 0,
        isOverdue,
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
    const t = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });

    try {
      const rephrasedBody = await rephraseEmailWithGroq({
        subject: body.subject,
        body: body.body || body.currentBody,
        bodyHtml: body.bodyHtml,
        contactName: body.contactName || t?.contactName,
        company: body.company || body.companyName || t?.companyName,
        tone: body.tone,
      });

      return {
        status: 'success',
        data: { rephrasedBody },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rephrase failed';
      return {
        status: 'error',
        message,
        data: { rephrasedBody: body.body || body.currentBody || '' },
      };
    }
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
    const task = await this.prisma.engageTask.findFirst({
      where: { tenantId, taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const member = resolveTeamMember(newAssigneeId);
    const updated = await this.prisma.engageTask.update({
      where: { taskId: task.taskId },
      data: {
        assigneeId: member.id,
        assigneeName: member.name,
        assigneeRole: member.role,
      },
    });
    return { status: 'success', data: updated };
  }
}
