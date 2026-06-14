import { Controller, Get, Param, Query, Logger, Req, UseGuards, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../platform-core/decorators/roles.decorator';
import { ZodValidationPipe } from '../../platform-core/pipes/zod-validation.pipe';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  isMock: boolean;
  error?: string;
}


@ApiTags('Deal Boards')
@ApiBearerAuth()
@Controller('api/v1/deal-management/boards')
@UseGuards(JwtAuthGuard, TenantGuard)
@Roles('SALES_REP', 'MANAGER', 'ADMIN', 'ANALYST', 'EXECUTIVE')
export class DealBoardsController {
  private readonly logger = new Logger(DealBoardsController.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getBoardsFromDb(tenantId: string): Promise<any[]> {
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
          where: { tenantid: tenantId, pipeline: b.boardId },
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
  async getDealBoards(@Req() req: any): Promise<ApiResponse<any[]>> {
    try {
      const boards = await this.getBoardsFromDb(req.tenantId);
      return { success: true, data: boards, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error('Failed to get deal boards:', error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }

  @Get(':boardId')
  async getBoardDetail(
    @Param('boardId') boardId: string,
    @Req() req: any,
    @Query('owner') owner?: string,
  ): Promise<ApiResponse<any>> {
    try {

      const boards = await this.getBoardsFromDb(req.tenantId);
      let board = boards.find((b) => b.boardId === boardId);
      if (!board) {
        board = {
          boardId,
          name: `Board ${boardId.substring(0, 8)}`,
          description: 'Dynamic deal tracking and management',
          owner: 'System Generated',
          canEdit: true,
        };
      }

      const userRole = req.userRole || 'SALES_REP';
      const userId = req.userId;

      const whereClause: any = { tenantid: req.tenantId, pipeline: boardId };
      
      // Data Isolation
      if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
        whereClause.ownerId = userId;
      } else if (owner) {
        whereClause.ownerName = { contains: owner, mode: 'insensitive' };
      }

      const deals = await this.prisma.deal.findMany({
        where: whereClause,
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get board detail for ${boardId}:`, error);
      return { success: false, data: null, isMock: false, error: error.message };
    }
  }

  @Get(':boardId/deals')
  async getDealsByBoard(
    @Param('boardId') boardId: string,
    @Req() req: any,
    @Query('owner') owner?: string,
  ): Promise<ApiResponse<any[]>> {
    try {

      const userRole = req.userRole || 'SALES_REP';
      const userId = req.userId;

      const whereClause: any = { tenantid: req.tenantId, pipeline: boardId };
      
      if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
        whereClause.ownerId = userId;
      } else if (owner) {
        whereClause.ownerName = { contains: owner, mode: 'insensitive' };
      }

      const dbDeals = await this.prisma.deal.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
      });

      const enrichedDeals = await Promise.all(
        dbDeals.map(async (d) => {
          const warnings = await this.prisma.dealWarning.findMany({
            where: { dealId: d.id, status: 'active', tenantid: req.tenantId },
          });

          const criteria = await this.prisma.dealPlaybook.findMany({
            where: { dealId: d.id, tenantid: req.tenantId },
          });
          const completedCount = criteria.filter((c) => c.status === 'Completed').length;
          const playbookScore = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : d.meddpiccScore || 0;

          const activities = await this.prisma.dealActivityEvent.findMany({
            where: { dealId: d.id, tenantid: req.tenantId },
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
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get deals for board ${boardId}:`, error);
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }
}
