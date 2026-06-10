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
exports.M01FrontendCoachingInsightsController = exports.M01FrontendAiReviewerDetailController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m01_frontend_ai_reviewer_service_1 = require("../services/m01-frontend-ai-reviewer.service");
let M01FrontendAiReviewerDetailController = class M01FrontendAiReviewerDetailController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async aiInsights(callId, req) {
        const record = await this.svc.loadCall(callId, req.tenantId);
        return this.svc.mapAiInsights(record);
    }
    async audioUrl(callId, req) {
        const record = await this.svc.loadCall(callId, req.tenantId);
        return this.svc.mapAudioUrl(record);
    }
    async review(callId, req) {
        const record = await this.svc.loadCall(callId, req.tenantId);
        return this.svc.mapReview(record, req.tenantId);
    }
    async feedback(callId, req) {
        const record = await this.svc.loadCall(callId, req.tenantId);
        return this.svc.mapFeedback(record, req.tenantId);
    }
    acknowledge(_body) {
        return this.svc.acknowledgeFeedback();
    }
    updateActionItem(_body) {
        return this.svc.updateActionItem();
    }
    async transcriptEntries(callId, req) {
        const record = await this.svc.loadCall(callId, req.tenantId);
        return this.svc.mapTranscript(record);
    }
};
exports.M01FrontendAiReviewerDetailController = M01FrontendAiReviewerDetailController;
__decorate([
    (0, common_1.Get)('ai-insights'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendAiReviewerDetailController.prototype, "aiInsights", null);
__decorate([
    (0, common_1.Get)('audio-url'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendAiReviewerDetailController.prototype, "audioUrl", null);
__decorate([
    (0, common_1.Get)('review'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendAiReviewerDetailController.prototype, "review", null);
__decorate([
    (0, common_1.Get)('feedback'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendAiReviewerDetailController.prototype, "feedback", null);
__decorate([
    (0, common_1.Post)('feedback/acknowledge'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M01FrontendAiReviewerDetailController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Patch)('action-items/:actionItemId'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M01FrontendAiReviewerDetailController.prototype, "updateActionItem", null);
__decorate([
    (0, common_1.Get)('transcript-entries'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendAiReviewerDetailController.prototype, "transcriptEntries", null);
exports.M01FrontendAiReviewerDetailController = M01FrontendAiReviewerDetailController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/calls/:callId'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_ai_reviewer_service_1.M01FrontendAiReviewerService])
], M01FrontendAiReviewerDetailController);
let M01FrontendCoachingInsightsController = class M01FrontendCoachingInsightsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    insights() {
        return this.svc.coachingInsights();
    }
};
exports.M01FrontendCoachingInsightsController = M01FrontendCoachingInsightsController;
__decorate([
    (0, common_1.Get)('insights'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M01FrontendCoachingInsightsController.prototype, "insights", null);
exports.M01FrontendCoachingInsightsController = M01FrontendCoachingInsightsController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/coaching'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_ai_reviewer_service_1.M01FrontendAiReviewerService])
], M01FrontendCoachingInsightsController);
//# sourceMappingURL=m01-frontend-ai-reviewer.controller.js.map