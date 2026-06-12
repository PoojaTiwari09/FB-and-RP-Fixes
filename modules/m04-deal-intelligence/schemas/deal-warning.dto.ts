import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarningType, WarningSeverity } from '@m04/entities';

export class GenerateWarningsDto {
  @ApiProperty({ description: 'Deal ID to generate warnings for' })
  dealId: string;
}

export class DealWarningResponseDto {
  @ApiProperty({ description: 'Warning ID' })
  id: string;

  @ApiProperty({ description: 'Deal ID' })
  dealId: string;

  @ApiProperty({ enum: WarningType, description: 'Warning type' })
  type: WarningType;

  @ApiProperty({ enum: WarningSeverity, description: 'Warning severity' })
  severity: WarningSeverity;

  @ApiProperty({ description: 'Warning message' })
  message: string;

  @ApiPropertyOptional({ description: 'Recommended action' })
  recommendedAction?: string;

  @ApiProperty({ description: 'Is warning active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Resolved timestamp' })
  resolvedAt?: Date;

  @ApiPropertyOptional({ description: 'Resolved by user ID' })
  resolvedBy?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class WarningListResponseDto {
  @ApiProperty({ type: [DealWarningResponseDto], description: 'List of warnings' })
  warnings: DealWarningResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

export class QueryWarningDto {
  @ApiPropertyOptional({ enum: WarningType, description: 'Filter by warning type' })
  @IsOptional()
  @IsEnum(WarningType)
  type?: WarningType;

  @ApiPropertyOptional({ enum: WarningSeverity, description: 'Filter by severity' })
  @IsOptional()
  @IsEnum(WarningSeverity)
  severity?: WarningSeverity;

  @ApiPropertyOptional({ description: 'Limit number of results', default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}

export class ResolveWarningDto {
  @ApiProperty({ description: 'Warning ID to resolve' })
  warningId: string;
}
