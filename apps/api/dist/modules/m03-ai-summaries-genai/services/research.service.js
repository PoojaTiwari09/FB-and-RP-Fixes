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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const m03_data_store_1 = require("./m03-data.store");
let ResearchService = class ResearchService {
    config;
    fastapiUrl;
    constructor(config) {
        this.config = config;
        this.fastapiUrl =
            this.config?.get?.('FASTAPI_URL') ||
                process.env.FASTAPI_URL ||
                'http://localhost:8000';
    }
    async createJob(dto, user) {
        const jobId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        m03_data_store_1.m03DataStore.insertJob({
            id: jobId,
            org_id: user.orgId,
            user_id: user.userId,
            query: dto.query,
            context_type: dto.contextType || 'ACCOUNT',
            context_id: dto.contextId,
            scope: dto.scope || 'ENTIRE_ACCOUNT',
            period_days: dto.periodDays || 60,
            filters: dto.filters || {},
            status: 'QUEUED',
            progress_pct: 0,
            progress_stage: 'Job queued',
            created_at: now,
            sub_queries: [],
        });
        this.dispatchToFastAPI(jobId, dto, user).catch(() => {
            this.simulateJobCompletion(jobId, dto, user);
        });
        return { jobId, status: 'QUEUED' };
    }
    async dispatchToFastAPI(jobId, dto, user) {
        try {
            await axios_1.default.post(`${this.fastapiUrl}/api/v1/research/run`, {
                query: dto.query,
                context_type: dto.contextType || 'ACCOUNT',
                context_id: dto.contextId,
                scope: dto.scope || 'ENTIRE_ACCOUNT',
                period_days: dto.periodDays || 60,
                filters: dto.filters || {},
                org_id: user.orgId,
                user_id: user.userId,
                web_data_enabled: dto.webDataEnabled || false,
            }, { timeout: 5000 });
        }
        catch {
            throw new Error('FastAPI unavailable');
        }
    }
    simulateJobCompletion(jobId, dto, user) {
        m03_data_store_1.m03DataStore.updateJob(jobId, {
            status: 'PROCESSING',
            progress_pct: 50,
            progress_stage: 'Analyzing CRM data',
        });
        const reportId = (0, uuid_1.v4)();
        const summaryText = `Research summary for: ${dto.query}\n\n- Key theme: pricing and timeline\n- Risk: competitor evaluation\n- Recommendation: schedule executive alignment`;
        m03_data_store_1.m03DataStore.insertReport({
            id: reportId,
            job_id: jobId,
            org_id: user.orgId,
            query: dto.query,
            status: 'COMPLETED',
            version: 1,
            content: { sections: [{ title: 'Executive Summary', body: summaryText }] },
            model_used: 'mock',
            created_at: new Date().toISOString(),
        });
        m03_data_store_1.m03DataStore.setCitations(reportId, [
            { id: (0, uuid_1.v4)(), report_id: reportId, source_type: 'call', source_id: 'call-1', excerpt: 'Budget discussion' },
        ]);
        m03_data_store_1.m03DataStore.updateJob(jobId, {
            status: 'COMPLETED',
            progress_pct: 100,
            progress_stage: 'Complete',
            completed_at: new Date().toISOString(),
            report_id: reportId,
        });
    }
    async getJobStatus(jobId, orgId) {
        const data = m03_data_store_1.m03DataStore.getJob(jobId, orgId);
        if (!data)
            return null;
        const result = {
            jobId: data.id,
            status: data.status,
            progressPct: data.progress_pct,
            progressStage: data.progress_stage,
            query: data.query,
            filters: data.filters,
            subQueries: data.sub_queries || [],
            error: data.error_message,
            createdAt: data.created_at,
            completedAt: data.completed_at,
        };
        if (data.status === 'COMPLETED' && data.report_id) {
            result.reportId = data.report_id;
        }
        return result;
    }
    async cancelJob(jobId, orgId) {
        const data = m03_data_store_1.m03DataStore.getJob(jobId, orgId);
        if (!data)
            return null;
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.status)) {
            return { cancelled: false, reason: `Cannot cancel job with status: ${data.status}` };
        }
        m03_data_store_1.m03DataStore.updateJob(jobId, {
            status: 'CANCELLED',
            completed_at: new Date().toISOString(),
        });
        return { cancelled: true };
    }
    async listJobs(orgId, userId, status, limit = 20) {
        const rows = m03_data_store_1.m03DataStore.listJobs(orgId, userId, status, limit);
        const jobs = rows.map((j) => ({
            jobId: j.id,
            status: j.status,
            progressPct: j.progress_pct,
            progressStage: j.progress_stage,
            query: j.query,
            filters: j.filters,
            createdAt: j.created_at,
            completedAt: j.completed_at,
        }));
        return { jobs, total: jobs.length };
    }
    async getActiveJobCount(orgId, userId) {
        return m03_data_store_1.m03DataStore.countActiveJobs(orgId, userId);
    }
    async logAudit(user, eventType, details) {
        m03_data_store_1.m03DataStore.auditLog.push({
            id: (0, uuid_1.v4)(),
            org_id: user.orgId,
            user_id: user.userId,
            event_type: eventType,
            details,
            created_at: new Date().toISOString(),
        });
    }
};
exports.ResearchService = ResearchService;
exports.ResearchService = ResearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ResearchService);
//# sourceMappingURL=research.service.js.map