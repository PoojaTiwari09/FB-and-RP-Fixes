import { UserRole } from '../interfaces/user-role.enum';
export declare enum DealStage {
    PROSPECTING = "PROSPECTING",
    QUALIFICATION = "QUALIFICATION",
    NEEDS_ANALYSIS = "NEEDS_ANALYSIS",
    PROPOSAL = "PROPOSAL",
    NEGOTIATION = "NEGOTIATION",
    CLOSED_WON = "CLOSED_WON",
    CLOSED_LOST = "CLOSED_LOST"
}
export declare enum ForecastCategory {
    PIPELINE = "PIPELINE",
    BEST_CASE = "BEST_CASE",
    COMMIT = "COMMIT",
    CLOSED = "CLOSED"
}
export declare class Deal {
    id: string;
    tenantId?: string;
    crmDealId: string;
    name: string;
    stage: DealStage;
    amount: number;
    forecastCategory: ForecastCategory;
    ownerId: string;
    ownerName: string;
    accountId?: string;
    accountName?: string;
    closeDate?: Date;
    probability: number;
    aiScore: number;
    warningCount: number;
    contactCount: number;
    activityStrength: number;
    isHighRisk: boolean;
    riskReason?: string;
    nextStep?: string;
    crmData?: Record<string, any>;
    lastActivityAt?: Date;
    lastSyncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    warnings?: DealWarning[];
    playbooks?: DealPlaybook[];
    activities?: DealActivity[];
    comments?: DealComment[];
    tasks?: DealTask[];
}
export declare enum BoardAudience {
    AE = "AE",
    MANAGER = "MANAGER",
    EXEC = "EXEC",
    EXECUTIVE = "EXECUTIVE"
}
export declare enum BoardStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class DealBoard {
    id: string;
    tenantId?: string;
    name: string;
    description?: string;
    audience: BoardAudience[];
    status: BoardStatus;
    ownerId: string;
    isLocked: boolean;
    allowRepColumnReorder: boolean;
    preventManualDealOverride: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    filters?: BoardFilter[];
    tabs?: BoardTab[];
    columns?: BoardColumn[];
    permissions?: BoardPermission[];
}
export declare enum FilterOperator {
    EQUALS = "EQUALS",
    NOT_EQUALS = "NOT_EQUALS",
    GREATER_THAN = "GREATER_THAN",
    LESS_THAN = "LESS_THAN",
    CONTAINS = "CONTAINS",
    IN = "IN"
}
export declare enum FilterLogic {
    AND = "AND",
    OR = "OR"
}
export declare class BoardFilter {
    id: string;
    boardId: string;
    fieldName: string;
    operator: FilterOperator;
    value?: any;
    logic: FilterLogic;
    order: number;
    isLocked: boolean;
    createdAt: Date;
}
export declare class BoardTab {
    id: string;
    boardId: string;
    name: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ColumnType {
    STANDARD = "STANDARD",
    CUSTOM = "CUSTOM"
}
export declare enum ColumnDataType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    DATE = "DATE",
    BOOLEAN = "BOOLEAN",
    CURRENCY = "CURRENCY"
}
export declare class BoardColumn {
    id: string;
    boardId: string;
    field?: string;
    fieldKey?: string;
    label: string;
    type?: ColumnType;
    dataType?: ColumnDataType;
    width: number;
    order: number;
    isVisible: boolean;
    isSortable: boolean;
    isPinned?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum PermissionSubjectType {
    USER = "USER",
    TEAM = "TEAM"
}
export declare enum PermissionRole {
    VIEWER = "VIEWER",
    EDITOR = "EDITOR",
    ADMIN = "ADMIN"
}
export declare class BoardPermission {
    id: string;
    boardId: string;
    subjectId: string;
    subjectType?: PermissionSubjectType;
    role: PermissionRole;
    grantedBy?: string;
    createdAt: Date;
}
export declare enum WarningSeverity {
    CRITICAL = "CRITICAL",
    CAUTION = "CAUTION",
    INFO = "INFO"
}
export declare enum WarningType {
    NO_CONTACT = "NO_CONTACT",
    STALLED_DEAL = "STALLED_DEAL",
    BUDGET_RISK = "BUDGET_RISK"
}
export declare class DealWarning {
    id: string;
    dealId: string;
    type: WarningType;
    severity: WarningSeverity;
    message: string;
    recommendedAction?: string;
    isActive: boolean;
    metadata?: Record<string, any>;
    resolvedAt?: Date;
    resolvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum PlaybookType {
    MEDDICC = "MEDDICC",
    BANT = "BANT",
    SPICED = "SPICED"
}
export declare enum PlaybookItemStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    AT_RISK = "AT_RISK"
}
export declare class DealPlaybook {
    id: string;
    dealId: string;
    type: PlaybookType | string;
    criterion: string;
    status: PlaybookItemStatus | string;
    question?: string;
    notes?: string;
    aiSuggestion?: string;
    order: number;
    completedBy?: string | null;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ActivityType {
    CALL = "CALL",
    EMAIL = "EMAIL",
    MEETING = "MEETING",
    NOTE = "NOTE"
}
export declare class DealActivity {
    id: string;
    dealId: string;
    type: ActivityType;
    title: string;
    description?: string;
    activityDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class DealComment {
    id: string;
    dealId: string;
    userId: string;
    content: string;
    authorName?: string;
    authorRole?: string;
    isCoaching?: boolean;
    isEdited?: boolean;
    editedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum TaskStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare class DealTask {
    id: string;
    dealId: string;
    title: string;
    description?: string;
    status: TaskStatus | string;
    priority?: TaskPriority | string;
    assigneeId?: string;
    assigneeName?: string;
    assignedBy?: string;
    assignedByName?: string;
    completedBy?: string;
    dueDate?: Date;
    completedAt?: Date;
    source?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    PUBLISH = "PUBLISH",
    UNPUBLISH = "UNPUBLISH",
    VIEW_DEAL = "VIEW_DEAL",
    UPDATE_DEAL = "UPDATE_DEAL",
    GENERATE_WARNINGS = "GENERATE_WARNINGS",
    RESOLVE_WARNING = "RESOLVE_WARNING",
    GENERATE_SUMMARY = "GENERATE_SUMMARY",
    FLAG_SUMMARY_FOR_REVIEW = "FLAG_SUMMARY_FOR_REVIEW",
    UNFLAG_SUMMARY_FOR_REVIEW = "UNFLAG_SUMMARY_FOR_REVIEW"
}
export declare enum AuditEntityType {
    BOARD = "BOARD",
    DEAL = "DEAL",
    WARNING = "WARNING",
    DEAL_WARNING = "DEAL_WARNING",
    DEAL_SUMMARY = "DEAL_SUMMARY"
}
export declare class AuditLog {
    id: string;
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    userId?: string;
    userName?: string;
    changesBefore?: Record<string, any>;
    changesAfter?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export declare enum SyncStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED"
}
export declare enum SyncType {
    FULL = "FULL",
    DELTA = "DELTA",
    MANUAL = "MANUAL",
    INCREMENTAL = "INCREMENTAL"
}
export declare enum SyncEntityType {
    DEAL = "DEAL",
    CONTACT = "CONTACT",
    COMPANY = "COMPANY",
    ALL = "ALL"
}
export declare class SyncLog {
    id: string;
    source: string;
    status: SyncStatus | string;
    syncType?: SyncType | string;
    entityType?: SyncEntityType | string;
    recordsProcessed: number;
    recordsFailed: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    error?: string;
    errorMessage?: string;
    errorDetails?: any;
    durationMs?: number;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
}
export declare class DealSummary {
    id: string;
    dealId: string;
    summary: string;
    isCurrent?: boolean;
    keyPoints?: string[];
    nextSteps?: string[];
    competitorMentions?: string[];
    confidenceScore?: number;
    weeklyChanges?: string[];
    flaggedForReview?: boolean;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Session {
    id: string;
    userId: string;
    data?: Record<string, any>;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum PreferenceScope {
    GLOBAL = "GLOBAL",
    BOARD = "BOARD"
}
export declare class UserPreference {
    id: string;
    userId: string;
    key?: string;
    value?: string;
    preferenceKey: string;
    preferenceValue: any;
    scope: PreferenceScope;
    scopeId?: string | null;
    boardId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AnalyticsSnapshot {
    id: string;
    userId: string;
    snapshotDate: Date;
    data: Record<string, any>;
    createdAt: Date;
}
