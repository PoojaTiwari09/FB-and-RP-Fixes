const { PrismaClient } = require('./packages/database/node_modules/.prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const REPS = [
  { name: 'Alex Morgan',    initials: 'AM', color: '#3b82f6' },
  { name: 'Sarah Chen',     initials: 'SC', color: '#8b5cf6' },
  { name: 'Michael Torres', initials: 'MT', color: '#10b981' },
  { name: 'Jennifer Kim',   initials: 'JK', color: '#f59e0b' },
  { name: 'David Park',     initials: 'DP', color: '#ef4444' },
  { name: 'Emily White',    initials: 'EW', color: '#06b6d4' },
  { name: 'Ryan Brooks',    initials: 'RB', color: '#ec4899' },
];

const MANAGERS = [
  { name: 'S. Morris', initials: 'SM', color: '#3b82f6' },
  { name: 'D. Kim',    initials: 'DK', color: '#8b5cf6' },
  { name: 'L. Ramos',  initials: 'LR', color: '#10b981' },
];

const SCORECARD_TYPES = ['Discovery Call', 'Demo, AB call', 'Cold outreach', 'Negotiation', 'QBR'];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('Seeding call reviews for scorecards dashboard...');

  const reviews = [];
  let reviewNum = 1;

  // Create 80 reviews spread across last 60 days
  for (let i = 0; i < 80; i++) {
    const rep = REPS[i % REPS.length];
    const manager = MANAGERS[i % MANAGERS.length];
    const scorecardType = SCORECARD_TYPES[i % SCORECARD_TYPES.length];
    const daysBack = randomBetween(0, 59);
    const score = randomBetween(55, 95);

    reviews.push({
      tenantId: TENANT_ID,
      reviewId: `rv_scorecard_${String(reviewNum).padStart(4, '0')}`,
      callTitle: `${scorecardType} — ${rep.name}`,
      salesRep: rep.name,
      reviewer: manager.name,
      scorecardName: scorecardType,
      scorecardId: `sc_${(i % 5) + 1}`,
      scorecardVersion: 'v2.3',
      reviewMode: 'AI-Assisted',
      overallScore: score,
      status: score >= 70 ? 'Completed' : 'Needs attention',
      priority: score < 65 ? 'High' : 'Medium',
      dateTime: daysAgo(daysBack).toISOString(),
      createdAt: daysAgo(daysBack),
      callType: scorecardType,
      duration: `${randomBetween(15, 55)}:${String(randomBetween(0, 59)).padStart(2, '0')}`,
      hasReview: true,
      keyHighlights: ['Strong discovery questions', 'Good objection handling'],
      aiFlags: score < 70 ? ['Low score', 'Needs coaching'] : [],
      risksDetected: [],
      actionItemsList: ['Follow up within 24 hours'],
      quickStats: { topics: randomBetween(3, 7), actionItems: randomBetween(1, 4) },
      talkRatio: { rep: randomBetween(35, 55), customer: randomBetween(45, 65) },
      aiSummary: `${scorecardType} scored ${score}/100. Rep showed ${score >= 75 ? 'strong' : 'developing'} skills in discovery and objection handling.`,
      questions: [],
      feedback: {},
    });
    reviewNum++;
  }

  let created = 0;
  for (const r of reviews) {
    await prisma.callReview.upsert({
      where: { reviewId: r.reviewId },
      update: { overallScore: r.overallScore, status: r.status },
      create: r,
    });
    created++;
  }

  console.log(`Created ${created} call reviews`);

  // Seed ManagerCoachingConfig with scorecards data
  const coachingData = {
    id: `coaching_config_${TENANT_ID}`,
    tenantId: TENANT_ID,
    scorecards: REPS.map((rep, i) => ({
      repName: rep.name,
      initials: rep.initials,
      color: rep.color,
      overallScore: randomBetween(60, 92),
      trend: i % 3 === 0 ? 'Rising' : i % 3 === 1 ? 'Stable' : 'Declining',
      scorecardsReceived: randomBetween(8, 22),
    })),
    filters: {},
    activity: {},
    interaction: {},
    responsiveness: {},
    aiInsights: {},
    teamVsBenchmark: {},
  };

  await prisma.managerCoachingConfig.upsert({
    where: { id: coachingData.id },
    update: { scorecards: coachingData.scorecards },
    create: coachingData,
  });
  console.log('Created ManagerCoachingConfig');

  // Verify
  const total = await prisma.callReview.count({ where: { tenantId: TENANT_ID } });
  console.log(`Total reviews in DB for tenant: ${total}`);
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
