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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const feedback_service_1 = require("../services/feedback.service");
const auth_guard_1 = require("../guards/auth.guard");
let FeedbackController = class FeedbackController {
    feedbackService;
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    async submitReportFeedback(reportId, body, req) {
        if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
            throw new common_1.BadRequestException('Request body is required and cannot be empty');
        }
        if (!body.type || typeof body.type !== 'string') {
            throw new common_1.BadRequestException('type is required and must be a string');
        }
        if (body.sectionId !== undefined && typeof body.sectionId !== 'string') {
            throw new common_1.BadRequestException('sectionId must be a string');
        }
        if (body.note !== undefined && typeof body.note !== 'string') {
            throw new common_1.BadRequestException('note must be a string');
        }
        const raw = JSON.stringify(body);
        if (raw.length > 10000) {
            throw new common_1.BadRequestException('Request payload too large');
        }
        return this.feedbackService.submitFeedback({
            orgId: req.user.orgId,
            userId: req.user.userId,
            reportId,
            ...body,
        });
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Post)('reports/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "submitReportFeedback", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)('api/v1/ai-summaries-genai/feedback'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map