"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsSnapshot = exports.AnalyticsType = exports.UserPreference = exports.PreferenceScope = exports.Session = exports.User = exports.DealSummary = exports.SyncLog = exports.SyncEntityType = exports.SyncType = exports.SyncStatus = exports.AuditLog = exports.AuditEntityType = exports.AuditAction = exports.DealTask = exports.TaskPriority = exports.TaskStatus = exports.DealComment = exports.DealActivity = exports.ActivityType = exports.DealPlaybook = exports.PlaybookItemStatus = exports.PlaybookType = exports.DealWarning = exports.WarningType = exports.WarningSeverity = exports.BoardPermission = exports.PermissionRole = exports.PermissionSubjectType = exports.BoardColumn = exports.ColumnDataType = exports.ColumnType = exports.BoardTab = exports.BoardFilter = exports.FilterLogic = exports.FilterOperator = exports.DealBoard = exports.BoardStatus = exports.BoardAudience = exports.Deal = exports.ForecastCategory = exports.DealStage = void 0;
var DealStage;
(function (DealStage) {
    DealStage["PROSPECTING"] = "PROSPECTING";
    DealStage["QUALIFICATION"] = "QUALIFICATION";
    DealStage["NEEDS_ANALYSIS"] = "NEEDS_ANALYSIS";
    DealStage["PROPOSAL"] = "PROPOSAL";
    DealStage["NEGOTIATION"] = "NEGOTIATION";
    DealStage["CLOSED_WON"] = "CLOSED_WON";
    DealStage["CLOSED_LOST"] = "CLOSED_LOST";
})(DealStage || (exports.DealStage = DealStage = {}));
var ForecastCategory;
(function (ForecastCategory) {
    ForecastCategory["PIPELINE"] = "PIPELINE";
    ForecastCategory["BEST_CASE"] = "BEST_CASE";
    ForecastCategory["COMMIT"] = "COMMIT";
    ForecastCategory["CLOSED"] = "CLOSED";
})(ForecastCategory || (exports.ForecastCategory = ForecastCategory = {}));
class Deal {
    id;
    tenantId;
    crmDealId;
    name;
    stage;
    amount;
    forecastCategory;
    ownerId;
    ownerName;
    accountId;
    accountName;
    closeDate;
    probability;
    aiScore;
    warningCount;
    contactCount;
    activityStrength;
    isHighRisk;
    riskReason;
    nextStep;
    crmData;
    lastActivityAt;
    lastSyncedAt;
    createdAt;
    updatedAt;
    warnings;
    playbooks;
    activities;
    comments;
    tasks;
}
exports.Deal = Deal;
var BoardAudience;
(function (BoardAudience) {
    BoardAudience["AE"] = "AE";
    BoardAudience["MANAGER"] = "MANAGER";
    BoardAudience["EXEC"] = "EXEC";
    BoardAudience["EXECUTIVE"] = "EXECUTIVE";
})(BoardAudience || (exports.BoardAudience = BoardAudience = {}));
var BoardStatus;
(function (BoardStatus) {
    BoardStatus["DRAFT"] = "DRAFT";
    BoardStatus["PUBLISHED"] = "PUBLISHED";
    BoardStatus["ARCHIVED"] = "ARCHIVED";
})(BoardStatus || (exports.BoardStatus = BoardStatus = {}));
class DealBoard {
    id;
    tenantId;
    name;
    description;
    audience;
    status;
    ownerId;
    isLocked;
    allowRepColumnReorder;
    preventManualDealOverride;
    metadata;
    createdAt;
    updatedAt;
    publishedAt;
    filters;
    tabs;
    columns;
    permissions;
}
exports.DealBoard = DealBoard;
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "EQUALS";
    FilterOperator["NOT_EQUALS"] = "NOT_EQUALS";
    FilterOperator["GREATER_THAN"] = "GREATER_THAN";
    FilterOperator["LESS_THAN"] = "LESS_THAN";
    FilterOperator["CONTAINS"] = "CONTAINS";
    FilterOperator["IN"] = "IN";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var FilterLogic;
(function (FilterLogic) {
    FilterLogic["AND"] = "AND";
    FilterLogic["OR"] = "OR";
})(FilterLogic || (exports.FilterLogic = FilterLogic = {}));
class BoardFilter {
    id;
    boardId;
    fieldName;
    operator;
    value;
    logic;
    order;
    isLocked;
    createdAt;
}
exports.BoardFilter = BoardFilter;
class BoardTab {
    id;
    boardId;
    name;
    order;
    createdAt;
    updatedAt;
}
exports.BoardTab = BoardTab;
var ColumnType;
(function (ColumnType) {
    ColumnType["STANDARD"] = "STANDARD";
    ColumnType["CUSTOM"] = "CUSTOM";
})(ColumnType || (exports.ColumnType = ColumnType = {}));
var ColumnDataType;
(function (ColumnDataType) {
    ColumnDataType["STRING"] = "STRING";
    ColumnDataType["NUMBER"] = "NUMBER";
    ColumnDataType["DATE"] = "DATE";
    ColumnDataType["BOOLEAN"] = "BOOLEAN";
    ColumnDataType["CURRENCY"] = "CURRENCY";
})(ColumnDataType || (exports.ColumnDataType = ColumnDataType = {}));
class BoardColumn {
    id;
    boardId;
    field;
    fieldKey;
    label;
    type;
    dataType;
    width;
    order;
    isVisible;
    isSortable;
    isPinned;
    createdAt;
    updatedAt;
}
exports.BoardColumn = BoardColumn;
var PermissionSubjectType;
(function (PermissionSubjectType) {
    PermissionSubjectType["USER"] = "USER";
    PermissionSubjectType["TEAM"] = "TEAM";
})(PermissionSubjectType || (exports.PermissionSubjectType = PermissionSubjectType = {}));
var PermissionRole;
(function (PermissionRole) {
    PermissionRole["VIEWER"] = "VIEWER";
    PermissionRole["EDITOR"] = "EDITOR";
    PermissionRole["ADMIN"] = "ADMIN";
})(PermissionRole || (exports.PermissionRole = PermissionRole = {}));
class BoardPermission {
    id;
    boardId;
    subjectId;
    subjectType;
    role;
    grantedBy;
    createdAt;
}
exports.BoardPermission = BoardPermission;
var WarningSeverity;
(function (WarningSeverity) {
    WarningSeverity["CRITICAL"] = "CRITICAL";
    WarningSeverity["CAUTION"] = "CAUTION";
    WarningSeverity["INFO"] = "INFO";
})(WarningSeverity || (exports.WarningSeverity = WarningSeverity = {}));
var WarningType;
(function (WarningType) {
    WarningType["NO_CONTACT"] = "NO_CONTACT";
    WarningType["STALLED_DEAL"] = "STALLED_DEAL";
    WarningType["BUDGET_RISK"] = "BUDGET_RISK";
})(WarningType || (exports.WarningType = WarningType = {}));
class DealWarning {
    id;
    dealId;
    type;
    severity;
    message;
    recommendedAction;
    isActive;
    metadata;
    resolvedAt;
    resolvedBy;
    createdAt;
    updatedAt;
}
exports.DealWarning = DealWarning;
var PlaybookType;
(function (PlaybookType) {
    PlaybookType["MEDDICC"] = "MEDDICC";
    PlaybookType["BANT"] = "BANT";
    PlaybookType["SPICED"] = "SPICED";
})(PlaybookType || (exports.PlaybookType = PlaybookType = {}));
var PlaybookItemStatus;
(function (PlaybookItemStatus) {
    PlaybookItemStatus["NOT_STARTED"] = "NOT_STARTED";
    PlaybookItemStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PlaybookItemStatus["COMPLETED"] = "COMPLETED";
    PlaybookItemStatus["AT_RISK"] = "AT_RISK";
})(PlaybookItemStatus || (exports.PlaybookItemStatus = PlaybookItemStatus = {}));
class DealPlaybook {
    id;
    dealId;
    type;
    criterion;
    status;
    question;
    notes;
    aiSuggestion;
    order;
    completedBy;
    completedAt;
    createdAt;
    updatedAt;
}
exports.DealPlaybook = DealPlaybook;
var ActivityType;
(function (ActivityType) {
    ActivityType["CALL"] = "CALL";
    ActivityType["EMAIL"] = "EMAIL";
    ActivityType["MEETING"] = "MEETING";
    ActivityType["NOTE"] = "NOTE";
    ActivityType["TASK"] = "TASK";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
class DealActivity {
    id;
    dealId;
    type;
    title;
    description;
    subject;
    summary;
    contactId;
    contactName;
    durationMinutes;
    duration;
    direction;
    crmActivityId;
    crmData;
    activityDate;
    createdAt;
    updatedAt;
}
exports.DealActivity = DealActivity;
class DealComment {
    id;
    dealId;
    userId;
    content;
    authorName;
    authorRole;
    isCoaching;
    isEdited;
    editedAt;
    createdAt;
    updatedAt;
}
exports.DealComment = DealComment;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["NOT_STARTED"] = "NOT_STARTED";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class DealTask {
    id;
    dealId;
    title;
    description;
    status;
    priority;
    assigneeId;
    assigneeName;
    assignedBy;
    assignedByName;
    completedBy;
    dueDate;
    completedAt;
    source;
    createdAt;
    updatedAt;
}
exports.DealTask = DealTask;
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["PUBLISH"] = "PUBLISH";
    AuditAction["UNPUBLISH"] = "UNPUBLISH";
    AuditAction["VIEW_DEAL"] = "VIEW_DEAL";
    AuditAction["UPDATE_DEAL"] = "UPDATE_DEAL";
    AuditAction["GENERATE_WARNINGS"] = "GENERATE_WARNINGS";
    AuditAction["RESOLVE_WARNING"] = "RESOLVE_WARNING";
    AuditAction["GENERATE_SUMMARY"] = "GENERATE_SUMMARY";
    AuditAction["FLAG_SUMMARY_FOR_REVIEW"] = "FLAG_SUMMARY_FOR_REVIEW";
    AuditAction["UNFLAG_SUMMARY_FOR_REVIEW"] = "UNFLAG_SUMMARY_FOR_REVIEW";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditEntityType;
(function (AuditEntityType) {
    AuditEntityType["BOARD"] = "BOARD";
    AuditEntityType["DEAL"] = "DEAL";
    AuditEntityType["WARNING"] = "WARNING";
    AuditEntityType["DEAL_WARNING"] = "DEAL_WARNING";
    AuditEntityType["DEAL_SUMMARY"] = "DEAL_SUMMARY";
})(AuditEntityType || (exports.AuditEntityType = AuditEntityType = {}));
class AuditLog {
    id;
    entityType;
    entityId;
    action;
    userId;
    userName;
    changesBefore;
    changesAfter;
    ipAddress;
    userAgent;
    metadata;
    createdAt;
}
exports.AuditLog = AuditLog;
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "PENDING";
    SyncStatus["SUCCESS"] = "SUCCESS";
    SyncStatus["FAILED"] = "FAILED";
    SyncStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SyncStatus["COMPLETED"] = "COMPLETED";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
var SyncType;
(function (SyncType) {
    SyncType["FULL"] = "FULL";
    SyncType["DELTA"] = "DELTA";
    SyncType["MANUAL"] = "MANUAL";
    SyncType["INCREMENTAL"] = "INCREMENTAL";
})(SyncType || (exports.SyncType = SyncType = {}));
var SyncEntityType;
(function (SyncEntityType) {
    SyncEntityType["DEAL"] = "DEAL";
    SyncEntityType["CONTACT"] = "CONTACT";
    SyncEntityType["COMPANY"] = "COMPANY";
    SyncEntityType["ALL"] = "ALL";
})(SyncEntityType || (exports.SyncEntityType = SyncEntityType = {}));
class SyncLog {
    id;
    source;
    status;
    syncType;
    entityType;
    recordsProcessed;
    recordsFailed;
    recordsCreated;
    recordsUpdated;
    error;
    errorMessage;
    errorDetails;
    durationMs;
    startedAt;
    completedAt;
    createdAt;
}
exports.SyncLog = SyncLog;
class DealSummary {
    id;
    dealId;
    summary;
    isCurrent;
    keyPoints;
    nextSteps;
    competitorMentions;
    confidenceScore;
    weeklyChanges;
    flaggedForReview;
    generatedAt;
    createdAt;
    updatedAt;
}
exports.DealSummary = DealSummary;
class User {
    id;
    email;
    password;
    firstName;
    lastName;
    role;
    isActive;
    lastLoginAt;
    createdAt;
    updatedAt;
}
exports.User = User;
class Session {
    id;
    userId;
    data;
    expiresAt;
    createdAt;
    updatedAt;
}
exports.Session = Session;
var PreferenceScope;
(function (PreferenceScope) {
    PreferenceScope["GLOBAL"] = "GLOBAL";
    PreferenceScope["BOARD"] = "BOARD";
})(PreferenceScope || (exports.PreferenceScope = PreferenceScope = {}));
class UserPreference {
    id;
    userId;
    key;
    value;
    preferenceKey;
    preferenceValue;
    scope;
    scopeId;
    boardId;
    createdAt;
    updatedAt;
}
exports.UserPreference = UserPreference;
var AnalyticsType;
(function (AnalyticsType) {
    AnalyticsType["EXECUTIVE"] = "EXECUTIVE";
    AnalyticsType["MANAGER"] = "MANAGER";
    AnalyticsType["AE"] = "AE";
})(AnalyticsType || (exports.AnalyticsType = AnalyticsType = {}));
class AnalyticsSnapshot {
    id;
    type;
    userId;
    boardId;
    snapshotDate;
    metrics;
    data;
    createdAt;
}
exports.AnalyticsSnapshot = AnalyticsSnapshot;
//# sourceMappingURL=models.js.map