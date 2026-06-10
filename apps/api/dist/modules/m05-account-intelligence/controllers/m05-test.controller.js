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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M05TestController = void 0;
const common_1 = require("@nestjs/common");
const m05_data_store_1 = require("../database/m05-data.store");
const m05_verification_matrix_1 = require("../database/m05-verification.matrix");
let M05TestController = class M05TestController {
    health() {
        return {
            success: true,
            module: 'm05-account-intelligence',
            timestamp: new Date().toISOString(),
        };
    }
    smoke() {
        return {
            success: true,
            module: 'm05-account-intelligence',
            checks: ['health', 'accounts_route', 'webhook_env'],
            webhookSecretConfigured: Boolean(process.env.M05_HUBSPOT_WEBHOOK_SECRET || process.env.HUBSPOT_WEBHOOK_SECRET),
            hubspotTokenConfigured: Boolean(process.env.HUBSPOT_ACCESS_TOKEN),
            hubspotPortalId: process.env.HUBSPOT_PORTAL_ID || null,
        };
    }
    verification() {
        return {
            success: true,
            module: 'm05-account-intelligence',
            count: m05_verification_matrix_1.M05_VERIFICATION_MATRIX.length,
            matrix: m05_verification_matrix_1.M05_VERIFICATION_MATRIX,
            manifest: (0, m05_data_store_1.m05SeedManifest)(),
            stats: m05_data_store_1.m05DataStore.stats(),
            reload_seed: 'POST /api/v1/account-intelligence/test/seed',
        };
    }
    seed() {
        m05_data_store_1.m05DataStore.reset();
        return {
            success: true,
            module: 'm05-account-intelligence',
            message: 'Demo seed loaded (in-memory). Boards: demo (4 accounts), commercial (1).',
            stats: m05_data_store_1.m05DataStore.stats(),
            manifest: (0, m05_data_store_1.m05SeedManifest)(),
            verification: 'GET /api/v1/account-intelligence/test/verification',
            urls: {
                demo: 'http://localhost:5179/board/demo',
                commercial: 'http://localhost:5179/board/commercial',
            },
        };
    }
};
exports.M05TestController = M05TestController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('smoke'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "smoke", null);
__decorate([
    (0, common_1.Get)('verification'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "verification", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "seed", null);
exports.M05TestController = M05TestController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/test')
], M05TestController);
//# sourceMappingURL=m05-test.controller.js.map