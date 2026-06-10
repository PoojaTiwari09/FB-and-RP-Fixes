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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const PROVIDERS = [
    { provider: 'zoom', name: 'Zoom', icon: '🎥', color: '#2D8CFF' },
    { provider: 'teams', name: 'Microsoft Teams', icon: '💬', color: '#6264A7' },
    { provider: 'meet', name: 'Google Meet', icon: '📹', color: '#00897B' },
    { provider: 'salesforce', name: 'Salesforce', icon: '☁️', color: '#00A1E0' },
    { provider: 'hubspot', name: 'HubSpot', icon: '🟠', color: '#FF7A59' },
];
let IntegrationsController = class IntegrationsController {
    list(req) {
        const tenantId = req.tenantId;
        return PROVIDERS.map((p, i) => ({
            ...p,
            status: i % 2 === 0 ? 'connected' : 'disconnected',
            accountEmail: i % 2 === 0 ? `demo+${p.provider}@${tenantId.slice(0, 8)}.local` : null,
            accountName: i % 2 === 0 ? `${p.name} Demo` : null,
            connectedAt: i % 2 === 0 ? new Date().toISOString() : null,
            hasCredentials: i % 2 === 0,
        }));
    }
    connect(provider) {
        const meta = PROVIDERS.find((p) => p.provider === provider);
        return {
            status: 'connected',
            message: `${meta?.name ?? provider} connected (demo mode)`,
            accountEmail: `demo@${provider}.local`,
            accountName: `${meta?.name ?? provider} Workspace`,
        };
    }
    disconnect(provider) {
        return {
            status: 'disconnected',
            message: `${provider} disconnected`,
        };
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':provider/connect'),
    __param(0, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "connect", null);
__decorate([
    (0, common_1.Post)(':provider/disconnect'),
    __param(0, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "disconnect", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('api/v1/integrations'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard)
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map