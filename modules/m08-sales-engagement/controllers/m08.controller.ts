import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M08SalesEngagementService } from '../services/m08.service';
import { 
  CreatePlaySchema, 
  UpdatePlaySchema, 
  ClonePlaySchema, 
  DeactivatePlaySchema, 
  EnrollPlaySchema, 
  CompleteStepSchema, 
  SkipStepSchema, 
  CreateNoteSchema 
} from '../schemas/m08.schema';

@Controller('api/v1/sales-engagement')
@UseGuards(TenantGuard)
export class M08SalesEngagementController {
  constructor(
    private readonly service: M08SalesEngagementService
  ) {}

  // --- PLAY lifecycle & MANAGEMENT ---

  @Get('plays')
  async getPlays(@Req() req: any) {
    return this.service.getPlays(req.tenantId);
  }

  @Get('plays/:id')
  async getPlayById(@Param('id') id: string, @Req() req: any) {
    return this.service.getPlayById(req.tenantId, id);
  }

  @Post('plays')
  async createPlay(@Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = CreatePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.createPlay(result.data, req.tenantId, userId);
  }

  @Patch('plays/:id')
  async updatePlay(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = UpdatePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return this.service.updatePlay(id, result.data, req.tenantId);
  }

  @Post('plays/clone')
  async clonePlay(@Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = ClonePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.clonePlay(result.data.playId, req.tenantId, userId);
  }

  @Post('plays/deactivate')
  async deactivatePlay(@Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = DeactivatePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return this.service.deactivatePlay(result.data.playId, req.tenantId);
  }

  // --- PLAY ENROLLMENT ENGINE ---

  @Post('enrollments')
  async enrollOpportunity(@Body() body: any, @Req() req: any) {
    const result = EnrollPlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return this.service.enrollOpportunity(result.data, req.tenantId);
  }

  @Get('enrollments')
  async getEnrollments(@Query() query: any, @Req() req: any) {
    const filters = {
      userId: query.userId,
      dealId: query.dealId,
      status: query.status,
    };
    return this.service.getEnrollments(req.tenantId, filters);
  }

  @Get('enrollments/:id')
  async getEnrollmentById(@Param('id') id: string, @Req() req: any) {
    return this.service.getEnrollmentById(req.tenantId, id);
  }

  // --- PLAY STEP ACTIONS ---

  @Patch('enrollments/:id/step')
  async completeStep(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const result = CompleteStepSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.completeStep(id, result.data, req.tenantId, userId);
  }

  @Post('enrollments/:id/skip')
  async skipStep(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const result = SkipStepSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.skipStep(id, result.data, req.tenantId, userId);
  }

  @Post('enrollments/:id/note')
  async addNote(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const result = CreateNoteSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.addNote(id, result.data, req.tenantId, userId);
  }

  // --- ANALYTICS DASHBOARDS ---

  @Get('dashboard/adoption')
  async getAdoptionDashboard(@Req() req: any) {
    this.enforceRole(req, ['manager', 'admin']);
    return this.service.getAdoptionDashboard(req.tenantId);
  }

  @Get('dashboard/rep')
  async getRepDashboard(@Req() req: any) {
    this.enforceRole(req, ['manager', 'admin']);
    return this.service.getRepDashboard(req.tenantId);
  }

  @Get('dashboard/play')
  async getPlayDashboard(@Req() req: any) {
    this.enforceRole(req, ['manager', 'admin']);
    return this.service.getPlayDashboard(req.tenantId);
  }

  
  // --- BFF TASKS API ---

  @Get('manager/tasks')
  async tasks(@Req() req: any, @Query() query: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.fetchManagerTasks(req.tenantId, query, userId, userRole);
  }

  @Get('manager/tasks/summary')
  async summary(@Req() req: any, @Query('assigneeId') assigneeId = 'me', @Query('date') date?: string) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    const today = new Date().toISOString().split('T')[0];
    return this.service.fetchSummary(req.tenantId, assigneeId, date || today, userId, userRole);
  }

  @Get('manager/tasks/filters-config')
  async filtersConfig(@Req() req: any) {
    return this.service.fetchFiltersConfig(req.tenantId);
  }

  @Get('manager/team/members')
  async teamMembers(@Req() req: any) {
    return this.service.fetchTeamMembers(req.tenantId);
  }

  @Get('manager/search/linked-to')
  async searchLinkedEntities(@Req() req: any, @Query('search') search = '') {
    return this.service.searchLinkedEntities(req.tenantId, search);
  }

  @Get('manager/email-templates')
  async emailTemplates(@Req() req: any) {
    return this.service.emailTemplates(req.tenantId);
  }

  @Get('manager/activities/recent')
  async recentActivities(@Req() req: any) {
    return this.service.fetchRecentActivities(req.tenantId);
  }

  // --- REP VIEW ENDPOINTS ---

  @Get('tasks')
  async getTasks(@Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.fetchRepTasks(req.tenantId, userId, userRole);
  }

  @Get('tasks/summary')
  async getSummary(@Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.fetchRepSummary(req.tenantId, userId, userRole);
  }

  @Get('activity/recent')
  async getRecentActivity(@Req() req: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const activities = await this.service.fetchRecentActivities(req.tenantId);
    return activities.slice(0, isNaN(limitNum) ? 10 : limitNum);
  }

  @Get('tasks/:taskId/detail')
  async getTaskDetail(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.fetchTaskDetail(req.tenantId, taskId, userId, userRole);
  }

  @Get('contacts/:contactId/details')
  async getContactDetails(@Param('contactId') contactId: string, @Req() req: any) {
    return this.service.fetchContactDetail(req.tenantId, contactId);
  }

  @Get('tasks/:taskId/email-draft')
  async getEmailDraft(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.fetchEmailDraft(req.tenantId, taskId, userId, userRole);
  }

  @Get('tasks/:taskId/notes')
  async getNotes(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    const t = await this.service.validateTaskAccess(req.tenantId, taskId, userId, userRole);
    return t.notes ? [{
      noteId: 'note-001',
      id: 'note-001',
      note: t.notes,
      noteText: t.notes,
      authorName: t.assigneeName || 'Alex Morgan',
      createdAt: t.updatedAt?.toISOString() || new Date().toISOString(),
      timestamp: t.updatedAt?.toISOString() || new Date().toISOString(),
    }] : [];
  }

  @Get('tasks/:taskId/linkedin-draft')
  async getLinkedInDraft(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.fetchLinkedInScript(req.tenantId, taskId, userId, userRole);
  }

  @Get('filters/options')
  async getFilterOptions(@Req() req: any) {
    return this.service.fetchFilterOptions(req.tenantId);
  }

  @Get('email-templates')
  async getEmailTemplates(@Req() req: any) {
    const res = await this.service.emailTemplates(req.tenantId);
    return res.templates;
  }

  // --- REP WRITE ENDPOINTS ---

  @Post('tasks')
  async createTask(@Body() body: any, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.createEngageTask(req.tenantId, body, userId, userRole);
  }

  @Post('tasks/:taskId/notes')
  async saveNotes(@Param('taskId') taskId: string, @Body() body: { notes: string }, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.saveNotes(req.tenantId, taskId, body.notes, userId, userRole);
  }

  @Post('tasks/:taskId/send-email')
  async sendEmail(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.sendEmail(req.tenantId, taskId, body, userId, userRole);
  }

  @Post('tasks/:taskId/save-draft')
  async saveDraft(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.saveDraft(req.tenantId, taskId, body, userId, userRole);
  }

  @Post('tasks/:taskId/ai-rephrase')
  async rephraseEmail(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.rephraseEmail(req.tenantId, taskId, body, userId, userRole);
  }

  @Post('tasks/:taskId/mark-complete')
  async markComplete(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.markComplete(req.tenantId, taskId, userId, userRole);
  }

  @Post('tasks/:taskId/skip')
  async skipTask(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.skipTask(req.tenantId, taskId, userId, userRole);
  }

  @Post('tasks/:taskId/dismiss')
  async dismissTask(@Param('taskId') taskId: string, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.dismissTask(req.tenantId, taskId, userId, userRole);
  }

  @Patch('tasks/:taskId/reassign')
  async reassignTask(@Param('taskId') taskId: string, @Body() body: { newAssigneeId: string; scope?: string; reason?: string }, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.reassignEngageTask(req.tenantId, taskId, body.newAssigneeId, userId, userRole, body.scope, body.reason);
  }

  @Patch('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() body: any, @Req() req: any) {
    const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
    return this.service.updateEngageTask(req.tenantId, taskId, body, userId, userRole);
  }

  @Get('users/assignable')
  async assignableUsers(@Req() req: any) {
    const userId = req.userId || req.user?.id || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.fetchAssignableUsers(req.tenantId, userId);
  }

  private enforceRole(req: any, allowedRoles: string[]) {
    const role = req.userRole || req.user?.role || req.headers['x-user-role'] || 'representative';
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    if (normalizedAllowed.includes('manager')) {
      normalizedAllowed.push('sales_manager');
    }
    if (!normalizedAllowed.includes(role.toLowerCase())) {
      throw new ForbiddenException(`Access denied. Role '${role}' does not have sufficient permissions to perform this action.`);
    }
  }
}
