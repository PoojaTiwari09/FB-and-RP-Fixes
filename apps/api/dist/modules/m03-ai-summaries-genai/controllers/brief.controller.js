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
exports.BriefCompatController = exports.BriefController = void 0;
const common_1 = require("@nestjs/common");
const brief_service_1 = require("../services/brief.service");
const auth_guard_1 = require("../guards/auth.guard");
let BriefController = class BriefController {
    briefService;
    constructor(briefService) {
        this.briefService = briefService;
    }
    getBrief(briefType, entityId, req) {
        return this.briefService.getBrief(req.user.orgId, briefType, entityId);
    }
    generateBrief(briefType, entityId, req) {
        return this.briefService.generateBrief(req.user.orgId, briefType, entityId);
    }
};
exports.BriefController = BriefController;
__decorate([
    (0, common_1.Get)(':briefType/:entityId'),
    __param(0, (0, common_1.Param)('briefType')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BriefController.prototype, "getBrief", null);
__decorate([
    (0, common_1.Post)(':briefType/:entityId/generate'),
    __param(0, (0, common_1.Param)('briefType')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BriefController.prototype, "generateBrief", null);
exports.BriefController = BriefController = __decorate([
    (0, common_1.Controller)('api/v1/ai-summaries-genai/briefs'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [brief_service_1.BriefService])
], BriefController);
let BriefCompatController = class BriefCompatController {
    briefService;
    constructor(briefService) {
        this.briefService = briefService;
    }
    generateLegacy(typeBrief, entityId, req) {
        const briefType = typeBrief.replace(/-brief$/i, '');
        return this.briefService.generateBrief(req.user.orgId, briefType, entityId);
    }
};
exports.BriefCompatController = BriefCompatController;
__decorate([
    (0, common_1.Post)(':typeBrief/:entityId'),
    __param(0, (0, common_1.Param)('typeBrief')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BriefCompatController.prototype, "generateLegacy", null);
exports.BriefCompatController = BriefCompatController = __decorate([
    (0, common_1.Controller)('api/ai-summaries'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [brief_service_1.BriefService])
], BriefCompatController);
//# sourceMappingURL=brief.controller.js.map