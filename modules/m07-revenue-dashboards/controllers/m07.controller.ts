import { Prisma } from '@rri/database';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  CreateDatasetDto,
  CreateDashboardDto,
  CreateWidgetDto,
  createDatasetDtoSchema,
  createDashboardDtoSchema,
  createWidgetDtoSchema,
} from "@rri/shared-types";
import { Roles } from "../decorators/roles.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { TenantInterceptor } from "../interceptors/tenant.interceptor";
import { M07DealAccountService } from "../services/m07.service";

type TenantRequest = { tenantContext: { tenantId: string; userId: string; role: string } };

@Controller("api/manager/revenue-dashboards")
export class M07DealAccountController {
  constructor(private readonly service: M07DealAccountService) {}

  // ── Smoke / health placeholder (legacy contract from the original M07 stub) ──
  // Kept un-guarded so the cross-module smoke driver can verify the route is
  // mounted without needing a JWT for dev/CI.
  @Get()
  findAll(@Req() req: any) {
    return {
      module: 'm07-revenue-dashboards',
      message: 'OK',
      tenantId: req?.headers?.['x-tenant-id'] ?? null,
    };
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return {
      module: 'm07-revenue-dashboards',
      message: 'Accepted',
      received: dto,
      tenantId: req?.headers?.['x-tenant-id'] ?? null,
    };
  }

  // ── Revenue Dashboard Endpoints ───────────────────────────────────────────────

  @Post("dashboards")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  createDashboard(@Req() req: TenantRequest, @Body() body: CreateDashboardDto) {
    return this.service.createDashboard(
      req.tenantContext.tenantId,
      req.tenantContext.userId,
      createDashboardDtoSchema.parse(body),
    );
  }

  @Get("pipeline-analysis")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getPipelineAnalysis(
    @Req() req: TenantRequest,
    @Query("period") period: string = "This Quarter",
  ) {
    return this.service.getPipelineAnalysis(req.tenantContext.tenantId, period);
  }

  @Get("competitive-analysis")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getCompetitiveAnalysis(
    @Req() req: TenantRequest,
    @Query("period") period: string = "This Quarter",
  ) {
    return this.service.getCompetitiveAnalysis(req.tenantContext.tenantId, period);
  }

  @Get("scorecards-analysis")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getScorecardsAnalysis(
    @Req() req: TenantRequest,
    @Query("period") period: string = "This Quarter",
  ) {
    return this.service.getScorecardsAnalysis(req.tenantContext.tenantId, period);
  }

  @Get("economic-pulse")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getEconomicPulse(
    @Req() req: TenantRequest,
    @Query("period") period: string = "This Quarter",
  ) {
    return this.service.getEconomicPulse(req.tenantContext.tenantId, period);
  }

  @Get("widgets/catalog")
  getWidgetCatalog() {
    return this.service.getWidgetCatalog();
  }

  @Get("dashboards/templates")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getTemplates(@Req() req: TenantRequest) {
    return this.service.getTemplates(req.tenantContext.tenantId);
  }

  @Post("dashboards/seed-templates")
  @Roles("ADMIN", "MANAGER")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  seedTemplates(@Req() req: TenantRequest) {
    return this.service.seedTemplates(req.tenantContext.tenantId, req.tenantContext.userId);
  }

  @Post("dashboards/from-template/:templateId")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  createFromTemplate(@Req() req: TenantRequest, @Param("templateId") templateId: string) {
    return this.service.createDashboardFromTemplate(req.tenantContext.tenantId, req.tenantContext.userId, templateId);
  }

  @Post("dashboards/:id/publish")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  publishDashboard(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.service.updateDashboardStatus(req.tenantContext.tenantId, id, "PUBLISHED");
  }

  @Post("dashboards/:id/unpublish")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  unpublishDashboard(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.service.updateDashboardStatus(req.tenantContext.tenantId, id, "DRAFT");
  }

  @Post("widgets")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  createWidget(@Req() req: TenantRequest, @Body() body: CreateWidgetDto) {
    return this.service.createWidget(
      req.tenantContext.tenantId,
      createWidgetDtoSchema.parse(body),
    );
  }

  @Get("kpis")
  @Roles("ADMIN", "MANAGER", "SALES_REP", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getKpis(
    @Req() req: TenantRequest,
    @Query("timeRange") timeRange: "CURRENT_QUARTER" | "LAST_QUARTER" = "CURRENT_QUARTER",
  ) {
    return this.service.getKpis(
      req.tenantContext.tenantId,
      req.tenantContext.userId,
      timeRange,
      req.tenantContext.role,
    );
  }

  @Get("sample-dashboard")
  @Roles("ADMIN", "MANAGER", "SALES_REP", "ANALYST")
  @UseGuards(RolesGuard)
  getSampleDashboard(
    @Query("timeRange") timeRange: "CURRENT_QUARTER" | "LAST_QUARTER" = "CURRENT_QUARTER",
  ) {
    return this.service.getSampleDashboard(timeRange);
  }

  @Get("sample-dashboard-builder/config")
  @Roles("ADMIN", "MANAGER", "SALES_REP", "ANALYST")
  @UseGuards(RolesGuard)
  getSampleDashboardBuilderConfig() {
    return this.service.getSampleDashboardBuilderConfig();
  }

  @Post("sample-dashboard-builder/widgets")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  addSampleWidget(
    @Body() body: {
      title: string;
      type: "KPI" | "BAR" | "LINE" | "PIE" | "FUNNEL";
      xField?: string;
      yMetric: string;
      filters?: Record<string, string>;
    },
  ) {
    return this.service.addSampleWidget(body);
  }

  @Post("sample-dashboard-builder/render")
  @Roles("ADMIN", "MANAGER", "SALES_REP", "ANALYST")
  @UseGuards(RolesGuard)
  renderSampleDashboard(
    @Body() body: {
      timeRange: "CURRENT_QUARTER" | "LAST_QUARTER";
      customer: string;
      team: string;
      metricFilter: string;
      widgets: Array<{
        id: string;
        title: string;
        type: "KPI" | "BAR" | "LINE" | "PIE" | "FUNNEL";
        xField?: string;
        yMetric: string;
        filters?: Record<string, string>;
      }>;
    },
  ) {
    return this.service.renderSampleDashboard(body);
  }

  @Post("sample-dashboard-builder/export")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  exportSampleDashboard(
    @Body() body: {
      timeRange: "CURRENT_QUARTER" | "LAST_QUARTER";
      customer: string;
      team: string;
      metricFilter: string;
      widgets: Array<{
        id: string;
        title: string;
        type: "KPI" | "BAR" | "LINE" | "PIE" | "FUNNEL";
        xField?: string;
        yMetric: string;
        filters?: Record<string, string>;
      }>;
    },
  ) {
    return this.service.exportSampleDashboard(body);
  }

  @Post("sample-dashboard-builder/share")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  shareSampleDashboard(@Body() body: { visibility: "PRIVATE" | "TEAM" | "LINK" }) {
    return this.service.shareSampleDashboard(body.visibility);
  }

  @Post("sample-dashboard-builder/widgets/:widgetId/delete")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  removeSampleWidget(@Param("widgetId") widgetId: string) {
    return this.service.removeSampleWidget(widgetId);
  }

  @Post("dashboards/:id/share")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  async shareDashboard(
    @Req() req: TenantRequest,
    @Param("id") dashboardId: string,
    @Body("visibility") visibility: "PRIVATE" | "TEAM" | "LINK"
  ) {
    return this.service.shareDashboard(req.tenantContext.tenantId, dashboardId, visibility);
  }

  @Post("dashboards/:dashboardId/export")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  exportDashboard(@Req() req: TenantRequest, @Param("dashboardId") dashboardId: string) {
    return this.service.exportSnapshot(req.tenantContext.tenantId, dashboardId);
  }

  // ── Dataset Endpoints ──────────────────────────────────────────────────────────

  @Post("datasets")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  createDataset(
    @Req() req: { tenantContext: { tenantId: string; userId: string } },
    @Body() body: CreateDatasetDto,
  ) {
    return this.service.createDataset(
      req.tenantContext.tenantId,
      req.tenantContext.userId,
      createDatasetDtoSchema.parse(body),
    );
  }

  @Get("datasets/preview")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  preview(@Req() req: { tenantContext: { tenantId: string } }) {
    return this.service.previewSample(req.tenantContext.tenantId);
  }

  @Get("sample-builder")
  getSampleBuilderConfig() {
    return this.service.getSampleBuilderConfig();
  }

  @Post("sample-builder/validate")
  validateSampleDataset(@Body() body: CreateDatasetDto) {
    return this.service.validateSampleDataset(createDatasetDtoSchema.parse(body));
  }

  @Post("sample-builder/save")
  saveSampleDataset(@Body() body: CreateDatasetDto) {
    return this.service.saveSampleDataset(createDatasetDtoSchema.parse(body));
  }

  @Get("sample-builder/datasets")
  listSampleDatasets() {
    return this.service.listSampleDatasets();
  }

  @Get("datasets")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getDatasets() {
    return this.service.getDatasets();
  }

  @Get("workspaces")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  getWorkspaces(
    @Req() req: { tenantContext: { tenantId: string; userId: string } },
  ) {
    return this.service.getWorkspaces(
      req.tenantContext.tenantId,
      req.tenantContext.userId,
    );
  }

  @Post("workspaces")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  saveWorkspace(
    @Req() req: { tenantContext: { tenantId: string; userId: string } },
    @Body() body: any,
  ) {
    return this.service.saveWorkspace(
      req.tenantContext.tenantId,
      req.tenantContext.userId,
      body,
    );
  }

  @Post("workspaces/validate-widget")
  @Roles("ADMIN", "MANAGER", "ANALYST")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  validateWidget(@Body() body: any) {
    return this.service.validateWidget(body);
  }

  @Post("workspaces/query")
  @Roles("ADMIN", "MANAGER", "ANALYST", "SALES_REP")
  @UseGuards(RolesGuard)
  @UseInterceptors(TenantInterceptor)
  queryWorkspace(
    @Req() req: { tenantContext: { tenantId: string } },
    @Body() body: any,
  ) {
    return this.service.queryWorkspace(req.tenantContext.tenantId, body);
  }
}
