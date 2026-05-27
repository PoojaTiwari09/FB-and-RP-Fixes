import { Controller, Get, Post, Param, Body, Headers, Query, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Controller('api/v1/forecasting')
export class M06ForecastingPredictionController {
  constructor(private readonly service: M06ForecastingPredictionService) { }

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

  @Get('periods/:id/board')
  async getBoard(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('repUserId') repUserId?: string,
    @Query('lob') lob?: string
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getBoard(tenantId, id, repUserId, lob);
  }

  @Post('periods/:id/lock')
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

  @Post('deals')
  async createDeal(@Body() body: any, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = createDealSchema.parse(body);
    return this.service.createDeal(tenantId, data);
  }

  @Post('submissions')
  async createOrUpdateSubmission(@Body() body: any, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = submitDtoSchema.parse(body);
    return this.service.createDraft(tenantId, data);
  }

  @Post('submissions/:id/submit')
  async submitForecast(@Param('id') id: string, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.submitForecast(tenantId, id);
  }

  @Get('submissions/:id')
  async getSubmission(@Param('id') id: string, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getSubmission(tenantId, id);
  }

  @Get('submissions/:id/audit-log')
  async getAuditLog(@Param('id') id: string, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getAuditLog(tenantId, id);
  }

  @Get('submissions/:id/lifecycle')
  async getLifecycle(@Param('id') id: string, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getLifecycle(tenantId, id);
  }

  @Get('periods/:id/math')
  async getMath(@Param('id') id: string, @Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getMath(tenantId, id);
  }

  // ── Auth Endpoints ──────────────────────────────────────────────────────────
  @Post('auth/register')
  async register(@Body() body: any) {
    return this.service.registerUser(body);
  }

  @Post('auth/login')
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

  @Post('submissions/:id/approve')
  async approveSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: any,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.approveSubmission(tenantId, id, body.managerId, body.managerName);
  }

  @Post('submissions/:id/reopen')
  async reopenSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: any,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!body.comment) throw new BadRequestException('Comment required for reopen');
    return this.service.reopenSubmission(tenantId, id, body.managerId, body.managerName, body.comment);
  }

  @Post('submissions/:id/override')
  async overrideSubmission(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: any,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!body.overrideValue) throw new BadRequestException('Override value required');
    return this.service.overrideSubmission(tenantId, id, body.managerId, body.managerName, body.overrideValue, body.justification, body.approveNow);
  }

  @Post('quotas')
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

  @Get('executive/board')
  async getExecutiveBoard(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('baseline') baseline?: string,
    @Query('region') region?: string,
    @Query('periodId') periodId?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const validRegions = ['Company', 'Americas', 'EMEA', 'APAC'];
    if (region && !validRegions.includes(region)) {
      throw new BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
    }
    const mappedBaseline = baseline === 'current' || baseline === 'null' ? undefined : baseline;
    return this.service.getExecutiveDashboard(tenantId, mappedBaseline, region, periodId);
  }

  @Get('team/at-risk-deals')
  async getAtRiskDeals(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('region') region?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getAtRiskDeals(tenantId, region);
  }

  @Get('executive/trends')
  async getExecutiveTrends(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.service.getExecutiveTrends(tenantId);
  }
}
