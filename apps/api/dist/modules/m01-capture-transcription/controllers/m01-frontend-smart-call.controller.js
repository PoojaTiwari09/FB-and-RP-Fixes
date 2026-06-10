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
exports.M01FrontendSmartCallController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m01_frontend_smart_call_service_1 = require("../services/m01-frontend-smart-call.service");
let M01FrontendSmartCallController = class M01FrontendSmartCallController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listContacts(query) {
        return this.svc.listContacts(query);
    }
    preCallBrief(contactId) {
        return this.svc.getPreCallBrief(contactId);
    }
    start(body) {
        return this.svc.startSession(body);
    }
    end(sessionId, body) {
        return this.svc.endSession(sessionId, body);
    }
    summary(sessionId) {
        return this.svc.getSummary(sessionId);
    }
    transcript(sessionId) {
        return this.svc.getTranscript(sessionId);
    }
    persist(sessionId, body) {
        return this.svc.persistSession(sessionId, body);
    }
    chunk(sessionId, body) {
        return this.svc.persistChunk(sessionId, body);
    }
    summaries(sessionId) {
        return this.svc.listSummaries(sessionId);
    }
};
exports.M01FrontendSmartCallController = M01FrontendSmartCallController;
__decorate([
    (0, common_1.Get)('contacts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "listContacts", null);
__decorate([
    (0, common_1.Get)('contacts/:contactId/pre-call-brief'),
    __param(0, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "preCallBrief", null);
__decorate([
    (0, common_1.Post)('sessions/start'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/end'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "end", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/summary'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/transcript'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "transcript", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/persist'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "persist", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/chunks'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "chunk", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/summaries'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M01FrontendSmartCallController.prototype, "summaries", null);
exports.M01FrontendSmartCallController = M01FrontendSmartCallController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/smart-call'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_smart_call_service_1.M01FrontendSmartCallService])
], M01FrontendSmartCallController);
//# sourceMappingURL=m01-frontend-smart-call.controller.js.map