/**
 * seed-supabase.ts
 * ================
 * Seeds Supabase with board configuration, tabs, columns, permission profiles,
 * and supplementary account data. Depends on hubspot-id-map.json from seed-hubspot.ts.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Load seed data ────────────────────────────────────────────────────────
const dataDir = path.resolve(__dirname, '..', 'data');

const idMapPath = path.join(dataDir, 'hubspot-id-map.json');
if (!fs.existsSync(idMapPath)) {
  console.error('❌ data/hubspot-id-map.json not found. Run seed-hubspot.ts first.');
  process.exit(1);
}

const idMap: Record<string, string> = JSON.parse(fs.readFileSync(idMapPath, 'utf8'));
const foundation = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p1-foundation.json'), 'utf8'));
const supplementary = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p4-supplementary.json'), 'utf8'));

// ── Helper ────────────────────────────────────────────────────────────────
async function upsertAndLog(table: string, data: any[], label?: string) {
  const { error } = await supabase.from(table).insert(data);
  if (error) {
    console.error(`   ❌ ${label || table}: ${error.message}`);
    return false;
  }
  console.log(`   ✅ ${label || table}: ${data.length} rows inserted`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Supabase Seed Script Starting...\n');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   ID Map entries: ${Object.keys(idMap).length}`);

  // 1. Seed board_config
  console.log('\n📋 Seeding board_config...');
  await upsertAndLog(
    'board_config',
    supplementary.board_config.map((b: any) => ({
      board_id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      default_sort_field: b.default_sort_field,
      default_sort_dir: b.default_sort_dir,
      date_filter_enabled: b.date_filter_enabled,
      ai_briefs_enabled: b.ai_briefs_enabled,
      created_by: b.created_by,
      created_at: b.created_at,
    })),
    'board_config'
  );

  // 2. Seed board_tabs
  console.log('\n📑 Seeding board_tabs...');
  await upsertAndLog(
    'board_tabs',
    supplementary.board_tabs.map((t: any) => ({
      tab_id: t.id,
      board_id: t.board_id,
      label: t.label,
      order: t.order,
      filter_logic: t.filter_logic,
      is_default: t.is_default,
    })),
    'board_tabs'
  );

  // 3. Seed board_columns
  console.log('\n📊 Seeding board_columns...');
  await upsertAndLog(
    'board_columns',
    supplementary.board_columns.map((c: any) => ({
      col_id: c.id,
      board_id: c.board_id,
      field_key: c.field_key,
      label: c.label,
      order: c.order,
      width: c.width,
      sortable: c.sortable,
      editable: c.editable,
      visible_to_roles: c.visible_to_roles,
    })),
    'board_columns'
  );

  // 4. Seed permission_profiles
  console.log('\n🔒 Seeding permission_profiles...');
  await upsertAndLog(
    'permission_profiles',
    supplementary.permission_profiles.map((p: any) => ({
      role: p.role,
      can_view_all_reps: p.can_view_all_reps,
      can_edit_board_config: p.can_edit_board_config,
      can_edit_columns: p.can_edit_columns,
      can_inline_edit: p.can_inline_edit,
      can_view_ai_briefs: p.can_view_ai_briefs,
      can_trigger_sync: p.can_trigger_sync,
    })),
    'permission_profiles'
  );

  // 5. Seed supplementary_accounts (needs HubSpot ID mapping)
  console.log('\n📈 Seeding supplementary_accounts...');
  const suppRows = supplementary.supplementary_accounts
    .map((s: any) => {
      const hubspotId = idMap[s.company_id];
      if (!hubspotId) {
        console.warn(`   ⚠️  No HubSpot ID found for ${s.company_id}, skipping`);
        return null;
      }
      return {
        company_hubspot_id: hubspotId,
        manager_note: s.manager_note,
        next_qbr_date: s.next_qbr_date,
        ai_risk_score: s.ai_risk_score,
        risk_label: s.risk_label,
        strategic_priority: s.strategic_priority,
        created_at: s.created_at,
      };
    })
    .filter(Boolean);

  if (suppRows.length > 0) {
    await upsertAndLog('supplementary_accounts', suppRows, 'supplementary_accounts');
  }

  // 6. Seed some initial todos/notes for demo
  console.log('\n📝 Seeding sample todos & notes...');
  const sampleTodos = [
    {
      company_hubspot_id: idMap['comp_01'],
      created_by_role: 'rep',
      type: 'todo',
      content: 'Follow up with Michael Reed on Q1 expansion proposal',
      completed: false,
    },
    {
      company_hubspot_id: idMap['comp_01'],
      created_by_role: 'manager',
      type: 'note',
      content: 'Strong executive alignment — push AI workflow expansion before budget freeze',
      completed: false,
    },
    {
      company_hubspot_id: idMap['comp_03'],
      created_by_role: 'manager',
      type: 'todo',
      content: 'Schedule urgent check-in re: renewal risk — no executive engagement in 3 weeks',
      completed: false,
    },
    {
      company_hubspot_id: idMap['comp_05'],
      created_by_role: 'rep',
      type: 'todo',
      content: 'Send predictive maintenance ROI analysis to Henry Walters',
      completed: false,
    },
    {
      company_hubspot_id: idMap['comp_07'],
      created_by_role: 'rep',
      type: 'todo',
      content: 'Prepare telecom renewal executive summary for procurement review',
      completed: false,
    },
  ].filter((t) => t.company_hubspot_id); // only if IDs exist

  if (sampleTodos.length > 0) {
    await upsertAndLog('todos_notes', sampleTodos, 'todos_notes');
  }

  // 7. Seed crm_activities directly from seed JSON (bypasses HubSpot scope limitation)
  console.log('\n📞 Seeding crm_activities directly from seed-p3-activities.json...');
  const activitiesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-p3-activities.json'), 'utf8'));

  const activityRows = activitiesData.activities
    .map((a: any) => {
      const companyHubspotId = idMap[a.company_id];
      if (!companyHubspotId) {
        console.warn(`   ⚠️  No HubSpot ID for company ${a.company_id}, skipping activity ${a.id}`);
        return null;
      }
      const row: any = {
        hubspot_id: `local_${a.id}`,           // synthetic ID — not a real HubSpot ID
        local_id: a.id,
        company_hubspot_id: companyHubspotId,
        contact_hubspot_id: a.contact_id ? idMap[a.contact_id] || null : null,
        deal_hubspot_id: a.deal_id ? idMap[a.deal_id] || null : null,
        assigned_rep_id: a.assigned_rep_id || null,
        type: a.type,
        direction: a.direction || (a.type === 'MEETING' ? 'N/A' : 'OUTBOUND'),
        timestamp: new Date(a.timestamp).toISOString(),
        body: a.body || null,
      };
      if (a.type === 'CALL') {
        row.duration_seconds = a.duration_seconds || null;
        row.rep_talk_pct = a.rep_talk_pct || null;
        row.client_talk_pct = a.client_talk_pct || null;
        row.call_outcome = a.outcome || null;
      } else if (a.type === 'EMAIL') {
        row.subject = a.subject || null;
        row.snippet = (a.body || '').substring(0, 200) || null;
      } else if (a.type === 'MEETING') {
        row.title = a.title || null;
        row.duration_seconds = a.duration_seconds || null;
        row.attendee_contact_ids = a.attendee_contact_ids
          ? a.attendee_contact_ids.map((cid: string) => idMap[cid] || cid)
          : null;
      }
      return row;
    })
    .filter(Boolean);

  if (activityRows.length > 0) {
    // Insert in batches of 50 to avoid payload limits
    for (let i = 0; i < activityRows.length; i += 50) {
      const batch = activityRows.slice(i, i + 50);
      const { error } = await supabase.from('crm_activities').insert(batch);
      if (error) {
        console.error(`   ❌ crm_activities batch ${Math.floor(i / 50) + 1}: ${error.message}`);
      } else {
        console.log(`   ✅ Inserted activities ${i + 1}–${Math.min(i + 50, activityRows.length)}`);
      }
    }
    console.log(`   📊 Total activities: ${activityRows.length}`);
  }

  console.log('\n✅ Supabase seed complete!');
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
