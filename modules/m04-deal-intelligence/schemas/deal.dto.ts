import { IsOptional, IsString, IsEnum, IsNumber, IsDate, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStage, ForecastCategory } from '@m04/entities';

export class QueryDealDto {
  @ApiPropertyOptional({ description: 'Owner ID filter' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ enum: DealStage, description: 'Deal stage filter' })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @ApiPropertyOptional({ enum: ForecastCategory, description: 'Forecast category filter' })
  @IsOptional()
  @IsEnum(ForecastCategory)
  forecastCategory?: ForecastCategory;

  @ApiPropertyOptional({ description: 'Minimum deal amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum deal amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Close date from (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closeDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Close date to (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closeDateTo?: Date;

  @ApiPropertyOptional({ description: 'Filter high risk deals' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isHighRisk?: boolean;

  @ApiPropertyOptional({ description: 'Search by deal name or account name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 25, minimum: 1, maximum: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  limit?: number = 25;
}

export class UpdateDealDto {
  @ApiPropertyOptional({ description: 'Deal name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: DealStage, description: 'Deal stage' })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @ApiPropertyOptional({ description: 'Deal amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ enum: ForecastCategory, description: 'Forecast category' })
  @IsOptional()
  @IsEnum(ForecastCategory)
  forecastCategory?: ForecastCategory;

  @ApiPropertyOptional({ description: 'Close date (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closeDate?: Date;

  @ApiPropertyOptional({ description: 'Win probability (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ description: 'Next step description' })
  @IsOptional()
  @IsString()
  nextStep?: string;

  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  accountName?: string;
}

export class DealResponseDto {
  @ApiProperty({ description: 'Deal ID' })
  id: string;

  @ApiProperty({ description: 'CRM Deal ID' })
  crmDealId: string;

  @ApiProperty({ description: 'Deal name' })
  name: string;

  @ApiProperty({ enum: DealStage, description: 'Deal stage' })
  stage: DealStage;

  @ApiProperty({ description: 'Deal amount' })
  amount: number;

  @ApiProperty({ enum: ForecastCategory, description: 'Forecast category' })
  forecastCategory: ForecastCategory;

  @ApiProperty({ description: 'Owner ID' })
  ownerId: string;

  @ApiProperty({ description: 'Owner name' })
  ownerName: string;

  @ApiPropertyOptional({ description: 'Account ID' })
  accountId?: string;

  @ApiPropertyOptional({ description: 'Account name' })
  accountName?: string;

  @ApiPropertyOptional({ description: 'Close date' })
  closeDate?: Date;

  @ApiProperty({ description: 'Win probability (0-100)' })
  probability: number;

  @ApiProperty({ description: 'AI-generated score (0-100)' })
  aiScore: number;

  @ApiProperty({ description: 'Number of active warnings' })
  warningCount: number;

  @ApiProperty({ description: 'Number of contacts engaged' })
  contactCount: number;

  @ApiProperty({ description: 'Activity strength score (0-10)' })
  activityStrength: number;

  @ApiProperty({ description: 'Is deal flagged as high risk' })
  isHighRisk: boolean;

  @ApiPropertyOptional({ description: 'Risk reason if high risk' })
  riskReason?: string;

  @ApiPropertyOptional({ description: 'Next step description' })
  nextStep?: string;

  @ApiPropertyOptional({ description: 'Last activity timestamp' })
  lastActivityAt?: Date;

  @ApiPropertyOptional({ description: 'Last sync timestamp' })
  lastSyncedAt?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class DealListResponseDto {
  @ApiProperty({ type: [DealResponseDto], description: 'List of deals' })
  deals: DealResponseDto[];

  @ApiProperty({ description: 'Total number of deals' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

export class DealStatsResponseDto {
  @ApiProperty({ description: 'Total deal value' })
  totalValue: number;

  @ApiProperty({ description: 'Deal count by stage' })
  countByStage: Record<string, number>;

  @ApiProperty({ description: 'High risk deal count' })
  highRiskCount: number;

  @ApiProperty({ description: 'Deals closing in next 30 days' })
  closingSoonCount: number;
}
