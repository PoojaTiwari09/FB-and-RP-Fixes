import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { EditsService } from '../services/edits.service';
import { TodosService } from '../services/todos.service';
import { AiService } from '../services/ai.service';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

import { PrismaService } from '../database/prisma.service';

@Controller('api/manager/revenue/accounts')
@UseGuards(TenantGuard)
export class M05FrontendAccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly editsService: EditsService,
    private readonly todosService: TodosService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('alert')
  async getAlertBanner(@Req() req: any) {
    // Uses the demo board by default if not provided
    const res = await this.accountsService.getEngagementGap('demo', 14);
    return {
      totalARR: res.low_engagement_arr,
      accountCount: res.low_engagement_count,
      inactiveDays: res.window_days,
    };
  }

  @Get('summary')
  async getSummary(
    @Req() req: any,
    @Query('viewing') viewing?: string,
    @Query('period') period?: string,
  ) {
    const res = await this.accountsService.getAccounts(req.tenantId, {
      board_slug: 'demo', // Fixed for frontend
      rep_id: viewing,
      period,
    }, req.userId, req.userRole);

    const allArr = res.summary.all_arr || 0;
    const allCount = res.summary.all_count || 0;
    const atRiskCount = res.summary.tab_counts['at-risk']?.count || 0;
    const atRiskArr = res.summary.tab_counts['at-risk']?.arr || 0;
    
    const highArrCount = res.summary.tab_counts['high-arr']?.count || 0;
    const highArrValue = res.summary.tab_counts['high-arr']?.arr || 0;

    // Use actual database aggregations where possible
    return [
      { label: 'Accounts', value: allArr, count: allCount },
      { label: 'Renewal', value: res.summary.tab_counts['renewal']?.arr || (allArr * 0.4), count: res.summary.tab_counts['renewal']?.count || atRiskCount },
      { label: 'Upsell', value: highArrValue, count: highArrCount },
      { label: 'Churn Risk', value: atRiskArr, count: atRiskCount }
    ];
  }

  @Get('viewers')
  async getViewers(@Req() req: any) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return { teams: [], reps: [] };
    }

    const dbTeams = await this.prisma.team.findMany({
      where: { tenantid: tenantId }
    });

    const dbUsers = await this.prisma.user.findMany({
      where: { tenantid: tenantId }
    });

    return {
      teams: dbTeams.map(t => ({
        id: t.id,
        name: t.name,
        memberCount: t.members ? t.members.length : 0,
      })),
      reps: dbUsers.map(u => {
        const parts = u.name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.[0] || 'U';
        return {
          id: u.id,
          name: u.name,
          initials: initials.toUpperCase(),
          avatarUrl: ''
        };
      }),
    };
  }

  @Get()
  async getAccountsList(
    @Req() req: any,
    @Query('viewing') viewing?: string,
    @Query('period') period?: string,
    @Query('noActivity') noActivity?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    console.log('[DEBUG] Frontend requesting Accounts List', {
      userRole: req.userRole,
      userId: req.userId,
      tenantId: req.tenantId,
      viewing,
      period,
      noActivity,
    });
    const res = await this.accountsService.getAccounts(req.tenantId, {
      board_slug: 'demo',
      rep_id: viewing,
      period,
      sort_field: sortBy,
      sort_dir: sortOrder,
      page: page ? parseInt(page) : 1,
      page_size: size ? parseInt(size) : 20,
    }, req.userId, req.userRole);

    // If noActivity=true is passed, filter locally (or could add to DB logic)
    let accs = res.accounts;
    if (noActivity === 'true') {
      accs = accs.filter(a => a.zero_activity_flag);
    }

    if (search) {
      const lower = search.toLowerCase();
      accs = accs.filter(a => a.name.toLowerCase().includes(lower));
    }

    const formatted = accs.map(a => ({
      accountId: a.hubspot_id,
      accountName: a.name,
      owner: {
        id: a.assigned_rep.id,
        name: a.assigned_rep.name,
        initials: a.assigned_rep.name.split(' ').map((n: string) => n[0]).join(''),
      },
      exitARR: a.exit_arr,
      contactsCount: a.contacts_count,
      activity: a.activities_21d,
      lastActivity: a.last_activity_days !== null ? `${a.last_activity_days} days ago` : 'No activity',
      managerNote: a.manager_note,
      openDeals: a.open_deals_summary?.total_amount || 0,
      renewalDate: a.renewal_date,
    }));

    return {
      accounts: formatted,
      page: res.page,
      size: res.page_size,
      total: res.total,
      totalPages: Math.ceil(res.total / res.page_size),
    };
  }

  @Get(':accountId/activities/recent')
  async getRecentActivities(
    @Param('accountId') accountId: string,
    @Query('limit') limit?: string,
  ) {
    const detail = await this.accountsService.getAccountDetail(accountId);
    if ('error' in detail) return [];
    const activities = detail.activities || [];
    const num = limit ? parseInt(limit) : 5;
    return activities.slice(0, num).map((a: any) => ({
      type: a.type,
      datetime: a.timestamp,
      with: 'Primary Contact', // simplified
      subject: a.subject || 'No subject',
    }));
  }

  @Post(':accountId/ai-chat')
  @HttpCode(200)
  async sendAiChat(
    @Param('accountId') accountId: string,
    @Body() body: any,
  ) {
    try {
      const res = await this.aiService.chat({
        company_hubspot_id: accountId,
        message: body.message,
        conversation_history: body.history || [],
      });
      return { reply: res.reply };
    } catch (e: any) {
      return { reply: `AI chat is offline. M05 Database company ID: ${accountId}. Message received: ${body.message}` };
    }
  }

  @Get(':accountId/overview')
  async getAccountOverview(@Param('accountId') accountId: string) {
    const detail = await this.accountsService.getAccountDetail(accountId);
    if ('error' in detail) return { risksAndObjections: [], overviewInfo: null, recentActivities: [] };
    
    const risks = [];
    const score = detail.supplementary?.ai_risk_score ?? 0;
    
    // 1. Risk severity mapping
    if (score > 50) {
      risks.push({
        title: 'High AI Risk Score',
        severity: 'HIGH',
        mentionedCount: 3,
        lastMentioned: 'Yesterday'
      });
    } else if (score > 30) {
      risks.push({
        title: 'Moderate AI Risk Score',
        severity: 'MEDIUM',
        mentionedCount: 2,
        lastMentioned: '2 days ago'
      });
    } else if (score > 0) {
      risks.push({
        title: 'Low AI Risk Score',
        severity: 'LOW',
        mentionedCount: 1,
        lastMentioned: '3 days ago'
      });
    }

    // 2. Engagement Gap check
    const lastActivity = detail.activities?.[0];
    const lastActivityDays = lastActivity
      ? Math.round((Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : null;
      
    if (lastActivityDays === null || lastActivityDays > 21) {
      risks.push({
        title: 'Engagement Gap (No activity in 21+ days)',
        severity: 'HIGH',
        mentionedCount: 2,
        lastMentioned: 'System Scan'
      });
    }

    // 3. Overview info
    const company = detail.company;
    const repId = company?.assigned_rep_id;
    const TEAM_MAP: Record<string, string> = {
      rep_01: 'Sarah Mitchell',
      rep_02: 'James Torres',
      rep_03: 'Priya Nair',
      manager_01: 'Alan Clayborn',
    };
    const assignedRep = (repId && TEAM_MAP[repId]) || repId || 'Unassigned';

    const renewalDeals = (detail.deals || []).filter(
      (d: any) => d.deal_type === 'Renewal' && !['Closed Won', 'Closed Lost'].includes(d.stage),
    );
    const renewalDate = renewalDeals.length > 0
      ? renewalDeals.sort((a: any, b: any) => new Date(a.close_date).getTime() - new Date(b.close_date).getTime())[0].close_date
      : null;

    const openDeals = (detail.deals || []).filter((d: any) => !['Closed Won', 'Closed Lost'].includes(d.stage));
    const openDealsAmount = openDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.amount) || 0), 0);

    const rawNote = detail.supplementary?.manager_note || null;
    let managerNote = rawNote;
    if (rawNote && rawNote.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(rawNote);
        if (Array.isArray(parsed) && parsed.length > 0) {
          managerNote = parsed[0].text || null;
        }
      } catch {}
    }

    const overviewInfo = {
      assignedRep,
      healthScore: company?.healthscore != null
        ? Number(company.healthscore)
        : company?.health_score != null
          ? Number(company.health_score)
          : null,
      exitArr: company?.exit_arr || 0,
      renewalDate,
      contactsCount: detail.contacts?.length || 0,
      lastActivityLabel: lastActivityDays !== null ? `${lastActivityDays} days ago` : 'No activity',
      managerNote,
      openDealsAmount
    };

    // 4. Recent activities list for Overview
    const recentActivities = (detail.activities || []).slice(0, 8).map((a: any) => {
      let mappedType = a.type || 'Note';
      if (mappedType.toUpperCase() === 'EMAIL') mappedType = 'Email';
      else if (mappedType.toUpperCase() === 'MEETING') mappedType = 'Meeting';
      else if (mappedType.toUpperCase() === 'CALL') mappedType = 'Call';
      else if (mappedType.toUpperCase() === 'NOTE') mappedType = 'Note';
      return {
        type: mappedType,
        datetime: a.timestamp,
        subject: a.subject || a.body || `${mappedType} Activity`
      };
    });

    return { risksAndObjections: risks, overviewInfo, recentActivities };
  }

  @Get(':accountId/activity')
  async getAccountActivity(
    @Param('accountId') accountId: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const detail = await this.accountsService.getAccountDetail(accountId);
    if ('error' in detail) return { items: [], total: 0, page: 1, totalPages: 0 };
    
    let acts = (detail.activities || []).map((a: any) => {
      let mappedType = a.type || 'Note';
      if (mappedType.toUpperCase() === 'EMAIL') mappedType = 'Email';
      else if (mappedType.toUpperCase() === 'MEETING') mappedType = 'Meeting';
      else if (mappedType.toUpperCase() === 'CALL') mappedType = 'Call';
      else if (mappedType.toUpperCase() === 'NOTE') mappedType = 'Note';
      return {
        type: mappedType,
        datetime: a.timestamp,
        with: 'Contact',
        subject: a.subject || a.body || `${mappedType} Activity`,
        createdBy: 'Unassigned'
      };
    });

    if (type && type !== 'all') {
      acts = acts.filter(a => a.type.toLowerCase() === type.toLowerCase());
    }

    return {
      items: acts,
      total: acts.length,
      page: 1,
      totalPages: 1
    };
  }

  @Get(':accountId/briefs')
  async getAccountBriefs(@Param('accountId') accountId: string) {
    const detail = await this.accountsService.getAccountDetail(accountId);
    if ('error' in detail) return { briefContent: '' };
    
    // Check if briefs exist on company
    const { data: briefCache } = await (this.accountsService as any).supabase
      .from('ai_briefs_cache')
      .select('*')
      .eq('company_hubspot_id', accountId)
      .order('generated_at', { ascending: false })
      .limit(1);

    const briefContent = this.accountsService.buildFormattedBriefMarkdown(
      detail.company,
      detail.contacts || [],
      detail.deals || [],
      detail.activities || [],
      detail.supplementary,
      briefCache || []
    );

    return {
      briefContent
    };
  }

  @Get(':accountId/todos')
  async getAccountTodos(@Param('accountId') accountId: string) {
    const allItems = await this.todosService.getTodos(accountId);
    const todos = allItems
      .filter((t: any) => t.type === 'todo')
      .map((t: any) => ({
        id: t.id,
        title: t.content,
        dueDate: t.completed_at || new Date().toISOString(),
        assignee: 'Rep',
        completed: t.completed
      }));

    return { todos };
  }

  @Patch(':accountId/todos/:todoId')
  async toggleTodo(
    @Param('accountId') accountId: string,
    @Param('todoId') todoId: string,
    @Body() body: { completed: boolean }
  ) {
    const updated = await this.todosService.updateTodo(todoId, { completed: body.completed });
    return { success: true, completed: updated.completed };
  }

  @Get(':accountId/notes')
  async getAccountNotes(@Param('accountId') accountId: string) {
    const detail = await this.accountsService.getAccountDetail(accountId);
    if ('error' in detail) return { notes: '' };
    return {
      notes: detail.supplementary?.manager_note || '',
      updatedAt: new Date().toISOString()
    };
  }

  @Patch(':accountId/notes')
  async saveAccountNotes(
    @Param('accountId') accountId: string,
    @Body() body: { notes: string },
    @Req() req: any,
  ) {
    const role = req.userRole || 'manager';
    await this.editsService.editSupplementary(accountId, 'manager_note', body.notes, role);
    return { success: true };
  }

  @Get(':accountId/crm')
  async getAccountCrm(@Param('accountId') accountId: string) {
    const detail = await this.accountsService.getAccountDetail(accountId);
    if ('error' in detail) return { crmFields: [] };
    
    return {
      crmFields: [
        { label: 'Industry', value: detail.company?.industry || 'Unknown' },
        { label: 'Employee Count', value: detail.company?.employee_count?.toString() || 'Unknown' },
        { label: 'City', value: detail.company?.city || 'Unknown' },
        { label: 'ARR', value: detail.company?.exit_arr?.toString() || '0' },
        { label: 'Domain', value: detail.company?.domain || 'Unknown' }
      ]
    };
  }
}
