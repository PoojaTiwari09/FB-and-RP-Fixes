import { BoardAudience, BoardStatus, FilterOperator, FilterLogic, ColumnType, ColumnDataType, PermissionRole, PermissionSubjectType } from '@/entities';
export declare class BoardFilterResponseDto {
    id: string;
    fieldName: string;
    operator: FilterOperator;
    value?: any;
    logic: FilterLogic;
    order: number;
    isLocked: boolean;
}
export declare class BoardTabResponseDto {
    id: string;
    label: string;
    crmField: string;
    fieldValues: string[];
    order: number;
    showRollup: boolean;
}
export declare class BoardColumnResponseDto {
    id: string;
    label: string;
    fieldKey: string;
    type: ColumnType;
    dataType: ColumnDataType;
    order: number;
    isPinned: boolean;
    isVisible: boolean;
    isSortable: boolean;
    width?: number;
}
export declare class BoardPermissionResponseDto {
    id: string;
    subjectType: PermissionSubjectType;
    subjectId: string;
    role: PermissionRole;
    grantedBy: string;
    createdAt: Date;
}
export declare class BoardResponseDto {
    id: string;
    name: string;
    description?: string;
    audience: BoardAudience[];
    status: BoardStatus;
    ownerId: string;
    isLocked: boolean;
    allowRepColumnReorder: boolean;
    preventManualDealOverride: boolean;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    filters: BoardFilterResponseDto[];
    tabs: BoardTabResponseDto[];
    columns: BoardColumnResponseDto[];
    permissions: BoardPermissionResponseDto[];
    userPermission?: PermissionRole;
}
export declare class BoardListItemResponseDto {
    id: string;
    name: string;
    description?: string;
    audience: BoardAudience[];
    status: BoardStatus;
    ownerId: string;
    updatedAt: Date;
    userPermission: PermissionRole;
}
export declare class PaginatedBoardResponseDto {
    data: BoardListItemResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
