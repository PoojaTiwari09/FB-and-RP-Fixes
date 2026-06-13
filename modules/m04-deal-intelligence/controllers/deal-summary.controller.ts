import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DealSummaryService } from '@m04/services/deal-summary.service';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { RolesGuard } from '../../platform-core/guards/roles.guard';
import { Roles } from '../../platform-core/decorators/roles.decorator';
import { UserRole } from '@rri/database';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';
import {
  DealSummaryResponseDto,
  SummaryHistoryResponseDto,
  WeeklyChangesResponseDto,
  QuerySummaryDto,
} from '@m04/schemas/deal-summary.dto';

@ApiTags('Deal Summaries')
@ApiBearerAuth()
@Controller('deals/:dealId/summaries')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DealSummaryController {
  constructor(private readonly summaryService: DealSummaryService) {}

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Generate AI summary for deal' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Summary generated successfully',
    type: DealSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal not found',
  })
  async generateSummary(
    @Param('dealId') dealId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DealSummaryResponseDto> {
    const summary = await this.summaryService.generateSummary(dealId, req.user.id);
    return summary as any;
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Get current summary for deal' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current summary retrieved successfully',
    type: DealSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No summary found',
  })
  async getCurrentSummary(
    @Param('dealId') dealId: string,
  ): Promise<DealSummaryResponseDto | null> {
    const summary = await this.summaryService.getCurrentSummary(dealId);
    return summary as any;
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Get summary history for deal' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary history retrieved successfully',
    type: SummaryHistoryResponseDto,
  })
  async getSummaryHistory(
    @Param('dealId') dealId: string,
    @Query() query: QuerySummaryDto,
  ): Promise<SummaryHistoryResponseDto> {
    const summaries = await this.summaryService.getSummaryHistory(
      dealId,
      query.limit || 10,
    );

    return {
      summaries: summaries as any,
      total: summaries.length,
    };
  }

  @Get('weekly-changes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Detect weekly changes in deal summary' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly changes detected successfully',
    type: WeeklyChangesResponseDto,
  })
  async detectWeeklyChanges(
    @Param('dealId') dealId: string,
  ): Promise<WeeklyChangesResponseDto> {
    const changes = await this.summaryService.detectWeeklyChanges(dealId);
    return changes as any;
  }

  @Patch(':summaryId/flag')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Flag summary for review' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiParam({ name: 'summaryId', description: 'Summary ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary flagged successfully',
  })
  async flagForReview(
    @Param('summaryId') summaryId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.summaryService.flagForReview(summaryId, req.user.id);
    return { message: 'Summary flagged for review' };
  }

  @Patch(':summaryId/unflag')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Unflag summary from review' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiParam({ name: 'summaryId', description: 'Summary ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary unflagged successfully',
  })
  async unflagForReview(
    @Param('summaryId') summaryId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.summaryService.unflagForReview(summaryId, req.user.id);
    return { message: 'Summary unflagged from review' };
  }
}

@ApiTags('Deal Summaries')
@ApiBearerAuth()
@Controller('summaries')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class SummaryManagementController {
  constructor(private readonly summaryService: DealSummaryService) {}

  @Get('flagged')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all flagged summaries' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flagged summaries retrieved successfully',
    type: [DealSummaryResponseDto],
  })
  async getFlaggedSummaries(
    @Query() query: QuerySummaryDto,
  ): Promise<DealSummaryResponseDto[]> {
    const summaries = await this.summaryService.getFlaggedSummaries(query.limit || 50);
    return summaries as any;
  }
}
