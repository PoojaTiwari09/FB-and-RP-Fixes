import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M08FrontendEngageService } from './m08-frontend-engage.service';

/** UI bridge: `/api/engage/*` — matches Revenue-Intelligence-UI Engage rep contract. */
@Controller('api/engage')
@UseGuards(TenantGuard)
export class M08FrontendEngageController {
  constructor(private readonly svc: M08FrontendEngageService) {}

  @Get('tasks')
  tasks() {
    return this.svc.getTasks();
  }

  @Get('tasks/summary')
  summary() {
    return this.svc.getTaskSummary();
  }

  @Get('activity/recent')
  recent(@Query('limit') limit?: string) {
    const n = parseInt(limit || '10', 10);
    return this.svc.getRecentActivity(Number.isFinite(n) ? n : 10);
  }

  @Get('tasks/:taskId/detail')
  taskDetail(@Param('taskId') taskId: string) {
    return this.svc.getTaskDetail(taskId);
  }

  @Get('contacts/:contactId/details')
  contactDetails(@Param('contactId') contactId: string) {
    return this.svc.getContactDetails(contactId);
  }

  @Get('tasks/:taskId/email-draft')
  emailDraft(@Param('taskId') taskId: string) {
    return this.svc.getEmailDraft(taskId);
  }

  @Get('tasks/:taskId/linkedin-draft')
  linkedInDraft(@Param('taskId') taskId: string) {
    return this.svc.getLinkedInDraft(taskId);
  }

  @Get('filters/options')
  filterOptions() {
    return this.svc.getFilterOptions();
  }

  @Get('email-templates')
  emailTemplates() {
    return this.svc.getEmailTemplates();
  }
}
