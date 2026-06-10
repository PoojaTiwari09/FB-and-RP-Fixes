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
exports.M02FrontendTrackersController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m02_frontend_trackers_service_1 = require("./m02-frontend-trackers.service");
let M02FrontendTrackersController = class M02FrontendTrackersController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(query, req) {
        return this.svc.listTrackers(req.tenantId, query);
    }
    detail(trackerId, req) {
        return this.svc.getTrackerDetail(req.tenantId, trackerId);
    }
    ask(trackerId, body, req) {
        return this.svc.askTracker(req.tenantId, trackerId, body?.question ?? '');
    }
};
exports.M02FrontendTrackersController = M02FrontendTrackersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendTrackersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':trackerId/detail'),
    __param(0, (0, common_1.Param)('trackerId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendTrackersController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':trackerId/ask'),
    __param(0, (0, common_1.Param)('trackerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendTrackersController.prototype, "ask", null);
exports.M02FrontendTrackersController = M02FrontendTrackersController = __decorate([
    (0, common_1.Controller)('api/trackers'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_trackers_service_1.M02FrontendTrackersService])
], M02FrontendTrackersController);
//# sourceMappingURL=m02-frontend-trackers.controller.js.map