import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { EventPublisherModule } from '../../../modules/platform-core/events/event-publisher.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5179,http://localhost:3005')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
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
    M05AccountIntelligenceModule,
  ],
})
export class M05AppModule {
  static corsOrigins = corsOrigins;
}
