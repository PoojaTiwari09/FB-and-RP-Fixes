import { PrismaClient } from '../node_modules/.prisma/client';
import { seedEngageData } from './seed-engage';

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('--- Database Seeding Started ---');

  // 1. Seed Tenant
  console.log('Seeding Tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'Default Tenant',
      slug: 'default',
    },
  });

  // 2. Seed Users
  console.log('Seeding Users...');
  const usersToSeed = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@company.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: 'admin_hash',
    },
    {
      id: 'me',
      email: 'alex.morgan@relanto.ai',
      name: 'Alex Morgan',
      role: 'SALES_REP',
      passwordHash: 'alex_hash',
    },
    {
      id: 'sarah',
      email: 'sarah.chen@company.com',
      name: 'Sarah Chen',
      role: 'SALES_REP',
      passwordHash: 'sarah_hash',
    },
    {
      id: 'michael',
      email: 'michael.rod@company.com',
      name: 'Michael Rodriguez',
      role: 'SALES_REP',
      passwordHash: 'michael_hash',
    },
    {
      id: 'jennifer',
      email: 'jennifer.kim@company.com',
      name: 'Jennifer Kim',
      role: 'MANAGER',
      passwordHash: 'jennifer_hash',
    },
    {
      id: 'david',
      email: 'david.park@company.com',
      name: 'David Park',
      role: 'SALES_REP',
      passwordHash: 'david_hash',
    },
    {
      id: 'emily',
      email: 'emily.thompson@company.com',
      name: 'Emily Thompson',
      role: 'SALES_REP',
      passwordHash: 'emily_hash',
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: u.email } },
      update: { name: u.name, role: u.role as any },
      create: {
        id: u.id,
        tenantId: TENANT_ID,
        email: u.email,
        name: u.name,
        role: u.role as any,
        passwordHash: u.passwordHash,
      },
    });
  }

  await seedEngageData(prisma);

  // 8. Seed CallRecords + Transcripts
  console.log('Seeding Call Records...');
  const callRecordsData = [
    {
      id: 'call_001',
      title: 'Discovery Call - Acme Corp Q2 Initiative',
      callOwner: 'Sarah Chen',
      accountId: 'Acme Corp',
      callDate: new Date('2026-05-14T10:00:00Z'),
      durationSeconds: 2723,
      callType: 'Discovery',
      callSource: 'Zoom',
      participants: ['Sarah Chen', 'John Smith'],
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
      transcriptStatus: 'completed',
    },
    {
      id: 'call_002',
      title: 'Product Demo - TechStart Solutions',
      callOwner: 'Michael Rodriguez',
      accountId: 'TechStart Solutions',
      callDate: new Date('2026-05-14T14:30:00Z'),
      durationSeconds: 3135,
      callType: 'Demo',
      callSource: 'Zoom',
      participants: ['Michael Rodriguez', 'Lisa Park'],
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
      transcriptStatus: 'completed',
    },
  ];

  for (const c of callRecordsData) {
    const rec = await prisma.callRecord.upsert({
      where: { id: c.id },
      update: c,
      create: {
        tenantId: TENANT_ID,
        ...c,
      },
    });

    await prisma.transcript.upsert({
      where: { callId: rec.id },
      update: {},
      create: {
        callId: rec.id,
        summary: `Seeded transcript for ${rec.title}. Prospect showed interest in key features.`,
      },
    });
  }

  // 9. Seed Call Reviews
  console.log('Seeding Call Reviews...');
  const reviewsData = [
    {
      reviewId: 'rv_001',
      callTitle: 'Discovery Call - Acme Corp Q2 Initiative',
      salesRep: 'Sarah Chen',
      customer: 'Acme Corporation',
      dateTime: '2026-05-14T10:00:00Z',
      duration: '45:23',
      callType: 'Discovery',
      dealLinked: 'Acme Corp - Q2 Sales Automation',
      callSource: 'Zoom',
      participants: [
        { name: 'Sarah Chen', role: 'Rep' },
        { name: 'John Smith', role: 'VP Sales' },
      ],
      aiSummary: 'This was a discovery call with Acme Corp to understand their Q2 sales automation needs.',
      keyHighlights: ['Prospect has budget approved for Q2', 'Competing with 2 other vendors'],
      talkRatio: { rep: 45, customer: 55 },
      sentimentSummary: 'Overall positive (65%) with some concerns about implementation complexity',
      sentimentScore: 65,
      risksDetected: ['No clear decision-making process established'],
      actionItemsList: ['Send technical requirements document'],
      scorecardName: 'Discovery Call Scorecard',
      scorecardVersion: 'v2.3',
      reviewMode: 'AI-Assisted',
      dueDate: '2026-05-16T23:59:00Z',
      status: 'Pending',
      reviewer: 'You',
      quickStats: { topics: 5, actionItems: 3 },
      aiFlags: ['High Risk Deal', 'No Next Steps'],
      hasReview: true,
      questions: [],
      feedback: [],
    },
    {
      reviewId: 'rv_002',
      callTitle: 'Product Demo - TechStart Solutions',
      salesRep: 'Michael Rodriguez',
      customer: 'TechStart Solutions',
      dateTime: '2026-05-14T14:30:00Z',
      duration: '52:15',
      callType: 'Demo',
      dealLinked: 'TechStart Solutions Deal',
      callSource: 'Zoom',
      participants: [
        { name: 'Michael Rodriguez', role: 'Rep' },
        { name: 'Lisa Park', role: 'CTO' },
      ],
      aiSummary: 'Michael delivered a solid product demo to TechStart Solutions.',
      keyHighlights: ['Strong product demonstration of core features'],
      talkRatio: { rep: 60, customer: 40 },
      sentimentSummary: 'Mixed â€” positive on product, concern on pricing',
      sentimentScore: 58,
      risksDetected: ['Pricing objection unresolved'],
      actionItemsList: ['Send pricing proposal'],
      scorecardName: 'Demo Call Scorecard',
      scorecardVersion: 'v1.5',
      reviewMode: 'AI-Assisted',
      dueDate: '2026-05-15T23:59:00Z',
      status: 'In Progress',
      reviewer: 'You',
      quickStats: { topics: 4, actionItems: 2 },
      aiFlags: ['Objection Issue'],
      hasReview: true,
      questions: [],
      feedback: [],
    },
  ];

  for (const r of reviewsData) {
    await prisma.callReview.upsert({
      where: { reviewId: r.reviewId },
      update: r,
      create: {
        tenantId: TENANT_ID,
        ...r,
      },
    });
  }

  // 10. Seed Training Scenarios
  console.log('Seeding Training Scenarios...');
  const scenariosToSeed = [
    {
      scenarioid: 'seed-scenario-1',
      name: 'Angry Client - Downtime Discussion',
      personadescription: 'Upset IT Executive dealing with downtime issues.',
      context: 'Client is upset about recent downtime and wants to cancel contract.',
      difficulty: 'advanced',
      createdby: 'me',
    },
    {
      scenarioid: 'seed-scenario-2',
      name: 'Pricing Objection - SaaS Expansion',
      personadescription: 'Procurement manager trying to negotiate 25% discount.',
      context: 'Prospect loves the tool but claims budget is tight.',
      difficulty: 'medium',
      createdby: 'me',
    },
  ];

  for (const s of scenariosToSeed) {
    await prisma.trainerscenarios.upsert({
      where: { scenarioid: s.scenarioid },
      update: s,
      create: {
        tenantId: TENANT_ID,
        ...s,
      },
    });
  }

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
