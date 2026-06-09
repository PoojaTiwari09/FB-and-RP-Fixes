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
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    const userId = req.userId || req.headers['x-user-id'];
    return this.svc.getTasks(req.tenantId, userId, userRole);
  }

  @Get('tasks/summary')
  summary(@Req() req: any) {
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    const userId = req.userId || req.headers['x-user-id'];
    return this.svc.getTaskSummary(req.tenantId, userId, userRole);
  }

  @Get('activity/recent')
  recent(@Req() req: any, @Query('limit') limit?: string) {
    const n = parseInt(limit || '10', 10);
    const userId = req.userId;
    const userRole = req.userRole;
    return this.svc.getRecentActivity(req.tenantId, Number.isFinite(n) ? n : 10, userId, userRole);
  }

  @Get('tasks/:taskId/detail')
  taskDetail(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getTaskDetail(req.tenantId, taskId, req.userId, req.userRole);
  }

  @Get('contacts/:contactId/details')
  contactDetails(@Param('contactId') contactId: string, @Req() req: any) {
    return this.svc.getContactDetails(req.tenantId, contactId, req.userId, req.userRole);
  }

  @Get('tasks/:taskId/email-draft')
  emailDraft(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getEmailDraft(req.tenantId, taskId, req.userId, req.userRole);
  }

  @Get('tasks/:taskId/notes')
  getNotes(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getNotes(req.tenantId, taskId, req.userId, req.userRole);
  }

  @Get('tasks/:taskId/linkedin-draft')
  linkedInDraft(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getLinkedInDraft(req.tenantId, taskId, req.userId, req.userRole);
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
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.createTask(req.tenantId, body, userId, userRole);
  }

  @Post('tasks/:taskId/notes')
  saveNotes(@Param('taskId') taskId: string, @Body() body: { notes: string }, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.saveNotes(req.tenantId, taskId, body.notes, userId, userRole);
  }

  @Post('tasks/:taskId/send-email')
  sendEmail(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.sendEmail(req.tenantId, taskId, body, userId, userRole);
  }

  @Post('tasks/:taskId/save-draft')
  saveDraft(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.saveDraft(req.tenantId, taskId, body, userId, userRole);
  }

  @Post('tasks/:taskId/ai-rephrase')
  rephraseEmail(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.rephraseEmail(req.tenantId, taskId, body, userId, userRole);
  }

  @Post('tasks/:taskId/mark-complete')
  markComplete(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.markComplete(req.tenantId, taskId, userId, userRole);
  }

  @Post('tasks/:taskId/skip')
  skipTask(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.skipTask(req.tenantId, taskId, userId, userRole);
  }

  @Post('tasks/:taskId/dismiss')
  dismissTask(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.dismissTask(req.tenantId, taskId, userId, userRole);
  }

  @Patch('tasks/:taskId/reassign')
  reassignTask(@Param('taskId') taskId: string, @Body() body: { newAssigneeId: string }, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.reassignTask(req.tenantId, taskId, body.newAssigneeId, userId, userRole);
  }

  @Patch('tasks/:taskId')
  updateTask(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.headers['x-user-id'];
    const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
    return this.svc.updateTask(req.tenantId, taskId, body, userId, userRole);
  }
}
