const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { PrismaClient } = require('../boilerplate code/r-revenue-intelligence/packages/database/node_modules/.prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public'
    }
  }
});

async function main() {
  console.log('Database URL:', process.env.DATABASE_URL || 'postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public');
  
  try {
    const dealsCount = await prisma.deal.count();
    console.log('Deals Count:', dealsCount);

    const commentsCount = await prisma.dealComment.count();
    console.log('DealComments Count:', commentsCount);

    const tasksCount = await prisma.dealTask.count();
    console.log('DealTasks Count:', tasksCount);

    const warningsCount = await prisma.dealWarning.count();
    console.log('DealWarnings Count:', warningsCount);

    const playbookCount = await prisma.dealPlaybook.count();
    console.log('DealPlaybook Count:', playbookCount);

    const activityCount = await prisma.dealActivityEvent.count();
    console.log('DealActivityEvent Count:', activityCount);

    const notificationCount = await prisma.dealNotification.count();
    console.log('DealNotification Count:', notificationCount);

    if (dealsCount > 0) {
      const deal = await prisma.deal.findFirst();
      console.log('Sample Deal:', JSON.stringify(deal, null, 2));
    }

  } catch (error) {
    console.error('Error querying Prisma tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
