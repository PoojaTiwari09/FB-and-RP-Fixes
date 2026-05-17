import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M01CaptureController } from './controllers/m01.controller';
import { M01CaptureService } from './services/m01.service';
import { M01CaptureWorker } from './workers/m01.worker';
import { M01CaptureRepository } from './repositories/m01.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm01-queue' }),
  ],
  controllers: [M01CaptureController],
  providers: [M01CaptureService, M01CaptureWorker, M01CaptureRepository],
  exports: [M01CaptureService],
})
export class M01CaptureModule {}
