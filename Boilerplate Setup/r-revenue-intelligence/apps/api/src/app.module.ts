import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M01CaptureModule } from './modules/m01-capture/m01-capture.module';
import { M02SalesEngagementModule } from './modules/m02-sales-engagement/m02-sales-engagement.module';
import { M03RevenueGraphModule } from './modules/m03-revenue-graph/m03-revenue-graph.module';
import { M04ConversationIntelligenceModule } from './modules/m04-conversation-intelligence/m04-conversation-intelligence.module';
import { M05SmartTrackingModule } from './modules/m05-smart-tracking/m05-smart-tracking.module';
import { M06InsightGenerationModule } from './modules/m06-insight-generation/m06-insight-generation.module';
import { M07DealAccountModule } from './modules/m07-deal-account/m07-deal-account.module';
import { M08ExecutionModule } from './modules/m08-execution/m08-execution.module';
import { M09ForecastingModule } from './modules/m09-forecasting/m09-forecasting.module';
import { M10CoachingModule } from './modules/m10-coaching/m10-coaching.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    M01CaptureModule,M02SalesEngagementModule,M03RevenueGraphModule,M04ConversationIntelligenceModule,M05SmartTrackingModule,M06InsightGenerationModule,M07DealAccountModule,M08ExecutionModule,M09ForecastingModule,M10CoachingModule
  ],
})
export class AppModule {}
