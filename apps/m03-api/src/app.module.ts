import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EventPublisherModule } from '../../../modules/platform-core/events/event-publisher.module';
import { M03AiSummariesGenaiModule } from '../../../modules/m03-ai-summaries-genai/m03-ai-summaries-genai.module';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5177,http://localhost:3005')
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
    M03AiSummariesGenaiModule,
  ],
})
export class M03AppModule {
  static corsOrigins = corsOrigins;
}
