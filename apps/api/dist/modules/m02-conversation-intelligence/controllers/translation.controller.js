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
exports.TranslationController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const translation_service_1 = require("../services/translation.service");
let TranslationController = class TranslationController {
    translationService;
    constructor(translationService) {
        this.translationService = translationService;
    }
    async translateContent(req, body) {
        try {
            if (body.entityType && body.entityId) {
                const translated = await this.translationService.getTranslatedEntity(req.tenantId, body.entityType, body.entityId, body.sourceLang || 'en', body.targetLang, body.text);
                return { translatedText: translated };
            }
            const translated = await this.translationService.translate(body.text, body.sourceLang || 'en', body.targetLang);
            return { translatedText: translated };
        }
        catch (err) {
            throw new common_1.HttpException({ message: 'Translation failed', detail: err?.message ?? String(err) }, common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async getSettings(req) {
        return this.translationService.getWorkspaceSettings(req.tenantId);
    }
    async updateSettings(req, body) {
        return this.translationService.updateWorkspaceSettings(req.tenantId, body);
    }
};
exports.TranslationController = TranslationController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "translateContent", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "updateSettings", null);
exports.TranslationController = TranslationController = __decorate([
    (0, common_1.Controller)('api/v1/m02-conversation-intelligence/translate'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [translation_service_1.TranslationService])
], TranslationController);
//# sourceMappingURL=translation.controller.js.map