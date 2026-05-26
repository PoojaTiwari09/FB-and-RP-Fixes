/**
 * webhook.controller.ts
 * =====================
 * POST /sync/hubspot-webhook
 *
 * Receives HubSpot CRM webhooks and upserts only the changed record.
 *
 * SETUP STEPS (ngrok, local dev):
 * 1. Run: ngrok http 3001
 * 2. Copy the https URL (e.g. https://abc123.ngrok.io)
 * 3. HubSpot → Private App → Webhooks → Add endpoint:
 *    URL: https://abc123.ngrok.io/sync/hubspot-webhook
 *    Events: company.propertyChange, contact.propertyChange, deal.propertyChange
 *
 * Signature validation is optional in local dev (HUBSPOT_WEBHOOK_SECRET env var).
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { getSupabase } from '../config/supabase';

interface HubSpotWebhookEvent {
  appId: number;
  eventId: number;
  subscriptionId: number;
  portalId: number;
  occurredAt: number;
  subscriptionType: string;  // e.g. "company.propertyChange"
  objectId: number;           // HubSpot object ID
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
    @Headers('x-hubspot-signature') signature: string,
    @Headers('x-hubspot-signature-v3') signatureV3: string,
  ) {
    // ── Signature validation (optional, skip if secret not configured) ──
    const secret = process.env.HUBSPOT_WEBHOOK_SECRET;
    if (secret && signatureV3) {
      const expected = createHmac('sha256', secret)
        .update(JSON.stringify(events))
        .digest('base64');
      if (expected !== signatureV3) {
        this.logger.warn('[WEBHOOK] Invalid signature — rejecting');
        return { rejected: true };
      }
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

    this.logger.debug(
      `[WEBHOOK] ${event.subscriptionType} id=${objectId} ${prop}=${val}`,
    );

    if (event.subscriptionType.startsWith('company.')) {
      await this.upsertCompanyProperty(objectId, prop, val);
    } else if (event.subscriptionType.startsWith('contact.')) {
      await this.upsertContactProperty(objectId, prop, val);
    } else if (event.subscriptionType.startsWith('deal.')) {
      await this.upsertDealProperty(objectId, prop, val);
    }
  }

  // ── Property maps ────────────────────────────────────────────────────
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
    if (!col) return; // unknown property — skip

    let coercedVal: any = val;
    if (col === 'employee_count') coercedVal = val ? parseInt(val, 10) : null;
    if (col === 'exit_arr') coercedVal = val ? parseFloat(val) : null;

    const { error } = await this.supabase
      .from('crm_companies')
      .update({ [col]: coercedVal })
      .eq('hubspot_id', hubspotId);

    if (error) {
      this.logger.error(`[WEBHOOK] company update error: ${error.message}`);
    } else {
      this.logger.log(`[WEBHOOK] Updated crm_companies[${hubspotId}].${col} = ${val}`);
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
