const { PrismaClient } = require('../boilerplate code/r-revenue-intelligence/packages/database');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.callReview.findMany({});
  console.log('Call Reviews in database:');
  for (const r of reviews) {
    console.log(`- Review ID: ${r.reviewId}`);
    console.log(`  Call Title: ${r.callTitle}`);
    console.log(`  SalesRep: ${r.salesRep}`);
    console.log(`  Status: ${r.status}`);
    console.log(`  OverallScore: ${r.overallScore}`);
    console.log(`  Questions: ${JSON.stringify(r.questions)}`);
    console.log(`  Feedback: ${JSON.stringify(r.feedback)}`);
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
