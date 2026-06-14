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
exports.M01FrontendCallsController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m01_frontend_calls_service_1 = require("../services/m01-frontend-calls.service");
const s3_recordings_catalog_1 = require("../services/s3-recordings-catalog");
let M01FrontendCallsController = class M01FrontendCallsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listCalls(query, req) {
        return this.svc.listCalls(req.tenantId, query, req.userId, req.userRole, req.userName);
    }
    listS3Recordings() {
        return {
            recordings: s3_recordings_catalog_1.S3_RECORDINGS_CATALOG.map(({ id, displayName, sourceUrl }) => ({
                id,
                displayName,
                sourceUrl,
            })),
        };
    }
    searchCalls(query, req) {
        return this.svc.searchCalls(req.tenantId, query, req.userId, req.userRole, req.userName);
    }
    listAccounts(query, req) {
        return this.svc.listAccounts(req.tenantId, query, req.userId, req.userRole, req.userName);
    }
    listParticipants(query, req) {
        return this.svc.listParticipants(req.tenantId, query, req.userId, req.userRole, req.userName);
    }
    getCallMetadata(callId, req) {
        return this.svc.getCallMetadata(callId, req.tenantId, req.userId, req.userRole, req.userName);
    }
    getCall(callId, query, req) {
        return this.svc.getCall(callId, req.tenantId, query, req.userId, req.userRole, req.userName);
    }
};
exports.M01FrontendCallsController = M01FrontendCallsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "listCalls", null);
__decorate([
    (0, common_1.Get)('s3-recordings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "listS3Recordings", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "searchCalls", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Get)('participants'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "listParticipants", null);
__decorate([
    (0, common_1.Get)(':callId/metadata'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "getCallMetadata", null);
__decorate([
    (0, common_1.Get)(':callId'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallsController.prototype, "getCall", null);
exports.M01FrontendCallsController = M01FrontendCallsController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/calls'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_calls_service_1.M01FrontendCallsService])
], M01FrontendCallsController);
//# sourceMappingURL=m01-frontend-calls.controller.js.map