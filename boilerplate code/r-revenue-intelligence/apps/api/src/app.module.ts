import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => {
          // Reconnect after min(times * 200ms, 5s) — won't crash the app
          return Math.min(times * 200, 5000);
        },
      },
    }),
    M01CaptureTranscriptionModule,M02ConversationIntelligenceModule,M03AiSummariesGenaiModule,M04DealIntelligenceModule,M05AccountIntelligenceModule,M06ForecastingPredictionModule,M07RevenueDashboardsModule,M08SalesEngagementModule,M09CoachingTrainingModule,M10DataComplianceModule
  ],
})
export class AppModule {}
