import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BoardAudience,
  BoardStatus,
  FilterOperator,
  FilterLogic,
  ColumnType,
  ColumnDataType,
  PermissionRole,
  PermissionSubjectType,
} from '@/entities';

export class BoardFilterResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fieldName: string;

  @ApiProperty({ enum: FilterOperator })
  operator: FilterOperator;

  @ApiPropertyOptional()
  value?: any;

  @ApiProperty({ enum: FilterLogic })
  logic: FilterLogic;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isLocked: boolean;
}

export class BoardTabResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  crmField: string;

  @ApiProperty({ type: [String] })
  fieldValues: string[];

  @ApiProperty()
  order: number;

  @ApiProperty()
  showRollup: boolean;
}

export class BoardColumnResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  fieldKey: string;

  @ApiProperty({ enum: ColumnType })
  type: ColumnType;

  @ApiProperty({ enum: ColumnDataType })
  dataType: ColumnDataType;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isPinned: boolean;

  @ApiProperty()
  isVisible: boolean;

  @ApiProperty()
  isSortable: boolean;

  @ApiPropertyOptional()
  width?: number;
}

export class BoardPermissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PermissionSubjectType })
  subjectType: PermissionSubjectType;

  @ApiProperty()
  subjectId: string;

  @ApiProperty({ enum: PermissionRole })
  role: PermissionRole;

  @ApiProperty()
  grantedBy: string;

  @ApiProperty()
  createdAt: Date;
}

export class BoardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: BoardAudience, isArray: true })
  audience: BoardAudience[];

  @ApiProperty({ enum: BoardStatus })
  status: BoardStatus;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  isLocked: boolean;

  @ApiProperty()
  allowRepColumnReorder: boolean;

  @ApiProperty()
  preventManualDealOverride: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty({ type: [BoardFilterResponseDto] })
  filters: BoardFilterResponseDto[];

  @ApiProperty({ type: [BoardTabResponseDto] })
  tabs: BoardTabResponseDto[];

  @ApiProperty({ type: [BoardColumnResponseDto] })
  columns: BoardColumnResponseDto[];

  @ApiProperty({ type: [BoardPermissionResponseDto] })
  permissions: BoardPermissionResponseDto[];

  @ApiPropertyOptional({ enum: PermissionRole })
  userPermission?: PermissionRole;
}

export class BoardListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: BoardAudience, isArray: true })
  audience: BoardAudience[];

  @ApiProperty({ enum: BoardStatus })
  status: BoardStatus;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userPermission: PermissionRole;
}

export class PaginatedBoardResponseDto {
  @ApiProperty({ type: [BoardListItemResponseDto] })
  data: BoardListItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
