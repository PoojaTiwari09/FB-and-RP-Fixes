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
exports.AllSettingsResponseDto = exports.GetGlobalSettingsResponseDto = exports.SaveGlobalSettingsRequestDto = exports.GlobalSettingsDto = exports.GetCoachingSettingsResponseDto = exports.SaveCoachingSettingsRequestDto = exports.CoachingSettingsDto = exports.GetNotificationSettingsResponseDto = exports.SaveNotificationSettingsRequestDto = exports.NotificationSettingsDto = exports.GetViewSettingsResponseDto = exports.SaveViewSettingsRequestDto = exports.ViewSettingsDto = exports.ColumnSettingDto = exports.GetFiltersResponseDto = exports.SaveFiltersRequestDto = exports.FilterSettingDto = exports.GroupByOption = exports.SortOrder = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "ASC";
    SortOrder["DESC"] = "DESC";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
var GroupByOption;
(function (GroupByOption) {
    GroupByOption["NONE"] = "NONE";
    GroupByOption["REP"] = "REP";
    GroupByOption["STAGE"] = "STAGE";
    GroupByOption["FORECAST_CATEGORY"] = "FORECAST_CATEGORY";
})(GroupByOption || (exports.GroupByOption = GroupByOption = {}));
class FilterSettingDto {
    field;
    operator;
    value;
    isLocked;
}
exports.FilterSettingDto = FilterSettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter field', example: 'stage' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterSettingDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter operator', example: '=' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterSettingDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter value', example: 'PROPOSAL' }),
    __metadata("design:type", Object)
], FilterSettingDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is locked (cannot be removed)', example: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FilterSettingDto.prototype, "isLocked", void 0);
class SaveFiltersRequestDto {
    boardId;
    filters;
}
exports.SaveFiltersRequestDto = SaveFiltersRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Board ID (if board-specific)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SaveFiltersRequestDto.prototype, "boardId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filters to save', type: [FilterSettingDto] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SaveFiltersRequestDto.prototype, "filters", void 0);
class GetFiltersResponseDto {
    userId;
    boardId;
    filters;
    updatedAt;
}
exports.GetFiltersResponseDto = GetFiltersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], GetFiltersResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Board ID' }),
    __metadata("design:type", String)
], GetFiltersResponseDto.prototype, "boardId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Saved filters', type: [FilterSettingDto] }),
    __metadata("design:type", Array)
], GetFiltersResponseDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last updated' }),
    __metadata("design:type", Date)
], GetFiltersResponseDto.prototype, "updatedAt", void 0);
class ColumnSettingDto {
    key;
    label;
    visible;
    order;
    isPinned;
    width;
}
exports.ColumnSettingDto = ColumnSettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Column key', example: 'dealName' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ColumnSettingDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Column label', example: 'Deal Name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ColumnSettingDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is visible', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ColumnSettingDto.prototype, "visible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Column order', example: 1 }),
    __metadata("design:type", Number)
], ColumnSettingDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is pinned', example: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ColumnSettingDto.prototype, "isPinned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Column width in pixels', example: 200 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ColumnSettingDto.prototype, "width", void 0);
class ViewSettingsDto {
    boardId;
    columns;
    sortField;
    sortOrder;
    groupBy;
    activeTab;
    showCompletedTasks;
    compactView;
}
exports.ViewSettingsDto = ViewSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Board ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ViewSettingsDto.prototype, "boardId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Columns configuration', type: [ColumnSettingDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ViewSettingsDto.prototype, "columns", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort field',
        example: 'aiScore',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ViewSettingsDto.prototype, "sortField", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort order',
        enum: SortOrder,
        example: SortOrder.DESC,
    }),
    (0, class_validator_1.IsEnum)(SortOrder),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ViewSettingsDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Group by option',
        enum: GroupByOption,
        example: GroupByOption.REP,
    }),
    (0, class_validator_1.IsEnum)(GroupByOption),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ViewSettingsDto.prototype, "groupBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Active tab',
        example: 'Pipeline',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ViewSettingsDto.prototype, "activeTab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show completed tasks',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ViewSettingsDto.prototype, "showCompletedTasks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Compact view mode',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ViewSettingsDto.prototype, "compactView", void 0);
class SaveViewSettingsRequestDto extends ViewSettingsDto {
}
exports.SaveViewSettingsRequestDto = SaveViewSettingsRequestDto;
class GetViewSettingsResponseDto {
    userId;
    boardId;
    settings;
    updatedAt;
}
exports.GetViewSettingsResponseDto = GetViewSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], GetViewSettingsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Board ID' }),
    __metadata("design:type", String)
], GetViewSettingsResponseDto.prototype, "boardId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'View settings', type: ViewSettingsDto }),
    __metadata("design:type", ViewSettingsDto)
], GetViewSettingsResponseDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last updated' }),
    __metadata("design:type", Date)
], GetViewSettingsResponseDto.prototype, "updatedAt", void 0);
class NotificationSettingsDto {
    emailEnabled;
    inAppEnabled;
    notifyOnWarnings;
    notifyOnTaskAssignments;
    notifyOnComments;
    notifyOnRiskEscalations;
    dailyDigestEnabled;
    weeklySummaryEnabled;
}
exports.NotificationSettingsDto = NotificationSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email notifications enabled', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "emailEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'In-app notifications enabled', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "inAppEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notify on deal warnings', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "notifyOnWarnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notify on task assignments', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "notifyOnTaskAssignments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notify on comments', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "notifyOnComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notify on risk escalations', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "notifyOnRiskEscalations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Daily digest enabled', example: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "dailyDigestEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Weekly summary enabled', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "weeklySummaryEnabled", void 0);
class SaveNotificationSettingsRequestDto extends NotificationSettingsDto {
}
exports.SaveNotificationSettingsRequestDto = SaveNotificationSettingsRequestDto;
class GetNotificationSettingsResponseDto {
    userId;
    settings;
    updatedAt;
}
exports.GetNotificationSettingsResponseDto = GetNotificationSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], GetNotificationSettingsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification settings', type: NotificationSettingsDto }),
    __metadata("design:type", NotificationSettingsDto)
], GetNotificationSettingsResponseDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last updated' }),
    __metadata("design:type", Date)
], GetNotificationSettingsResponseDto.prototype, "updatedAt", void 0);
class CoachingSettingsDto {
    autoAssignTasks;
    defaultTaskDueDays;
    riskEscalationThreshold;
    autoEscalateHighRisk;
    requireCommentOnEscalation;
    trackMeddpiccCompletion;
}
exports.CoachingSettingsDto = CoachingSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Auto-assign tasks to reps', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CoachingSettingsDto.prototype, "autoAssignTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Default task due days', example: 3 }),
    __metadata("design:type", Number)
], CoachingSettingsDto.prototype, "defaultTaskDueDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Risk escalation threshold (AI score)', example: 40 }),
    __metadata("design:type", Number)
], CoachingSettingsDto.prototype, "riskEscalationThreshold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Auto-escalate high-risk deals', example: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CoachingSettingsDto.prototype, "autoEscalateHighRisk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Require comment on escalation', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CoachingSettingsDto.prototype, "requireCommentOnEscalation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Track MEDDICC completion', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CoachingSettingsDto.prototype, "trackMeddpiccCompletion", void 0);
class SaveCoachingSettingsRequestDto extends CoachingSettingsDto {
}
exports.SaveCoachingSettingsRequestDto = SaveCoachingSettingsRequestDto;
class GetCoachingSettingsResponseDto {
    managerId;
    settings;
    updatedAt;
}
exports.GetCoachingSettingsResponseDto = GetCoachingSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Manager ID' }),
    __metadata("design:type", String)
], GetCoachingSettingsResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coaching settings', type: CoachingSettingsDto }),
    __metadata("design:type", CoachingSettingsDto)
], GetCoachingSettingsResponseDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last updated' }),
    __metadata("design:type", Date)
], GetCoachingSettingsResponseDto.prototype, "updatedAt", void 0);
class GlobalSettingsDto {
    defaultBoardView;
    timezone;
    dateFormat;
    currencySymbol;
    theme;
}
exports.GlobalSettingsDto = GlobalSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Default board view', example: 'list' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GlobalSettingsDto.prototype, "defaultBoardView", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timezone', example: 'America/New_York' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GlobalSettingsDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date format', example: 'MM/DD/YYYY' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GlobalSettingsDto.prototype, "dateFormat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency symbol', example: '$' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GlobalSettingsDto.prototype, "currencySymbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Theme', example: 'light' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GlobalSettingsDto.prototype, "theme", void 0);
class SaveGlobalSettingsRequestDto extends GlobalSettingsDto {
}
exports.SaveGlobalSettingsRequestDto = SaveGlobalSettingsRequestDto;
class GetGlobalSettingsResponseDto {
    userId;
    settings;
    updatedAt;
}
exports.GetGlobalSettingsResponseDto = GetGlobalSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], GetGlobalSettingsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Global settings', type: GlobalSettingsDto }),
    __metadata("design:type", GlobalSettingsDto)
], GetGlobalSettingsResponseDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last updated' }),
    __metadata("design:type", Date)
], GetGlobalSettingsResponseDto.prototype, "updatedAt", void 0);
class AllSettingsResponseDto {
    userId;
    globalSettings;
    notificationSettings;
    coachingSettings;
    viewSettings;
    filterSettings;
}
exports.AllSettingsResponseDto = AllSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], AllSettingsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Global settings', type: GlobalSettingsDto }),
    __metadata("design:type", GlobalSettingsDto)
], AllSettingsResponseDto.prototype, "globalSettings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification settings', type: NotificationSettingsDto }),
    __metadata("design:type", NotificationSettingsDto)
], AllSettingsResponseDto.prototype, "notificationSettings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Coaching settings (managers only)', type: CoachingSettingsDto }),
    __metadata("design:type", CoachingSettingsDto)
], AllSettingsResponseDto.prototype, "coachingSettings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'View settings by board' }),
    __metadata("design:type", Object)
], AllSettingsResponseDto.prototype, "viewSettings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter settings by board' }),
    __metadata("design:type", Object)
], AllSettingsResponseDto.prototype, "filterSettings", void 0);
//# sourceMappingURL=settings.dto.js.map