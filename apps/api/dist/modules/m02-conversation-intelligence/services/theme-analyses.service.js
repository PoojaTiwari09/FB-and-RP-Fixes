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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeAnalysesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let ThemeAnalysesService = class ThemeAnalysesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAnalysis(tenantId, userId, dto) {
        if (!dto.businessQuestion) {
            throw new common_1.BadRequestException('Business question is required');
        }
        return {
            success: true,
            analysisId: 'mock-123',
            status: 'queued',
            message: 'Theme analysis job has been queued. (Fallback Mode)',
        };
    }
    async getAnalysis(tenantId, id) {
        return {
            analysisId: id,
            tenantId,
            businessQuestion: 'What are the main objections for pricing?',
            filters: {},
            status: 'completed',
            callCountAnalyzed: 150,
            createdAt: new Date(),
            themes: [
                {
                    themeId: 't1',
                    name: 'Pricing Pushback',
                    summary: 'Customers are expressing concern over the recent price increase, asking for legacy discounts.',
                    callCount: 45,
                    accountCount: 30,
                    associatedRevenue: 150000.00,
                },
                {
                    themeId: 't2',
                    name: 'Integration Requests',
                    summary: 'Frequent requests for native integration with popular CRMs like Salesforce and HubSpot.',
                    callCount: 28,
                    accountCount: 25,
                    associatedRevenue: 85000.00,
                },
            ],
        };
    }
    async simulateProcessing(analysisId, tenantId) {
    }
};
exports.ThemeAnalysesService = ThemeAnalysesService;
exports.ThemeAnalysesService = ThemeAnalysesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ThemeAnalysesService);
//# sourceMappingURL=theme-analyses.service.js.map