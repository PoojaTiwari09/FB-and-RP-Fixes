// M10 Revenue Graph — Quick Seed Script (dev only)
// Seeds sample accounts, contacts, deals and CRM sync states
// Run: node seed-m10.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://revenue_user:revenue_pass@localhost:5433/revenue_graph_dev' } },
});

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

async function main() {
  console.log('🌱 Seeding M10 Revenue Graph tables...');

  // Accounts
  const acme = await prisma.m10Account.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: TENANT_ID,
      name: 'ACME Corporation',
      domain: 'acme.com',
      region: 'NA',
      industry: 'Manufacturing',
      crmSource: 'salesforce',
      crmAccountId: 'sf-acct-001',
    },
  });

  const globex = await prisma.m10Account.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      tenantId: TENANT_ID,
      name: 'Globex Corp',
      domain: 'globex.com',
      region: 'EMEA',
      industry: 'Technology',
      crmSource: 'hubspot',
      crmAccountId: 'hs-acct-002',
    },
  });

  const initech = await prisma.m10Account.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      tenantId: TENANT_ID,
      name: 'Initech Systems',
      domain: 'initech.com',
      region: 'APAC',
      industry: 'Finance',
      crmSource: 'dynamics365',
      crmAccountId: 'd365-acct-003',
    },
  });
  console.log('  ✅ Accounts: ACME, Globex, Initech');

  // Contacts
  await prisma.m10Contact.upsert({
    where: { id: 'c1111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: 'c1111111-1111-1111-1111-111111111111',
      tenantId: TENANT_ID,
      accountId: acme.id,
      email: 'john.smith@acme.com',
      name: 'John Smith',
      title: 'VP of Procurement',
      crmSource: 'salesforce',
    },
  });
  await prisma.m10Contact.upsert({
    where: { id: 'c2222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: 'c2222222-2222-2222-2222-222222222222',
      tenantId: TENANT_ID,
      accountId: globex.id,
      email: 'lisa.nguyen@globex.com',
      name: 'Lisa Nguyen',
      title: 'CTO',
      crmSource: 'hubspot',
    },
  });
  console.log('  ✅ Contacts: John Smith, Lisa Nguyen');

  // Deals
  const d1 = await prisma.m10Deal.upsert({
    where: { id: 'd1111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: 'd1111111-1111-1111-1111-111111111111',
      tenantId: TENANT_ID,
      accountId: acme.id,
      name: 'ACME Enterprise Renewal Q2',
      stage: 'Negotiation',
      amount: 285000,
      currency: 'USD',
      isActive: true,
      crmSource: 'salesforce',
      crmDealId: 'sf-deal-001',
    },
  });
  const d2 = await prisma.m10Deal.upsert({
    where: { id: 'd2222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: 'd2222222-2222-2222-2222-222222222222',
      tenantId: TENANT_ID,
      accountId: globex.id,
      name: 'Globex Platform Expansion',
      stage: 'Proposal',
      amount: 150000,
      currency: 'USD',
      isActive: true,
      crmSource: 'hubspot',
      crmDealId: 'hs-deal-002',
    },
  });
  await prisma.m10Deal.upsert({
    where: { id: 'd3333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: 'd3333333-3333-3333-3333-333333333333',
      tenantId: TENANT_ID,
      accountId: initech.id,
      name: 'Initech Pilot Program',
      stage: 'Qualified',
      amount: 65000,
      currency: 'USD',
      isActive: true,
      crmSource: 'dynamics365',
      crmDealId: 'd365-deal-003',
    },
  });
  await prisma.m10Deal.upsert({
    where: { id: 'd4444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: 'd4444444-4444-4444-4444-444444444444',
      tenantId: TENANT_ID,
      accountId: acme.id,
      name: 'ACME Add-on Modules 2025',
      stage: 'Closed Won',
      amount: 42000,
      currency: 'USD',
      isActive: false,
      crmSource: 'salesforce',
      crmDealId: 'sf-deal-004',
    },
  });
  console.log('  ✅ Deals: 4 deals across 3 accounts');

  // CRM Sync States
  for (const [src, entity, synced, records] of [
    ['salesforce', 'accounts', new Date('2026-05-19T06:00:00Z'), 142],
    ['salesforce', 'contacts', new Date('2026-05-19T06:01:00Z'), 389],
    ['salesforce', 'deals', new Date('2026-05-19T06:02:00Z'), 67],
    ['hubspot', 'accounts', new Date('2026-05-19T05:45:00Z'), 88],
    ['hubspot', 'deals', new Date('2026-05-19T05:46:00Z'), 34],
    ['dynamics365', 'accounts', null, 0],
  ]) {
    await prisma.m10CrmSyncState.upsert({
      where: { tenantId_crmSource_entityType: { tenantId: TENANT_ID, crmSource: src, entityType: entity } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        crmSource: src,
        entityType: entity,
        status: synced ? 'completed' : 'idle',
        lastSyncedAt: synced || null,
        recordsSynced: records,
      },
    });
  }
  console.log('  ✅ CRM sync states: Salesforce ✓, HubSpot ✓, Dynamics365 (idle)');

  // Activity + Interaction Link sample
  const activity = await prisma.m10Activity.upsert({
    where: { idempotencyKey: `${TENANT_ID}:call-001:evt-001` },
    update: {},
    create: {
      tenantId: TENANT_ID,
      idempotencyKey: `${TENANT_ID}:call-001:evt-001`,
      sourceType: 'call',
      sourcePlatform: 'zoom',
      sourceRecordId: 'call-001',
      occurredAt: new Date('2026-05-18T14:30:00Z'),
      accountId: acme.id,
      dealId: d1.id,
      status: 'linked',
    },
  });
  await prisma.m10InteractionLink.upsert({
    where: { tenantId_activityId_entityType_entityId: { tenantId: TENANT_ID, activityId: activity.id, entityType: 'deal', entityId: d1.id } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      activityId: activity.id,
      entityType: 'deal',
      entityId: d1.id,
      linkedDealId: d1.id,
      confidence: 'high',
      signals: ['email_domain_exact_match', 'single_open_deal_on_account'],
      aiAssisted: false,
      explanation: { method: 'deterministic', rule: 'domain_match' },
    },
  });
  console.log('  ✅ Activity + interaction link seeded (high confidence, deterministic)');

  console.log('\n🎉 Seed complete! Tenant ID for testing:', TENANT_ID);
  console.log('   Accounts: 3 | Contacts: 2 | Deals: 4 | CRM states: 6');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
