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
exports.TrackerController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const tracker_service_1 = require("../services/tracker.service");
let TrackerController = class TrackerController {
    trackerService;
    constructor(trackerService) {
        this.trackerService = trackerService;
    }
    async createTracker(req, body) {
        return this.trackerService.createTracker({ ...body, tenantId: req.tenantId });
    }
    async getTrackers(req) {
        return this.trackerService.getTrackers(req.tenantId);
    }
    async getStats(req) {
        return this.trackerService.getTrackerStats(req.tenantId);
    }
    async getAllDetections(req) {
        return this.trackerService.getAllDetections(req.tenantId);
    }
    async getDetectionsForConversation(req, entityId, entityType = 'call') {
        return this.trackerService.getDetectionsForConversation(req.tenantId, entityId, entityType);
    }
    async updateTracker(req, id, body) {
        return this.trackerService.updateTracker(id, req.tenantId, body);
    }
    async deleteTracker(req, id) {
        return this.trackerService.deleteTracker(id, req.tenantId);
    }
};
exports.TrackerController = TrackerController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "createTracker", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "getTrackers", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('detections'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "getAllDetections", null);
__decorate([
    (0, common_1.Get)('detections/:entityId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Query)('entityType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "getDetectionsForConversation", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "updateTracker", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "deleteTracker", null);
exports.TrackerController = TrackerController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/trackers'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [tracker_service_1.TrackerService])
], TrackerController);
//# sourceMappingURL=tracker.controller.js.map