const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const calls = await prisma.callRecord.findMany({
    select: { id: true, title: true, callOwner: true, tenantid: true, callDate: true },
    orderBy: { callDate: 'desc' },
    take: 5
  });
  console.log(calls);
}
main().catch(console.error).finally(() => prisma.$disconnect());
