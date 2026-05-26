import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../schemas/workflow.schema';

@Injectable()
export class M08WorkflowRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  // --- WORKFLOW CRUD ---

  async createWorkflow(tenantId: string, dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        triggerType: dto.triggerType,
        triggerConditions: dto.triggerConditions || {},
        definition: dto.definition || {},
        version: dto.version,
        isActive: dto.isActive,
      },
    });
  }

  async updateWorkflow(tenantId: string, id: string, dto: UpdateWorkflowDto) {
    await this.findWorkflowById(tenantId, id); // check existence

    return this.prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.triggerType && { triggerType: dto.triggerType }),
        ...(dto.triggerConditions && { triggerConditions: dto.triggerConditions }),
        ...(dto.definition && { definition: dto.definition }),
        ...(dto.version && { version: dto.version }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async findWorkflowById(tenantId: string, id: string) {
    const wf = await this.prisma.workflow.findFirst({
      where: { id, tenantId },
    });
    if (!wf) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return wf;
  }

  async findWorkflows(tenantId: string, filters: { isActive?: boolean } = {}) {
    const where: any = { tenantId };
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    return this.prisma.workflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- WORKFLOW RUNS ---

  async createWorkflowRun(tenantId: string, workflowId: string, data: { dealId?: string; contactId?: string; variables: any }) {
    return this.prisma.workflowRun.create({
      data: {
        tenantId,
        workflowId,
        dealId: data.dealId || null,
        contactId: data.contactId || null,
        status: 'running',
        currentStepIndex: 0,
        variables: data.variables || {},
        logs: [],
      },
    });
  }

  async updateWorkflowRun(tenantId: string, id: string, data: { status?: string; currentStepIndex?: number; logs?: any; variables?: any }) {
    return this.prisma.workflowRun.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.currentStepIndex !== undefined && { currentStepIndex: data.currentStepIndex }),
        ...(data.logs && { logs: data.logs }),
        ...(data.variables && { variables: data.variables }),
      },
    });
  }

  async findWorkflowRunById(tenantId: string, id: string) {
    const run = await this.prisma.workflowRun.findFirst({
      where: { id, tenantId },
    });
    if (!run) {
      throw new NotFoundException(`Workflow Run with ID ${id} not found`);
    }
    return run;
  }

  async findWorkflowRuns(tenantId: string, workflowId?: string) {
    const where: any = { tenantId };
    if (workflowId) {
      where.workflowId = workflowId;
    }
    return this.prisma.workflowRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- APPROVALS ---

  async createApproval(tenantId: string, data: { runId?: string; workflowId?: string; type: string; title: string; description: string; thresholdDetails?: any; approverId?: string }) {
    return this.prisma.approval.create({
      data: {
        tenantId,
        runId: data.runId || null,
        workflowId: data.workflowId || null,
        type: data.type,
        title: data.title,
        description: data.description,
        status: 'pending',
        thresholdDetails: data.thresholdDetails || {},
        approverId: data.approverId || null,
      },
    });
  }

  async updateApproval(tenantId: string, id: string, data: { status: string; approverId?: string }) {
    return this.prisma.approval.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.approverId && { approverId: data.approverId }),
      },
    });
  }

  async findApprovalById(tenantId: string, id: string) {
    const app = await this.prisma.approval.findFirst({
      where: { id, tenantId },
    });
    if (!app) {
      throw new NotFoundException(`Approval with ID ${id} not found`);
    }
    return app;
  }

  async findApprovals(tenantId: string, filters: { status?: string } = {}) {
    const where: any = { tenantId };
    if (filters.status) {
      where.status = filters.status;
    }
    return this.prisma.approval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- EXCEPTIONS ---

  async logException(tenantId: string, data: { runId?: string; workflowId?: string; errorCode: string; errorMessage: string; stackTrace?: string }) {
    return this.prisma.workflowException.create({
      data: {
        tenantId,
        runId: data.runId || null,
        workflowId: data.workflowId || null,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        stackTrace: data.stackTrace || null,
        resolved: false,
      },
    });
  }

  async resolveException(tenantId: string, id: string) {
    return this.prisma.workflowException.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async findExceptions(tenantId: string, resolved?: boolean) {
    const where: any = { tenantId };
    if (resolved !== undefined) {
      where.resolved = resolved;
    }
    return this.prisma.workflowException.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- INTEGRATION STATES ---

  async upsertIntegrationState(tenantId: string, provider: string, status: string, config?: any) {
    const existing = await this.prisma.integrationState.findFirst({
      where: { tenantId, provider },
    });

    if (existing) {
      return this.prisma.integrationState.update({
        where: { id: existing.id },
        data: { status, ...(config && { config }) },
      });
    }

    return this.prisma.integrationState.create({
      data: {
        tenantId,
        provider,
        status,
        config: config || {},
      },
    });
  }

  async findIntegrationStates(tenantId: string) {
    return this.prisma.integrationState.findMany({
      where: { tenantId },
    });
  }

  // --- AUDIT LOGGING ---

  async logAction(tenantId: string, workflowId: string | null, userId: string | null, action: string, metadata?: any) {
    return this.prisma.workflowAuditLog.create({
      data: {
        tenantId,
        workflowId,
        userId,
        action,
        metadata: metadata || {},
      },
    });
  }

  async findAuditLogs(tenantId: string, workflowId?: string) {
    const where: any = { tenantId };
    if (workflowId) {
      where.workflowId = workflowId;
    }
    return this.prisma.workflowAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
