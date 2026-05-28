const { PrismaClient } = require('../packages/database');
const TENANT = '00000000-0000-0000-0000-000000000001';

async function main() {
  const p = new PrismaClient();
  const [calls, accounts, deals, m10c, m10a, m10d] = await Promise.all([
    p.callRecord.count({ where: { tenantId: TENANT } }),
    p.account.count({ where: { tenantId: TENANT } }),
    p.deal.count({ where: { tenantId: TENANT } }),
    p.m10Contact.count({ where: { tenantId: TENANT } }).catch(() => 0),
    p.m10Account.count({ where: { tenantId: TENANT } }).catch(() => 0),
    p.m10Deal.count({ where: { tenantId: TENANT } }).catch(() => 0),
  ]);
  const sampleCalls = await p.callRecord.findMany({
    where: { tenantId: TENANT },
    take: 5,
    select: { id: true, title: true, accountId: true, opportunityId: true, participants: true },
  });
  console.log(JSON.stringify({
    tenant: TENANT,
    counts: { call_records: calls, accounts, deals, m10_contacts: m10c, m10_accounts: m10a, m10_deals: m10d },
    sample_calls: sampleCalls,
  }, null, 2));
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
