/**
 * sync.service.ts
 * ================
 * Real-time CRM sync (BF-08).
 * • Scheduled: every 5 minutes via @Interval(300_000)
 * • Manual: called by SyncController POST /sync/trigger
 * • Status: GET /sync/status returns last sync metadata
 *
 * Syncs: companies, contacts, deals  (NOT crm_activities — seeded manually)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import * as hubspot from '@hubspot/api-client';
import { assignedRepIdForHubSpotUpsert } from '../domain/account-ownership';
import { getSupabase } from '../config/supabase';

// HubSpot pipeline stage → human-readable label
const STAGE_MAP: Record<string, string> = {
  appointmentscheduled: 'Prospecting',
  qualifiedtobuy: 'Qualification',
  presentationscheduled: 'Solution Presentation',
  decisionmakerboughtin: 'Proposal Sent',
  contractsent: 'Contract Negotiation',
  closedwon: 'Closed Won',
  closedlost: 'Closed Lost',
};

export interface SyncResult {
  success: boolean;
  companies: number;
  contacts: number;
  deals: number;
  duration_ms: number;
  synced_at: string;
  error?: string;
}

export interface SyncStatus {
  last_sync: SyncResult | null;
  next_sync_in_seconds: number | null;
  is_syncing: boolean;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private supabase = getSupabase();
  private hsClient: hubspot.Client;

  private lastSync: SyncResult | null = null;
  private isSyncing = false;
  private lastScheduledAt: Date | null = null;
  private readonly INTERVAL_MS = 300_000; // 5 minutes

  constructor() {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      this.logger.warn('HUBSPOT_ACCESS_TOKEN not set — sync will fail');
    }
    this.hsClient = new hubspot.Client({ accessToken: token || '' });
  }

  // ── Scheduled Task (every 5 minutes) ───────────────────────────────
  @Interval(300_000)
  async scheduledSync(): Promise<void> {
    this.logger.log('[SYNC] Scheduled sync starting...');
    this.lastScheduledAt = new Date();
    const result = await this.runFullSync();
    if (result.success) {
      this.logger.log(
        `[SYNC] Scheduled sync done: ${result.companies} companies, ${result.contacts} contacts, ${result.deals} deals (${result.duration_ms}ms)`,
      );
    } else {
      this.logger.error(`[SYNC] Scheduled sync failed: ${result.error}`);
    }
  }

  // ── Full Sync ───────────────────────────────────────────────────────
  async runFullSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      this.logger.warn('[SYNC] Sync already in progress — skipping');
      return {
        success: false,
        companies: 0,
        contacts: 0,
        deals: 0,
        duration_ms: 0,
        synced_at: new Date().toISOString(),
        error: 'Sync already in progress',
      };
    }

    this.isSyncing = true;
    const start = Date.now();

    try {
      const companiesCount = await this.syncCompanies();
      const contactsCount = await this.syncContacts();
      const dealsCount = await this.syncDeals();

      const result: SyncResult = {
        success: true,
        companies: companiesCount,
        contacts: contactsCount,
        deals: dealsCount,
        duration_ms: Date.now() - start,
        synced_at: new Date().toISOString(),
      };

      this.lastSync = result;
      return result;
    } catch (err: any) {
      const result: SyncResult = {
        success: false,
        companies: 0,
        contacts: 0,
        deals: 0,
        duration_ms: Date.now() - start,
        synced_at: new Date().toISOString(),
        error: err?.message || String(err),
      };
      this.lastSync = result;
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  // ── Status ──────────────────────────────────────────────────────────
  getStatus(): SyncStatus {
    let nextSyncInSeconds: number | null = null;
    if (this.lastScheduledAt) {
      const elapsed = Date.now() - this.lastScheduledAt.getTime();
      nextSyncInSeconds = Math.max(0, Math.round((this.INTERVAL_MS - elapsed) / 1000));
    }

    return {
      last_sync: this.lastSync,
      next_sync_in_seconds: nextSyncInSeconds,
      is_syncing: this.isSyncing,
    };
  }

  // ── Sync Companies ──────────────────────────────────────────────────
  private async syncCompanies(): Promise<number> {
    const properties = [
      'name', 'domain', 'industry', 'type', 'city', 'country',
      'numberofemployees', 'exit_arr', 'segment', 'board_assignment',
      'local_id', 'hubspot_owner_id',
    ];

    let after: string | undefined = undefined;
    let total = 0;

    do {
      const response = await this.hsClient.crm.companies.basicApi.getPage(
        100, after, properties,
      );

      const hubspotIds = response.results.map((c) => c.id);
      const { data: existingRows } = await this.supabase
        .from('crm_companies')
        .select('hubspot_id, assigned_rep_id')
        .in('hubspot_id', hubspotIds);
      const existingRepByHubspot = new Map(
        (existingRows || []).map((r) => [r.hubspot_id, r.assigned_rep_id]),
      );

      const rows = response.results.map((c) => ({
        hubspot_id: c.id,
        local_id: c.properties.local_id || null,
        name: c.properties.name || 'Unknown',
        domain: c.properties.domain || null,
        industry: c.properties.industry || null,
        type: c.properties.type || null,
        city: c.properties.city || null,
        country: c.properties.country || null,
        employee_count: c.properties.numberofemployees
          ? parseInt(c.properties.numberofemployees, 10) : null,
        exit_arr: c.properties.exit_arr ? parseFloat(c.properties.exit_arr) : null,
        segment: c.properties.segment || null,
        board: c.properties.board_assignment || null,
        hubspot_owner_id: c.properties.hubspot_owner_id || null,
        assigned_rep_id: assignedRepIdForHubSpotUpsert(
          existingRepByHubspot.get(c.id) as any,
          c.properties.hubspot_owner_id || null,
        ),
      }));

      if (rows.length > 0) {
        const { error } = await this.supabase
          .from('crm_companies')
          .upsert(rows as any, { onConflict: 'hubspot_id' });
        if (error) {
          this.logger.error(`[SYNC] Companies upsert error: ${error.message}`);
        } else {
          total += rows.length;
        }
      }

      after = response.paging?.next?.after;
      await this.sleep(200);
    } while (after);

    return total;
  }

  // ── Sync Contacts ───────────────────────────────────────────────────
  private async syncContacts(): Promise<number> {
    const properties = ['firstname', 'lastname', 'email', 'phone', 'jobtitle'];
    let after: string | undefined = undefined;
    let total = 0;

    do {
      const response = await this.hsClient.crm.contacts.basicApi.getPage(
        100, after, properties, undefined, ['companies'],
      );

      const rows = response.results.map((c) => {
        const companyAssociation = (c.associations as any)?.companies?.results?.[0];
        return {
          hubspot_id: c.id,
          local_id: c.properties.local_id || null,
          company_hubspot_id: companyAssociation?.id || null,
          first_name: c.properties.firstname || null,
          last_name: c.properties.lastname || null,
          email: c.properties.email || null,
          phone: c.properties.phone || null,
          job_title: c.properties.jobtitle || null,
        };
      });

      if (rows.length > 0) {
        const { error } = await this.supabase
          .from('crm_contacts')
          .upsert(rows as any, { onConflict: 'hubspot_id' });
        if (error) {
          this.logger.error(`[SYNC] Contacts upsert error: ${error.message}`);
        } else {
          total += rows.length;
        }
      }

      after = response.paging?.next?.after;
      await this.sleep(200);
    } while (after);

    return total;
  }

  // ── Sync Deals ──────────────────────────────────────────────────────
  private async syncDeals(): Promise<number> {
    const properties = [
      'dealname', 'dealstage', 'amount', 'adjusted_amount',
      'closedate', 'createdate', 'local_id',
    ];

    let after: string | undefined = undefined;
    let total = 0;

    do {
      const response = await this.hsClient.crm.deals.basicApi.getPage(
        100, after, properties, undefined, ['companies', 'contacts'],
      );

      const rows = response.results.map((d) => {
        const companyAssociation = (d.associations as any)?.companies?.results?.[0];
        const contactAssociation = (d.associations as any)?.contacts?.results?.[0];

        return {
          hubspot_id: d.id,
          local_id: d.properties.local_id || null,
          company_hubspot_id: companyAssociation?.id || null,
          name: d.properties.dealname || null,
          stage: d.properties.dealstage
            ? (STAGE_MAP[d.properties.dealstage] || d.properties.dealstage)
            : null,
          amount: d.properties.amount ? parseFloat(d.properties.amount) : null,
          adjusted_amount: d.properties.adjusted_amount
            ? parseFloat(d.properties.adjusted_amount) : null,
          deal_type: null, // stored in Supabase from seed, not from HubSpot
          close_date: d.properties.closedate
            ? d.properties.closedate.split('T')[0] : null,
          created_at_crm: d.properties.createdate || null,
          primary_contact_hubspot_id: contactAssociation?.id || null,
        };
      });

      if (rows.length > 0) {
        const { error } = await this.supabase
          .from('crm_deals')
          .upsert(rows as any, { onConflict: 'hubspot_id' });
        if (error) {
          this.logger.error(`[SYNC] Deals upsert error: ${error.message}`);
        } else {
          total += rows.length;
        }
      }

      after = response.paging?.next?.after;
      await this.sleep(200);
    } while (after);

    return total;
  }

  // ── Helper ──────────────────────────────────────────────────────────
  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
