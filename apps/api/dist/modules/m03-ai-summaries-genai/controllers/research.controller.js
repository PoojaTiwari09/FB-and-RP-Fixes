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
exports.ResearchController = void 0;
const common_1 = require("@nestjs/common");
const research_service_1 = require("../services/research.service");
const report_service_1 = require("../services/report.service");
const research_dto_1 = require("../interfaces/research.dto");
const auth_guard_1 = require("../guards/auth.guard");
const rbac_guard_1 = require("../guards/rbac.guard");
const feature_permission_guard_1 = require("../guards/feature-permission.guard");
let ResearchController = class ResearchController {
    researchService;
    reportService;
    constructor(researchService, reportService) {
        this.researchService = researchService;
        this.reportService = reportService;
    }
    async createJob(dto, req) {
        if (!dto || typeof dto !== 'object' || Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException('Request body is required and cannot be empty');
        }
        if (!dto.query || typeof dto.query !== 'string') {
            throw new common_1.BadRequestException('query is required and must be a string');
        }
        const raw = JSON.stringify(dto);
        if (raw.length > 10000) {
            throw new common_1.BadRequestException('Request payload too large');
        }
        const user = req.user;
        const activeJobs = await this.researchService.getActiveJobCount(user.orgId, user.userId);
        if (activeJobs >= 3) {
            throw new common_1.BadRequestException('Maximum concurrent research jobs reached (3). Please wait for existing jobs to complete.');
        }
        await this.researchService.logAudit(user, 'research.job.created', {
            query: dto.query,
            filters: dto.filters,
        });
        const job = await this.researchService.createJob(dto, user);
        return {
            jobId: job.jobId,
            status: 'QUEUED',
            estimatedDurationSeconds: 120,
            message: 'Research job created and queued for processing.',
        };
    }
    async getJobStatus(jobId, req) {
        const status = await this.researchService.getJobStatus(jobId, req.user.orgId);
        if (!status) {
            throw new common_1.NotFoundException('Research job not found');
        }
        return status;
    }
    async cancelJob(jobId, body, req) {
        if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
            throw new common_1.BadRequestException('Request body is required and cannot be empty');
        }
        if (body.exampleField === undefined || typeof body.exampleField !== 'string') {
            throw new common_1.BadRequestException('exampleField is required and must be a string');
        }
        if (body.count === undefined || typeof body.count !== 'number') {
            throw new common_1.BadRequestException('count is required and must be a number');
        }
        const raw = JSON.stringify(body);
        if (raw.length > 10000) {
            throw new common_1.BadRequestException('Request payload too large');
        }
        const result = await this.researchService.cancelJob(jobId, req.user.orgId);
        if (!result) {
            throw new common_1.NotFoundException('Research job not found');
        }
        await this.researchService.logAudit(req.user, 'research.job.cancelled', { jobId });
        return { status: 'cancelled', jobId };
    }
    async listJobs(req, status, limit = 20) {
        return this.researchService.listJobs(req.user.orgId, req.user.userId, status, limit);
    }
    async getReport(reportId, req) {
        const report = await this.reportService.getReport(reportId, req.user.orgId);
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        return report;
    }
    async getReportHistory(reportId, req) {
        return this.reportService.getReportHistory(reportId, req.user.orgId);
    }
};
exports.ResearchController = ResearchController;
__decorate([
    (0, common_1.Post)('jobs'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard, feature_permission_guard_1.FeaturePermissionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [research_dto_1.CreateJobDto, Object]),
    __metadata("design:returntype", Promise)
], ResearchController.prototype, "createJob", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResearchController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/cancel'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ResearchController.prototype, "cancelJob", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], ResearchController.prototype, "listJobs", null);
__decorate([
    (0, common_1.Get)('reports/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResearchController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)('reports/:reportId/history'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResearchController.prototype, "getReportHistory", null);
exports.ResearchController = ResearchController = __decorate([
    (0, common_1.Controller)('api/v1/ai-summaries-genai/research'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [research_service_1.ResearchService,
        report_service_1.ReportService])
], ResearchController);
//# sourceMappingURL=research.controller.js.map