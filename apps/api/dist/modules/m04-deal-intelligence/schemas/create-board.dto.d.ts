import { BoardAudience, FilterOperator, FilterLogic, ColumnType, ColumnDataType, PermissionRole, PermissionSubjectType } from '@/entities';
export declare class CreateBoardFilterDto {
    fieldName: string;
    operator: FilterOperator;
    value?: any;
    logic: FilterLogic;
    order?: number;
    isLocked?: boolean;
}
export declare class CreateBoardTabDto {
    label: string;
    crmField: string;
    fieldValues: string[];
    order?: number;
    showRollup?: boolean;
}
export declare class CreateBoardColumnDto {
    label: string;
    fieldKey: string;
    type: ColumnType;
    dataType: ColumnDataType;
    order?: number;
    isPinned?: boolean;
    isVisible?: boolean;
    isSortable?: boolean;
    width?: number;
}
export declare class CreateBoardPermissionDto {
    subjectType: PermissionSubjectType;
    subjectId: string;
    role: PermissionRole;
}
export declare class CreateBoardDto {
    name: string;
    description?: string;
    audience: BoardAudience[];
    filters: CreateBoardFilterDto[];
    tabs: CreateBoardTabDto[];
    columns: CreateBoardColumnDto[];
    permissions: CreateBoardPermissionDto[];
    isLocked?: boolean;
    allowRepColumnReorder?: boolean;
    preventManualDealOverride?: boolean;
}
