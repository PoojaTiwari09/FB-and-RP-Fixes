import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EventPublisherModule } from '../../../modules/platform-core/events/event-publisher.module';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5175,http://localhost:3005')
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
    M02ConversationIntelligenceModule,
  ],
})
export class M02AppModule {
  static corsOrigins = corsOrigins;
}
