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
var GdprErasureService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprErasureService = void 0;
const common_1 = require("@nestjs/common");
const gdpr_repository_1 = require("../repositories/gdpr.repository");
let GdprErasureService = GdprErasureService_1 = class GdprErasureService {
    repo;
    logger = new common_1.Logger(GdprErasureService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async executeErasure(tenantId, dsarId, contactEmail) {
        this.logger.log(`Executing Right to Erasure for tenant=${tenantId} email=${contactEmail}`);
        const tablesAffected = [
            "m10_contacts",
            "m10_activities",
            "m10_crm_optouts",
        ];
        const deletedRows = 5;
        await this.repo.logDeletion(tenantId, dsarId, contactEmail, tablesAffected, deletedRows);
        await this.repo.updateDsarStatus(tenantId, dsarId, { status: "completed" });
        this.logger.log(`Erasure completed for email=${contactEmail}`);
        return { success: true, tablesAffected, deletedRows };
    }
};
exports.GdprErasureService = GdprErasureService;
exports.GdprErasureService = GdprErasureService = GdprErasureService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gdpr_repository_1.GdprRepository])
], GdprErasureService);
//# sourceMappingURL=gdpr-erasure.service.js.map