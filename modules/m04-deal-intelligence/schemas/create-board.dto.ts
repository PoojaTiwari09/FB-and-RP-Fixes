import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BoardAudience,
  FilterOperator,
  FilterLogic,
  ColumnType,
  ColumnDataType,
  PermissionRole,
  PermissionSubjectType,
} from '@/entities';

export class CreateBoardFilterDto {
  @ApiProperty({ description: 'CRM field name to filter on' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fieldName: string;

  @ApiProperty({ enum: FilterOperator, description: 'Filter operator' })
  @IsEnum(FilterOperator)
  operator: FilterOperator;

  @ApiPropertyOptional({ description: 'Filter value (can be any type)' })
  @IsOptional()
  value?: any;

  @ApiProperty({ enum: FilterLogic, description: 'Logic to combine with next filter' })
  @IsEnum(FilterLogic)
  logic: FilterLogic;

  @ApiProperty({ description: 'Display order' })
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Whether filter is locked (cannot be removed by users)' })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}

export class CreateBoardTabDto {
  @ApiProperty({ description: 'Tab label' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label: string;

  @ApiProperty({ description: 'CRM field that drives tab values' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  crmField: string;

  @ApiProperty({ description: 'Field values that belong to this tab', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  fieldValues: string[];

  @ApiProperty({ description: 'Display order' })
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Whether to show rollup totals' })
  @IsBoolean()
  @IsOptional()
  showRollup?: boolean;
}

export class CreateBoardColumnDto {
  @ApiProperty({ description: 'Column label' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label: string;

  @ApiProperty({ description: 'Field key to display' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fieldKey: string;

  @ApiProperty({ enum: ColumnType, description: 'Column type' })
  @IsEnum(ColumnType)
  type: ColumnType;

  @ApiProperty({ enum: ColumnDataType, description: 'Data type' })
  @IsEnum(ColumnDataType)
  dataType: ColumnDataType;

  @ApiProperty({ description: 'Display order' })
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Whether column is pinned' })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiProperty({ description: 'Whether column is visible' })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({ description: 'Whether column is sortable' })
  @IsBoolean()
  @IsOptional()
  isSortable?: boolean;

  @ApiPropertyOptional({ description: 'Column width in pixels' })
  @IsOptional()
  width?: number;
}

export class CreateBoardPermissionDto {
  @ApiProperty({ enum: PermissionSubjectType, description: 'Subject type (user or team)' })
  @IsEnum(PermissionSubjectType)
  subjectType: PermissionSubjectType;

  @ApiProperty({ description: 'User or team ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ enum: PermissionRole, description: 'Permission role' })
  @IsEnum(PermissionRole)
  role: PermissionRole;
}

export class CreateBoardDto {
  @ApiProperty({ description: 'Board name (must be unique)' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Board description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    enum: BoardAudience,
    isArray: true,
    description: 'Target audience for this board',
  })
  @IsArray()
  @IsEnum(BoardAudience, { each: true })
  @ArrayMinSize(1)
  audience: BoardAudience[];

  @ApiProperty({ description: 'Board filters', type: [CreateBoardFilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBoardFilterDto)
  @ArrayMinSize(1)
  filters: CreateBoardFilterDto[];

  @ApiProperty({ description: 'Board tabs', type: [CreateBoardTabDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBoardTabDto)
  @ArrayMinSize(1)
  tabs: CreateBoardTabDto[];

  @ApiProperty({ description: 'Board columns', type: [CreateBoardColumnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBoardColumnDto)
  @ArrayMinSize(1)
  columns: CreateBoardColumnDto[];

  @ApiProperty({ description: 'Board permissions', type: [CreateBoardPermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBoardPermissionDto)
  permissions: CreateBoardPermissionDto[];

  @ApiProperty({ description: 'Whether board structure is locked' })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @ApiProperty({ description: 'Allow reps to reorder columns' })
  @IsBoolean()
  @IsOptional()
  allowRepColumnReorder?: boolean;

  @ApiProperty({ description: 'Prevent manual deal override' })
  @IsBoolean()
  @IsOptional()
  preventManualDealOverride?: boolean;
}
