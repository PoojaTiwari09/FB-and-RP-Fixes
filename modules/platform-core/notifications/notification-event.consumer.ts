import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NotificationAlertPayload,
  PlatformNotificationService,
} from './platform-notification.service';

@Injectable()
export class NotificationEventConsumer {
  private readonly logger = new Logger(NotificationEventConsumer.name);

  constructor(private readonly notifications: PlatformNotificationService) {}

  @OnEvent('notification.alert.requested')
  async handleNotificationRequested(envelope: NotificationAlertPayload & Record<string, unknown>) {
    const { tenantId, channel, body } = envelope;
    if (!tenantId || !channel || !body) {
      this.logger.warn('notification.alert.requested missing tenantId, channel, or body');
      return { ok: false, reason: 'invalid_payload' };
    }
    return this.notifications.dispatch(envelope as NotificationAlertPayload);
  }
}
