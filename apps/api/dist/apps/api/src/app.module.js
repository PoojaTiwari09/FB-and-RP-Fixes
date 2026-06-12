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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const serve_static_1 = require("@nestjs/serve-static");
const throttler_1 = require("@nestjs/throttler");
const path_1 = require("path");
const event_publisher_module_1 = require("../../../modules/platform-core/events/event-publisher.module");
const platform_notification_module_1 = require("../../../modules/platform-core/notifications/platform-notification.module");
const auth_module_1 = require("../../../modules/platform-core/auth/auth.module");
const tenant_throttler_guard_1 = require("./tenant-throttler.guard");
const m01_capture_transcription_module_1 = require("../../../modules/m01-capture-transcription/m01-capture-transcription.module");
const m02_conversation_intelligence_module_1 = require("../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module");
const m03_ai_summaries_genai_module_1 = require("../../../modules/m03-ai-summaries-genai/m03-ai-summaries-genai.module");
const m04_deal_intelligence_module_1 = require("../../../modules/m04-deal-intelligence/m04-deal-intelligence.module");
const m05_account_intelligence_module_1 = require("../../../modules/m05-account-intelligence/m05-account-intelligence.module");
const m06_forecasting_prediction_module_1 = require("../../../modules/m06-forecasting-prediction/m06-forecasting-prediction.module");
const m07_revenue_dashboards_module_1 = require("../../../modules/m07-revenue-dashboards/m07-revenue-dashboards.module");
const m08_sales_engagement_module_1 = require("../../../modules/m08-sales-engagement/m08-sales-engagement.module");
const m09_coaching_training_module_1 = require("../../../modules/m09-coaching-training/m09-coaching-training.module");
const m10_data_compliance_module_1 = require("../../../modules/m10-data-compliance/m10-data-compliance.module");
const redisEnabled = process.env.DISABLE_REDIS !== 'true';
const sharedBackendModules = [
    m01_capture_transcription_module_1.M01CaptureTranscriptionModule,
    m02_conversation_intelligence_module_1.M02ConversationIntelligenceModule,
    m03_ai_summaries_genai_module_1.M03AiSummariesGenaiModule,
    m04_deal_intelligence_module_1.M04DealIntelligenceModule,
    m05_account_intelligence_module_1.M05AccountIntelligenceModule,
    m06_forecasting_prediction_module_1.M06ForecastingPredictionModule,
    m07_revenue_dashboards_module_1.M07RevenueDashboardsModule,
    m08_sales_engagement_module_1.M08SalesEngagementModule,
    m09_coaching_training_module_1.M09CoachingTrainingModule,
    m10_data_compliance_module_1.M10DataComplianceModule,
];
let AppModule = class AppModule {
    constructor() {
        if (!redisEnabled) {
            console.warn('[AppModule] Redis disabled via DISABLE_REDIS=true. BullMQ queues and workers are inert.');
        }
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    (0, path_1.join)(__dirname, '../../../.env'),
                    (0, path_1.join)(__dirname, '../../../../.env'),
                    '.env',
                ],
            }),
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: true,
                delimiter: '.',
                newListener: false,
                removeListener: false,
                maxListeners: 50,
                verboseMemoryLeak: false,
            }),
            event_publisher_module_1.EventPublisherModule,
            platform_notification_module_1.PlatformNotificationModule,
            auth_module_1.PlatformAuthModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: { fallthrough: true },
            }),
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    lazyConnect: true,
                    enableOfflineQueue: false,
                    maxRetriesPerRequest: null,
                    retryStrategy: (times) => Math.min(times * 200, 5000),
                },
            }),
            ...sharedBackendModules,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: tenant_throttler_guard_1.TenantThrottlerGuard,
            },
        ],
    }),
    __metadata("design:paramtypes", [])
], AppModule);
//# sourceMappingURL=app.module.js.map