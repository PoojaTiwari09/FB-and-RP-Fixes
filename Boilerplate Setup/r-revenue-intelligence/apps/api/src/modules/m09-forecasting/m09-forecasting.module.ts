import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M09ForecastingController } from './controllers/m09.controller';
import { M09ForecastingService } from './services/m09.service';
import { M09ForecastingWorker } from './workers/m09.worker';
import { M09ForecastingRepository } from './repositories/m09.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm09-queue' }),
  ],
  controllers: [M09ForecastingController],
  providers: [M09ForecastingService, M09ForecastingWorker, M09ForecastingRepository],
  exports: [M09ForecastingService],
})
export class M09ForecastingModule {}
