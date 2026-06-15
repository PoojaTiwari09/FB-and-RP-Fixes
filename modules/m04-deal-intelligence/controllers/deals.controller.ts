import { Controller, Get, Post, Patch, Delete, Param, Query, Logger, Body, Req, UseGuards, BadRequestException, ParseUUIDPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../platform-core/decorators/roles.decorator';
import { ZodValidationPipe } from '../../platform-core/pipes/zod-validation.pipe';
import { PaginationQuerySchema, NotificationCreateSchema, DealTaskCreateSchema, PlaybookCriterionUpdateSchema, WarningResolveSchema, DealCommentCreateSchema, DealUpdateSchema } from '../dto/m04.dto';
import { PrismaService } from '../database/prisma.service';
import { DealSummaryService } from '../services/deal-summary.service';
import { DealWarningService } from '../services/deal-warning.service';
import { DealPlaybookService } from '../services/deal-playbook.service';
import { PlaybookType, PlaybookItemStatus } from '@m04/entities/deal-playbook.entity';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

const FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  isMock: boolean;
  error?: string;
}

@ApiTags('Deal Management')
@ApiBearerAuth()
@Controller('api/v1/deal-management')
@UseGuards(JwtAuthGuard, TenantGuard)
@Roles('SALES_REP', 'MANAGER', 'ADMIN', 'ANALYST', 'EXECUTIVE')
export class DealsController {
  private readonly logger = new Logger(DealsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly summaryService: DealSummaryService,
    private readonly warningService: DealWarningService,
    private readonly playbookService: DealPlaybookService,
  ) {}

  // ─── STATIC ROUTES (MUST BE DEFINED BEFORE PARAMETERIZED ROUTES) ─────────────────

  @Get('all')
  @ApiOperation({ summary: 'List all deals with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async getAllDeals(
    @Req() req: any,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: any
  ) {
    try {
      const { page, pageSize, sortBy, sortOrder } = query;
      const skip = (page - 1) * pageSize;
      const take = pageSize;
      const userRole = req.userRole || 'SALES_REP';
      const userId = req.userId;

      const whereClause: any = { tenantid: req.tenantId };
      if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
        whereClause.ownerId = userId;
      }

      const [dbDeals, totalRecords] = await Promise.all([
        this.prisma.deal.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take,
        }),
        this.prisma.deal.count({ where: whereClause })
      ]);

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

      return {
        success: true,
        data: mapped,
        meta: {
          pagination: {
            page,
            pageSize,
            totalRecords,
            totalPages: Math.ceil(totalRecords / pageSize),
            hasNextPage: page * pageSize < totalRecords,
            hasPreviousPage: page > 1
          }
        }
      };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to get all deals:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Get('pipeline-summary')
  async getPipelineSummary(@Req() req: any): Promise<ApiResponse<any[]>> {
    try {
      const userRole = req.userRole || 'SALES_REP';
      const userId = req.userId;

      const whereClause: any = { tenantid: req.tenantId };
      if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
        whereClause.ownerId = userId;
      }

      const deals = await this.prisma.deal.findMany({ where: whereClause });
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to calculate pipeline summary:', error);
      throw new BadRequestException(error.message);
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

  @Get('forecast-category-options')
  getForecastCategoryOptions(): ApiResponse<any> {
    return {
      success: true,
      data: {
        forecastCategories: ['Pipeline', 'Best Case', 'Most Likely', 'Commit', 'Closed', 'Omitted'],
      },
      isMock: false,
    };
  }

  @Get('notifications')
  async getNotifications(
    @Query('repName') repName: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const notifications = await this.prisma.dealNotification.findMany({
        where: {
          tenantid: req.tenantId,
          ...(repName ? { repName: { contains: repName, mode: 'insensitive' } } : {}),
        },
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to get notifications:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Post('notifications')
  async createNotification(
    @Body(new ZodValidationPipe(NotificationCreateSchema)) body: any,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const notif = await this.prisma.dealNotification.create({
        data: {
          tenantid: req.tenantId || FALLBACK_TENANT_ID,
          repName: body.repName,
          message: body.message,
          type: body.type || 'info',
        },
      });
      return { success: true, data: notif, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to create notification:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(
    @Query('repName') repName: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      await this.prisma.dealNotification.updateMany({
        where: {
          tenantid: req.tenantId,
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to mark notifications as read:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Post('tasks')
  async createDealTask(
    @Body(new ZodValidationPipe(DealTaskCreateSchema)) body: any,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const task = await this.prisma.dealTask.create({
        data: {
          tenantid: req.tenantId || FALLBACK_TENANT_ID,
          dealId: body.dealId,
          title: body.title,
          description: body.description,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          status: 'Pending',
        },
      });
      return { success: true, data: task, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to create task:', error);
      throw new BadRequestException(error.message);
    }
  }

  // ─── SPECIFIC PARAMETERIZED ROUTES ───────────────────────────────────────────────

  @Get(':dealId/brief')
  async getDealBrief(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dealId, tenantid: req.tenantId },
      });
      if (!deal) throw new Error('Deal not found');

      const userId = req.userId || 'system-user';
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get brief for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/warnings')
  async getDealWarnings(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any[]>> {
    try {
      const warnings = await this.warningService.getActiveWarnings(dealId);
      return {
        success: true,
        data: warnings.map((w) => ({
          warningId: w.id,
          severity: w.severity,
          title: w.type || 'Warning',
          description: w.message,
          suggestedAction: w.recommendedAction,
          status: w.isActive ? 'active' : 'resolved',
        })),
        isMock: false,
      };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get warnings for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':dealId/warnings/:warningId')
  async resolveWarning(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('warningId', ParseUUIDPipe) warningId: string,
    @Body(new ZodValidationPipe(WarningResolveSchema)) body: any,
    @Req() req: any
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to update warning ${warningId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Post(':dealId/warnings/:warningId/action')
  async triggerWarningAction(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('warningId', ParseUUIDPipe) warningId: string
  ) {

    return {
      message: 'Action triggered successfully',
      actionTriggered: true,
      status: 'ok',
    };
  }

  @Get(':dealId/playbook')
  async getDealPlaybook(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const summaries = await this.playbookService.getPlaybook(dealId, PlaybookType.MEDDICC);
      const summary = summaries[0];

      const criteria = summary ? summary.items : [];
      const completedCount = criteria.filter((c) => c.status === PlaybookItemStatus.COMPLETED).length;
      const scorePercentage = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : 0;

      const mapStatus = (status: string) => {
        if (status === 'NOT_STARTED') return 'Pending';
        if (status === 'IN_PROGRESS') return 'In Progress';
        if (status === 'COMPLETED') return 'Completed';
        return status;
      };

      const mapCriterionName = (name: string) => {
        if (name === 'Metrics') return 'METRICS';
        if (name === 'Economic Buyer') return 'ECONOMIC BUYER';
        if (name === 'Decision Criteria') return 'DECISION CRITERIA';
        if (name === 'Decision Process') return 'DECISION PROCESS';
        if (name === 'Identify Pain') return 'IDENTIFY PAIN';
        if (name === 'Champion') return 'CHAMPION';
        if (name === 'Competition') return 'COMPETITION';
        return name.toUpperCase();
      };

      return {
        success: true,
        data: {
          framework: 'MEDDIC',
          scorePercentage,
          completedCount,
          totalCount: criteria.length,
          criteria: criteria.map((c) => ({
            criterionId: c.id,
            criterionName: mapCriterionName(c.criterion),
            question: c.question || 'Review recent transcripts for key details.',
            status: mapStatus(c.status),
            notes: c.notes || 'Not discussed in transcripts',
            aiSuggestedNote: c.aiSuggestion || 'Ask the champion for details.',
          })),
        },
        isMock: false,
      };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get playbook for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':dealId/playbook/criteria/:criterionId')
  async updatePlaybookCriterion(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Body(new ZodValidationPipe(PlaybookCriterionUpdateSchema)) body: any,
    @Req() req: any
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
        where: { dealId, tenantid: req.tenantId },
      });
      const completed = criteria.filter((c) => c.status === PlaybookItemStatus.COMPLETED).length;
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to update criterion ${criterionId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/activity')
  async getDealActivity(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const events = await this.prisma.dealActivityEvent.findMany({
        where: { dealId, tenantid: req.tenantId },
        orderBy: { date: 'asc' },
      });

      const outbound = events.filter((e) => e.direction?.toLowerCase() === 'outbound');
      const inbound = events.filter((e) => e.direction?.toLowerCase() === 'inbound');
      const totalMinutes = events.reduce((sum, e) => sum + (Number(e.duration) || 0), 0);

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
            duration: Number(e.duration) || 0,
            direction: e.direction?.toLowerCase() || 'inbound',
            participants: e.participants || [],
            notes: e.notes || '',
          })),
        },
        isMock: false,
      };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get activity for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/activity/:activityId')
  async getDealActivityItem(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {

      const event = await this.prisma.dealActivityEvent.findFirst({
        where: { id: activityId, dealId, tenantid: req.tenantId },
      });

      if (!event) throw new Error('Activity event not found');

      return {
        success: true,
        data: {
          activityId: event.id,
          date: event.date,
          type: event.type,
          duration: event.duration,
          direction: event.direction,
          participants: event.participants,
          notes: event.notes,
        },
        isMock: false,
      };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get activity item ${activityId} for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/crm-fields')
  async getDealCrmFields(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dealId, tenantid: req.tenantId },
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get CRM fields for ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Post(':dealId/comments')
  async postDealComment(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body(new ZodValidationPipe(DealCommentCreateSchema)) body: any,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const commentText = body?.comment?.trim();

      const comment = await this.prisma.dealComment.create({
        data: {
          tenantid: req.tenantId || FALLBACK_TENANT_ID,
          dealId,
          comment: commentText,
        },
      });

      return { success: true, data: comment, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to post comment for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/comments')
  async getDealComments(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any[]>> {
    try {
      const comments = await this.prisma.dealComment.findMany({
        where: { dealId, tenantid: req.tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: comments, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get comments for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Post(':dealId/escalation')
  async escalateDeal(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data: { escalated: true },
      });
      return { success: true, data: { dealId, escalated: true }, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to escalate deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':dealId/escalation')
  async removeEscalation(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data: { escalated: false },
      });
      return { success: true, data: { dealId, escalated: false }, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to de-escalate deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/escalation')
  async getEscalationStatus(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dealId, tenantid: req.tenantId },
      });
      return { success: true, data: { dealId, escalated: deal?.escalated || false }, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get escalation status for ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':dealId/tasks')
  async getDealTasks(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any
  ): Promise<ApiResponse<any[]>> {
    try {
      const tasks = await this.prisma.dealTask.findMany({
        where: { dealId, tenantid: req.tenantId },
        orderBy: { dueDate: 'asc' },
      });
      return { success: true, data: tasks, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get tasks for deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  // ─── GENERAL PARAMETERIZED ROUTES (LAST) ──────────────────────────────────────────

  @Get(':dealId')
  async getDealById(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    try {
      const userRole = req.userRole || 'SALES_REP';
      const userId = req.userId;

      const where: any = { id: dealId, tenantid: req.tenantId };
      if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
        where.ownerId = userId;
      }

      const deal = await this.prisma.deal.findFirst({
        where,
      });

      if (!deal) throw new Error('Deal not found or access denied');
      return { success: true, data: deal, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get deal by id ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':dealId')
  async updateDeal(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body(new ZodValidationPipe(DealUpdateSchema)) updates: any,
    @Req() req: any
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to update deal ${dealId}:`, error);
      throw new BadRequestException(error.message);
    }
  }
}
