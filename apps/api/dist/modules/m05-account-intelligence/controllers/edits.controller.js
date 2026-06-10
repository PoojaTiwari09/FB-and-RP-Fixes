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
exports.EditsController = void 0;
const common_1 = require("@nestjs/common");
const edits_service_1 = require("../services/edits.service");
let EditsController = class EditsController {
    editsService;
    constructor(editsService) {
        this.editsService = editsService;
    }
    async editCompany(hubspotId, body) {
        return this.editsService.editCompany(hubspotId, body.field, body.value, body.role);
    }
    async editDeal(dealId, body) {
        return this.editsService.editDeal(dealId, body.field, body.value, body.role);
    }
    async editSupplementary(companyHubspotId, body) {
        return this.editsService.editSupplementary(companyHubspotId, body.field, body.value, body.role);
    }
};
exports.EditsController = EditsController;
__decorate([
    (0, common_1.Patch)('company/:hubspotId'),
    __param(0, (0, common_1.Param)('hubspotId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EditsController.prototype, "editCompany", null);
__decorate([
    (0, common_1.Patch)('deal/:dealId'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EditsController.prototype, "editDeal", null);
__decorate([
    (0, common_1.Patch)('supplementary/:companyHubspotId'),
    __param(0, (0, common_1.Param)('companyHubspotId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EditsController.prototype, "editSupplementary", null);
exports.EditsController = EditsController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/edits'),
    __metadata("design:paramtypes", [edits_service_1.EditsService])
], EditsController);
//# sourceMappingURL=edits.controller.js.map