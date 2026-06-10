import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('../packages/database/node_modules/@prisma/client') ||
  require('@prisma/client');

const TENANT = '00000000-0000-0000-0000-000000000001';
const url =
  process.env.DATABASE_URL ||
  'postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public';

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const [calls, accounts, deals, m10Contacts, m10Accounts, m10Deals] = await Promise.all([
    prisma.callRecord.count({ where: { tenantId: TENANT } }),
    prisma.account.count({ where: { tenantId: TENANT } }),
    prisma.deal.count({ where: { tenantId: TENANT } }),
    prisma.m10Contact.count({ where: { tenantId: TENANT } }).catch(() => -1),
    prisma.m10Account.count({ where: { tenantId: TENANT } }).catch(() => -1),
    prisma.m10Deal.count({ where: { tenantId: TENANT } }).catch(() => -1),
  ]);

  console.log(JSON.stringify({
    tenant: TENANT,
    public: { call_records: calls, accounts, deals },
    m10: { m10_contacts: m10Contacts, m10_accounts: m10Accounts, m10_deals: m10Deals },
  }, null, 2));

  if (calls > 0) {
    const sample = await prisma.callRecord.findMany({
      where: { tenantId: TENANT },
      take: 3,
      select: { id: true, title: true, accountId: true, opportunityId: true },
    });
    console.log('sample_calls:', sample);
  }
  if (accounts > 0) {
    console.log('sample_accounts:', await prisma.account.findMany({
      where: { tenantId: TENANT }, take: 3, select: { id: true, name: true },
    }));
  }
  if (deals > 0) {
    console.log('sample_deals:', await prisma.deal.findMany({
      where: { tenantId: TENANT }, take: 3, select: { id: true, name: true, stage: true },
    }));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
