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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const export_service_1 = require("@/services/export.service");
const export_dto_1 = require("@/schemas/export.dto");
const auth_guard_1 = require("@/guards/auth.guard");
let ExportController = class ExportController {
    exportService;
    constructor(exportService) {
        this.exportService = exportService;
    }
    async createExport(dto, req) {
        return this.exportService.createExport(dto, req.user.id);
    }
    async downloadExport(exportId, res) {
        const { filePath, mimeType } = await this.exportService.getExportFile(exportId);
        const ext = mimeType === 'text/csv' ? 'csv' : mimeType === 'application/pdf' ? 'pdf' : 'xlsx';
        const fileName = `export-${exportId}.${ext}`;
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.download(filePath, fileName);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create export',
        description: 'Create a new export in CSV, Excel, or PDF format',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Export created successfully',
        type: export_dto_1.ExportResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_dto_1.ExportRequestDto, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "createExport", null);
__decorate([
    (0, common_1.Get)('download/:exportId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Download export',
        description: 'Download an export file',
    }),
    (0, swagger_1.ApiParam)({
        name: 'exportId',
        description: 'Export ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Export file downloaded successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Export not found or expired',
    }),
    __param(0, (0, common_1.Param)('exportId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "downloadExport", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('Exports'),
    (0, common_1.Controller)('exports'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map