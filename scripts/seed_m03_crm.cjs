/**
 * Seed Account + Deal rows for M03 Smart Summaries (demo tenant).
 * Run when m03-api has not been restarted yet (POST /test/seed-crm returns 404).
 *
 *   $env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
 *   node scripts/seed_m03_crm.cjs
 */
const { PrismaClient } = require('../packages/database');

const TENANT = '00000000-0000-0000-0000-000000000001';

async function main() {
  const prisma = new PrismaClient();
  const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`;

  const tenantSlug = `rri-demo-${TENANT.slice(0, 8)}`;
  let tenant = await prisma.tenant.findUnique({ where: { id: TENANT } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { id: TENANT, name: 'Demo Tenant', slug: tenantSlug },
    });
  }

  await prisma.account.upsert({
    where: { id: 'm03-seed-acct-modus' },
    create: {
      id: 'm03-seed-acct-modus',
      tenantId: TENANT,
      name: 'Moduslink',
      industry: 'Technology',
      ownerName: 'Demo Rep',
    },
    update: { name: 'Moduslink', industry: 'Technology' },
  });
  await prisma.account.upsert({
    where: { id: 'm03-seed-acct-acme' },
    create: {
      id: 'm03-seed-acct-acme',
      tenantId: TENANT,
      name: 'Acme Corp',
      industry: 'Manufacturing',
      ownerName: 'Demo Rep',
    },
    update: { name: 'Acme Corp' },
  });

  await prisma.deal.upsert({
    where: { id: 'm03-seed-deal-modus' },
    create: {
      id: 'm03-seed-deal-modus',
      tenantId: TENANT,
      accountId: 'm03-seed-acct-modus',
      name: 'Moduslink Expansion',
      amount: 125000,
      stage: 'Negotiation',
      quarter,
    },
    update: { stage: 'Negotiation', accountId: 'm03-seed-acct-modus' },
  });
  await prisma.deal.upsert({
    where: { id: 'm03-seed-deal-acme' },
    create: {
      id: 'm03-seed-deal-acme',
      tenantId: TENANT,
      accountId: 'm03-seed-acct-acme',
      name: 'Acme Platform Renewal',
      amount: 85000,
      stage: 'Proposal',
      quarter,
    },
    update: { stage: 'Proposal', accountId: 'm03-seed-acct-acme' },
  });

  const calls = await prisma.callRecord.findMany({
    where: { tenantId: TENANT },
    orderBy: { callDate: 'desc' },
    take: 20,
  });

  let linked = 0;
  for (const call of calls) {
    const isModus = (call.title || '').toLowerCase().includes('modus');
    await prisma.callRecord.update({
      where: { id: call.id },
      data: {
        accountId: isModus ? 'm03-seed-acct-modus' : 'm03-seed-acct-acme',
        opportunityId: isModus ? 'm03-seed-deal-modus' : 'm03-seed-deal-acme',
        participants: call.participants?.length
          ? call.participants
          : ['Demo Rep', 'Buyer Contact'],
      },
    });
    linked += 1;
  }

  const [accounts, deals, callCount] = await Promise.all([
    prisma.account.count({ where: { tenantId: TENANT } }),
    prisma.deal.count({ where: { tenantId: TENANT } }),
    prisma.callRecord.count({ where: { tenantId: TENANT } }),
  ]);

  console.log(
    JSON.stringify(
      {
        success: true,
        tenantId: TENANT,
        accounts,
        deals,
        call_records: callCount,
        callsLinked: linked,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
