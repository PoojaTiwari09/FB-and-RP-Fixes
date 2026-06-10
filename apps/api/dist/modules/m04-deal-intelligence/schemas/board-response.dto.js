"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedBoardResponseDto = exports.BoardListItemResponseDto = exports.BoardResponseDto = exports.BoardPermissionResponseDto = exports.BoardColumnResponseDto = exports.BoardTabResponseDto = exports.BoardFilterResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const entities_1 = require("@/entities");
class BoardFilterResponseDto {
    id;
    fieldName;
    operator;
    value;
    logic;
    order;
    isLocked;
}
exports.BoardFilterResponseDto = BoardFilterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardFilterResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardFilterResponseDto.prototype, "fieldName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.FilterOperator }),
    __metadata("design:type", String)
], BoardFilterResponseDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], BoardFilterResponseDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.FilterLogic }),
    __metadata("design:type", String)
], BoardFilterResponseDto.prototype, "logic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BoardFilterResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardFilterResponseDto.prototype, "isLocked", void 0);
class BoardTabResponseDto {
    id;
    label;
    crmField;
    fieldValues;
    order;
    showRollup;
}
exports.BoardTabResponseDto = BoardTabResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardTabResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardTabResponseDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardTabResponseDto.prototype, "crmField", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], BoardTabResponseDto.prototype, "fieldValues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BoardTabResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardTabResponseDto.prototype, "showRollup", void 0);
class BoardColumnResponseDto {
    id;
    label;
    fieldKey;
    type;
    dataType;
    order;
    isPinned;
    isVisible;
    isSortable;
    width;
}
exports.BoardColumnResponseDto = BoardColumnResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardColumnResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardColumnResponseDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardColumnResponseDto.prototype, "fieldKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ColumnType }),
    __metadata("design:type", String)
], BoardColumnResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ColumnDataType }),
    __metadata("design:type", String)
], BoardColumnResponseDto.prototype, "dataType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BoardColumnResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardColumnResponseDto.prototype, "isPinned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardColumnResponseDto.prototype, "isVisible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardColumnResponseDto.prototype, "isSortable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], BoardColumnResponseDto.prototype, "width", void 0);
class BoardPermissionResponseDto {
    id;
    subjectType;
    subjectId;
    role;
    grantedBy;
    createdAt;
}
exports.BoardPermissionResponseDto = BoardPermissionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardPermissionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.PermissionSubjectType }),
    __metadata("design:type", String)
], BoardPermissionResponseDto.prototype, "subjectType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardPermissionResponseDto.prototype, "subjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.PermissionRole }),
    __metadata("design:type", String)
], BoardPermissionResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardPermissionResponseDto.prototype, "grantedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BoardPermissionResponseDto.prototype, "createdAt", void 0);
class BoardResponseDto {
    id;
    name;
    description;
    audience;
    status;
    ownerId;
    isLocked;
    allowRepColumnReorder;
    preventManualDealOverride;
    createdAt;
    updatedAt;
    publishedAt;
    filters;
    tabs;
    columns;
    permissions;
    userPermission;
}
exports.BoardResponseDto = BoardResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BoardResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.BoardAudience, isArray: true }),
    __metadata("design:type", Array)
], BoardResponseDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.BoardStatus }),
    __metadata("design:type", String)
], BoardResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardResponseDto.prototype, "isLocked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardResponseDto.prototype, "allowRepColumnReorder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BoardResponseDto.prototype, "preventManualDealOverride", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BoardResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BoardResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], BoardResponseDto.prototype, "publishedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BoardFilterResponseDto] }),
    __metadata("design:type", Array)
], BoardResponseDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BoardTabResponseDto] }),
    __metadata("design:type", Array)
], BoardResponseDto.prototype, "tabs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BoardColumnResponseDto] }),
    __metadata("design:type", Array)
], BoardResponseDto.prototype, "columns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BoardPermissionResponseDto] }),
    __metadata("design:type", Array)
], BoardResponseDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.PermissionRole }),
    __metadata("design:type", String)
], BoardResponseDto.prototype, "userPermission", void 0);
class BoardListItemResponseDto {
    id;
    name;
    description;
    audience;
    status;
    ownerId;
    updatedAt;
    userPermission;
}
exports.BoardListItemResponseDto = BoardListItemResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardListItemResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardListItemResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BoardListItemResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.BoardAudience, isArray: true }),
    __metadata("design:type", Array)
], BoardListItemResponseDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.BoardStatus }),
    __metadata("design:type", String)
], BoardListItemResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardListItemResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BoardListItemResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BoardListItemResponseDto.prototype, "userPermission", void 0);
class PaginatedBoardResponseDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.PaginatedBoardResponseDto = PaginatedBoardResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BoardListItemResponseDto] }),
    __metadata("design:type", Array)
], PaginatedBoardResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedBoardResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedBoardResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedBoardResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedBoardResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=board-response.dto.js.map