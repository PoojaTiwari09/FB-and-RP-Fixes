"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EPrivacyModule = void 0;
const common_1 = require("@nestjs/common");
const eprivacy_controller_1 = require("./controllers/eprivacy.controller");
const eprivacy_service_1 = require("./services/eprivacy.service");
const eprivacy_repository_1 = require("./repositories/eprivacy.repository");
const prisma_module_1 = require("../../database/prisma.module");
let EPrivacyModule = class EPrivacyModule {
};
exports.EPrivacyModule = EPrivacyModule;
exports.EPrivacyModule = EPrivacyModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [eprivacy_controller_1.EPrivacyController],
        providers: [eprivacy_service_1.EPrivacyService, eprivacy_repository_1.EPrivacyRepository],
        exports: [eprivacy_service_1.EPrivacyService, eprivacy_repository_1.EPrivacyRepository],
    })
], EPrivacyModule);
//# sourceMappingURL=eprivacy.module.js.map