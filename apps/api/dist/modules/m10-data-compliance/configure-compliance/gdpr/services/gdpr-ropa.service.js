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
var GdprRopaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprRopaService = void 0;
const common_1 = require("@nestjs/common");
const gdpr_repository_1 = require("../repositories/gdpr.repository");
let GdprRopaService = GdprRopaService_1 = class GdprRopaService {
    repo;
    logger = new common_1.Logger(GdprRopaService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async createRopa(tenantId, dto) {
        return this.repo.createRopa(tenantId, dto);
    }
    async getRopas(tenantId) {
        return this.repo.getRopas(tenantId);
    }
    async createDataBreach(tenantId, dto) {
        return this.repo.createDataBreach(tenantId, dto);
    }
    async updateDataBreachStatus(tenantId, id, dto) {
        return this.repo.updateDataBreachStatus(tenantId, id, dto);
    }
    async getDataBreaches(tenantId) {
        return this.repo.getDataBreaches(tenantId);
    }
};
exports.GdprRopaService = GdprRopaService;
exports.GdprRopaService = GdprRopaService = GdprRopaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gdpr_repository_1.GdprRepository])
], GdprRopaService);
//# sourceMappingURL=gdpr-ropa.service.js.map