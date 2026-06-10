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
exports.ForecastUpgradeController = void 0;
const common_1 = require("@nestjs/common");
const forecast_upgrade_service_1 = require("../services/forecast-upgrade.service");
let ForecastUpgradeController = class ForecastUpgradeController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSubmissions(periodId, repId) {
        try {
            const data = await this.service.getSubmissions(periodId, repId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch submissions' };
        }
    }
    async createOrUpdateSubmission(body) {
        try {
            const data = await this.service.createOrUpdateSubmission(body.rep_id, body.deal_id, body.period_id, body.field, body.value);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to create/update submission' };
        }
    }
    async submitForecast(id, body) {
        try {
            const data = await this.service.submitForecast(id, body.rep_id, body.field);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to submit forecast' };
        }
    }
    async approveSubmission(id, body) {
        try {
            const data = await this.service.approveSubmission(id, body.manager_id, body.field);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to approve submission' };
        }
    }
    async reopenSubmission(id, body) {
        try {
            const data = await this.service.reopenSubmission(id, body.manager_id);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to reopen submission' };
        }
    }
    async overrideSubmission(id, body) {
        try {
            const data = await this.service.overrideSubmission(id, body.manager_id, body.field, body.override_value);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to override submission' };
        }
    }
    async getNotifications(repId) {
        try {
            const data = await this.service.getNotifications(repId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch notifications' };
        }
    }
    async markNotificationSeen(id) {
        try {
            const data = await this.service.markNotificationSeen(id);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to mark notification seen' };
        }
    }
    async getSubmissionActivity(submissionId) {
        try {
            const data = await this.service.getSubmissionActivity(submissionId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch submission activity' };
        }
    }
    async getTargets(periodId) {
        try {
            const data = await this.service.getTargets(periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch targets' };
        }
    }
    async assignTargets(body) {
        try {
            const data = await this.service.assignTargets(body.period_id, body.manager_id, body.assignments);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to assign targets' };
        }
    }
    async getPeriods() {
        try {
            const data = await this.service.getPeriods();
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch forecast periods' };
        }
    }
    async getPeriodReps(periodId) {
        try {
            const data = await this.service.getPeriodReps(periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch period reps' };
        }
    }
    async getClosedDealsTotal(repId, periodId) {
        try {
            const data = await this.service.getClosedDealsTotal(repId, periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch closed won total' };
        }
    }
    async getClosedDealValue(repId, dealId) {
        try {
            const data = await this.service.getClosedDealValue(repId, dealId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch closed deal value' };
        }
    }
    async getPipelineTotal(repId, periodId) {
        try {
            const data = await this.service.getPipelineTotal(repId, periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch pipeline total' };
        }
    }
    async getPipelineDealValue(repId, dealId, periodId) {
        try {
            const data = await this.service.getPipelineDealValue(repId, dealId, periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch deal pipeline value' };
        }
    }
    async getAiPredictionScores(repId) {
        try {
            const data = await this.service.getAiPredictionScores(repId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch AI scores' };
        }
    }
    async getRepDrilldown(repId, periodId) {
        try {
            const data = await this.service.getRepDrilldown(repId, periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch drill-down' };
        }
    }
    async getRepDrilldownSummary(repId, periodId) {
        try {
            const data = await this.service.getRepDrilldownSummary(repId, periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch drill-down summary' };
        }
    }
    async getManagerBoard(managerId, periodId) {
        try {
            const data = await this.service.getManagerBoard(managerId, periodId);
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: e.message || 'Failed to fetch manager board' };
        }
    }
};
exports.ForecastUpgradeController = ForecastUpgradeController;
__decorate([
    (0, common_1.Get)('forecast/submissions/:period_id/:rep_id'),
    __param(0, (0, common_1.Param)('period_id')),
    __param(1, (0, common_1.Param)('rep_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getSubmissions", null);
__decorate([
    (0, common_1.Post)('forecast/submissions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "createOrUpdateSubmission", null);
__decorate([
    (0, common_1.Patch)('forecast/submissions/:id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "submitForecast", null);
__decorate([
    (0, common_1.Patch)('forecast/submissions/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "approveSubmission", null);
__decorate([
    (0, common_1.Patch)('forecast/submissions/:id/reopen'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "reopenSubmission", null);
__decorate([
    (0, common_1.Patch)('forecast/submissions/:id/override'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "overrideSubmission", null);
__decorate([
    (0, common_1.Get)('forecast/notifications/:rep_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('forecast/notifications/:id/seen'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "markNotificationSeen", null);
__decorate([
    (0, common_1.Get)('forecast/activity/:submission_id'),
    __param(0, (0, common_1.Param)('submission_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getSubmissionActivity", null);
__decorate([
    (0, common_1.Get)('forecast/targets/:period_id'),
    __param(0, (0, common_1.Param)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Post)('forecast/targets/assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "assignTargets", null);
__decorate([
    (0, common_1.Get)('forecast/periods'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getPeriods", null);
__decorate([
    (0, common_1.Get)('forecast/periods/:period_id/reps'),
    __param(0, (0, common_1.Param)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getPeriodReps", null);
__decorate([
    (0, common_1.Get)('forecast/closed-deals/:rep_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __param(1, (0, common_1.Query)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getClosedDealsTotal", null);
__decorate([
    (0, common_1.Get)('forecast/closed-deals/:rep_id/:deal_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __param(1, (0, common_1.Param)('deal_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getClosedDealValue", null);
__decorate([
    (0, common_1.Get)('forecast/pipeline/:rep_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __param(1, (0, common_1.Query)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getPipelineTotal", null);
__decorate([
    (0, common_1.Get)('forecast/pipeline/:rep_id/:deal_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __param(1, (0, common_1.Param)('deal_id')),
    __param(2, (0, common_1.Query)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getPipelineDealValue", null);
__decorate([
    (0, common_1.Get)('forecast/ai-predictor/scores/:rep_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getAiPredictionScores", null);
__decorate([
    (0, common_1.Get)('forecast/drill-down/:rep_id'),
    __param(0, (0, common_1.Param)('rep_id')),
    __param(1, (0, common_1.Query)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getRepDrilldown", null);
__decorate([
    (0, common_1.Get)('forecast/drill-down/:rep_id/summary'),
    __param(0, (0, common_1.Param)('rep_id')),
    __param(1, (0, common_1.Query)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getRepDrilldownSummary", null);
__decorate([
    (0, common_1.Get)('forecast/manager-board/:manager_id'),
    __param(0, (0, common_1.Param)('manager_id')),
    __param(1, (0, common_1.Query)('period_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastUpgradeController.prototype, "getManagerBoard", null);
exports.ForecastUpgradeController = ForecastUpgradeController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [forecast_upgrade_service_1.ForecastUpgradeService])
], ForecastUpgradeController);
//# sourceMappingURL=forecast-upgrade.controller.js.map