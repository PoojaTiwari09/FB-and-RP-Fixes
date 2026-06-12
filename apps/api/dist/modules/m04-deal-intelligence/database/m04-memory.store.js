"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.m04MemoryStore = exports.M04MemoryStore = exports.M04_DEV_BOARD_2 = exports.M04_DEV_BOARD_1 = exports.M04_DEV_USER = exports.M04_DEV_TENANT = void 0;
const crypto_1 = require("crypto");
const entities_1 = require("../entities");
const user_role_enum_1 = require("../interfaces/user-role.enum");
exports.M04_DEV_TENANT = 'dev-tenant-m04-001';
exports.M04_DEV_USER = '00000000-0000-0000-0000-000000000004';
exports.M04_DEV_BOARD_1 = '00000000-0000-0000-0000-000000000101';
exports.M04_DEV_BOARD_2 = '00000000-0000-0000-0000-000000000102';
const DEMO_PASSWORD_HASH = '$2b$10$P3j82dKxwk1DZvm8yUt22OviSTsKj0f9bQy0vkFHtQ/mxz309O57i';
class M04MemoryStore {
    deals = new Map();
    boards = new Map();
    boardFilters = new Map();
    boardTabs = new Map();
    boardColumns = new Map();
    boardPermissions = new Map();
    dealWarnings = new Map();
    dealPlaybooks = new Map();
    dealActivities = new Map();
    dealComments = new Map();
    dealTasks = new Map();
    auditLogs = new Map();
    syncLogs = new Map();
    dealSummaries = new Map();
    users = new Map();
    sessions = new Map();
    userPreferences = new Map();
    analyticsSnapshots = new Map();
    constructor() {
        this.seed();
    }
    getCollection(key) {
        return this[key];
    }
    seed() {
        const now = new Date();
        const tenantId = exports.M04_DEV_TENANT;
        const manager = {
            id: exports.M04_DEV_USER,
            email: 'manager@dealboards.demo',
            password: DEMO_PASSWORD_HASH,
            firstName: 'Alex',
            lastName: 'Manager',
            role: user_role_enum_1.UserRole.MANAGER,
            isActive: true,
            lastLoginAt: now,
            createdAt: now,
            updatedAt: now,
        };
        this.users.set(manager.id, manager);
        const session = {
            id: (0, crypto_1.randomUUID)(),
            userId: manager.id,
            data: { tenantId },
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now,
        };
        this.sessions.set(session.id, session);
        const dealDefs = [
            {
                id: '00000000-0000-0000-0000-000000000201',
                crmDealId: 'hs-1001',
                name: 'Meridian Health — Enterprise',
                stage: entities_1.DealStage.NEGOTIATION,
                amount: 185000,
                forecastCategory: entities_1.ForecastCategory.COMMIT,
                ownerId: manager.id,
                ownerName: 'Alex Manager',
                accountName: 'Meridian Health',
                closeDate: new Date(now.getTime() + 14 * 86400000),
                probability: 85,
                aiScore: 72,
                warningCount: 2,
                contactCount: 4,
                activityStrength: 78,
                isHighRisk: true,
                riskReason: 'Stalled executive engagement',
            },
            {
                id: '00000000-0000-0000-0000-000000000202',
                crmDealId: 'hs-1002',
                name: 'Apex Technologies — Platform',
                stage: entities_1.DealStage.PROPOSAL,
                amount: 92000,
                forecastCategory: entities_1.ForecastCategory.BEST_CASE,
                ownerId: manager.id,
                ownerName: 'Alex Manager',
                accountName: 'Apex Technologies',
                closeDate: new Date(now.getTime() + 30 * 86400000),
                probability: 60,
                aiScore: 65,
                warningCount: 1,
                contactCount: 3,
                activityStrength: 55,
                isHighRisk: false,
            },
            {
                id: '00000000-0000-0000-0000-000000000203',
                crmDealId: 'hs-1003',
                name: 'Stonebridge Capital — Renewal',
                stage: entities_1.DealStage.QUALIFICATION,
                amount: 45000,
                forecastCategory: entities_1.ForecastCategory.PIPELINE,
                ownerId: manager.id,
                ownerName: 'Alex Manager',
                accountName: 'Stonebridge Capital',
                closeDate: new Date(now.getTime() + 45 * 86400000),
                probability: 35,
                aiScore: 48,
                warningCount: 0,
                contactCount: 2,
                activityStrength: 40,
                isHighRisk: false,
            },
            {
                id: '00000000-0000-0000-0000-000000000204',
                crmDealId: 'hs-1004',
                name: 'Lumina Retail — Expansion',
                stage: entities_1.DealStage.NEEDS_ANALYSIS,
                amount: 120000,
                forecastCategory: entities_1.ForecastCategory.PIPELINE,
                ownerId: manager.id,
                ownerName: 'Alex Manager',
                accountName: 'Lumina Retail Group',
                closeDate: new Date(now.getTime() + 60 * 86400000),
                probability: 40,
                aiScore: 55,
                warningCount: 1,
                contactCount: 5,
                activityStrength: 62,
                isHighRisk: true,
                riskReason: 'Budget not confirmed',
            },
            {
                id: '00000000-0000-0000-0000-000000000205',
                crmDealId: 'hs-1005',
                name: 'NorthStar Pharma — Pilot',
                stage: entities_1.DealStage.PROPOSAL,
                amount: 68000,
                forecastCategory: entities_1.ForecastCategory.BEST_CASE,
                ownerId: manager.id,
                ownerName: 'Alex Manager',
                accountName: 'NorthStar Pharma',
                closeDate: new Date(now.getTime() + 21 * 86400000),
                probability: 70,
                aiScore: 80,
                warningCount: 0,
                contactCount: 6,
                activityStrength: 85,
                isHighRisk: false,
            },
            {
                id: '00000000-0000-0000-0000-000000000206',
                crmDealId: 'hs-1006',
                name: 'Beacon Analytics — New Logo',
                stage: entities_1.DealStage.PROSPECTING,
                amount: 32000,
                forecastCategory: entities_1.ForecastCategory.PIPELINE,
                ownerId: manager.id,
                ownerName: 'Alex Manager',
                accountName: 'Beacon Analytics',
                closeDate: new Date(now.getTime() + 90 * 86400000),
                probability: 20,
                aiScore: 42,
                warningCount: 0,
                contactCount: 1,
                activityStrength: 25,
                isHighRisk: false,
            },
        ];
        for (const def of dealDefs) {
            const deal = {
                tenantId,
                lastActivityAt: now,
                lastSyncedAt: now,
                createdAt: now,
                updatedAt: now,
                ...def,
            };
            this.deals.set(deal.id, deal);
        }
        const board1 = {
            id: exports.M04_DEV_BOARD_1,
            tenantId,
            name: 'Q1 Pipeline — AE View',
            description: 'Active pipeline deals for account executives',
            audience: [entities_1.BoardAudience.AE, entities_1.BoardAudience.MANAGER],
            status: entities_1.BoardStatus.PUBLISHED,
            ownerId: manager.id,
            isLocked: false,
            allowRepColumnReorder: true,
            preventManualDealOverride: true,
            createdAt: now,
            updatedAt: now,
            publishedAt: now,
        };
        this.boards.set(board1.id, board1);
        const board2 = {
            id: exports.M04_DEV_BOARD_2,
            tenantId,
            name: 'High Risk Deals',
            description: 'Deals flagged as high risk requiring manager attention',
            audience: [entities_1.BoardAudience.MANAGER, entities_1.BoardAudience.EXEC],
            status: entities_1.BoardStatus.PUBLISHED,
            ownerId: manager.id,
            isLocked: true,
            allowRepColumnReorder: false,
            preventManualDealOverride: true,
            createdAt: now,
            updatedAt: now,
            publishedAt: now,
        };
        this.boards.set(board2.id, board2);
        const filters = [
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board1.id,
                fieldName: 'stage',
                operator: entities_1.FilterOperator.IN,
                value: [entities_1.DealStage.PROPOSAL, entities_1.DealStage.NEGOTIATION],
                logic: entities_1.FilterLogic.AND,
                order: 0,
                isLocked: true,
                createdAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board1.id,
                fieldName: 'amount',
                operator: entities_1.FilterOperator.GREATER_THAN,
                value: 50000,
                logic: entities_1.FilterLogic.AND,
                order: 1,
                isLocked: false,
                createdAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board2.id,
                fieldName: 'isHighRisk',
                operator: entities_1.FilterOperator.EQUALS,
                value: true,
                logic: entities_1.FilterLogic.AND,
                order: 0,
                isLocked: true,
                createdAt: now,
            },
        ];
        for (const f of filters)
            this.boardFilters.set(f.id, f);
        const tabs = [
            { id: (0, crypto_1.randomUUID)(), boardId: board1.id, name: 'Commit', order: 0, createdAt: now, updatedAt: now },
            { id: (0, crypto_1.randomUUID)(), boardId: board1.id, name: 'Best Case', order: 1, createdAt: now, updatedAt: now },
            { id: (0, crypto_1.randomUUID)(), boardId: board2.id, name: 'At Risk', order: 0, createdAt: now, updatedAt: now },
        ];
        for (const t of tabs)
            this.boardTabs.set(t.id, t);
        const columns = [
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board1.id,
                field: 'name',
                label: 'Deal Name',
                width: 240,
                order: 0,
                isVisible: true,
                isSortable: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board1.id,
                field: 'stage',
                label: 'Stage',
                width: 140,
                order: 1,
                isVisible: true,
                isSortable: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board1.id,
                field: 'amount',
                label: 'Amount',
                width: 120,
                order: 2,
                isVisible: true,
                isSortable: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board2.id,
                field: 'riskReason',
                label: 'Risk Reason',
                width: 200,
                order: 0,
                isVisible: true,
                isSortable: false,
                createdAt: now,
                updatedAt: now,
            },
        ];
        for (const c of columns)
            this.boardColumns.set(c.id, c);
        const permissions = [
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board1.id,
                subjectId: manager.id,
                role: entities_1.PermissionRole.ADMIN,
                grantedBy: manager.id,
                createdAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                boardId: board2.id,
                subjectId: manager.id,
                role: entities_1.PermissionRole.EDITOR,
                grantedBy: manager.id,
                createdAt: now,
            },
        ];
        for (const p of permissions)
            this.boardPermissions.set(p.id, p);
        const dealIds = dealDefs.map((d) => d.id);
        const warnings = [
            {
                id: (0, crypto_1.randomUUID)(),
                dealId: dealIds[0],
                type: entities_1.WarningType.STALLED_DEAL,
                severity: entities_1.WarningSeverity.CRITICAL,
                message: 'No activity in 14 days',
                recommendedAction: 'Schedule executive check-in',
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                dealId: dealIds[0],
                type: entities_1.WarningType.NO_CONTACT,
                severity: entities_1.WarningSeverity.CAUTION,
                message: 'Missing economic buyer contact',
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: (0, crypto_1.randomUUID)(),
                dealId: dealIds[3],
                type: entities_1.WarningType.BUDGET_RISK,
                severity: entities_1.WarningSeverity.CAUTION,
                message: 'Budget not confirmed for Q2',
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
        ];
        for (const w of warnings)
            this.dealWarnings.set(w.id, w);
        for (const dealId of [dealIds[0], dealIds[1]]) {
            const playbookId = (0, crypto_1.randomUUID)();
            this.dealPlaybooks.set(playbookId, {
                id: playbookId,
                dealId,
                type: 'MEDDIC',
                criterion: 'Economic Buyer',
                status: 'IN_PROGRESS',
                question: 'Who controls budget?',
                order: 0,
                createdAt: now,
                updatedAt: now,
            });
        }
        for (const [dealId, title] of [
            [dealIds[0], 'Executive discovery call'],
            [dealIds[1], 'Proposal review meeting'],
            [dealIds[4], 'Technical validation'],
        ]) {
            const activityId = (0, crypto_1.randomUUID)();
            this.dealActivities.set(activityId, {
                id: activityId,
                dealId,
                type: entities_1.ActivityType.MEETING,
                title,
                activityDate: now,
                createdAt: now,
                updatedAt: now,
            });
        }
        const commentId = (0, crypto_1.randomUUID)();
        this.dealComments.set(commentId, {
            id: commentId,
            dealId: dealIds[0],
            userId: manager.id,
            content: 'Need legal review before final proposal.',
            createdAt: now,
            updatedAt: now,
        });
        const taskId = (0, crypto_1.randomUUID)();
        this.dealTasks.set(taskId, {
            id: taskId,
            dealId: dealIds[0],
            title: 'Send revised pricing',
            status: 'OPEN',
            dueDate: new Date(now.getTime() + 3 * 86400000),
            createdAt: now,
            updatedAt: now,
        });
        this.auditLogs.set((0, crypto_1.randomUUID)(), {
            id: (0, crypto_1.randomUUID)(),
            entityType: entities_1.AuditEntityType.BOARD,
            entityId: board1.id,
            action: entities_1.AuditAction.PUBLISH,
            userId: manager.id,
            userName: 'Alex Manager',
            createdAt: now,
        });
        this.syncLogs.set((0, crypto_1.randomUUID)(), {
            id: (0, crypto_1.randomUUID)(),
            source: 'hubspot',
            status: 'completed',
            recordsProcessed: dealDefs.length,
            recordsFailed: 0,
            startedAt: new Date(now.getTime() - 3600000),
            completedAt: now,
            createdAt: now,
        });
        this.dealSummaries.set((0, crypto_1.randomUUID)(), {
            id: (0, crypto_1.randomUUID)(),
            dealId: dealIds[0],
            summary: 'Strong technical fit; stalled on executive sponsorship.',
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
        });
        this.userPreferences.set((0, crypto_1.randomUUID)(), {
            id: (0, crypto_1.randomUUID)(),
            userId: manager.id,
            key: 'defaultBoardId',
            value: board1.id,
            createdAt: now,
            updatedAt: now,
        });
        this.analyticsSnapshots.set((0, crypto_1.randomUUID)(), {
            id: (0, crypto_1.randomUUID)(),
            userId: manager.id,
            snapshotDate: now,
            data: {
                totalPipeline: 542000,
                commitValue: 185000,
                highRiskCount: 2,
                dealsByStage: { NEGOTIATION: 1, PROPOSAL: 2, QUALIFICATION: 1 },
            },
            createdAt: now,
        });
    }
}
exports.M04MemoryStore = M04MemoryStore;
exports.m04MemoryStore = new M04MemoryStore();
//# sourceMappingURL=m04-memory.store.js.map