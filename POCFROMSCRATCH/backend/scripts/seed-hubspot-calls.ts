/**
 * seed-hubspot-calls.ts
 * =====================
 * Seeds HubSpot with Call objects + Note objects for every CALL activity.
 *
 * For each CALL:
 *   1. Create a HubSpot Call object (title, body, duration, outcome, direction)
 *   2. Create a HubSpot Note object ("Rep: X% · Client: Y% · Zmin\n\nbody")
 *   3. Associate Call → Company, Contact, Deal  (v4 default associations)
 *   4. Associate Note → Call, Company, Contact  (v4 default associations)
 *
 * Uses only @hubspot/api-client (already installed) + built-in fetch.
 *
 * Usage:
 *   npm run seed:hubspot-calls
 */

import { Client } from '@hubspot/api-client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('❌ HUBSPOT_ACCESS_TOKEN not set in .env.local');
  process.exit(1);
}

const client = new Client({ accessToken: ACCESS_TOKEN });
const HS_BASE = 'https://api.hubapi.com';
const HS_HEADERS = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// ── Load seed data ────────────────────────────────────────────────────────────
const dataDir = path.resolve(__dirname, '..', 'data');
const idMapPath = path.join(dataDir, 'hubspot-id-map.json');

if (!fs.existsSync(idMapPath)) {
  console.error('❌ hubspot-id-map.json not found. Run seed-hubspot.ts first.');
  process.exit(1);
}

const idMap: Record<string, string> = JSON.parse(fs.readFileSync(idMapPath, 'utf8'));
const activities: any[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'seed-p3-activities.json'), 'utf8'),
).activities;

// ── Persistence ───────────────────────────────────────────────────────────────
const callsMapPath = path.join(dataDir, 'hubspot-calls-map.json');
let callsMap: Record<string, string> = {};
if (fs.existsSync(callsMapPath)) {
  callsMap = JSON.parse(fs.readFileSync(callsMapPath, 'utf8'));
  console.log(`📂 Loaded existing calls map (${Object.keys(callsMap).length} entries)`);
}
function saveCallsMap() {
  fs.writeFileSync(callsMapPath, JSON.stringify(callsMap, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatDuration(secs: number): string {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

function buildNoteBody(act: any): string {
  const lines: string[] = [];
  if (act.rep_talk_pct != null && act.client_talk_pct != null) {
    lines.push(`Rep: ${act.rep_talk_pct}%  ·  Client: ${act.client_talk_pct}%`);
  }
  if (act.duration_seconds) lines.push(`Duration: ${formatDuration(act.duration_seconds)}`);
  if (act.outcome) lines.push(`Outcome: ${act.outcome}`);
  lines.push('');
  lines.push(act.body || '');
  return lines.join('\n');
}

function toHsCallStatus(outcome: string): string {
  const map: Record<string, string> = {
    'Connected': 'COMPLETED',
    'Follow-up Scheduled': 'COMPLETED',
    'Left Voicemail': 'LEFT_LIVE_MESSAGE',
    'No Answer': 'NO_ANSWER',
  };
  return map[outcome] || 'COMPLETED';
}

/** Create v4 default association between two HubSpot objects (no typeId required) */
async function associateDefault(
  fromType: string,
  fromId: string,
  toType: string,
  toId: string,
): Promise<void> {
  const url = `${HS_BASE}/crm/v4/objects/${fromType}/${fromId}/associations/default/${toType}/${toId}`;
  const res = await fetch(url, { method: 'PUT', headers: HS_HEADERS });
  if (!res.ok) {
    const body = await res.text();
    // 404 is common if the portal doesn't have the target object — treat as warning
    const level = res.status === 404 ? 'warn' : 'error';
    console[level](`   ⚠️  Associate ${fromType}→${toType} (${res.status}): ${body.slice(0, 120)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 HubSpot Calls Seed Starting…\n');

  const callActivities = activities.filter((a) => a.type === 'CALL');
  console.log(`📞 ${callActivities.length} CALL activities found\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const act of callActivities) {
    const localId: string = act.id;

    // Resolve HubSpot IDs
    const companyHsId = idMap[act.company_id];
    const contactHsId = act.contact_id ? idMap[act.contact_id] : null;
    const dealHsId    = act.deal_id    ? idMap[act.deal_id]    : null;

    if (!companyHsId) {
      console.log(`   ⏭️  ${localId}: no company mapping for ${act.company_id}`);
      skipped++;
      continue;
    }

    if (callsMap[localId]) {
      console.log(`   ⏭️  ${localId}: already seeded (call ${callsMap[localId]})`);
      skipped++;
      continue;
    }

    try {
      // ── 1. Create Call object ─────────────────────────────────────────────
      const shortTitle = (act.body || 'Sales Call').split(' ').slice(0, 7).join(' ');
      const callRes = await client.crm.objects.basicApi.create('calls', {
        properties: {
          hs_call_title:     shortTitle,
          hs_call_body:      act.body || '',
          hs_call_duration:  String((act.duration_seconds || 0) * 1000), // HubSpot expects ms
          hs_timestamp:      String(new Date(act.timestamp).getTime()),
          hs_call_status:    toHsCallStatus(act.outcome || 'Connected'),
          hs_call_direction: act.direction === 'INBOUND' ? 'INBOUND' : 'OUTBOUND',
        },
        associations: [],
      });
      const callHsId = callRes.id;
      callsMap[localId] = callHsId;
      saveCallsMap();

      // ── 2. Create Note object ─────────────────────────────────────────────
      const noteRes = await client.crm.objects.basicApi.create('notes', {
        properties: {
          hs_note_body:  buildNoteBody(act),
          hs_timestamp:  String(new Date(act.timestamp).getTime()),
        },
        associations: [],
      });
      const noteHsId = noteRes.id;

      // ── 3. Associate Call → Company / Contact / Deal ──────────────────────
      await associateDefault('calls', callHsId, 'companies', companyHsId);
      if (contactHsId) await associateDefault('calls', callHsId, 'contacts', contactHsId);
      if (dealHsId)    await associateDefault('calls', callHsId, 'deals',    dealHsId);

      // ── 4. Associate Note → Call / Company / Contact ──────────────────────
      await associateDefault('notes', noteHsId, 'calls',     callHsId);
      await associateDefault('notes', noteHsId, 'companies', companyHsId);
      if (contactHsId) await associateDefault('notes', noteHsId, 'contacts', contactHsId);

      const talkInfo = act.rep_talk_pct
        ? `Rep ${act.rep_talk_pct}% / Client ${act.client_talk_pct}%`
        : '';
      console.log(`   ✅ ${localId} → call ${callHsId} · note ${noteHsId}  ${talkInfo}`);
      created++;

      await sleep(200); // ~5 req/sec, well under HubSpot's 10/sec limit
    } catch (err: any) {
      const status = err.response?.status ?? err.code ?? '?';
      const msg    = err.response?.body?.message ?? err.message ?? String(err);
      console.error(`   ❌ ${localId} (${status}): ${msg}`);
      failed++;
    }
  }

  console.log(`\n📊 Done — Created: ${created} · Skipped: ${skipped} · Failed: ${failed}`);
  if (created > 0) console.log(`💾 Saved to data/hubspot-calls-map.json`);
  if (failed > 0)  console.log(`💡 Re-run to retry — already-seeded entries are skipped`);
}

main().catch(console.error);
