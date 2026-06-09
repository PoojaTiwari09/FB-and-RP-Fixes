import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventPublisherModule } from '../../../modules/platform-core/events/event-publisher.module';
import { M01CaptureTranscriptionModule } from '../../../modules/m01-capture-transcription/m01-capture-transcription.module';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M09CoachingTrainingModule } from '../../../modules/m09-coaching-training/m09-coaching-training.module';
import { EngageBridgeModule } from '../../../modules/m08-sales-engagement/frontend-api/engage-bridge.module';
import { M06ForecastingPredictionModule } from '../../../modules/m06-forecasting-prediction/m06-forecasting-prediction.module';
import { M04DealIntelligenceModule } from '../../../modules/m04-deal-intelligence/m04-deal-intelligence.module';
import { M11AiDeepResearcherModule } from '../../../modules/m11-ai-deep-researcher/m11-ai-deep-researcher.module';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
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
    EngageBridgeModule,
    M06ForecastingPredictionModule,
    M04DealIntelligenceModule,
    M11AiDeepResearcherModule,
  ],
})
export class UnifiedAppModule {
  static corsOrigins = corsOrigins;
}
