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
exports.ExportResponseDto = exports.ExportRequestDto = exports.ExportType = exports.ExportFormat = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["CSV"] = "CSV";
    ExportFormat["PDF"] = "PDF";
    ExportFormat["EXCEL"] = "EXCEL";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var ExportType;
(function (ExportType) {
    ExportType["DEALS"] = "DEALS";
    ExportType["BOARD"] = "BOARD";
    ExportType["ACTIVITIES"] = "ACTIVITIES";
    ExportType["TASKS"] = "TASKS";
    ExportType["PLAYBOOK"] = "PLAYBOOK";
    ExportType["TEAM_DIAGNOSTICS"] = "TEAM_DIAGNOSTICS";
    ExportType["COACHING_ACTIVITY"] = "COACHING_ACTIVITY";
    ExportType["FORECAST_SUMMARY"] = "FORECAST_SUMMARY";
    ExportType["TOP_RISK_DEALS"] = "TOP_RISK_DEALS";
    ExportType["ANALYTICS_REPORT"] = "ANALYTICS_REPORT";
})(ExportType || (exports.ExportType = ExportType = {}));
class ExportRequestDto {
    format;
    type;
    boardId;
    dealId;
    columns;
    startDate;
    endDate;
    stages;
    ownerIds;
    includeAiInsights;
    includeHistoricalTrends;
    activeTab;
    template;
}
exports.ExportRequestDto = ExportRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Export format',
        enum: ExportFormat,
        example: ExportFormat.CSV,
    }),
    (0, class_validator_1.IsEnum)(ExportFormat),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Export type',
        enum: ExportType,
        example: ExportType.DEALS,
    }),
    (0, class_validator_1.IsEnum)(ExportType),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Board ID (for board exports)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "boardId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Deal ID (for single deal exports)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Columns to include',
        example: ['name', 'stage', 'amount', 'closeDate'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ExportRequestDto.prototype, "columns", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date for filtering',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date for filtering',
        example: '2024-12-31',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by stage',
        example: ['Proposal Sent', 'Negotiation'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ExportRequestDto.prototype, "stages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by owner',
        example: ['owner-id-1', 'owner-id-2'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ExportRequestDto.prototype, "ownerIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Include AI insights in export',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ExportRequestDto.prototype, "includeAiInsights", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Include historical trends',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ExportRequestDto.prototype, "includeHistoricalTrends", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Active tab filter (for board exports)',
        example: 'Commit',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "activeTab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Export template (for formatted reports)',
        example: 'executive-summary',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "template", void 0);
class ExportResponseDto {
    id;
    format;
    type;
    fileName;
    fileSize;
    downloadUrl;
    recordCount;
    createdAt;
    expiresAt;
}
exports.ExportResponseDto = ExportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Export ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ExportResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Export format',
        enum: ExportFormat,
        example: ExportFormat.CSV,
    }),
    __metadata("design:type", String)
], ExportResponseDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Export type',
        enum: ExportType,
        example: ExportType.DEALS,
    }),
    __metadata("design:type", String)
], ExportResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File name',
        example: 'deals-export-2024-01-15.csv',
    }),
    __metadata("design:type", String)
], ExportResponseDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File size in bytes',
        example: 15420,
    }),
    __metadata("design:type", Number)
], ExportResponseDto.prototype, "fileSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Download URL',
        example: '/api/v1/exports/download/123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ExportResponseDto.prototype, "downloadUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of records exported',
        example: 150,
    }),
    __metadata("design:type", Number)
], ExportResponseDto.prototype, "recordCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ExportResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Expires at timestamp',
        example: '2024-01-16T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ExportResponseDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=export.dto.js.map