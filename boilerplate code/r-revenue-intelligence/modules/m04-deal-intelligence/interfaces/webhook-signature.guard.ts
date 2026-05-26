// src/modules/deal-drivers/webhook-signature.guard.ts
// US-31: HMAC-SHA256 webhook signature guard.
//
// SETUP REQUIRED in main.ts:
//   app.use('/deal-drivers/events', bodyParser.json({
//     verify: (req: any, _res, buf) => { req.rawBody = buf; }
//   }));
//
// This populates req.rawBody (Buffer) which this guard reads for signature verification.
// The env variable DEAL_DRIVERS_WEBHOOK_SECRET must be set.

import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();

    const header = req.headers['x-webhook-signature'] as string | undefined;
    if (!header) {
      throw new UnauthorizedException('Missing X-Webhook-Signature header.');
    }

    // Expected format: "sha256=<hex>"
    if (!header.startsWith('sha256=')) {
      throw new UnauthorizedException('X-Webhook-Signature must be in format sha256=<hex>.');
    }

    const secret = this.config.get<string>('DEAL_DRIVERS_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured on server.');
    }

    const rawBody: Buffer | undefined = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException(
        'Raw request body unavailable. ' +
        'Ensure bodyParser is configured with verify callback in main.ts.',
      );
    }

    const providedHex = header.slice('sha256='.length);
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest();

    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(providedHex, 'hex');
    } catch {
      throw new UnauthorizedException('Invalid signature hex encoding.');
    }

    // Timing-safe comparison to prevent timing attacks
    if (
      expectedHmac.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedHmac, providedBuf)
    ) {
      throw new UnauthorizedException('Webhook signature mismatch.');
    }

    return true;
  }
}
