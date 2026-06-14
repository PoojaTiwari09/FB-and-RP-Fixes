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
exports.AiDeepResearcherController = void 0;
const common_1 = require("@nestjs/common");
const ai_deep_researcher_service_1 = require("../services/ai-deep-researcher.service");
const auth_guard_1 = require("../guards/auth.guard");
let AiDeepResearcherController = class AiDeepResearcherController {
    service;
    constructor(service) {
        this.service = service;
    }
    getFiltersDefaults() {
        return this.service.getFiltersDefaults();
    }
    getExampleQuestions() {
        return this.service.getExampleQuestions();
    }
    runAnalysis(params) {
        if (!params || typeof params !== 'object') {
            throw new common_1.BadRequestException('Request body is required and must be an object');
        }
        if (params.query === undefined || typeof params.query !== 'string' || params.query.trim() === '') {
            throw new common_1.BadRequestException('query is required and must be a non-empty string');
        }
        return this.service.runAnalysis(params);
    }
    getProgress(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId parameter is required');
        }
        return this.service.getProgress(jobId);
    }
    getDashboard(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getDashboard(jobId);
    }
    getExecutiveSummary(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getExecutiveSummary(jobId);
    }
    getKeyFindings(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getKeyFindings(jobId);
    }
    getObjections(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getObjections(jobId);
    }
    getTrends(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getTrends(jobId);
    }
    getRisksOpportunities(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getRisksOpportunities(jobId);
    }
    getRecommendations(jobId) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        return this.service.getRecommendations(jobId);
    }
    getEvidence(jobId, finding, page, size) {
        if (!jobId || jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId query parameter is required');
        }
        const p = page ? parseInt(page, 10) : 1;
        const s = size ? parseInt(size, 10) : 10;
        if (isNaN(p) || p <= 0) {
            throw new common_1.BadRequestException('page query parameter must be a positive integer');
        }
        if (isNaN(s) || s <= 0) {
            throw new common_1.BadRequestException('size query parameter must be a positive integer');
        }
        return this.service.getEvidence(jobId, finding || 'all', p, s);
    }
    submitEscalation(body) {
        if (!body || typeof body !== 'object') {
            throw new common_1.BadRequestException('Request body is required and must be an object');
        }
        if (!body.jobId || typeof body.jobId !== 'string' || body.jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId is required and must be a non-empty string');
        }
        if (!body.question || typeof body.question !== 'string' || body.question.trim() === '') {
            throw new common_1.BadRequestException('question is required and must be a non-empty string');
        }
        return this.service.submitEscalation(body.jobId, body.question);
    }
    shareRecommendation(body) {
        if (!body || typeof body !== 'object') {
            throw new common_1.BadRequestException('Request body is required and must be an object');
        }
        if (!body.jobId || typeof body.jobId !== 'string' || body.jobId.trim() === '') {
            throw new common_1.BadRequestException('jobId is required and must be a non-empty string');
        }
        if (!body.recommendationId || typeof body.recommendationId !== 'string' || body.recommendationId.trim() === '') {
            throw new common_1.BadRequestException('recommendationId is required and must be a non-empty string');
        }
        if (!body.channel || typeof body.channel !== 'string' || body.channel.trim() === '') {
            throw new common_1.BadRequestException('channel is required and must be a non-empty string');
        }
        return this.service.shareRecommendation(body.jobId, body.recommendationId, body.channel);
    }
    getReps() {
        return this.service.getReps();
    }
    getRepCalls(repId) {
        if (!repId || repId.trim() === '') {
            throw new common_1.BadRequestException('repId parameter is required');
        }
        return this.service.getRepCalls(repId);
    }
    getObjectionRepBreakdown(objectionId) {
        if (!objectionId || objectionId.trim() === '') {
            throw new common_1.BadRequestException('objectionId parameter is required');
        }
        return this.service.getObjectionRepBreakdown(objectionId);
    }
    getObjectionEvidence(objectionId) {
        if (!objectionId || objectionId.trim() === '') {
            throw new common_1.BadRequestException('objectionId parameter is required');
        }
        return this.service.getObjectionEvidence(objectionId);
    }
    getAccountDetails(accountId) {
        if (!accountId || accountId.trim() === '') {
            throw new common_1.BadRequestException('accountId parameter is required');
        }
        return this.service.getAccountDetails(accountId);
    }
    getRecommendationDetails(recId) {
        if (!recId || recId.trim() === '') {
            throw new common_1.BadRequestException('recId parameter is required');
        }
        return this.service.getRecommendationDetails(recId);
    }
};
exports.AiDeepResearcherController = AiDeepResearcherController;
__decorate([
    (0, common_1.Get)('filters/defaults'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getFiltersDefaults", null);
__decorate([
    (0, common_1.Get)('example-questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getExampleQuestions", null);
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "runAnalysis", null);
__decorate([
    (0, common_1.Get)('progress/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('executive-summary'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getExecutiveSummary", null);
__decorate([
    (0, common_1.Get)('key-findings'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getKeyFindings", null);
__decorate([
    (0, common_1.Get)('objections'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getObjections", null);
__decorate([
    (0, common_1.Get)('trends'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('risks-opportunities'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getRisksOpportunities", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('evidence'),
    __param(0, (0, common_1.Query)('jobId')),
    __param(1, (0, common_1.Query)('finding')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getEvidence", null);
__decorate([
    (0, common_1.Post)('escalation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "submitEscalation", null);
__decorate([
    (0, common_1.Post)('recommendation/share'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "shareRecommendation", null);
__decorate([
    (0, common_1.Get)('reps'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getReps", null);
__decorate([
    (0, common_1.Get)('reps/:repId/calls'),
    __param(0, (0, common_1.Param)('repId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getRepCalls", null);
__decorate([
    (0, common_1.Get)('objections/:objectionId/rep-breakdown'),
    __param(0, (0, common_1.Param)('objectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getObjectionRepBreakdown", null);
__decorate([
    (0, common_1.Get)('objections/:objectionId/evidence'),
    __param(0, (0, common_1.Param)('objectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getObjectionEvidence", null);
__decorate([
    (0, common_1.Get)('accounts/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getAccountDetails", null);
__decorate([
    (0, common_1.Get)('recommendations/:recId'),
    __param(0, (0, common_1.Param)('recId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDeepResearcherController.prototype, "getRecommendationDetails", null);
exports.AiDeepResearcherController = AiDeepResearcherController = __decorate([
    (0, common_1.Controller)('api/v1/ai-deep-researcher'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [ai_deep_researcher_service_1.AiDeepResearcherService])
], AiDeepResearcherController);
//# sourceMappingURL=ai-deep-researcher.controller.js.map