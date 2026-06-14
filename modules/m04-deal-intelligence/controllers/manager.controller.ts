import { Controller, Get, Post, Patch, Body, Param, Logger, Req, UseGuards, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../platform-core/decorators/roles.decorator';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';


@ApiTags('Manager')
@ApiBearerAuth()
@Controller('api/v1/manager')
@UseGuards(JwtAuthGuard, TenantGuard)
@Roles('MANAGER', 'ADMIN', 'EXECUTIVE')
export class ManagerController {

  @Get('pipeline')
  async getManagerPipeline(@Req() req: any) {
    try {
      const deals = await this.prisma.deal.findMany({
        where: { tenantid: req.tenantId }
      });
      const pipelineValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      return { success: true, data: { pipelineValue, deals }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get manager pipeline: ${error.message}`);
      return { success: false, error: error.message, isMock: false };
    }
  }

  @Get('alerts')
  async getManagerAlerts(@Req() req: any) {
    try {
      const deals = await this.prisma.deal.findMany({ where: { tenantid: req.tenantId } });
      const dealIds = deals.map(d => d.id);
      const warnings = await this.prisma.dealWarning.findMany({
        where: { dealId: { in: dealIds }, status: 'active' }
      });
      return { success: true, data: warnings, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to get manager alerts: ${error.message}`);
      return { success: false, error: error.message, isMock: false };
    }
  }

  @Post('deals/:dealId/notes')
  async addManagerNote(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    try {
      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data: { nextStep: body.text }
      });
      return { success: true, data: { dealId, note: updated.nextStep }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to add manager note: ${error.message}`);
      return { success: false, error: error.message, isMock: false };
    }
  }

  @Post('deals/:dealId/steps/:stepId/approve')
  async approveNextStep(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Req() req: any
  ) {
    try {
      const updated = await this.prisma.dealPlaybook.update({
        where: { id: stepId },
        data: { status: 'Approved' }
      });
      return { success: true, data: { dealId, stepId, status: updated.status }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to approve step: ${error.message}`);
      return { success: false, error: error.message, isMock: false };
    }
  }

  @Patch('deals/:dealId/forecast')
  async updateManagerForecast(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    try {
      const updated = await this.prisma.deal.update({
        where: { id: dealId },
        data: { forecastCategory: body.forecastCategory || body.category }
      });
      return { success: true, data: { dealId, forecastCategory: updated.forecastCategory }, isMock: false };
    } catch (error: any) {
      this.logger.error(`Failed to update forecast: ${error.message}`);
      return { success: false, error: error.message, isMock: false };
    }
  }

  private readonly logger = new Logger(ManagerController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Patch('deals/:dealId/playbook/next-steps/:stepId')
  async updateManagerNextStep(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() body: { notes?: string; status?: string; comment?: string },
    @Req() req: any
  ) {
    try {

      this.logger.log(`Updating manager next step for deal ${dealId}, step ${stepId}`);
      // Find playbook criterion by stepId
      const criterion = await this.prisma.dealPlaybook.findFirst({
        where: { id: stepId, tenantid: req.tenantId }
      });

      if (criterion) {
        const updated = await this.prisma.dealPlaybook.update({
          where: { id: stepId },
          data: {
            notes: body.notes || body.comment,
            status: body.status || 'Completed'
          }
        });
        return { success: true, message: 'Next step playbook criterion updated', data: updated };
      }
      
      // Fallback: update nextStep on the Deal model itself
      const updatedDeal = await this.prisma.deal.update({
        where: { id: dealId },
        data: { nextStep: body.notes || body.comment || '' }
      });
      return { success: true, message: 'Deal next steps updated', data: updatedDeal };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to update manager next steps: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @Get('tasks')
  async getManagerTasks(@Req() req: any) {
    try {
      const tasks = await this.prisma.dealTask.findMany({
        where: { tenantid: req.tenantId },
      });
      return { success: true, data: tasks, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get manager tasks: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @Get('team-members')
  async getTeamMembers(@Req() req: any) {
    try {
      const deals = await this.prisma.deal.findMany({
        where: { tenantid: req.tenantId },
        select: { ownerName: true, ownerEmail: true, ownerId: true },
        distinct: ['ownerEmail']
      });
      const team = deals.map((d, idx) => ({
        id: d.ownerId || `rep-${idx}`,
        name: d.ownerName || 'Unknown Rep',
        email: d.ownerEmail || 'rep@company.com',
        role: 'SALES_REP'
      }));
      return { success: true, data: team, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to get team members: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @Get('deal-stages')
  async getDealStages() {
    return {
      success: true,
      data: [
        { id: 'Qualification', name: 'Qualification', order: 1 },
        { id: 'Discovery', name: 'Discovery', order: 2 },
        { id: 'Proposal', name: 'Proposal', order: 3 },
        { id: 'Negotiation', name: 'Negotiation', order: 4 },
        { id: 'Closed Won', name: 'Closed Won', order: 5 },
        { id: 'Closed Lost', name: 'Closed Lost', order: 6 },
      ],
      isMock: false
    };
  }

  @Get('deals/export')
  async exportDeals(@Req() req: any) {
    try {
      const deals = await this.prisma.deal.findMany({
        where: { tenantid: req.tenantId },
        orderBy: { name: 'asc' },
      });
      return { success: true, data: deals, isMock: false };
    } catch (error: any) {
      if (error && (error instanceof BadRequestException || error.name === 'BadRequestException')) throw error;
      this.logger.error(`Failed to export deals: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
