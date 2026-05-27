import { Controller, Get, Post, Patch, Put, Body, Param, Query, Req, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { M08WorkflowService } from '../services/workflow.service';
import { CreateWorkflowSchema, UpdateWorkflowSchema, SubmitApprovalSchema, UpdateIntegrationSchema } from '../schemas/workflow.schema';

@Controller('api/v1/sales-engagement/workflows')
export class M08WorkflowController {
  constructor(
    @Inject(M08WorkflowService) private readonly workflowService: M08WorkflowService
  ) {}

  private tenantId(req: any) {
    return req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
  }

  private userId(req: any) {
    return req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
  }

  private role(req: any) {
    return req.headers['x-user-role'] || 'representative';
  }

  @Post()
  async createWorkflow(@Body() body: any, @Req() req: any) {
    if (this.role(req) !== 'admin') {
      throw new ForbiddenException('Only administrators can build and configure workflows');
    }
    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: result.error.errors });
    }
    return this.workflowService.createWorkflow(this.tenantId(req), result.data, this.userId(req));
  }

  @Get()
  async getWorkflows(@Req() req: any, @Query('isActive') isActiveStr?: string) {
    const isActive = isActiveStr !== undefined ? isActiveStr === 'true' : undefined;
    return this.workflowService.getWorkflows(this.tenantId(req), isActive);
  }

  @Post('trigger')
  async triggerWorkflowEvent(@Body() body: any, @Req() req: any) {
    const { eventType, payload } = body;
    if (!eventType || !payload) {
      throw new BadRequestException('eventType and payload are required parameters');
    }
    return this.workflowService.triggerWorkflow(this.tenantId(req), eventType, payload);
  }

  @Get('approvals')
  async getApprovals(@Req() req: any, @Query('status') status?: string) {
    return this.workflowService.getApprovals(this.tenantId(req), status);
  }

  @Patch('approvals/:id')
  async submitApproval(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (this.role(req) === 'representative') {
      throw new ForbiddenException('Only managers and administrators can resolve approval steps');
    }
    const result = SubmitApprovalSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: result.error.errors });
    }
    return this.workflowService.submitApproval(this.tenantId(req), id, result.data, this.userId(req));
  }

  @Get('exceptions')
  async getExceptions(@Req() req: any, @Query('resolved') resolvedStr?: string) {
    const resolved = resolvedStr !== undefined ? resolvedStr === 'true' : undefined;
    return this.workflowService.getExceptions(this.tenantId(req), resolved);
  }

  @Patch('exceptions/:id/resolve')
  async resolveException(@Param('id') id: string, @Req() req: any) {
    if (this.role(req) === 'representative') {
      throw new ForbiddenException('Only managers and administrators can resolve execution exceptions');
    }
    return this.workflowService.resolveException(this.tenantId(req), id);
  }

  @Get('integrations')
  async getIntegrations(@Req() req: any) {
    return this.workflowService.getIntegrations(this.tenantId(req));
  }

  @Put('integrations/:provider')
  async updateIntegration(@Param('provider') provider: string, @Body() body: any, @Req() req: any) {
    if (this.role(req) !== 'admin') {
      throw new ForbiddenException('Only administrators can configure provider integrations');
    }
    const result = UpdateIntegrationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: result.error.errors });
    }
    return this.workflowService.updateIntegration(this.tenantId(req), provider, result.data.status, result.data.config);
  }

  @Get('audit-logs')
  async getAuditLogs(@Req() req: any, @Query('workflowId') workflowId?: string) {
    return this.workflowService.getAuditLogs(this.tenantId(req), workflowId);
  }

  @Get(':id/runs')
  async getWorkflowRuns(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.getWorkflowRuns(this.tenantId(req), id);
  }

  @Get(':id')
  async getWorkflowById(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.getWorkflowById(this.tenantId(req), id);
  }

  @Patch(':id')
  async updateWorkflow(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (this.role(req) !== 'admin') {
      throw new ForbiddenException('Only administrators can edit workflows');
    }
    const result = UpdateWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: result.error.errors });
    }
    return this.workflowService.updateWorkflow(this.tenantId(req), id, result.data, this.userId(req));
  }
}
