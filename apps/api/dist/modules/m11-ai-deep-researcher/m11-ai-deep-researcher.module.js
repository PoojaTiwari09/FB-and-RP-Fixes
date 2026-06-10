"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M11AiDeepResearcherModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./database/prisma.service");
const ai_deep_researcher_service_1 = require("./services/ai-deep-researcher.service");
const ai_deep_researcher_controller_1 = require("./controllers/ai-deep-researcher.controller");
let M11AiDeepResearcherModule = class M11AiDeepResearcherModule {
};
exports.M11AiDeepResearcherModule = M11AiDeepResearcherModule;
exports.M11AiDeepResearcherModule = M11AiDeepResearcherModule = __decorate([
    (0, common_1.Module)({
        controllers: [ai_deep_researcher_controller_1.AiDeepResearcherController],
        providers: [ai_deep_researcher_service_1.AiDeepResearcherService, prisma_service_1.PrismaService],
        exports: [ai_deep_researcher_service_1.AiDeepResearcherService],
    })
], M11AiDeepResearcherModule);
//# sourceMappingURL=m11-ai-deep-researcher.module.js.map