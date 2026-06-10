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
exports.DealDriversManagerController = void 0;
const common_1 = require("@nestjs/common");
const deal_drivers_analytics_service_1 = require("../services/deal-drivers-analytics.service");
let DealDriversManagerController = class DealDriversManagerController {
    analytics;
    constructor(analytics) {
        this.analytics = analytics;
    }
    getSummary(query) {
        return this.analytics.getSummary(query);
    }
    getRiskMatrix(query) {
        return this.analytics.getRiskMatrix(query);
    }
    getComparePeriods(query) {
        return this.analytics.getComparePeriods(query);
    }
    getAtRiskDeals(query) {
        return this.analytics.getAtRiskDeals(query);
    }
    getAiInsights(query) {
        return this.analytics.getAiInsights(query);
    }
    getDrilldown(query) {
        return this.analytics.getDrilldown(query);
    }
    exportDrilldown(body) {
        return { downloadUrl: `/exports/drilldown-${body.repId || 'rep'}.csv` };
    }
    exportRiskMatrix(_body) {
        return { downloadUrl: '/exports/risk-matrix.csv' };
    }
    scheduleOneOnOne(body) {
        return {
            confirmationMessage: `1:1 scheduled for rep ${body.repId}`,
            calendarEventId: `evt_${Date.now()}`,
        };
    }
};
exports.DealDriversManagerController = DealDriversManagerController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('risk-matrix'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "getRiskMatrix", null);
__decorate([
    (0, common_1.Get)('compare-periods'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "getComparePeriods", null);
__decorate([
    (0, common_1.Get)('at-risk-deals'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "getAtRiskDeals", null);
__decorate([
    (0, common_1.Get)('ai-insights'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "getAiInsights", null);
__decorate([
    (0, common_1.Get)('risk-matrix/drilldown'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "getDrilldown", null);
__decorate([
    (0, common_1.Post)('risk-matrix/drilldown/export'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "exportDrilldown", null);
__decorate([
    (0, common_1.Post)('risk-matrix/export'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "exportRiskMatrix", null);
__decorate([
    (0, common_1.Post)('risk-matrix/schedule-1on1'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DealDriversManagerController.prototype, "scheduleOneOnOne", null);
exports.DealDriversManagerController = DealDriversManagerController = __decorate([
    (0, common_1.Controller)('api/manager/deal-drivers'),
    __metadata("design:paramtypes", [deal_drivers_analytics_service_1.DealDriversAnalyticsService])
], DealDriversManagerController);
//# sourceMappingURL=deal-drivers-manager.controller.js.map