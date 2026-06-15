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
var ComplianceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const compliance_service_1 = require("../services/compliance.service");
const jwt_guard_1 = require("../../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../../platform-core/guards/tenant.guard");
const m10_dev_auth_guard_1 = require("../../guards/m10-dev-auth.guard");
const compliance_schema_1 = require("../schemas/compliance.schema");
const M10AuthGuard = process.env.M10_STANDALONE_AUTH === "true" ? m10_dev_auth_guard_1.M10DevAuthGuard : jwt_guard_1.JwtAuthGuard;
let ComplianceController = ComplianceController_1 = class ComplianceController {
    service;
    logger = new common_1.Logger(ComplianceController_1.name);
    constructor(service) {
        this.service = service;
    }
    async createPolicy(req, body) {
        const parsed = compliance_schema_1.CreatePolicySchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        this.logger.log(`POST /policies — tenant=${req.tenantId} channel=${parsed.data.channel}`);
        return this.service.createPolicy(req.tenantId, parsed.data, req.user?.userId);
    }
    async getPolicies(req, activeOnly) {
        this.logger.debug(`GET /policies — tenant=${req.tenantId}`);
        return this.service.getPolicies(req.tenantId, activeOnly === "true");
    }
    async getPolicyById(req, id) {
        this.logger.debug(`GET /policies/${id} — tenant=${req.tenantId}`);
        return this.service.getPolicyById(req.tenantId, id);
    }
    async updatePolicy(req, id, body) {
        const parsed = compliance_schema_1.UpdatePolicySchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        this.logger.log(`PATCH /policies/${id} — tenant=${req.tenantId}`);
        return this.service.updatePolicy(req.tenantId, id, parsed.data);
    }
    async deactivatePolicy(req, id) {
        this.logger.log(`DELETE /policies/${id} — tenant=${req.tenantId} (deactivating)`);
        return this.service.deactivatePolicy(req.tenantId, id);
    }
    async upsertOptOut(req, body) {
        const parsed = compliance_schema_1.UpsertOptOutSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        return this.service.upsertOptOut(req.tenantId, parsed.data);
    }
    async getOptOuts(req, email) {
        return this.service.getOptOutsForContact(req.tenantId, email ?? "");
    }
    async createConsentLog(req, body) {
        const parsed = compliance_schema_1.CreateConsentLogSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        return this.service.createConsentLog(req.tenantId, parsed.data);
    }
    async getConsentLogs(req, email) {
        return this.service.getConsentLogsForContact(req.tenantId, email ?? "");
    }
    async getAuditLog(req, email, decision, limit, offset) {
        this.logger.debug(`GET /compliance/audit-log — tenant=${req.tenantId}`);
        return this.service.getAuditLog(req.tenantId, {
            recipientEmail: email,
            decision,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Post)("policies"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "createPolicy", null);
__decorate([
    (0, common_1.Get)("policies"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("activeOnly")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getPolicies", null);
__decorate([
    (0, common_1.Get)("policies/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getPolicyById", null);
__decorate([
    (0, common_1.Patch)("policies/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "updatePolicy", null);
__decorate([
    (0, common_1.Delete)("policies/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "deactivatePolicy", null);
__decorate([
    (0, common_1.Post)("compliance/optouts"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "upsertOptOut", null);
__decorate([
    (0, common_1.Get)("compliance/optouts"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getOptOuts", null);
__decorate([
    (0, common_1.Post)("compliance/consent-logs"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "createConsentLog", null);
__decorate([
    (0, common_1.Get)("compliance/consent-logs"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getConsentLogs", null);
__decorate([
    (0, common_1.Get)("compliance/audit-log"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("email")),
    __param(2, (0, common_1.Query)("decision")),
    __param(3, (0, common_1.Query)("limit")),
    __param(4, (0, common_1.Query)("offset")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getAuditLog", null);
exports.ComplianceController = ComplianceController = ComplianceController_1 = __decorate([
    (0, common_1.Controller)("api/v1/m10-data-compliance"),
    (0, common_1.UseGuards)(M10AuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map