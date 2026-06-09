/**
 * Seed M10 Revenue Graph + Data Cloud for demo tenant.
 *
 *   $env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
 *   node scripts/seed_m10_demo.cjs
 *
 * Or: POST http://localhost:4011/api/v1/m10-data-compliance/test/seed
 */
const { PrismaClient } = require('../packages/database');

const TENANT = '00000000-0000-0000-0000-000000000001';

const IDS = {
  acctAcme: '11111111-1111-1111-1111-111111111111',
  acctGlobex: '22222222-2222-2222-2222-222222222222',
  acctInitech: '33333333-3333-3333-3333-333333333333',
  dealAcmeRenewal: 'd1111111-1111-1111-1111-111111111111',
  dealGlobex: 'd2222222-2222-2222-2222-222222222222',
  dealInitech: 'd3333333-3333-3333-3333-333333333333',
  dealAcmeAddon: 'd4444444-4444-4444-4444-444444444444',
  contactJohn: 'c1111111-1111-1111-1111-111111111111',
  contactJane: 'c2222222-2222-2222-2222-222222222222',
  contactBob: 'c3333333-3333-3333-3333-333333333333',
  contactSara: 'c4444444-4444-4444-4444-444444444444',
  connPostgres: 'a0000001-0001-4001-8001-000000000001',
  connSnowflake: 'a0000002-0002-4002-8002-000000000002',
  run1: 'b0000001-0001-4001-8001-000000000001',
  run2: 'b0000002-0002-4002-8002-000000000002',
  run3: 'b0000003-0003-4003-8003-000000000003',
  run4: 'b0000004-0004-4004-8004-000000000004',
  act1: 'e0000001-0001-4001-8001-000000000001',
  act2: 'e0000002-0002-4002-8002-000000000002',
  act3: 'e0000003-0003-4003-8003-000000000003',
  act4: 'e0000004-0004-4004-8004-000000000004',
  act5: 'e0000005-0005-4005-8005-000000000005',
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function seedM10Demo(prisma) {
  const syncedAt = daysAgo(1);

  const tenantSlug = `rri-demo-${TENANT.slice(0, 8)}`;
  let tenant = await prisma.tenant.findUnique({ where: { id: TENANT } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { id: TENANT, name: 'Demo Tenant', slug: tenantSlug },
    });
  }

  // Clear prior demo rows (FK order)
  await prisma.m10InteractionLink.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10LinkDecisionLog.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10DealContact.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10Activity.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10DataCloudExportRun.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10Deal.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10Contact.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10Account.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10CrmSyncState.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10DataCloudConnection.deleteMany({ where: { tenantId: TENANT } });
  await prisma.m10DataCloudCheckpoint.deleteMany({ where: { tenantId: TENANT } });

  const accounts = [
    {
      id: IDS.acctAcme,
      tenantId: TENANT,
      crmAccountId: 'sf-acme-001',
      name: 'ACME Corporation',
      domain: 'acme.com',
      region: 'NA',
      industry: 'Manufacturing',
      crmSource: 'salesforce',
      crmSyncedAt: syncedAt,
    },
    {
      id: IDS.acctGlobex,
      tenantId: TENANT,
      crmAccountId: 'hs-globex-001',
      name: 'Globex Corp',
      domain: 'globex.com',
      region: 'EMEA',
      industry: 'Technology',
      crmSource: 'hubspot',
      crmSyncedAt: syncedAt,
    },
    {
      id: IDS.acctInitech,
      tenantId: TENANT,
      crmAccountId: 'd365-initech-001',
      name: 'Initech Systems',
      domain: 'initech.com',
      region: 'APAC',
      industry: 'Finance',
      crmSource: 'dynamics365',
      crmSyncedAt: syncedAt,
    },
  ];

  for (const a of accounts) {
    await prisma.m10Account.create({ data: a });
  }

  const contacts = [
    {
      id: IDS.contactJohn,
      tenantId: TENANT,
      accountId: IDS.acctAcme,
      crmContactId: 'sf-john-smith',
      email: 'john.smith@acme.com',
      name: 'John Smith',
      title: 'VP of Procurement',
      crmSource: 'salesforce',
      crmSyncedAt: syncedAt,
    },
    {
      id: IDS.contactJane,
      tenantId: TENANT,
      accountId: IDS.acctAcme,
      crmContactId: 'sf-jane-doe',
      email: 'jane.doe@acme.com',
      name: 'Jane Doe',
      title: 'Director of IT',
      crmSource: 'salesforce',
      crmSyncedAt: syncedAt,
    },
    {
      id: IDS.contactBob,
      tenantId: TENANT,
      accountId: IDS.acctGlobex,
      crmContactId: 'hs-bob-jones',
      email: 'bob.jones@globex.com',
      name: 'Bob Jones',
      title: 'CTO',
      crmSource: 'hubspot',
      crmSyncedAt: syncedAt,
    },
    {
      id: IDS.contactSara,
      tenantId: TENANT,
      accountId: IDS.acctInitech,
      crmContactId: 'd365-sara-lee',
      email: 'sara.lee@initech.com',
      name: 'Sara Lee',
      title: 'Head of Operations',
      crmSource: 'dynamics365',
      crmSyncedAt: syncedAt,
    },
  ];

  for (const c of contacts) {
    await prisma.m10Contact.create({ data: c });
  }

  const deals = [
    {
      id: IDS.dealAcmeRenewal,
      tenantId: TENANT,
      accountId: IDS.acctAcme,
      crmDealId: 'sf-deal-renewal',
      name: 'ACME Enterprise Renewal Q2',
      stage: 'Negotiation',
      amount: 285000,
      currency: 'USD',
      isActive: true,
      crmSource: 'salesforce',
      crmSyncedAt: syncedAt,
      closeDate: daysAgo(-30),
    },
    {
      id: IDS.dealGlobex,
      tenantId: TENANT,
      accountId: IDS.acctGlobex,
      crmDealId: 'hs-deal-expansion',
      name: 'Globex Platform Expansion',
      stage: 'Proposal',
      amount: 150000,
      currency: 'USD',
      isActive: true,
      crmSource: 'hubspot',
      crmSyncedAt: syncedAt,
      closeDate: daysAgo(-45),
    },
    {
      id: IDS.dealInitech,
      tenantId: TENANT,
      accountId: IDS.acctInitech,
      crmDealId: 'd365-deal-pilot',
      name: 'Initech Pilot Program',
      stage: 'Qualified',
      amount: 65000,
      currency: 'USD',
      isActive: true,
      crmSource: 'dynamics365',
      crmSyncedAt: syncedAt,
      closeDate: daysAgo(-60),
    },
    {
      id: IDS.dealAcmeAddon,
      tenantId: TENANT,
      accountId: IDS.acctAcme,
      crmDealId: 'sf-deal-addon',
      name: 'ACME Add-on Modules 2025',
      stage: 'Closed Won',
      amount: 42000,
      currency: 'USD',
      isActive: false,
      crmSource: 'salesforce',
      crmSyncedAt: daysAgo(14),
      closeDate: daysAgo(10),
    },
  ];

  for (const d of deals) {
    await prisma.m10Deal.create({ data: d });
  }

  const dealContacts = [
    { id: 'dc000001-0001-4001-8001-000000000001', tenantId: TENANT, dealId: IDS.dealAcmeRenewal, contactId: IDS.contactJohn, role: 'primary' },
    { id: 'dc000002-0002-4002-8002-000000000002', tenantId: TENANT, dealId: IDS.dealAcmeRenewal, contactId: IDS.contactJane, role: 'economic_buyer' },
    { id: 'dc000003-0003-4003-8003-000000000003', tenantId: TENANT, dealId: IDS.dealGlobex, contactId: IDS.contactBob, role: 'primary' },
    { id: 'dc000004-0004-4004-8004-000000000004', tenantId: TENANT, dealId: IDS.dealInitech, contactId: IDS.contactSara, role: 'primary' },
  ];

  for (const dc of dealContacts) {
    await prisma.m10DealContact.create({ data: dc });
  }

  const calls = await prisma.callRecord.findMany({
    where: { tenantId: TENANT },
    orderBy: { callDate: 'desc' },
    take: 3,
  });

  const activities = [
    {
      id: IDS.act1,
      tenantId: TENANT,
      idempotencyKey: 'm10-seed-act-001',
      sourceType: 'call',
      sourcePlatform: calls[0]?.callSource ?? 'zoom',
      sourceRecordId: calls[0]?.id,
      occurredAt: daysAgo(2),
      accountId: IDS.acctAcme,
      contactId: IDS.contactJohn,
      dealId: IDS.dealAcmeRenewal,
      status: 'linked',
      transcriptId: calls[0]?.id,
    },
    {
      id: IDS.act2,
      tenantId: TENANT,
      idempotencyKey: 'm10-seed-act-002',
      sourceType: 'email',
      sourcePlatform: 'outlook',
      occurredAt: daysAgo(3),
      accountId: IDS.acctGlobex,
      contactId: IDS.contactBob,
      dealId: IDS.dealGlobex,
      status: 'linked',
    },
    {
      id: IDS.act3,
      tenantId: TENANT,
      idempotencyKey: 'm10-seed-act-003',
      sourceType: 'meeting',
      sourcePlatform: 'teams',
      occurredAt: daysAgo(5),
      accountId: IDS.acctInitech,
      contactId: IDS.contactSara,
      dealId: IDS.dealInitech,
      status: 'linked',
    },
    {
      id: IDS.act4,
      tenantId: TENANT,
      idempotencyKey: 'm10-seed-act-004',
      sourceType: 'call',
      sourcePlatform: 'zoom',
      occurredAt: daysAgo(7),
      accountId: IDS.acctAcme,
      contactId: IDS.contactJane,
      dealId: IDS.dealAcmeRenewal,
      status: 'linked_low_confidence',
    },
    {
      id: IDS.act5,
      tenantId: TENANT,
      idempotencyKey: 'm10-seed-act-005',
      sourceType: 'calendar',
      sourcePlatform: 'google',
      occurredAt: daysAgo(1),
      accountId: IDS.acctAcme,
      dealId: IDS.dealAcmeAddon,
      status: 'linked',
    },
  ];

  for (const act of activities) {
    await prisma.m10Activity.create({ data: act });
  }

  await prisma.m10InteractionLink.createMany({
    data: [
      {
        id: 'f0000001-0001-4001-8001-000000000001',
        tenantId: TENANT,
        activityId: IDS.act1,
        entityType: 'deal',
        entityId: IDS.dealAcmeRenewal,
        linkedDealId: IDS.dealAcmeRenewal,
        linkedAccountId: IDS.acctAcme,
        linkedContactId: IDS.contactJohn,
        confidence: 'high',
        signals: ['email_exact', 'domain_match'],
        explanation: { method: 'deterministic', score: 0.94 },
      },
      {
        id: 'f0000002-0002-4002-8002-000000000002',
        tenantId: TENANT,
        activityId: IDS.act2,
        entityType: 'account',
        entityId: IDS.acctGlobex,
        linkedAccountId: IDS.acctGlobex,
        linkedContactId: IDS.contactBob,
        confidence: 'high',
        signals: ['crm_thread_id'],
        explanation: { method: 'deterministic', score: 0.91 },
      },
    ],
  });

  const syncStates = [
    { crmSource: 'salesforce', entityType: 'accounts', status: 'completed', lastSyncedAt: syncedAt, recordsSynced: 142 },
    { crmSource: 'salesforce', entityType: 'contacts', status: 'completed', lastSyncedAt: syncedAt, recordsSynced: 389 },
    { crmSource: 'salesforce', entityType: 'deals', status: 'completed', lastSyncedAt: syncedAt, recordsSynced: 67 },
    { crmSource: 'hubspot', entityType: 'accounts', status: 'completed', lastSyncedAt: daysAgo(2), recordsSynced: 88 },
    { crmSource: 'hubspot', entityType: 'deals', status: 'completed', lastSyncedAt: daysAgo(2), recordsSynced: 34 },
    { crmSource: 'dynamics365', entityType: 'accounts', status: 'idle', recordsSynced: 0 },
  ];

  for (const s of syncStates) {
    await prisma.m10CrmSyncState.create({
      data: { tenantId: TENANT, ...s },
    });
  }

  await prisma.m10DataCloudConnection.create({
    data: {
      id: IDS.connPostgres,
      tenantId: TENANT,
      destination: 'postgres',
      config: { host: '127.0.0.1', database: 'revenue_intelligence', schema: 'analytics' },
      isActive: true,
    },
  });
  await prisma.m10DataCloudConnection.create({
    data: {
      id: IDS.connSnowflake,
      tenantId: TENANT,
      destination: 'snowflake',
      config: { account: 'demo', warehouse: 'EXPORT_WH', database: 'REVENUE_CLOUD' },
      isActive: false,
    },
  });

  await prisma.m10DataCloudCheckpoint.create({
    data: {
      id: 'c0000001-0001-4001-8001-000000000001',
      tenantId: TENANT,
      domain: 'revenue_graph',
      lastCursor: syncedAt.toISOString(),
    },
  });

  const runBase = daysAgo(0);
  const runs = [
    {
      id: IDS.run1,
      tenantId: TENANT,
      connectionId: IDS.connPostgres,
      status: 'success',
      rowsExported: 342,
      startedAt: new Date(runBase.getTime() - 4 * 60 * 1000),
      completedAt: runBase,
      filePaths: { accounts: 'accounts.csv', deals: 'deals.csv', contacts: 'contacts.csv' },
    },
    {
      id: IDS.run2,
      tenantId: TENANT,
      connectionId: IDS.connPostgres,
      status: 'success',
      rowsExported: 319,
      startedAt: daysAgo(1),
      completedAt: new Date(daysAgo(1).getTime() + 5 * 60 * 1000),
      filePaths: { accounts: 'accounts.csv', deals: 'deals.csv' },
    },
    {
      id: IDS.run3,
      tenantId: TENANT,
      connectionId: IDS.connPostgres,
      status: 'failed',
      rowsExported: 0,
      startedAt: daysAgo(2),
      completedAt: new Date(daysAgo(2).getTime() + 60 * 1000),
      errorMessage: 'Connection timeout after 60s',
    },
    {
      id: IDS.run4,
      tenantId: TENANT,
      connectionId: IDS.connSnowflake,
      status: 'success',
      rowsExported: 281,
      startedAt: daysAgo(3),
      completedAt: new Date(daysAgo(3).getTime() + 7 * 60 * 1000),
      filePaths: { parquet_bundle: 'export.parquet' },
    },
  ];

  for (const r of runs) {
    await prisma.m10DataCloudExportRun.create({ data: r });
  }

  const [accountsN, dealsN, contactsN, activitiesN, connectionsN, runsN, syncN] =
    await Promise.all([
      prisma.m10Account.count({ where: { tenantId: TENANT } }),
      prisma.m10Deal.count({ where: { tenantId: TENANT } }),
      prisma.m10Contact.count({ where: { tenantId: TENANT } }),
      prisma.m10Activity.count({ where: { tenantId: TENANT } }),
      prisma.m10DataCloudConnection.count({ where: { tenantId: TENANT } }),
      prisma.m10DataCloudExportRun.count({ where: { tenantId: TENANT } }),
      prisma.m10CrmSyncState.count({ where: { tenantId: TENANT } }),
    ]);

  return {
    success: true,
    tenantId: TENANT,
    revenueGraph: { accounts: accountsN, deals: dealsN, contacts: contactsN, activities: activitiesN, crmSyncStates: syncN },
    dataCloud: { connections: connectionsN, exportRuns: runsN },
    callsLinked: calls.length,
  };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedM10Demo(prisma);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { seedM10Demo, TENANT, IDS };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
