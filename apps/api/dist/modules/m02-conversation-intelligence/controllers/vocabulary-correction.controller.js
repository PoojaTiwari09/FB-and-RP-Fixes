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
exports.VocabularyCorrectionController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const vocabulary_correction_service_1 = require("../services/vocabulary-correction.service");
let VocabularyCorrectionController = class VocabularyCorrectionController {
    vocabService;
    constructor(vocabService) {
        this.vocabService = vocabService;
    }
    async createRule(req, body) {
        return this.vocabService.createRule(req.tenantId, body.incorrectTerm, body.correctTerm, body.language, body.category, body.mispronunciations, body.variations);
    }
    async getRules(req) {
        return this.vocabService.getRules(req.tenantId);
    }
    async getStats(req) {
        return this.vocabService.getStats(req.tenantId);
    }
    async deleteRule(req, id) {
        return this.vocabService.deleteRule(id, req.tenantId);
    }
};
exports.VocabularyCorrectionController = VocabularyCorrectionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VocabularyCorrectionController.prototype, "createRule", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VocabularyCorrectionController.prototype, "getRules", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VocabularyCorrectionController.prototype, "getStats", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VocabularyCorrectionController.prototype, "deleteRule", null);
exports.VocabularyCorrectionController = VocabularyCorrectionController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/vocabulary'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [vocabulary_correction_service_1.VocabularyCorrectionService])
], VocabularyCorrectionController);
//# sourceMappingURL=vocabulary-correction.controller.js.map