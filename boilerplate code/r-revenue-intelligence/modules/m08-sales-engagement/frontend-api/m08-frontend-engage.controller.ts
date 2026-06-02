import { Controller, Get, Post, Patch, Param, Query, Req, Body, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M08FrontendEngageService } from './m08-frontend-engage.service';

/** UI bridge: `/api/engage/*` — matches Revenue-Intelligence-UI Engage rep contract. */
@Controller('api/engage')
@UseGuards(TenantGuard)
export class M08FrontendEngageController {
  constructor(private readonly svc: M08FrontendEngageService) {}

  @Get('tasks')
  tasks(@Req() req: any) {
    return this.svc.getTasks(req.tenantId);
  }

  @Get('tasks/summary')
  summary(@Req() req: any) {
    return this.svc.getTaskSummary(req.tenantId);
  }

  @Get('activity/recent')
  recent(@Query('limit') limit?: string, @Req() req: any) {
    const n = parseInt(limit || '10', 10);
    return this.svc.getRecentActivity(req.tenantId, Number.isFinite(n) ? n : 10);
  }

  @Get('tasks/:taskId/detail')
  taskDetail(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getTaskDetail(req.tenantId, taskId);
  }

  @Get('contacts/:contactId/details')
  contactDetails(@Param('contactId') contactId: string, @Req() req: any) {
    return this.svc.getContactDetails(req.tenantId, contactId);
  }

  @Get('tasks/:taskId/email-draft')
  async emailDraft(@Param('taskId') taskId: string, @Req() req: any) {
    const draft = await this.svc.getEmailDraft(req.tenantId, taskId);
    return draft ?? {};
  }

  @Get('tasks/:taskId/linkedin-draft')
  linkedInDraft(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getLinkedInDraft(req.tenantId, taskId);
  }

  @Get('filters/options')
  filterOptions(@Req() req: any) {
    return this.svc.getFilterOptions(req.tenantId);
  }

  @Get('email-templates')
  emailTemplates(@Req() req: any) {
    return this.svc.getEmailTemplates(req.tenantId);
  }

  // --- Write Endpoints ---

  @Post('tasks')
  createTask(@Body() body: any, @Req() req: any) {
    return this.svc.createTask(req.tenantId, body);
  }

  @Get('tasks/:taskId/notes')
  taskNotes(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getNotes(req.tenantId, taskId);
  }

  @Post('tasks/:taskId/notes')
  saveNotes(@Param('taskId') taskId: string, @Body() body: { notes: string }, @Req() req: any) {
    return this.svc.saveNotes(req.tenantId, taskId, body.notes);
  }

  @Post('tasks/:taskId/send-email')
  sendEmail(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    return this.svc.sendEmail(req.tenantId, taskId, body);
  }

  @Post('tasks/:taskId/save-draft')
  saveDraft(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    return this.svc.saveDraft(req.tenantId, taskId, body);
  }

  @Post('tasks/:taskId/ai-rephrase')
  rephraseEmail(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    return this.svc.rephraseEmail(req.tenantId, taskId, body);
  }

  @Post('tasks/:taskId/mark-complete')
  markComplete(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.markComplete(req.tenantId, taskId);
  }

  @Post('tasks/:taskId/skip')
  skipTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.skipTask(req.tenantId, taskId);
  }

  @Post('tasks/:taskId/dismiss')
  dismissTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.dismissTask(req.tenantId, taskId);
  }

  @Patch('tasks/:taskId/reassign')
  reassignTask(@Param('taskId') taskId: string, @Body() body: { newAssigneeId: string }, @Req() req: any) {
    return this.svc.reassignTask(req.tenantId, taskId, body.newAssigneeId);
  }

  @Patch('tasks/:taskId')
  updateTask(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateTask(req.tenantId, taskId, body);
  }
}
