export declare enum ExportFormat {
    CSV = "CSV",
    PDF = "PDF",
    EXCEL = "EXCEL"
}
export declare enum ExportType {
    DEALS = "DEALS",
    BOARD = "BOARD",
    ACTIVITIES = "ACTIVITIES",
    TASKS = "TASKS",
    PLAYBOOK = "PLAYBOOK",
    TEAM_DIAGNOSTICS = "TEAM_DIAGNOSTICS",
    COACHING_ACTIVITY = "COACHING_ACTIVITY",
    FORECAST_SUMMARY = "FORECAST_SUMMARY",
    TOP_RISK_DEALS = "TOP_RISK_DEALS",
    ANALYTICS_REPORT = "ANALYTICS_REPORT"
}
export declare class ExportRequestDto {
    format: ExportFormat;
    type: ExportType;
    boardId?: string;
    dealId?: string;
    columns?: string[];
    startDate?: string;
    endDate?: string;
    stages?: string[];
    ownerIds?: string[];
    includeAiInsights?: boolean;
    includeHistoricalTrends?: boolean;
    activeTab?: string;
    template?: string;
}
export declare class ExportResponseDto {
    id: string;
    format: ExportFormat;
    type: ExportType;
    fileName: string;
    fileSize: number;
    downloadUrl: string;
    recordCount: number;
    createdAt: Date;
    expiresAt: Date;
}
