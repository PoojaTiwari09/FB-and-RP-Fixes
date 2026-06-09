import { Controller, Get, Post, Patch, Param, Body, Headers, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { M06ForecastingPredictionService } from '../services/m06.service';
import { z } from 'zod';

const TenantHeader = 'X-Tenant-ID';

const submitDtoSchema = z.object({
  lob: z.string(),
  commitForecast: z.number(),
  bestCaseForecast: z.number().optional(),
  notes: z.string().optional(),
  repUserId: z.string().optional(),
  status: z.string().optional()
});

const createDealSchema = z.object({
  dealName: z.string().min(1),
  stage: z.string().min(1),
  amount: z.number().nonnegative(),
  closeDate: z.string().min(1),
  probability: z.number().optional(),
  region: z.string().optional(),
  lob: z.string().optional(),
  repUserId: z.string().optional(),
});

@ApiTags('M6 — AI Revenue Predictor')
@Controller('api/v1/forecasting')
export class M06ForecastingPredictionController {
  constructor(private readonly service: M06ForecastingPredictionService) { }

  @Get('periods')
  async listPeriods(@Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const periods = await this.service['prisma'].forecastPeriod.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
    return periods.map((period: any) => ({
      periodId: period.id,
      tenantId: period.tenantId,
      name: period.name,
      startDate: period.startDate.toISOString().slice(0, 10),
      endDate: period.endDate.toISOString().slice(0, 10),
      revenueTarget: period.revenueTarget,
      isLocked: period.isLocked,
    }));
  }

  @Get('periods/:id/ai-prediction')
  async getAiPrediction(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('baseline') baseline?: string,
    @Query('region') region?: string,
    @Query('repUserId') repUserId?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const validBaselines = ['avg_last_2', 'last_period', 'same_period_last_year', 'current', 'null'];
    if (baseline && !validBaselines.includes(baseline)) {
      throw new BadRequestException(`Invalid baseline. Must be one of: ${validBaselines.join(', ')}`);
    }
    const validRegions = ['Americas', 'EMEA', 'APAC', 'Company'];
    if (region && !validRegions.includes(region)) {
      throw new BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
    }
    const mappedBaseline = baseline === 'current' || baseline === 'null' ? undefined : baseline;
    return this.service.getAiPrediction(tenantId, id, mappedBaseline, region, repUserId);
  }

  @Post('periods/:id/ai-prediction/run')
  @ApiBody({ schema: { type: 'object' } })
  async runAiPrediction(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.requestAiPrediction(tenantId, id);
  }

  @Get('periods/:id/ai-prediction/status')
  async getAiPredictionStatus(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getAiPredictionJobStatus(tenantId, id);
  }


  @Post('periods/:id/lock')
  @ApiBody({ schema: { type: 'object' } })
  async lockPeriod(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    // @ts-ignore
    const period = await this.service['prisma'].forecastPeriod.update({
      where: { id },
      data: { isLocked: true, status: 'locked' }
    });
    return { isLocked: true, period };
  }

  @Get('periods/:id/board')
  async getPeriodBoard(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('repUserId') repUserId?: string,
    @Query('lob') lob?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getBoard(tenantId, id, repUserId, lob);
  }

  @Get('periods/:id/math')
  async getMath(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getMath(tenantId, id);
  }

  @Post('deals')
  @ApiBody({ schema: { type: 'object' } })
  async createDeal(@Body() body: any, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = createDealSchema.parse(body);
    return this.service.createDeal(tenantId, data);
  }

  @Post('submissions')
  @ApiBody({ schema: { type: 'object' } })
  async createSubmission(@Body() body: any, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = submitDtoSchema.parse(body);
    return this.service.createDraft(tenantId, data);
  }

  @Post('submissions/:id/submit')
  async submitSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.submitForecast(tenantId, id);
  }

  @Get('submissions/:id')
  async getSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getSubmission(tenantId, id);
  }

  @Get('submissions/:id/audit-log')
  async getSubmissionAuditLog(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getAuditLog(tenantId, id);
  }

  @Get('submissions/:id/lifecycle')
  async getSubmissionLifecycle(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getLifecycle(tenantId, id);
  }

  @Post('submissions/:id/approve')
  @Patch('submissions/:id/approve')
  @ApiBody({ schema: { type: 'object' } })
  async approveSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: { managerId?: string; managerName?: string },
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!body.managerId) throw new BadRequestException('managerId is required');
    return this.service.approveSubmission(tenantId, id, body.managerId, body.managerName || 'Manager');
  }

  @Post('submissions/:id/reopen')
  @Patch('submissions/:id/reopen')
  @ApiBody({ schema: { type: 'object' } })
  async reopenSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: { managerId?: string; managerName?: string; comment?: string },
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!body.managerId || !body.comment) throw new BadRequestException('managerId and comment are required');
    return this.service.reopenSubmission(tenantId, id, body.managerId, body.managerName || 'Manager', body.comment);
  }

  @Post('submissions/:id/override')
  @ApiBody({ schema: { type: 'object' } })
  async overrideSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: { managerId?: string; managerName?: string; overrideValue?: number; justification?: string; approveNow?: boolean },
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!body.managerId || body.overrideValue == null || !body.justification) {
      throw new BadRequestException('managerId, overrideValue, and justification are required');
    }
    return this.service.overrideSubmission(tenantId, id, body.managerId, body.managerName || 'Manager', body.overrideValue, body.justification, Boolean(body.approveNow));
  }


  // ── Auth Endpoints ──────────────────────────────────────────────────────────
  @Post('auth/register')
  @ApiBody({ schema: { type: 'object' } })
  async register(@Body() body: any) {
    return this.service.registerUser(body);
  }

  @Post('auth/login')
  @ApiBody({ schema: { type: 'object' } })
  async login(@Body() body: any) {
    return this.service.loginUser(body.email, body.password);
  }

  // ── Manager Endpoints ────────────────────────────────────────────────────────
  @Get('team/board')
  async getTeamBoard(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('baseline') baseline?: string,
    @Query('region') region?: string,
    @Query('periodId') periodId?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const validBaselines = ['avg_last_2', 'last_period', 'same_period_last_year', 'current'];
    if (baseline && baseline !== 'current' && !validBaselines.includes(baseline)) {
      throw new BadRequestException(`Invalid baseline. Must be one of: ${validBaselines.join(', ')}`);
    }
    const mappedBaseline = baseline === 'current' ? undefined : baseline;
    const validRegions = ['Americas', 'EMEA', 'APAC', 'Company'];
    if (region && !validRegions.includes(region)) {
      throw new BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
    }
    return this.service.getTeamBoard(tenantId, mappedBaseline, region, periodId);
  }

  /** Alias kept for older clients that call /team-forecast */
  @Get('team-forecast')
  getTeamForecast(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('baseline') baseline?: string,
    @Query('region') region?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.getTeamBoard(tenantId, baseline, region, periodId);
  }

  @Get('team/reps/:repId')
  async getRepDrillDown(
    @Param('repId') repId: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('periodId') periodId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!periodId) throw new BadRequestException('periodId is required');
    return this.service.getRepDrillDown(tenantId, repId, periodId);
  }


  @Post('quotas')
  @ApiBody({ schema: { type: 'object' } })
  async upsertQuota(
    @Body() body: { periodId: string; repUserId: string; amount: number },
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!body.periodId || !body.repUserId || body.amount == null) {
      throw new BadRequestException('periodId, repUserId, and amount are required');
    }
    return this.service.upsertQuota(tenantId, body.periodId, body.repUserId, body.amount);
  }

  @Get('quotas')
  async getQuotas(
    @Query('periodId') periodId: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!periodId) throw new BadRequestException('periodId query param is required');
    return this.service.getQuotas(tenantId, periodId);
  }



  @Get('team/at-risk-deals')
  async getAtRiskDeals(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('region') region?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getAtRiskDeals(tenantId, region);
  }


}
