import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskSource {
  AI_SUGGESTED = 'AI_SUGGESTED',
  MANAGER_ASSIGNED = 'MANAGER_ASSIGNED',
  USER_CREATED = 'USER_CREATED',
}

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Schedule follow-up call with decision maker',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Discuss budget approval timeline and next steps',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({
    description: 'Assignee user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  assigneeId: string;

  @ApiProperty({
    description: 'Assignee name',
    example: 'John Doe',
  })
  @IsString()
  assigneeName: string;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-01-20',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Task source',
    enum: TaskSource,
    example: TaskSource.USER_CREATED,
  })
  @IsEnum(TaskSource)
  @IsOptional()
  source?: TaskSource;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Task title',
    example: 'Schedule follow-up call with decision maker',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Discuss budget approval timeline and next steps',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.COMPLETED,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-01-20',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class TaskResponseDto {
  @ApiProperty({
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Schedule follow-up call with decision maker',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Discuss budget approval timeline and next steps',
  })
  description?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  priority: TaskPriority;

  @ApiProperty({
    description: 'Task source',
    enum: TaskSource,
    example: TaskSource.USER_CREATED,
  })
  source: TaskSource;

  @ApiProperty({
    description: 'Assignee user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  assigneeId: string;

  @ApiProperty({
    description: 'Assignee name',
    example: 'John Doe',
  })
  assigneeName: string;

  @ApiPropertyOptional({
    description: 'Assigned by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  assignedBy?: string;

  @ApiPropertyOptional({
    description: 'Assigned by name',
    example: 'Jane Manager',
  })
  assignedByName?: string;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-01-20',
  })
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Completed at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Completed by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  completedBy?: string;

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

export class GenerateNextStepsDto {
  @ApiPropertyOptional({
    description: 'Number of next steps to generate',
    example: 3,
  })
  @IsOptional()
  count?: number;
}
