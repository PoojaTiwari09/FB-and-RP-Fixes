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
exports.ThemeSpotterController = exports.ThemeAnalysesController = void 0;
const common_1 = require("@nestjs/common");
const theme_analyses_service_1 = require("../services/theme-analyses.service");
const prisma_service_1 = require("../database/prisma.service");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
let ThemeAnalysesController = class ThemeAnalysesController {
    themeAnalysesService;
    constructor(themeAnalysesService) {
        this.themeAnalysesService = themeAnalysesService;
    }
    async createThemeAnalysis(req, body) {
        return this.themeAnalysesService.createAnalysis(req.tenantId, req.userId, body);
    }
    async getThemeAnalysis(req, id) {
        return this.themeAnalysesService.getAnalysis(req.tenantId, id);
    }
};
exports.ThemeAnalysesController = ThemeAnalysesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ThemeAnalysesController.prototype, "createThemeAnalysis", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeAnalysesController.prototype, "getThemeAnalysis", null);
exports.ThemeAnalysesController = ThemeAnalysesController = __decorate([
    (0, common_1.Controller)('api/v1/m02-conversation-intelligence/theme-analyses'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [theme_analyses_service_1.ThemeAnalysesService])
], ThemeAnalysesController);
let ThemeSpotterController = class ThemeSpotterController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async fetchThemes(req) {
        return this.prisma.themeAnalysis.findMany({
            where: { tenantid: req.tenantId },
        });
    }
    async fetchThemeById(req, id) {
        const theme = await this.prisma.themeAnalysis.findFirst({
            where: { id, tenantid: req.tenantId },
        });
        if (!theme)
            throw new common_1.NotFoundException('Theme not found');
        return theme;
    }
    async fetchThemeTrend(req, id) {
        return [{ label: 'Jan', value: 10 }, { label: 'Feb', value: 15 }];
    }
    async fetchThemeRepBreakdown(req, id) {
        return [{ id: 'r1', name: 'John Doe', initials: 'JD', count: 5 }];
    }
    async fetchThemeStageBreakdown(req, id) {
        return [{ stage: 'Discovery', count: 10, percentage: 50 }];
    }
    async fetchThemeQuotes(req, id) {
        const quotes = await this.prisma.themeQuote.findMany({
            where: { themeAnalysisId: id, tenantid: req.tenantId },
            include: { call: true }
        });
        return quotes.map((q) => ({
            id: q.id,
            quote: q.quoteText,
            company: q.company || 'Unknown',
            callName: q.callName || q.call?.title || 'Unknown Call',
            timestamp: `${Math.floor(q.timestampMs / 60000)}:${String(Math.floor((q.timestampMs % 60000) / 1000)).padStart(2, '0')}`
        }));
    }
    async fetchThemeCalls(req, id) {
        const mappings = await this.prisma.themeCallMapping.findMany({
            where: { themeAnalysisId: id, tenantid: req.tenantId },
            include: { call: true }
        });
        return mappings.map((m) => m.call);
    }
    async fetchCallDetails(req, callId) {
        const call = await this.prisma.callRecord.findFirst({
            where: { id: callId, tenantid: req.tenantId },
            include: { transcript: true }
        });
        if (!call)
            throw new common_1.NotFoundException('Call not found');
        return call;
    }
    async fetchCallSummary(req, callId) {
        const call = await this.prisma.callRecord.findFirst({
            where: { id: callId, tenantid: req.tenantId },
            include: { transcript: true }
        });
        if (!call || !call.transcript)
            return {};
        return { content: call.transcript.summary };
    }
    async fetchCallTranscript(req, callId) {
        const transcript = await this.prisma.transcript.findFirst({
            where: { callId: callId, tenantid: req.tenantId },
            include: { utterances: { orderBy: { sequenceIndex: 'asc' } } }
        });
        if (!transcript)
            return [];
        return transcript.utterances.map((u) => ({
            speaker: u.speaker,
            text: u.text
        }));
    }
    async fetchCallScorecard(req, callId) {
        return { score: 0 };
    }
    async fetchCallAudio(req, callId) {
        const call = await this.prisma.callRecord.findFirst({
            where: { id: callId, tenantid: req.tenantId }
        });
        return { audioUrl: call?.audioUrl || '' };
    }
    async exportThemeSpotter(req, body) {
        return { success: true, message: 'Export successful' };
    }
};
exports.ThemeSpotterController = ThemeSpotterController;
__decorate([
    (0, common_1.Get)('themes'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemes", null);
__decorate([
    (0, common_1.Get)('themes/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemeById", null);
__decorate([
    (0, common_1.Get)('themes/:id/trend'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemeTrend", null);
__decorate([
    (0, common_1.Get)('themes/:id/rep-breakdown'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemeRepBreakdown", null);
__decorate([
    (0, common_1.Get)('themes/:id/stage-breakdown'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemeStageBreakdown", null);
__decorate([
    (0, common_1.Get)('themes/:id/quotes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemeQuotes", null);
__decorate([
    (0, common_1.Get)('themes/:id/calls'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchThemeCalls", null);
__decorate([
    (0, common_1.Get)('calls/:callId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchCallDetails", null);
__decorate([
    (0, common_1.Get)('calls/:callId/summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchCallSummary", null);
__decorate([
    (0, common_1.Get)('calls/:callId/transcript'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchCallTranscript", null);
__decorate([
    (0, common_1.Get)('calls/:callId/scorecard'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchCallScorecard", null);
__decorate([
    (0, common_1.Get)('calls/:callId/audio'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "fetchCallAudio", null);
__decorate([
    (0, common_1.Post)('export'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ThemeSpotterController.prototype, "exportThemeSpotter", null);
exports.ThemeSpotterController = ThemeSpotterController = __decorate([
    (0, common_1.Controller)('api/theme-spotter'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ThemeSpotterController);
//# sourceMappingURL=theme-analyses.controller.js.map