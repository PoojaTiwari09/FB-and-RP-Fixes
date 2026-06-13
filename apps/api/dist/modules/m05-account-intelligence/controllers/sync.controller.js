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
var SyncController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const sync_service_1 = require("../services/sync.service");
let SyncController = SyncController_1 = class SyncController {
    syncService;
    logger = new common_1.Logger(SyncController_1.name);
    constructor(syncService) {
        this.syncService = syncService;
    }
    async triggerSync(body) {
        if (body.role !== 'admin') {
            return { success: false, error: 'Only admin role can trigger sync' };
        }
        this.logger.log(`[SYNC] Manual trigger by admin at ${new Date().toISOString()}`);
        const result = await this.syncService.runFullSync();
        return result;
    }
    getStatus() {
        return this.syncService.getStatus();
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('trigger'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "triggerSync", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "getStatus", null);
exports.SyncController = SyncController = SyncController_1 = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map