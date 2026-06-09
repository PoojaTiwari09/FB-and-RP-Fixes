import { IsEnum, IsOptional, IsArray, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportFormat {
  CSV = 'CSV',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export enum ExportType {
  DEALS = 'DEALS',
  BOARD = 'BOARD',
  ACTIVITIES = 'ACTIVITIES',
  TASKS = 'TASKS',
  PLAYBOOK = 'PLAYBOOK',
  TEAM_DIAGNOSTICS = 'TEAM_DIAGNOSTICS',
  COACHING_ACTIVITY = 'COACHING_ACTIVITY',
  FORECAST_SUMMARY = 'FORECAST_SUMMARY',
  TOP_RISK_DEALS = 'TOP_RISK_DEALS',
  ANALYTICS_REPORT = 'ANALYTICS_REPORT',
}

export class ExportRequestDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    description: 'Export type',
    enum: ExportType,
    example: ExportType.DEALS,
  })
  @IsEnum(ExportType)
  type: ExportType;

  @ApiPropertyOptional({
    description: 'Board ID (for board exports)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  boardId?: string;

  @ApiPropertyOptional({
    description: 'Deal ID (for single deal exports)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Columns to include',
    example: ['name', 'stage', 'amount', 'closeDate'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columns?: string[];

  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by stage',
    example: ['Proposal Sent', 'Negotiation'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  stages?: string[];

  @ApiPropertyOptional({
    description: 'Filter by owner',
    example: ['owner-id-1', 'owner-id-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ownerIds?: string[];

  @ApiPropertyOptional({
    description: 'Include AI insights in export',
    example: true,
  })
  @IsOptional()
  includeAiInsights?: boolean;

  @ApiPropertyOptional({
    description: 'Include historical trends',
    example: false,
  })
  @IsOptional()
  includeHistoricalTrends?: boolean;

  @ApiPropertyOptional({
    description: 'Active tab filter (for board exports)',
    example: 'Commit',
  })
  @IsString()
  @IsOptional()
  activeTab?: string;

  @ApiPropertyOptional({
    description: 'Export template (for formatted reports)',
    example: 'executive-summary',
  })
  @IsString()
  @IsOptional()
  template?: string;
}

export class ExportResponseDto {
  @ApiProperty({
    description: 'Export ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  format: ExportFormat;

  @ApiProperty({
    description: 'Export type',
    enum: ExportType,
    example: ExportType.DEALS,
  })
  type: ExportType;

  @ApiProperty({
    description: 'File name',
    example: 'deals-export-2024-01-15.csv',
  })
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 15420,
  })
  fileSize: number;

  @ApiProperty({
    description: 'Download URL',
    example: '/api/v1/exports/download/123e4567-e89b-12d3-a456-426614174000',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'Number of records exported',
    example: 150,
  })
  recordCount: number;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Expires at timestamp',
    example: '2024-01-16T10:30:00Z',
  })
  expiresAt: Date;
}
