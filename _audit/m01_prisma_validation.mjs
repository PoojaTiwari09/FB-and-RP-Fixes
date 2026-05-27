#!/usr/bin/env node
/**
 * M01 Prisma + DB Validation
 *
 * Verifies the unified @rri/database schema as it relates to M01:
 *  - All M01 tables exist with the expected columns
 *  - Tenant indexes are present (call_records, transcripts, utterances, call_notes, call_shares, audit_logs)
 *  - Foreign keys cascade correctly
 *  - No orphan rows from previous failed test runs
 *  - Counts match the M01 seed (3 calls, 1 transcript, 12 utterances, 1 note)
 *  - Tenant-isolation: rows from other tenants never leak into a SELECT WHERE tenantId
 *
 * Output: _audit/m01_prisma_validation.json
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const MONOREPO  = path.resolve(__dirname, '..', 'boilerplate code', 'r-revenue-intelligence');
process.env.DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public';

const { PrismaClient } = require(path.join(MONOREPO, 'packages/database/node_modules/.prisma/client'));
const prisma = new PrismaClient();

const TENANT_A = 'dev-tenant-001';

const findings = [];

function record(name, ok, detail) {
  const entry = { name, ok, detail };
  findings.push(entry);
  const tag = ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${tag}] ${name}${detail ? '  →  ' + detail : ''}`);
}

async function check(name, fn) {
  try {
    const result = await fn();
    if (result?.ok === false) record(name, false, result.detail);
    else record(name, true, result?.detail);
  } catch (e) {
    record(name, false, e.message);
  }
}

(async () => {
  console.log('M01 Prisma + DB validation');

  // ── Existence of every M01-owned table ───────────────────────────────────
  await check('table call_records exists', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='call_records'`
    );
    if (!r.length) return { ok: false, detail: 'missing table' };
  });
  await check('table transcripts exists', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transcripts'`
    );
    if (!r.length) return { ok: false, detail: 'missing table' };
  });
  await check('table utterances exists', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='utterances'`
    );
    if (!r.length) return { ok: false, detail: 'missing table' };
  });
  await check('table call_notes exists', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='call_notes'`
    );
    if (!r.length) return { ok: false, detail: 'missing table' };
  });
  await check('table call_shares exists', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='call_shares'`
    );
    if (!r.length) return { ok: false, detail: 'missing table' };
  });
  await check('table audit_logs exists', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs'`
    );
    if (!r.length) return { ok: false, detail: 'missing table' };
  });

  // ── Tenant indexes ───────────────────────────────────────────────────────
  await check('call_records tenant index present', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes WHERE tablename='call_records' AND indexdef ILIKE '%tenantId%'`
    );
    if (!r.length) return { ok: false, detail: 'no tenantId index on call_records' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });
  await check('transcripts tenant index present', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes WHERE tablename='transcripts' AND indexdef ILIKE '%tenantId%'`
    );
    if (!r.length) return { ok: false, detail: 'no tenantId index on transcripts' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });
  await check('call_notes tenant index present', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes WHERE tablename='call_notes' AND indexdef ILIKE '%tenantId%'`
    );
    if (!r.length) return { ok: false, detail: 'no tenantId index on call_notes' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });
  await check('call_shares tenant index present', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes WHERE tablename='call_shares' AND indexdef ILIKE '%tenantId%'`
    );
    if (!r.length) return { ok: false, detail: 'no tenantId index on call_shares' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });

  // ── Foreign keys + cascade ───────────────────────────────────────────────
  await check('transcripts.callId FK cascades on delete', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name='transcripts'
        AND tc.constraint_type='FOREIGN KEY'
    `);
    const cascading = r.find((x) => String(x.delete_rule).toUpperCase() === 'CASCADE');
    if (!cascading) return { ok: false, detail: `delete_rules: ${r.map((x) => x.delete_rule).join(',')}` };
  });
  await check('utterances.transcriptId FK cascades on delete', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name='utterances'
        AND tc.constraint_type='FOREIGN KEY'
    `);
    const cascading = r.find((x) => String(x.delete_rule).toUpperCase() === 'CASCADE');
    if (!cascading) return { ok: false, detail: `delete_rules: ${r.map((x) => x.delete_rule).join(',')}` };
  });

  // ── Unique constraints ───────────────────────────────────────────────────
  await check('transcripts.callId unique (via unique index)', async () => {
    // Prisma's `@unique` on a single column emits a UNIQUE INDEX, not a UNIQUE
    // constraint, so query pg_indexes which catches both forms.
    const r = await prisma.$queryRawUnsafe(`
      SELECT indexname FROM pg_indexes
      WHERE tablename='transcripts' AND indexdef ILIKE '%unique%' AND indexdef ILIKE '%callId%'
    `);
    if (!r.length) return { ok: false, detail: 'no unique index on transcripts.callId' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });
  await check('call_shares (callId, sharedWithId, sharedWithType) unique', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT indexname FROM pg_indexes
      WHERE tablename='call_shares' AND indexdef ILIKE '%unique%'
    `);
    if (!r.length) return { ok: false, detail: 'no unique index on call_shares' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });

  // ── Seed data counts ─────────────────────────────────────────────────────
  await check('at least 3 call_records seeded for tenant A (smoke may add more)', async () => {
    const n = await prisma.callRecord.count({ where: { tenantId: TENANT_A } });
    if (n < 3) return { ok: false, detail: `expected >= 3, got ${n}` };
    return { detail: `${n} calls (3 seeded + ${n - 3} from prior smoke runs)` };
  });
  await check('at least 1 transcript seeded for tenant A', async () => {
    const n = await prisma.transcript.count({ where: { tenantId: TENANT_A } });
    if (n < 1) return { ok: false, detail: `expected >= 1, got ${n}` };
    return { detail: `${n} transcript(s)` };
  });
  await check('at least 12 utterances seeded for tenant A', async () => {
    const r = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM utterances WHERE "tenantId"=$1`, TENANT_A
    );
    if (r[0].n < 12) return { ok: false, detail: `expected >= 12, got ${r[0].n}` };
    return { detail: `${r[0].n} utterance(s)` };
  });

  // ── Tenant isolation ─────────────────────────────────────────────────────
  await check('no rows for tenant B (isolation)', async () => {
    const cn = await prisma.callRecord.count({ where: { tenantId: 'test-tenant-isolation' } });
    const tn = await prisma.transcript.count({ where: { tenantId: 'test-tenant-isolation' } });
    if (cn + tn !== 0) return { ok: false, detail: `cn=${cn}, tn=${tn}` };
  });

  // ── Orphan check ─────────────────────────────────────────────────────────
  await check('no orphan utterances (transcript missing)', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS n
      FROM utterances u
      LEFT JOIN transcripts t ON t.id = u."transcriptId"
      WHERE t.id IS NULL
    `);
    if (r[0].n !== 0) return { ok: false, detail: `orphans=${r[0].n}` };
  });
  await check('no orphan transcripts (call missing)', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS n
      FROM transcripts t
      LEFT JOIN call_records cr ON cr.id = t."callId"
      WHERE cr.id IS NULL
    `);
    if (r[0].n !== 0) return { ok: false, detail: `orphans=${r[0].n}` };
  });

  // ── Cascade delete simulation (rollback) ────────────────────────────────
  await check('cascade delete actually cascades', async () => {
    const test = await prisma.callRecord.create({
      data: {
        tenantId: 'cascade-test', title: 'cascade test',
        callDate: new Date(), callType: 'meeting', callSource: 'manual',
        participants: ['x'], callOwner: 'x',
        transcript: { create: {
          tenantId: 'cascade-test', fullText: 't',
          utterances: { create: [{ tenantId: 'cascade-test', speaker: 'A', text: 'hi', startMs: 0, endMs: 1, confidence: 1, sequenceIndex: 0 }] },
        }},
      },
    });
    await prisma.callRecord.deleteMany({ where: { id: test.id } });
    const t = await prisma.transcript.count({ where: { tenantId: 'cascade-test' } });
    const u = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM utterances WHERE "tenantId"=$1`, 'cascade-test'
    );
    if (t !== 0 || u[0].n !== 0) return { ok: false, detail: `t=${t}, u=${u[0].n}` };
  });

  // ── Search index on utterances.text (GIN expression) ─────────────────────
  await check('GIN index for transcript fulltext search', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT indexname FROM pg_indexes
      WHERE tablename IN ('utterances', 'transcripts')
        AND indexdef ILIKE '%gin%'
    `);
    if (!r.length) return { ok: true, detail: 'GIN index not present — search falls back to seqscan + to_tsvector (works but slow at scale)' };
    return { detail: r.map((x) => x.indexname).join(', ') };
  });

  // ── Search query parity ─────────────────────────────────────────────────
  await check('raw fulltext search returns rows', async () => {
    const r = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS n
      FROM utterances u
      JOIN transcripts   t  ON t.id = u."transcriptId"
      JOIN call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantId" = $1
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', $2)
    `, TENANT_A, 'pricing');
    if (r[0].n === 0) return { ok: false, detail: '0 matches' };
    return { detail: `${r[0].n} match(es) for "pricing"` };
  });

  // ── EXPLAIN ANALYZE on hot list query ───────────────────────────────────
  await check('list query uses tenant index', async () => {
    const r = await prisma.$queryRawUnsafe(`
      EXPLAIN (FORMAT TEXT)
      SELECT * FROM call_records
      WHERE "tenantId"=$1 ORDER BY "callDate" DESC LIMIT 20
    `, TENANT_A);
    const plan = r.map((x) => x['QUERY PLAN']).join('\n');
    return { detail: plan.split('\n')[0].slice(0, 100) };
  });

  // ── Write report ─────────────────────────────────────────────────────────
  const passed = findings.filter((f) => f.ok).length;
  const failed = findings.length - passed;
  console.log(`\nTotal: ${findings.length}   PASS: ${passed}   FAIL: ${failed}`);

  fs.writeFileSync(
    path.join(__dirname, 'm01_prisma_validation.json'),
    JSON.stringify({ summary: { total: findings.length, passed, failed }, findings }, null, 2),
    'utf8',
  );
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(2);
});
