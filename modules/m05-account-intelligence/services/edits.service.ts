import { Injectable, BadRequestException } from '@nestjs/common';
import { getSupabase } from '../config/supabase';
import { getHubspot } from '../config/hubspot';

const VALID_DEAL_STAGES = [
  'Prospecting', 'Qualification', 'Solution Presentation',
  'Proposal Sent', 'Contract Negotiation', 'Closed Won', 'Closed Lost',
];

const DEAL_STAGE_MAP: Record<string, string> = {
  'Prospecting': 'appointmentscheduled',
  'Qualification': 'qualifiedtobuy',
  'Solution Presentation': 'presentationscheduled',
  'Proposal Sent': 'decisionmakerboughtin',
  'Contract Negotiation': 'contractsent',
  'Closed Won': 'closedwon',
  'Closed Lost': 'closedlost',
};

@Injectable()
export class EditsService {
  private supabase = getSupabase();

  async editCompany(hubspotId: string, field: string, value: string, role: string) {
    // Validate
    if (field === 'type' && !['Customer', 'New Business'].includes(value)) {
      throw new BadRequestException({
        field: 'type',
        message: "type must be 'Customer' or 'New Business'",
        allowed_values: ['Customer', 'New Business'],
      });
    }

    // Get current value for audit
    const { data: current } = await this.supabase
      .from('crm_companies')
      .select(field)
      .eq('hubspot_id', hubspotId)
      .single();

    const oldValue = (current as any)?.[field] || null;

    // Write to HubSpot
    let hubspotUpdated = false;
    try {
      const hsClient = getHubspot();
      const hsField = field === 'type' ? 'type' : field;
      await hsClient.crm.companies.basicApi.update(hubspotId, {
        properties: { [hsField]: value },
      });
      hubspotUpdated = true;
    } catch (err: any) {
      console.error(`HubSpot write-back failed for company ${hubspotId}:`, err.message);
    }

    // Write to Supabase
    const { error } = await this.supabase
      .from('crm_companies')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('hubspot_id', hubspotId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Audit log
    console.log(`[AUDIT] Company ${hubspotId}: ${field} "${oldValue}" → "${value}" by ${role} at ${new Date().toISOString()}`);

    return { success: true, hubspot_updated: hubspotUpdated, postgres_updated: true };
  }

  async editDeal(dealHubspotId: string, field: string, value: string, role: string) {
    // Validate
    if (field === 'stage' && !VALID_DEAL_STAGES.includes(value)) {
      throw new BadRequestException({
        field: 'stage',
        message: 'Invalid stage',
        allowed_values: VALID_DEAL_STAGES,
      });
    }

    if (field === 'close_date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new BadRequestException({
          field: 'close_date',
          message: 'close_date must be a valid ISO date string (e.g. 2025-12-31)',
        });
      }
    }

    // Get current value
    const { data: current } = await this.supabase
      .from('crm_deals')
      .select(field)
      .eq('hubspot_id', dealHubspotId)
      .single();

    const oldValue = (current as any)?.[field] || null;

    // Write to HubSpot
    let hubspotUpdated = false;
    try {
      const hsClient = getHubspot();
      let hsField = field;
      let hsValue = value;

      if (field === 'stage') {
        hsField = 'dealstage';
        hsValue = DEAL_STAGE_MAP[value] || value;
      } else if (field === 'close_date') {
        hsField = 'closedate';
        hsValue = new Date(value).toISOString();
      }

      await hsClient.crm.deals.basicApi.update(dealHubspotId, {
        properties: { [hsField]: hsValue },
      });
      hubspotUpdated = true;
    } catch (err: any) {
      console.error(`HubSpot write-back failed for deal ${dealHubspotId}:`, err.message);
    }

    // Write to Supabase
    const { error } = await this.supabase
      .from('crm_deals')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('hubspot_id', dealHubspotId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    console.log(`[AUDIT] Deal ${dealHubspotId}: ${field} "${oldValue}" → "${value}" by ${role} at ${new Date().toISOString()}`);

    return { success: true, hubspot_updated: hubspotUpdated, postgres_updated: true };
  }

  async editSupplementary(companyHubspotId: string, field: string, value: string, role: string) {
    // Validate
    if (field === 'manager_note' && value && value.length > 500) {
      throw new BadRequestException({
        field: 'manager_note',
        message: 'manager_note must be 500 characters or fewer',
        max_length: 500,
      });
    }

    if (field === 'next_qbr_date' && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new BadRequestException({
          field: 'next_qbr_date',
          message: 'next_qbr_date must be a valid date',
        });
      }
    }

    // Get current value
    const { data: current } = await this.supabase
      .from('supplementary_accounts')
      .select(field)
      .eq('company_hubspot_id', companyHubspotId)
      .single();

    const oldValue = (current as any)?.[field] || null;

    // Supabase only — no HubSpot write-back for supplementary fields
    const { error } = await this.supabase
      .from('supplementary_accounts')
      .update({ [field]: value || null, updated_at: new Date().toISOString() })
      .eq('company_hubspot_id', companyHubspotId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    console.log(`[AUDIT] Supplementary ${companyHubspotId}: ${field} "${oldValue}" → "${value}" by ${role} at ${new Date().toISOString()}`);

    return { success: true, hubspot_updated: false, postgres_updated: true };
  }
}
