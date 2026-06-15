import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('api/v1/account-intelligence/coaching')
export class CoachingController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Coaching Filters ─────────────────────────────────────────
  @Get('filters')
  async getCoachingFilters(): Promise<any> {
    return { periods: [], teams: [] };
  }

  // ─── Coaching Activity ────────────────────────────────────────
  @Get('activity')
  async getCoachingActivity(): Promise<any> {
    return [];
  }

  // ─── Coaching Interaction ─────────────────────────────────────
  @Get('interaction')
  async getCoachingInteraction(): Promise<any> {
    return { reps: [], benchmarks: {} };
  }

  // ─── Coaching Responsiveness ──────────────────────────────────
  @Get('responsiveness')
  async getCoachingResponsiveness(): Promise<any> {
    return [];
  }

  // ─── Coaching Scorecards ──────────────────────────────────────
  @Get('scorecards')
  async getCoachingScorecards(): Promise<any> {
    return [];
  }

  // ─── AI Insights ──────────────────────────────────────────────
  @Get('ai-insights')
  async getCoachingAiInsights(): Promise<any> {
    const recommendations = await this.prisma.coachingrecommendations.findMany({
      orderBy: { generatedat: 'desc' },
      take: 5
    });
    return recommendations.map(r => ({
      id: r.recid,
      text: r.recommendationtext,
      category: r.category,
      confidence: r.confidencescore,
      date: r.generatedat
    }));
  }

  // ─── Team vs Benchmark ────────────────────────────────────────
  @Get('team-vs-benchmark')
  async getCoachingTeamVsBenchmark(): Promise<any> {
    return [];
  }

  // ─── Coaching Rep Details ─────────────────────────────────────
  @Get('rep/:repId')
  async getCoachingRepDetails(@Param('repId') repId: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(repId);
    
    if (isUuid) {
      const snapshot = await this.prisma.coachingsnapshots.findFirst({
        where: { userid: repId },
        orderBy: { computedat: 'desc' }
      });

      const recommendations = await this.prisma.coachingrecommendations.findMany({
        where: { userid: repId },
        orderBy: { generatedat: 'desc' },
        take: 3
      });

      if (snapshot) {
        const talkRatioVal = snapshot.talkratio ? Number(snapshot.talkratio) : 50;
        const qRateVal = snapshot.questionrate ? Number(snapshot.questionrate) : 12;
        const monoVal = snapshot.longestmonologue ? Number(snapshot.longestmonologue) : 135;

        return {
          header: { 
            repId, 
            name: 'Sales Representative', 
            initials: 'SR', 
            avatarColor: '#3b82f6', 
            title: 'Interaction Coaching', 
            callsAnalyzed: snapshot.callcount || 0 
          },
          kpis: {
            talkRatio: { 
              value: `${talkRatioVal}%`, 
              optimalText: 'Optimal <43%', 
              status: talkRatioVal > 43 ? 'warning' : 'good' 
            },
            questionRate: { 
              value: `${qRateVal}/hr`, 
              optimalText: 'Optimal 18+/hr', 
              status: qRateVal < 18 ? 'warning' : 'good' 
            },
            monologue: { 
              value: `${Math.floor(monoVal / 60)}m ${monoVal % 60}s`, 
              optimalText: 'Optimal <2 min', 
              status: monoVal > 120 ? 'warning' : 'good' 
            },
          },
          trend: { 
            title: 'Talk ratio — Trend', 
            benchmark: 43, 
            insightText: recommendations.length > 0 ? recommendations[0].recommendationtext : 'Trend data tracked over time.', 
            weeks: [] 
          },
          recentCalls: [],
          observedPatterns: recommendations.map(r => r.recommendationtext),
          recommendedActions: recommendations.map(r => r.recommendationtext),
          coachingHistory: []
        };
      }
    }

    return {
      header: { repId, name: 'Sales Representative', initials: 'SR', avatarColor: '#ccc', title: 'Interaction Coaching', callsAnalyzed: 0 },
      kpis: {
        talkRatio: { value: '0%', optimalText: 'Optimal <43%', status: 'good' },
        questionRate: { value: '0/hr', optimalText: 'Optimal 18+/hr', status: 'good' },
        monologue: { value: '0s', optimalText: 'Optimal <2 min', status: 'good' },
      },
      trend: { title: 'Talk ratio — Trend', benchmark: 43, insightText: 'No actual data available yet.', weeks: [] },
      recentCalls: [],
      observedPatterns: [],
      recommendedActions: [],
      coachingHistory: []
    };
  }
}
