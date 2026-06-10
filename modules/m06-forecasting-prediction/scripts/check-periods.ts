import { PrismaClient } from '@rri/database';
const prisma = new PrismaClient();
async function main() {
  const periods = await prisma.forecastPeriod.findMany({});
  console.log(JSON.stringify(periods, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

