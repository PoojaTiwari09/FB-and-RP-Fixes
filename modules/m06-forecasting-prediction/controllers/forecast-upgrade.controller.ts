import { Prisma } from '@rri/database';
import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ForecastUpgradeService } from '../services/forecast-upgrade.service';

@Controller('api')
export class ForecastUpgradeController {
  constructor(private readonly service: ForecastUpgradeService) {}

  private async resolveRepId(repId: string, periodId?: string) {
    if (repId === 'me' || repId === '00000000-0000-0000-0000-000000000003') {
      if (periodId) {
        const reps = await this.service.getPeriodReps(periodId);
        if (reps.length > 0) return reps[0].rep_id;
      }
      const reps = await this.service['prisma'].forecastUser.findMany({ where: { role: 'sales_rep' } });
      if (reps.length > 0) return reps[0].id;
      return '00000000-0000-0000-0000-000000000003'; // fallback
    }
    return repId;
  }

  private async resolveManagerId(managerId: string) {
    if (managerId === 'me' || managerId === '00000000-0000-0000-0000-000000000002') {
      const managers = await this.service['prisma'].forecastUser.findMany({ where: { role: 'manager' } });
      if (managers.length > 0) return managers[0].id;
      return '00000000-0000-0000-0000-000000000002'; // fallback
    }
    return managerId;
  }

  private resolvePeriodId(periodId: string) {
    if (periodId === 'q1-fy26-demo' || periodId === 'board-q1') return '00000000-0000-0000-0000-0000000000b1';
    if (periodId === 'q2-fy26-demo' || periodId === 'board-q2') return '00000000-0000-0000-0000-0000000000b2';
    return periodId;
  }

  // ── B1. SUBMISSIONS ────────────────────────────────────────────────────────

  @Get('forecast/submissions/:period_id/:rep_id')
  async getSubmissions(@Param('period_id') periodId: string, @Param('rep_id') repId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedRepId = await this.resolveRepId(repId, resolvedPeriodId);
      const data = await this.service.getSubmissions(resolvedPeriodId, resolvedRepId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch submissions' };
    }
  }

  @Post('forecast/submissions')
  async createOrUpdateSubmission(
    @Body() body: { rep_id: string; deal_id: string; period_id: string; field: 'best_case' | 'commit'; value: number; notes?: string }
  ) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(body.period_id);
      const resolvedRepId = await this.resolveRepId(body.rep_id, resolvedPeriodId);
      const data = await this.service.createOrUpdateSubmission(resolvedRepId, body.deal_id, resolvedPeriodId, body.field, body.value, body.notes);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create/update submission' };
    }
  }

  @Patch('forecast/submissions/:id/submit')
  async submitForecast(
    @Param('id') id: string,
    @Body() body: { rep_id: string; field: 'best_case' | 'commit' | 'both' }
  ) {
    try {
      const resolvedRepId = await this.resolveRepId(body.rep_id);
      const data = await this.service.submitForecast(id, resolvedRepId, body.field);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to submit forecast' };
    }
  }

  @Patch('forecast/submissions/:id/approve')
  async approveSubmission(
    @Param('id') id: string,
    @Body() body: { manager_id: string; field: 'best_case' | 'commit' | 'both' }
  ) {
    try {
      const resolvedManagerId = await this.resolveManagerId(body.manager_id);
      const data = await this.service.approveSubmission(id, resolvedManagerId, body.field);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to approve submission' };
    }
  }

  @Patch('forecast/submissions/:id/reopen')
  async reopenSubmission(
    @Param('id') id: string,
    @Body() body: { manager_id: string }
  ) {
    try {
      const resolvedManagerId = await this.resolveManagerId(body.manager_id);
      const data = await this.service.reopenSubmission(id, resolvedManagerId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to reopen submission' };
    }
  }

  @Patch('forecast/submissions/:id/override')
  async overrideSubmission(
    @Param('id') id: string,
    @Body() body: { manager_id: string; field: 'best_case' | 'commit' | 'both'; override_value: number }
  ) {
    try {
      const resolvedManagerId = await this.resolveManagerId(body.manager_id);
      const data = await this.service.overrideSubmission(id, resolvedManagerId, body.field, body.override_value);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to override submission' };
    }
  }

  // ── B2. NOTIFICATIONS ──────────────────────────────────────────────────────

  @Get('forecast/notifications/:rep_id')
  async getNotifications(@Param('rep_id') repId: string) {
    try {
      const resolvedRepId = await this.resolveRepId(repId);
      const data = await this.service.getNotifications(resolvedRepId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch notifications' };
    }
  }

  @Patch('forecast/notifications/:id/seen')
  async markNotificationSeen(@Param('id') id: string) {
    try {
      const data = await this.service.markNotificationSeen(id);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to mark notification seen' };
    }
  }

  // ── B3. ACTIVITY LOG ───────────────────────────────────────────────────────

  @Get('forecast/activity/:submission_id')
  async getSubmissionActivity(@Param('submission_id') submissionId: string) {
    try {
      const data = await this.service.getSubmissionActivity(submissionId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch submission activity' };
    }
  }

  // ── B5. TARGETS ────────────────────────────────────────────────────────────

  @Get('forecast/targets/:period_id')
  async getTargets(@Param('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const data = await this.service.getTargets(resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch targets' };
    }
  }

  @Post('forecast/targets/assign')
  async assignTargets(
    @Body() body: { period_id: string; manager_id: string; assignments: { rep_id: string; target_value: number }[] }
  ) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(body.period_id);
      const resolvedManagerId = await this.resolveManagerId(body.manager_id);
      const data = await this.service.assignTargets(resolvedPeriodId, resolvedManagerId, body.assignments);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to assign targets' };
    }
  }

  // ── B6. FORECAST PERIODS ───────────────────────────────────────────────────

  @Get('forecast/periods')
  async getPeriods() {
    try {
      const data = await this.service.getPeriods();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch forecast periods' };
    }
  }

  @Get('forecast/periods/:period_id/reps')
  async getPeriodReps(@Param('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const data = await this.service.getPeriodReps(resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch period reps' };
    }
  }

  // ── B7. CLOSED DEALS ───────────────────────────────────────────────────────

  @Get('forecast/closed-deals/:rep_id')
  async getClosedDealsTotal(@Param('rep_id') repId: string, @Query('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedRepId = await this.resolveRepId(repId, resolvedPeriodId);
      const data = await this.service.getClosedDealsTotal(resolvedRepId, resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch closed won total' };
    }
  }

  @Get('forecast/closed-deals/:rep_id/:deal_id')
  async getClosedDealValue(@Param('rep_id') repId: string, @Param('deal_id') dealId: string) {
    try {
      const resolvedRepId = await this.resolveRepId(repId);
      const data = await this.service.getClosedDealValue(resolvedRepId, dealId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch closed deal value' };
    }
  }

  // ── B8. PIPELINE ───────────────────────────────────────────────────────────

  @Get('forecast/pipeline/:rep_id')
  async getPipelineTotal(@Param('rep_id') repId: string, @Query('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedRepId = await this.resolveRepId(repId, resolvedPeriodId);
      const data = await this.service.getPipelineTotal(resolvedRepId, resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch pipeline total' };
    }
  }

  @Get('forecast/pipeline/:rep_id/:deal_id')
  async getPipelineDealValue(
    @Param('rep_id') repId: string,
    @Param('deal_id') dealId: string,
    @Query('period_id') periodId: string
  ) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedRepId = await this.resolveRepId(repId, resolvedPeriodId);
      const data = await this.service.getPipelineDealValue(resolvedRepId, dealId, resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch deal pipeline value' };
    }
  }

  // ── B9. AI REVENUE PREDICTOR SYNC ──────────────────────────────────────────

  @Get('forecast/ai-predictor/scores/:rep_id')
  async getAiPredictionScores(@Param('rep_id') repId: string) {
    try {
      const resolvedRepId = await this.resolveRepId(repId);
      const data = await this.service.getAiPredictionScores(resolvedRepId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch AI scores' };
    }
  }

  // ── B10. DRILL-DOWN & BOARD VIEWS ──────────────────────────────────────────

  @Get('forecast/drill-down/:rep_id')
  async getRepDrilldown(@Param('rep_id') repId: string, @Query('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedRepId = await this.resolveRepId(repId, resolvedPeriodId);
      const data = await this.service.getRepDrilldown(resolvedRepId, resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch drill-down' };
    }
  }

  @Get('forecast/drill-down/:rep_id/summary')
  async getRepDrilldownSummary(@Param('rep_id') repId: string, @Query('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedRepId = await this.resolveRepId(repId, resolvedPeriodId);
      const data = await this.service.getRepDrilldownSummary(resolvedRepId, resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch drill-down summary' };
    }
  }

  @Get('forecast/manager-board/:manager_id')
  async getManagerBoard(@Param('manager_id') managerId: string, @Query('period_id') periodId: string) {
    try {
      const resolvedPeriodId = this.resolvePeriodId(periodId);
      const resolvedManagerId = await this.resolveManagerId(managerId);
      const data = await this.service.getManagerBoard(resolvedManagerId, resolvedPeriodId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch manager board' };
    }
  }
}
