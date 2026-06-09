const { PrismaClient } = require('@rri/database');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.callRecord.findMany({
    select: { id: true, title: true, tenantId: true }
  });
  console.log('Call Records in DB:');
  console.log(JSON.stringify(records, null, 2));

  const reviews = await prisma.callReview.findMany({
    select: { reviewId: true, callTitle: true, tenantId: true, status: true, overallScore: true }
  });
  console.log('\nCall Reviews in DB:');
  console.log(JSON.stringify(reviews, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
