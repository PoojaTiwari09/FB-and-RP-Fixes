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
exports.M10TestController = void 0;
const common_1 = require("@nestjs/common");
const revenue_graph_service_1 = require("../revenue-graph/services/revenue-graph.service");
const prisma_service_1 = require("../database/prisma.service");
const entity_resolution_engine_1 = require("../revenue-graph/entity-resolution/entity-resolution.engine");
const { seedM10Demo } = require("../../../scripts/seed_m10_demo.cjs");
let M10TestController = class M10TestController {
    graph;
    prisma;
    constructor(graph, prisma) {
        this.graph = graph;
        this.prisma = prisma;
    }
    health() {
        return { success: true, module: "m10-data-compliance", status: "ok" };
    }
    smoke() {
        const ranked = (0, entity_resolution_engine_1.rankAccountCandidates)("Acme Corporation", "acme.com", [
            { id: "1", name: "Acme Corp", domain: "acme.com" },
            { id: "2", name: "Beta LLC", domain: "beta.io" },
        ]);
        const { best, ambiguous } = (0, entity_resolution_engine_1.pickBestCandidate)(ranked);
        return {
            success: true,
            module: "m10-data-compliance",
            entityResolution: {
                similarity: (0, entity_resolution_engine_1.stringSimilarity)("Acme Corporation", "Acme Corp"),
                bestMatch: best,
                ambiguous,
            },
            checks: ["entity-engine", "export-pipeline", "warehouse-hooks"],
        };
    }
    async accounts(req) {
        const tenantId = req.headers["x-tenant-id"] || "00000000-0000-0000-0000-000000000001";
        return this.graph.getAccounts(tenantId, { limit: 5 });
    }
    async seed() {
        return seedM10Demo(this.prisma);
    }
};
exports.M10TestController = M10TestController;
__decorate([
    (0, common_1.Get)("health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M10TestController.prototype, "health", null);
__decorate([
    (0, common_1.Post)("smoke"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M10TestController.prototype, "smoke", null);
__decorate([
    (0, common_1.Get)("accounts"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M10TestController.prototype, "accounts", null);
__decorate([
    (0, common_1.Post)("seed"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M10TestController.prototype, "seed", null);
exports.M10TestController = M10TestController = __decorate([
    (0, common_1.Controller)("api/v1/m10-data-compliance/test"),
    __metadata("design:paramtypes", [revenue_graph_service_1.RevenueGraphService,
        prisma_service_1.PrismaService])
], M10TestController);
//# sourceMappingURL=m10-test.controller.js.map