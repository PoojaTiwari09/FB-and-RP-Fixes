import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { M09FrontendAuthGuard } from './m09-frontend-auth.guard';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@rri/database';

@Controller('api/manager')
@UseGuards(M09FrontendAuthGuard)
export class M09FrontendRevenueManagerController {
  constructor(private readonly prisma: PrismaService) {}


  // ─── Coaching Filters ─────────────────────────────────────────
  @Get('coaching/filters')
  async getCoachingFilters(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.filters || { periods: [], teams: [] };
  }

  // ─── Coaching Activity ────────────────────────────────────────
  @Get('coaching/activity')
  async getCoachingActivity(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.activity || [];
  }

  // ─── Coaching Interaction ─────────────────────────────────────
  @Get('coaching/interaction')
  async getCoachingInteraction(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.interaction || { reps: [], benchmarks: {} };
  }

  // ─── Coaching Responsiveness ──────────────────────────────────
  @Get('coaching/responsiveness')
  async getCoachingResponsiveness(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.responsiveness || [];
  }

  // ─── Coaching Scorecards ──────────────────────────────────────
  @Get('coaching/scorecards')
  async getCoachingScorecards(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.scorecards || [];
  }

  // ─── AI Insights ──────────────────────────────────────────────
  @Get('coaching/ai-insights')
  async getCoachingAiInsights(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.aiInsights || [];
  }

  // ─── Team vs Benchmark ────────────────────────────────────────
  @Get('coaching/team-vs-benchmark')
  async getCoachingTeamVsBenchmark(): Promise<any> {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.teamVsBenchmark || [];
  }

  // ─── Coaching Rep Details ─────────────────────────────────────
  @Get('coaching/rep/:repId')
  async getCoachingRepDetails(@Param('repId') repId: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(repId);
    let rep = null;
    
    if (isUuid) {
      rep = await this.prisma.managerCoachingRep.findUnique({
        where: { id: repId },
      });
    }

    if (!rep) {
      return {
        header: { repId, name: 'Sales Representative', initials: 'SR', avatarColor: '#ccc', title: 'Interaction Coaching', callsAnalyzed: 0 },
        kpis: {
          talkRatio: { value: '50%', optimalText: 'Optimal <43%', status: 'warning' },
          questionRate: { value: '12/hr', optimalText: 'Optimal 18+/hr', status: 'warning' },
          monologue: { value: '2m 15s', optimalText: 'Optimal <2 min', status: 'warning' },
        },
        trend: { title: 'Talk ratio — Trend', benchmark: 43, insightText: 'No data', weeks: [] },
        recentCalls: [],
        observedPatterns: [],
        recommendedActions: [],
        coachingHistory: []
      };
    }
    return rep;
  }
}
