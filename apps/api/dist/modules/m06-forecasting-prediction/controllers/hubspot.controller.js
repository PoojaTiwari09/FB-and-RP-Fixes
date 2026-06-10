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
exports.HubSpotController = void 0;
const common_1 = require("@nestjs/common");
const hubspot_service_1 = require("../services/hubspot.service");
const TenantHeader = 'x-tenant-id';
const FRONTEND_URL = 'http://localhost:3000';
let HubSpotController = class HubSpotController {
    hubspotService;
    constructor(hubspotService) {
        this.hubspotService = hubspotService;
    }
    getAuthUrl(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return { url: this.hubspotService.getAuthUrl(tenantId) };
    }
    async handleCallback(code, state) {
        try {
            await this.hubspotService.handleCallback(code, state);
            return { url: `${FRONTEND_URL}?hubspot=connected` };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            return { url: `${FRONTEND_URL}?hubspot=error&msg=${encodeURIComponent(msg)}` };
        }
    }
    getStatus(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return { connected: this.hubspotService.isConnected(tenantId) };
    }
    async syncDeals(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.hubspotService.syncDeals(tenantId);
    }
    disconnect(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.hubspotService.disconnect(tenantId);
    }
};
exports.HubSpotController = HubSpotController;
__decorate([
    (0, common_1.Get)('auth-url'),
    __param(0, (0, common_1.Headers)(TenantHeader)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HubSpotController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, common_1.Redirect)('', 302),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HubSpotController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Headers)(TenantHeader)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HubSpotController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Headers)(TenantHeader)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HubSpotController.prototype, "syncDeals", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    __param(0, (0, common_1.Headers)(TenantHeader)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HubSpotController.prototype, "disconnect", null);
exports.HubSpotController = HubSpotController = __decorate([
    (0, common_1.Controller)('api/v1/hubspot'),
    __metadata("design:paramtypes", [hubspot_service_1.HubSpotService])
], HubSpotController);
//# sourceMappingURL=hubspot.controller.js.map