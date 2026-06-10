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
exports.DealDriversApiController = void 0;
const common_1 = require("@nestjs/common");
const deal_drivers_api_service_1 = require("../services/deal-drivers-api.service");
let DealDriversApiController = class DealDriversApiController {
    dealDrivers;
    constructor(dealDrivers) {
        this.dealDrivers = dealDrivers;
    }
    async list(dealId, boardId) {
        const data = await this.dealDrivers.list({ dealId, boardId });
        return { success: true, data };
    }
    async create(body) {
        const data = await this.dealDrivers.create(body);
        return { success: true, data };
    }
    async getOne(id) {
        const data = await this.dealDrivers.getById(id);
        return { success: true, data };
    }
    async update(id, body) {
        const data = await this.dealDrivers.update(id, body);
        return { success: true, data };
    }
    async remove(id) {
        const data = await this.dealDrivers.remove(id);
        return { success: true, data };
    }
};
exports.DealDriversApiController = DealDriversApiController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('dealId')),
    __param(1, (0, common_1.Query)('boardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealDriversApiController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealDriversApiController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealDriversApiController.prototype, "getOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealDriversApiController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealDriversApiController.prototype, "remove", null);
exports.DealDriversApiController = DealDriversApiController = __decorate([
    (0, common_1.Controller)('api/deal-drivers'),
    __metadata("design:paramtypes", [deal_drivers_api_service_1.DealDriversApiService])
], DealDriversApiController);
//# sourceMappingURL=deal-drivers-api.controller.js.map