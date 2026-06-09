import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * HmacWebhookGuard
 *
 * Validates X-Webhook-Signature against the configured WEBHOOK_SECRET.
 * When WEBHOOK_SECRET is unset (local dev / smoke testing) the guard
 * still requires the bypass header `x-webhook-test=1` so production
 * traffic can never silently skip validation, but devs can exercise
 * the webhook path without needing to sign payloads.
 */
@Injectable()
export class HmacWebhookGuard implements CanActivate {
  private readonly logger = new Logger(HmacWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request   = context.switchToHttp().getRequest();
    const secret    = process.env.WEBHOOK_SECRET;
    const signature = request.headers['x-webhook-signature'];

    // Dev / smoke mode — explicit opt-in only.
    if (!secret) {
      if (request.headers['x-webhook-test'] === '1') {
        this.logger.warn(
          '[HmacWebhookGuard] WEBHOOK_SECRET unset — allowing because x-webhook-test=1',
        );
        return true;
      }
      throw new UnauthorizedException(
        'WEBHOOK_SECRET not configured on the server',
      );
    }

    if (!signature || typeof signature !== 'string') {
      throw new UnauthorizedException('Missing x-webhook-signature header');
    }

    const body     = JSON.stringify(request.body ?? {});
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const provided = signature.replace(/^sha256=/, '');

    // Constant-time compare to avoid timing attacks (CT-23 security).
    const ok =
      provided.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

    if (!ok) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }
}
