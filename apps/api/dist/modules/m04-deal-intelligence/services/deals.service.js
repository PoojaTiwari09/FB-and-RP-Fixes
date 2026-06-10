"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
let DealsService = class DealsService {
    getMockDealBoards() {
        return [
            {
                boardId: '1',
                name: 'My Deals',
                description: 'Personal deal tracking and management',
                owner: 'John Smith',
                ownerId: '1',
                lastModified: new Date().toISOString(),
                dealCount: 12,
                totalAmount: 450000,
                canEdit: true,
                pipeline: 'default',
            },
            {
                boardId: '2',
                name: 'Enterprise Deals Q2',
                description: 'All enterprise opportunities for Q2 2026',
                owner: 'Sarah Chen',
                ownerId: '2',
                lastModified: new Date(Date.now() - 86400000).toISOString(),
                dealCount: 8,
                totalAmount: 1200000,
                canEdit: false,
                pipeline: 'sales',
            },
            {
                boardId: '3',
                name: 'Team Pipeline - West',
                description: 'Western region team pipeline overview',
                owner: 'Michael Rodriguez',
                ownerId: '3',
                lastModified: new Date(Date.now() - 172800000).toISOString(),
                dealCount: 15,
                totalAmount: 850000,
                canEdit: false,
                pipeline: 'default',
            },
            {
                boardId: '4',
                name: 'Strategic Accounts',
                description: 'High-value strategic account opportunities',
                owner: 'Jennifer Kim',
                ownerId: '4',
                lastModified: new Date(Date.now() - 259200000).toISOString(),
                dealCount: 6,
                totalAmount: 2100000,
                canEdit: true,
                pipeline: 'sales',
            },
        ];
    }
    getMockBoardDetail(boardId) {
        const boards = this.getMockDealBoards();
        const board = boards.find(b => b.boardId === boardId) || boards[0];
        const deals = this.getMockDeals(boardId);
        return {
            ...board,
            deals,
            stages: [
                { name: 'Appointment Scheduled', count: 3, amount: 75000 },
                { name: 'Qualified to Buy', count: 5, amount: 180000 },
                { name: 'Presentation Scheduled', count: 4, amount: 320000 },
                { name: 'Decision Maker Bought-In', count: 2, amount: 450000 },
                { name: 'Contract Sent', count: 1, amount: 125000 },
                { name: 'Closed Won', count: 2, amount: 280000 },
                { name: 'Closed Lost', count: 1, amount: 45000 },
            ],
        };
    }
    getMockDeals(boardId) {
        const baseDeals = [
            {
                id: 'deal-1',
                dealId: 'deal-1',
                name: 'Acme Corp - Enterprise License',
                dealName: 'Acme Corp - Enterprise License',
                amount: 125000,
                stage: 'Contract Sent',
                pipeline: 'default',
                closeDate: '2026-06-15',
                createDate: '2026-03-01',
                ownerId: '1',
                ownerName: 'Lakshmi Prasanna Dara',
                assignedRep: 'Lakshmi Prasanna Dara',
                forecastCategory: 'Commit',
                probability: 80,
                dealType: 'New Business',
                contacts: 2,
                aiScore: 85,
                warnings: 0,
                meddpiccScore: 78,
                lastActivity: '2026-05-28',
            },
            {
                id: 'deal-2',
                dealId: 'deal-2',
                name: 'TechStart Inc - Pilot Program',
                dealName: 'TechStart Inc - Pilot Program',
                amount: 45000,
                stage: 'Presentation Scheduled',
                pipeline: 'default',
                closeDate: '2026-07-01',
                createDate: '2026-04-15',
                ownerId: '1',
                ownerName: 'Lakshmi Prasanna Dara',
                assignedRep: 'Lakshmi Prasanna Dara',
                forecastCategory: 'Most Likely',
                probability: 60,
                dealType: 'New Business',
                contacts: 1,
                aiScore: 72,
                warnings: 1,
                meddpiccScore: 65,
                lastActivity: '2026-05-25',
            },
            {
                id: 'deal-3',
                dealId: 'deal-3',
                name: 'Global Solutions Ltd - Renewal',
                dealName: 'Global Solutions Ltd - Renewal',
                amount: 280000,
                stage: 'Closed Won',
                pipeline: 'sales',
                closeDate: '2026-05-20',
                createDate: '2026-01-10',
                ownerId: '2',
                ownerName: 'Lakshmi Prasanna Dara',
                assignedRep: 'Lakshmi Prasanna Dara',
                forecastCategory: 'Closed',
                probability: 100,
                dealType: 'Renewal',
                contacts: 3,
                aiScore: 95,
                warnings: 0,
                meddpiccScore: 92,
                lastActivity: '2026-05-20',
            },
            {
                id: 'deal-4',
                dealId: 'deal-4',
                name: 'MidMarket Co - Standard Package',
                dealName: 'MidMarket Co - Standard Package',
                amount: 60000,
                stage: 'Discovery',
                pipeline: 'default',
                closeDate: '',
                createDate: '2026-05-01',
                ownerId: '2',
                ownerName: 'Lakshmi Prasanna Dara',
                assignedRep: 'Lakshmi Prasanna Dara',
                forecastCategory: 'Pipeline',
                probability: 20,
                dealType: 'New Business',
                contacts: 1,
                aiScore: 45,
                warnings: 2,
                meddpiccScore: 40,
                lastActivity: '2026-05-26',
            },
            {
                id: 'deal-5',
                dealId: 'deal-5',
                name: 'Northwest Health - Analytics Suite',
                dealName: 'Northwest Health - Analytics Suite',
                amount: 115000,
                stage: 'Proposal',
                pipeline: 'sales',
                closeDate: '2026-06-30',
                createDate: '2026-02-20',
                ownerId: '3',
                ownerName: 'Revenue Intelligence Demo',
                assignedRep: 'Revenue Intelligence Demo',
                forecastCategory: 'Commit',
                probability: 75,
                dealType: 'New Business',
                contacts: 2,
                aiScore: 78,
                warnings: 1,
                meddpiccScore: 70,
                lastActivity: '2026-05-27',
            },
            {
                id: 'deal-6',
                dealId: 'deal-6',
                name: 'BetaSoft - Expansion Deal',
                dealName: 'BetaSoft - Expansion Deal',
                amount: 320000,
                stage: 'Decision Maker Bought-In',
                pipeline: 'default',
                closeDate: '2026-07-15',
                createDate: '2026-03-20',
                ownerId: '3',
                ownerName: 'Revenue Intelligence Demo',
                assignedRep: 'Revenue Intelligence Demo',
                forecastCategory: 'Most Likely',
                probability: 65,
                dealType: 'Expansion',
                contacts: 3,
                aiScore: 82,
                warnings: 0,
                meddpiccScore: 75,
                lastActivity: '2026-05-28',
            },
        ];
        if (boardId === '1')
            return baseDeals.filter(d => d.ownerId === '1');
        if (boardId === '2')
            return baseDeals.filter(d => d.pipeline === 'sales');
        if (boardId === '3')
            return baseDeals.filter(d => d.ownerId === '3');
        if (boardId === '4')
            return baseDeals.filter(d => d.amount > 100000);
        return baseDeals;
    }
    getAllMockDeals() {
        return this.getMockDeals('all');
    }
    getMockDealById(dealId) {
        const allDeals = this.getAllMockDeals();
        return allDeals.find(d => d.dealId === dealId) || allDeals[0] || null;
    }
};
exports.DealsService = DealsService;
exports.DealsService = DealsService = __decorate([
    (0, common_1.Injectable)()
], DealsService);
//# sourceMappingURL=deals.service.js.map