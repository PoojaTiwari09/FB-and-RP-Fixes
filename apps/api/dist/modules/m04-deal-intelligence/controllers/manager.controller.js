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
var ManagerController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../platform-core/decorators/roles.decorator");
const prisma_service_1 = require("../database/prisma.service");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
let ManagerController = ManagerController_1 = class ManagerController {
    prisma;
    async getManagerPipeline(req) {
        try {
            const deals = await this.prisma.deal.findMany({
                where: { tenantid: req.tenantId }
            });
            const pipelineValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            return { success: true, data: { pipelineValue, deals }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get manager pipeline: ${error.message}`);
            return { success: false, error: error.message, isMock: false };
        }
    }
    async getManagerAlerts(req) {
        try {
            const deals = await this.prisma.deal.findMany({ where: { tenantid: req.tenantId } });
            const dealIds = deals.map(d => d.id);
            const warnings = await this.prisma.dealWarning.findMany({
                where: { dealId: { in: dealIds }, status: 'active' }
            });
            return { success: true, data: warnings, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get manager alerts: ${error.message}`);
            return { success: false, error: error.message, isMock: false };
        }
    }
    async addManagerNote(dealId, body, req) {
        try {
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data: { nextStep: body.text }
            });
            return { success: true, data: { dealId, note: updated.nextStep }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to add manager note: ${error.message}`);
            return { success: false, error: error.message, isMock: false };
        }
    }
    async approveNextStep(dealId, stepId, req) {
        try {
            const updated = await this.prisma.dealPlaybook.update({
                where: { id: stepId },
                data: { status: 'Approved' }
            });
            return { success: true, data: { dealId, stepId, status: updated.status }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to approve step: ${error.message}`);
            return { success: false, error: error.message, isMock: false };
        }
    }
    async updateManagerForecast(dealId, body, req) {
        try {
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data: { forecastCategory: body.forecastCategory || body.category }
            });
            return { success: true, data: { dealId, forecastCategory: updated.forecastCategory }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to update forecast: ${error.message}`);
            return { success: false, error: error.message, isMock: false };
        }
    }
    logger = new common_1.Logger(ManagerController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateManagerNextStep(dealId, stepId, body, req) {
        try {
            this.logger.log(`Updating manager next step for deal ${dealId}, step ${stepId}`);
            const criterion = await this.prisma.dealPlaybook.findFirst({
                where: { id: stepId, tenantid: req.tenantId }
            });
            if (criterion) {
                const updated = await this.prisma.dealPlaybook.update({
                    where: { id: stepId },
                    data: {
                        notes: body.notes || body.comment,
                        status: body.status || 'Completed'
                    }
                });
                return { success: true, message: 'Next step playbook criterion updated', data: updated };
            }
            const updatedDeal = await this.prisma.deal.update({
                where: { id: dealId },
                data: { nextStep: body.notes || body.comment || '' }
            });
            return { success: true, message: 'Deal next steps updated', data: updatedDeal };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to update manager next steps: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async getManagerTasks(req) {
        try {
            const tasks = await this.prisma.dealTask.findMany({
                where: { tenantid: req.tenantId },
            });
            return { success: true, data: tasks, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get manager tasks: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async getTeamMembers(req) {
        try {
            const deals = await this.prisma.deal.findMany({
                where: { tenantid: req.tenantId },
                select: { ownerName: true, ownerEmail: true, ownerId: true },
                distinct: ['ownerEmail']
            });
            const team = deals.map((d, idx) => ({
                id: d.ownerId || `rep-${idx}`,
                name: d.ownerName || 'Unknown Rep',
                email: d.ownerEmail || 'rep@company.com',
                role: 'SALES_REP'
            }));
            return { success: true, data: team, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get team members: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async getDealStages() {
        return {
            success: true,
            data: [
                { id: 'Qualification', name: 'Qualification', order: 1 },
                { id: 'Discovery', name: 'Discovery', order: 2 },
                { id: 'Proposal', name: 'Proposal', order: 3 },
                { id: 'Negotiation', name: 'Negotiation', order: 4 },
                { id: 'Closed Won', name: 'Closed Won', order: 5 },
                { id: 'Closed Lost', name: 'Closed Lost', order: 6 },
            ],
            isMock: false
        };
    }
    async exportDeals(req) {
        try {
            const deals = await this.prisma.deal.findMany({
                where: { tenantid: req.tenantId },
                orderBy: { name: 'asc' },
            });
            return { success: true, data: deals, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to export deals: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
};
exports.ManagerController = ManagerController;
__decorate([
    (0, common_1.Get)('pipeline'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "getManagerPipeline", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "getManagerAlerts", null);
__decorate([
    (0, common_1.Post)('deals/:dealId/notes'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "addManagerNote", null);
__decorate([
    (0, common_1.Post)('deals/:dealId/steps/:stepId/approve'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('stepId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "approveNextStep", null);
__decorate([
    (0, common_1.Patch)('deals/:dealId/forecast'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "updateManagerForecast", null);
__decorate([
    (0, common_1.Patch)('deals/:dealId/playbook/next-steps/:stepId'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('stepId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "updateManagerNextStep", null);
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "getManagerTasks", null);
__decorate([
    (0, common_1.Get)('team-members'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "getTeamMembers", null);
__decorate([
    (0, common_1.Get)('deal-stages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "getDealStages", null);
__decorate([
    (0, common_1.Get)('deals/export'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "exportDeals", null);
exports.ManagerController = ManagerController = ManagerController_1 = __decorate([
    (0, swagger_1.ApiTags)('Manager'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/manager'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'EXECUTIVE'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ManagerController);
//# sourceMappingURL=manager.controller.js.map