import { IsEnum, IsOptional, IsString, IsDateString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsScope {
  PERSONAL = 'PERSONAL',
  TEAM = 'TEAM',
  EXECUTIVE = 'EXECUTIVE',
}

export enum MetricPeriod {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  CUSTOM = 'CUSTOM',
}

// ============= Request DTOs =============

export class GetAnalyticsRequestDto {
  @ApiProperty({
    description: 'Analytics scope',
    enum: AnalyticsScope,
    example: AnalyticsScope.PERSONAL,
  })
  @IsEnum(AnalyticsScope)
  scope: AnalyticsScope;

  @ApiPropertyOptional({
    description: 'Board ID for board-specific analytics',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  boardId?: string;

  @ApiPropertyOptional({
    description: 'Metric period',
    enum: MetricPeriod,
    example: MetricPeriod.THIS_QUARTER,
  })
  @IsEnum(MetricPeriod)
  @IsOptional()
  period?: MetricPeriod;

  @ApiPropertyOptional({
    description: 'Start date for custom period',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom period',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

// ============= Response DTOs =============

export class DealMetricsDto {
  @ApiProperty({ description: 'AI Score (0-100)', example: 75 })
  aiScore: number;

  @ApiProperty({ description: 'Warning count', example: 2 })
  warningCount: number;

  @ApiProperty({ description: 'Activity strength (0-100)', example: 85 })
  activityStrength: number;

  @ApiProperty({ description: 'Playbook completion percentage', example: 66.67 })
  playbookCompletion: number;

  @ApiProperty({ description: 'Contact count', example: 5 })
  contactCount: number;

  @ApiProperty({ description: 'Days since last activity', example: 3 })
  daysSinceLastActivity: number;
}

export class TabRollupDto {
  @ApiProperty({ description: 'Tab name', example: 'Pipeline' })
  tabName: string;

  @ApiProperty({ description: 'Total deal value', example: 1250000 })
  totalValue: number;

  @ApiProperty({ description: 'Deal count', example: 15 })
  dealCount: number;

  @ApiProperty({ description: 'Average deal size', example: 83333.33 })
  averageDealSize: number;
}

export class AEAnalyticsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Total pipeline value', example: 2500000 })
  totalPipelineValue: number;

  @ApiProperty({ description: 'Total deal count', example: 25 })
  totalDealCount: number;

  @ApiProperty({ description: 'Average AI score', example: 72.5 })
  averageAiScore: number;

  @ApiProperty({ description: 'At-risk deal count', example: 3 })
  atRiskDealCount: number;

  @ApiProperty({ description: 'Tab rollups', type: [TabRollupDto] })
  tabRollups: TabRollupDto[];

  @ApiProperty({ description: 'Top warnings', example: ['No contact in 8 days', 'Single threaded'] })
  topWarnings: string[];

  @ApiProperty({ description: 'Activity summary' })
  activitySummary: {
    callsThisWeek: number;
    emailsThisWeek: number;
    meetingsThisWeek: number;
  };

  @ApiProperty({ description: 'Next steps summary' })
  nextStepsSummary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
}

export class TeamDiagnosticsDto {
  @ApiProperty({ description: 'Rep name', example: 'John Doe' })
  repName: string;

  @ApiProperty({ description: 'Rep ID' })
  repId: string;

  @ApiProperty({ description: 'Total pipeline value', example: 1500000 })
  totalValue: number;

  @ApiProperty({ description: 'Deal count', example: 12 })
  dealCount: number;

  @ApiProperty({ description: 'Average AI score', example: 68.5 })
  averageAiScore: number;

  @ApiProperty({ description: 'At-risk deal count', example: 2 })
  atRiskCount: number;

  @ApiProperty({ description: 'Average MEDDICC completion', example: 55.5 })
  averageMeddpiccCompletion: number;
}

export class ManagerAnalyticsResponseDto {
  @ApiProperty({ description: 'Manager ID' })
  managerId: string;

  @ApiProperty({ description: 'Team pipeline value', example: 5000000 })
  teamPipelineValue: number;

  @ApiProperty({ description: 'Team deal count', example: 45 })
  teamDealCount: number;

  @ApiProperty({ description: 'Team average AI score', example: 70.2 })
  teamAverageAiScore: number;

  @ApiProperty({ description: 'Total at-risk deals', example: 8 })
  totalAtRiskDeals: number;

  @ApiProperty({ description: 'Tab rollups', type: [TabRollupDto] })
  tabRollups: TabRollupDto[];

  @ApiProperty({ description: 'Team diagnostics', type: [TeamDiagnosticsDto] })
  teamDiagnostics: TeamDiagnosticsDto[];

  @ApiProperty({ description: 'Coaching activity summary' })
  coachingActivity: {
    tasksAssigned: number;
    commentsAdded: number;
    dealsEscalated: number;
  };

  @ApiProperty({ description: 'Risk distribution' })
  riskDistribution: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

export class ForecastMetricsDto {
  @ApiProperty({ description: 'Total commit value', example: 3000000 })
  totalCommit: number;

  @ApiProperty({ description: 'Target value', example: 3500000 })
  targetValue: number;

  @ApiProperty({ description: 'Gap to target', example: -500000 })
  gapToTarget: number;

  @ApiProperty({ description: 'Gap percentage', example: -14.29 })
  gapPercentage: number;

  @ApiProperty({ description: 'Percentage at risk', example: 25.5 })
  percentageAtRisk: number;

  @ApiProperty({ description: 'Deal count by category' })
  dealCountByCategory: {
    commit: number;
    bestCase: number;
    pipeline: number;
  };
}

export class TopRiskDealDto {
  @ApiProperty({ description: 'Deal ID' })
  dealId: string;

  @ApiProperty({ description: 'Deal name', example: 'Acme Corp - Enterprise License' })
  dealName: string;

  @ApiProperty({ description: 'Deal amount', example: 250000 })
  amount: number;

  @ApiProperty({ description: 'Primary risk reason', example: 'No contact in 14 days' })
  primaryRisk: string;

  @ApiProperty({ description: 'Risk level', example: 'HIGH' })
  riskLevel: string;

  @ApiProperty({ description: 'Owner name', example: 'Jane Smith' })
  ownerName: string;
}

export class ExecutiveAnalyticsResponseDto {
  @ApiProperty({ description: 'Forecast metrics', type: ForecastMetricsDto })
  forecastMetrics: ForecastMetricsDto;

  @ApiProperty({ description: 'Tab rollups', type: [TabRollupDto] })
  tabRollups: TabRollupDto[];

  @ApiProperty({ description: 'Top risk deals', type: [TopRiskDealDto] })
  topRiskDeals: TopRiskDealDto[];

  @ApiProperty({ description: 'Summary metrics' })
  summaryMetrics: {
    totalDeals: number;
    averageAiScore: number;
    averageDealSize: number;
    winRate: number;
  };

  @ApiProperty({ description: 'Trend data (last 30 days)' })
  trendData: {
    date: string;
    commitValue: number;
    atRiskCount: number;
  }[];
}

// ============= Historical Analytics =============

export class HistoricalMetricsRequestDto {
  @ApiPropertyOptional({
    description: 'Number of days to look back',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  days?: number;

  @ApiPropertyOptional({
    description: 'Metric types to retrieve',
    example: ['aiScore', 'pipelineValue', 'atRiskCount'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metricTypes?: string[];
}

export class HistoricalDataPointDto {
  @ApiProperty({ description: 'Date', example: '2024-01-15' })
  date: string;

  @ApiProperty({ description: 'Metric value', example: 72.5 })
  value: number;
}

export class HistoricalMetricsResponseDto {
  @ApiProperty({ description: 'Metric name', example: 'aiScore' })
  metricName: string;

  @ApiProperty({ description: 'Data points', type: [HistoricalDataPointDto] })
  dataPoints: HistoricalDataPointDto[];
}
