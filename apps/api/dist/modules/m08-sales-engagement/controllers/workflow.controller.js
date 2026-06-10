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
exports.M08WorkflowController = void 0;
const common_1 = require("@nestjs/common");
const workflow_service_1 = require("../services/workflow.service");
const workflow_schema_1 = require("../schemas/workflow.schema");
let M08WorkflowController = class M08WorkflowController {
    workflowService;
    constructor(workflowService) {
        this.workflowService = workflowService;
    }
    tenantId(req) {
        return req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    }
    userId(req) {
        return req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    }
    role(req) {
        return req.headers['x-user-role'] || 'representative';
    }
    async createWorkflow(body, req) {
        if (this.role(req) !== 'admin') {
            throw new common_1.ForbiddenException('Only administrators can build and configure workflows');
        }
        const result = workflow_schema_1.CreateWorkflowSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({ message: 'Validation failed', errors: result.error.errors });
        }
        return this.workflowService.createWorkflow(this.tenantId(req), result.data, this.userId(req));
    }
    async getWorkflows(req, isActiveStr) {
        const isActive = isActiveStr !== undefined ? isActiveStr === 'true' : undefined;
        return this.workflowService.getWorkflows(this.tenantId(req), isActive);
    }
    async triggerWorkflowEvent(body, req) {
        const { eventType, payload } = body;
        if (!eventType || !payload) {
            throw new common_1.BadRequestException('eventType and payload are required parameters');
        }
        return this.workflowService.triggerWorkflow(this.tenantId(req), eventType, payload);
    }
    async getApprovals(req, status) {
        return this.workflowService.getApprovals(this.tenantId(req), status);
    }
    async submitApproval(id, body, req) {
        if (this.role(req) === 'representative') {
            throw new common_1.ForbiddenException('Only managers and administrators can resolve approval steps');
        }
        const result = workflow_schema_1.SubmitApprovalSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({ message: 'Validation failed', errors: result.error.errors });
        }
        return this.workflowService.submitApproval(this.tenantId(req), id, result.data, this.userId(req));
    }
    async getExceptions(req, resolvedStr) {
        const resolved = resolvedStr !== undefined ? resolvedStr === 'true' : undefined;
        return this.workflowService.getExceptions(this.tenantId(req), resolved);
    }
    async resolveException(id, req) {
        if (this.role(req) === 'representative') {
            throw new common_1.ForbiddenException('Only managers and administrators can resolve execution exceptions');
        }
        return this.workflowService.resolveException(this.tenantId(req), id);
    }
    async getIntegrations(req) {
        return this.workflowService.getIntegrations(this.tenantId(req));
    }
    async updateIntegration(provider, body, req) {
        if (this.role(req) !== 'admin') {
            throw new common_1.ForbiddenException('Only administrators can configure provider integrations');
        }
        const result = workflow_schema_1.UpdateIntegrationSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({ message: 'Validation failed', errors: result.error.errors });
        }
        return this.workflowService.updateIntegration(this.tenantId(req), provider, result.data.status, result.data.config);
    }
    async getAuditLogs(req, workflowId) {
        return this.workflowService.getAuditLogs(this.tenantId(req), workflowId);
    }
    async getWorkflowRuns(id, req) {
        return this.workflowService.getWorkflowRuns(this.tenantId(req), id);
    }
    async getWorkflowById(id, req) {
        return this.workflowService.getWorkflowById(this.tenantId(req), id);
    }
    async updateWorkflow(id, body, req) {
        if (this.role(req) !== 'admin') {
            throw new common_1.ForbiddenException('Only administrators can edit workflows');
        }
        const result = workflow_schema_1.UpdateWorkflowSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({ message: 'Validation failed', errors: result.error.errors });
        }
        return this.workflowService.updateWorkflow(this.tenantId(req), id, result.data, this.userId(req));
    }
};
exports.M08WorkflowController = M08WorkflowController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "createWorkflow", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getWorkflows", null);
__decorate([
    (0, common_1.Post)('trigger'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "triggerWorkflowEvent", null);
__decorate([
    (0, common_1.Get)('approvals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getApprovals", null);
__decorate([
    (0, common_1.Patch)('approvals/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "submitApproval", null);
__decorate([
    (0, common_1.Get)('exceptions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('resolved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getExceptions", null);
__decorate([
    (0, common_1.Patch)('exceptions/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "resolveException", null);
__decorate([
    (0, common_1.Get)('integrations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getIntegrations", null);
__decorate([
    (0, common_1.Put)('integrations/:provider'),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "updateIntegration", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)(':id/runs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getWorkflowRuns", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "getWorkflowById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08WorkflowController.prototype, "updateWorkflow", null);
exports.M08WorkflowController = M08WorkflowController = __decorate([
    (0, common_1.Controller)('api/v1/sales-engagement/workflows'),
    __param(0, (0, common_1.Inject)(workflow_service_1.M08WorkflowService)),
    __metadata("design:paramtypes", [workflow_service_1.M08WorkflowService])
], M08WorkflowController);
//# sourceMappingURL=workflow.controller.js.map