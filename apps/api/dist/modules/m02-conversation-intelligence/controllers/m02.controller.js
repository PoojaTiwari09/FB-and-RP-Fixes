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
exports.M02ConversationIntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m02_service_1 = require("../services/m02.service");
let M02ConversationIntelligenceController = class M02ConversationIntelligenceController {
    service;
    constructor(service) {
        this.service = service;
    }
    async search(queryDto, req) {
        const tenantId = this.requireTenant(req);
        return this.service.searchConversations(queryDto, tenantId);
    }
    async list(queryDto, req) {
        const tenantId = this.requireTenant(req);
        return this.service.getConversations(queryDto, tenantId);
    }
    async findById(id, req) {
        const tenantId = this.requireTenant(req);
        const result = await this.service.getConversationById(id, tenantId);
        if (!result) {
            throw new common_1.NotFoundException(`Conversation ${id} not found for tenant ${tenantId}`);
        }
        return result;
    }
    async saveSearch(body, req) {
        const { tenantId, userId } = this.requireTenantAndUser(req);
        return this.service.createSavedSearch(body, tenantId, userId);
    }
    async getSavedSearches(req) {
        const { tenantId, userId } = this.requireTenantAndUser(req);
        return this.service.getSavedSearches(tenantId, userId);
    }
    findAllLegacy(req) {
        const tenantId = this.requireTenant(req);
        return this.service.findAll(tenantId);
    }
    requireTenant(req) {
        const tenantId = req.tenantId;
        if (!tenantId || typeof tenantId !== 'string') {
            throw new common_1.UnauthorizedException('Missing or invalid tenant context. Authenticate or set the x-tenant-id header.');
        }
        return tenantId;
    }
    requireTenantAndUser(req) {
        const tenantId = this.requireTenant(req);
        const userId = req.userId;
        if (!userId || typeof userId !== 'string') {
            throw new common_1.UnauthorizedException('Missing user context. Authenticate or set the x-user-id header.');
        }
        return { tenantId, userId };
    }
};
exports.M02ConversationIntelligenceController = M02ConversationIntelligenceController;
__decorate([
    (0, common_1.Get)('conversations/search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M02ConversationIntelligenceController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M02ConversationIntelligenceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M02ConversationIntelligenceController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)('saved-searches'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M02ConversationIntelligenceController.prototype, "saveSearch", null);
__decorate([
    (0, common_1.Get)('saved-searches'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M02ConversationIntelligenceController.prototype, "getSavedSearches", null);
__decorate([
    (0, common_1.Get)('findAll'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02ConversationIntelligenceController.prototype, "findAllLegacy", null);
exports.M02ConversationIntelligenceController = M02ConversationIntelligenceController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_service_1.M02ConversationIntelligenceService])
], M02ConversationIntelligenceController);
//# sourceMappingURL=m02.controller.js.map