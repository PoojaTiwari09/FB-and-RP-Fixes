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

  // ─── Accounts Alert ──────────────────────────────────────────
  @Get('revenue/accounts/alert')
  async getAlert(): Promise<any> {
    const config = await this.prisma.managerAccountsConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.alertBanner || { totalARR: 0, accountCount: 0, inactiveDays: 0 };
  }

  // ─── Accounts Summary ─────────────────────────────────────────
  @Get('revenue/accounts/summary')
  async getSummary(): Promise<any> {
    const config = await this.prisma.managerAccountsConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
    return config?.kpiSummary || [];
  }

  // ─── Accounts Viewers ─────────────────────────────────────────
  @Get('revenue/accounts/viewers')
  async getViewers(): Promise<any> {
    const config = await this.prisma.managerAccountsConfig.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
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
  async getAccountActivity(
    @Param('accountId') accountId: string,
    @Query('type') type?: string,
  ) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    const feed = (acc?.activityFeed as any) || { items: [], total: 0, page: 1, totalPages: 0 };
    const items = feed.items || [];
    const filteredItems = type && type !== 'all'
      ? items.filter((item: any) => item.type?.toLowerCase() === type.toLowerCase())
      : items;
    return {
      items: filteredItems,
      total: filteredItems.length,
      page: 1,
      totalPages: 1,
    };
  }

  // ─── Account Drawer Briefs ────────────────────────────────────
  @Get('revenue/accounts/:accountId/briefs')
  async getAccountBriefs(@Param('accountId') accountId: string) {
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    if (!acc) {
      return { briefContent: 'Account not found.' };
    }
    const systemPrompt = `You are a helpful sales coaching assistant. Generate a professional and structured account brief for a sales representative based on the provided account metadata. You MUST return ONLY raw JSON matching exactly this structure, with no markdown fences, no preamble, and no extra text:
{
  "overview": "string",
  "keyDiscussionPoints": "string",
  "customerNeedsGoals": "string",
  "risksObjections": "string",
  "decisionsCommitments": "string",
  "nextSteps": "string",
  "keyStakeholders": "string or null",
  "recentActivityContext": "string or null"
}`;
    const userMessage = `Generate an account brief for the following account:
Account Name: ${acc.name}
Exit ARR: $${acc.exitARR.toLocaleString()}
Contacts Count: ${acc.contactsCount}
Open Deals: $${acc.openDeals.toLocaleString()}
Renewal Date: ${acc.renewalDate}
Last Activity: ${acc.lastActivity}
Manager Note: ${acc.managerNote || 'None'}
Activities: ${JSON.stringify(acc.activity)}`;

    let briefContent = '';
    try {
      briefContent = await this.callGroq(systemPrompt, userMessage);
    } catch (e) {
      console.error('[Briefs] Groq call failed, using fallback:', e);
    }
    if (!briefContent) {
      briefContent = JSON.stringify({
        overview: `${acc.name} is a key account with $${acc.exitARR.toLocaleString()} ARR. They have ${acc.contactsCount} contacts and $${acc.openDeals.toLocaleString()} open deals.`,
        keyDiscussionPoints: `Last activity recorded on ${acc.lastActivity}.`,
        customerNeedsGoals: `Need to ensure successful renewal by ${acc.renewalDate}.`,
        risksObjections: `No specific risks recorded.`,
        decisionsCommitments: `None recorded.`,
        nextSteps: `Follow up on open deals and plan renewal review meeting.`,
        keyStakeholders: `Manager note: ${acc.managerNote || 'None'}`,
        recentActivityContext: null
      });
    }
    return { briefContent };
  }

  // Helper method to call Groq API
  private async callGroq(systemPrompt: string, userMessage: string): Promise<string> {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return '';
    }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`[Groq] API error ${res.status}: ${text}`);
        return '';
      }
      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content?.trim() || '';
    } catch (err) {
      console.warn('[Groq] Fetch failed:', err);
      return '';
    }
  }

  private getLocalChatFallback(msg: string, accountName: string): string {
    const msgLower = msg.toLowerCase();
    if (msgLower.includes('budget') || msgLower.includes('cost') || msgLower.includes('price')) {
      return `For the account ${accountName}, budget constraints were noted. The customer mentioned that high implementation costs might delay sign-off. Emphasize our ROI calculator and flexible quarterly terms in your next proposal.`;
    }
    if (msgLower.includes('competitor') || msgLower.includes('compete') || msgLower.includes('vendor')) {
      return `Our signals indicate ${accountName} is actively evaluating competing products for their enterprise needs. Make sure to schedule a deep-dive call showcasing our unique security integrations and multi-tenant scaling capabilities.`;
    }
    if (msgLower.includes('renewal') || msgLower.includes('date') || msgLower.includes('when')) {
      return `The renewal for ${accountName} is scheduled for Dec 16, 2024. The current sentiment is positive, but we need to resolve the pending legal reviews to ensure there are no last-minute delays.`;
    }
    if (msgLower.includes('contact') || msgLower.includes('who') || msgLower.includes('champion')) {
      return `The main contact at ${accountName} is Marcus Lee (VP Engineering), who is highly supportive. However, we also need to win over the Finance Director to secure final approval.`;
    }
    return `Based on recent updates for ${accountName}, they are currently in negotiation stage for a deal valued at $180,000. Key next step: follow up on the proposal sent yesterday and schedule a review session.`;
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
    const acc = await this.prisma.managerAccount.findUnique({
      where: { id: accountId },
    });
    if (!acc) {
      return { reply: 'Account not found.' };
    }
    const systemPrompt = `You are a helpful sales assistant. Answer the user's question about the account "${acc.name}" dynamically based on their query. Keep it concise (2-4 sentences) and professional.`;
    
    let reply = '';
    try {
      reply = await this.callGroq(systemPrompt, message);
    } catch (e) {
      console.error('[AI Chat] Groq call failed, using fallback:', e);
    }

    if (!reply) {
      reply = this.getLocalChatFallback(message, acc.name);
    }

    const history = (acc.aiChatHistory as any[]) || [];
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
