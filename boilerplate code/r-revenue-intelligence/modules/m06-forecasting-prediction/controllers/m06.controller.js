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
exports.M06ForecastingPredictionController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m06_service_1 = require("../services/m06.service");
let M06ForecastingPredictionController = class M06ForecastingPredictionController {
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        return this.service.findAll(req.tenantId);
    }
    create(dto, req) {
        return this.service.create(dto, req.tenantId);
    }
};
exports.M06ForecastingPredictionController = M06ForecastingPredictionController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M06ForecastingPredictionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M06ForecastingPredictionController.prototype, "create", null);
exports.M06ForecastingPredictionController = M06ForecastingPredictionController = __decorate([
    (0, common_1.Controller)('api/v1/forecasting-prediction'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m06_service_1.M06ForecastingPredictionService])
], M06ForecastingPredictionController);
