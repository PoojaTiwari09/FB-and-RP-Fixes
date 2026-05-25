import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M01CaptureTranscriptionModule } from '../../../modules/m01-capture-transcription/m01-capture-transcription.module';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M03AiSummariesGenaiModule } from '../../../modules/m03-ai-summaries-genai/m03-ai-summaries-genai.module';
import { M04DealIntelligenceModule } from '../../../modules/m04-deal-intelligence/m04-deal-intelligence.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';
import { M06ForecastingPredictionModule } from '../../../modules/m06-forecasting-prediction/m06-forecasting-prediction.module';
import { M07RevenueDashboardsModule } from '../../../modules/m07-revenue-dashboards/m07-revenue-dashboards.module';
import { M08SalesEngagementModule } from '../../../modules/m08-sales-engagement/m08-sales-engagement.module';
import { M09CoachingTrainingModule } from '../../../modules/m09-coaching-training/m09-coaching-training.module';
import { M10DataComplianceModule } from '../../../modules/m10-data-compliance/m10-data-compliance.module';

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
    M04DealIntelligenceModule,
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
