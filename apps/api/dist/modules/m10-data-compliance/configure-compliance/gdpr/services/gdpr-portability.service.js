"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GdprPortabilityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprPortabilityService = void 0;
const common_1 = require("@nestjs/common");
let GdprPortabilityService = GdprPortabilityService_1 = class GdprPortabilityService {
    logger = new common_1.Logger(GdprPortabilityService_1.name);
    async generatePortabilityExport(tenantId, contactEmail) {
        this.logger.log(`Generating data portability export for tenant=${tenantId} email=${contactEmail}`);
        return {
            success: true,
            data: {
                contact: { email: contactEmail, name: "Redacted" },
                activities: [],
            },
        };
    }
};
exports.GdprPortabilityService = GdprPortabilityService;
exports.GdprPortabilityService = GdprPortabilityService = GdprPortabilityService_1 = __decorate([
    (0, common_1.Injectable)()
], GdprPortabilityService);
//# sourceMappingURL=gdpr-portability.service.js.map