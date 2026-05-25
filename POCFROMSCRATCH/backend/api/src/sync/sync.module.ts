import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SyncController, WebhookController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}

