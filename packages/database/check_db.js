const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Database Inspection ===');
  
  const users = await prisma.user.findMany();
  console.log('\n--- Users ---');
  console.table(users.map(u => ({ id: u.id, name: u.name, role: u.role, email: u.email })));

  console.log('\n--- Deals Owner mapping ---');
  const deals = await prisma.deal.findMany();
  const dealOwners = {};
  deals.forEach(d => {
    const key = `${d.ownerId} (${d.ownerName || 'Unknown'})`;
    dealOwners[key] = (dealOwners[key] || 0) + 1;
  });
  console.log(dealOwners);

  console.log('\n--- CallRecords Owner mapping ---');
  const calls = await prisma.callRecord.findMany();
  const callOwners = {};
  calls.forEach(c => {
    const key = `${c.callOwner}`;
    callOwners[key] = (callOwners[key] || 0) + 1;
  });
  console.log(callOwners);

  console.log('\n--- CallReviews Rep mapping ---');
  const reviews = await prisma.callReview.findMany();
  const reviewReps = {};
  reviews.forEach(r => {
    const key = `${r.salesRep}`;
    reviewReps[key] = (reviewReps[key] || 0) + 1;
  });
  console.log(reviewReps);

  console.log('\n--- EngageTasks Assignee mapping ---');
  const tasks = await prisma.engageTask.findMany();
  const taskAssignees = {};
  tasks.forEach(t => {
    const key = `${t.assigneeId} (${t.assigneeName || 'Unknown'})`;
    taskAssignees[key] = (taskAssignees[key] || 0) + 1;
  });
  console.log(taskAssignees);

  console.log('\n--- ForecastSubmissions Rep mapping ---');
  const submissions = await prisma.forecastSubmission.findMany();
  const submissionReps = {};
  submissions.forEach(s => {
    const key = `${s.repUserId}`;
    submissionReps[key] = (submissionReps[key] || 0) + 1;
  });
  console.log(submissionReps);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
