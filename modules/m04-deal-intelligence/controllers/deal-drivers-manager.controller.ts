import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { DealDriversAnalyticsService } from '../services/deal-drivers-analytics.service';

@Controller('api/manager/deal-drivers')
export class DealDriversManagerController {
  constructor(private readonly analytics: DealDriversAnalyticsService) {}

  @Get('summary')
  getSummary(@Query() query: Record<string, string>) {
    return this.analytics.getSummary(query);
  }

  @Get('risk-matrix')
  getRiskMatrix(@Query() query: Record<string, string>) {
    return this.analytics.getRiskMatrix(query);
  }

  @Get('compare-periods')
  getComparePeriods(@Query() query: Record<string, string>) {
    return this.analytics.getComparePeriods(query);
  }

  @Get('at-risk-deals')
  getAtRiskDeals(@Query() query: Record<string, string>) {
    return this.analytics.getAtRiskDeals(query);
  }

  @Get('ai-insights')
  getAiInsights(@Query() query: Record<string, string>) {
    return this.analytics.getAiInsights(query);
  }

  @Get('risk-matrix/drilldown')
  getDrilldown(@Query() query: Record<string, string>) {
    return this.analytics.getDrilldown(query);
  }

  @Post('risk-matrix/drilldown/export')
  exportDrilldown(@Body() body: Record<string, string>) {
    return { downloadUrl: `/exports/drilldown-${body.repId || 'rep'}.csv` };
  }

  @Post('risk-matrix/export')
  exportRiskMatrix(@Body() _body: Record<string, string>) {
    return { downloadUrl: '/exports/risk-matrix.csv' };
  }

  @Post('risk-matrix/schedule-1on1')
  scheduleOneOnOne(@Body() body: { repId: string; suggestedDate: string; note?: string }) {
    return {
      confirmationMessage: `1:1 scheduled for rep ${body.repId}`,
      calendarEventId: `evt_${Date.now()}`,
    };
  }
}
