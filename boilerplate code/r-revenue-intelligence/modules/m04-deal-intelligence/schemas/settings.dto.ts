import { IsEnum, IsOptional, IsString, IsBoolean, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum GroupByOption {
  NONE = 'NONE',
  REP = 'REP',
  STAGE = 'STAGE',
  FORECAST_CATEGORY = 'FORECAST_CATEGORY',
}

// ============= Filter Settings =============

export class FilterSettingDto {
  @ApiProperty({ description: 'Filter field', example: 'stage' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Filter operator', example: '=' })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Filter value', example: 'PROPOSAL' })
  value: any;

  @ApiProperty({ description: 'Is locked (cannot be removed)', example: false })
  @IsBoolean()
  isLocked: boolean;
}

export class SaveFiltersRequestDto {
  @ApiPropertyOptional({
    description: 'Board ID (if board-specific)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  boardId?: string;

  @ApiProperty({ description: 'Filters to save', type: [FilterSettingDto] })
  @IsArray()
  filters: FilterSettingDto[];
}

export class GetFiltersResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Board ID' })
  boardId?: string;

  @ApiProperty({ description: 'Saved filters', type: [FilterSettingDto] })
  filters: FilterSettingDto[];

  @ApiProperty({ description: 'Last updated' })
  updatedAt: Date;
}

// ============= View Settings =============

export class ColumnSettingDto {
  @ApiProperty({ description: 'Column key', example: 'dealName' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Column label', example: 'Deal Name' })
  @IsString()
  label: string;

  @ApiProperty({ description: 'Is visible', example: true })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({ description: 'Column order', example: 1 })
  order: number;

  @ApiProperty({ description: 'Is pinned', example: false })
  @IsBoolean()
  isPinned: boolean;

  @ApiPropertyOptional({ description: 'Column width in pixels', example: 200 })
  @IsOptional()
  width?: number;
}

export class ViewSettingsDto {
  @ApiPropertyOptional({ description: 'Board ID' })
  @IsString()
  @IsOptional()
  boardId?: string;

  @ApiPropertyOptional({ description: 'Columns configuration', type: [ColumnSettingDto] })
  @IsArray()
  @IsOptional()
  columns?: ColumnSettingDto[];

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'aiScore',
  })
  @IsString()
  @IsOptional()
  sortField?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Group by option',
    enum: GroupByOption,
    example: GroupByOption.REP,
  })
  @IsEnum(GroupByOption)
  @IsOptional()
  groupBy?: GroupByOption;

  @ApiPropertyOptional({
    description: 'Active tab',
    example: 'Pipeline',
  })
  @IsString()
  @IsOptional()
  activeTab?: string;

  @ApiPropertyOptional({
    description: 'Show completed tasks',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  showCompletedTasks?: boolean;

  @ApiPropertyOptional({
    description: 'Compact view mode',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  compactView?: boolean;
}

export class SaveViewSettingsRequestDto extends ViewSettingsDto {}

export class GetViewSettingsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Board ID' })
  boardId?: string;

  @ApiProperty({ description: 'View settings', type: ViewSettingsDto })
  settings: ViewSettingsDto;

  @ApiProperty({ description: 'Last updated' })
  updatedAt: Date;
}

// ============= Notification Settings =============

export class NotificationSettingsDto {
  @ApiProperty({ description: 'Email notifications enabled', example: true })
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty({ description: 'In-app notifications enabled', example: true })
  @IsBoolean()
  inAppEnabled: boolean;

  @ApiProperty({ description: 'Notify on deal warnings', example: true })
  @IsBoolean()
  notifyOnWarnings: boolean;

  @ApiProperty({ description: 'Notify on task assignments', example: true })
  @IsBoolean()
  notifyOnTaskAssignments: boolean;

  @ApiProperty({ description: 'Notify on comments', example: true })
  @IsBoolean()
  notifyOnComments: boolean;

  @ApiProperty({ description: 'Notify on risk escalations', example: true })
  @IsBoolean()
  notifyOnRiskEscalations: boolean;

  @ApiProperty({ description: 'Daily digest enabled', example: false })
  @IsBoolean()
  dailyDigestEnabled: boolean;

  @ApiProperty({ description: 'Weekly summary enabled', example: true })
  @IsBoolean()
  weeklySummaryEnabled: boolean;
}

export class SaveNotificationSettingsRequestDto extends NotificationSettingsDto {}

export class GetNotificationSettingsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Notification settings', type: NotificationSettingsDto })
  settings: NotificationSettingsDto;

  @ApiProperty({ description: 'Last updated' })
  updatedAt: Date;
}

// ============= Coaching Settings (Manager Only) =============

export class CoachingSettingsDto {
  @ApiProperty({ description: 'Auto-assign tasks to reps', example: true })
  @IsBoolean()
  autoAssignTasks: boolean;

  @ApiProperty({ description: 'Default task due days', example: 3 })
  defaultTaskDueDays: number;

  @ApiProperty({ description: 'Risk escalation threshold (AI score)', example: 40 })
  riskEscalationThreshold: number;

  @ApiProperty({ description: 'Auto-escalate high-risk deals', example: false })
  @IsBoolean()
  autoEscalateHighRisk: boolean;

  @ApiProperty({ description: 'Require comment on escalation', example: true })
  @IsBoolean()
  requireCommentOnEscalation: boolean;

  @ApiProperty({ description: 'Track MEDDICC completion', example: true })
  @IsBoolean()
  trackMeddpiccCompletion: boolean;
}

export class SaveCoachingSettingsRequestDto extends CoachingSettingsDto {}

export class GetCoachingSettingsResponseDto {
  @ApiProperty({ description: 'Manager ID' })
  managerId: string;

  @ApiProperty({ description: 'Coaching settings', type: CoachingSettingsDto })
  settings: CoachingSettingsDto;

  @ApiProperty({ description: 'Last updated' })
  updatedAt: Date;
}

// ============= Global User Settings =============

export class GlobalSettingsDto {
  @ApiProperty({ description: 'Default board view', example: 'list' })
  @IsString()
  defaultBoardView: string;

  @ApiProperty({ description: 'Timezone', example: 'America/New_York' })
  @IsString()
  timezone: string;

  @ApiProperty({ description: 'Date format', example: 'MM/DD/YYYY' })
  @IsString()
  dateFormat: string;

  @ApiProperty({ description: 'Currency symbol', example: '$' })
  @IsString()
  currencySymbol: string;

  @ApiProperty({ description: 'Theme', example: 'light' })
  @IsString()
  theme: string;
}

export class SaveGlobalSettingsRequestDto extends GlobalSettingsDto {}

export class GetGlobalSettingsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Global settings', type: GlobalSettingsDto })
  settings: GlobalSettingsDto;

  @ApiProperty({ description: 'Last updated' })
  updatedAt: Date;
}

// ============= All Settings Response =============

export class AllSettingsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Global settings', type: GlobalSettingsDto })
  globalSettings: GlobalSettingsDto;

  @ApiProperty({ description: 'Notification settings', type: NotificationSettingsDto })
  notificationSettings: NotificationSettingsDto;

  @ApiPropertyOptional({ description: 'Coaching settings (managers only)', type: CoachingSettingsDto })
  coachingSettings?: CoachingSettingsDto;

  @ApiProperty({ description: 'View settings by board' })
  viewSettings: Record<string, ViewSettingsDto>;

  @ApiProperty({ description: 'Filter settings by board' })
  filterSettings: Record<string, FilterSettingDto[]>;
}
