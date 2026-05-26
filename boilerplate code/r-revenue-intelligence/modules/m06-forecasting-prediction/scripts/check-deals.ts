import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const deals = await prisma.crmDeal.findMany({ where: { repUserId: 'rep-02', source: 'manual' } });
  console.log(JSON.stringify(deals, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
