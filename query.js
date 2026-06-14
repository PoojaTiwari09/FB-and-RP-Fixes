const { PrismaClient } = require('@rri/database');
const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.crmDeal.findMany({
    where: { repUserId: '33333333-3333-3333-3333-333333333333' },
  });
  console.log('Sarah Chen Deals:');
  deals.forEach(d => console.log(`${d.id} | ${d.dealName} | ${d.amount} | ${d.closeDate}`));

  const subs = await prisma.forecastSubmission.findMany({
    where: { repUserId: '33333333-3333-3333-3333-333333333333' },
    orderBy: { version: 'asc' }
  });
  console.log('Submissions:', JSON.stringify(subs, null, 2));
}

main().finally(() => prisma.$disconnect());
