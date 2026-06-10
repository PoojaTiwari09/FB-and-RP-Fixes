"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M04DealIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const schedule_1 = require("@nestjs/schedule");
const m04_database_module_1 = require("./database/m04-database.module");
const deal_board_controller_1 = require("./controllers/deal-board.controller");
const deal_controller_1 = require("./controllers/deal.controller");
const deal_summary_controller_1 = require("./controllers/deal-summary.controller");
const deal_warning_controller_1 = require("./controllers/deal-warning.controller");
const sync_controller_1 = require("./controllers/sync.controller");
const auth_controller_1 = require("./controllers/auth.controller");
const deal_playbook_controller_1 = require("./controllers/deal-playbook.controller");
const deal_task_controller_1 = require("./controllers/deal-task.controller");
const deal_comment_controller_1 = require("./controllers/deal-comment.controller");
const risk_escalation_controller_1 = require("./controllers/risk-escalation.controller");
const ai_score_controller_1 = require("./controllers/ai-score.controller");
const deal_activity_controller_1 = require("./controllers/deal-activity.controller");
const coaching_controller_1 = require("./controllers/coaching.controller");
const export_controller_1 = require("./controllers/export.controller");
const webhook_controller_1 = require("./controllers/webhook.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const settings_controller_1 = require("./controllers/settings.controller");
const m04_test_controller_1 = require("./controllers/m04-test.controller");
const deal_board_service_1 = require("./services/deal-board.service");
const audit_log_service_1 = require("./services/audit-log.service");
const hubspot_client_service_1 = require("./services/hubspot-client.service");
const deal_sync_service_1 = require("./services/deal-sync.service");
const ai_client_service_1 = require("./services/ai-client.service");
const deal_service_1 = require("./services/deal.service");
const deal_summary_service_1 = require("./services/deal-summary.service");
const deal_warning_service_1 = require("./services/deal-warning.service");
const auth_service_1 = require("./services/auth.service");
const deal_playbook_service_1 = require("./services/deal-playbook.service");
const deal_task_service_1 = require("./services/deal-task.service");
const deal_comment_service_1 = require("./services/deal-comment.service");
const ai_score_service_1 = require("./services/ai-score.service");
const deal_activity_service_1 = require("./services/deal-activity.service");
const coaching_service_1 = require("./services/coaching.service");
const export_service_1 = require("./services/export.service");
const webhook_service_1 = require("./services/webhook.service");
const analytics_service_1 = require("./services/analytics.service");
const settings_service_1 = require("./services/settings.service");
const deal_board_repository_1 = require("./repositories/deal-board.repository");
const deal_repository_1 = require("./repositories/deal.repository");
const session_user_middleware_1 = require("./middleware/session-user.middleware");
const prisma_module_1 = require("./database/prisma.module");
const deals_controller_1 = require("./controllers/deals.controller");
const deal_drivers_api_controller_1 = require("./controllers/deal-drivers-api.controller");
const deal_drivers_manager_controller_1 = require("./controllers/deal-drivers-manager.controller");
const deal_drivers_deal_controller_1 = require("./controllers/deal-drivers-deal.controller");
const hubspot_service_1 = require("./services/hubspot.service");
const deals_service_1 = require("./services/deals.service");
const deal_meddpicc_service_1 = require("./services/deal-meddpicc.service");
const deal_catalog_service_1 = require("./services/deal-catalog.service");
const deal_drivers_api_repository_1 = require("./repositories/deal-drivers-api.repository");
const deal_drivers_api_service_1 = require("./services/deal-drivers-api.service");
const deal_drivers_analytics_service_1 = require("./services/deal-drivers-analytics.service");
let M04DealIntelligenceModule = class M04DealIntelligenceModule {
    configure(consumer) {
        consumer.apply(session_user_middleware_1.SessionUserMiddleware).forRoutes('*');
    }
};
exports.M04DealIntelligenceModule = M04DealIntelligenceModule;
exports.M04DealIntelligenceModule = M04DealIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            axios_1.HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
            schedule_1.ScheduleModule.forRoot(),
            m04_database_module_1.M04DatabaseModule,
            prisma_module_1.PrismaModule,
        ],
        controllers: [
            deal_board_controller_1.DealBoardController,
            deal_controller_1.DealController,
            deal_summary_controller_1.DealSummaryController,
            deal_summary_controller_1.SummaryManagementController,
            deal_warning_controller_1.DealWarningController,
            deal_warning_controller_1.WarningManagementController,
            sync_controller_1.SyncController,
            auth_controller_1.AuthController,
            deal_playbook_controller_1.DealPlaybookController,
            deal_task_controller_1.DealTaskController,
            deal_comment_controller_1.DealCommentController,
            risk_escalation_controller_1.RiskEscalationController,
            ai_score_controller_1.AIScoreController,
            deal_activity_controller_1.DealActivityController,
            coaching_controller_1.CoachingController,
            export_controller_1.ExportController,
            webhook_controller_1.WebhookController,
            analytics_controller_1.AnalyticsController,
            settings_controller_1.SettingsController,
            m04_test_controller_1.M04TestController,
            deals_controller_1.DealsController,
            deals_controller_1.DealBoardsRepController,
            deals_controller_1.NotificationsApiController,
            deal_drivers_api_controller_1.DealDriversApiController,
            deal_drivers_manager_controller_1.DealDriversManagerController,
            deal_drivers_deal_controller_1.DealDriversDealController,
        ],
        providers: [
            deal_board_service_1.DealBoardService,
            audit_log_service_1.AuditLogService,
            hubspot_client_service_1.HubSpotClientService,
            deal_sync_service_1.DealSyncService,
            ai_client_service_1.AIClientService,
            deal_service_1.DealService,
            deal_summary_service_1.DealSummaryService,
            deal_warning_service_1.DealWarningService,
            auth_service_1.AuthService,
            deal_playbook_service_1.DealPlaybookService,
            deal_task_service_1.DealTaskService,
            deal_comment_service_1.DealCommentService,
            ai_score_service_1.AIScoreService,
            deal_activity_service_1.DealActivityService,
            coaching_service_1.CoachingService,
            export_service_1.ExportService,
            webhook_service_1.WebhookService,
            analytics_service_1.AnalyticsService,
            settings_service_1.SettingsService,
            deal_board_repository_1.DealBoardRepository,
            deal_repository_1.DealRepository,
            hubspot_service_1.HubSpotService,
            deals_service_1.DealsService,
            deal_meddpicc_service_1.DealMeddpiccService,
            deal_catalog_service_1.DealCatalogService,
            deal_drivers_api_repository_1.DealDriversApiRepository,
            deal_drivers_api_service_1.DealDriversApiService,
            deal_drivers_analytics_service_1.DealDriversAnalyticsService,
        ],
        exports: [
            deal_board_service_1.DealBoardService,
            audit_log_service_1.AuditLogService,
            deal_board_repository_1.DealBoardRepository,
            hubspot_client_service_1.HubSpotClientService,
            deal_sync_service_1.DealSyncService,
            ai_client_service_1.AIClientService,
            deal_service_1.DealService,
            deal_summary_service_1.DealSummaryService,
            deal_warning_service_1.DealWarningService,
            deal_repository_1.DealRepository,
            auth_service_1.AuthService,
            hubspot_service_1.HubSpotService,
            deals_service_1.DealsService,
            deal_meddpicc_service_1.DealMeddpiccService,
            deal_drivers_api_service_1.DealDriversApiService,
            deal_drivers_analytics_service_1.DealDriversAnalyticsService,
        ],
    })
], M04DealIntelligenceModule);
//# sourceMappingURL=m04-deal-intelligence.module.js.map