const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  // Get all deals
  const deals = await prisma.deal.findMany();
  for (let i = 0; i < deals.length; i++) {
    const ownerId = i % 2 === 0 ? 'usr_sarah_123' : 'usr_michael_002';
    const ownerName = ownerId === 'usr_sarah_123' ? 'Sarah Chen' : 'Michael Rodriguez';
    await prisma.deal.update({
      where: { id: deals[i].id },
      data: { ownerId, ownerName }
    });
  }

  // Get all tasks
  const tasks = await prisma.engageTask.findMany();
  for (let i = 0; i < tasks.length; i++) {
    const assigneeId = i % 2 === 0 ? 'usr_sarah_123' : 'usr_michael_002';
    const assigneeName = assigneeId === 'usr_sarah_123' ? 'Sarah Chen' : 'Michael Rodriguez';
    await prisma.engageTask.update({
      where: { id: tasks[i].id },
      data: { assigneeId, assigneeName }
    });
  }

  console.log('Successfully reassigned data to Sarah and Michael.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
