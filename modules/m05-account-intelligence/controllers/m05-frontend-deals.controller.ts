import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { EditsService } from '../services/edits.service';
import { TodosService } from '../services/todos.service';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

@Controller('api/manager/revenue/deals')
@UseGuards(TenantGuard)
export class M05FrontendDealsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly editsService: EditsService,
    private readonly todosService: TodosService,
  ) {}

  @Get(':dealId/overview')
  async getDealOverview(@Param('dealId') dealId: string) {
    const detail = await this.accountsService.getDealDetail(dealId);
    
    const risks: any[] = [];
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

    // Check if the deal's close date is in the past and the deal is not closed
    if (detail.deal.close_date && !['Closed Won', 'Closed Lost'].includes(detail.deal.stage)) {
      const closeDateTime = new Date(detail.deal.close_date).getTime();
      if (closeDateTime < Date.now()) {
        risks.push({
          title: 'Past Close Date',
          severity: 'HIGH',
          mentionedCount: 1,
          lastMentioned: 'Date Check'
        });
      }
    }

    return { risksAndObjections: risks };
  }

  @Get(':dealId/activity')
  async getDealActivity(
    @Param('dealId') dealId: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const detail = await this.accountsService.getDealDetail(dealId);
    
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

  @Get(':dealId/briefs')
  async getDealBriefs(@Param('dealId') dealId: string) {
    const detail = await this.accountsService.getDealDetail(dealId);
    
    let briefContent = '';
    if (detail.briefAvailable && detail.briefContent) {
      const json = detail.briefContent as any;
      if (typeof json === 'string') {
        briefContent = json;
      } else if (json && typeof json === 'object') {
        const headline = json.briefContent || json.headline || json.summary || 'Deal Brief';
        const risk = json.risk_level || json.risk || 'Unknown';
        const keyPoints = Array.isArray(json.key_points) ? json.key_points : [];
        briefContent = `### ${headline}\n\n**Risk Level:** ${risk.toUpperCase()}\n\n#### Key Points:\n` + keyPoints.map((p: string) => `- ${p}`).join('\n');
      } else {
        briefContent = `**Deal Summary for ${detail.deal.deal_name}**\n\nNo AI Brief cached for the parent company ${detail.company?.name || ''}.`;
      }
    } else {
      briefContent = `**Deal Summary for ${detail.deal.deal_name}**\n\nNo AI Brief cached for the parent company ${detail.company?.name || ''}.`;
    }

    return {
      briefContent
    };
  }

  @Get(':dealId/todos')
  async getDealTodos(@Param('dealId') dealId: string) {
    const detail = await this.accountsService.getDealDetail(dealId);
    if (!detail.company) {
      return { todos: [] };
    }
    
    const allItems = await this.todosService.getTodos(detail.company.hubspot_id);
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

  @Patch(':dealId/todos/:todoId')
  async toggleTodo(
    @Param('dealId') dealId: string,
    @Param('todoId') todoId: string,
    @Body() body: { completed: boolean }
  ) {
    const updated = await this.todosService.updateTodo(todoId, { completed: body.completed });
    return { success: true, completed: updated.completed };
  }

  @Get(':dealId/notes')
  async getDealNotes(@Param('dealId') dealId: string) {
    const detail = await this.accountsService.getDealDetail(dealId);
    return {
      notes: detail.supplementary?.manager_note || '',
      updatedAt: new Date().toISOString()
    };
  }

  @Patch(':dealId/notes')
  async saveDealNotes(
    @Param('dealId') dealId: string,
    @Body() body: { notes: string },
    @Req() req: any,
  ) {
    const detail = await this.accountsService.getDealDetail(dealId);
    if (!detail.company) {
      throw new NotFoundException('Parent company not found for notes');
    }
    const role = req.userRole || 'manager';
    await this.editsService.editSupplementary(detail.company.hubspot_id, 'manager_note', body.notes, role);
    return { success: true };
  }

  @Get(':dealId/crm')
  async getDealCrm(@Param('dealId') dealId: string) {
    const detail = await this.accountsService.getDealDetail(dealId);
    
    return {
      crmFields: [
        { label: 'Deal Name', value: detail.deal.deal_name || 'Unknown' },
        { label: 'Stage', value: detail.deal.stage || 'Unknown' },
        { label: 'Amount', value: detail.deal.amount?.toString() || '0' },
        { label: 'Deal Type', value: detail.deal.deal_type || 'Unknown' },
        { label: 'Close Date', value: detail.deal.close_date ? new Date(detail.deal.close_date).toDateString() : 'Unknown' },
        { label: 'Company Name', value: detail.company?.name || 'Unknown' },
        { label: 'Industry', value: detail.company?.industry || 'Unknown' },
      ]
    };
  }
}
