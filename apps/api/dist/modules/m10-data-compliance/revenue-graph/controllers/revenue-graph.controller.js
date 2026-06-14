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
var RevenueGraphController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueGraphController = void 0;
const common_1 = require("@nestjs/common");
const revenue_graph_service_1 = require("../services/revenue-graph.service");
const jwt_guard_1 = require("../../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../../platform-core/guards/tenant.guard");
const m10_dev_auth_guard_1 = require("../../guards/m10-dev-auth.guard");
const M10AuthGuard = process.env.M10_STANDALONE_AUTH === "true" ? m10_dev_auth_guard_1.M10DevAuthGuard : jwt_guard_1.JwtAuthGuard;
const revenue_graph_schema_1 = require("../schemas/revenue-graph.schema");
let RevenueGraphController = RevenueGraphController_1 = class RevenueGraphController {
    service;
    logger = new common_1.Logger(RevenueGraphController_1.name);
    constructor(service) {
        this.service = service;
    }
    async getAccounts(req, page, limit, search) {
        this.logger.debug(`GET accounts — tenant=${req.tenantId}`);
        return this.service.getAccounts(req.tenantId, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
        });
    }
    async getAccountById(req, id) {
        this.logger.debug(`GET account/${id} — tenant=${req.tenantId}`);
        return this.service.getAccountById(req.tenantId, id);
    }
    async getDeals(req, accountId, isActive, stage, page, limit) {
        this.logger.debug(`GET deals — tenant=${req.tenantId}`);
        return this.service.getDeals(req.tenantId, {
            accountId,
            isActive: isActive !== undefined ? isActive === "true" : undefined,
            stage,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async getDealById(req, id) {
        return this.service.getDealById(req.tenantId, id);
    }
    async getDealRelationship(req, id) {
        this.logger.debug(`GET deals/${id}/relationship — tenant=${req.tenantId}`);
        return this.service.getDealRelationship(req.tenantId, id);
    }
    async getContactById(req, id) {
        return this.service.getContactById(req.tenantId, id);
    }
    async triggerCrmSync(req, body) {
        const parsed = revenue_graph_schema_1.TriggerCrmSyncSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        this.logger.log(`POST crm-sync — tenant=${req.tenantId}, source=${parsed.data.crmSource}`);
        return this.service.triggerCrmSync(req.tenantId, parsed.data.crmSource, parsed.data.entityTypes);
    }
    async getCrmSyncStatus(req) {
        return this.service.getCrmSyncStatus(req.tenantId);
    }
};
exports.RevenueGraphController = RevenueGraphController;
__decorate([
    (0, common_1.Get)("accounts"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Get)("accounts/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getAccountById", null);
__decorate([
    (0, common_1.Get)("deals"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("accountId")),
    __param(2, (0, common_1.Query)("isActive")),
    __param(3, (0, common_1.Query)("stage")),
    __param(4, (0, common_1.Query)("page")),
    __param(5, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getDeals", null);
__decorate([
    (0, common_1.Get)("deals/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getDealById", null);
__decorate([
    (0, common_1.Get)("deals/:id/relationship"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getDealRelationship", null);
__decorate([
    (0, common_1.Get)("contacts/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getContactById", null);
__decorate([
    (0, common_1.Post)("crm-sync"),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "triggerCrmSync", null);
__decorate([
    (0, common_1.Get)("crm-sync-status"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueGraphController.prototype, "getCrmSyncStatus", null);
exports.RevenueGraphController = RevenueGraphController = RevenueGraphController_1 = __decorate([
    (0, common_1.Controller)("api/v1/m10-data-compliance"),
    (0, common_1.UseGuards)(M10AuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [revenue_graph_service_1.RevenueGraphService])
], RevenueGraphController);
//# sourceMappingURL=revenue-graph.controller.js.map