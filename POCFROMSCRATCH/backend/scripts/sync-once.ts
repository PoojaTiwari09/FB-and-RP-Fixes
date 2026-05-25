/**
 * sync-once.ts
 * ============
 * One-time synchronization from HubSpot → Supabase.
 * Pulls all companies, contacts, deals, and engagements from HubSpot API
 * and upserts them into the crm_* tables in Supabase.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/sync-once.ts
 */

import * as hubspot from '@hubspot/api-client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ HUBSPOT_ACCESS_TOKEN, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const hsClient = new hubspot.Client({ accessToken: ACCESS_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Load ID map for local_id resolution
const dataDir = path.resolve(__dirname, '..', 'data');
const idMapPath = path.join(dataDir, 'hubspot-id-map.json');
let idMap: Record<string, string> = {};
let reverseIdMap: Record<string, string> = {};
if (fs.existsSync(idMapPath)) {
  idMap = JSON.parse(fs.readFileSync(idMapPath, 'utf8'));
  reverseIdMap = Object.fromEntries(Object.entries(idMap).map(([k, v]) => [v, k]));
}

// Rate limiter
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Sync Companies ────────────────────────────────────────────────────────
async function syncCompanies() {
  console.log('\n🏢 Syncing Companies from HubSpot...');

  const properties = [
    'name', 'domain', 'industry', 'type', 'city', 'country',
    'numberofemployees', 'exit_arr', 'segment', 'board_assignment',
    'local_id', 'hubspot_owner_id',
  ];

  let after: string | undefined = undefined;
  let total = 0;

  do {
    const response = await hsClient.crm.companies.basicApi.getPage(
      100,        // limit
      after,      // after cursor
      properties, // properties
    );

    const rows = response.results.map((c) => ({
      hubspot_id: c.id,
      local_id: c.properties.local_id || reverseIdMap[c.id] || null,
      name: c.properties.name || 'Unknown',
      domain: c.properties.domain || null,
      industry: c.properties.industry || null,
      type: c.properties.type || null,
      city: c.properties.city || null,
      country: c.properties.country || null,
      employee_count: c.properties.numberofemployees ? parseInt(c.properties.numberofemployees) : null,
      exit_arr: c.properties.exit_arr ? parseFloat(c.properties.exit_arr) : null,
      segment: c.properties.segment || null,
      board: c.properties.board_assignment || null,
      assigned_rep_id: c.properties.local_id ? getRepForCompany(c.properties.local_id) : null,
      hubspot_owner_id: c.properties.hubspot_owner_id || null,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('crm_companies').upsert(rows, { onConflict: 'hubspot_id' });
      if (error) {
        console.error(`   ❌ Error upserting companies batch: ${error.message}`);
      } else {
        total += rows.length;
        console.log(`   ✅ Synced ${rows.length} companies (total: ${total})`);
      }
    }

    after = response.paging?.next?.after;
    await sleep(200);
  } while (after);

  console.log(`   📊 Total companies synced: ${total}`);
}

// Helper: resolve rep assignment from local_id
function getRepForCompany(localId: string): string | null {
  try {
    const foundation = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p1-foundation.json'), 'utf8'));
    const company = foundation.companies.find((c: any) => c.id === localId);
    return company?.assigned_rep_id || null;
  } catch {
    return null;
  }
}

// ── Sync Contacts ─────────────────────────────────────────────────────────
async function syncContacts() {
  console.log('\n👤 Syncing Contacts from HubSpot...');

  const properties = ['firstname', 'lastname', 'email', 'phone', 'jobtitle'];
  let after: string | undefined = undefined;
  let total = 0;

  do {
    const response = await hsClient.crm.contacts.basicApi.getPage(
      100,
      after,
      properties,
      undefined,  // propertiesWithHistory
      ['companies'], // associations
    );

    const rows = response.results.map((c) => {
      // Get associated company HubSpot ID
      const companyAssociation = c.associations?.companies?.results?.[0];
      const companyHubspotId = companyAssociation?.id || null;
      const localId = reverseIdMap[c.id] || null;

      // Check if primary from seed data
      let isPrimary = false;
      if (localId) {
        try {
          const foundation = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p1-foundation.json'), 'utf8'));
          const seedContact = foundation.contacts.find((ct: any) => ct.id === localId);
          isPrimary = seedContact?.is_primary || false;
        } catch { /* ignore */ }
      }

      return {
        hubspot_id: c.id,
        local_id: localId,
        company_hubspot_id: companyHubspotId,
        first_name: c.properties.firstname || null,
        last_name: c.properties.lastname || null,
        email: c.properties.email || null,
        phone: c.properties.phone || null,
        job_title: c.properties.jobtitle || null,
        is_primary: isPrimary,
      };
    });

    if (rows.length > 0) {
      const { error } = await supabase.from('crm_contacts').upsert(rows, { onConflict: 'hubspot_id' });
      if (error) {
        console.error(`   ❌ Error upserting contacts batch: ${error.message}`);
      } else {
        total += rows.length;
        console.log(`   ✅ Synced ${rows.length} contacts (total: ${total})`);
      }
    }

    after = response.paging?.next?.after;
    await sleep(200);
  } while (after);

  console.log(`   📊 Total contacts synced: ${total}`);
}

// ── Sync Deals ────────────────────────────────────────────────────────────

// Reverse mapping: HubSpot stage → display stage
const HUBSPOT_STAGE_REVERSE: Record<string, string> = {
  'appointmentscheduled': 'Prospecting',
  'qualifiedtobuy': 'Qualification',
  'presentationscheduled': 'Solution Presentation',
  'decisionmakerboughtin': 'Proposal Sent',
  'contractsent': 'Contract Negotiation',
  'closedwon': 'Closed Won',
  'closedlost': 'Closed Lost',
};

async function syncDeals() {
  console.log('\n💰 Syncing Deals from HubSpot...');


  const properties = [
    'dealname', 'dealstage', 'amount', 'adjusted_amount',
    'closedate', 'createdate', 'local_id',
    // deal_type not fetched — property doesn't exist in HubSpot (name conflict with built-in)
  ];

  let after: string | undefined = undefined;
  let total = 0;

  do {
    const response = await hsClient.crm.deals.basicApi.getPage(
      100,
      after,
      properties,
      undefined,
      ['companies', 'contacts'],
    );

    const rows = response.results.map((d) => {
      const companyAssociation = d.associations?.companies?.results?.[0];
      const contactAssociation = d.associations?.contacts?.results?.[0];
      const localId = reverseIdMap[d.id] || d.properties.local_id || null;

      // Resolve assigned_rep_id from seed data
      let assignedRepId: string | null = null;
      if (localId) {
        try {
          const dealsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p2-deals.json'), 'utf8'));
          const seedDeal = dealsData.deals.find((dl: any) => dl.id === localId);
          assignedRepId = seedDeal?.assigned_rep_id || null;
        } catch { /* ignore */ }
      }

      return {
        hubspot_id: d.id,
        local_id: localId,
        company_hubspot_id: companyAssociation?.id || null,
        name: d.properties.dealname || null,
        stage: d.properties.dealstage ? (HUBSPOT_STAGE_REVERSE[d.properties.dealstage] || d.properties.dealstage) : null,
        amount: d.properties.amount ? parseFloat(d.properties.amount) : null,
        adjusted_amount: d.properties.adjusted_amount ? parseFloat(d.properties.adjusted_amount) : null,
        deal_type: null,  // stored in Supabase from seed data, not from HubSpot
        close_date: d.properties.closedate ? d.properties.closedate.split('T')[0] : null,
        created_at_crm: d.properties.createdate || null,
        assigned_rep_id: assignedRepId,
        primary_contact_hubspot_id: contactAssociation?.id || null,
      };
    });

    if (rows.length > 0) {
      const { error } = await supabase.from('crm_deals').upsert(rows, { onConflict: 'hubspot_id' });
      if (error) {
        console.error(`   ❌ Error upserting deals batch: ${error.message}`);
      } else {
        total += rows.length;
        console.log(`   ✅ Synced ${rows.length} deals (total: ${total})`);
      }
    }

    after = response.paging?.next?.after;
    await sleep(200);
  } while (after);

  console.log(`   📊 Total deals synced: ${total}`);
}

// ── Sync Activities (Calls / Emails / Meetings via CRM v3) ───────────────
async function syncEngagements() {
  console.log('\n📞 Syncing Activities from HubSpot (CRM v3 Objects)...');
  let total = 0;

  const TYPES = [
    {
      objectType: 'calls',
      type: 'CALL',
      props: ['hs_timestamp', 'hs_call_body', 'hs_call_duration', 'hs_call_status', 'hs_call_disposition', 'hs_call_direction'],
    },
    {
      objectType: 'emails',
      type: 'EMAIL',
      props: ['hs_timestamp', 'hs_email_subject', 'hs_email_text', 'hs_email_direction', 'hs_email_status'],
    },
    {
      objectType: 'meetings',
      type: 'MEETING',
      props: ['hs_timestamp', 'hs_meeting_title', 'hs_meeting_body', 'hs_meeting_start_time', 'hs_meeting_end_time', 'hs_meeting_outcome'],
    },
  ];

  for (const { objectType, type, props } of TYPES) {
    console.log(`\n   → ${type}s`);
    let after: string | undefined = undefined;

    do {
      try {
        const response = await hsClient.crm.objects.basicApi.getPage(
          objectType,
          100,
          after,
          props,
          undefined,
          ['companies', 'contacts', 'deals'],
        );

        for (const obj of response.results) {
          const p = obj.properties;
          const localId = reverseIdMap[obj.id] || null;

          const companyId = (obj.associations as any)?.companies?.results?.[0]?.id || null;
          const contactId = (obj.associations as any)?.contacts?.results?.[0]?.id || null;
          const dealId   = (obj.associations as any)?.deals?.results?.[0]?.id || null;

          // Resolve rep + extra fields from seed if known
          let assignedRepId: string | null = null;
          let repTalkPct: number | null = null;
          let clientTalkPct: number | null = null;
          let direction = type === 'MEETING' ? 'N/A' : 'OUTBOUND';

          if (localId) {
            try {
              const actData = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p3-activities.json'), 'utf8'));
              const seedAct = actData.activities.find((a: any) => a.id === localId);
              if (seedAct) {
                assignedRepId = seedAct.assigned_rep_id || null;
                repTalkPct    = seedAct.rep_talk_pct || null;
                clientTalkPct = seedAct.client_talk_pct || null;
                direction     = seedAct.direction || direction;
              }
            } catch { /* ignore */ }
          }

          const row: any = {
            hubspot_id: obj.id,
            local_id: localId,
            company_hubspot_id: companyId,
            contact_hubspot_id: contactId,
            deal_hubspot_id: dealId,
            assigned_rep_id: assignedRepId,
            type,
            direction,
            timestamp: p.hs_timestamp
              ? new Date(p.hs_timestamp).toISOString()
              : new Date().toISOString(),
            body: null,
          };

          if (type === 'CALL') {
            row.body = p.hs_call_body || null;
            row.duration_seconds = p.hs_call_duration
              ? Math.round(parseInt(p.hs_call_duration) / 1000)
              : null;
            row.call_outcome = p.hs_call_disposition || null;
            row.rep_talk_pct = repTalkPct;
            row.client_talk_pct = clientTalkPct;
          } else if (type === 'EMAIL') {
            row.body = p.hs_email_text || null;
            row.subject = p.hs_email_subject || null;
            row.snippet = (p.hs_email_text || '').substring(0, 200) || null;
          } else if (type === 'MEETING') {
            row.body = p.hs_meeting_body || null;
            row.title = p.hs_meeting_title || null;
            if (p.hs_meeting_start_time && p.hs_meeting_end_time) {
              row.duration_seconds = Math.round(
                (new Date(p.hs_meeting_end_time).getTime() - new Date(p.hs_meeting_start_time).getTime()) / 1000,
              );
            }
            row.attendee_contact_ids = resolveAttendeeIds(localId);
          }

          const { error } = await supabase
            .from('crm_activities')
            .upsert(row, { onConflict: 'hubspot_id' });

          if (error) {
            console.error(`   ❌ ${type} ${obj.id}: ${error.message}`);
          } else {
            total++;
          }
        }

        after = response.paging?.next?.after;
        console.log(`   ✅ Batch done, running total: ${total}`);
        await sleep(300);
      } catch (err: any) {
        console.error(`   ❌ ${type} sync error:`, err?.body?.message || err?.message || err);
        break;
      }
    } while (after);
  }

  console.log(`   📊 Total activities synced: ${total}`);
}

// Helper: get direction from seed data
function getDirection(type: string, localId: string | null): string {
  if (!localId) {
    return type === 'MEETING' ? 'N/A' : 'OUTBOUND';
  }
  try {
    const actData = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p3-activities.json'), 'utf8'));
    const seedAct = actData.activities.find((a: any) => a.id === localId);
    return seedAct?.direction || (type === 'MEETING' ? 'N/A' : 'OUTBOUND');
  } catch {
    return type === 'MEETING' ? 'N/A' : 'OUTBOUND';
  }
}

// Helper: resolve attendee contact IDs for meetings
function resolveAttendeeIds(localId: string | null): string[] | null {
  if (!localId) return null;
  try {
    const actData = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p3-activities.json'), 'utf8'));
    const seedAct = actData.activities.find((a: any) => a.id === localId);
    if (seedAct?.attendee_contact_ids) {
      return seedAct.attendee_contact_ids.map((cid: string) => idMap[cid] || cid);
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 One-Time Sync: HubSpot → Supabase\n');
  console.log(`   HubSpot Token: ${ACCESS_TOKEN!.substring(0, 10)}...`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   ID Map entries: ${Object.keys(idMap).length}`);

  // Order matters: companies first (foreign keys)
  await syncCompanies();
  await syncContacts();
  await syncDeals();
  // Activities are already in Supabase from seed-supabase.ts (seeded directly from JSON).
  // HubSpot Service Keys do not expose crm.objects.calls/emails/meetings scopes.

  console.log('\n✅ One-time sync complete!');
  console.log('   ℹ️  Activities were already seeded directly by seed-supabase.ts');
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
