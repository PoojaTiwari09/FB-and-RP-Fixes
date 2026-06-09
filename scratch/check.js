const { PrismaClient } = require('./packages/database/index.js');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('All Users:');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
