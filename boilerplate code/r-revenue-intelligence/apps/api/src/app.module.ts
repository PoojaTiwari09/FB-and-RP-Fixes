import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

// ── Backend modules ──────────────────────────────────────────────────────────
import { M01CaptureTranscriptionModule } from '../../../modules/m01-capture-transcription/m01-capture-transcription.module';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M03AiSummariesGenaiModule } from '../../../modules/m03-ai-summaries-genai/m03-ai-summaries-genai.module';
// import { M04DealIntelligenceModule } from '../../../modules/m04-deal-intelligence/m04-deal-intelligence.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';
import { M06ForecastingPredictionModule } from '../../../modules/m06-forecasting-prediction/m06-forecasting-prediction.module';
import { M07RevenueDashboardsModule } from '../../../modules/m07-revenue-dashboards/m07-revenue-dashboards.module';
import { M08SalesEngagementModule } from '../../../modules/m08-sales-engagement/m08-sales-engagement.module';
import { M09CoachingTrainingModule } from '../../../modules/m09-coaching-training/m09-coaching-training.module';
import { M10DataComplianceModule } from '../../../modules/m10-data-compliance/m10-data-compliance.module';

// Modules are imported in dependency order to mirror the lifecycle stages
// described in the System Architecture Document (Capture → Model → Understand
// → Analyze → Execute → Predict → Optimize). M04 currently sits behind a
// feature flag because it ships its own DB layer + ~177 TS files and needs
// the unified Prisma schema before it can be re-enabled.
//
// Set DISABLE_REDIS=true to boot without BullMQ (useful for `prisma db push`
// smoke runs that don't need workers). When Redis is disabled we skip the
// per-module queue registrations so Nest does not try to open a TCP socket.
const redisEnabled = process.env.DISABLE_REDIS !== 'true';

const sharedBackendModules = [
  M01CaptureTranscriptionModule,
  M02ConversationIntelligenceModule,
  M03AiSummariesGenaiModule,
  M05AccountIntelligenceModule,
  M06ForecastingPredictionModule,
  M07RevenueDashboardsModule,
  M08SalesEngagementModule,
  M09CoachingTrainingModule,
  M10DataComplianceModule,
];

@Module({
  imports: [
    // Make ConfigService available everywhere — many services (M05/AiService,
    // M09/LlmService, M10) inject it. Without a global ConfigModule, Nest
    // injects `undefined` and constructors crash with "Cannot read get of undefined".
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    // We register BullMQ unconditionally with lazyConnect so per-module
    // `BullModule.registerQueue(...)` calls (M01, M03, …) don't blow up at
    // construction time when Redis is offline. With DISABLE_REDIS=true the
    // queues are inert because we also do not start workers.
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => Math.min(times * 200, 5000),
      },
    }),
    ...sharedBackendModules,
    // M04 remains commented until its Prisma schema is reconciled against
    // final_product/schema.prisma. See _audit/analysis_m04-deal-intelligence.md.
  ],
})
export class AppModule {
  constructor() {
    if (!redisEnabled) {
      // eslint-disable-next-line no-console
      console.warn(
        '[AppModule] Redis disabled via DISABLE_REDIS=true. BullMQ queues and workers are inert.',
      );
    }
  }
}
