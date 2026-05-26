/**
 * Seed for the unified @rri/database schema (the one apps/api / modules use).
 *
 * Creates a tenant + a few users + 1 account/deal + 1 call/transcript so
 * smoke tests against the running NestJS API can verify list/get/create
 * endpoints across modules.
 */
const path = require('path');
const generated = require(path.resolve(
  __dirname,
  '..',
  '..',
  'r-revenue-intelligence-monorepo',
  'boilerplate code',
  'r-revenue-intelligence',
  'packages',
  'database',
  'node_modules',
  '.prisma',
  'client',
));
const PrismaClient = generated.PrismaClient;

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ADMIN = 'cu11111111admin11111';
const USER_MANAGER = 'cu22222222manager22';
const USER_REP = 'cu33333333rep333333';
const ACCOUNT_ID = 'ca0000000000acme01';
const DEAL_ID = 'cd0000000000acme01';
const CALL_ID = 'cl0000000000acme01';
const TRANSCRIPT_ID = 'tr0000000000acme01';
const NOTE_ID = 'cn0000000000acme01';

const prisma = new PrismaClient();

async function safe(label, fn) {
  try {
    await fn();
    console.log(`  + ${label}`);
  } catch (err) {
    if (/Unique constraint|P2002|already exists/i.test(String(err.message))) {
      console.log(`  = ${label} (exists) :: ${err.message.split('\n')[0]}`);
    } else {
      console.error(`  ! ${label}:`, err.message);
    }
  }
}

(async () => {
  console.log('== Seeding @rri/database schema ==');

  await safe('tenant', () =>
    prisma.tenant.upsert({
      where: { id: TENANT_ID },
      update: {},
      create: { id: TENANT_ID, name: 'Demo Tenant', slug: 'demo-tenant' },
    }),
  );

  const AT = String.fromCharCode(64);
  const DOMAIN = `demo${String.fromCharCode(46)}local`;
  const mk = (name) => `${name}${AT}${DOMAIN}`;
  for (const u of [
    { id: USER_ADMIN, email: mk('admin'), name: 'Demo Admin', role: 'ADMIN' },
    { id: USER_MANAGER, email: mk('manager'), name: 'Demo Manager', role: 'MANAGER' },
    { id: USER_REP, email: mk('rep'), name: 'Demo Rep', role: 'SALES_REP' },
  ]) {
    await safe(`user:${u.role}`, async () => {
      try {
        await prisma.user.upsert({
          where: { tenantId_email: { tenantId: TENANT_ID, email: u.email } },
          update: { name: u.name, role: u.role },
          create: {
            id: u.id,
            tenantId: TENANT_ID,
            email: u.email,
            name: u.name,
            role: u.role,
            passwordHash: 'noop',
          },
        });
      } catch (err) {
        // Fallback for older clients where the compound key alias differs
        await prisma.user.create({
          data: {
            id: u.id,
            tenantId: TENANT_ID,
            email: u.email,
            name: u.name,
            role: u.role,
            passwordHash: 'noop',
          },
        });
      }
    });
  }

  await safe('account', () =>
    prisma.account.upsert({
      where: { id: ACCOUNT_ID },
      update: {},
      create: {
        id: ACCOUNT_ID,
        tenantId: TENANT_ID,
        name: 'Acme Corp',
        industry: 'Software',
        ownerName: 'Demo Rep',
      },
    }),
  );

  await safe('deal', () =>
    prisma.deal.upsert({
      where: { id: DEAL_ID },
      update: {},
      create: {
        id: DEAL_ID,
        tenantId: TENANT_ID,
        accountId: ACCOUNT_ID,
        ownerId: USER_REP,
        name: 'Acme Corp - Q1 Expansion',
        amount: 75000,
        stage: 'Negotiation',
        quarter: 'Q1-2026',
        closeDate: new Date('2026-03-15'),
        isWon: false,
        confidenceScore: 70,
        riskScore: 40,
        riskLabel: 'medium',
        riskFlags: ['pricing_objection'],
      },
    }),
  );

  await safe('call_record', () =>
    prisma.callRecord.upsert({
      where: { id: CALL_ID },
      update: {},
      create: {
        id: CALL_ID,
        tenantId: TENANT_ID,
        title: 'Discovery Call with Acme',
        callDate: new Date('2026-02-14T10:00:00Z'),
        durationSeconds: 1820,
        callType: 'meeting',
        callSource: 'manual',
        participants: ['Demo Rep', 'Jane Buyer'],
        callOwner: USER_REP,
        accountId: ACCOUNT_ID,
        opportunityId: DEAL_ID,
        audioUrl: 'http://127.0.0.1:3001/uploads/audio/demo.mp3',
        transcriptStatus: 'completed',
      },
    }),
  );

  await safe('transcript', () =>
    prisma.transcript.upsert({
      where: { id: TRANSCRIPT_ID },
      update: {},
      create: {
        id: TRANSCRIPT_ID,
        tenantId: TENANT_ID,
        callId: CALL_ID,
        fullText:
          'Hello Jane, thanks for taking the time today. Let me walk you through how Revenue Intelligence can help forecast more accurately. We also have a pricing question that we should cover before the close date.',
        summary: 'Discovery call focused on forecasting + pricing.',
        keyHighlights: [
          { label: 'pricing', text: 'too expensive for our budget', timestampMs: 45000 },
          { label: 'forecast', text: 'forecast accuracy is the top priority', timestampMs: 90000 },
        ],
        nextSteps: ['Send proposal by Friday', 'Schedule technical deep-dive'],
        talkRatio: { rep: { speakerLabel: 'A', percentage: 0.55 }, customer: { speakerLabel: 'B', percentage: 0.45 } },
      },
    }),
  );

  for (const u of [
    {
      id: 'ut000000000utter1',
      seq: 0,
      speaker: 'Rep',
      text: 'Hello Jane, thanks for taking the time today.',
      startMs: 0,
      endMs: 3500,
      confidence: 0.95,
    },
    {
      id: 'ut000000000utter2',
      seq: 1,
      speaker: 'Customer',
      text: 'I think this might be too expensive for our budget.',
      startMs: 42000,
      endMs: 47000,
      confidence: 0.78,
      isLowConfidence: true,
    },
  ]) {
    await safe(`utterance:${u.seq}`, () =>
      prisma.utterance.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          transcriptId: TRANSCRIPT_ID,
          tenantId: TENANT_ID,
          speaker: u.speaker,
          text: u.text,
          startMs: u.startMs,
          endMs: u.endMs,
          confidence: u.confidence,
          isLowConfidence: !!u.isLowConfidence,
          sequenceIndex: u.seq,
        },
      }),
    );
  }

  await safe('call_note', () =>
    prisma.callNote.upsert({
      where: { id: NOTE_ID },
      update: {},
      create: {
        id: NOTE_ID,
        tenantId: TENANT_ID,
        callId: CALL_ID,
        authorId: USER_REP,
        content: 'Pricing objection raised at 45s — need to follow up with discount proposal.',
      },
    }),
  );

  await safe('audit_log', () =>
    prisma.auditLog.upsert({
      where: { id: 'al000000000aud1' },
      update: {},
      create: {
        id: 'al000000000aud1',
        tenantId: TENANT_ID,
        actorId: USER_ADMIN,
        actorType: 'user',
        action: 'transcription.completed',
        entityType: 'CallRecord',
        entityId: CALL_ID,
        meta: { source: 'rri-seed' },
      },
    }),
  );

  await safe('integration', () =>
    prisma.integration.upsert({
      where: { tenantId_provider: { tenantId: TENANT_ID, provider: 'hubspot' } },
      update: {},
      create: {
        id: 'in000000000hubspot1',
        tenantId: TENANT_ID,
        provider: 'hubspot',
        status: 'disconnected',
        scopes: [],
      },
    }),
  );

  const tables = [
    'Tenant',
    'User',
    'Account',
    'Deal',
    'call_records',
    'transcripts',
    'utterances',
    'call_notes',
    'audit_logs',
    'integrations',
  ];
  const counts = {};
  for (const t of tables) {
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "public"."${t}"`);
      counts[t] = rows[0]?.c ?? 0;
    } catch (err) {
      counts[t] = `ERR ${err.message.slice(0, 40)}`;
    }
  }
  console.log('\nRow counts:');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(18)} ${v}`);
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('Seed failed', e);
  await prisma.$disconnect();
  process.exit(1);
});
