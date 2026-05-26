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
const m01_schema_1 = require("../schemas/m01.schema");
let CallsController = class CallsController {
    constructor(svc) {
        this.svc = svc;
    }
    listCalls(query, req) {
        const parsed = m01_schema_1.ListCallsQuerySchema.parse(query);
        return this.svc.listCalls(req.tenantId, parsed);
    }
    createCall(body, req) {
        const dto = m01_schema_1.CreateCallSchema.parse(body);
        return this.svc.createCall(dto, req.tenantId);
    }
    getCall(id, req) {
        return this.svc.getCallDetail(id, req.tenantId);
    }
    searchTranscripts(query, req) {
        const parsed = m01_schema_1.SearchQuerySchema.parse(query);
        return this.svc.searchTranscripts(req.tenantId, parsed);
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
    (0, common_1.Get)('calls/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "getCall", null);
__decorate([
    (0, common_1.Get)('calls/search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CallsController.prototype, "searchTranscripts", null);
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
exports.CallsController = CallsController = __decorate([
    (0, common_1.Controller)('api/v1/capture-transcription'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [call_service_1.CallService])
], CallsController);
