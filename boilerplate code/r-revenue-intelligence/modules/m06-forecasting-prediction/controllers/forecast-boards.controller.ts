import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  ForbiddenException,
  Patch,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ForecastBoardsService } from '../services/forecast-boards.service';

const TenantHeader = 'X-Tenant-ID';
const UserHeader = 'X-User-ID';

@Controller('api/v1/forecasting/boards')
export class ForecastBoardsController {
  constructor(private readonly boardsService: ForecastBoardsService) {}

  @Get()
  async listBoards(@Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.listBoards(tenantId);
  }

  @Get('by-period/:periodId')
  async getBoardsByPeriod(
    @Headers(TenantHeader.toLowerCase()) tenantId: string, 
    @Param('periodId') periodId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getBoardByPeriod(tenantId, periodId);
  }

  @Get(':boardId/view')
  async getBoardView(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getBoardView(tenantId, boardId, role, userId, includeInactive === 'true');
  }

  @Post(':boardId/submit')
  @ApiBody({ schema: { type: 'object' } })
  async submitForecast(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Body() body: { columnId: string; repUserId: string; value: number; note?: string; dealId?: string; status?: string }
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.submitForecast(tenantId, boardId, body, userId, role);
  }

  @Post(':boardId/approve-change')
  @ApiBody({ schema: { type: 'object' } })
  async approveChangeRequest(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Body() body: { repUserId: string; dealId: string; columnId: string }
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.approveChangeRequest(tenantId, boardId, body, userId, role);
  }

  @Get(':boardId/reps/:repUserId/deals/:columnId')
  async getRepDeals(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('repUserId') repUserId: string,
    @Param('columnId') columnId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getRepDeals(tenantId, boardId, repUserId, columnId, userId, role);
  }

  @Get(':boardId/reps/:repUserId/history/:columnId')
  async getRepHistory(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('repUserId') repUserId: string,
    @Param('columnId') columnId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getRepHistory(tenantId, boardId, repUserId, columnId, userId, role);
  }

  @Get(':boardId/reps/:repUserId/drilldown')
  async getRepDrilldown(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('repUserId') repUserId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getRepDrilldown(tenantId, boardId, repUserId, userId, role);
  }

  @Post(':boardId/annotations')
  @ApiBody({ schema: { type: 'object' } })
  async addAnnotation(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Body() body: { submissionId: string; repUserId?: string; annotation?: string; content?: string; managerId?: string }
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.addManagerAnnotation(
      tenantId,
      boardId,
      body.submissionId,
      body.managerId || userId,
      body.annotation || body.content || '',
      role,
      body.repUserId,
    );
  }

  @Post(':boardId/exclude')
  @ApiBody({ schema: { type: 'object' } })
  async excludeMember(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Body() body: { repUserId: string; reason?: string; managerId?: string }
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.excludeMember(tenantId, boardId, body.repUserId, body.managerId || userId, body.reason, role);
  }

  @Delete(':boardId/exclude/:repUserId')
  async removeExclusion(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('repUserId') repUserId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.removeExclusion(tenantId, boardId, repUserId, role);
  }

  @Patch(':boardId/submissions/:submissionId/approve')
  async approveSubmission(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) managerId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('submissionId') submissionId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.approveSubmission(tenantId, boardId, submissionId, managerId, role);
  }

  @Patch(':boardId/submissions/:submissionId/reopen')
  async reopenSubmission(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) managerId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('submissionId') submissionId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.reopenSubmission(tenantId, boardId, submissionId, managerId, role);
  }

  @Patch(':boardId/reps/:repUserId/submission')
  @ApiBody({ schema: { type: 'object' } })
  async overrideSubmission(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) managerId: string,
    @Headers('x-user-role') role: string,
    @Param('boardId') boardId: string,
    @Param('repUserId') repUserId: string,
    @Body() body: { columnId: string; value: number; note: string }
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (body.value == null || !body.note || !body.columnId) throw new BadRequestException('Value, note, and columnId are required');
    return this.boardsService.overrideSubmission(tenantId, boardId, repUserId, managerId, body, role);
  }

  @Get(':boardId/pending-approvals/count')
  async getPendingApprovalsCount(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) managerId: string,
    @Param('boardId') boardId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getPendingApprovalsCount(tenantId, boardId, managerId);
  }

  @Get(':boardId/pending-approvals')
  async getPendingApprovals(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) managerId: string,
    @Param('boardId') boardId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.getPendingApprovals(tenantId, boardId, managerId);
  }

  @Post('targets/assign')
  @ApiBody({ schema: { type: 'object' } })
  async assignTargets(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Headers(UserHeader.toLowerCase()) userId: string,
    @Headers('x-user-role') role: string,
    @Body() body: { periodId: string; assignments: { repUserId: string; targetValue: number }[] }
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.boardsService.assignTargets(tenantId, body, userId, role);
  }

  @Get('notifications/:repId')
  async getNotifications(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('repId') repId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = await this.boardsService.getNotifications(tenantId, repId);
    return { success: true, data };
  }

  @Patch('notifications/:id/seen')
  async markNotificationSeen(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = await this.boardsService.markNotificationSeen(tenantId, id);
    return { success: true, data };
  }

  @Get('submissions/:submissionId/activity')
  async getSubmissionActivity(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('submissionId') submissionId: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = await this.boardsService.getSubmissionActivity(tenantId, submissionId);
    return { success: true, data };
  }
}
