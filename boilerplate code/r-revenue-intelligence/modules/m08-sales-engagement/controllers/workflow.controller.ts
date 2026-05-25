import { Controller, Get, Post, Patch, Put, Body, Param, Query, Req, UseGuards, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { M08WorkflowService } from '../services/workflow.service';
import { CreateWorkflowSchema, UpdateWorkflowSchema, SubmitApprovalSchema, UpdateIntegrationSchema } from '../schemas/workflow.schema';

@Controller('api/v1/m08-sales-engagement/workflows')
export class M08WorkflowController {
  constructor(
    @Inject(M08WorkflowService) private readonly workflowService: M08WorkflowService
  ) {}

  @Post()
  async createWorkflow(@Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    // RBAC: Only Admin can create workflows
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can build and configure workflows');
    }

    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    return this.workflowService.createWorkflow(tenantId, result.data, currentUserId);
  }

  @Patch(':id')
  async updateWorkflow(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    // RBAC: Only Admin can update workflows
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can edit workflows');
    }

    const result = UpdateWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    return this.workflowService.updateWorkflow(tenantId, id, result.data, currentUserId);
  }

  @Get()
  async getWorkflows(@Req() req: any, @Query('isActive') isActiveStr?: string) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const isActive = isActiveStr !== undefined ? isActiveStr === 'true' : undefined;

    return this.workflowService.getWorkflows(tenantId, isActive);
  }

  @Get(':id')
  async getWorkflowById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    return this.workflowService.getWorkflowById(tenantId, id);
  }

  // --- MANUAL EVENT TRIGGER SIMULATION ---

  @Post('trigger')
  async triggerWorkflowEvent(@Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const { eventType, payload } = body;

    if (!eventType || !payload) {
      throw new BadRequestException('eventType and payload are required parameters');
    }

    return this.workflowService.triggerWorkflow(tenantId, eventType, payload);
  }

  // --- APPROVAL ROUTING APIs ---

  @Get('approvals')
  async getApprovals(@Req() req: any, @Query('status') status?: string) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    return this.workflowService.getApprovals(tenantId, status);
  }

  @Patch('approvals/:id')
  async submitApproval(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    // RBAC: Representatives cannot resolve approvals
    if (userRole === 'representative') {
      throw new ForbiddenException('Only managers and administrators can resolve approval steps');
    }

    const result = SubmitApprovalSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    return this.workflowService.submitApproval(tenantId, id, result.data, currentUserId);
  }

  // --- EXCEPTIONS MONITORING APIs ---

  @Get('exceptions')
  async getExceptions(@Req() req: any, @Query('resolved') resolvedStr?: string) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const resolved = resolvedStr !== undefined ? resolvedStr === 'true' : undefined;

    return this.workflowService.getExceptions(tenantId, resolved);
  }

  @Patch('exceptions/:id/resolve')
  async resolveException(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';

    if (userRole === 'representative') {
      throw new ForbiddenException('Only managers and administrators can resolve execution exceptions');
    }

    return this.workflowService.resolveException(tenantId, id);
  }

  // --- INTEGRATIONS APIs ---

  @Get('integrations')
  async getIntegrations(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    return this.workflowService.getIntegrations(tenantId);
  }

  @Put('integrations/:provider')
  async updateIntegration(@Param('provider') provider: string, @Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';

    if (userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can configure provider integrations');
    }

    const result = UpdateIntegrationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    return this.workflowService.updateIntegration(tenantId, provider, result.data.status, result.data.config);
  }

  // --- AUDIT TRAIL APIs ---

  @Get('audit-logs')
  async getAuditLogs(@Req() req: any, @Query('workflowId') workflowId?: string) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    return this.workflowService.getAuditLogs(tenantId, workflowId);
  }
}
