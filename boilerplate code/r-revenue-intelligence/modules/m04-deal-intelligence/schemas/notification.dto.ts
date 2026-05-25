import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  DEAL_STAGE_CHANGE = 'DEAL_STAGE_CHANGE',
  DEAL_WARNING = 'DEAL_WARNING',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  COMMENT_MENTION = 'COMMENT_MENTION',
  RISK_ESCALATION = 'RISK_ESCALATION',
  PLAYBOOK_COMPLETED = 'PLAYBOOK_COMPLETED',
  DEAL_CLOSING_SOON = 'DEAL_CLOSING_SOON',
  AI_SCORE_CHANGE = 'AI_SCORE_CHANGE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New task assigned',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'You have been assigned a new task: Follow up with decision maker',
  })
  message: string;

  @ApiProperty({
    description: 'Priority',
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Related deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Related entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Action URL',
    example: '/deals/123e4567-e89b-12d3-a456-426614174000/tasks',
  })
  actionUrl?: string;

  @ApiProperty({
    description: 'Read status',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Read at timestamp',
    example: '2024-01-15T11:00:00Z',
  })
  readAt?: Date;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

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

export class NotificationStatsDto {
  @ApiProperty({
    description: 'Total notifications',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Unread notifications',
    example: 12,
  })
  unread: number;

  @ApiProperty({
    description: 'Notifications by type',
    example: {
      TASK_ASSIGNED: 5,
      DEAL_WARNING: 3,
      COMMENT_MENTION: 4,
    },
  })
  byType: Record<NotificationType, number>;

  @ApiProperty({
    description: 'Notifications by priority',
    example: {
      URGENT: 2,
      HIGH: 5,
      MEDIUM: 3,
      LOW: 2,
    },
  })
  byPriority: Record<NotificationPriority, number>;
}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Notification IDs to mark as read',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsString({ each: true })
  notificationIds: string[];
}
