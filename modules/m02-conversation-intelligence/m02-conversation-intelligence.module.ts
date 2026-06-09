import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M02ConversationIntelligenceController } from './controllers/m02.controller';
import { M02ConversationIntelligenceService } from './services/m02.service';
import { M02ConversationIntelligenceWorker } from './workers/m02.worker';
import { M02ConversationIntelligenceRepository } from './repositories/m02.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm02-queue' }),
  ],
  controllers: [M02ConversationIntelligenceController],
  providers: [M02ConversationIntelligenceService, M02ConversationIntelligenceWorker, M02ConversationIntelligenceRepository],
  exports: [M02ConversationIntelligenceService],
})
export class M02ConversationIntelligenceModule {}
