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
exports.CallsController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const call_service_1 = require("../services/call.service");
const next_steps_repository_1 = require("../repositories/next-steps.repository");
const m01_schema_1 = require("../schemas/m01.schema");
const s3_recordings_catalog_1 = require("../services/s3-recordings-catalog");
let CallsController = class CallsController {
    svc;
    nextSteps;
    constructor(svc, nextSteps) {
        this.svc = svc;
        this.nextSteps = nextSteps;
    }
    listCalls(query, req) {
        const parsed = m01_schema_1.ListCallsQuerySchema.parse(query);
        return this.svc.listCalls(req.tenantId, parsed);
    }
    createCall(body, req) {
        const dto = m01_schema_1.CreateCallSchema.parse(body);
        return this.svc.createCall(dto, req.tenantId);
    }
    searchTranscripts(query, req) {
        const parsed = m01_schema_1.SearchQuerySchema.parse(query);
        return this.svc.searchTranscripts(req.tenantId, parsed);
    }
    listS3Recordings() {
        return {
            recordings: s3_recordings_catalog_1.S3_RECORDINGS_CATALOG.map(({ id, displayName, sourceUrl }) => ({
                id,
                displayName,
                sourceUrl,
            })),
        };
    }
    uploadFromS3(body, req) {
        const parsed = m01_schema_1.UploadFromS3Schema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((i) => i.message).join('; ') ||
                'Invalid recordingId (use 2min_sales or 3mins_sales)');
        }
        return this.svc.createCallFromS3Recording(parsed.data, req.tenantId);
    }
    getCall(id, req) {
        return this.svc.getCallDetail(id, req.tenantId);
    }
    deleteCall(id, req) {
        return this.svc.deleteCall(id, req.tenantId);
    }
    extractAi(id, req) {
        return this.svc.triggerAiExtraction(id, req.tenantId);
    }
    searchWithinCall(id, query, req) {
        const parsed = m01_schema_1.SearchQuerySchema.parse(query);
        return this.svc.searchWithinCall(id, req.tenantId, parsed);
    }
    createNote(id, body, req) {
        const dto = m01_schema_1.CreateNoteSchema.parse(body);
        return this.svc.createNote(id, req.tenantId, req.userId ?? 'anonymous', dto);
    }
    updateNote(noteId, body, req) {
        const dto = m01_schema_1.UpdateNoteSchema.parse(body);
        return this.svc.updateNote(noteId, req.tenantId, dto);
    }
    deleteNote(noteId, req) {
        return this.svc.deleteNote(noteId, req.tenantId);
    }
    shareCall(id, body, req) {
        const dto = m01_schema_1.ShareCallSchema.parse(body);
        return this.svc.shareCall(id, req.tenantId, req.userId ?? 'anonymous', dto);
    }
    updateUtterance(id, body, req) {
        const dto = m01_schema_1.UpdateUtteranceSchema.parse(body);
        return this.svc.updateUtterance(id, req.tenantId, dto.text);
    }
    getNextSteps(callId, req) {
        return this.nextSteps.findByCallId(callId, req.tenantId);
    }
    addNextStep(callId, body, req) {
        const dto = m01_schema_1.AddNextStepSchema.parse(body);
        return this.nextSteps.addNextStep(callId, req.tenantId, dto.step);
    }
    updateNextStep(callId, body, req) {
        const dto = m01_schema_1.UpdateNextStepSchema.parse(body);
        return this.nextSteps.updateNextStep(callId, req.tenantId, dto.index, dto.step);
    }
    deleteNextStep(callId, index, req) {
        const dto = m01_schema_1.DeleteNextStepSchema.parse({ index });
        return this.nextSteps.deleteNextStep(callId, req.tenantId, dto.index);
    }
};
exports.CallsController = CallsController;
__decorate([
    (0, common_1.Get)('calls'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "listCalls", null);
__decorate([
    (0, common_1.Post)('calls'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "createCall", null);
__decorate([
    (0, common_1.Get)('calls/search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "searchTranscripts", null);
__decorate([
    (0, common_1.Get)('calls/s3-recordings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "listS3Recordings", null);
__decorate([
    (0, common_1.Post)('calls/upload-from-s3'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "uploadFromS3", null);
__decorate([
    (0, common_1.Get)('calls/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "getCall", null);
__decorate([
    (0, common_1.Delete)('calls/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "deleteCall", null);
__decorate([
    (0, common_1.Post)('calls/:id/extract-ai'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "extractAi", null);
__decorate([
    (0, common_1.Get)('calls/:id/search'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "searchWithinCall", null);
__decorate([
    (0, common_1.Post)('calls/:id/notes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "createNote", null);
__decorate([
    (0, common_1.Put)('calls/:id/notes/:noteId'),
    __param(0, (0, common_1.Param)('noteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "updateNote", null);
__decorate([
    (0, common_1.Delete)('calls/:id/notes/:noteId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('noteId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "deleteNote", null);
__decorate([
    (0, common_1.Post)('calls/:id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "shareCall", null);
__decorate([
    (0, common_1.Patch)('utterances/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "updateUtterance", null);
__decorate([
    (0, common_1.Get)('calls/:id/next-steps'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "getNextSteps", null);
__decorate([
    (0, common_1.Post)('calls/:id/next-steps'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "addNextStep", null);
__decorate([
    (0, common_1.Patch)('calls/:id/next-steps'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "updateNextStep", null);
__decorate([
    (0, common_1.Delete)('calls/:id/next-steps/:index'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('index')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "deleteNextStep", null);
exports.CallsController = CallsController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [call_service_1.CallService,
        next_steps_repository_1.NextStepsRepository])
], CallsController);
//# sourceMappingURL=calls.controller.js.map