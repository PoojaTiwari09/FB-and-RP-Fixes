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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBoardDto = exports.CreateBoardPermissionDto = exports.CreateBoardColumnDto = exports.CreateBoardTabDto = exports.CreateBoardFilterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const entities_1 = require("@m04/entities");
class CreateBoardFilterDto {
    fieldName;
    operator;
    value;
    logic;
    order;
    isLocked;
}
exports.CreateBoardFilterDto = CreateBoardFilterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CRM field name to filter on' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBoardFilterDto.prototype, "fieldName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.FilterOperator, description: 'Filter operator' }),
    (0, class_validator_1.IsEnum)(entities_1.FilterOperator),
    __metadata("design:type", typeof (_a = typeof entities_1.FilterOperator !== "undefined" && entities_1.FilterOperator) === "function" ? _a : Object)
], CreateBoardFilterDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter value (can be any type)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBoardFilterDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.FilterLogic, description: 'Logic to combine with next filter' }),
    (0, class_validator_1.IsEnum)(entities_1.FilterLogic),
    __metadata("design:type", typeof (_b = typeof entities_1.FilterLogic !== "undefined" && entities_1.FilterLogic) === "function" ? _b : Object)
], CreateBoardFilterDto.prototype, "logic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display order' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBoardFilterDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether filter is locked (cannot be removed by users)' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardFilterDto.prototype, "isLocked", void 0);
class CreateBoardTabDto {
    label;
    crmField;
    fieldValues;
    order;
    showRollup;
}
exports.CreateBoardTabDto = CreateBoardTabDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tab label' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBoardTabDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CRM field that drives tab values' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBoardTabDto.prototype, "crmField", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Field values that belong to this tab', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateBoardTabDto.prototype, "fieldValues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display order' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBoardTabDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether to show rollup totals' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardTabDto.prototype, "showRollup", void 0);
class CreateBoardColumnDto {
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
exports.CreateBoardColumnDto = CreateBoardColumnDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Column label' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBoardColumnDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Field key to display' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBoardColumnDto.prototype, "fieldKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ColumnType, description: 'Column type' }),
    (0, class_validator_1.IsEnum)(entities_1.ColumnType),
    __metadata("design:type", typeof (_c = typeof entities_1.ColumnType !== "undefined" && entities_1.ColumnType) === "function" ? _c : Object)
], CreateBoardColumnDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ColumnDataType, description: 'Data type' }),
    (0, class_validator_1.IsEnum)(entities_1.ColumnDataType),
    __metadata("design:type", typeof (_d = typeof entities_1.ColumnDataType !== "undefined" && entities_1.ColumnDataType) === "function" ? _d : Object)
], CreateBoardColumnDto.prototype, "dataType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display order' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBoardColumnDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether column is pinned' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardColumnDto.prototype, "isPinned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether column is visible' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardColumnDto.prototype, "isVisible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether column is sortable' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardColumnDto.prototype, "isSortable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Column width in pixels' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBoardColumnDto.prototype, "width", void 0);
class CreateBoardPermissionDto {
    subjectType;
    subjectId;
    role;
}
exports.CreateBoardPermissionDto = CreateBoardPermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.PermissionSubjectType, description: 'Subject type (user or team)' }),
    (0, class_validator_1.IsEnum)(entities_1.PermissionSubjectType),
    __metadata("design:type", typeof (_e = typeof entities_1.PermissionSubjectType !== "undefined" && entities_1.PermissionSubjectType) === "function" ? _e : Object)
], CreateBoardPermissionDto.prototype, "subjectType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User or team ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBoardPermissionDto.prototype, "subjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.PermissionRole, description: 'Permission role' }),
    (0, class_validator_1.IsEnum)(entities_1.PermissionRole),
    __metadata("design:type", typeof (_f = typeof entities_1.PermissionRole !== "undefined" && entities_1.PermissionRole) === "function" ? _f : Object)
], CreateBoardPermissionDto.prototype, "role", void 0);
class CreateBoardDto {
    name;
    description;
    audience;
    filters;
    tabs;
    columns;
    permissions;
    isLocked;
    allowRepColumnReorder;
    preventManualDealOverride;
}
exports.CreateBoardDto = CreateBoardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Board name (must be unique)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBoardDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Board description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateBoardDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: entities_1.BoardAudience,
        isArray: true,
        description: 'Target audience for this board',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(entities_1.BoardAudience, { each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateBoardDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Board filters', type: [CreateBoardFilterDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateBoardFilterDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateBoardDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Board tabs', type: [CreateBoardTabDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateBoardTabDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateBoardDto.prototype, "tabs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Board columns', type: [CreateBoardColumnDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateBoardColumnDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateBoardDto.prototype, "columns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Board permissions', type: [CreateBoardPermissionDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateBoardPermissionDto),
    __metadata("design:type", Array)
], CreateBoardDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether board structure is locked' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardDto.prototype, "isLocked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Allow reps to reorder columns' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardDto.prototype, "allowRepColumnReorder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prevent manual deal override' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBoardDto.prototype, "preventManualDealOverride", void 0);
//# sourceMappingURL=create-board.dto.js.map