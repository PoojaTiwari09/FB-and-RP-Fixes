import { IsEnum, IsString, IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaybookType, PlaybookItemStatus } from '@m04/entities/deal-playbook.entity';

// Re-export enums for controller use
export { PlaybookType, PlaybookItemStatus };

export class CreatePlaybookItemDto {
  @ApiProperty({
    description: 'Playbook type',
    enum: PlaybookType,
    example: PlaybookType.MEDDICC,
  })
  @IsEnum(PlaybookType)
  type: PlaybookType;

  @ApiProperty({
    description: 'Criterion name (e.g., Metrics, Economic Buyer)',
    example: 'Metrics',
  })
  @IsString()
  criterion: string;

  @ApiPropertyOptional({
    description: 'Notes for this criterion',
    example: 'Customer wants to reduce costs by 30%',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdatePlaybookItemDto {
  @ApiPropertyOptional({
    description: 'Playbook status',
    enum: PlaybookItemStatus,
    example: PlaybookItemStatus.COMPLETED,
  })
  @IsEnum(PlaybookItemStatus)
  @IsOptional()
  status?: PlaybookItemStatus;

  @ApiPropertyOptional({
    description: 'Notes for this criterion',
    example: 'Customer wants to reduce costs by 30%',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'AI-generated suggestion',
    example: 'Consider asking about current cost structure',
  })
  @IsString()
  @IsOptional()
  aiSuggestion?: string;
}

export class PlaybookItemResponseDto {
  @ApiProperty({
    description: 'Playbook item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Playbook type',
    enum: PlaybookType,
    example: PlaybookType.MEDDICC,
  })
  type: PlaybookType;

  @ApiProperty({
    description: 'Criterion name',
    example: 'Metrics',
  })
  criterion: string;

  @ApiProperty({
    description: 'Playbook status',
    enum: PlaybookItemStatus,
    example: PlaybookItemStatus.IN_PROGRESS,
  })
  status: PlaybookItemStatus;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Customer wants to reduce costs by 30%',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'AI suggestion',
    example: 'Consider asking about current cost structure',
  })
  aiSuggestion?: string;

  @ApiProperty({
    description: 'Display order',
    example: 1,
  })
  order: number;

  @ApiPropertyOptional({
    description: 'Completed by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  completedBy?: string;

  @ApiPropertyOptional({
    description: 'Completed at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class PlaybookSummaryDto {
  @ApiProperty({
    description: 'Playbook type',
    enum: PlaybookType,
    example: PlaybookType.MEDDICC,
  })
  type: PlaybookType;

  @ApiProperty({
    description: 'Total items',
    example: 7,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Completed items',
    example: 4,
  })
  completedItems: number;

  @ApiProperty({
    description: 'In progress items',
    example: 2,
  })
  inProgressItems: number;

  @ApiProperty({
    description: 'Not started items',
    example: 1,
  })
  notStartedItems: number;

  @ApiProperty({
    description: 'Completion percentage',
    example: 57.14,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Playbook items',
    type: [PlaybookItemResponseDto],
  })
  items: PlaybookItemResponseDto[];
}

export class GeneratePlaybookSuggestionsDto {
  @ApiProperty({
    description: 'Playbook type',
    enum: PlaybookType,
    example: PlaybookType.MEDDICC,
  })
  @IsEnum(PlaybookType)
  type: PlaybookType;
}
