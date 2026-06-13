import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenantThrottlerGuard } from './tenant-throttler.guard';
import { EventPublisherModule } from '../../../modules/platform-core/events/event-publisher.module';
import { M01CaptureTranscriptionModule } from '../../../modules/m01-capture-transcription/m01-capture-transcription.module';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M09CoachingTrainingModule } from '../../../modules/m09-coaching-training/m09-coaching-training.module';
import { M08SalesEngagementModule } from '../../../modules/m08-sales-engagement/m08-sales-engagement.module';
import { M06ForecastingPredictionModule } from '../../../modules/m06-forecasting-prediction/m06-forecasting-prediction.module';
import { M04DealIntelligenceModule } from '../../../modules/m04-deal-intelligence/m04-deal-intelligence.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';
import { M11AiDeepResearcherModule } from '../../../modules/m11-ai-deep-researcher/m11-ai-deep-researcher.module';
import { M07RevenueDashboardsModule } from '../../../modules/m07-revenue-dashboards/m07-revenue-dashboards.module';
import { M10DataComplianceModule } from '../../../modules/m10-data-compliance/m10-data-compliance.module';
import { PlatformAuthModule } from '../../../modules/platform-core/auth/auth.module';

import { ThrottlerModule } from '@nestjs/throttler';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 50,
    }),
    EventPublisherModule,
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
    M01CaptureTranscriptionModule,
    M02ConversationIntelligenceModule,
    M09CoachingTrainingModule,
    M08SalesEngagementModule,
    M06ForecastingPredictionModule,
    M04DealIntelligenceModule,
    M05AccountIntelligenceModule,
    M11AiDeepResearcherModule,
    M07RevenueDashboardsModule,
    M10DataComplianceModule,
    PlatformAuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
  ],
})
export class UnifiedAppModule {
  static corsOrigins = corsOrigins;
}
