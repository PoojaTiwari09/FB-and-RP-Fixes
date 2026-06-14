import { Prisma } from '@rri/database';
import { Controller, Get, Post, Patch, Param, Body, Headers, Query, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
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
      where: { tenantid: tenantId },
      orderBy: { startDate: 'desc' },
    });
    return periods.map((period: any) => ({
      periodId: period.id,
      tenantId: period.tenantid,
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
    const data = await this.service.getAiPrediction(tenantId, id, mappedBaseline, region, repUserId);
    
    // Format period
    const { tenantid, createdAt, updatedAt, submissionDeadline, ...periodClean } = data.period as any;

    // Format explainability to remove unused fields as per contract
    const formattedDeals = (data.aiPrediction?.explainability?.deals || []).map((d: any) => {
      const { timeDecay, contributionFactor, closeDate, region, ...cleanDeal } = d;
      return cleanDeal;
    });
    
    const formattedClosedWonDeals = (data.aiPrediction?.explainability?.closedWonDetails?.deals || []).map((d: any) => {
      const { region, ...cleanCWDeal } = d;
      return cleanCWDeal;
    });

    const { freshnessAgeSeconds, stale, ...aiPredictionClean } = data.aiPrediction as any;

    return {
      success: true,
      data: {
        period: periodClean,
        aiPrediction: {
          ...aiPredictionClean,
          explainability: {
            ...aiPredictionClean.explainability,
            deals: formattedDeals,
            closedWonDetails: {
              ...aiPredictionClean.explainability.closedWonDetails,
              deals: formattedClosedWonDeals
            }
          }
        }
      }
    };
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
    const data = await this.service.getBoard(tenantId, id, repUserId, lob);
    
    const commit = data.submissions.reduce((sum: number, s: any) => sum + (s.commitForecast || 0), 0);
    const bestCase = data.submissions.reduce((sum: number, s: any) => sum + (s.bestCaseForecast || 0), 0);
    const aiPrediction = data.aiPrediction?.predictedAmount || 0;
    const attainment = data.quota ? (commit / data.quota) : 0;
    
    const users = await this.service['prisma'].forecastUser.findMany({ where: { tenantid: tenantId } });

    return {
      success: true,
      data: {
        period: {
          id: data.period.id,
          name: data.period.name,
          revenueTarget: data.period.revenueTarget,
          isLocked: data.period.isLocked,
          status: data.period.status
        },
        summary: {
          pipeline: aiPrediction * 1.5,
          commit,
          bestCase,
          aiPrediction,
          attainment
        },
        reps: data.submissions.map((s: any) => {
          const repName = users.find(u => u.id === s.repUserId)?.name || "Representative";
          return {
            repId: s.repUserId,
            repName,
            quota: data.quota || 5000000,
            pipeline: (s.bestCaseForecast || 0) * 1.5,
            commit: s.commitForecast,
            bestCase: s.bestCaseForecast,
            aiScore: 85,
            submissionStatus: s.status
          };
        })
      }
    };
  }

  @Get('periods/:id/math')
  async getMath(
    @Param('id') id: string,
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = await this.service.getMath(tenantId, id);
    return {
      success: true,
      data: {
        aiPrediction: data.aiPrediction,
        math: {
          closedWon: {
            total: data.math.closedWonDetails?.total || 0,
            deals: (data.math.closedWonDetails?.deals || []).map((d: any) => ({ name: d.name, amount: d.amount }))
          },
          weightedPipeline: {
            total: data.math.pipelineByStage?.reduce((sum: number, s: any) => sum + s.contribution, 0) || 0,
            stages: (data.math.pipelineByStage || []).map((s: any) => ({
              name: s.stage,
              pipeline: s.pipeline,
              conv: Math.round(s.convRate * 100),
              contribution: s.contribution
            }))
          },
          expectedDeals: {
            total: data.math.expectedDeals?.contribution || 0,
            historicalRate: data.math.expectedDeals?.rate ? Math.round(data.math.expectedDeals.rate * 1000) / 10 : 12.4,
            addressablePipeline: data.math.expectedDeals?.addressablePipeline || 0
          },
          formula: "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
        }
      }
    };
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
    try {
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
      const data = await this.service.getTeamBoard(tenantId, mappedBaseline, region, periodId);
      
      const explainability = data.aiSnapshot?.explainability || {};
      const teamAiProjection = data.teamAiProjection || 0;
      
      const uiData = {
        teamName: region && region !== 'Company' ? `${region} Team` : 'Company Team',
        quarter: data.period?.name || 'Q2 FY26',
        aiProjection: teamAiProjection,
        lastUpdated: data.aiSnapshot?.computedAt 
          ? `Updated today · ${new Date(data.aiSnapshot.computedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` 
          : 'Up to date',
        manualForecast: data.team.reduce((sum: number, rep: any) => sum + (rep.commit || 0), 0),
        rangeMin: data.aiSnapshot?.confidenceRangeLow ?? Math.round(teamAiProjection * 0.9),
        rangeMax: data.aiSnapshot?.confidenceRangeHigh ?? Math.round(teamAiProjection * 1.1),
        closesOn: data.period?.endDate || new Date().toISOString(),
        closedWon: data.breakdown.closedWon,
        weightedPipeline: data.breakdown.weightedPipeline,
        expectedDeals: data.breakdown.expectedDeals,
        activeDeals: (explainability.deals || []).map((deal: any) => ({
          id: deal.id,
          name: deal.dealName || deal.name,
          stage: deal.stage,
          amount: deal.amount,
          aiConfidence: deal.probability > 0.6 ? 'High' : (deal.probability > 0.3 ? 'Medium' : 'Low'),
          expectedClose: deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
          factor: Math.round((deal.probability || 0.4) * 100),
          contribution: Math.round(deal.amount * (deal.probability || 0.4)),
          lob: deal.region || 'Enterprise Software'
        })),
        mathData: {
          closedWon: explainability.closedWonDetails || { total: data.breakdown.closedWon, deals: [] },
          weightedPipeline: {
            total: data.breakdown.weightedPipeline,
            stages: (explainability.pipelineByStage || []).map((s: any) => ({
              name: s.stage,
              pipeline: s.pipeline,
              conv: Math.round(s.convRate * 100),
              contribution: s.contribution
            }))
          },
          expectedDeals: explainability.expectedDeals || {
            total: data.breakdown.expectedDeals,
            historicalRate: 12.4,
            addressablePipeline: 126600000
          },
          formula: "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
        },
        reps: data.team.map((rep: any) => ({
          id: rep.userId,
          repName: rep.name,
          aiPrediction: rep.aiProjection,
          managerOverride: rep.submission?.managerOverride ?? null,
          confidenceLevel: rep.riskLevel === 'On Track' ? 'High' : (rep.riskLevel === 'At Risk' ? 'Medium' : 'Low'),
          lastUpdated: rep.submission?.updatedAt ? new Date(rep.submission.updatedAt).toISOString() : null
        }))
      };
  
      return { success: true, data: uiData };
    } catch (e: any) {
      console.error("TEAM BOARD ERROR:", e);
      throw e;
    }
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
    // Re-use the getTeamBoard data to extract just the specific rep for the Rep Drilldown View
    const data = await this.service.getTeamBoard(tenantId, undefined, undefined, periodId);
    const repData = data.team.find((r: any) => r.userId === repId || r.repId === repId);
    if (!repData) throw new NotFoundException('Rep not found in team board');
    
    const explainability = data.aiSnapshot?.explainability || {};
    
    const uiData = {
      repId: repData.userId,
      repName: repData.name,
      quarter: data.period?.name || 'Q2 FY26',
      aiProjection: repData.aiProjection,
      lastUpdated: data.aiSnapshot?.computedAt 
        ? `Updated today · ${new Date(data.aiSnapshot.computedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` 
        : 'Up to date',
      rangeMin: Math.round(repData.aiProjection * 0.9),
      rangeMax: Math.round(repData.aiProjection * 1.1),
      closesOn: data.period?.endDate || new Date().toISOString(),
      closedWon: data.breakdown.closedWon, // NOTE: In a true production app, this would be filtered by repId.
      weightedPipeline: data.breakdown.weightedPipeline,
      expectedDeals: data.breakdown.expectedDeals,
      activeDeals: (explainability.deals || [])
        .filter((d: any) => d.repUserId === repId || d.repUserId === repData.repId)
        .map((deal: any) => ({
          id: deal.id,
          name: deal.dealName || deal.name,
          stage: deal.stage,
          amount: deal.amount,
          aiConfidence: deal.probability > 0.6 ? 'High' : (deal.probability > 0.3 ? 'Medium' : 'Low'),
          expectedClose: deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
          factor: Math.round((deal.probability || 0.4) * 100),
          contribution: Math.round(deal.amount * (deal.probability || 0.4)),
          lob: deal.region || 'Enterprise Software'
        })),
      mathData: {
        closedWon: explainability.closedWonDetails || { total: data.breakdown.closedWon, deals: [] },
        weightedPipeline: {
          total: data.breakdown.weightedPipeline,
          stages: (explainability.pipelineByStage || []).map((s: any) => ({
            name: s.stage,
            pipeline: s.pipeline,
            conv: Math.round(s.convRate * 100),
            contribution: s.contribution
          }))
        },
        expectedDeals: explainability.expectedDeals || {
          total: data.breakdown.expectedDeals,
          historicalRate: 12.4,
          addressablePipeline: 126600000
        },
        formula: "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
      }
    };
    
    return { success: true, data: uiData };
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
