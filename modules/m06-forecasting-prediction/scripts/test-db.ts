import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const periods = await prisma.forecastPeriod.findMany();
  console.log(periods);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
