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
var DealBoardsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealBoardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../platform-core/decorators/roles.decorator");
const prisma_service_1 = require("../database/prisma.service");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
let DealBoardsController = DealBoardsController_1 = class DealBoardsController {
    prisma;
    logger = new common_1.Logger(DealBoardsController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBoardsFromDb(tenantId) {
        const boards = [
            {
                boardId: 'board-1',
                name: 'My Deals',
                description: 'Personal deal tracking and management',
                owner: 'John Smith',
                canEdit: true,
            },
            {
                boardId: 'board-2',
                name: 'Enterprise Deals Q2',
                description: 'All enterprise opportunities for Q2 2026',
                owner: 'Sarah Chen',
                canEdit: false,
            },
            {
                boardId: 'board-3',
                name: 'Team Pipeline - West',
                description: 'Western region team pipeline overview',
                owner: 'Michael Rodriguez',
                canEdit: false,
            },
            {
                boardId: 'board-4',
                name: 'Strategic Accounts',
                description: 'High-value strategic account opportunities',
                owner: 'Jennifer Kim',
                canEdit: true,
            },
        ];
        return Promise.all(boards.map(async (b) => {
            const latestDeal = await this.prisma.deal.findFirst({
                where: { tenantid: tenantId, pipeline: b.boardId },
                orderBy: { updatedAt: 'desc' },
            });
            return {
                ...b,
                lastModified: latestDeal?.updatedAt?.toISOString() || new Date().toISOString(),
            };
        }));
    }
    async getDealBoards(req) {
        try {
            const boards = await this.getBoardsFromDb(req.tenantId);
            return { success: true, data: boards, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to get deal boards:', error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async getBoardDetail(boardId, req, owner) {
        try {
            const boards = await this.getBoardsFromDb(req.tenantId);
            let board = boards.find((b) => b.boardId === boardId);
            if (!board) {
                board = {
                    boardId,
                    name: `Board ${boardId.substring(0, 8)}`,
                    description: 'Dynamic deal tracking and management',
                    owner: 'System Generated',
                    canEdit: true,
                };
            }
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const whereClause = { tenantid: req.tenantId, pipeline: boardId };
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            else if (owner) {
                whereClause.ownerName = { contains: owner, mode: 'insensitive' };
            }
            const deals = await this.prisma.deal.findMany({
                where: whereClause,
            });
            const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
            const summaryCards = categories.map((category) => {
                const catDeals = deals.filter((d) => d.forecastCategory === category);
                const count = catDeals.length;
                const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);
                return {
                    label: category,
                    amount: total,
                    count,
                    changePercent: 12,
                };
            });
            return {
                success: true,
                data: {
                    boardId: board.boardId,
                    name: board.name,
                    ownerTag: `Owner = ${board.owner}`,
                    summaryCards,
                },
                isMock: false,
            };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get board detail for ${boardId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealsByBoard(boardId, req, owner) {
        try {
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const whereClause = { tenantid: req.tenantId, pipeline: boardId };
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            else if (owner) {
                whereClause.ownerName = { contains: owner, mode: 'insensitive' };
            }
            const dbDeals = await this.prisma.deal.findMany({
                where: whereClause,
                orderBy: { name: 'asc' },
            });
            const enrichedDeals = await Promise.all(dbDeals.map(async (d) => {
                const warnings = await this.prisma.dealWarning.findMany({
                    where: { dealId: d.id, status: 'active', tenantid: req.tenantId },
                });
                const criteria = await this.prisma.dealPlaybook.findMany({
                    where: { dealId: d.id, tenantid: req.tenantId },
                });
                const completedCount = criteria.filter((c) => c.status === 'Completed').length;
                const playbookScore = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : d.meddpiccScore || 0;
                const activities = await this.prisma.dealActivityEvent.findMany({
                    where: { dealId: d.id, tenantid: req.tenantId },
                    orderBy: { date: 'asc' },
                });
                const activityOverTime = activities.map((a, idx) => ({
                    dateLabel: a.date.substring(5).toUpperCase().replace('-', ' '),
                    count: 1,
                    interactions: [
                        {
                            id: a.id,
                            type: a.direction === 'inbound' ? 'customer' : 'rep',
                            size: 12,
                            positionPercent: idx * 20,
                        },
                    ],
                }));
                return {
                    dealId: d.id,
                    dealName: d.name,
                    company: d.name.split(' - ')[0],
                    stage: d.stage,
                    amount: Number(d.amount),
                    forecastCategory: d.forecastCategory || 'Open',
                    closeDate: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
                    assignedRep: d.ownerName || 'Lakshmi Prasanna Dara',
                    contacts: d.warningsCount || 2,
                    notificationCount: 0,
                    aiWarningCount: warnings.length,
                    flagCount: d.escalated ? 1 : 0,
                    flagReason: d.escalated ? 'Manager has escalated this deal.' : undefined,
                    activityOverTime,
                    playbookScore,
                    playbookColor: playbookScore >= 75 ? 'green' : playbookScore >= 50 ? 'orange' : 'red',
                    aiSuggestedNextStep: d.nextStep || 'Schedule next stakeholder meeting',
                };
            }));
            return { success: true, data: enrichedDeals, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get deals for board ${boardId}:`, error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
};
exports.DealBoardsController = DealBoardsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealBoardsController.prototype, "getDealBoards", null);
__decorate([
    (0, common_1.Get)(':boardId'),
    __param(0, (0, common_1.Param)('boardId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], DealBoardsController.prototype, "getBoardDetail", null);
__decorate([
    (0, common_1.Get)(':boardId/deals'),
    __param(0, (0, common_1.Param)('boardId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], DealBoardsController.prototype, "getDealsByBoard", null);
exports.DealBoardsController = DealBoardsController = DealBoardsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Deal Boards'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/deal-management/boards'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, roles_decorator_1.Roles)('SALES_REP', 'MANAGER', 'ADMIN', 'ANALYST', 'EXECUTIVE'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealBoardsController);
//# sourceMappingURL=deal-boards.controller.js.map