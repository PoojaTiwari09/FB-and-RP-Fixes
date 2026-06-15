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
var DataCloudController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCloudController = void 0;
const common_1 = require("@nestjs/common");
const data_cloud_service_1 = require("../services/data-cloud.service");
const jwt_guard_1 = require("../../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../../platform-core/guards/tenant.guard");
const m10_dev_auth_guard_1 = require("../../guards/m10-dev-auth.guard");
const M10AuthGuard = process.env.M10_STANDALONE_AUTH === "true" ? m10_dev_auth_guard_1.M10DevAuthGuard : jwt_guard_1.JwtAuthGuard;
const data_cloud_schema_1 = require("../schemas/data-cloud.schema");
let DataCloudController = DataCloudController_1 = class DataCloudController {
    service;
    logger = new common_1.Logger(DataCloudController_1.name);
    constructor(service) {
        this.service = service;
    }
    async registerConnection(req, body) {
        const parsed = data_cloud_schema_1.RegisterConnectionSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        this.logger.log(`POST exports/connections — tenant=${req.tenantId} dest=${parsed.data.destination}`);
        return this.service.registerConnection(req.tenantId, parsed.data);
    }
    async getConnections(req) {
        this.logger.debug(`GET exports/connections — tenant=${req.tenantId}`);
        return this.service.getConnections(req.tenantId);
    }
    async testConnection(req, id) {
        this.logger.log(`POST exports/connections/${id}/test — tenant=${req.tenantId}`);
        return this.service.testConnection(req.tenantId, id);
    }
    async triggerReplay(req, body) {
        const parsed = data_cloud_schema_1.ReplayExportSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: "Invalid request body",
                errors: parsed.error.flatten(),
            };
        }
        this.logger.log(`POST exports/replay — tenant=${req.tenantId} dataset=${parsed.data.datasetName}`);
        return this.service.triggerReplay(req.tenantId, parsed.data);
    }
    async getExportRuns(req, connectionId) {
        this.logger.debug(`GET exports/runs — tenant=${req.tenantId}`);
        return this.service.getExportRuns(req.tenantId, connectionId);
    }
    async downloadExport(req, runId, dataset, format = "csv", res) {
        const { stream, path, contentType } = await this.service.getExportDownloadStream(req.tenantId, runId, dataset, format);
        const filename = `${dataset}.${format === "csv" ? "csv" : "parquet"}`;
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        stream.pipe(res);
    }
};
exports.DataCloudController = DataCloudController;
__decorate([
    (0, common_1.Post)("exports/connections"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DataCloudController.prototype, "registerConnection", null);
__decorate([
    (0, common_1.Get)("exports/connections"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataCloudController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Post)("exports/connections/:id/test"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DataCloudController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)("exports/replay"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DataCloudController.prototype, "triggerReplay", null);
__decorate([
    (0, common_1.Get)("exports/runs"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("connectionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DataCloudController.prototype, "getExportRuns", null);
__decorate([
    (0, common_1.Get)("exports/runs/:runId/download"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("runId", new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Query)("dataset")),
    __param(3, (0, common_1.Query)("format")),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], DataCloudController.prototype, "downloadExport", null);
exports.DataCloudController = DataCloudController = DataCloudController_1 = __decorate([
    (0, common_1.Controller)("api/v1/m10-data-compliance"),
    (0, common_1.UseGuards)(M10AuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [data_cloud_service_1.DataCloudService])
], DataCloudController);
//# sourceMappingURL=data-cloud.controller.js.map