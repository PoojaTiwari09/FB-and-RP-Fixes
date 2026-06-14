/**
 * Seed M10 Revenue Graph + Data Cloud + Compliance for demo tenant.
 *
 *   $env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
 *   node scripts/seed_m10_demo.cjs
 *
 * Or: POST http://localhost:4011/api/v1/m10-data-compliance/test/seed
 */
const { PrismaClient } = require('../packages/database');

const TENANT = '00000000-0000-0000-0000-000000000001';

const IDS = {
  acctAcme:       '11111111-1111-4111-a111-111111111111',
  acctGlobex:     '22222222-2222-4222-a222-222222222222',
  acctInitech:    '33333333-3333-4333-a333-333333333333',
  dealAcmeRenewal:'44411111-1111-4111-a111-111111111111',
  dealGlobex:     '44422222-2222-4222-a222-222222222222',
  dealInitech:    '44433333-3333-4333-a333-333333333333',
  dealAcmeAddon:  '44444444-4444-4444-a444-444444444444',
  contactJohn:    '55511111-1111-4111-a111-111111111111',
  contactJane:    '55522222-2222-4222-a222-222222222222',
  contactBob:     '55533333-3333-4333-a333-333333333333',
  contactSara:    '55544444-4444-4444-a444-444444444444',
  connPostgres:   'a0000001-0001-4001-a001-000000000001',
  connSnowflake:  'a0000002-0002-4002-a002-000000000002',
  run1:           'b0000001-0001-4001-a001-000000000001',
  run2:           'b0000002-0002-4002-a002-000000000002',
  run3:           'b0000003-0003-4003-a003-000000000003',
  run4:           'b0000004-0004-4004-a004-000000000004',
  act1:           'e0000001-0001-4001-a001-000000000001',
  act2:           'e0000002-0002-4002-a002-000000000002',
  act3:           'e0000003-0003-4003-a003-000000000003',
  act4:           'e0000004-0004-4004-a004-000000000004',
  act5:           'e0000005-0005-4005-a005-000000000005',
  policyGdprEmail:'fa000001-0001-4001-a001-000000000001',
  policyGlobal:   'fa000002-0002-4002-a002-000000000002',
  policyData:     'fa000003-0003-4003-a003-000000000003',
  audit1:         'ab000001-0001-4001-a001-000000000001',
  audit2:         'ab000002-0002-4002-a002-000000000002',
  audit3:         'ab000003-0003-4003-a003-000000000003',
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

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenantSlug = `rri-demo-${TENANT.slice(0, 8)}`;
  let tenant = await prisma.tenant.findUnique({ where: { id: TENANT } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { id: TENANT, name: 'Demo Tenant', slug: tenantSlug },
    });
  }

  // ── Clear prior demo rows (FK order — compliance first, then revenue graph) ─
  await prisma.m10ComplianceAuditEntry.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10CompliancePolicy.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10CrmOptOut.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10ConsentLog.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10GdprDeletion.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10GdprDataSubjectRequest.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10GdprProcessingRecord.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10GdprDataBreachRecord.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10EPrivacyConsent.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10SuppressionEntry.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10InteractionLink.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10LinkDecisionLog.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10DealContact.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10Activity.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10DataCloudExportRun.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10Deal.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10Contact.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10Account.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10CrmSyncState.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10DataCloudConnection.deleteMany({ where: { tenantid: TENANT } });
  await prisma.m10DataCloudCheckpoint.deleteMany({ where: { tenantid: TENANT } });

  // ── Accounts ─────────────────────────────────────────────────────────────────
  const accounts = [
    { id: IDS.acctAcme,    tenantid: TENANT, crmAccountId: 'sf-acme-001',     name: 'ACME Corporation', domain: 'acme.com',    region: 'NA',   industry: 'Manufacturing', crmSource: 'salesforce',  crmSyncedAt: syncedAt },
    { id: IDS.acctGlobex,  tenantid: TENANT, crmAccountId: 'hs-globex-001',   name: 'Globex Corp',      domain: 'globex.com',  region: 'EMEA', industry: 'Technology',    crmSource: 'hubspot',     crmSyncedAt: syncedAt },
    { id: IDS.acctInitech, tenantid: TENANT, crmAccountId: 'd365-initech-001',name: 'Initech Systems',  domain: 'initech.com', region: 'APAC', industry: 'Finance',       crmSource: 'dynamics365', crmSyncedAt: syncedAt },
  ];
  for (const a of accounts) await prisma.m10Account.create({ data: a });

  // ── Contacts ─────────────────────────────────────────────────────────────────
  const contacts = [
    { id: IDS.contactJohn, tenantid: TENANT, accountId: IDS.acctAcme,    crmContactId: 'sf-john-smith',  email: 'john.smith@acme.com',  name: 'John Smith',  title: 'VP of Procurement',    crmSource: 'salesforce',  crmSyncedAt: syncedAt },
    { id: IDS.contactJane, tenantid: TENANT, accountId: IDS.acctAcme,    crmContactId: 'sf-jane-doe',    email: 'jane.doe@acme.com',    name: 'Jane Doe',    title: 'Director of IT',       crmSource: 'salesforce',  crmSyncedAt: syncedAt },
    { id: IDS.contactBob,  tenantid: TENANT, accountId: IDS.acctGlobex,  crmContactId: 'hs-bob-jones',   email: 'bob.jones@globex.com', name: 'Bob Jones',   title: 'CTO',                  crmSource: 'hubspot',     crmSyncedAt: syncedAt },
    { id: IDS.contactSara, tenantid: TENANT, accountId: IDS.acctInitech, crmContactId: 'd365-sara-lee',  email: 'sara.lee@initech.com', name: 'Sara Lee',    title: 'Head of Operations',   crmSource: 'dynamics365', crmSyncedAt: syncedAt },
  ];
  for (const c of contacts) await prisma.m10Contact.create({ data: c });

  // ── Deals ─────────────────────────────────────────────────────────────────────
  const deals = [
    { id: IDS.dealAcmeRenewal, tenantid: TENANT, accountId: IDS.acctAcme,    crmDealId: 'sf-deal-renewal',  name: 'ACME Enterprise Renewal Q2',  stage: 'Negotiation', amount: 285000, currency: 'USD', isActive: true,  crmSource: 'salesforce',  crmSyncedAt: syncedAt,      closeDate: daysAgo(-30) },
    { id: IDS.dealGlobex,      tenantid: TENANT, accountId: IDS.acctGlobex,  crmDealId: 'hs-deal-expansion',name: 'Globex Platform Expansion',   stage: 'Proposal',    amount: 150000, currency: 'USD', isActive: true,  crmSource: 'hubspot',     crmSyncedAt: syncedAt,      closeDate: daysAgo(-45) },
    { id: IDS.dealInitech,     tenantid: TENANT, accountId: IDS.acctInitech, crmDealId: 'd365-deal-pilot',  name: 'Initech Pilot Program',       stage: 'Qualified',   amount: 65000,  currency: 'USD', isActive: true,  crmSource: 'dynamics365', crmSyncedAt: syncedAt,      closeDate: daysAgo(-60) },
    { id: IDS.dealAcmeAddon,   tenantid: TENANT, accountId: IDS.acctAcme,    crmDealId: 'sf-deal-addon',    name: 'ACME Add-on Modules 2025',    stage: 'Closed Won',  amount: 42000,  currency: 'USD', isActive: false, crmSource: 'salesforce',  crmSyncedAt: daysAgo(14),  closeDate: daysAgo(10) },
  ];
  for (const d of deals) await prisma.m10Deal.create({ data: d });

  // ── Deal Contacts ─────────────────────────────────────────────────────────────
  const dealContacts = [
    { id: 'dd000001-0001-4001-a001-000000000001', tenantid: TENANT, dealId: IDS.dealAcmeRenewal, contactId: IDS.contactJohn, role: 'primary' },
    { id: 'dd000002-0002-4002-a002-000000000002', tenantid: TENANT, dealId: IDS.dealAcmeRenewal, contactId: IDS.contactJane, role: 'economic_buyer' },
    { id: 'dd000003-0003-4003-a003-000000000003', tenantid: TENANT, dealId: IDS.dealGlobex,      contactId: IDS.contactBob,  role: 'primary' },
    { id: 'dd000004-0004-4004-a004-000000000004', tenantid: TENANT, dealId: IDS.dealInitech,     contactId: IDS.contactSara, role: 'primary' },
  ];
  for (const dc of dealContacts) await prisma.m10DealContact.create({ data: dc });

  // ── Activities ────────────────────────────────────────────────────────────────
  const calls = await prisma.callRecord.findMany({
    where: { tenantid: TENANT },
    orderBy: { callDate: 'desc' },
    take: 3,
  });

  const activities = [
    { id: IDS.act1, tenantid: TENANT, idempotencyKey: 'm10-seed-act-001', sourceType: 'call',     sourcePlatform: calls[0]?.callSource ?? 'zoom',    sourceRecordId: calls[0]?.id, occurredAt: daysAgo(2), accountId: IDS.acctAcme,    contactId: IDS.contactJohn, dealId: IDS.dealAcmeRenewal, status: 'linked',                transcriptId: calls[0]?.id },
    { id: IDS.act2, tenantid: TENANT, idempotencyKey: 'm10-seed-act-002', sourceType: 'email',    sourcePlatform: 'outlook',                          occurredAt: daysAgo(3), accountId: IDS.acctGlobex,  contactId: IDS.contactBob,  dealId: IDS.dealGlobex,      status: 'linked' },
    { id: IDS.act3, tenantid: TENANT, idempotencyKey: 'm10-seed-act-003', sourceType: 'meeting',  sourcePlatform: 'teams',                            occurredAt: daysAgo(5), accountId: IDS.acctInitech, contactId: IDS.contactSara, dealId: IDS.dealInitech,     status: 'linked' },
    { id: IDS.act4, tenantid: TENANT, idempotencyKey: 'm10-seed-act-004', sourceType: 'call',     sourcePlatform: 'zoom',                             occurredAt: daysAgo(7), accountId: IDS.acctAcme,    contactId: IDS.contactJane, dealId: IDS.dealAcmeRenewal, status: 'linked_low_confidence' },
    { id: IDS.act5, tenantid: TENANT, idempotencyKey: 'm10-seed-act-005', sourceType: 'calendar', sourcePlatform: 'google',                           occurredAt: daysAgo(1), accountId: IDS.acctAcme,    dealId: IDS.dealAcmeAddon,                               status: 'linked' },
  ];
  for (const act of activities) await prisma.m10Activity.create({ data: act });

  // ── Interaction Links ─────────────────────────────────────────────────────────
  await prisma.m10InteractionLink.createMany({
    data: [
      { id: 'ff000001-0001-4001-a001-000000000001', tenantid: TENANT, activityId: IDS.act1, entityType: 'deal',    entityId: IDS.dealAcmeRenewal, linkedDealId: IDS.dealAcmeRenewal, linkedAccountId: IDS.acctAcme,   linkedContactId: IDS.contactJohn, confidence: 'high', signals: ['email_exact', 'domain_match'], explanation: { method: 'deterministic', score: 0.94 } },
      { id: 'ff000002-0002-4002-a002-000000000002', tenantid: TENANT, activityId: IDS.act2, entityType: 'account', entityId: IDS.acctGlobex,      linkedAccountId: IDS.acctGlobex,                                   linkedContactId: IDS.contactBob,  confidence: 'high', signals: ['crm_thread_id'],              explanation: { method: 'deterministic', score: 0.91 } },
    ],
  });

  // ── CRM Sync States ───────────────────────────────────────────────────────────
  const syncStates = [
    { crmSource: 'salesforce',  entityType: 'accounts', status: 'completed', lastSyncedAt: syncedAt,      recordsSynced: 142 },
    { crmSource: 'salesforce',  entityType: 'contacts', status: 'completed', lastSyncedAt: syncedAt,      recordsSynced: 389 },
    { crmSource: 'salesforce',  entityType: 'deals',    status: 'completed', lastSyncedAt: syncedAt,      recordsSynced: 67 },
    { crmSource: 'hubspot',     entityType: 'accounts', status: 'completed', lastSyncedAt: daysAgo(2),    recordsSynced: 88 },
    { crmSource: 'hubspot',     entityType: 'deals',    status: 'completed', lastSyncedAt: daysAgo(2),    recordsSynced: 34 },
    { crmSource: 'dynamics365', entityType: 'accounts', status: 'idle',                                   recordsSynced: 0 },
  ];
  for (const s of syncStates) {
    await prisma.m10CrmSyncState.create({ data: { tenantid: TENANT, ...s } });
  }

  // ── Data Cloud Connections ────────────────────────────────────────────────────
  // config must include host, database, schema, username — all read by frontend normaliseConnection()
  await prisma.m10DataCloudConnection.create({
    data: {
      id: IDS.connPostgres,
      tenantid: TENANT,
      destination: 'postgres',
      destinationName: 'Revenue Analytics DB',
      config: { host: '127.0.0.1', port: 5438, database: 'revenue_intelligence', schema: 'analytics', username: 'revenue_user' },
      isActive: true,
    },
  });
  await prisma.m10DataCloudConnection.create({
    data: {
      id: IDS.connSnowflake,
      tenantid: TENANT,
      destination: 'snowflake',
      destinationName: 'Snowflake Data Warehouse',
      config: { account: 'xy12345.us-east-1', warehouse: 'EXPORT_WH', database: 'REVENUE_CLOUD', schema: 'PUBLIC', username: 'LOADER' },
      isActive: false,
    },
  });

  // ── Data Cloud Checkpoint ─────────────────────────────────────────────────────
  await prisma.m10DataCloudCheckpoint.create({
    data: {
      id: 'c0000001-0001-4001-8001-000000000001',
      tenantid: TENANT,
      domain: 'revenue_graph',
      lastCursor: syncedAt.toISOString(),
    },
  });

  // ── Export Runs ───────────────────────────────────────────────────────────────
  const runBase = daysAgo(0);
  const runs = [
    { id: IDS.run1, tenantid: TENANT, connectionId: IDS.connPostgres,  status: 'success', rowsExported: 342, startedAt: new Date(runBase.getTime() - 4 * 60 * 1000),   completedAt: runBase,                                              filePaths: { accounts: 'accounts.csv', deals: 'deals.csv', contacts: 'contacts.csv' } },
    { id: IDS.run2, tenantid: TENANT, connectionId: IDS.connPostgres,  status: 'success', rowsExported: 319, startedAt: daysAgo(1),                                      completedAt: new Date(daysAgo(1).getTime() + 5 * 60 * 1000),      filePaths: { accounts: 'accounts.csv', deals: 'deals.csv' } },
    { id: IDS.run3, tenantid: TENANT, connectionId: IDS.connPostgres,  status: 'failed',  rowsExported: 0,   startedAt: daysAgo(2),                                      completedAt: new Date(daysAgo(2).getTime() + 60 * 1000),          errorMessage: 'Connection timeout after 60s' },
    { id: IDS.run4, tenantid: TENANT, connectionId: IDS.connSnowflake, status: 'success', rowsExported: 281, startedAt: daysAgo(3),                                      completedAt: new Date(daysAgo(3).getTime() + 7 * 60 * 1000),      filePaths: { parquet_bundle: 'export.parquet' } },
  ];
  for (const r of runs) await prisma.m10DataCloudExportRun.create({ data: r });

  // ── Compliance Policies ───────────────────────────────────────────────────────
  // frontend GET /policies → normalised to: { id, ruleName, appliedTo, status, checkedAt, details }
  const policies = [
    {
      id: IDS.policyGdprEmail,
      tenantid: TENANT,
      name: 'GDPR Email Consent',
      description: 'Require explicit opt-in before sending marketing emails to EU contacts',
      channel: 'email',
      regionFamily: 'GDPR',
      ruleDefinition: { requireExplicitConsent: true, fallbackAction: 'block', jurisdiction: ['DE', 'FR', 'NL', 'EU'] },
      isActive: true,
    },
    {
      id: IDS.policyGlobal,
      tenantid: TENANT,
      name: 'Global Call Compliance',
      description: 'Respect opt-out preferences before initiating outbound calls globally',
      channel: 'call',
      regionFamily: 'GLOBAL',
      ruleDefinition: { checkCrmOptOut: true, fallbackAction: 'allow' },
      isActive: true,
    },
    {
      id: IDS.policyData,
      tenantid: TENANT,
      name: 'Data Export PII Guard',
      description: 'Mask PII fields in warehouse exports unless data residency is compliant',
      channel: 'data_export',
      regionFamily: 'CCPA',
      ruleDefinition: { maskPiiFields: ['email', 'phone', 'name'], fallbackAction: 'block' },
      isActive: true,
    },
  ];
  for (const p of policies) await prisma.m10CompliancePolicy.create({ data: p });

  // ── Audit Entries ─────────────────────────────────────────────────────────────
  // frontend GET /compliance/audit-log → shows compliance evaluation decisions
  const auditEntries = [
    {
      id: IDS.audit1,
      tenantid: TENANT,
      correlationId: 'corr-seed-001',
      recipientEmail: 'john.smith@acme.com',
      channel: 'email',
      decision: 'allow',
      reasonCode: 'POLICY_PASSED',
      explanation: 'Contact has active consent on file',
      triggeredPolicyId: IDS.policyGdprEmail,
      evaluationMetadata: { jurisdiction: 'US', policyVersion: 1 },
    },
    {
      id: IDS.audit2,
      tenantid: TENANT,
      correlationId: 'corr-seed-002',
      recipientEmail: 'eu-user@example.de',
      channel: 'email',
      decision: 'block',
      reasonCode: 'GDPR_CONSENT_REQUIRED',
      explanation: 'No explicit consent record found for EU contact',
      triggeredPolicyId: IDS.policyGdprEmail,
      evaluationMetadata: { jurisdiction: 'DE', policyVersion: 1 },
    },
    {
      id: IDS.audit3,
      tenantid: TENANT,
      correlationId: 'corr-seed-003',
      recipientEmail: 'bob.jones@globex.com',
      channel: 'call',
      decision: 'allow',
      reasonCode: 'POLICY_PASSED',
      explanation: 'No opt-out on record; call permitted',
      triggeredPolicyId: IDS.policyGlobal,
      evaluationMetadata: { jurisdiction: 'EMEA', policyVersion: 1 },
    },
  ];
  for (const a of auditEntries) await prisma.m10ComplianceAuditEntry.create({ data: a });

  // ── CRM Opt-Outs ──────────────────────────────────────────────────────────────
  const optOuts = [
    { tenantid: TENANT, contactEmail: 'john.smith@acme.com', channel: 'email', isOptedOut: false },
    { tenantid: TENANT, contactEmail: 'jane.doe@acme.com',   channel: 'email', isOptedOut: false },
    { tenantid: TENANT, contactEmail: 'bob.jones@globex.com',channel: 'call',  isOptedOut: false },
    { tenantid: TENANT, contactEmail: 'unsubscribed@spam.io',channel: 'email', isOptedOut: true },
  ];
  for (const o of optOuts) await prisma.m10CrmOptOut.create({ data: o });

  // ── Consent Logs ─────────────────────────────────────────────────────────────
  const consentLogs = [
    { tenantid: TENANT, contactEmail: 'john.smith@acme.com',  consentType: 'email_marketing', status: 'granted', source: 'web_form' },
    { tenantid: TENANT, contactEmail: 'jane.doe@acme.com',    consentType: 'email_marketing', status: 'granted', source: 'opt_in_email' },
    { tenantid: TENANT, contactEmail: 'bob.jones@globex.com', consentType: 'call_outreach',   status: 'granted', source: 'manual_crm' },
    { tenantid: TENANT, contactEmail: 'sara.lee@initech.com', consentType: 'email_marketing', status: 'revoked', source: 'preference_center' },
  ];
  for (const cl of consentLogs) await prisma.m10ConsentLog.create({ data: cl });

  // ── GDPR DSARs ────────────────────────────────────────────────────────────────
  await prisma.m10GdprDataSubjectRequest.create({
    data: {
      tenantid: TENANT,
      contactEmail: 'eu-user@example.de',
      requestType: 'erasure',
      status: 'pending',
      details: { requestedBy: 'data-subject', notes: 'Right to be forgotten request' },
    },
  });
  await prisma.m10GdprDataSubjectRequest.create({
    data: {
      tenantid: TENANT,
      contactEmail: 'sara.lee@initech.com',
      requestType: 'portability',
      status: 'completed',
      completionDate: daysAgo(2),
      details: { requestedBy: 'data-subject', notes: 'Data export delivered via email' },
    },
  });

  // ── GDPR Processing Records (RoPA) ────────────────────────────────────────────
  await prisma.m10GdprProcessingRecord.create({
    data: {
      tenantid: TENANT,
      purpose: 'Email marketing campaigns',
      dataCategories: ['contact_info', 'behavioral_data'],
      lawfulBasis: 'consent',
      retentionPeriod: '2 years',
    },
  });
  await prisma.m10GdprProcessingRecord.create({
    data: {
      tenantid: TENANT,
      purpose: 'Sales outreach and pipeline management',
      dataCategories: ['contact_info', 'deal_data'],
      lawfulBasis: 'legitimate_interest',
      retentionPeriod: '5 years',
    },
  });

  // ── ePrivacy Consents ────────────────────────────────────────────────────────
  const eprivacyConsents = [
    { tenantid: TENANT, contactEmail: 'john.smith@acme.com',  channel: 'email', purpose: 'marketing',  status: 'granted', source: 'cookie_banner' },
    { tenantid: TENANT, contactEmail: 'jane.doe@acme.com',    channel: 'email', purpose: 'marketing',  status: 'granted', source: 'preference_center' },
    { tenantid: TENANT, contactEmail: 'bob.jones@globex.com', channel: 'email', purpose: 'tracking',   status: 'revoked', source: 'cookie_banner' },
    { tenantid: TENANT, contactEmail: 'sara.lee@initech.com', channel: 'sms',   purpose: 'marketing',  status: 'granted', source: 'web_form' },
  ];
  for (const ep of eprivacyConsents) await prisma.m10EPrivacyConsent.create({ data: ep });

  // ── Suppression List ──────────────────────────────────────────────────────────
  await prisma.m10SuppressionEntry.create({
    data: { tenantid: TENANT, contactEmail: 'unsubscribed@spam.io', reason: 'spam_complaint' },
  });

  // ── Summary counts ────────────────────────────────────────────────────────────
  const [accountsN, dealsN, contactsN, activitiesN, connectionsN, runsN, syncN, policiesN, auditN] =
    await Promise.all([
      prisma.m10Account.count({ where: { tenantid: TENANT } }),
      prisma.m10Deal.count({ where: { tenantid: TENANT } }),
      prisma.m10Contact.count({ where: { tenantid: TENANT } }),
      prisma.m10Activity.count({ where: { tenantid: TENANT } }),
      prisma.m10DataCloudConnection.count({ where: { tenantid: TENANT } }),
      prisma.m10DataCloudExportRun.count({ where: { tenantid: TENANT } }),
      prisma.m10CrmSyncState.count({ where: { tenantid: TENANT } }),
      prisma.m10CompliancePolicy.count({ where: { tenantid: TENANT } }),
      prisma.m10ComplianceAuditEntry.count({ where: { tenantid: TENANT } }),
    ]);

  return {
    success: true,
    tenantId: TENANT,
    revenueGraph: { accounts: accountsN, deals: dealsN, contacts: contactsN, activities: activitiesN, crmSyncStates: syncN },
    dataCloud: { connections: connectionsN, exportRuns: runsN },
    compliance: { policies: policiesN, auditEntries: auditN },
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
