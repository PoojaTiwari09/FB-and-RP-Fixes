import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const MANAGER_ID = '00000000-0000-0000-0000-000000000002';
const PRIMARY_REP_ID = '00000000-0000-0000-0000-000000000003';

const TEAM = [
  { id: '00000000-0000-0000-0000-000000000003', repId: 'rep-01', name: 'Alex Morgan',  email: 'alex.morgan@relanto.ai',  commit: 4500000, bestCase: 5200000, status: 'submitted', aiProjection: 4100000, region: 'Americas', quota: 5000000 },
  { id: '00000000-0000-0000-0000-000000000004', repId: 'rep-02', name: 'Sarah Chen',  email: 'sarah.chen@company.com',  commit: 5900000, bestCase: 6500000, status: 'approved',  aiProjection: 5800000, region: 'EMEA',     quota: 6000000 },
  { id: '00000000-0000-0000-0000-000000000005', repId: 'rep-03', name: 'Michael Rodriguez',  email: 'michael.rod@company.com',  commit: 3800000, bestCase: 4500000, status: 'submitted', aiProjection: 2800000, region: 'APAC',     quota: 4000000 },
  { id: '00000000-0000-0000-0000-000000000006', repId: 'rep-04', name: 'David Park',   email: 'david.park@company.com',  commit: 4400000, bestCase: 4800000, status: 'approved',  aiProjection: 4400000, region: 'Americas', quota: 4500000 },
  { id: '00000000-0000-0000-0000-000000000007', repId: 'rep-05', name: 'Emily Thompson',  email: 'emily.thompson@company.com',  commit: 5200000, bestCase: 6000000, status: 'draft',     aiProjection: 3800000, region: 'EMEA',     quota: 5500000 },
];

const ACTIVE_DEALS = [
  { deal: 'HDFC Renewal', stage: 'Proposal', amount: 8000000, aiConf: 'Med', close: 'Jun 28', closeDate: '2026-06-28T00:00:00Z', stageRate: 0.58, timeDecay: 1.0, region: 'APAC' },
  { deal: 'Infosys Exp.', stage: 'Negotiation', amount: 12000000, aiConf: 'High', close: 'Jun 22', closeDate: '2026-06-22T00:00:00Z', stageRate: 0.74, timeDecay: 1.0, region: 'APAC' },
  { deal: 'Wipro Pilot', stage: 'Discovery', amount: 5000000, aiConf: 'Low', close: 'Jun 5', closeDate: '2026-06-05T00:00:00Z', stageRate: 0.20, timeDecay: 1.0, region: 'Americas' },
  { deal: 'TCS License', stage: 'Proposal', amount: 24000000, aiConf: 'Med', close: 'Jun 30', closeDate: '2026-06-30T00:00:00Z', stageRate: 0.58, timeDecay: 1.0, region: 'EMEA' },
  { deal: 'Tata Steel CRM', stage: 'Negotiation', amount: 6500000, aiConf: 'High', close: 'Jun 18', closeDate: '2026-06-18T00:00:00Z', stageRate: 0.74, timeDecay: 1.0, region: 'Americas' },
  { deal: 'Reliance Digital', stage: 'Discovery', amount: 19000000, aiConf: 'Low', close: 'Jun 10', closeDate: '2026-06-10T00:00:00Z', stageRate: 0.20, timeDecay: 1.0, region: 'APAC' },
].map((deal) => ({
  ...deal,
  contributionFactor: deal.stageRate * deal.timeDecay,
  contribution: Math.round(deal.amount * deal.stageRate * deal.timeDecay),
}));

// Closed Won deals attributed to each rep for Q2 FY26 (so per-rep projections include closed revenue)
const CLOSED_WON_REP01 = [
  { name: 'Pinnacle Corp - Renewal', amount: 18400000, region: 'Americas' },
  { name: 'Apex Solutions', amount: 9700000, region: 'Americas' },
  { name: 'ZenCloud Enterprise', amount: 7800000, region: 'APAC' },
  { name: 'Harman Auto Tech', amount: 5200000, region: 'Americas' },
  { name: 'Edelweiss Capital', amount: 4100000, region: 'Americas' },
];

const CLOSED_WON_REP02 = [
  { name: 'BlueStar Technologies', amount: 14200000, region: 'EMEA' },
  { name: 'Meridian Logistics', amount: 11000000, region: 'APAC' },
  { name: 'Greenfield EMEA', amount: 6600000, region: 'EMEA' },
  { name: 'DHL Freight Analytics', amount: 4800000, region: 'EMEA' },
];

async function main() {
  const tenantId = TENANT_ID;

  // Clean up existing data to ensure idempotent seeding
  await prisma.boardSubmissionAnnotation.deleteMany({ where: { tenantid: tenantId } });
  await prisma.boardExclusion.deleteMany({ where: { tenantid: tenantId } });
  await prisma.boardCrmMapping.deleteMany({ where: { tenantid: tenantId } });
  await prisma.boardReminderConfig.deleteMany({ where: { tenantid: tenantId } });
  await prisma.boardColumn.deleteMany({ where: { tenantid: tenantId } });
  await prisma.forecastBoard.deleteMany({ where: { tenantid: tenantId } });
  await prisma.quota.deleteMany({ where: { tenantid: tenantId } });
  await prisma.forecastAuditLog.deleteMany({ where: { tenantid: tenantId } });
  await prisma.forecastSubmission.deleteMany({ where: { tenantid: tenantId } });
  await prisma.aiForecastSnapshot.deleteMany({
    where: { OR: [ { tenantid: tenantId },
        { idempotencyKey: { startsWith: 'seed-' } },
      ],
    },
  });
  await prisma.crmDeal.deleteMany({ where: { tenantid: tenantId } });
  await prisma.forecastUser.deleteMany({ where: { tenantid: tenantId } });
  await prisma.forecastPeriod.deleteMany({ where: { tenantid: tenantId } });
  await prisma.historicalConversionRate.deleteMany({ where: { tenantid: tenantId } });

  const DEMO_PERIOD_IDS = [
    '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000b3',
    '00000000-0000-0000-0000-0000000000b4'
  ];
  const DEMO_BOARD_IDS = [
    '00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-0000000000a2'
  ];
  await prisma.forecastBoard.deleteMany({ where: { id: { in: DEMO_BOARD_IDS } } });
  await prisma.forecastPeriod.deleteMany({ where: { id: { in: DEMO_PERIOD_IDS } } });

  // 1. Seed Users (Manager + 5 Reps)
  const manager = await prisma.forecastUser.upsert({
    where: { email: 'manager@example.com' },
    update: { tenantid: tenantId, name: 'Sarah Johnson', role: 'manager', region: 'Company', managerId: null },
    create: { id: MANAGER_ID, tenantid: tenantId, name: 'Sarah Johnson', email: 'manager@example.com', password: 'password123', role: 'manager', region: 'Company' }
  });
  console.log('Manager seeded:', manager.name);

  const cro = await prisma.forecastUser.upsert({
    where: { email: 'cro@demo.com' },
    update: { tenantid: tenantId },
    create: { tenantid: tenantId, name: 'Sarah Executive', email: 'cro@demo.com', password: 'cro123', role: 'executive', region: 'Company' }
  });
  console.log('CRO seeded:', cro.name);

  for (const rep of TEAM) {
    await prisma.forecastUser.upsert({
      where: { email: rep.email },
      update: { tenantid: tenantId, name: rep.name, repId: rep.repId, region: rep.region, managerId: manager.id },
      create: { 
        id: rep.id,
        tenantid: tenantId, 
        name: rep.name, 
        email: rep.email, 
        password: 'password123', 
        role: 'sales_rep', 
        repId: rep.repId,
        region: rep.region,
        managerId: manager.id
      }
    });
  }
  console.log('5 Sales Rep users seeded');

  // 1. Create Forecast Periods
  const q1 = await prisma.forecastPeriod.create({
    data: {
      id: '00000000-0000-0000-0000-0000000000b1',
      tenantid: tenantId,
      name: 'Q1 FY26',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
      revenueTarget: 100000000,
      status: 'closed',
    },
  });

  const q2 = await prisma.forecastPeriod.create({
    data: {
      id: '00000000-0000-0000-0000-0000000000b2',
      tenantid: tenantId,
      name: 'Q2 FY26',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-06-30T23:59:59Z'),
      revenueTarget: 150000000,
      status: 'open',
    },
  });

  // Seed Forecast Boards for Q1 and Q2 so the Forecast Boards API works
  await prisma.forecastBoard.create({
    data: {
      id: '00000000-0000-0000-0000-0000000000a1',
      tenantid: tenantId,
      name: 'Q1 FY26 Forecast Board',
      scope: 'Global Sales Org',
      periodType: 'Quarterly',
      activePeriod: q1.id,
      status: 'active',
      isPublished: true,
      columns: {
        create: [
          { tenantid: tenantId, label: 'Pipeline', type: 'Metric', submissionMode: 'Auto', sortOrder: 1 },
          { tenantid: tenantId, label: 'Best Case', type: 'Submission', submissionMode: 'Manual', sortOrder: 2 },
          { tenantid: tenantId, label: 'Commit', type: 'Submission', submissionMode: 'Manual', sortOrder: 3 },
          { tenantid: tenantId, label: 'Closed Won', type: 'Metric', submissionMode: 'Auto', sortOrder: 4 },
        ]
      }
    }
  });

  await prisma.forecastBoard.create({
    data: {
      id: '00000000-0000-0000-0000-0000000000a2',
      tenantid: tenantId,
      name: 'Q2 FY26 Forecast Board',
      scope: 'Global Sales Org',
      periodType: 'Quarterly',
      activePeriod: q2.id,
      status: 'active',
      isPublished: true,
      columns: {
        create: [
          { id: '00000000-0000-0000-0000-0000000000c1', tenantid: tenantId, label: 'Pipeline', type: 'Metric', submissionMode: 'Auto', sortOrder: 1 },
          { id: '00000000-0000-0000-0000-0000000000c2', tenantid: tenantId, label: 'Best Case', type: 'Submission', submissionMode: 'Manual', sortOrder: 2 },
          { id: '00000000-0000-0000-0000-0000000000c3', tenantid: tenantId, label: 'Commit', type: 'Submission', submissionMode: 'Manual', sortOrder: 3 },
          { id: '00000000-0000-0000-0000-0000000000c4', tenantid: tenantId, label: 'Closed Won', type: 'Metric', submissionMode: 'Auto', sortOrder: 4 },
        ]
      }
    }
  });

  // ── Historical Forecast Periods needed for baseline lookups ──────────────
  const q4fy25 = await prisma.forecastPeriod.create({
    data: {
      id: '00000000-0000-0000-0000-0000000000b3',
      tenantid: tenantId,
      name: 'Q4 FY25',
      startDate: new Date('2025-10-01T00:00:00Z'),
      endDate: new Date('2025-12-31T23:59:59Z'),
      revenueTarget: 110000000,
      status: 'closed',
    },
  });

  const q2fy25 = await prisma.forecastPeriod.create({
    data: {
      id: '00000000-0000-0000-0000-0000000000b4',
      tenantid: tenantId,
      name: 'Q2 FY25',
      startDate: new Date('2025-04-01T00:00:00Z'),
      endDate: new Date('2025-06-30T23:59:59Z'),
      revenueTarget: 90000000,
      status: 'closed',
    },
  });

  // 2. Historical Conversion Rates — Q1 FY26 (current period rates with periodName)
  await prisma.historicalConversionRate.createMany({
    data: [
      { tenantid: tenantId, fromStage: 'Proposal', toStage: 'Negotiation', conversionRate: 0.58, sampleSize: 60, computedFromPeriod: q1.id, periodName: 'Q1 FY26' },
      { tenantid: tenantId, fromStage: 'Negotiation', toStage: 'Closed', conversionRate: 0.74, sampleSize: 55, computedFromPeriod: q1.id, periodName: 'Q1 FY26' },
      { tenantid: tenantId, fromStage: 'Discovery', toStage: 'Proposal', conversionRate: 0.20, sampleSize: 80, computedFromPeriod: q1.id, periodName: 'Q1 FY26' },
    ],
  });
  console.log('Q1 FY26 conversion rates seeded.');

  // Conversion Rates — Q4 FY25
  await prisma.historicalConversionRate.createMany({
    data: [
      { tenantid: tenantId, fromStage: 'Proposal', toStage: 'Negotiation', conversionRate: 0.55, sampleSize: 52, computedFromPeriod: q4fy25.id, periodName: 'Q4 FY25' },
      { tenantid: tenantId, fromStage: 'Negotiation', toStage: 'Closed', conversionRate: 0.70, sampleSize: 48, computedFromPeriod: q4fy25.id, periodName: 'Q4 FY25' },
      { tenantid: tenantId, fromStage: 'Discovery', toStage: 'Proposal', conversionRate: 0.18, sampleSize: 70, computedFromPeriod: q4fy25.id, periodName: 'Q4 FY25' },
    ],
  });
  console.log('Q4 FY25 conversion rates seeded.');

  // Conversion Rates — Q2 FY25 (same quarter last year relative to Q2 FY26)
  await prisma.historicalConversionRate.createMany({
    data: [
      { tenantid: tenantId, fromStage: 'Proposal', toStage: 'Negotiation', conversionRate: 0.52, sampleSize: 45, computedFromPeriod: q2fy25.id, periodName: 'Q2 FY25' },
      { tenantid: tenantId, fromStage: 'Negotiation', toStage: 'Closed', conversionRate: 0.68, sampleSize: 40, computedFromPeriod: q2fy25.id, periodName: 'Q2 FY25' },
      { tenantid: tenantId, fromStage: 'Discovery', toStage: 'Proposal', conversionRate: 0.17, sampleSize: 62, computedFromPeriod: q2fy25.id, periodName: 'Q2 FY25' },
    ],
  });
  console.log('Q2 FY25 conversion rates seeded.');

  // 3. Expected-deal rate (simulated in ai_forecast_snapshots)
  // 4. Closed-won amount simulation
  // 5. Create forecast submissions for the demo team
  const olderDraft = await prisma.forecastSubmission.create({
    data: {
      tenantid: tenantId,
      periodId: q2.id,
      repUserId: TEAM[0].id,
      lob: 'Enterprise Software',
      commitForecast: 42000000,
      bestCaseForecast: 50000000,
      notes: 'Early draft...',
      status: 'draft',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      version: 1,
    },
  });

  const submission = await prisma.forecastSubmission.create({
    data: {
      tenantid: tenantId,
      periodId: q2.id,
      repUserId: TEAM[0].id,
      lob: 'Enterprise Software',
      commitForecast: 45000000,
      bestCaseForecast: 52000000,
      notes: 'Initial draft for Q2',
      status: 'draft',
      version: 2,
    },
  });

  for (const rep of TEAM.filter((item) => item.repId !== 'rep-01')) {
    const repSubmission = await prisma.forecastSubmission.create({
      data: {
        tenantid: tenantId,
      periodId: q2.id,
        repUserId: rep.id,
        lob: 'Enterprise Software',
        commitForecast: rep.commit,
        bestCaseForecast: rep.bestCase,
        notes: `${rep.name} Q2 forecast.`,
        status: rep.status,
        submittedAt: rep.status === 'draft' ? null : new Date('2026-05-18T10:00:00Z'),
        approvedAt: rep.status === 'approved' ? new Date('2026-05-18T14:00:00Z') : null,
      },
    });

    await prisma.forecastAuditLog.create({
      data: {
        tenantid: tenantId,
        forecastSubmissionId: repSubmission.id,
        action: rep.status === 'approved' ? 'Approved' : rep.status === 'submitted' ? 'Submitted' : 'Draft created',
        actorId: rep.status === 'approved' ? manager.id : rep.id,
        actorRole: rep.status === 'approved' ? 'Manager' : 'Sales Rep',
      },
    });
  }

  // 6. Audit Log
  await prisma.forecastAuditLog.create({
    data: {
      tenantid: tenantId,
        forecastSubmissionId: submission.id,
      action: 'Draft created',
      actorId: TEAM[0].id,
      actorRole: 'Sales Rep',
    },
  });

  // 7. Initial AI snapshot for Q2
  await prisma.aiForecastSnapshot.create({
    data: {
      tenantid: tenantId,
      periodId: q2.id,
      predictedAmount: 142600000,
      confidenceRangeLow: 130000000,
      confidenceRangeHigh: 155000000,
      modelInputs: {
        expectedDealRate: 0.124,
        deals: ACTIVE_DEALS,
        closedWonDetails: {
          total: 89800000,
          deals: [...CLOSED_WON_REP01, ...CLOSED_WON_REP02]
        },
        pipelineByStage: [
          { stage: 'Proposal sent', pipeline: 32000000, convRate: 0.58, contribution: 18600000 },
          { stage: 'Negotiation', pipeline: 18500000, convRate: 0.74, contribution: 13700000 },
          { stage: 'Discovery', pipeline: 24000000, convRate: 0.20, contribution: 4800000 }
        ],
        expectedDeals: {
          rate: 0.124,
          addressablePipeline: 126600000,
          contribution: 15700000
        }
      },
      inputPipelineValue: 126600000,
      idempotencyKey: 'seed-q2-initial',
    },
  });

  // Seed AI snapshots for historical periods to enable viewing their pipelines
  const historicalPeriods = [q1.id, q4fy25.id, q2fy25.id];
  for (const pid of historicalPeriods) {
    await prisma.aiForecastSnapshot.create({
      data: {
        tenantid: tenantId,
      periodId: pid,
        predictedAmount: 95000000,
        confidenceRangeLow: 90000000,
        confidenceRangeHigh: 100000000,
        modelInputs: {
          expectedDealRate: 0.1,
          deals: ACTIVE_DEALS.map(d => ({ ...d, amount: Math.floor(d.amount * 0.8) })),
          closedWonDetails: { total: 40000000, deals: [] },
          pipelineByStage: [],
          expectedDeals: { rate: 0.1, addressablePipeline: 80000000, contribution: 8000000 }
        },
        inputPipelineValue: 80000000,
        idempotencyKey: `seed-${pid}-initial`,
      },
    });
  }

  // 8. Generate 60 historical CRM deals to meet the TDD M06_PREDICTION_MIN_SAMPLE_SIZE requirement
  const stages = ['Proposal', 'Negotiation', 'Discovery', 'Closed Won', 'Closed Lost'];
  const crmDeals = Array.from({ length: 150 }).map((_, i) => {
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const isClosedWon = stage === 'Closed Won';
    const isClosedLost = stage === 'Closed Lost';
    
    // Distribute across Q2 FY25 (Apr-Jun 25), Q4 FY25 (Oct-Dec 25), Q1 FY26 (Jan-Mar 26), Q2 FY26 (Apr-Jun 26)
    const periodDates = [
      new Date(`2025-05-15T00:00:00Z`), // Q2 FY25
      new Date(`2025-11-15T00:00:00Z`), // Q4 FY25
      new Date(`2026-02-15T00:00:00Z`), // Q1 FY26
      new Date(`2026-05-15T00:00:00Z`), // Q2 FY26 (current)
    ];
    const closeDate = periodDates[i % 4];

    return {
      tenantid: tenantId,
      dealName: `Historical Deal ${i + 1}`,
      stage,
      // Larger realistic amounts: 1Cr to 5Cr
      amount: Math.floor(Math.random() * 40000000) + 10000000,
      closeDate,
      probability: isClosedWon ? 1.0 : isClosedLost ? 0.0 : Math.random(),
      isClosedWon,
      isClosedLost,
      region: ['Americas', 'EMEA', 'APAC'][i % 3],
    };
  });

  await prisma.crmDeal.createMany({
    data: [
      // Rep-01 Closed Won deals (attributed to Rahul Kumar)
      ...CLOSED_WON_REP01.map((deal, index) => ({
        tenantid: tenantId,
      dealName: deal.name,
        stage: 'Closed Won',
        amount: deal.amount,
        closeDate: new Date(`2026-05-${String(index + 5).padStart(2, '0')}T00:00:00Z`),
        probability: 1.0,
        isClosedWon: true,
        isClosedLost: false,
        region: deal.region,
        repUserId: TEAM[0].id,
      })),
      // Rep-02 Closed Won deals (attributed to Priya Mehta)
      ...CLOSED_WON_REP02.map((deal, index) => ({
        tenantid: tenantId,
      dealName: deal.name,
        stage: 'Closed Won',
        amount: deal.amount,
        closeDate: new Date(`2026-05-${String(index + 10).padStart(2, '0')}T00:00:00Z`),
        probability: 1.0,
        isClosedWon: true,
        isClosedLost: false,
        region: deal.region,
        repUserId: TEAM[1].id,
      })),
      // Active open deals (rep-01 gets first 4, rep-02 gets last 2)
      ...ACTIVE_DEALS.map((deal, index) => ({
        tenantid: tenantId,
      dealName: deal.deal,
        stage: deal.stage,
        amount: deal.amount,
        closeDate: new Date(deal.closeDate),
        probability: deal.contributionFactor,
        isClosedWon: false,
        isClosedLost: false,
        region: deal.region ?? 'Americas',
        repUserId: index < 3 ? TEAM[0].id : TEAM[1].id,
      })),
      // Historical deals (no rep assigned — used for AI model training only)
      ...crmDeals
    ]
  });

  // 9. Seed Quotas (Feature 3)
  for (const rep of TEAM) {
    await prisma.quota.create({
      data: {
        tenantid: tenantId,
      periodId: q2.id,
        repUserId: rep.id,
        amount: rep.quota,
      },
    });
  }
  console.log('Quotas seeded for 5 sales reps.');

  console.log('M06 seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

