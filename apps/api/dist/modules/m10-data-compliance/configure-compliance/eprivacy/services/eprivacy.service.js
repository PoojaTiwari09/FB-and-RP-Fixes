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
var EPrivacyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EPrivacyService = void 0;
const common_1 = require("@nestjs/common");
const eprivacy_repository_1 = require("../repositories/eprivacy.repository");
let EPrivacyService = EPrivacyService_1 = class EPrivacyService {
    repo;
    logger = new common_1.Logger(EPrivacyService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async updateConsent(tenantId, dto) {
        this.logger.log(`Updating ePrivacy consent for ${dto.contactEmail} channel=${dto.channel} purpose=${dto.purpose} status=${dto.status}`);
        return this.repo.updateConsent(tenantId, dto);
    }
    async checkConsent(tenantId, contactEmail, channel, purpose) {
        return this.repo.getConsentStatus(tenantId, contactEmail, channel, purpose);
    }
    async addSuppression(tenantId, dto) {
        this.logger.log(`Adding suppression for ${dto.contactEmail} reason=${dto.reason}`);
        return this.repo.addSuppression(tenantId, dto);
    }
    async checkSuppression(tenantId, contactEmail) {
        return this.repo.checkSuppression(tenantId, contactEmail);
    }
};
exports.EPrivacyService = EPrivacyService;
exports.EPrivacyService = EPrivacyService = EPrivacyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [eprivacy_repository_1.EPrivacyRepository])
], EPrivacyService);
//# sourceMappingURL=eprivacy.service.js.map