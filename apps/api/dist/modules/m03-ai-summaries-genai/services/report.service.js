"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const m03_data_store_1 = require("./m03-data.store");
let ReportService = class ReportService {
    async getReport(reportId, orgId) {
        const report = m03_data_store_1.m03DataStore.getReport(reportId, orgId);
        if (!report)
            return null;
        const citations = m03_data_store_1.m03DataStore.getCitations(reportId);
        const feedback = m03_data_store_1.m03DataStore.feedback.filter((f) => f.report_id === reportId);
        const thumbsUp = feedback.filter((f) => f.feedback_type === 'THUMBS_UP').length;
        const thumbsDown = feedback.filter((f) => f.feedback_type === 'THUMBS_DOWN').length;
        const flags = feedback.filter((f) => f.feedback_type === 'FLAG_INACCURACY').length;
        return {
            ...report,
            citations,
            feedback_summary: { thumbsUp, thumbsDown, flags },
        };
    }
    async getReportHistory(reportId, orgId) {
        const report = m03_data_store_1.m03DataStore.getReport(reportId, orgId);
        if (!report)
            return { versions: [] };
        const versions = [...m03_data_store_1.m03DataStore.reports.values()]
            .filter((v) => v.org_id === orgId && v.query === report.query)
            .sort((a, b) => (b.version || 0) - (a.version || 0));
        return {
            versions: versions.map((v) => ({
                reportId: v.id,
                version: v.version,
                createdAt: v.created_at,
                status: v.status,
                modelUsed: v.model_used,
                metadata: v.metadata,
            })),
        };
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)()
], ReportService);
//# sourceMappingURL=report.service.js.map