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
exports.M07DealAccountController = void 0;
const common_1 = require("@nestjs/common");
const shared_types_1 = require("@rri/shared-types");
const roles_decorator_1 = require("../decorators/roles.decorator");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const tenant_interceptor_1 = require("../interceptors/tenant.interceptor");
const m07_service_1 = require("../services/m07.service");
let M07DealAccountController = class M07DealAccountController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        return {
            module: 'm07-revenue-dashboards',
            message: 'OK',
            tenantId: req?.headers?.['x-tenant-id'] ?? null,
        };
    }
    create(dto, req) {
        return {
            module: 'm07-revenue-dashboards',
            message: 'Accepted',
            received: dto,
            tenantId: req?.headers?.['x-tenant-id'] ?? null,
        };
    }
    createDashboard(req, body) {
        return this.service.createDashboard(req.tenantContext.tenantId, req.tenantContext.userId, shared_types_1.createDashboardDtoSchema.parse(body));
    }
    getPipelineAnalysis(req, period = "This Quarter") {
        return this.service.getPipelineAnalysis(req.tenantContext.tenantId, period);
    }
    getCompetitiveAnalysis(req, period = "This Quarter") {
        return this.service.getCompetitiveAnalysis(req.tenantContext.tenantId, period);
    }
    getScorecardsAnalysis(req, period = "This Quarter") {
        return this.service.getScorecardsAnalysis(req.tenantContext.tenantId, period);
    }
    getEconomicPulse(req, period = "This Quarter") {
        return this.service.getEconomicPulse(req.tenantContext.tenantId, period);
    }
    getWidgetCatalog() {
        return this.service.getWidgetCatalog();
    }
    getTemplates(req) {
        return this.service.getTemplates(req.tenantContext.tenantId);
    }
    seedTemplates(req) {
        return this.service.seedTemplates(req.tenantContext.tenantId, req.tenantContext.userId);
    }
    createFromTemplate(req, templateId) {
        return this.service.createDashboardFromTemplate(req.tenantContext.tenantId, req.tenantContext.userId, templateId);
    }
    publishDashboard(req, id) {
        return this.service.updateDashboardStatus(req.tenantContext.tenantId, id, "PUBLISHED");
    }
    unpublishDashboard(req, id) {
        return this.service.updateDashboardStatus(req.tenantContext.tenantId, id, "DRAFT");
    }
    createWidget(req, body) {
        return this.service.createWidget(req.tenantContext.tenantId, shared_types_1.createWidgetDtoSchema.parse(body));
    }
    getKpis(req, timeRange = "CURRENT_QUARTER") {
        return this.service.getKpis(req.tenantContext.tenantId, req.tenantContext.userId, timeRange, req.tenantContext.role);
    }
    getSampleDashboard(timeRange = "CURRENT_QUARTER") {
        return this.service.getSampleDashboard(timeRange);
    }
    getSampleDashboardBuilderConfig() {
        return this.service.getSampleDashboardBuilderConfig();
    }
    addSampleWidget(body) {
        return this.service.addSampleWidget(body);
    }
    renderSampleDashboard(body) {
        return this.service.renderSampleDashboard(body);
    }
    exportSampleDashboard(body) {
        return this.service.exportSampleDashboard(body);
    }
    shareSampleDashboard(body) {
        return this.service.shareSampleDashboard(body.visibility);
    }
    removeSampleWidget(widgetId) {
        return this.service.removeSampleWidget(widgetId);
    }
    async shareDashboard(req, dashboardId, visibility) {
        return this.service.shareDashboard(req.tenantContext.tenantId, dashboardId, visibility);
    }
    exportDashboard(req, dashboardId) {
        return this.service.exportSnapshot(req.tenantContext.tenantId, dashboardId);
    }
    createDataset(req, body) {
        return this.service.createDataset(req.tenantContext.tenantId, req.tenantContext.userId, shared_types_1.createDatasetDtoSchema.parse(body));
    }
    preview(req) {
        return this.service.previewSample(req.tenantContext.tenantId);
    }
    getSampleBuilderConfig() {
        return this.service.getSampleBuilderConfig();
    }
    validateSampleDataset(body) {
        return this.service.validateSampleDataset(shared_types_1.createDatasetDtoSchema.parse(body));
    }
    saveSampleDataset(body) {
        return this.service.saveSampleDataset(shared_types_1.createDatasetDtoSchema.parse(body));
    }
    listSampleDatasets() {
        return this.service.listSampleDatasets();
    }
    getDatasets() {
        return this.service.getDatasets();
    }
    getWorkspaces(req) {
        return this.service.getWorkspaces(req.tenantContext.tenantId, req.tenantContext.userId);
    }
    saveWorkspace(req, body) {
        return this.service.saveWorkspace(req.tenantContext.tenantId, req.tenantContext.userId, body);
    }
    validateWidget(body) {
        return this.service.validateWidget(body);
    }
    queryWorkspace(req, body) {
        return this.service.queryWorkspace(req.tenantContext.tenantId, body);
    }
};
exports.M07DealAccountController = M07DealAccountController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("dashboards"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "createDashboard", null);
__decorate([
    (0, common_1.Get)("pipeline-analysis"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getPipelineAnalysis", null);
__decorate([
    (0, common_1.Get)("competitive-analysis"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getCompetitiveAnalysis", null);
__decorate([
    (0, common_1.Get)("scorecards-analysis"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getScorecardsAnalysis", null);
__decorate([
    (0, common_1.Get)("economic-pulse"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getEconomicPulse", null);
__decorate([
    (0, common_1.Get)("widgets/catalog"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getWidgetCatalog", null);
__decorate([
    (0, common_1.Get)("dashboards/templates"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)("dashboards/seed-templates"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "seedTemplates", null);
__decorate([
    (0, common_1.Post)("dashboards/from-template/:templateId"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("templateId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "createFromTemplate", null);
__decorate([
    (0, common_1.Post)("dashboards/:id/publish"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "publishDashboard", null);
__decorate([
    (0, common_1.Post)("dashboards/:id/unpublish"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "unpublishDashboard", null);
__decorate([
    (0, common_1.Post)("widgets"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "createWidget", null);
__decorate([
    (0, common_1.Get)("kpis"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "SALES_REP", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("timeRange")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getKpis", null);
__decorate([
    (0, common_1.Get)("sample-dashboard"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "SALES_REP", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Query)("timeRange")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getSampleDashboard", null);
__decorate([
    (0, common_1.Get)("sample-dashboard-builder/config"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "SALES_REP", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getSampleDashboardBuilderConfig", null);
__decorate([
    (0, common_1.Post)("sample-dashboard-builder/widgets"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "addSampleWidget", null);
__decorate([
    (0, common_1.Post)("sample-dashboard-builder/render"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "SALES_REP", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "renderSampleDashboard", null);
__decorate([
    (0, common_1.Post)("sample-dashboard-builder/export"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "exportSampleDashboard", null);
__decorate([
    (0, common_1.Post)("sample-dashboard-builder/share"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "shareSampleDashboard", null);
__decorate([
    (0, common_1.Post)("sample-dashboard-builder/widgets/:widgetId/delete"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)("widgetId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "removeSampleWidget", null);
__decorate([
    (0, common_1.Post)("dashboards/:id/share"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("visibility")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], M07DealAccountController.prototype, "shareDashboard", null);
__decorate([
    (0, common_1.Post)("dashboards/:dashboardId/export"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("dashboardId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "exportDashboard", null);
__decorate([
    (0, common_1.Post)("datasets"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "createDataset", null);
__decorate([
    (0, common_1.Get)("datasets/preview"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)("sample-builder"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getSampleBuilderConfig", null);
__decorate([
    (0, common_1.Post)("sample-builder/validate"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "validateSampleDataset", null);
__decorate([
    (0, common_1.Post)("sample-builder/save"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "saveSampleDataset", null);
__decorate([
    (0, common_1.Get)("sample-builder/datasets"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "listSampleDatasets", null);
__decorate([
    (0, common_1.Get)("datasets"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getDatasets", null);
__decorate([
    (0, common_1.Get)("workspaces"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "getWorkspaces", null);
__decorate([
    (0, common_1.Post)("workspaces"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "saveWorkspace", null);
__decorate([
    (0, common_1.Post)("workspaces/validate-widget"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "validateWidget", null);
__decorate([
    (0, common_1.Post)("workspaces/query"),
    (0, roles_decorator_1.Roles)("ADMIN", "MANAGER", "ANALYST", "SALES_REP"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M07DealAccountController.prototype, "queryWorkspace", null);
exports.M07DealAccountController = M07DealAccountController = __decorate([
    (0, common_1.Controller)("api/manager/revenue-dashboards"),
    __metadata("design:paramtypes", [m07_service_1.M07DealAccountService])
], M07DealAccountController);
//# sourceMappingURL=m07.controller.js.map