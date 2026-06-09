/**
 * HubSpot CRM webhooks — POST /api/v1/account-intelligence/webhooks/hubspot
 *
 * HMAC secret: M05_HUBSPOT_WEBHOOK_SECRET (see Environment Variables Registry-M5).
 * Legacy alias HUBSPOT_WEBHOOK_SECRET is supported for local migration only.
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSupabase } from '../config/supabase';
import { getM05HubspotWebhookSecret, isProductionLike } from '../config/m05-env';

interface HubSpotWebhookEvent {
  appId: number;
  eventId: number;
  subscriptionId: number;
  portalId: number;
  occurredAt: number;
  subscriptionType: string;
  objectId: number;
  propertyName: string;
  propertyValue: string;
  changeSource: string;
}

@Controller('api/v1/account-intelligence/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private supabase = getSupabase();

  @Post('hubspot')
  @HttpCode(200)
  async receiveWebhook(
    @Body() events: HubSpotWebhookEvent[],
    @Headers('x-hubspot-signature-v3') signatureV3: string,
  ) {
    const secret = getM05HubspotWebhookSecret();

    if (isProductionLike() && !secret) {
      throw new BadRequestException(
        'M05_HUBSPOT_WEBHOOK_SECRET must be configured in production/staging',
      );
    }

    if (secret) {
      if (!signatureV3) {
        throw new UnauthorizedException('Missing x-hubspot-signature-v3 header');
      }
      const expected = createHmac('sha256', secret)
        .update(JSON.stringify(events))
        .digest('base64');
      const expectedBuf = Buffer.from(expected);
      const receivedBuf = Buffer.from(signatureV3);
      if (
        expectedBuf.length !== receivedBuf.length ||
        !timingSafeEqual(expectedBuf, receivedBuf)
      ) {
        this.logger.warn('[WEBHOOK] Invalid HMAC signature — rejecting');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('[WEBHOOK] M05_HUBSPOT_WEBHOOK_SECRET unset — skipping HMAC (dev only)');
    }

    if (!Array.isArray(events) || events.length === 0) {
      return { processed: 0 };
    }

    this.logger.log(`[WEBHOOK] Received ${events.length} event(s)`);
    let processed = 0;

    for (const event of events) {
      try {
        await this.handleEvent(event);
        processed++;
      } catch (err: any) {
        this.logger.error(`[WEBHOOK] Error handling event ${event.eventId}: ${err?.message}`);
      }
    }

    return { processed };
  }

  private async handleEvent(event: HubSpotWebhookEvent): Promise<void> {
    const objectId = String(event.objectId);
    const prop = event.propertyName;
    const val = event.propertyValue;

    if (event.subscriptionType.startsWith('company.')) {
      await this.upsertCompanyProperty(objectId, prop, val);
    } else if (event.subscriptionType.startsWith('contact.')) {
      await this.upsertContactProperty(objectId, prop, val);
    } else if (event.subscriptionType.startsWith('deal.')) {
      await this.upsertDealProperty(objectId, prop, val);
    }
  }

  private readonly COMPANY_PROP_MAP: Record<string, string> = {
    name: 'name',
    domain: 'domain',
    industry: 'industry',
    city: 'city',
    country: 'country',
    numberofemployees: 'employee_count',
    exit_arr: 'exit_arr',
    segment: 'segment',
    board_assignment: 'board',
    hubspot_owner_id: 'hubspot_owner_id',
  };

  private readonly CONTACT_PROP_MAP: Record<string, string> = {
    firstname: 'first_name',
    lastname: 'last_name',
    email: 'email',
    phone: 'phone',
    jobtitle: 'job_title',
  };

  private readonly DEAL_PROP_MAP: Record<string, string> = {
    dealname: 'name',
    amount: 'amount',
    adjusted_amount: 'adjusted_amount',
    closedate: 'close_date',
  };

  private async upsertCompanyProperty(
    hubspotId: string,
    prop: string,
    val: string,
  ): Promise<void> {
    const col = this.COMPANY_PROP_MAP[prop];
    if (!col) return;

    let coercedVal: any = val;
    if (col === 'employee_count') coercedVal = val ? parseInt(val, 10) : null;
    if (col === 'exit_arr') coercedVal = val ? parseFloat(val) : null;

    const patch: Record<string, unknown> = { [col]: coercedVal };

    if (col === 'hubspot_owner_id' && val) {
      const { data: existing } = await this.supabase
        .from('crm_companies')
        .select('assigned_rep_id')
        .eq('hubspot_id', hubspotId)
        .maybeSingle();
      if (!existing?.assigned_rep_id) {
        patch.assigned_rep_id = val;
      }
    }

    const { error } = await this.supabase
      .from('crm_companies')
      .update(patch)
      .eq('hubspot_id', hubspotId);

    if (error) {
      this.logger.error(`[WEBHOOK] company update error: ${error.message}`);
    }
  }

  private async upsertContactProperty(
    hubspotId: string,
    prop: string,
    val: string,
  ): Promise<void> {
    const col = this.CONTACT_PROP_MAP[prop];
    if (!col) return;

    const { error } = await this.supabase
      .from('crm_contacts')
      .update({ [col]: val })
      .eq('hubspot_id', hubspotId);

    if (error) {
      this.logger.error(`[WEBHOOK] contact update error: ${error.message}`);
    }
  }

  private async upsertDealProperty(
    hubspotId: string,
    prop: string,
    val: string,
  ): Promise<void> {
    const col = this.DEAL_PROP_MAP[prop];
    if (!col) return;

    let coercedVal: any = val;
    if (col === 'amount' || col === 'adjusted_amount') coercedVal = val ? parseFloat(val) : null;
    if (col === 'close_date') coercedVal = val ? val.split('T')[0] : null;

    const { error } = await this.supabase
      .from('crm_deals')
      .update({ [col]: coercedVal })
      .eq('hubspot_id', hubspotId);

    if (error) {
      this.logger.error(`[WEBHOOK] deal update error: ${error.message}`);
    }
  }
}
