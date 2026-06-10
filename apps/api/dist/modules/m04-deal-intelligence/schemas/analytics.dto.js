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
exports.HistoricalMetricsResponseDto = exports.HistoricalDataPointDto = exports.HistoricalMetricsRequestDto = exports.ExecutiveAnalyticsResponseDto = exports.TopRiskDealDto = exports.ForecastMetricsDto = exports.ManagerAnalyticsResponseDto = exports.TeamDiagnosticsDto = exports.AEAnalyticsResponseDto = exports.TabRollupDto = exports.DealMetricsDto = exports.GetAnalyticsRequestDto = exports.MetricPeriod = exports.AnalyticsScope = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var AnalyticsScope;
(function (AnalyticsScope) {
    AnalyticsScope["PERSONAL"] = "PERSONAL";
    AnalyticsScope["TEAM"] = "TEAM";
    AnalyticsScope["EXECUTIVE"] = "EXECUTIVE";
})(AnalyticsScope || (exports.AnalyticsScope = AnalyticsScope = {}));
var MetricPeriod;
(function (MetricPeriod) {
    MetricPeriod["TODAY"] = "TODAY";
    MetricPeriod["THIS_WEEK"] = "THIS_WEEK";
    MetricPeriod["THIS_MONTH"] = "THIS_MONTH";
    MetricPeriod["THIS_QUARTER"] = "THIS_QUARTER";
    MetricPeriod["CUSTOM"] = "CUSTOM";
})(MetricPeriod || (exports.MetricPeriod = MetricPeriod = {}));
class GetAnalyticsRequestDto {
    scope;
    boardId;
    period;
    startDate;
    endDate;
}
exports.GetAnalyticsRequestDto = GetAnalyticsRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Analytics scope',
        enum: AnalyticsScope,
        example: AnalyticsScope.PERSONAL,
    }),
    (0, class_validator_1.IsEnum)(AnalyticsScope),
    __metadata("design:type", String)
], GetAnalyticsRequestDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Board ID for board-specific analytics',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetAnalyticsRequestDto.prototype, "boardId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metric period',
        enum: MetricPeriod,
        example: MetricPeriod.THIS_QUARTER,
    }),
    (0, class_validator_1.IsEnum)(MetricPeriod),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetAnalyticsRequestDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date for custom period',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetAnalyticsRequestDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date for custom period',
        example: '2024-12-31',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetAnalyticsRequestDto.prototype, "endDate", void 0);
class DealMetricsDto {
    aiScore;
    warningCount;
    activityStrength;
    playbookCompletion;
    contactCount;
    daysSinceLastActivity;
}
exports.DealMetricsDto = DealMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'AI Score (0-100)', example: 75 }),
    __metadata("design:type", Number)
], DealMetricsDto.prototype, "aiScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning count', example: 2 }),
    __metadata("design:type", Number)
], DealMetricsDto.prototype, "warningCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Activity strength (0-100)', example: 85 }),
    __metadata("design:type", Number)
], DealMetricsDto.prototype, "activityStrength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Playbook completion percentage', example: 66.67 }),
    __metadata("design:type", Number)
], DealMetricsDto.prototype, "playbookCompletion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Contact count', example: 5 }),
    __metadata("design:type", Number)
], DealMetricsDto.prototype, "contactCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Days since last activity', example: 3 }),
    __metadata("design:type", Number)
], DealMetricsDto.prototype, "daysSinceLastActivity", void 0);
class TabRollupDto {
    tabName;
    totalValue;
    dealCount;
    averageDealSize;
}
exports.TabRollupDto = TabRollupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tab name', example: 'Pipeline' }),
    __metadata("design:type", String)
], TabRollupDto.prototype, "tabName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total deal value', example: 1250000 }),
    __metadata("design:type", Number)
], TabRollupDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal count', example: 15 }),
    __metadata("design:type", Number)
], TabRollupDto.prototype, "dealCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average deal size', example: 83333.33 }),
    __metadata("design:type", Number)
], TabRollupDto.prototype, "averageDealSize", void 0);
class AEAnalyticsResponseDto {
    userId;
    totalPipelineValue;
    totalDealCount;
    averageAiScore;
    atRiskDealCount;
    tabRollups;
    topWarnings;
    activitySummary;
    nextStepsSummary;
}
exports.AEAnalyticsResponseDto = AEAnalyticsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], AEAnalyticsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total pipeline value', example: 2500000 }),
    __metadata("design:type", Number)
], AEAnalyticsResponseDto.prototype, "totalPipelineValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total deal count', example: 25 }),
    __metadata("design:type", Number)
], AEAnalyticsResponseDto.prototype, "totalDealCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average AI score', example: 72.5 }),
    __metadata("design:type", Number)
], AEAnalyticsResponseDto.prototype, "averageAiScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'At-risk deal count', example: 3 }),
    __metadata("design:type", Number)
], AEAnalyticsResponseDto.prototype, "atRiskDealCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tab rollups', type: [TabRollupDto] }),
    __metadata("design:type", Array)
], AEAnalyticsResponseDto.prototype, "tabRollups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Top warnings', example: ['No contact in 8 days', 'Single threaded'] }),
    __metadata("design:type", Array)
], AEAnalyticsResponseDto.prototype, "topWarnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Activity summary' }),
    __metadata("design:type", Object)
], AEAnalyticsResponseDto.prototype, "activitySummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Next steps summary' }),
    __metadata("design:type", Object)
], AEAnalyticsResponseDto.prototype, "nextStepsSummary", void 0);
class TeamDiagnosticsDto {
    repName;
    repId;
    totalValue;
    dealCount;
    averageAiScore;
    atRiskCount;
    averageMeddpiccCompletion;
}
exports.TeamDiagnosticsDto = TeamDiagnosticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rep name', example: 'John Doe' }),
    __metadata("design:type", String)
], TeamDiagnosticsDto.prototype, "repName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rep ID' }),
    __metadata("design:type", String)
], TeamDiagnosticsDto.prototype, "repId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total pipeline value', example: 1500000 }),
    __metadata("design:type", Number)
], TeamDiagnosticsDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal count', example: 12 }),
    __metadata("design:type", Number)
], TeamDiagnosticsDto.prototype, "dealCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average AI score', example: 68.5 }),
    __metadata("design:type", Number)
], TeamDiagnosticsDto.prototype, "averageAiScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'At-risk deal count', example: 2 }),
    __metadata("design:type", Number)
], TeamDiagnosticsDto.prototype, "atRiskCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average MEDDICC completion', example: 55.5 }),
    __metadata("design:type", Number)
], TeamDiagnosticsDto.prototype, "averageMeddpiccCompletion", void 0);
class ManagerAnalyticsResponseDto {
    managerId;
    teamPipelineValue;
    teamDealCount;
    teamAverageAiScore;
    totalAtRiskDeals;
    tabRollups;
    teamDiagnostics;
    coachingActivity;
    riskDistribution;
}
exports.ManagerAnalyticsResponseDto = ManagerAnalyticsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Manager ID' }),
    __metadata("design:type", String)
], ManagerAnalyticsResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Team pipeline value', example: 5000000 }),
    __metadata("design:type", Number)
], ManagerAnalyticsResponseDto.prototype, "teamPipelineValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Team deal count', example: 45 }),
    __metadata("design:type", Number)
], ManagerAnalyticsResponseDto.prototype, "teamDealCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Team average AI score', example: 70.2 }),
    __metadata("design:type", Number)
], ManagerAnalyticsResponseDto.prototype, "teamAverageAiScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total at-risk deals', example: 8 }),
    __metadata("design:type", Number)
], ManagerAnalyticsResponseDto.prototype, "totalAtRiskDeals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tab rollups', type: [TabRollupDto] }),
    __metadata("design:type", Array)
], ManagerAnalyticsResponseDto.prototype, "tabRollups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Team diagnostics', type: [TeamDiagnosticsDto] }),
    __metadata("design:type", Array)
], ManagerAnalyticsResponseDto.prototype, "teamDiagnostics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coaching activity summary' }),
    __metadata("design:type", Object)
], ManagerAnalyticsResponseDto.prototype, "coachingActivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Risk distribution' }),
    __metadata("design:type", Object)
], ManagerAnalyticsResponseDto.prototype, "riskDistribution", void 0);
class ForecastMetricsDto {
    totalCommit;
    targetValue;
    gapToTarget;
    gapPercentage;
    percentageAtRisk;
    dealCountByCategory;
}
exports.ForecastMetricsDto = ForecastMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total commit value', example: 3000000 }),
    __metadata("design:type", Number)
], ForecastMetricsDto.prototype, "totalCommit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target value', example: 3500000 }),
    __metadata("design:type", Number)
], ForecastMetricsDto.prototype, "targetValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Gap to target', example: -500000 }),
    __metadata("design:type", Number)
], ForecastMetricsDto.prototype, "gapToTarget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Gap percentage', example: -14.29 }),
    __metadata("design:type", Number)
], ForecastMetricsDto.prototype, "gapPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Percentage at risk', example: 25.5 }),
    __metadata("design:type", Number)
], ForecastMetricsDto.prototype, "percentageAtRisk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal count by category' }),
    __metadata("design:type", Object)
], ForecastMetricsDto.prototype, "dealCountByCategory", void 0);
class TopRiskDealDto {
    dealId;
    dealName;
    amount;
    primaryRisk;
    riskLevel;
    ownerName;
}
exports.TopRiskDealDto = TopRiskDealDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal ID' }),
    __metadata("design:type", String)
], TopRiskDealDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal name', example: 'Acme Corp - Enterprise License' }),
    __metadata("design:type", String)
], TopRiskDealDto.prototype, "dealName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal amount', example: 250000 }),
    __metadata("design:type", Number)
], TopRiskDealDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Primary risk reason', example: 'No contact in 14 days' }),
    __metadata("design:type", String)
], TopRiskDealDto.prototype, "primaryRisk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Risk level', example: 'HIGH' }),
    __metadata("design:type", String)
], TopRiskDealDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Owner name', example: 'Jane Smith' }),
    __metadata("design:type", String)
], TopRiskDealDto.prototype, "ownerName", void 0);
class ExecutiveAnalyticsResponseDto {
    forecastMetrics;
    tabRollups;
    topRiskDeals;
    summaryMetrics;
    trendData;
}
exports.ExecutiveAnalyticsResponseDto = ExecutiveAnalyticsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Forecast metrics', type: ForecastMetricsDto }),
    __metadata("design:type", ForecastMetricsDto)
], ExecutiveAnalyticsResponseDto.prototype, "forecastMetrics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tab rollups', type: [TabRollupDto] }),
    __metadata("design:type", Array)
], ExecutiveAnalyticsResponseDto.prototype, "tabRollups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Top risk deals', type: [TopRiskDealDto] }),
    __metadata("design:type", Array)
], ExecutiveAnalyticsResponseDto.prototype, "topRiskDeals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Summary metrics' }),
    __metadata("design:type", Object)
], ExecutiveAnalyticsResponseDto.prototype, "summaryMetrics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Trend data (last 30 days)' }),
    __metadata("design:type", Array)
], ExecutiveAnalyticsResponseDto.prototype, "trendData", void 0);
class HistoricalMetricsRequestDto {
    days;
    metricTypes;
}
exports.HistoricalMetricsRequestDto = HistoricalMetricsRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of days to look back',
        example: 30,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], HistoricalMetricsRequestDto.prototype, "days", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metric types to retrieve',
        example: ['aiScore', 'pipelineValue', 'atRiskCount'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], HistoricalMetricsRequestDto.prototype, "metricTypes", void 0);
class HistoricalDataPointDto {
    date;
    value;
}
exports.HistoricalDataPointDto = HistoricalDataPointDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date', example: '2024-01-15' }),
    __metadata("design:type", String)
], HistoricalDataPointDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric value', example: 72.5 }),
    __metadata("design:type", Number)
], HistoricalDataPointDto.prototype, "value", void 0);
class HistoricalMetricsResponseDto {
    metricName;
    dataPoints;
}
exports.HistoricalMetricsResponseDto = HistoricalMetricsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric name', example: 'aiScore' }),
    __metadata("design:type", String)
], HistoricalMetricsResponseDto.prototype, "metricName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data points', type: [HistoricalDataPointDto] }),
    __metadata("design:type", Array)
], HistoricalMetricsResponseDto.prototype, "dataPoints", void 0);
//# sourceMappingURL=analytics.dto.js.map