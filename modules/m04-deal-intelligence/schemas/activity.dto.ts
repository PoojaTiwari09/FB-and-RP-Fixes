import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@m04/entities/deal-activity.entity';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @ApiProperty({
    description: 'Activity type',
    enum: ActivityType,
    example: ActivityType.EMAIL,
  })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional({
    description: 'Activity subject',
    example: 'Follow-up call with decision maker',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Activity summary',
    example: 'Discussed pricing and implementation timeline',
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Contact ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Activity date',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  activityDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 30,
  })
  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'CRM activity ID',
    example: '12345678',
  })
  @IsString()
  @IsOptional()
  crmActivityId?: string;

  @ApiPropertyOptional({
    description: 'CRM data',
    example: {},
  })
  @IsOptional()
  crmData?: Record<string, any>;
}

export class UpdateActivityDto {
  @ApiPropertyOptional({
    description: 'Activity subject',
    example: 'Follow-up call with decision maker',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Activity summary',
    example: 'Discussed pricing and implementation timeline',
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Contact ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Activity date',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  activityDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 30,
  })
  @IsInt()
  @IsOptional()
  durationMinutes?: number;
}

export class ActivityResponseDto {
  @ApiProperty({
    description: 'Activity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Activity type',
    enum: ActivityType,
    example: ActivityType.EMAIL,
  })
  type: ActivityType;

  @ApiPropertyOptional({
    description: 'Activity subject',
    example: 'Follow-up call with decision maker',
  })
  subject?: string;

  @ApiPropertyOptional({
    description: 'Activity summary',
    example: 'Discussed pricing and implementation timeline',
  })
  summary?: string;

  @ApiPropertyOptional({
    description: 'Contact ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  contactId?: string;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'John Smith',
  })
  contactName?: string;

  @ApiProperty({
    description: 'Activity date',
    example: '2024-01-15T10:30:00Z',
  })
  activityDate: Date;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 30,
  })
  durationMinutes?: number;

  @ApiProperty({
    description: 'CRM activity ID',
    example: '12345678',
  })
  crmActivityId: string;

  @ApiPropertyOptional({
    description: 'CRM data',
    example: {},
  })
  crmData?: Record<string, any>;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class ActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by activity type',
    enum: ActivityType,
  })
  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

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
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}

export class ActivityTimelineDto {
  @ApiProperty({
    description: 'Total activities',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Activities by type',
    example: {
      EMAIL: 15,
      CALL: 10,
      MEETING: 8,
      NOTE: 12,
    },
  })
  byType: Record<ActivityType, number>;

  @ApiProperty({
    description: 'Recent activities',
    type: [ActivityResponseDto],
  })
  activities: ActivityResponseDto[];

  @ApiProperty({
    description: 'Last activity date',
    example: '2024-01-15T10:30:00Z',
  })
  lastActivityDate?: Date;
}
