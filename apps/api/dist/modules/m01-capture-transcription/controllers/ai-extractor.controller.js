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
exports.AiExtractorController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const ai_extractor_service_1 = require("../services/ai-extractor.service");
let AiExtractorController = class AiExtractorController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listFields(req) {
        return this.svc.listFields(req.tenantId);
    }
    createField(body, req) {
        return this.svc.createField(req.tenantId, body);
    }
    updateField(id, body, req) {
        return this.svc.updateField(req.tenantId, id, body);
    }
    deleteField(id, req) {
        return this.svc.deleteField(req.tenantId, id);
    }
    toggleField(id, body, req) {
        return this.svc.toggleField(req.tenantId, id, !!body.isActive);
    }
    testField(id, body, req) {
        return this.svc.testField(req.tenantId, id, body.callId);
    }
    getResults(callId, req) {
        return this.svc.getCallResults(req.tenantId, callId);
    }
    runExtract(callId, req) {
        return this.svc.runExtraction(req.tenantId, callId);
    }
};
exports.AiExtractorController = AiExtractorController;
__decorate([
    (0, common_1.Get)('fields'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "listFields", null);
__decorate([
    (0, common_1.Post)('fields'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "createField", null);
__decorate([
    (0, common_1.Patch)('fields/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "updateField", null);
__decorate([
    (0, common_1.Delete)('fields/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "deleteField", null);
__decorate([
    (0, common_1.Post)('fields/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "toggleField", null);
__decorate([
    (0, common_1.Post)('fields/:id/test'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "testField", null);
__decorate([
    (0, common_1.Get)('calls/:callId/results'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "getResults", null);
__decorate([
    (0, common_1.Post)('calls/:callId/extract'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AiExtractorController.prototype, "runExtract", null);
exports.AiExtractorController = AiExtractorController = __decorate([
    (0, common_1.Controller)('api/v1/ai-extractor'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [ai_extractor_service_1.AiExtractorService])
], AiExtractorController);
//# sourceMappingURL=ai-extractor.controller.js.map