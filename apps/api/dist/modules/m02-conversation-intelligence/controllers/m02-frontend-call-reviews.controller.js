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
exports.M02FrontendDashboardController = exports.M02FrontendAnalyticsController = exports.M02FrontendManagerCallsController = exports.M02FrontendMetaController = exports.M02FrontendUsersController = exports.M02FrontendScorecardsController = exports.M02FrontendCallReviewsController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m02_frontend_call_reviews_service_1 = require("../services/m02-frontend-call-reviews.service");
let M02FrontendCallReviewsController = class M02FrontendCallReviewsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(query, req) {
        return this.svc.listReviews(req.tenantId, query, req.userId, req.userRole);
    }
    view(reviewId, req) {
        return this.svc.getSubmittedView(req.tenantId, reviewId, req.userId, req.userRole);
    }
    submitted(reviewId, req) {
        return this.svc.getSubmitted(reviewId, req.userId, req.userRole);
    }
    summary(reviewId, req) {
        return this.svc.getSummary(req.tenantId, reviewId, req.userId, req.userRole);
    }
    getCoaching(reviewId, req) {
        return this.svc.getCoaching(req.tenantId, reviewId, req.userId, req.userRole);
    }
    saveCoaching(reviewId, body, req) {
        return this.svc.saveCoaching(req.tenantId, reviewId, body, req.userId, req.userRole);
    }
    scorecard(reviewId, req) {
        return this.svc.getScorecardForm(req.tenantId, reviewId, req.userId, req.userRole);
    }
    transcript(reviewId, req) {
        return this.svc.getTranscript(req.tenantId, reviewId, req.userId, req.userRole);
    }
    aiInsights(reviewId, req) {
        return this.svc.getAiInsights(req.tenantId, reviewId, req.userId, req.userRole);
    }
    detail(reviewId, req) {
        return this.svc.getReviewDetail(req.tenantId, reviewId, req.userId, req.userRole);
    }
    patch(reviewId, body, req) {
        return this.svc.patchReview(req.tenantId, reviewId, body, req.userId, req.userRole);
    }
    markNa(reviewId, req) {
        return this.svc.markNa(req.tenantId, reviewId, req.userId, req.userRole);
    }
    saveAnswer(reviewId, body, req) {
        return this.svc.saveAnswer(req.tenantId, reviewId, body, req.userId, req.userRole);
    }
    saveDraft(reviewId, body, req) {
        return this.svc.saveDraft(req.tenantId, reviewId, body, req.userId, req.userRole);
    }
    submit(reviewId, body, req) {
        return this.svc.submitReview(req.tenantId, reviewId, body, req.userId, req.userRole);
    }
    export(reviewId) {
        return this.svc.exportReview(reviewId);
    }
    clone(reviewId, targetCallId, req) {
        return this.svc.cloneReview(req.tenantId, reviewId, targetCallId);
    }
    share(reviewId, body, req) {
        return this.svc.shareReview(req.tenantId, reviewId, body, req.userId, req.userRole);
    }
    reopen(reviewId, req) {
        return this.svc.reopenReview(req.tenantId, reviewId, req.userId, req.userRole);
    }
};
exports.M02FrontendCallReviewsController = M02FrontendCallReviewsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':reviewId/view'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "view", null);
__decorate([
    (0, common_1.Get)(':reviewId/submitted'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "submitted", null);
__decorate([
    (0, common_1.Get)(':reviewId/summary'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)(':reviewId/coaching'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "getCoaching", null);
__decorate([
    (0, common_1.Post)(':reviewId/coaching'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "saveCoaching", null);
__decorate([
    (0, common_1.Get)(':reviewId/scorecard'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "scorecard", null);
__decorate([
    (0, common_1.Get)(':reviewId/transcript'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "transcript", null);
__decorate([
    (0, common_1.Get)(':reviewId/ai-insights'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "aiInsights", null);
__decorate([
    (0, common_1.Get)(':reviewId'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':reviewId'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)(':reviewId/mark-na'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "markNa", null);
__decorate([
    (0, common_1.Post)(':reviewId/answers'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "saveAnswer", null);
__decorate([
    (0, common_1.Post)(':reviewId/save-draft'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)(':reviewId/submit'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':reviewId/export'),
    __param(0, (0, common_1.Param)('reviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "export", null);
__decorate([
    (0, common_1.Post)(':reviewId/clone'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)('targetCallId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "clone", null);
__decorate([
    (0, common_1.Post)(':reviewId/share'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "share", null);
__decorate([
    (0, common_1.Post)(':reviewId/reopen'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallReviewsController.prototype, "reopen", null);
exports.M02FrontendCallReviewsController = M02FrontendCallReviewsController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/call-reviews'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendCallReviewsController);
let M02FrontendScorecardsController = class M02FrontendScorecardsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list() {
        return this.svc.getScorecards();
    }
};
exports.M02FrontendScorecardsController = M02FrontendScorecardsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M02FrontendScorecardsController.prototype, "list", null);
exports.M02FrontendScorecardsController = M02FrontendScorecardsController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/scorecards'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendScorecardsController);
let M02FrontendUsersController = class M02FrontendUsersController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req) {
        return this.svc.getUsers(req.tenantId);
    }
};
exports.M02FrontendUsersController = M02FrontendUsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02FrontendUsersController.prototype, "list", null);
exports.M02FrontendUsersController = M02FrontendUsersController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/users'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendUsersController);
let M02FrontendMetaController = class M02FrontendMetaController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    coachingTags() {
        return this.svc.getCoachingTags();
    }
};
exports.M02FrontendMetaController = M02FrontendMetaController;
__decorate([
    (0, common_1.Get)('coaching-tags'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M02FrontendMetaController.prototype, "coachingTags", null);
exports.M02FrontendMetaController = M02FrontendMetaController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/meta'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendMetaController);
let M02FrontendManagerCallsController = class M02FrontendManagerCallsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listCalls(query, req) {
        return this.svc.listReviews(req.tenantId, query, req.userId, req.userRole);
    }
};
exports.M02FrontendManagerCallsController = M02FrontendManagerCallsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendManagerCallsController.prototype, "listCalls", null);
exports.M02FrontendManagerCallsController = M02FrontendManagerCallsController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/manager/calls'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendManagerCallsController);
let M02FrontendAnalyticsController = class M02FrontendAnalyticsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    summary(req) {
        return this.svc.getAnalyticsSummary(req.tenantId, req.userId, req.userRole);
    }
    scoreTrend(req) {
        return this.svc.getScoreTrend(req.tenantId, req.userId, req.userRole);
    }
    focusAreas(req) {
        return this.svc.focusAreas(req.tenantId, req.userId, req.userRole);
    }
    commonTags(req) {
        return this.svc.getCommonTags(req.tenantId);
    }
    reviewHistory(query, req) {
        return this.svc.getReviewHistory(req.tenantId, query, req.userId, req.userRole);
    }
};
exports.M02FrontendAnalyticsController = M02FrontendAnalyticsController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02FrontendAnalyticsController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('score-trend'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02FrontendAnalyticsController.prototype, "scoreTrend", null);
__decorate([
    (0, common_1.Get)('focus-areas'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02FrontendAnalyticsController.prototype, "focusAreas", null);
__decorate([
    (0, common_1.Get)('common-tags'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02FrontendAnalyticsController.prototype, "commonTags", null);
__decorate([
    (0, common_1.Get)('review-history'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendAnalyticsController.prototype, "reviewHistory", null);
exports.M02FrontendAnalyticsController = M02FrontendAnalyticsController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/analytics'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendAnalyticsController);
let M02FrontendDashboardController = class M02FrontendDashboardController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    summary(req) {
        return this.svc.getAnalyticsSummary(req.tenantId, req.userId, req.userRole);
    }
};
exports.M02FrontendDashboardController = M02FrontendDashboardController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M02FrontendDashboardController.prototype, "summary", null);
exports.M02FrontendDashboardController = M02FrontendDashboardController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/dashboard'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService])
], M02FrontendDashboardController);
//# sourceMappingURL=m02-frontend-call-reviews.controller.js.map