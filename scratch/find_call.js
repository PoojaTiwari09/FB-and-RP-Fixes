const { PrismaClient } = require('../boilerplate code/r-revenue-intelligence/packages/database');
const prisma = new PrismaClient();

async function main() {
  const call = await prisma.callRecord.findFirst({
    where: { title: 'Security, ROI & Implementation — Initech' }
  });
  console.log('Matching call in database:', JSON.stringify(call, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
