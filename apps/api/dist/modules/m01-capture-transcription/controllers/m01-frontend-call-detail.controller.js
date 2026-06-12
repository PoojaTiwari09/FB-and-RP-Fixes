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
exports.M01FrontendBriefPeriodsController = exports.M01FrontendBriefTemplatesController = exports.M01FrontendCallDetailController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const notes_repository_1 = require("../repositories/notes.repository");
const m01_frontend_transcript_service_1 = require("../services/m01-frontend-transcript.service");
const m01_frontend_call_processing_service_1 = require("../services/m01-frontend-call-processing.service");
const m01_frontend_calls_service_1 = require("../services/m01-frontend-calls.service");
let M01FrontendCallDetailController = class M01FrontendCallDetailController {
    svc;
    processing;
    callsUi;
    notesRepo;
    constructor(svc, processing, callsUi, notesRepo) {
        this.svc = svc;
        this.processing = processing;
        this.callsUi = callsUi;
        this.notesRepo = notesRepo;
    }
    getMetadata(callId, req) {
        return this.callsUi.getCallMetadata(callId, req.tenantId);
    }
    getProcessStatus(callId, req) {
        return this.processing.getStatus(callId, req.tenantId);
    }
    processCall(callId, req) {
        return this.processing.processCall(callId, req.tenantId);
    }
    getTranscript(callId, query, req) {
        return this.svc.getTranscript(callId, req.tenantId, query);
    }
    getSummary(callId, req) {
        return this.svc.getSummary(callId, req.tenantId);
    }
    getTalkRatio(callId, req) {
        return this.svc.getTalkRatio(callId, req.tenantId);
    }
    getAudio(callId, req) {
        return this.svc.getAudio(callId, req.tenantId);
    }
    getTopics(callId, req) {
        return this.svc.getTopics(callId, req.tenantId);
    }
    getNextSteps(callId, req) {
        return this.svc.getNextSteps(callId, req.tenantId);
    }
    patchNextStep(callId, stepId, body, req) {
        return this.svc.patchNextStep(callId, stepId, req.tenantId, body);
    }
    listBriefs(callId, query, req) {
        return this.svc.listBriefs(callId, req.tenantId, query);
    }
    getBrief(callId, briefId, req) {
        return this.svc.getBrief(callId, briefId, req.tenantId);
    }
    generateBrief(callId, body, req) {
        return this.svc.generateBrief(callId, req.tenantId, body);
    }
    regenerateBrief(callId, _briefId, req) {
        return this.processing.processCall(callId, req.tenantId);
    }
    shareLink(callId, briefId) {
        return this.svc.shareLink(callId, briefId);
    }
    shareInternal(callId, briefId, body) {
        return this.svc.shareInternal(callId, briefId, body);
    }
    exportPdf(callId, briefId) {
        return this.svc.exportPdf(callId, briefId);
    }
    formattedSummary(callId, briefId, req) {
        return this.svc.formattedSummary(callId, briefId, req.tenantId);
    }
    async getNotes(callId, req) {
        const currentUserId = req.user?.sub || req.user?.id || req.userId;
        const tenantId = req.tenantId || req.user?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('Tenant context required');
        const notes = await this.notesRepo.findByCallId(callId, tenantId, currentUserId);
        return {
            data: notes.map((n) => ({
                noteId: n.id,
                callId: n.callId,
                note: n.content,
                userId: n.authorId,
                timestamp: n.createdAt.toISOString(),
                createdAt: n.createdAt.toISOString(),
            })),
        };
    }
    async createNote(callId, body, req) {
        const noteText = body.note || body.content;
        if (!noteText) {
            throw new common_1.BadRequestException('Note content is required');
        }
        const authorId = body.userId || req.user?.sub || req.user?.id || req.userId;
        const tenantId = req.tenantId || req.user?.tenantId;
        if (!tenantId || !authorId)
            throw new common_1.BadRequestException('Authentication required');
        const created = await this.notesRepo.create(callId, tenantId, authorId, { content: noteText });
        return {
            data: {
                noteId: created.id,
                callId: created.callId,
                note: created.content,
                userId: created.authorId,
                timestamp: created.createdAt.toISOString(),
                createdAt: created.createdAt.toISOString(),
            },
        };
    }
};
exports.M01FrontendCallDetailController = M01FrontendCallDetailController;
__decorate([
    (0, common_1.Get)('metadata'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getMetadata", null);
__decorate([
    (0, common_1.Get)('process-status'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getProcessStatus", null);
__decorate([
    (0, common_1.Post)('process'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "processCall", null);
__decorate([
    (0, common_1.Get)('transcript'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getTranscript", null);
__decorate([
    (0, common_1.Get)('transcript/summary'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('transcript/talk-ratio'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getTalkRatio", null);
__decorate([
    (0, common_1.Get)('transcript/audio'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getAudio", null);
__decorate([
    (0, common_1.Get)('transcript/topics'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Get)('next-steps'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getNextSteps", null);
__decorate([
    (0, common_1.Patch)('next-steps/:stepId'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('stepId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "patchNextStep", null);
__decorate([
    (0, common_1.Get)('briefs'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "listBriefs", null);
__decorate([
    (0, common_1.Get)('briefs/:briefId'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('briefId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "getBrief", null);
__decorate([
    (0, common_1.Post)('briefs'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "generateBrief", null);
__decorate([
    (0, common_1.Post)('briefs/:briefId/regenerate'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('briefId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "regenerateBrief", null);
__decorate([
    (0, common_1.Post)('briefs/:briefId/share-link'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('briefId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "shareLink", null);
__decorate([
    (0, common_1.Post)('briefs/:briefId/share-internal'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('briefId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "shareInternal", null);
__decorate([
    (0, common_1.Get)('briefs/:briefId/export/pdf'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('briefId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Get)('briefs/:briefId/formatted-summary'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Param)('briefId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M01FrontendCallDetailController.prototype, "formattedSummary", null);
__decorate([
    (0, common_1.Get)('notes'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendCallDetailController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Post)('notes'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendCallDetailController.prototype, "createNote", null);
exports.M01FrontendCallDetailController = M01FrontendCallDetailController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/calls/:callId'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_transcript_service_1.M01FrontendTranscriptService,
        m01_frontend_call_processing_service_1.M01FrontendCallProcessingService,
        m01_frontend_calls_service_1.M01FrontendCallsService,
        notes_repository_1.NotesRepository])
], M01FrontendCallDetailController);
let M01FrontendBriefTemplatesController = class M01FrontendBriefTemplatesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list() {
        return this.svc.getBriefTemplates();
    }
};
exports.M01FrontendBriefTemplatesController = M01FrontendBriefTemplatesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M01FrontendBriefTemplatesController.prototype, "list", null);
exports.M01FrontendBriefTemplatesController = M01FrontendBriefTemplatesController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/brief-templates'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_transcript_service_1.M01FrontendTranscriptService])
], M01FrontendBriefTemplatesController);
let M01FrontendBriefPeriodsController = class M01FrontendBriefPeriodsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list() {
        return this.svc.getBriefPeriods();
    }
};
exports.M01FrontendBriefPeriodsController = M01FrontendBriefPeriodsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M01FrontendBriefPeriodsController.prototype, "list", null);
exports.M01FrontendBriefPeriodsController = M01FrontendBriefPeriodsController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription/brief-periods'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m01_frontend_transcript_service_1.M01FrontendTranscriptService])
], M01FrontendBriefPeriodsController);
//# sourceMappingURL=m01-frontend-call-detail.controller.js.map