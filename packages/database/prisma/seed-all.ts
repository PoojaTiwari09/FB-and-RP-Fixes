import { PrismaClient } from '../node_modules/.prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedEngageData } from './seed-engage';

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TENANT_SLUG = 'relanto';
const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  console.log('--- Database Seeding Started ---');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log('Seeding Tenant...');
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: { name: 'Relanto', slug: TENANT_SLUG, status: 'ACTIVE' },
    create: {
      id: TENANT_ID,
      name: 'Relanto',
      slug: TENANT_SLUG,
      status: 'ACTIVE',
    },
  });

  console.log('Seeding Users...');
  const usersToSeed = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@relanto.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'alex.morgan@relanto.com',
      name: 'Alex Morgan',
      role: 'MANAGER',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'sarah.chen@relanto.com',
      name: 'Sarah Chen',
      role: 'SALES_REP',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'michael.rod@relanto.com',
      name: 'Michael Rodriguez',
      role: 'SALES_REP',
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'david.park@relanto.com',
      name: 'David Park',
      role: 'SALES_REP',
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      email: 'sujeevan@relanto.com',
      name: 'Sujeevan',
      role: 'SALES_REP',
    },
  ] as const;

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        tenantid: TENANT_ID,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        status: 'ACTIVE',
      },
      create: {
        id: u.id,
        tenantid: TENANT_ID,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        status: 'ACTIVE',
      },
    });
  }

  await seedEngageData(prisma);

  console.log('Seeding Call Records...');
  const callRecordsData = [
    {
      id: '00000000-0000-0000-0001-000000000001',
      title: 'Discovery Call - Acme Corp Q2 Initiative',
      callOwner: '33333333-3333-3333-3333-333333333333',
      accountId: null,
      callDate: new Date('2026-05-14T10:00:00Z'),
      durationSeconds: 2723,
      callType: 'Discovery',
      callSource: 'Zoom',
      participants: ['Sarah Chen', 'John Smith'],
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
      transcriptStatus: 'completed',
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      title: 'Product Demo - TechStart Solutions',
      callOwner: '44444444-4444-4444-4444-444444444444',
      accountId: null,
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
        tenantid: TENANT_ID,
        ...c,
      },
    });

    await prisma.transcript.upsert({
      where: { callId: rec.id },
      update: {},
      create: {
        callId: rec.id,
        tenantid: TENANT_ID,
        fullText: 'Seeded full text',
        summary: `Seeded transcript for ${rec.title}. Prospect showed interest in key features.`,
      },
    });
  }

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
      sentimentSummary: 'Mixed - positive on product, concern on pricing',
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
        tenantid: TENANT_ID,
        ...r,
      },
    });
  }

  console.log('Seeding Training Scenarios...');
  const scenariosToSeed = [
    {
      scenarioid: '00000000-0000-0000-0000-000000000101',
      name: 'Angry Client - Downtime Discussion',
      personadescription: 'Upset IT Executive dealing with downtime issues.',
      context: 'Client is upset about recent downtime and wants to cancel contract.',
      difficulty: 'advanced',
      createdby: '22222222-2222-2222-2222-222222222222',
    },
    {
      scenarioid: '00000000-0000-0000-0000-000000000102',
      name: 'Pricing Objection - SaaS Expansion',
      personadescription: 'Procurement manager trying to negotiate 25% discount.',
      context: 'Prospect loves the tool but claims budget is tight.',
      difficulty: 'medium',
      createdby: '33333333-3333-3333-3333-333333333333',
    },
  ];

  for (const s of scenariosToSeed) {
    await prisma.trainerscenarios.upsert({
      where: { scenarioid: s.scenarioid },
      update: s,
      create: {
        tenantid: TENANT_ID,
        ...s,
      },
    });
  }

  console.log(`--- Database Seeding Completed (default password: ${DEFAULT_PASSWORD}) ---`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
