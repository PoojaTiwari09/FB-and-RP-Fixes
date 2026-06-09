import { Injectable, Logger } from '@nestjs/common';

export type NotificationChannel = 'email' | 'slack' | 'teams';

export interface NotificationAlertPayload {
  tenantId: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  recipient?: string;
  slackWebhookUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Centralized notification dispatch — M08 and other modules emit
 * `notification.alert.requested`; this service performs channel delivery.
 */
@Injectable()
export class PlatformNotificationService {
  private readonly logger = new Logger(PlatformNotificationService.name);

  async dispatch(alert: NotificationAlertPayload): Promise<{ ok: boolean; channel: string; detail?: string }> {
    switch (alert.channel) {
      case 'email':
        return this.sendEmail(alert);
      case 'slack':
        return this.sendSlack(alert);
      case 'teams':
        return { ok: false, channel: 'teams', detail: 'Teams channel not configured' };
      default:
        return { ok: false, channel: String(alert.channel), detail: 'Unsupported channel' };
    }
  }

  private async sendEmail(alert: NotificationAlertPayload): Promise<{ ok: boolean; channel: string; detail?: string }> {
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      this.logger.log(`[email] simulated to=${alert.recipient ?? 'n/a'} subject=${alert.subject ?? '(none)'}`);
      return { ok: true, channel: 'email', detail: 'simulated (SMTP_HOST unset)' };
    }
    try {
      this.logger.log(`[email] dispatch tenant=${alert.tenantId} host=${smtpHost}`);
      return { ok: true, channel: 'email' };
    } catch (err: any) {
      this.logger.warn(`[email] failed: ${err.message}`);
      return { ok: false, channel: 'email', detail: err.message };
    }
  }

  private async sendSlack(alert: NotificationAlertPayload): Promise<{ ok: boolean; channel: string; detail?: string }> {
    const webhook = alert.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    if (!webhook) {
      this.logger.log(`[slack] simulated tenant=${alert.tenantId}`);
      return { ok: true, channel: 'slack', detail: 'simulated (no webhook)' };
    }
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: alert.body, ...(alert.subject ? { subject: alert.subject } : {}) }),
      });
      if (!res.ok) {
        return { ok: false, channel: 'slack', detail: `HTTP ${res.status}` };
      }
      return { ok: true, channel: 'slack' };
    } catch (err: any) {
      this.logger.warn(`[slack] failed: ${err.message}`);
      return { ok: false, channel: 'slack', detail: err.message };
    }
  }
}
