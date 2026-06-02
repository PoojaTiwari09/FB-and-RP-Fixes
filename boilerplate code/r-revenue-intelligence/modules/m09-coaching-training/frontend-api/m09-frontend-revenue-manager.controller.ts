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

@Controller('api/manager')
@UseGuards(M09FrontendAuthGuard)
export class M09FrontendRevenueManagerController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Accounts Alert ──────────────────────────────────────────
  @Get('revenue/accounts/alert')
  async getAlert() {
    const config = await this.prisma.managerAccountsConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.alertBanner || { totalARR: 0, accountCount: 0, inactiveDays: 0 };
  }

  // ─── Accounts Summary ─────────────────────────────────────────
  @Get('revenue/accounts/summary')
  async getSummary() {
    const config = await this.prisma.managerAccountsConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.kpiSummary || [];
  }

  // ─── Accounts Viewers ─────────────────────────────────────────
  @Get('revenue/accounts/viewers')
  async getViewers() {
    const config = await this.prisma.managerAccountsConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.viewers || { teams: [], reps: [] };
  }

  // ─── Accounts List ────────────────────────────────────────────
  @Get('revenue/accounts')
  async getAccounts(
    @Query('search') search?: string,
    @Query('noActivity') noActivity?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    let accounts = await this.prisma.managerAccount.findMany({});

    // Filter search
    if (search) {
      const q = search.toLowerCase();
      accounts = accounts.filter((a) => a.name.toLowerCase().includes(q));
    }

    // Filter noActivity
    if (noActivity === 'true' || noActivity === 'true') {
      accounts = accounts.filter((a) => {
        const act = a.activity as any[];
        return !act || act.length === 0;
      });
    }

    // Sort
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      accounts.sort((a, b) => {
        let valA: any = (a as any)[sortBy];
        let valB: any = (b as any)[sortBy];
        if (sortBy === 'accountName') {
          valA = a.name;
          valB = b.name;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * order;
        }
        return 0;
      });
    }

    return {
      total: accounts.length,
      page: 1,
      size: 25,
      totalPages: 1,
      accounts: accounts.map((a) => ({
        accountId: a.id,
        accountName: a.name,
        owner: { id: a.ownerId, name: a.ownerName, initials: a.ownerInitials },
        exitARR: a.exitARR,
        contactsCount: a.contactsCount,
        activity: a.activity,
        lastActivity: a.lastActivity,
        managerNote: a.managerNote,
        openDeals: a.openDeals,
        renewalDate: a.renewalDate,
      })),
    };
  }

  // ─── Account Activities (tooltip) ─────────────────────────────
  @Get('revenue/accounts/:accountId/activities/recent')
  async getRecentActivities(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return acc?.recentActivities || [];
  }

  // ─── Account Drawer Overview ──────────────────────────────────
  @Get('revenue/accounts/:accountId/overview')
  async getAccountOverview(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return acc?.overview || { risksAndObjections: [] };
  }

  // ─── Account Drawer Activity Feed ─────────────────────────────
  @Get('revenue/accounts/:accountId/activity')
  async getAccountActivity(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return acc?.activityFeed || { items: [], total: 0, page: 1, totalPages: 0 };
  }

  // ─── Account Drawer Briefs ────────────────────────────────────
  @Get('revenue/accounts/:accountId/briefs')
  async getAccountBriefs(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return { briefContent: acc?.briefContent || '' };
  }

  // ─── Account Drawer Todos ─────────────────────────────────────
  @Get('revenue/accounts/:accountId/todos')
  async getAccountTodos(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return acc?.todos || { todos: [] };
  }

  @Patch('revenue/accounts/:accountId/todos/:todoId')
  async toggleTodo(
    @Param('accountId') accountId: string,
    @Param('todoId') todoId: string,
    @Body('completed') completed: boolean,
  ) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    if (!acc) return { success: false };
    const todosData = (acc.todos as any)?.todos || [];
    const updated = todosData.map((t: any) =>
      t.id === todoId ? { ...t, completed } : t,
    );
    await this.prisma.managerAccount.update({
      where: { id: accountId },
      data: { todos: { todos: updated } },
    });
    return { success: true };
  }

  // ─── Account Drawer Notes ─────────────────────────────────────
  @Get('revenue/accounts/:accountId/notes')
  async getAccountNotes(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return {
      notes: acc?.notes || '',
      updatedAt: acc?.notesUpdatedAt || null,
    };
  }

  @Patch('revenue/accounts/:accountId/notes')
  async saveNotes(
    @Param('accountId') accountId: string,
    @Body('notes') notes: string,
  ) {
    await this.prisma.managerAccount.update({
      where: { id: accountId },
      data: { notes, notesUpdatedAt: new Date() },
    });
    return { success: true };
  }

  // ─── Account Drawer CRM ───────────────────────────────────────
  @Get('revenue/accounts/:accountId/crm')
  async getAccountCrm(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    return acc?.crmFields || { crmFields: [] };
  }

  // ─── AI Chat ──────────────────────────────────────────────────
  @Post('revenue/accounts/:accountId/ai-chat')
  async sendAiChat(
    @Param('accountId') accountId: string,
    @Body('message') message: string,
  ) {
    const reply = `Based on recent activity, this account has shown strong engagement with your renewal proposal. The champion last responded and flagged budget as a key concern. I recommend scheduling a call to address the ROI model directly. (DB-Persisted response to: "${message}")`;
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    const history = (acc?.aiChatHistory as any[]) || [];
    history.push({ role: 'user', message });
    history.push({ role: 'assistant', reply });
    await this.prisma.managerAccount.update({
      where: { id: accountId },
      data: { aiChatHistory: history },
    });
    return { reply };
  }

  // ─── Coaching Filters ─────────────────────────────────────────
  @Get('coaching/filters')
  async getCoachingFilters() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.filters || { periods: [], teams: [] };
  }

  // ─── Coaching Activity ────────────────────────────────────────
  @Get('coaching/activity')
  async getCoachingActivity() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.activity || [];
  }

  // ─── Coaching Interaction ─────────────────────────────────────
  @Get('coaching/interaction')
  async getCoachingInteraction() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.interaction || { reps: [], benchmarks: {} };
  }

  // ─── Coaching Responsiveness ──────────────────────────────────
  @Get('coaching/responsiveness')
  async getCoachingResponsiveness() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.responsiveness || [];
  }

  // ─── Coaching Scorecards ──────────────────────────────────────
  @Get('coaching/scorecards')
  async getCoachingScorecards() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.scorecards || [];
  }

  // ─── AI Insights ──────────────────────────────────────────────
  @Get('coaching/ai-insights')
  async getCoachingAiInsights() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.aiInsights || [];
  }

  // ─── Team vs Benchmark ────────────────────────────────────────
  @Get('coaching/team-vs-benchmark')
  async getCoachingTeamVsBenchmark() {
    const config = await this.prisma.managerCoachingConfig.findUnique({
      where: { id: 'default' },
    });
    return config?.teamVsBenchmark || [];
  }

  // ─── Coaching Rep Details ─────────────────────────────────────
  @Get('coaching/rep/:repId')
  async getCoachingRepDetails(@Param('repId') repId: string) {
    const rep = await this.prisma.managerCoachingRep.findUnique({
      where: { id: repId },
    });
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
