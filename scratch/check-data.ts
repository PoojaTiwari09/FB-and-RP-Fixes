import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: 'Sarah',
        mode: 'insensitive'
      }
    }
  });

  console.log('Found Users:', users);

  for (const user of users) {
    const deals = await prisma.deal.findMany({
      where: { ownerId: user.id }
    });
    console.log(`Deals for ${user.name}:`, deals.length);

    const calls = await prisma.callRecord.findMany({
      where: { callOwner: user.id }
    });
    console.log(`Calls for ${user.name}:`, calls.length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
