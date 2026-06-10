import { PrismaClient } from '@rri/database';
const prisma = new PrismaClient();
async function main() {
  const subs = await prisma.forecastSubmission.findMany({
    where: { repUserId: 'rep-02' },
    orderBy: { version: 'desc' }
  });
  console.log(JSON.stringify(subs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

