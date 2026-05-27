import { randomUUID } from 'crypto';
import {
  ActivityType,
  AnalyticsSnapshot,
  AuditAction,
  AuditEntityType,
  AuditLog,
  BoardAudience,
  BoardColumn,
  BoardFilter,
  BoardPermission,
  BoardStatus,
  BoardTab,
  Deal,
  DealActivity,
  DealBoard,
  DealComment,
  DealPlaybook,
  DealStage,
  DealSummary,
  DealTask,
  DealWarning,
  FilterLogic,
  FilterOperator,
  ForecastCategory,
  PermissionRole,
  Session,
  SyncLog,
  User,
  UserPreference,
  WarningSeverity,
  WarningType,
} from '../entities';
import { UserRole } from '../interfaces/user-role.enum';

export const M04_DEV_TENANT = 'dev-tenant-m04-001';
export const M04_DEV_USER = '00000000-0000-0000-0000-000000000004';
export const M04_DEV_BOARD_1 = '00000000-0000-0000-0000-000000000101';
export const M04_DEV_BOARD_2 = '00000000-0000-0000-0000-000000000102';

/** bcrypt hash for password "password" */
const DEMO_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export type M04CollectionKey =
  | 'deals'
  | 'boards'
  | 'boardFilters'
  | 'boardTabs'
  | 'boardColumns'
  | 'boardPermissions'
  | 'dealWarnings'
  | 'dealPlaybooks'
  | 'dealActivities'
  | 'dealComments'
  | 'dealTasks'
  | 'auditLogs'
  | 'syncLogs'
  | 'dealSummaries'
  | 'users'
  | 'sessions'
  | 'userPreferences'
  | 'analyticsSnapshots';

export class M04MemoryStore {
  deals = new Map<string, Deal>();
  boards = new Map<string, DealBoard>();
  boardFilters = new Map<string, BoardFilter>();
  boardTabs = new Map<string, BoardTab>();
  boardColumns = new Map<string, BoardColumn>();
  boardPermissions = new Map<string, BoardPermission>();
  dealWarnings = new Map<string, DealWarning>();
  dealPlaybooks = new Map<string, DealPlaybook>();
  dealActivities = new Map<string, DealActivity>();
  dealComments = new Map<string, DealComment>();
  dealTasks = new Map<string, DealTask>();
  auditLogs = new Map<string, AuditLog>();
  syncLogs = new Map<string, SyncLog>();
  dealSummaries = new Map<string, DealSummary>();
  users = new Map<string, User>();
  sessions = new Map<string, Session>();
  userPreferences = new Map<string, UserPreference>();
  analyticsSnapshots = new Map<string, AnalyticsSnapshot>();

  constructor() {
    this.seed();
  }

  getCollection<K extends M04CollectionKey>(key: K): Map<string, unknown> {
    return this[key] as Map<string, unknown>;
  }

  private seed(): void {
    const now = new Date();
    const tenantId = M04_DEV_TENANT;

    const manager: User = {
      id: M04_DEV_USER,
      email: 'manager@dealboards.demo',
      password: DEMO_PASSWORD_HASH,
      firstName: 'Alex',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(manager.id, manager);

    const session: Session = {
      id: randomUUID(),
      userId: manager.id,
      data: { tenantId },
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);

    const dealDefs: Array<Partial<Deal> & { id: string }> = [
      {
        id: '00000000-0000-0000-0000-000000000201',
        crmDealId: 'hs-1001',
        name: 'Meridian Health — Enterprise',
        stage: DealStage.NEGOTIATION,
        amount: 185000,
        forecastCategory: ForecastCategory.COMMIT,
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
        stage: DealStage.PROPOSAL,
        amount: 92000,
        forecastCategory: ForecastCategory.BEST_CASE,
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
        stage: DealStage.QUALIFICATION,
        amount: 45000,
        forecastCategory: ForecastCategory.PIPELINE,
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
        stage: DealStage.NEEDS_ANALYSIS,
        amount: 120000,
        forecastCategory: ForecastCategory.PIPELINE,
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
        stage: DealStage.PROPOSAL,
        amount: 68000,
        forecastCategory: ForecastCategory.BEST_CASE,
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
        stage: DealStage.PROSPECTING,
        amount: 32000,
        forecastCategory: ForecastCategory.PIPELINE,
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
      const deal: Deal = {
        tenantId,
        lastActivityAt: now,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
        ...def,
      } as Deal;
      this.deals.set(deal.id, deal);
    }

    const board1: DealBoard = {
      id: M04_DEV_BOARD_1,
      tenantId,
      name: 'Q1 Pipeline — AE View',
      description: 'Active pipeline deals for account executives',
      audience: [BoardAudience.AE, BoardAudience.MANAGER],
      status: BoardStatus.PUBLISHED,
      ownerId: manager.id,
      isLocked: false,
      allowRepColumnReorder: true,
      preventManualDealOverride: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    };
    this.boards.set(board1.id, board1);

    const board2: DealBoard = {
      id: M04_DEV_BOARD_2,
      tenantId,
      name: 'High Risk Deals',
      description: 'Deals flagged as high risk requiring manager attention',
      audience: [BoardAudience.MANAGER, BoardAudience.EXEC],
      status: BoardStatus.PUBLISHED,
      ownerId: manager.id,
      isLocked: true,
      allowRepColumnReorder: false,
      preventManualDealOverride: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    };
    this.boards.set(board2.id, board2);

    const filters: BoardFilter[] = [
      {
        id: randomUUID(),
        boardId: board1.id,
        fieldName: 'stage',
        operator: FilterOperator.IN,
        value: [DealStage.PROPOSAL, DealStage.NEGOTIATION],
        logic: FilterLogic.AND,
        order: 0,
        isLocked: true,
        createdAt: now,
      },
      {
        id: randomUUID(),
        boardId: board1.id,
        fieldName: 'amount',
        operator: FilterOperator.GREATER_THAN,
        value: 50000,
        logic: FilterLogic.AND,
        order: 1,
        isLocked: false,
        createdAt: now,
      },
      {
        id: randomUUID(),
        boardId: board2.id,
        fieldName: 'isHighRisk',
        operator: FilterOperator.EQUALS,
        value: true,
        logic: FilterLogic.AND,
        order: 0,
        isLocked: true,
        createdAt: now,
      },
    ];
    for (const f of filters) this.boardFilters.set(f.id, f);

    const tabs: BoardTab[] = [
      { id: randomUUID(), boardId: board1.id, name: 'Commit', order: 0, createdAt: now, updatedAt: now },
      { id: randomUUID(), boardId: board1.id, name: 'Best Case', order: 1, createdAt: now, updatedAt: now },
      { id: randomUUID(), boardId: board2.id, name: 'At Risk', order: 0, createdAt: now, updatedAt: now },
    ];
    for (const t of tabs) this.boardTabs.set(t.id, t);

    const columns: BoardColumn[] = [
      {
        id: randomUUID(),
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
        id: randomUUID(),
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
        id: randomUUID(),
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
        id: randomUUID(),
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
    for (const c of columns) this.boardColumns.set(c.id, c);

    const permissions: BoardPermission[] = [
      {
        id: randomUUID(),
        boardId: board1.id,
        subjectId: manager.id,
        role: PermissionRole.ADMIN,
        grantedBy: manager.id,
        createdAt: now,
      },
      {
        id: randomUUID(),
        boardId: board2.id,
        subjectId: manager.id,
        role: PermissionRole.EDITOR,
        grantedBy: manager.id,
        createdAt: now,
      },
    ];
    for (const p of permissions) this.boardPermissions.set(p.id, p);

    const dealIds = dealDefs.map((d) => d.id);
    const warnings: DealWarning[] = [
      {
        id: randomUUID(),
        dealId: dealIds[0],
        type: WarningType.STALLED_DEAL,
        severity: WarningSeverity.CRITICAL,
        message: 'No activity in 14 days',
        recommendedAction: 'Schedule executive check-in',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        dealId: dealIds[0],
        type: WarningType.NO_CONTACT,
        severity: WarningSeverity.CAUTION,
        message: 'Missing economic buyer contact',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        dealId: dealIds[3],
        type: WarningType.BUDGET_RISK,
        severity: WarningSeverity.CAUTION,
        message: 'Budget not confirmed for Q2',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const w of warnings) this.dealWarnings.set(w.id, w);

    for (const dealId of [dealIds[0], dealIds[1]]) {
      const playbookId = randomUUID();
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
    ] as const) {
      const activityId = randomUUID();
      this.dealActivities.set(activityId, {
        id: activityId,
        dealId,
        type: ActivityType.MEETING,
        title,
        activityDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    const commentId = randomUUID();
    this.dealComments.set(commentId, {
      id: commentId,
      dealId: dealIds[0],
      userId: manager.id,
      content: 'Need legal review before final proposal.',
      createdAt: now,
      updatedAt: now,
    });

    const taskId = randomUUID();
    this.dealTasks.set(taskId, {
      id: taskId,
      dealId: dealIds[0],
      title: 'Send revised pricing',
      status: 'OPEN',
      dueDate: new Date(now.getTime() + 3 * 86400000),
      createdAt: now,
      updatedAt: now,
    });

    this.auditLogs.set(randomUUID(), {
      id: randomUUID(),
      entityType: AuditEntityType.BOARD,
      entityId: board1.id,
      action: AuditAction.PUBLISH,
      userId: manager.id,
      userName: 'Alex Manager',
      createdAt: now,
    });

    this.syncLogs.set(randomUUID(), {
      id: randomUUID(),
      source: 'hubspot',
      status: 'completed',
      recordsProcessed: dealDefs.length,
      recordsFailed: 0,
      startedAt: new Date(now.getTime() - 3600000),
      completedAt: now,
      createdAt: now,
    });

    this.dealSummaries.set(randomUUID(), {
      id: randomUUID(),
      dealId: dealIds[0],
      summary: 'Strong technical fit; stalled on executive sponsorship.',
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    this.userPreferences.set(randomUUID(), {
      id: randomUUID(),
      userId: manager.id,
      key: 'defaultBoardId',
      value: board1.id,
      createdAt: now,
      updatedAt: now,
    });

    this.analyticsSnapshots.set(randomUUID(), {
      id: randomUUID(),
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

export const m04MemoryStore = new M04MemoryStore();
