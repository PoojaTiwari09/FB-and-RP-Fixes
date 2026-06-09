import { Global, Module } from '@nestjs/common';
import { PlatformNotificationService } from './platform-notification.service';
import { NotificationEventConsumer } from './notification-event.consumer';

@Global()
@Module({
  providers: [PlatformNotificationService, NotificationEventConsumer],
  exports: [PlatformNotificationService],
})
export class PlatformNotificationModule {}
