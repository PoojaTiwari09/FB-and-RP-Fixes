import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M07DealAccountController } from './controllers/m07.controller';
import { M07DealAccountService } from './services/m07.service';
import { M07DealAccountWorker } from './workers/m07.worker';
import { M07DealAccountRepository } from './repositories/m07.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm07-queue' }),
  ],
  controllers: [M07DealAccountController],
  providers: [M07DealAccountService, M07DealAccountWorker, M07DealAccountRepository],
  exports: [M07DealAccountService],
})
export class M07DealAccountModule {}
