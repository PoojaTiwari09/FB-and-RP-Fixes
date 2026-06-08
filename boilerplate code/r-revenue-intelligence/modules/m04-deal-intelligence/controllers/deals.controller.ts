import { Controller, Get, Post, Patch, Delete, Param, Query, Logger, Body, Req } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DealSummaryService } from '../services/deal-summary.service';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  isMock: boolean;
  error?: string;
}

@Controller('api/deals')
export class DealsController {
  private readonly logger = new Logger(DealsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly summaryService: DealSummaryService,
  ) {}

  private async getBoardsFromDb(): Promise<any[]> {
    const boards = [
      {
        boardId: 'board-1',
        name: 'My Deals',
        description: 'Personal deal tracking and management',
        owner: 'John Smith',
        canEdit: true,
      },
      {
        boardId: 'board-2',
        name: 'Enterprise Deals Q2',
        description: 'All enterprise opportunities for Q2 2026',
        owner: 'Sarah Chen',
        canEdit: false,
      },
      {
        boardId: 'board-3',
        name: 'Team Pipeline - West',
        description: 'Western region team pipeline overview',
        owner: 'Michael Rodriguez',
        canEdit: false,
      },
      {
        boardId: 'board-4',
        name: 'Strategic Accounts',
        description: 'High-value strategic account opportunities',
        owner: 'Jennifer Kim',
        canEdit: true,
      },
    ];

    return Promise.all(
      boards.map(async (b) => {
        const latestDeal = await this.prisma.deal.findFirst({
          where: { pipeline: b.boardId },
          orderBy: { updatedAt: 'desc' },
        });
        return {
          ...b,
          lastModified: latestDeal?.updatedAt?.toISOString() || new Date().toISOString(),
        };
      })
    );
  }

  @Get('boards')
  async getDealBoards(): Promise<ApiResponse<any[]>> {
    try {
      const boards = await this.getBoardsFromDb();
      return { success: true, data: boards, isMock: false };
    } catch (error: any) {
      this.logger.error('Failed to get deal boards:', error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Get('boards/:boardId')
  async getBoardDetail(
    @Param('boardId') boardId: string,
    @Query('owner') owner?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const boards = await this.getBoardsFromDb();
      const board = boards.find((b) => b.boardId === boardId);
      if (!board) throw new Error('Board not found');

      // Calculate summary cards dynamically from DB deals on this board
      const deals = await this.prisma.deal.findMany({
        where: {
          pipeline: boardId,
          ...(owner ? { ownerName: { contains: owner, mode: 'insensitive' } } : {}),
        },
      });

      const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
      const summaryCards = categories.map((category) => {
        const catDeals = deals.filter((d) => d.forecastCategory === category);
        const count = catDeals.length;
        const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);
        return {
          label: category,
          amount: total,
          count,
          changePercent: 12,
        };
      });

      return {
        success: true,
        data: {
          boardId: board.boardId,
          name: board.name,
          ownerTag: `Owner = ${board.owner}`,
          summaryCards,
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get board detail for ${boardId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get('boards/:boardId/deals')
  async getDealsByBoard(
    @Param('boardId') boardId: string,
    @Query('owner') owner?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const dbDeals = await this.prisma.deal.findMany({
        where: {
          pipeline: boardId,
          ...(owner ? { ownerName: { contains: owner, mode: 'insensitive' } } : {}),
        },
        orderBy: { name: 'asc' },
      });

      const enrichedDeals = await Promise.all(
        dbDeals.map(async (d) => {
          const warnings = await this.prisma.dealWarning.findMany({
            where: { dealId: d.id, status: 'active' },
          });

          // Compute playbook score from completed playbook criteria in DB
          const criteria = await this.prisma.dealPlaybook.findMany({
            where: { dealId: d.id },
          });
          const completedCount = criteria.filter((c) => c.status === 'Completed').length;
          const playbookScore = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : d.meddpiccScore || 0;

          // Compute activity list
          const activities = await this.prisma.dealActivityEvent.findMany({
            where: { dealId: d.id },
            orderBy: { date: 'asc' },
          });

          const activityOverTime = activities.map((a, idx) => ({
            dateLabel: a.date.substring(5).toUpperCase().replace('-', ' '),
            count: 1,
            interactions: [
              {
                id: a.id,
                type: a.direction === 'inbound' ? 'customer' as const : 'rep' as const,
                size: 12,
                positionPercent: idx * 20,
              },
            ],
          }));

          return {
            dealId: d.id,
            dealName: d.name,
            company: d.name.split(' - ')[0],
            stage: d.stage,
            amount: Number(d.amount),
            forecastCategory: d.forecastCategory || 'Open',
            closeDate: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
            assignedRep: d.ownerName || 'Lakshmi Prasanna Dara',
            contacts: d.warningsCount || 2,
            notificationCount: 0,
            aiWarningCount: warnings.length,
            flagCount: d.escalated ? 1 : 0,
            flagReason: d.escalated ? 'Manager has escalated this deal.' : undefined,
            activityOverTime,
            playbookScore,
            playbookColor: playbookScore >= 75 ? 'green' : playbookScore >= 50 ? 'orange' : 'red',
            aiSuggestedNextStep: d.nextStep || 'Schedule next stakeholder meeting',
          };
        })
      );

      return { success: true, data: enrichedDeals, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get deals for board ${boardId}:`, error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Get('all')
  async getAllDeals(): Promise<ApiResponse<any[]> & { count: number }> {
    try {
      const dbDeals = await this.prisma.deal.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      const mapped = dbDeals.map((d) => {
        const amt = Number(d.amount);
        const amountStr = amt >= 1000 ? `$${(amt / 1000).toFixed(0)}K` : `$${amt}`;
        return {
          id: d.id,
          name: d.name,
          stage: d.stage,
          category: d.forecastCategory || 'Open',
          amount: amountStr,
          aiScore: d.aiScore || 50,
          warnings: d.warningsCount || 0,
          meddpiccPercent: d.meddpiccScore || 0,
          contacts: 2,
          ownerName: d.ownerName,
          ownerEmail: d.ownerEmail,
          owner: {
            name: d.ownerName || 'Lakshmi Prasanna Dara',
            email: d.ownerEmail || 'lakshmi@company.com',
            initials: (d.ownerName || 'UN').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
            color: '#4f46e5',
          },
        };
      });

      return { success: true, data: mapped, count: mapped.length, isMock: false };
    } catch (error: any) {
      this.logger.error('Failed to get all deals:', error);
      return { success: false, data: [], count: 0, isMock: false, error: error.message };
    }
  }

  @Get('pipeline-summary')
  async getPipelineSummary(): Promise<ApiResponse<any[]>> {
    try {
      const deals = await this.prisma.deal.findMany();
      const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];

      const summary = categories.map((category) => {
        const catDeals = deals.filter((d) => d.forecastCategory === category);
        const count = catDeals.length;
        const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);

        let amountStr = '$0';
        if (total >= 1000000) {
          amountStr = `$${(total / 1000000).toFixed(1)}M`;
        } else if (total >= 1000) {
          amountStr = `$${(total / 1000).toFixed(0)}K`;
        } else {
          amountStr = `$${total}`;
        }

        return {
          label: category,
          amount: amountStr,
          count,
          change: '$0 [0]',
        };
      });

      return { success: true, data: summary, isMock: false };
    } catch (error: any) {
      this.logger.error('Failed to calculate pipeline summary:', error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Get(':dealId')
  async getDealById(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
      });
      if (!deal) throw new Error('Deal not found');
      return { success: true, data: deal, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get deal by id ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Patch(':dealId')
  async updateDeal(
    @Param('dealId') dealId: string,
    @Body() updates: {
      stage?: string;
      forecastCategory?: string;
      amount?: number | string;
      nextStep?: string;
      closeDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const data: any = {};
      if (updates.stage !== undefined) data.stage = updates.stage;
      if (updates.forecastCategory !== undefined) data.forecastCategory = updates.forecastCategory;
      if (updates.nextStep !== undefined) data.nextStep = updates.nextStep;
      if (updates.closeDate !== undefined) data.closeDate = updates.closeDate ? new Date(updates.closeDate) : null;
      if (updates.amount !== undefined) {
        let amt = updates.amount;
        if (typeof amt === 'string') {
          amt = amt.replace(/[$,\s]/g, '');
          if (amt.toUpperCase().endsWith('K')) {
            amt = parseFloat(amt.slice(0, -1)) * 1000;
          } else if (amt.toUpperCase().endsWith('M')) {
            amt = parseFloat(amt.slice(0, -1)) * 1000000;
          } else {
            amt = parseFloat(amt);
          }
        }
        data.amount = isNaN(amt as any) ? 0 : amt;
      }

      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data,
      });

      return { success: true, data: updated, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to update deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':dealId/brief')
  async getDealBrief(
    @Param('dealId') dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
      });
      if (!deal) throw new Error('Deal not found');

      const userId = req.user?.id || 'system-user';
      let summaryEntity = await this.summaryService.getCurrentSummary(dealId);
      
      if (!summaryEntity) {
        summaryEntity = await this.summaryService.generateSummary(dealId, userId);
      }

      let parsedSummary;
      try {
        parsedSummary = JSON.parse(summaryEntity.summary);
      } catch (e) {
        parsedSummary = {};
      }

      return {
        success: true,
        data: parsedSummary,
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get brief for deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':dealId/warnings')
  async getDealWarnings(@Param('dealId') dealId: string): Promise<ApiResponse<any[]>> {
    try {
      const warnings = await this.prisma.dealWarning.findMany({
        where: { dealId },
      });
      return {
        success: true,
        data: warnings.map((w) => ({
          warningId: w.id,
          severity: w.severity,
          title: w.title,
          description: w.description,
          suggestedAction: w.suggestedAction,
          status: w.status,
        })),
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get warnings for deal ${dealId}:`, error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Patch(':dealId/warnings/:warningId')
  async resolveWarning(
    @Param('dealId') dealId: string,
    @Param('warningId') warningId: string,
    @Body() body: { status: string }
  ) {
    try {
      const updated = await this.prisma.dealWarning.update({
        where: { id: warningId },
        data: { status: body.status || 'resolved' },
      });
      return {
        message: 'Warning status updated',
        warningId: updated.id,
        status: updated.status,
      };
    } catch (error: any) {
      this.logger.error(`Failed to update warning ${warningId}:`, error);
      return { message: 'Failed to update warning', error: error.message };
    }
  }

  @Post(':dealId/warnings/:warningId/action')
  async triggerWarningAction(
    @Param('dealId') dealId: string,
    @Param('warningId') warningId: string
  ) {
    return {
      message: 'Action triggered successfully',
      actionTriggered: true,
      status: 'ok',
    };
  }

  @Get(':dealId/playbook')
  async getDealPlaybook(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const criteria = await this.prisma.dealPlaybook.findMany({
        where: { dealId },
      });

      const completedCount = criteria.filter((c) => c.status === 'Completed').length;
      const scorePercentage = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : 0;

      return {
        success: true,
        data: {
          framework: 'MEDDIC',
          scorePercentage,
          completedCount,
          totalCount: criteria.length,
          criteria: criteria.map((c) => ({
            criterionId: c.id,
            criterionName: c.criterionName,
            question: c.question,
            status: c.status,
            notes: c.notes,
            aiSuggestedNote: c.aiSuggestedNote,
          })),
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get playbook for deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Patch(':dealId/playbook/criteria/:criterionId')
  async updatePlaybookCriterion(
    @Param('dealId') dealId: string,
    @Param('criterionId') criterionId: string,
    @Body() body: { status: string; notes?: string }
  ) {
    try {
      const updated = await this.prisma.dealPlaybook.update({
        where: { id: criterionId },
        data: {
          status: body.status,
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
        },
      });

      // Update the main deal's MEDDPICC score
      const criteria = await this.prisma.dealPlaybook.findMany({
        where: { dealId },
      });
      const completed = criteria.filter((c) => c.status === 'Completed').length;
      const pct = criteria.length > 0 ? Math.round((completed / criteria.length) * 100) : 0;

      await this.prisma.deal.update({
        where: { id: dealId },
        data: { meddpiccScore: pct },
      });

      return {
        message: 'Playbook criterion updated',
        criterionId: updated.id,
        updatedStatus: updated.status,
      };
    } catch (error: any) {
      this.logger.error(`Failed to update criterion ${criterionId}:`, error);
      return { message: 'Failed to update criterion', error: error.message };
    }
  }

  @Get(':dealId/activity')
  async getDealActivity(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const events = await this.prisma.dealActivityEvent.findMany({
        where: { dealId },
        orderBy: { date: 'asc' },
      });

      const outbound = events.filter((e) => e.direction === 'outbound');
      const inbound = events.filter((e) => e.direction === 'inbound');
      const totalMinutes = events.reduce((sum, e) => sum + e.duration, 0);

      return {
        success: true,
        data: {
          ourInteractions: outbound.length,
          customerInteractions: inbound.length,
          totalMinutes,
          events: events.map((e) => ({
            activityId: e.id,
            date: e.date,
            type: e.type,
            duration: e.duration,
            direction: e.direction,
            participants: e.participants,
            notes: e.notes,
          })),
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get activity for deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':dealId/crm-fields')
  async getDealCrmFields(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
      });
      if (!deal) throw new Error('Deal not found');

      return {
        success: true,
        data: {
          stage: deal.stage || '',
          amount: Number(deal.amount) || 0,
          forecastCategory: deal.forecastCategory || '',
          nextStep: deal.nextStep || '',
          closeDate: deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get CRM fields for ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get('stage-options')
  getStageOptions(): ApiResponse<any> {
    return {
      success: true,
      data: {
        stages: ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
        forecastCategories: ['Pipeline', 'Best Case', 'Most Likely', 'Commit', 'Closed', 'Omitted'],
      },
      isMock: false,
    };
  }

  @Get('notifications')
  async getNotifications(@Query('repName') repName?: string): Promise<ApiResponse<any>> {
    try {
      const notifications = await this.prisma.dealNotification.findMany({
        where: repName ? { repName: { contains: repName, mode: 'insensitive' } } : {},
        orderBy: { timestamp: 'desc' },
      });
      const unreadCount = notifications.filter((n) => !n.read).length;

      return {
        success: true,
        data: {
          notifications: notifications.map((n) => ({
            id: n.id,
            message: n.message,
            timestamp: n.timestamp.toISOString(),
            read: n.read,
            type: n.type,
          })),
          unreadCount,
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error('Failed to get notifications:', error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Post('notifications')
  async createNotification(
    @Body() body: { repName: string; message: string; type?: string }
  ): Promise<ApiResponse<any>> {
    try {
      const notif = await this.prisma.dealNotification.create({
        data: {
          tenantId: TENANT_ID,
          repName: body.repName,
          message: body.message,
          type: body.type || 'info',
        },
      });
      return { success: true, data: notif, isMock: false };
    } catch (error: any) {
      this.logger.error('Failed to create notification:', error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(@Query('repName') repName?: string): Promise<ApiResponse<any>> {
    try {
      await this.prisma.dealNotification.updateMany({
        where: {
          read: false,
          ...(repName ? { repName: { contains: repName, mode: 'insensitive' } } : {}),
        },
        data: { read: true },
      });
      return {
        success: true,
        data: { message: 'All notifications marked as read' },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error('Failed to mark notifications as read:', error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Post(':dealId/comments')
  async postDealComment(
    @Param('dealId') dealId: string,
    @Body() body: { comment?: string }
  ): Promise<ApiResponse<any>> {
    try {
      const commentText = body?.comment?.trim();
      if (!commentText) throw new Error('Comment text is required');

      const comment = await this.prisma.dealComment.create({
        data: {
          tenantId: TENANT_ID,
          dealId,
          comment: commentText,
        },
      });

      return { success: true, data: comment, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to post comment for deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':dealId/comments')
  async getDealComments(@Param('dealId') dealId: string): Promise<ApiResponse<any[]>> {
    try {
      const comments = await this.prisma.dealComment.findMany({
        where: { dealId },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: comments, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get comments for deal ${dealId}:`, error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Post(':dealId/escalation')
  async escalateDeal(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data: { escalated: true },
      });
      return { success: true, data: { dealId, escalated: true }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to escalate deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Delete(':dealId/escalation')
  async removeEscalation(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data: { escalated: false },
      });
      return { success: true, data: { dealId, escalated: false }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to de-escalate deal ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':dealId/escalation')
  async getEscalationStatus(@Param('dealId') dealId: string): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
      });
      return { success: true, data: { dealId, escalated: deal?.escalated || false }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get escalation status for ${dealId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Post('tasks')
  async createDealTask(
    @Body() body: { dealId: string; title: string; description?: string; dueDate?: string; assignee?: string }
  ): Promise<ApiResponse<any>> {
    try {
      const task = await this.prisma.dealTask.create({
        data: {
          tenantId: TENANT_ID,
          dealId: body.dealId,
          title: body.title,
          description: body.description,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
      });
      return { success: true, data: task, isMock: false };
    } catch (error: any) {
      this.logger.error('Failed to create task:', error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }
}

@Controller('api/deal-boards')
export class DealBoardsRepController {
  private readonly logger = new Logger(DealBoardsRepController.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getBoardsFromDb(): Promise<any[]> {
    const boards = [
      {
        boardId: 'board-1',
        name: 'My Deals',
        description: 'Personal deal tracking and management',
        owner: 'John Smith',
        canEdit: true,
      },
      {
        boardId: 'board-2',
        name: 'Enterprise Deals Q2',
        description: 'All enterprise opportunities for Q2 2026',
        owner: 'Sarah Chen',
        canEdit: false,
      },
      {
        boardId: 'board-3',
        name: 'Team Pipeline - West',
        description: 'Western region team pipeline overview',
        owner: 'Michael Rodriguez',
        canEdit: false,
      },
      {
        boardId: 'board-4',
        name: 'Strategic Accounts',
        description: 'High-value strategic account opportunities',
        owner: 'Jennifer Kim',
        canEdit: true,
      },
    ];

    return Promise.all(
      boards.map(async (b) => {
        const latestDeal = await this.prisma.deal.findFirst({
          where: { pipeline: b.boardId },
          orderBy: { updatedAt: 'desc' },
        });
        return {
          ...b,
          lastModified: latestDeal?.updatedAt?.toISOString() || new Date().toISOString(),
        };
      })
    );
  }

  @Get()
  async getDealBoards(): Promise<ApiResponse<any[]>> {
    try {
      const boards = await this.getBoardsFromDb();
      return { success: true, data: boards, isMock: false };
    } catch (error: any) {
      this.logger.error('Failed to get deal boards:', error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Get(':boardId')
  async getBoardDetail(
    @Param('boardId') boardId: string,
    @Query('owner') owner?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const boards = await this.getBoardsFromDb();
      const board = boards.find((b) => b.boardId === boardId);
      if (!board) throw new Error('Board not found');

      const deals = await this.prisma.deal.findMany({
        where: {
          pipeline: boardId,
          ...(owner ? { ownerName: { contains: owner, mode: 'insensitive' } } : {}),
        },
      });

      const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
      const summaryCards = categories.map((category) => {
        const catDeals = deals.filter((d) => d.forecastCategory === category);
        const count = catDeals.length;
        const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);
        return {
          label: category,
          amount: total,
          count,
          changePercent: 12,
        };
      });

      return {
        success: true,
        data: {
          boardId: board.boardId,
          name: board.name,
          ownerTag: `Owner = ${board.owner}`,
          summaryCards,
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get board detail for ${boardId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':boardId/deals')
  async getDealsByBoard(
    @Param('boardId') boardId: string,
    @Query('owner') owner?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const dbDeals = await this.prisma.deal.findMany({
        where: {
          pipeline: boardId,
          ...(owner ? { ownerName: { contains: owner, mode: 'insensitive' } } : {}),
        },
        orderBy: { name: 'asc' },
      });

      const enrichedDeals = await Promise.all(
        dbDeals.map(async (d) => {
          const warnings = await this.prisma.dealWarning.findMany({
            where: { dealId: d.id, status: 'active' },
          });

          const criteria = await this.prisma.dealPlaybook.findMany({
            where: { dealId: d.id },
          });
          const completedCount = criteria.filter((c) => c.status === 'Completed').length;
          const playbookScore = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : d.meddpiccScore || 0;

          const activities = await this.prisma.dealActivityEvent.findMany({
            where: { dealId: d.id },
            orderBy: { date: 'asc' },
          });

          const activityOverTime = activities.map((a, idx) => ({
            dateLabel: a.date.substring(5).toUpperCase().replace('-', ' '),
            count: 1,
            interactions: [
              {
                id: a.id,
                type: a.direction === 'inbound' ? 'customer' as const : 'rep' as const,
                size: 12,
                positionPercent: idx * 20,
              },
            ],
          }));

          return {
            dealId: d.id,
            dealName: d.name,
            company: d.name.split(' - ')[0],
            stage: d.stage,
            amount: Number(d.amount),
            forecastCategory: d.forecastCategory || 'Open',
            closeDate: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
            assignedRep: d.ownerName || 'Lakshmi Prasanna Dara',
            contacts: d.warningsCount || 2,
            notificationCount: 0,
            aiWarningCount: warnings.length,
            flagCount: d.escalated ? 1 : 0,
            flagReason: d.escalated ? 'Manager has escalated this deal.' : undefined,
            activityOverTime,
            playbookScore,
            playbookColor: playbookScore >= 75 ? 'green' : playbookScore >= 50 ? 'orange' : 'red',
            aiSuggestedNextStep: d.nextStep || 'Schedule next stakeholder meeting',
          };
        })
      );

      return { success: true, data: enrichedDeals, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get deals for board ${boardId}:`, error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }
}

@Controller('api/notifications')
export class NotificationsApiController {
  private readonly logger = new Logger(NotificationsApiController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getNotifications(@Query('repName') repName?: string): Promise<ApiResponse<any>> {
    try {
      const notifications = await this.prisma.dealNotification.findMany({
        where: repName ? { repName: { contains: repName, mode: 'insensitive' } } : {},
        orderBy: { timestamp: 'desc' },
      });
      const unreadCount = notifications.filter((n) => !n.read).length;

      return {
        success: true,
        data: {
          notifications: notifications.map((n) => ({
            id: n.id,
            message: n.message,
            timestamp: n.timestamp.toISOString(),
            read: n.read,
            type: n.type,
          })),
          unreadCount,
        },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error('Failed to get notifications:', error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Patch('read-all')
  async markAllNotificationsRead(@Query('repName') repName?: string): Promise<ApiResponse<any>> {
    try {
      await this.prisma.dealNotification.updateMany({
        where: {
          read: false,
          ...(repName ? { repName: { contains: repName, mode: 'insensitive' } } : {}),
        },
        data: { read: true },
      });
      return {
        success: true,
        data: { message: 'All notifications marked as read' },
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error('Failed to mark notifications as read:', error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }
}
