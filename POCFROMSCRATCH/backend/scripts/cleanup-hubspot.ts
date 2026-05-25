/**
 * cleanup-hubspot.ts
 * ==================
 * Deletes ALL seeded companies, contacts and deals from HubSpot.
 * Contacts are only deleted if their ID appears in hubspot-id-map.json.
 * Run this ONCE before re-seeding to get a clean state.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/cleanup-hubspot.ts
 */

import * as hubspot from '@hubspot/api-client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!ACCESS_TOKEN) { console.error('❌ HUBSPOT_ACCESS_TOKEN not set'); process.exit(1); }

const client = new hubspot.Client({ accessToken: ACCESS_TOKEN });

const dataDir = path.resolve(__dirname, '..', 'data');
const idMapPath = path.join(dataDir, 'hubspot-id-map.json');

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Delete all companies ──────────────────────────────────────────────────
async function deleteAllCompanies() {
  console.log('\n🗑️  Deleting ALL companies from HubSpot...');
  let after: string | undefined = undefined;
  let total = 0;
  do {
    const res = await client.crm.companies.basicApi.getPage(100, after, ['name']);
    for (const co of res.results) {
      try {
        await client.crm.companies.basicApi.archive(co.id);
        console.log(`   ✅ Deleted company: ${co.properties.name} (${co.id})`);
        total++;
      } catch (e: any) {
        console.error(`   ❌ ${co.id}: ${e?.body?.message || e.message}`);
      }
      await sleep(150);
    }
    after = res.paging?.next?.after;
  } while (after);
  console.log(`   📊 Total companies deleted: ${total}`);
}

// ── Delete all deals ──────────────────────────────────────────────────────
async function deleteAllDeals() {
  console.log('\n🗑️  Deleting ALL deals from HubSpot...');
  let after: string | undefined = undefined;
  let total = 0;
  do {
    const res = await client.crm.deals.basicApi.getPage(100, after, ['dealname']);
    for (const d of res.results) {
      try {
        await client.crm.deals.basicApi.archive(d.id);
        console.log(`   ✅ Deleted deal: ${d.properties.dealname} (${d.id})`);
        total++;
      } catch (e: any) {
        console.error(`   ❌ ${d.id}: ${e?.body?.message || e.message}`);
      }
      await sleep(150);
    }
    after = res.paging?.next?.after;
  } while (after);
  console.log(`   📊 Total deals deleted: ${total}`);
}

// ── Delete only our seeded contacts (from idMap) ──────────────────────────
async function deleteSeededContacts() {
  console.log('\n🗑️  Deleting seeded contacts from HubSpot (from idMap)...');
  if (!fs.existsSync(idMapPath)) {
    console.log('   ⚠️  No idMap found, skipping contact deletion');
    return;
  }
  const idMap: Record<string, string> = JSON.parse(fs.readFileSync(idMapPath, 'utf8'));
  const contactIds = Object.entries(idMap)
    .filter(([k]) => k.startsWith('cont_'))
    .map(([, v]) => v);

  console.log(`   Found ${contactIds.length} seeded contacts to delete`);
  let total = 0;
  for (const id of contactIds) {
    try {
      await client.crm.contacts.basicApi.archive(id);
      console.log(`   ✅ Deleted contact ${id}`);
      total++;
    } catch (e: any) {
      console.error(`   ❌ ${id}: ${e?.body?.message || e.message}`);
    }
    await sleep(150);
  }
  console.log(`   📊 Total contacts deleted: ${total}`);
}

// ── Reset the idMap file ──────────────────────────────────────────────────
function resetIdMap() {
  fs.writeFileSync(idMapPath, JSON.stringify({}, null, 2));
  console.log('\n🗑️  hubspot-id-map.json reset to empty {}');
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🧹 HubSpot Cleanup Starting...');
  console.log('   This will delete ALL companies, ALL deals, and your 30 seeded contacts.\n');

  await deleteAllDeals();
  await deleteAllCompanies();
  await deleteSeededContacts();
  resetIdMap();

  console.log('\n✅ HubSpot cleanup complete! Ready for a fresh seed.');
}

main().catch(err => { console.error('💥', err); process.exit(1); });
