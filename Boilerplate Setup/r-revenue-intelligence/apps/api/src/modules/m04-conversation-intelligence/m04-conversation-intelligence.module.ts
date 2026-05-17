import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M04ConversationIntelligenceController } from './controllers/m04.controller';
import { M04ConversationIntelligenceService } from './services/m04.service';
import { M04ConversationIntelligenceWorker } from './workers/m04.worker';
import { M04ConversationIntelligenceRepository } from './repositories/m04.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm04-queue' }),
  ],
  controllers: [M04ConversationIntelligenceController],
  providers: [M04ConversationIntelligenceService, M04ConversationIntelligenceWorker, M04ConversationIntelligenceRepository],
  exports: [M04ConversationIntelligenceService],
})
export class M04ConversationIntelligenceModule {}
