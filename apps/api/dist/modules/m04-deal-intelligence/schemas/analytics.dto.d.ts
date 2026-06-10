export declare enum AnalyticsScope {
    PERSONAL = "PERSONAL",
    TEAM = "TEAM",
    EXECUTIVE = "EXECUTIVE"
}
export declare enum MetricPeriod {
    TODAY = "TODAY",
    THIS_WEEK = "THIS_WEEK",
    THIS_MONTH = "THIS_MONTH",
    THIS_QUARTER = "THIS_QUARTER",
    CUSTOM = "CUSTOM"
}
export declare class GetAnalyticsRequestDto {
    scope: AnalyticsScope;
    boardId?: string;
    period?: MetricPeriod;
    startDate?: string;
    endDate?: string;
}
export declare class DealMetricsDto {
    aiScore: number;
    warningCount: number;
    activityStrength: number;
    playbookCompletion: number;
    contactCount: number;
    daysSinceLastActivity: number;
}
export declare class TabRollupDto {
    tabName: string;
    totalValue: number;
    dealCount: number;
    averageDealSize: number;
}
export declare class AEAnalyticsResponseDto {
    userId: string;
    totalPipelineValue: number;
    totalDealCount: number;
    averageAiScore: number;
    atRiskDealCount: number;
    tabRollups: TabRollupDto[];
    topWarnings: string[];
    activitySummary: {
        callsThisWeek: number;
        emailsThisWeek: number;
        meetingsThisWeek: number;
    };
    nextStepsSummary: {
        totalTasks: number;
        completedTasks: number;
        overdueTasks: number;
    };
}
export declare class TeamDiagnosticsDto {
    repName: string;
    repId: string;
    totalValue: number;
    dealCount: number;
    averageAiScore: number;
    atRiskCount: number;
    averageMeddpiccCompletion: number;
}
export declare class ManagerAnalyticsResponseDto {
    managerId: string;
    teamPipelineValue: number;
    teamDealCount: number;
    teamAverageAiScore: number;
    totalAtRiskDeals: number;
    tabRollups: TabRollupDto[];
    teamDiagnostics: TeamDiagnosticsDto[];
    coachingActivity: {
        tasksAssigned: number;
        commentsAdded: number;
        dealsEscalated: number;
    };
    riskDistribution: {
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
    };
}
export declare class ForecastMetricsDto {
    totalCommit: number;
    targetValue: number;
    gapToTarget: number;
    gapPercentage: number;
    percentageAtRisk: number;
    dealCountByCategory: {
        commit: number;
        bestCase: number;
        pipeline: number;
    };
}
export declare class TopRiskDealDto {
    dealId: string;
    dealName: string;
    amount: number;
    primaryRisk: string;
    riskLevel: string;
    ownerName: string;
}
export declare class ExecutiveAnalyticsResponseDto {
    forecastMetrics: ForecastMetricsDto;
    tabRollups: TabRollupDto[];
    topRiskDeals: TopRiskDealDto[];
    summaryMetrics: {
        totalDeals: number;
        averageAiScore: number;
        averageDealSize: number;
        winRate: number;
    };
    trendData: {
        date: string;
        commitValue: number;
        atRiskCount: number;
    }[];
}
export declare class HistoricalMetricsRequestDto {
    days?: number;
    metricTypes?: string[];
}
export declare class HistoricalDataPointDto {
    date: string;
    value: number;
}
export declare class HistoricalMetricsResponseDto {
    metricName: string;
    dataPoints: HistoricalDataPointDto[];
}
