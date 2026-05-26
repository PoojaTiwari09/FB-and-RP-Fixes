import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M03AiSummariesGenaiModule } from '../../../modules/m03-ai-summaries-genai/m03-ai-summaries-genai.module';
// import { M04DealIntelligenceModule } from '../../../modules/m04-deal-intelligence/m04-deal-intelligence.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';

const redisEnabled = process.env.DISABLE_REDIS !== 'true';

@Module({
  imports: [
    ...(redisEnabled
      ? [
          BullModule.forRoot({
            connection: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
              retryStrategy() {
                return 3600000;
              },
            },
          }),
          M01CaptureTranscriptionModule,
          M02ConversationIntelligenceModule,
          M03AiSummariesGenaiModule,
          M05AccountIntelligenceModule,
          M06ForecastingPredictionModule,
          M07RevenueDashboardsModule,
          M08SalesEngagementModule,
          M09CoachingTrainingModule,
          M10DataComplianceModule,
        ]
      : []),
    // M04DealIntelligenceModule,
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
export class AppModule {
  constructor() {
    if (!redisEnabled) {
      console.log(
        'Redis disabled via DISABLE_REDIS=true; loading M04DealIntelligenceModule only.',
      );
    }
  }
}
