/**
 * seed-hubspot.ts
 * ===============
 * Seeds HubSpot with companies, contacts, deals, and engagements from the
 * local seed JSON files. Writes a mapping of local IDs → HubSpot IDs to
 * data/hubspot-id-map.json for use by seed-supabase.ts and sync-once.ts.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/seed-hubspot.ts
 */

import * as hubspot from '@hubspot/api-client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('❌ HUBSPOT_ACCESS_TOKEN not set in .env.local');
  process.exit(1);
}

const client = new hubspot.Client({ accessToken: ACCESS_TOKEN });

// ── Load seed data ────────────────────────────────────────────────────────
const dataDir = path.resolve(__dirname, '..', 'data');
const foundation = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p1-foundation.json'), 'utf8'));
const deals = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p2-deals.json'), 'utf8'));
const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p3-activities.json'), 'utf8'));

// ── ID Map ─ load existing to enable idempotent re-runs ────────────────────────
const idMapPath = path.join(dataDir, 'hubspot-id-map.json');
const idMap: Record<string, string> = fs.existsSync(idMapPath)
  ? JSON.parse(fs.readFileSync(idMapPath, 'utf8'))
  : {};
if (Object.keys(idMap).length > 0) {
  console.log(`ℹ️  Loaded existing idMap with ${Object.keys(idMap).length} entries — will skip already-seeded records`);
}

// ── Rate-limit helper ─────────────────────────────────────────────────────
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Custom Properties ─────────────────────────────────────────────────────

const companyCustomProperties = [
  { name: 'exit_arr', label: 'Exit ARR', type: 'number', fieldType: 'number', groupName: 'companyinformation' },
  {
    name: 'segment', label: 'Segment', type: 'enumeration', fieldType: 'select',
    groupName: 'companyinformation',
    options: [
      { label: 'Mid-Market', value: 'Mid-Market', displayOrder: 1, hidden: false },
      { label: 'Enterprise', value: 'Enterprise', displayOrder: 2, hidden: false },
      { label: 'SMB', value: 'SMB', displayOrder: 3, hidden: false },
    ],
  },
  { name: 'board_assignment', label: 'Board Assignment', type: 'string', fieldType: 'text', groupName: 'companyinformation' },
  { name: 'local_id', label: 'Local ID (Dev)', type: 'string', fieldType: 'text', groupName: 'companyinformation' },
];

const dealCustomProperties = [
  {
    name: 'deal_type', label: 'Deal Type', type: 'enumeration', fieldType: 'select',
    groupName: 'dealinformation',
    options: [
      { label: 'New Business', value: 'New Business', displayOrder: 1, hidden: false },
      { label: 'Renewal', value: 'Renewal', displayOrder: 2, hidden: false },
      { label: 'Upsell', value: 'Upsell', displayOrder: 3, hidden: false },
      { label: 'Cross-sell', value: 'Cross-sell', displayOrder: 4, hidden: false },
    ],
  },
  { name: 'adjusted_amount', label: 'Adjusted Amount', type: 'number', fieldType: 'number', groupName: 'dealinformation' },
  { name: 'local_id', label: 'Local ID (Dev)', type: 'string', fieldType: 'text', groupName: 'dealinformation' },
];

async function createCustomProperties() {
  console.log('📝 Creating custom properties on Company...');
  for (const prop of companyCustomProperties) {
    try {
      await client.crm.properties.coreApi.create('companies', prop as any);
      console.log(`   ✅ companies.${prop.name}`);
    } catch (err: any) {
      if (err?.code === 409 || err?.body?.category === 'CONFLICT') {
        console.log(`   ⏭️  companies.${prop.name} already exists, skipping`);
      } else {
        console.error(`   ❌ companies.${prop.name}:`, err?.body?.message || err.message);
      }
    }
    await sleep(150);
  }

  console.log('📝 Creating custom properties on Deal...');
  for (const prop of dealCustomProperties) {
    try {
      await client.crm.properties.coreApi.create('deals', prop as any);
      console.log(`   ✅ deals.${prop.name}`);
    } catch (err: any) {
      if (err?.code === 409 || err?.body?.category === 'CONFLICT') {
        console.log(`   ⏭️  deals.${prop.name} already exists, skipping`);
      } else {
        console.error(`   ❌ deals.${prop.name}:`, err?.body?.message || err.message);
      }
    }
    await sleep(150);
  }
}

// ── Deal Stage Mapping ────────────────────────────────────────────────────
// Default HubSpot deal pipeline stages (default pipeline)
const DEAL_STAGE_MAP: Record<string, string> = {
  'Prospecting': 'appointmentscheduled',
  'Qualification': 'qualifiedtobuy',
  'Solution Presentation': 'presentationscheduled',
  'Proposal Sent': 'decisionmakerboughtin',
  'Contract Negotiation': 'contractsent',
  'Closed Won': 'closedwon',
  'Closed Lost': 'closedlost',
};

function mapDealStageToHubspot(stage: string): string {
  return DEAL_STAGE_MAP[stage] || 'appointmentscheduled';
}

// ── HubSpot Call Disposition Mapping ──────────────────────────────────────
const OUTCOME_MAP: Record<string, string> = {
  'Connected': 'f240bbac-87c9-4f6e-bf70-924b57d47db7',
  'Follow-up Scheduled': 'a4c4c377-d246-4b32-a13b-75a56a4cd0ff',
  'Left Voicemail': '73a0d17f-1163-4015-8db0-11571b154e92',
  'No Answer': '9d9162e7-6cf3-4944-bf63-4dff82258764',
};

// ── Create Companies ──────────────────────────────────────────────────────
async function seedCompanies() {
  console.log('\n🏢 Seeding Companies...');
  for (const company of foundation.companies) {
    // Skip if already seeded in a previous run
    if (idMap[company.id]) {
      console.log(`   ⏭️  ${company.name} already in idMap, skipping`);
      continue;
    }
    try {
      const result = await client.crm.companies.basicApi.create({
        properties: {
          name: company.name,
          domain: company.domain,
          // industry and type use HubSpot ALL_CAPS enum format — stored in Supabase only
          city: company.city,
          country: company.country,
          numberofemployees: String(company.employee_count),
          exit_arr: String(company.exit_arr),
          segment: company.segment,
          board_assignment: company.board,
          local_id: company.id,
        },
        associations: [],
      });
      idMap[company.id] = result.id;
      console.log(`   ✅ ${company.name} → ${result.id}`);
    } catch (err: any) {
      console.error(`   ❌ ${company.name}:`, err?.body?.message || err.message);
    }
    await sleep(200);
  }
}

// ── Create Contacts ───────────────────────────────────────────────────────
async function seedContacts() {
  console.log('\n👤 Seeding Contacts...');
  for (const contact of foundation.contacts) {
    try {
      // Clean email — some JSON values are wrapped in markdown link syntax
      const cleanEmail = contact.email.replace(/\[|\]|\(mailto:[^)]+\)/g, '');

      const result = await client.crm.contacts.basicApi.create({
        properties: {
          firstname: contact.first_name,
          lastname: contact.last_name,
          email: cleanEmail,
          phone: contact.phone,
          jobtitle: contact.job_title,
        },
        associations: [],
      });
      idMap[contact.id] = result.id;
      console.log(`   ✅ ${contact.first_name} ${contact.last_name} → ${result.id}`);

      // Associate contact → company (typeId 1 = contactToCompany)
      const companyHubspotId = idMap[contact.company_id];
      if (companyHubspotId) {
        await client.crm.associations.v4.basicApi.create(
          'contacts', result.id,
          'companies', companyHubspotId,
          [{ associationTypeId: 1, associationCategory: 'HUBSPOT_DEFINED' as any }]
        );
      }
    } catch (err: any) {
      const msg: string = err?.body?.message || err?.message || '';
      // If contact already exists, extract its ID from the error message
      const existingMatch = msg.match(/Existing ID:\s*(\d+)/);
      if (existingMatch) {
        idMap[contact.id] = existingMatch[1];
        console.log(`   ♻️  ${contact.first_name} ${contact.last_name} already exists → ${existingMatch[1]}`);
      } else {
        console.error(`   ❌ ${contact.first_name} ${contact.last_name}:`, msg);
      }
    }
    await sleep(200);
  }
}

// ── Create Deals ──────────────────────────────────────────────────────────
async function seedDeals() {
  console.log('\n💰 Seeding Deals...');
  for (const deal of deals.deals) {
    if (idMap[deal.id]) {
      console.log(`   ⏭️  ${deal.name} already in idMap, skipping`);
      continue;
    }
    try {
      const result = await client.crm.deals.basicApi.create({
        properties: {
          dealname: deal.name,
          dealstage: mapDealStageToHubspot(deal.stage),
          amount: String(deal.amount),
          adjusted_amount: String(deal.adjusted_amount),
          // deal_type removed — conflicts with built-in 'dealtype'; stored in Supabase only
          closedate: new Date(deal.close_date).toISOString(),
          local_id: deal.id,
        },
        associations: [],
      });
      idMap[deal.id] = result.id;
      console.log(`   ✅ ${deal.name} → ${result.id}`);

      // Associate deal → company (typeId 5 = dealToCompany)
      const companyHubspotId = idMap[deal.company_id];
      if (companyHubspotId) {
        await client.crm.associations.v4.basicApi.create(
          'deals', result.id,
          'companies', companyHubspotId,
          [{ associationTypeId: 5, associationCategory: 'HUBSPOT_DEFINED' as any }]
        );
      }

      // Associate deal → primary contact (typeId 3 = dealToContact)
      const contactHubspotId = idMap[deal.primary_contact_id];
      if (contactHubspotId) {
        await client.crm.associations.v4.basicApi.create(
          'deals', result.id,
          'contacts', contactHubspotId,
          [{ associationTypeId: 3, associationCategory: 'HUBSPOT_DEFINED' as any }]
        );
      }
    } catch (err: any) {
      console.error(`   ❌ ${deal.name}:`, err?.body?.message || err.message);
    }
    await sleep(250);
  }
}

// ── Engagement type → CRM object type mapping ────────────────────────────
const ENGAGEMENT_OBJECT_MAP: Record<string, string> = {
  CALL: 'calls',
  EMAIL: 'emails',
  MEETING: 'meetings',
};

// Association type IDs for CRM v3 objects
// company=187 (call→company), contact=194 (call→contact), deal=206 (call→deal)
// For emails: company=182, contact=198, deal=209
// For meetings: company=185, contact=200, deal=212
const ASSOC_TYPE_IDS: Record<string, { company: number; contact: number; deal: number }> = {
  calls:    { company: 187, contact: 194, deal: 206 },
  emails:   { company: 182, contact: 198, deal: 209 },
  meetings: { company: 185, contact: 200, deal: 212 },
};

// ── Create Activities via CRM Objects API ─────────────────────────────────
async function seedEngagements() {
  console.log('\n📞 Seeding Activities (Calls/Emails/Meetings via CRM v3)...');

  for (const activity of activities.activities) {
    try {
      const companyHubspotId = idMap[activity.company_id];
      const contactHubspotId = idMap[activity.contact_id];
      const dealHubspotId = activity.deal_id ? idMap[activity.deal_id] : null;
      const objectType = ENGAGEMENT_OBJECT_MAP[activity.type];

      if (!objectType) {
        console.warn(`   ⚠️  Unknown type ${activity.type}, skipping ${activity.id}`);
        continue;
      }

      // Build properties per object type
      let properties: Record<string, string> = {
        hs_timestamp: new Date(activity.timestamp).toISOString(),
      };

      if (activity.type === 'CALL') {
        properties = {
          ...properties,
          hs_call_body: activity.body || '',
          hs_call_duration: String((activity.duration_seconds || 0) * 1000),
          hs_call_status: 'COMPLETED',
          hs_call_disposition: OUTCOME_MAP[activity.outcome] || OUTCOME_MAP['Connected'],
          hs_call_direction: activity.direction === 'INBOUND' ? 'INBOUND' : 'OUTBOUND',
        };
      } else if (activity.type === 'EMAIL') {
        properties = {
          ...properties,
          hs_email_subject: activity.subject || '(no subject)',
          hs_email_text: activity.body || '',
          hs_email_direction: activity.direction === 'INBOUND' ? 'INCOMING_EMAIL' : 'EMAIL',
          hs_email_status: 'SENT',
        };
      } else if (activity.type === 'MEETING') {
        const startMs = new Date(activity.timestamp).getTime();
        const endMs = startMs + (activity.duration_seconds || 3600) * 1000;
        properties = {
          ...properties,
          hs_meeting_title: activity.title || 'Meeting',
          hs_meeting_body: activity.body || '',
          hs_meeting_start_time: new Date(startMs).toISOString(),
          hs_meeting_end_time: new Date(endMs).toISOString(),
          hs_meeting_outcome: 'COMPLETED',
        };
      }

      // Create the object
      const createResult = await client.apiRequest({
        method: 'POST',
        path: `/crm/v3/objects/${objectType}`,
        body: { properties },
      });
      const created = await createResult.json();
      const hubspotId = created.id;
      idMap[activity.id] = String(hubspotId);

      // Associate to company
      if (companyHubspotId && hubspotId) {
        const typeId = ASSOC_TYPE_IDS[objectType].company;
        await client.apiRequest({
          method: 'PUT',
          path: `/crm/v3/objects/${objectType}/${hubspotId}/associations/companies/${companyHubspotId}/${typeId}`,
          body: {},
        });
      }
      // Associate to contact
      if (contactHubspotId && hubspotId) {
        const typeId = ASSOC_TYPE_IDS[objectType].contact;
        await client.apiRequest({
          method: 'PUT',
          path: `/crm/v3/objects/${objectType}/${hubspotId}/associations/contacts/${contactHubspotId}/${typeId}`,
          body: {},
        });
      }
      // Associate to deal
      if (dealHubspotId && hubspotId) {
        const typeId = ASSOC_TYPE_IDS[objectType].deal;
        await client.apiRequest({
          method: 'PUT',
          path: `/crm/v3/objects/${objectType}/${hubspotId}/associations/deals/${dealHubspotId}/${typeId}`,
          body: {},
        });
      }

      console.log(`   ✅ ${activity.type} ${activity.id} → ${hubspotId}`);
    } catch (err: any) {
      console.error(`   ❌ ${activity.type} ${activity.id}:`, err?.body?.message || err?.message || err);
    }
    await sleep(300);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 HubSpot Seed Script Starting...\n');
  console.log(`   Access Token: ${ACCESS_TOKEN!.substring(0, 10)}...`);
  console.log(`   Foundation: ${foundation.companies.length} companies, ${foundation.contacts.length} contacts`);
  console.log(`   Deals: ${deals.deals.length}`);
  console.log(`   Activities: ${activities.activities.length}`);

  // Step 1: Custom properties
  await createCustomProperties();

  // Step 2: Companies
  await seedCompanies();

  // Step 3: Contacts
  await seedContacts();

  // Step 4: Deals
  await seedDeals();

  // NOTE: Activities (calls/emails/meetings) are seeded directly into Supabase
  // by seed-supabase.ts — HubSpot's Service Key does not expose crm.objects.calls/emails/meetings scopes.

  // Step 5: Write ID map
  fs.writeFileSync(idMapPath, JSON.stringify(idMap, null, 2));
  console.log(`\n✅ HubSpot seed complete. ID map written to ${idMapPath}`);
  console.log(`   Total IDs mapped: ${Object.keys(idMap).length}`);
  console.log(`   ℹ️  Activities will be seeded directly to Supabase via seed-supabase.ts`);
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
