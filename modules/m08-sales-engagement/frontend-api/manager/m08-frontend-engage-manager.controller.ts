import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { M08FrontendEngageManagerService } from './m08-frontend-engage-manager.service';

/** Manager Engage UI bridge — `/api/tasks`, `/api/team`, etc. */
@Controller()
@UseGuards(TenantGuard)
export class M08FrontendEngageManagerController {
  constructor(private readonly svc: M08FrontendEngageManagerService) {}

  @Get('api/tasks')
  tasks(
    @Req() req: any,
    @Query('assigneeId') assigneeId = 'me',
    @Query('date') date?: string,
    @Query('tab') tab = 'today',
    @Query('channel') channel?: string,
    @Query('search') search?: string,
    @Query('groupBy') groupBy?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.svc.fetchTasks(req.tenantId, {
      assigneeId,
      date: date || today,
      tab,
      channel,
      search,
      groupBy,
      sortBy,
      page: page ? parseInt(page, 10) : 1,
      size: size ? parseInt(size, 10) : 50,
    });
  }

  @Get('api/tasks/summary')
  summary(
    @Req() req: any,
    @Query('assigneeId') assigneeId = 'me',
    @Query('date') date?: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.svc.fetchSummary(req.tenantId, assigneeId, date || today);
  }

  @Get('api/tasks/filters-config')
  filtersConfig(@Req() req: any) {
    return this.svc.fetchFiltersConfig(req.tenantId);
  }

  @Get('api/activities/recent')
  recentActivity(@Req() req: any) {
    return this.svc.fetchRecentActivity(req.tenantId);
  }

  @Get('api/team/members')
  teamMembers(@Req() req: any) {
    return this.svc.fetchTeamMembers(req.tenantId);
  }

  @Get('api/email-templates')
  emailTemplates(@Req() req: any) {
    return this.svc.emailTemplates(req.tenantId);
  }

  @Get('api/search/linked-to')
  linkedTo(@Req() req: any, @Query('search') search = '') {
    return this.svc.searchLinkedEntities(req.tenantId, search);
  }

  @Get('api/tasks/:taskId/detail')
  taskDetail(@Req() req: any, @Param('taskId') taskId: string) {
    return this.svc.fetchTaskDetail(req.tenantId, taskId);
  }

  @Get('api/tasks/:taskId/email-draft')
  emailDraft(@Req() req: any, @Param('taskId') taskId: string) {
    return this.svc.fetchEmailDraft(req.tenantId, taskId);
  }

  @Get('api/tasks/:taskId/linkedin-script')
  linkedInScript(@Req() req: any, @Param('taskId') taskId: string) {
    return this.svc.fetchLinkedInScript(req.tenantId, taskId);
  }

  @Get('api/contacts/:contactId/detail')
  contactDetail(@Req() req: any, @Param('contactId') contactId: string) {
    return this.svc.fetchContactDetail(req.tenantId, contactId);
  }

  @Post('api/tasks')
  createTask(@Req() req: any, @Body() body: Record<string, unknown>) {
    return this.svc.createTask(req.tenantId, body);
  }

  @Patch('api/tasks/:taskId/reassign')
  reassign(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() body: { newAssigneeId: string },
  ) {
    return this.svc.reassignTask(req.tenantId, taskId, body.newAssigneeId);
  }

  @Post('api/tasks/:taskId/mark-complete')
  markComplete(@Req() req: any, @Param('taskId') taskId: string) {
    return this.svc.markComplete(req.tenantId, taskId);
  }

  @Post('api/tasks/:taskId/skip')
  skip(@Req() req: any, @Param('taskId') taskId: string) {
    return this.svc.skipTask(req.tenantId, taskId);
  }

  @Post('api/tasks/:taskId/dismiss')
  dismiss(@Req() req: any, @Param('taskId') taskId: string) {
    return this.svc.dismissTask(req.tenantId, taskId);
  }

  @Post('api/tasks/:taskId/action')
  action(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() body: { action: string },
  ) {
    return this.svc.logAction(req.tenantId, taskId, body.action);
  }

  @Post('api/tasks/:taskId/notes')
  notes(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() body: { notes: string },
  ) {
    return this.svc.saveNotes(req.tenantId, taskId, body.notes);
  }

  @Post('api/tasks/:taskId/send-email')
  sendEmail(@Req() req: any, @Param('taskId') taskId: string, @Body() body: any) {
    return this.svc.sendEmail(req.tenantId, taskId, body);
  }

  @Post('api/tasks/:taskId/save-draft')
  saveDraft(@Req() req: any, @Param('taskId') taskId: string, @Body() body: any) {
    return this.svc.saveDraft(req.tenantId, taskId, body);
  }

  @Post('api/tasks/:taskId/ai-rephrase')
  rephrase(@Req() req: any, @Param('taskId') taskId: string, @Body() body: any) {
    return this.svc.rephraseEmail(req.tenantId, taskId, body);
  }

  @Patch('api/tasks/:taskId')
  updateTask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() body: any,
  ) {
    return this.svc.updateTask(req.tenantId, taskId, body);
  }
}

