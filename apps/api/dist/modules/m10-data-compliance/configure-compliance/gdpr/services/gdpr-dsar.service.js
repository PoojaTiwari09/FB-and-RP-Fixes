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
var GdprDsarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprDsarService = void 0;
const common_1 = require("@nestjs/common");
const gdpr_repository_1 = require("../repositories/gdpr.repository");
let GdprDsarService = GdprDsarService_1 = class GdprDsarService {
    repo;
    logger = new common_1.Logger(GdprDsarService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async createDsar(tenantId, dto) {
        this.logger.log(`Creating DSAR for tenant=${tenantId} email=${dto.contactEmail} type=${dto.requestType}`);
        return this.repo.createDsar(tenantId, dto);
    }
    async updateDsarStatus(tenantId, id, dto) {
        this.logger.log(`Updating DSAR status for id=${id} to ${dto.status}`);
        return this.repo.updateDsarStatus(tenantId, id, dto);
    }
    async getDsars(tenantId, contactEmail) {
        return this.repo.getDsars(tenantId, contactEmail);
    }
};
exports.GdprDsarService = GdprDsarService;
exports.GdprDsarService = GdprDsarService = GdprDsarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gdpr_repository_1.GdprRepository])
], GdprDsarService);
//# sourceMappingURL=gdpr-dsar.service.js.map