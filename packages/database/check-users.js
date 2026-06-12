const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, email: u.email, role: u.role })));
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
