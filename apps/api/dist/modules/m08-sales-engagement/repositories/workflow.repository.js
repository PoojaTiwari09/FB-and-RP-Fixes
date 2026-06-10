"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M08WorkflowRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let M08WorkflowRepository = class M08WorkflowRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWorkflow(tenantId, dto) {
        return this.prisma.workflow.create({
            data: {
                tenantId: tenantId,
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
    async updateWorkflow(tenantId, id, dto) {
        await this.findWorkflowById(tenantId, id);
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
    async findWorkflowById(tenantId, id) {
        const wf = await this.prisma.workflow.findFirst({
            where: { id, tenantId: tenantId },
        });
        if (!wf) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        return wf;
    }
    async findWorkflows(tenantId, filters = {}) {
        const where = { tenantId: tenantId };
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        return this.prisma.workflow.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async createWorkflowRun(tenantId, workflowId, data) {
        const triggerPayload = data.triggerPayload ?? data.variables ?? {};
        return this.prisma.workflowRun.create({
            data: {
                tenantId: tenantId,
                workflowId,
                dealId: data.dealId || null,
                contactId: data.contactId || null,
                status: 'running',
                currentStepIndex: 0,
                triggerPayload,
                variables: data.variables ?? triggerPayload,
                logs: [],
            },
        });
    }
    async updateWorkflowRun(tenantId, id, data) {
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
    async findWorkflowRunById(tenantId, id) {
        const run = await this.prisma.workflowRun.findFirst({
            where: { id, tenantId: tenantId },
        });
        if (!run) {
            throw new common_1.NotFoundException(`Workflow Run with ID ${id} not found`);
        }
        return run;
    }
    async findWorkflowRuns(tenantId, workflowId) {
        const where = { tenantId: tenantId };
        if (workflowId) {
            where.workflowId = workflowId;
        }
        return this.prisma.workflowRun.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async createApproval(tenantId, data) {
        return this.prisma.approval.create({
            data: {
                tenantId: tenantId,
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
    async updateApproval(tenantId, id, data) {
        return this.prisma.approval.update({
            where: { id },
            data: {
                status: data.status,
                ...(data.approverId && { approverId: data.approverId }),
            },
        });
    }
    async findApprovalById(tenantId, id) {
        const app = await this.prisma.approval.findFirst({
            where: { id, tenantId: tenantId },
        });
        if (!app) {
            throw new common_1.NotFoundException(`Approval with ID ${id} not found`);
        }
        return app;
    }
    async findApprovals(tenantId, filters = {}) {
        const where = { tenantId: tenantId };
        if (filters.status) {
            where.status = filters.status;
        }
        return this.prisma.approval.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async logException(tenantId, data) {
        return this.prisma.workflowException.create({
            data: {
                tenantId: tenantId,
                runId: data.runId || null,
                workflowId: data.workflowId || null,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
                stackTrace: data.stackTrace || null,
                resolved: false,
            },
        });
    }
    async resolveException(tenantId, id) {
        return this.prisma.workflowException.update({
            where: { id },
            data: {
                resolved: true,
                resolvedAt: new Date(),
            },
        });
    }
    async findExceptions(tenantId, resolved) {
        const where = { tenantId: tenantId };
        if (resolved !== undefined) {
            where.resolved = resolved;
        }
        return this.prisma.workflowException.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async upsertIntegrationState(tenantId, provider, status, config) {
        const existing = await this.prisma.integrationState.findFirst({
            where: { tenantId: tenantId, provider },
        });
        if (existing) {
            return this.prisma.integrationState.update({
                where: { id: existing.id },
                data: { status, ...(config && { config }) },
            });
        }
        return this.prisma.integrationState.create({
            data: {
                tenantId: tenantId,
                provider,
                status,
                config: config || {},
            },
        });
    }
    async findIntegrationStates(tenantId) {
        return this.prisma.integrationState.findMany({
            where: { tenantId: tenantId },
        });
    }
    async logAction(tenantId, workflowId, userId, action, metadata) {
        return this.prisma.workflowAuditLog.create({
            data: {
                tenantId: tenantId,
                workflowId,
                userId,
                action,
                metadata: metadata || {},
            },
        });
    }
    async findAuditLogs(tenantId, workflowId) {
        const where = { tenantId: tenantId };
        if (workflowId) {
            where.workflowId = workflowId;
        }
        return this.prisma.workflowAuditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.M08WorkflowRepository = M08WorkflowRepository;
exports.M08WorkflowRepository = M08WorkflowRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M08WorkflowRepository);
//# sourceMappingURL=workflow.repository.js.map