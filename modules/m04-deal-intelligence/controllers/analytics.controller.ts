import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from '@m04/services/analytics.service';
import {
  GetAnalyticsRequestDto,
  AEAnalyticsResponseDto,
  ManagerAnalyticsResponseDto,
  ExecutiveAnalyticsResponseDto,
  HistoricalMetricsRequestDto,
  HistoricalMetricsResponseDto,
} from '@m04/schemas/analytics.dto';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiCookieAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @ApiOperation({
    summary: 'Get analytics',
    description: 'Get analytics based on user role and scope (Personal, Team, or Executive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: AEAnalyticsResponseDto,
  })
  async getAnalytics(
    @Body() dto: GetAnalyticsRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AEAnalyticsResponseDto | ManagerAnalyticsResponseDto | ExecutiveAnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(dto, req.user.id);
  }

  @Get('historical')
  @ApiOperation({
    summary: 'Get historical metrics',
    description: 'Get historical metrics for trend analysis',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiQuery({
    name: 'metricTypes',
    required: false,
    type: [String],
    example: ['aiScore', 'pipelineValue'],
  })
  @ApiResponse({
    status: 200,
    description: 'Historical metrics retrieved successfully',
    type: [HistoricalMetricsResponseDto],
  })
  async getHistoricalMetrics(
    @Query() dto: HistoricalMetricsRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<HistoricalMetricsResponseDto[]> {
    return this.analyticsService.getHistoricalMetrics(req.user.id, dto);
  }

  @Get('ae')
  @ApiOperation({
    summary: 'Get AE analytics (shortcut)',
    description: 'Get Account Executive analytics for current quarter',
  })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'AE analytics retrieved successfully',
    type: AEAnalyticsResponseDto,
  })
  async getAEAnalytics(
    @Query('boardId') boardId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<AEAnalyticsResponseDto> {
    const dto: GetAnalyticsRequestDto = {
      scope: 'PERSONAL' as any,
      boardId,
      period: 'THIS_QUARTER' as any,
    };
    return this.analyticsService.getAnalytics(dto, req.user.id) as Promise<AEAnalyticsResponseDto>;
  }

  @Get('manager')
  @ApiOperation({
    summary: 'Get Manager analytics (shortcut)',
    description: 'Get Sales Manager analytics for current quarter',
  })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Manager analytics retrieved successfully',
    type: ManagerAnalyticsResponseDto,
  })
  async getManagerAnalytics(
    @Query('boardId') boardId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<ManagerAnalyticsResponseDto> {
    const dto: GetAnalyticsRequestDto = {
      scope: 'TEAM' as any,
      boardId,
      period: 'THIS_QUARTER' as any,
    };
    return this.analyticsService.getAnalytics(dto, req.user.id) as Promise<ManagerAnalyticsResponseDto>;
  }

  @Get('executive')
  @ApiOperation({
    summary: 'Get Executive analytics (shortcut)',
    description: 'Get CRO/VP Sales analytics for current quarter',
  })
  @ApiResponse({
    status: 200,
    description: 'Executive analytics retrieved successfully',
    type: ExecutiveAnalyticsResponseDto,
  })
  async getExecutiveAnalytics(
    @Req() req: AuthenticatedRequest,
  ): Promise<ExecutiveAnalyticsResponseDto> {
    const dto: GetAnalyticsRequestDto = {
      scope: 'EXECUTIVE' as any,
      period: 'THIS_QUARTER' as any,
    };
    return this.analyticsService.getAnalytics(dto, req.user.id) as Promise<ExecutiveAnalyticsResponseDto>;
  }
}
