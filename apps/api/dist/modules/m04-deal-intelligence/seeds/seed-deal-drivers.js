"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
}
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}
function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
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
    { name: 'James Okafor', segment: 'Mid-market AE', warningRate: 0.75 },
    { name: 'Priya Sharma', segment: 'Mid-market AE', warningRate: 0.60 },
    { name: 'Leo Nguyen', segment: 'SMB AE', warningRate: 0.45 },
    { name: 'Anika Patel', segment: 'Mid-market AE', warningRate: 0.20 },
    { name: 'Dana Mills', segment: 'SMB AE', warningRate: 0.15 },
];
const WARNING_KEYS = [
    'no_next_step',
    'single_threaded',
    'no_close_plan',
    'stale_14d',
    'no_discovery',
    'champion_left',
];
async function main() {
    const client = new pg_1.Client({ connectionString: DATABASE_URL });
    await client.connect();
    console.log('Connected to database.');
    try {
        await client.query('BEGIN');
        const { rows: warnRows } = await client.query(`SELECT id, key FROM deal_warning_definitions WHERE key = ANY($1::text[])`, [WARNING_KEYS]);
        if (warnRows.length === 0) {
            throw new Error('No warning definitions found — run migration 007 first.');
        }
        const warningMap = new Map(warnRows.map((r) => [r.key, r.id]));
        console.log(`Found ${warnRows.length} warning definitions.`);
        const resUser = await client.query(`INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, 'Sarah Chen', 'sarah.chen@acme.com', '$2b$10$hCS0Ahl8qK0BXhAbrq2rLuR0xAXr769sGFvEFNIo8kcHHmHyj.Hwu', 'sales_manager', TRUE, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash
       RETURNING id`, [(0, uuid_1.v4)()]);
        const managerId = resUser.rows[0].id;
        console.log(`Manager created: Sarah Chen (${managerId})`);
        const boardId = (0, uuid_1.v4)();
        await client.query(`INSERT INTO boards (id, name, description, owner_id, created_at, updated_at)
       VALUES ($1, 'Early Stage Pipeline', 'Top-of-funnel deals for Q3', $2, NOW(), NOW())
       ON CONFLICT DO NOTHING`, [boardId, managerId]);
        console.log(`Board created: Early Stage Pipeline (${boardId})`);
        for (let i = 0; i < warnRows.length; i++) {
            const configId = (0, uuid_1.v4)();
            await client.query(`INSERT INTO board_warning_config (id, board_id, warning_id, sort_order, is_enabled)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (board_id, warning_id) DO UPDATE SET sort_order = EXCLUDED.sort_order, is_enabled = TRUE`, [configId, boardId, warnRows[i].id, i + 1]);
        }
        console.log(`Attached ${warnRows.length} warnings to board.`);
        const repIds = [];
        for (const profile of REP_PROFILES) {
            const email = profile.name.toLowerCase().replace(' ', '.') + '@acme.com';
            const resRep = await client.query(`INSERT INTO users (id, full_name, email, password_hash, role, manager_id, segment, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, '$2b$10$hCS0Ahl8qK0BXhAbrq2rLuR0xAXr769sGFvEFNIo8kcHHmHyj.Hwu', 'sales_rep', $4, $5, TRUE, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
           SET full_name = EXCLUDED.full_name, manager_id = EXCLUDED.manager_id,
               segment = EXCLUDED.segment, is_active = TRUE, password_hash = EXCLUDED.password_hash
         RETURNING id`, [(0, uuid_1.v4)(), profile.name, email, managerId, profile.segment]);
            const repId = resRep.rows[0].id;
            repIds.push(repId);
        }
        console.log(`Created ${REP_PROFILES.length} reps.`);
        const dealCounts = [12, 9, 15, 11, 7];
        const allDealIds = [];
        for (let r = 0; r < repIds.length; r++) {
            const repId = repIds[r];
            const count = dealCounts[r];
            for (let d = 0; d < count; d++) {
                const dealId = (0, uuid_1.v4)();
                const lifecycleId = (0, uuid_1.v4)();
                const accountName = ACCOUNT_NAMES[(r * 6 + d) % ACCOUNT_NAMES.length];
                const amount = randomInt(25_000, 350_000);
                const stage = randomPick(CRM_STAGES);
                const openedAt = daysAgo(randomInt(5, 90));
                const closeDate = daysFromNow(randomInt(10, 120));
                await client.query(`INSERT INTO deals (id, account_name, owner_id, board_id, value, stage, estimated_close_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT DO NOTHING`, [dealId, accountName, repId, boardId, amount, stage, closeDate]);
                await client.query(`INSERT INTO deal_lifecycle (id, deal_id, rep_id, board_id, opened_at, closed_at)
           VALUES ($1, $2, $3, $4, $5, NULL)
           ON CONFLICT DO NOTHING`, [lifecycleId, dealId, repId, boardId, openedAt]);
                allDealIds.push({ dealId, repId, repIdx: r });
            }
        }
        console.log(`Created ${allDealIds.length} deals with lifecycle rows.`);
        const WARNING_WEIGHTS = {
            no_next_step: 1.0,
            single_threaded: 0.7,
            no_close_plan: 0.9,
            stale_14d: 0.6,
            no_discovery: 0.05,
            champion_left: 0.2,
        };
        let eventCount = 0;
        for (const { dealId, repIdx } of allDealIds) {
            const profile = REP_PROFILES[repIdx];
            const baseRate = profile.warningRate;
            for (const [key, warningId] of warningMap.entries()) {
                const weight = WARNING_WEIGHTS[key] ?? 0.5;
                const roll = Math.random();
                if (roll < baseRate * weight) {
                    const activeAt = daysAgo(randomInt(2, 45));
                    const eventId = (0, uuid_1.v4)();
                    await client.query(`INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at)
             VALUES ($1, $2, $3, 'ACTIVE', $4)
             ON CONFLICT DO NOTHING`, [eventId, dealId, warningId, activeAt]);
                    eventCount++;
                    if (Math.random() < 0.2) {
                        const resolvedAt = new Date(activeAt.getTime() + randomInt(25, 72) * 3_600_000);
                        if (resolvedAt <= new Date()) {
                            const resolvedId = (0, uuid_1.v4)();
                            await client.query(`INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at)
                 VALUES ($1, $2, $3, 'RESOLVED', $4)
                 ON CONFLICT DO NOTHING`, [resolvedId, dealId, warningId, resolvedAt]);
                            eventCount++;
                        }
                    }
                }
            }
        }
        console.log(`Generated ${eventCount} warning events.`);
        await client.query(`INSERT INTO user_last_used_board (user_id, board_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET board_id = $2, updated_at = NOW()`, [managerId, boardId]);
        await client.query('COMMIT');
        console.log('\n✅ Seed complete.');
        console.log(`   Manager ID : ${managerId}`);
        console.log(`   Board ID   : ${boardId}`);
        console.log(`   Reps       : ${repIds.join(', ')}`);
        console.log('\nUse these IDs to test the Deal Drivers API endpoints.');
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed failed, rolled back:', err);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
main();
//# sourceMappingURL=seed-deal-drivers.js.map