import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
    return this.svc.fetchTasks({
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
    @Query('assigneeId') assigneeId = 'me',
    @Query('date') date?: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.svc.fetchSummary(assigneeId, date || today);
  }

  @Get('api/tasks/filters-config')
  filtersConfig() {
    return this.svc.fetchFiltersConfig();
  }

  @Get('api/activities/recent')
  recentActivity() {
    return this.svc.fetchRecentActivity();
  }

  @Get('api/team/members')
  teamMembers() {
    return this.svc.fetchTeamMembers();
  }

  @Get('api/email-templates')
  emailTemplates() {
    return this.svc.emailTemplates();
  }

  @Get('api/search/linked-to')
  linkedTo(@Query('search') search = '') {
    return this.svc.searchLinkedEntities(search);
  }

  @Get('api/tasks/:taskId/detail')
  taskDetail(@Param('taskId') taskId: string) {
    return this.svc.fetchTaskDetail(taskId);
  }

  @Get('api/tasks/:taskId/email-draft')
  emailDraft(@Param('taskId') taskId: string) {
    return this.svc.fetchEmailDraft(taskId);
  }

  @Get('api/tasks/:taskId/linkedin-script')
  linkedInScript(@Param('taskId') taskId: string) {
    return this.svc.fetchLinkedInScript(taskId);
  }

  @Get('api/contacts/:contactId/detail')
  contactDetail(@Param('contactId') contactId: string) {
    return this.svc.fetchContactDetail(contactId);
  }

  @Post('api/tasks')
  createTask(@Body() body: Record<string, unknown>) {
    return this.svc.createTask(body);
  }

  @Patch('api/tasks/:taskId/reassign')
  reassign(
    @Param('taskId') taskId: string,
    @Body() body: { newAssigneeId: string },
  ) {
    return this.svc.reassignTask(taskId, body.newAssigneeId);
  }

  @Post('api/tasks/:taskId/mark-complete')
  markComplete(@Param('taskId') taskId: string) {
    return this.svc.markComplete(taskId);
  }

  @Post('api/tasks/:taskId/skip')
  skip(@Param('taskId') taskId: string) {
    return this.svc.skipTask(taskId);
  }

  @Post('api/tasks/:taskId/dismiss')
  dismiss(@Param('taskId') taskId: string) {
    return this.svc.dismissTask(taskId);
  }

  @Post('api/tasks/:taskId/action')
  action(
    @Param('taskId') taskId: string,
    @Body() body: { action: string },
  ) {
    return this.svc.logAction(taskId, body.action);
  }

  @Post('api/tasks/:taskId/notes')
  notes(@Param('taskId') taskId: string, @Body() body: { notes: string }) {
    return this.svc.fetchTaskDetail(taskId);
  }

  @Post('api/tasks/:taskId/send-email')
  sendEmail() {
    return { status: 'success', data: { ok: true } };
  }

  @Post('api/tasks/:taskId/save-draft')
  saveDraft() {
    return { status: 'success', data: { ok: true } };
  }

  @Post('api/tasks/:taskId/ai-rephrase')
  rephrase() {
    return {
      status: 'success',
      data: {
        rephrasedBody:
          'Hi Sarah,\n\nQuick follow-up on the Q2 renewal — ROI calculator attached.\n\nBest,\nAlex',
      },
    };
  }
}
