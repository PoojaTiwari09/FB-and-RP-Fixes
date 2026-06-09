import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSummaryDto {
  @ApiProperty({ description: 'Deal ID to generate summary for' })
  dealId: string;
}

export class DealSummaryResponseDto {
  @ApiProperty({ description: 'Summary ID' })
  id: string;

  @ApiProperty({ description: 'Deal ID' })
  dealId: string;

  @ApiProperty({ description: 'AI-generated summary text' })
  summary: string;

  @ApiProperty({ type: [String], description: 'Key points extracted' })
  keyPoints: string[];

  @ApiProperty({ type: [String], description: 'Recommended next steps' })
  nextSteps: string[];

  @ApiPropertyOptional({ type: [String], description: 'Competitor mentions' })
  competitorMentions?: string[];

  @ApiProperty({ description: 'AI confidence score (0-1)' })
  confidenceScore: number;

  @ApiProperty({ description: 'Flagged for manual review' })
  flaggedForReview: boolean;

  @ApiPropertyOptional({ description: 'Weekly changes detected' })
  weeklyChanges?: Record<string, any>;

  @ApiProperty({ description: 'Is this the current summary' })
  isCurrent: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class SummaryHistoryResponseDto {
  @ApiProperty({ type: [DealSummaryResponseDto], description: 'Summary history' })
  summaries: DealSummaryResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

export class WeeklyChangesResponseDto {
  @ApiProperty({ description: 'Has changes detected' })
  hasChanges: boolean;

  @ApiPropertyOptional({ description: 'Summary text changed' })
  summaryChanged?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Key points added' })
  keyPointsAdded?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Key points removed' })
  keyPointsRemoved?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Next steps added' })
  nextStepsAdded?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Next steps removed' })
  nextStepsRemoved?: string[];

  @ApiPropertyOptional({ description: 'Competitor changes' })
  competitorChanges?: {
    added: string[];
    removed: string[];
  };

  @ApiPropertyOptional({ description: 'Confidence score change' })
  confidenceScoreChange?: number;

  @ApiPropertyOptional({ description: 'Message if no changes' })
  message?: string;
}

export class QuerySummaryDto {
  @ApiPropertyOptional({ description: 'Limit number of results', default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}
