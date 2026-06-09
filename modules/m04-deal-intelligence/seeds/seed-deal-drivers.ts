/**
 * scripts/seed-deal-drivers.ts
 * Seed script for Deal Drivers test data.
 *
 * Creates:
 *   - 1 deal board with all 6 default warnings enabled
 *   - 1 manager user
 *   - 5 sales reps (direct reports of that manager)
 *   - ~30 deals distributed across the reps
 *   - deal_lifecycle rows tying deals to board + rep
 *   - deal_warning_events with realistic ACTIVE/RESOLVED patterns
 *     so the matrix shows non-trivial percentages
 *
 * Usage:
 *   npx ts-node scripts/seed-deal-drivers.ts
 *
 * Requires DATABASE_URL in environment (or .env).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL env var is not set.');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Seed data definitions ────────────────────────────────────────────────────

const CRM_STAGES = [
  'Discovery',
  'Qualification',
  'Demo done',
  'Proposal sent',
  'Negotiation',
  'Verbal commit',
];

const ACCOUNT_NAMES = [
  'Meridian Health',
  'Stonebridge Capital',
  'Apex Technologies',
  'Lumina Retail Group',
  'Castleford Logistics',
  'NorthStar Pharma',
  'Greenfield Ventures',
  'Tidal Energy Co',
  'Beacon Analytics',
  'Fulcrum Systems',
  'Ironclad Security',
  'Prism Data Labs',
  'Atlas Consulting',
  'Summit Partners',
  'Harbor Financial',
  'Redwood Biotech',
  'Nexus Dynamics',
  'Clearwater Corp',
  'Vantage Growth',
  'Pinnacle Solutions',
  'Delta Logistics',
  'Crestview Capital',
  'Evergreen Systems',
  'Solaris Networks',
  'BlueWave Analytics',
  'TerraFirm Holdings',
  'Cascade Ventures',
  'Keystone Medical',
  'Horizon Tech',
  'Bridgeway Finance',
];

const REP_PROFILES = [
  { name: 'James Okafor',  segment: 'Mid-market AE', warningRate: 0.75 }, // high-risk rep
  { name: 'Priya Sharma',  segment: 'Mid-market AE', warningRate: 0.60 },
  { name: 'Leo Nguyen',    segment: 'SMB AE',         warningRate: 0.45 },
  { name: 'Anika Patel',   segment: 'Mid-market AE', warningRate: 0.20 },
  { name: 'Dana Mills',    segment: 'SMB AE',         warningRate: 0.15 },
];

// Warning keys that must exist in deal_warning_definitions (seeded by migration 007)
const WARNING_KEYS = [
  'no_next_step',
  'single_threaded',
  'no_close_plan',
  'stale_14d',
  'no_discovery',
  'champion_left',
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to database.');

  try {
    await client.query('BEGIN');

    // ── 1. Fetch warning definition IDs ──────────────────────────────────────
    const { rows: warnRows } = await client.query(
      `SELECT id, key FROM deal_warning_definitions WHERE key = ANY($1::text[])`,
      [WARNING_KEYS],
    );
    if (warnRows.length === 0) {
      throw new Error('No warning definitions found — run migration 007 first.');
    }
    const warningMap = new Map<string, string>(warnRows.map((r) => [r.key, r.id]));
    console.log(`Found ${warnRows.length} warning definitions.`);

    // ── 2. Create manager user ────────────────────────────────────────────────
    const resUser = await client.query(
      `INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, 'Sarah Chen', 'sarah.chen@acme.com', '$2b$10$hCS0Ahl8qK0BXhAbrq2rLuR0xAXr769sGFvEFNIo8kcHHmHyj.Hwu', 'sales_manager', TRUE, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [uuidv4()],
    );
    const managerId = resUser.rows[0].id;
    console.log(`Manager created: Sarah Chen (${managerId})`);

    // ── 3. Create board ───────────────────────────────────────────────────────
    const boardId = uuidv4();
    await client.query(
      `INSERT INTO boards (id, name, description, owner_id, created_at, updated_at)
       VALUES ($1, 'Early Stage Pipeline', 'Top-of-funnel deals for Q3', $2, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [boardId, managerId],
    );
    console.log(`Board created: Early Stage Pipeline (${boardId})`);

    // ── 4. Attach all warnings to board ──────────────────────────────────────
    for (let i = 0; i < warnRows.length; i++) {
      const configId = uuidv4();
      await client.query(
        `INSERT INTO board_warning_config (id, board_id, warning_id, sort_order, is_enabled)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (board_id, warning_id) DO UPDATE SET sort_order = EXCLUDED.sort_order, is_enabled = TRUE`,
        [configId, boardId, warnRows[i].id, i + 1],
      );
    }
    console.log(`Attached ${warnRows.length} warnings to board.`);

    // ── 5. Create reps ────────────────────────────────────────────────────────
    const repIds: string[] = [];
    for (const profile of REP_PROFILES) {
      const email = profile.name.toLowerCase().replace(' ', '.') + '@acme.com';
      const resRep = await client.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, manager_id, segment, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, '$2b$10$hCS0Ahl8qK0BXhAbrq2rLuR0xAXr769sGFvEFNIo8kcHHmHyj.Hwu', 'sales_rep', $4, $5, TRUE, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
           SET full_name = EXCLUDED.full_name, manager_id = EXCLUDED.manager_id,
               segment = EXCLUDED.segment, is_active = TRUE, password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [uuidv4(), profile.name, email, managerId, profile.segment],
      );
      const repId = resRep.rows[0].id;
      repIds.push(repId);
    }
    console.log(`Created ${REP_PROFILES.length} reps.`);

    // ── 6. Create deals + lifecycle rows ─────────────────────────────────────
    const dealCounts = [12, 9, 15, 11, 7]; // match wireframe counts
    const allDealIds: Array<{ dealId: string; repId: string; repIdx: number }> = [];

    for (let r = 0; r < repIds.length; r++) {
      const repId = repIds[r];
      const count = dealCounts[r];

      for (let d = 0; d < count; d++) {
        const dealId       = uuidv4();
        const lifecycleId  = uuidv4();
        const accountName  = ACCOUNT_NAMES[(r * 6 + d) % ACCOUNT_NAMES.length];
        const amount       = randomInt(25_000, 350_000);
        const stage        = randomPick(CRM_STAGES);
        const openedAt     = daysAgo(randomInt(5, 90));
        const closeDate    = daysFromNow(randomInt(10, 120));

        await client.query(
          `INSERT INTO deals (id, account_name, owner_id, board_id, value, stage, estimated_close_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [dealId, accountName, repId, boardId, amount, stage, closeDate],
        );

        await client.query(
          `INSERT INTO deal_lifecycle (id, deal_id, rep_id, board_id, opened_at, closed_at)
           VALUES ($1, $2, $3, $4, $5, NULL)
           ON CONFLICT DO NOTHING`,
          [lifecycleId, dealId, repId, boardId, openedAt],
        );

        allDealIds.push({ dealId, repId, repIdx: r });
      }
    }
    console.log(`Created ${allDealIds.length} deals with lifecycle rows.`);

    // ── 7. Generate warning events ────────────────────────────────────────────
    //
    // Strategy per rep profile:
    //   - For each deal, iterate over each warning
    //   - Use a deal-level random draw weighted by (repWarningRate × warningWeight)
    //   - If flagged: insert ACTIVE event 2-60 days ago
    //   - Add a RESOLVED event 20% of the time (so the deal sometimes clears)
    //
    const WARNING_WEIGHTS: Record<string, number> = {
      no_next_step:   1.0,
      single_threaded: 0.7,
      no_close_plan:   0.9,
      stale_14d:       0.6,
      no_discovery:    0.05,  // nearly never
      champion_left:   0.2,
    };

    let eventCount = 0;
    for (const { dealId, repIdx } of allDealIds) {
      const profile     = REP_PROFILES[repIdx];
      const baseRate    = profile.warningRate;

      for (const [key, warningId] of warningMap.entries()) {
        const weight = WARNING_WEIGHTS[key] ?? 0.5;
        const roll   = Math.random();

        if (roll < baseRate * weight) {
          const activeAt   = daysAgo(randomInt(2, 45));
          const eventId    = uuidv4();

          await client.query(
            `INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at)
             VALUES ($1, $2, $3, 'ACTIVE', $4)
             ON CONFLICT DO NOTHING`,
            [eventId, dealId, warningId, activeAt],
          );
          eventCount++;

          // 20% chance of a RESOLVED event > 1 day after activation
          if (Math.random() < 0.2) {
            const resolvedAt = new Date(activeAt.getTime() + randomInt(25, 72) * 3_600_000);
            if (resolvedAt <= new Date()) {
              const resolvedId = uuidv4();
              await client.query(
                `INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at)
                 VALUES ($1, $2, $3, 'RESOLVED', $4)
                 ON CONFLICT DO NOTHING`,
                [resolvedId, dealId, warningId, resolvedAt],
              );
              eventCount++;
            }
          }
        }
      }
    }
    console.log(`Generated ${eventCount} warning events.`);

    // ── 8. Set last-used board for manager ────────────────────────────────────
    await client.query(
      `INSERT INTO user_last_used_board (user_id, board_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET board_id = $2, updated_at = NOW()`,
      [managerId, boardId],
    );

    await client.query('COMMIT');
    console.log('\n✅ Seed complete.');
    console.log(`   Manager ID : ${managerId}`);
    console.log(`   Board ID   : ${boardId}`);
    console.log(`   Reps       : ${repIds.join(', ')}`);
    console.log('\nUse these IDs to test the Deal Drivers API endpoints.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
