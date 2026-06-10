export declare enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}
export declare enum GroupByOption {
    NONE = "NONE",
    REP = "REP",
    STAGE = "STAGE",
    FORECAST_CATEGORY = "FORECAST_CATEGORY"
}
export declare class FilterSettingDto {
    field: string;
    operator: string;
    value: any;
    isLocked: boolean;
}
export declare class SaveFiltersRequestDto {
    boardId?: string;
    filters: FilterSettingDto[];
}
export declare class GetFiltersResponseDto {
    userId: string;
    boardId?: string;
    filters: FilterSettingDto[];
    updatedAt: Date;
}
export declare class ColumnSettingDto {
    key: string;
    label: string;
    visible: boolean;
    order: number;
    isPinned: boolean;
    width?: number;
}
export declare class ViewSettingsDto {
    boardId?: string;
    columns?: ColumnSettingDto[];
    sortField?: string;
    sortOrder?: SortOrder;
    groupBy?: GroupByOption;
    activeTab?: string;
    showCompletedTasks?: boolean;
    compactView?: boolean;
}
export declare class SaveViewSettingsRequestDto extends ViewSettingsDto {
}
export declare class GetViewSettingsResponseDto {
    userId: string;
    boardId?: string;
    settings: ViewSettingsDto;
    updatedAt: Date;
}
export declare class NotificationSettingsDto {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    notifyOnWarnings: boolean;
    notifyOnTaskAssignments: boolean;
    notifyOnComments: boolean;
    notifyOnRiskEscalations: boolean;
    dailyDigestEnabled: boolean;
    weeklySummaryEnabled: boolean;
}
export declare class SaveNotificationSettingsRequestDto extends NotificationSettingsDto {
}
export declare class GetNotificationSettingsResponseDto {
    userId: string;
    settings: NotificationSettingsDto;
    updatedAt: Date;
}
export declare class CoachingSettingsDto {
    autoAssignTasks: boolean;
    defaultTaskDueDays: number;
    riskEscalationThreshold: number;
    autoEscalateHighRisk: boolean;
    requireCommentOnEscalation: boolean;
    trackMeddpiccCompletion: boolean;
}
export declare class SaveCoachingSettingsRequestDto extends CoachingSettingsDto {
}
export declare class GetCoachingSettingsResponseDto {
    managerId: string;
    settings: CoachingSettingsDto;
    updatedAt: Date;
}
export declare class GlobalSettingsDto {
    defaultBoardView: string;
    timezone: string;
    dateFormat: string;
    currencySymbol: string;
    theme: string;
}
export declare class SaveGlobalSettingsRequestDto extends GlobalSettingsDto {
}
export declare class GetGlobalSettingsResponseDto {
    userId: string;
    settings: GlobalSettingsDto;
    updatedAt: Date;
}
export declare class AllSettingsResponseDto {
    userId: string;
    globalSettings: GlobalSettingsDto;
    notificationSettings: NotificationSettingsDto;
    coachingSettings?: CoachingSettingsDto;
    viewSettings: Record<string, ViewSettingsDto>;
    filterSettings: Record<string, FilterSettingDto[]>;
}
