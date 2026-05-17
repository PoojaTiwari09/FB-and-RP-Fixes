import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M03RevenueGraphController } from './controllers/m03.controller';
import { M03RevenueGraphService } from './services/m03.service';
import { M03RevenueGraphWorker } from './workers/m03.worker';
import { M03RevenueGraphRepository } from './repositories/m03.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm03-queue' }),
  ],
  controllers: [M03RevenueGraphController],
  providers: [M03RevenueGraphService, M03RevenueGraphWorker, M03RevenueGraphRepository],
  exports: [M03RevenueGraphService],
})
export class M03RevenueGraphModule {}
