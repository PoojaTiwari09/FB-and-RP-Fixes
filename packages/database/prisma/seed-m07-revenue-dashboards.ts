import { PrismaClient } from '../node_modules/.prisma/client';

/**
 * Seeds demo Accounts and Deals for the M07 Revenue Dashboards module.
 *
 * Tenant: DEALS_DEMO_TENANT = 11111111-1111-1111-1111-111111111111
 *
 * Creates two distinct quarters of data so the "Last Quarter" period filter
 * returns genuinely different data from "This Quarter":
 *   - Q2-2026 (current quarter)  → active pipeline deals
 *   - Q1-2026 (last quarter)     → closed + some slipped deals
 *
 * Run:
 *   npx ts-node -P tsconfig.json packages/database/prisma/seed-m07-revenue-dashboards.ts
 */

const prisma = new PrismaClient();

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

// Rep IDs shared with other modules
const ALEX_MORGAN_ID  = '00000000-0000-0000-0000-000000000003';
const SARAH_CHEN_ID   = '00000000-0000-0000-0000-000000000004';
const MICHAEL_ROD_ID  = '00000000-0000-0000-0000-000000000005';
const DAVID_PARK_ID   = '00000000-0000-0000-0000-000000000006';
const EMILY_THOMP_ID  = '00000000-0000-0000-0000-000000000007';

// ── Accounts ──────────────────────────────────────────────────────────────────
const ACCOUNTS = [
  // Q2-2026 accounts (current pipeline)
  { id: 'a7000001-0000-0000-0000-000000000001', name: 'Salesforce Inc',    industry: 'Technology',    accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000002', name: 'Oracle Corp',       industry: 'Technology',    accountType: 'Customer' },
  { id: 'a7000001-0000-0000-0000-000000000003', name: 'Microsoft Azure',   industry: 'Technology',    accountType: 'Renewal'  },
  { id: 'a7000001-0000-0000-0000-000000000004', name: 'AWS Cloud',         industry: 'Technology',    accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000005', name: 'Stripe Payments',   industry: 'Fintech',       accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000006', name: 'Twilio Comm',       industry: 'Telecom',       accountType: 'Customer' },
  { id: 'a7000001-0000-0000-0000-000000000007', name: 'HubSpot CRM',       industry: 'Software',      accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000008', name: 'Zendesk Support',   industry: 'Software',      accountType: 'Customer' },
  // Q1-2026 accounts (last quarter)
  { id: 'a7000001-0000-0000-0000-000000000011', name: 'Acme Technologies', industry: 'Manufacturing', accountType: 'Customer' },
  { id: 'a7000001-0000-0000-0000-000000000012', name: 'TechGiant Corp',    industry: 'Technology',    accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000013', name: 'Meridian Health',   industry: 'Healthcare',    accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000014', name: 'DataStream Inc',    industry: 'Technology',    accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000015', name: 'CloudFirst Co',     industry: 'Software',      accountType: 'Customer' },
  { id: 'a7000001-0000-0000-0000-000000000016', name: 'Nexus Solutions',   industry: 'Consulting',    accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000017', name: 'Global Dynamics',   industry: 'Manufacturing', accountType: 'Partner'  },
  { id: 'a7000001-0000-0000-0000-000000000018', name: 'Vertex Systems',    industry: 'Technology',    accountType: 'Customer' },
  { id: 'a7000001-0000-0000-0000-000000000019', name: 'InnovateCo',        industry: 'Retail',        accountType: 'Prospect' },
  { id: 'a7000001-0000-0000-0000-000000000020', name: 'PrimeSoft',         industry: 'Software',      accountType: 'Prospect' },
];

// ── Deals ─────────────────────────────────────────────────────────────────────
const Q2_DEALS = [
  {
    id: 'd7000002-0000-0000-0000-000000000001',
    accountId: 'a7000001-0000-0000-0000-000000000001',
    name: 'Salesforce Inc — Enterprise Platform',
    stage: 'Discovery',
    amount: 120000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-28'),
    ownerId: ALEX_MORGAN_ID,
    ownerName: 'Alex Morgan',
    confidenceScore: 45,
    riskScore: 35,
    riskFlags: [],
    isWon: false,
    forecastCategory: 'Pipeline',
    probability: 20,
    dealType: 'New Business',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000002',
    accountId: 'a7000001-0000-0000-0000-000000000002',
    name: 'Oracle Corp — Analytics Suite',
    stage: 'Proposal',
    amount: 250000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-20'),
    ownerId: SARAH_CHEN_ID,
    ownerName: 'Sarah Chen',
    confidenceScore: 62,
    riskScore: 40,
    riskFlags: ['MULTI_VENDOR'],
    isWon: false,
    forecastCategory: 'Best Case',
    probability: 50,
    dealType: 'New Business',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000003',
    accountId: 'a7000001-0000-0000-0000-000000000003',
    name: 'Microsoft Azure — Renewal + Expansion',
    stage: 'Negotiation',
    amount: 400000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-15'),
    ownerId: MICHAEL_ROD_ID,
    ownerName: 'Michael Rodriguez',
    confidenceScore: 78,
    riskScore: 20,
    riskFlags: [],
    isWon: false,
    forecastCategory: 'Commit',
    probability: 75,
    dealType: 'Renewal',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000004',
    accountId: 'a7000001-0000-0000-0000-000000000004',
    name: 'AWS Cloud — Pilot License',
    stage: 'Discovery',
    amount: 85000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-30'),
    ownerId: DAVID_PARK_ID,
    ownerName: 'David Park',
    confidenceScore: 38,
    riskScore: 55,
    riskFlags: ['SINGLE_THREADED'],
    isWon: false,
    forecastCategory: 'Pipeline',
    probability: 20,
    dealType: 'New Business',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000005',
    accountId: 'a7000001-0000-0000-0000-000000000005',
    name: 'Stripe Payments — Revenue Intelligence',
    stage: 'Proposal',
    amount: 175000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-25'),
    ownerId: EMILY_THOMP_ID,
    ownerName: 'Emily Thompson',
    confidenceScore: 55,
    riskScore: 45,
    riskFlags: ['NO_NEXT_STEP'],
    isWon: false,
    forecastCategory: 'Best Case',
    probability: 50,
    dealType: 'New Business',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000006',
    accountId: 'a7000001-0000-0000-0000-000000000006',
    name: 'Twilio Comm — Platform Upgrade',
    stage: 'Negotiation',
    amount: 310000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-18'),
    ownerId: ALEX_MORGAN_ID,
    ownerName: 'Alex Morgan',
    confidenceScore: 72,
    riskScore: 28,
    riskFlags: [],
    isWon: false,
    forecastCategory: 'Commit',
    probability: 75,
    dealType: 'Expansion',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000007',
    accountId: 'a7000001-0000-0000-0000-000000000007',
    name: 'HubSpot CRM — Starter Package',
    stage: 'Discovery',
    amount: 65000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-30'),
    ownerId: SARAH_CHEN_ID,
    ownerName: 'Sarah Chen',
    confidenceScore: 42,
    riskScore: 50,
    riskFlags: ['SINGLE_THREADED', 'NO_EXECUTIVE_SPONSOR'],
    isWon: false,
    forecastCategory: 'Pipeline',
    probability: 20,
    dealType: 'New Business',
  },
  {
    id: 'd7000002-0000-0000-0000-000000000008',
    accountId: 'a7000001-0000-0000-0000-000000000008',
    name: 'Zendesk Support — Enterprise Suite',
    stage: 'Proposal',
    amount: 145000,
    quarter: 'Q2-2026',
    closeDate: new Date('2026-06-22'),
    ownerId: MICHAEL_ROD_ID,
    ownerName: 'Michael Rodriguez',
    confidenceScore: 60,
    riskScore: 38,
    riskFlags: ['MULTI_VENDOR'],
    isWon: false,
    forecastCategory: 'Best Case',
    probability: 50,
    dealType: 'New Business',
  },
];

const Q1_DEALS = [
  // Closed Won
  {
    id: 'd7000001-0000-0000-0000-000000000001',
    accountId: 'a7000001-0000-0000-0000-000000000011',
    name: 'Acme Technologies — Growth Platform',
    stage: 'Closed Won',
    amount: 180000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-15'),
    ownerId: SARAH_CHEN_ID,
    ownerName: 'Sarah Chen',
    confidenceScore: 91,
    riskScore: 10,
    riskFlags: [],
    isWon: true,
    forecastCategory: 'Closed Won',
    probability: 100,
    dealType: 'New Business',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000002',
    accountId: 'a7000001-0000-0000-0000-000000000012',
    name: 'TechGiant Corp — Enterprise License',
    stage: 'Closed Won',
    amount: 350000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-28'),
    ownerId: DAVID_PARK_ID,
    ownerName: 'David Park',
    confidenceScore: 95,
    riskScore: 8,
    riskFlags: [],
    isWon: true,
    forecastCategory: 'Closed Won',
    probability: 100,
    dealType: 'New Business',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000003',
    accountId: 'a7000001-0000-0000-0000-000000000013',
    name: 'Meridian Health — Data Suite',
    stage: 'Closed Won',
    amount: 220000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-20'),
    ownerId: ALEX_MORGAN_ID,
    ownerName: 'Alex Morgan',
    confidenceScore: 88,
    riskScore: 12,
    riskFlags: [],
    isWon: true,
    forecastCategory: 'Closed Won',
    probability: 100,
    dealType: 'Expansion',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000008',
    accountId: 'a7000001-0000-0000-0000-000000000018',
    name: 'Vertex Systems — Annual Renewal',
    stage: 'Closed Won',
    amount: 90000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-02-28'),
    ownerId: EMILY_THOMP_ID,
    ownerName: 'Emily Thompson',
    confidenceScore: 93,
    riskScore: 7,
    riskFlags: [],
    isWon: true,
    forecastCategory: 'Closed Won',
    probability: 100,
    dealType: 'Renewal',
  },
  // Closed Lost
  {
    id: 'd7000001-0000-0000-0000-000000000004',
    accountId: 'a7000001-0000-0000-0000-000000000014',
    name: 'DataStream Inc — Analytics Platform',
    stage: 'Closed Lost',
    amount: 150000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-10'),
    ownerId: MICHAEL_ROD_ID,
    ownerName: 'Michael Rodriguez',
    confidenceScore: 30,
    riskScore: 75,
    riskFlags: ['COMPETITOR_MENTIONED', 'PRICE_OBJECTION'],
    isWon: false,
    forecastCategory: 'Closed Lost',
    probability: 0,
    dealType: 'New Business',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000005',
    accountId: 'a7000001-0000-0000-0000-000000000015',
    name: 'CloudFirst Co — Cloud Migration',
    stage: 'Closed Lost',
    amount: 280000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-25'),
    ownerId: SARAH_CHEN_ID,
    ownerName: 'Sarah Chen',
    confidenceScore: 25,
    riskScore: 80,
    riskFlags: ['COMPETITOR_MENTIONED', 'BUDGET_FREEZE'],
    isWon: false,
    forecastCategory: 'Closed Lost',
    probability: 0,
    dealType: 'New Business',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000009',
    accountId: 'a7000001-0000-0000-0000-000000000019',
    name: 'InnovateCo — Revenue Intelligence Suite',
    stage: 'Closed Lost',
    amount: 210000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-02-20'),
    ownerId: DAVID_PARK_ID,
    ownerName: 'David Park',
    confidenceScore: 22,
    riskScore: 82,
    riskFlags: ['NO_BUDGET', 'COMPETITOR_MENTIONED'],
    isWon: false,
    forecastCategory: 'Closed Lost',
    probability: 0,
    dealType: 'New Business',
  },
  // Slipped deals — tagged Q1 but still active (pipeline visibility for last quarter view)
  {
    id: 'd7000001-0000-0000-0000-000000000006',
    accountId: 'a7000001-0000-0000-0000-000000000016',
    name: 'Nexus Solutions — Consulting Package',
    stage: 'Negotiation',
    amount: 195000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-31'),
    ownerId: ALEX_MORGAN_ID,
    ownerName: 'Alex Morgan',
    confidenceScore: 65,
    riskScore: 42,
    riskFlags: ['DELAYED_DECISION'],
    isWon: false,
    forecastCategory: 'Best Case',
    probability: 75,
    dealType: 'New Business',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000007',
    accountId: 'a7000001-0000-0000-0000-000000000017',
    name: 'Global Dynamics — Partner Integration',
    stage: 'Proposal',
    amount: 125000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-25'),
    ownerId: EMILY_THOMP_ID,
    ownerName: 'Emily Thompson',
    confidenceScore: 50,
    riskScore: 55,
    riskFlags: ['SINGLE_THREADED', 'DELAYED_DECISION'],
    isWon: false,
    forecastCategory: 'Pipeline',
    probability: 50,
    dealType: 'New Business',
  },
  {
    id: 'd7000001-0000-0000-0000-000000000010',
    accountId: 'a7000001-0000-0000-0000-000000000020',
    name: 'PrimeSoft — Starter License',
    stage: 'Discovery',
    amount: 75000,
    quarter: 'Q1-2026',
    closeDate: new Date('2026-03-15'),
    ownerId: MICHAEL_ROD_ID,
    ownerName: 'Michael Rodriguez',
    confidenceScore: 35,
    riskScore: 60,
    riskFlags: ['NO_NEXT_STEP'],
    isWon: false,
    forecastCategory: 'Pipeline',
    probability: 20,
    dealType: 'New Business',
  },
];

async function main() {
  console.log('--- Seeding M07 Revenue Dashboards demo data ---');

  // Ensure demo tenant exists
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: { id: TENANT_ID, name: 'M07 Demo Tenant', slug: 'm07-demo-tenant' },
  });
  console.log('✔ Demo tenant');

  // Seed accounts
  for (const acc of ACCOUNTS) {
    await prisma.account.upsert({
      where: { id: acc.id },
      update: { name: acc.name, industry: acc.industry },
      create: {
        id: acc.id,
        tenantid: TENANT_ID,
        name: acc.name,
        industry: acc.industry,
      },
    });
  }
  console.log(`✔ ${ACCOUNTS.length} accounts`);

  // Seed current-quarter deals (Q2-2026)
  for (const d of Q2_DEALS) {
    await prisma.deal.upsert({
      where: { id: d.id },
      update: {
        stage: d.stage,
        amount: d.amount,
        quarter: d.quarter,
        closeDate: d.closeDate,
        confidenceScore: d.confidenceScore,
        riskScore: d.riskScore,
        riskFlags: d.riskFlags,
        isWon: d.isWon,
        forecastCategory: d.forecastCategory,
        probability: d.probability,
        dealType: d.dealType,
        ownerName: d.ownerName,
      },
      create: {
        id: d.id,
        tenantid: TENANT_ID,
        accountId: d.accountId,
        ownerId: d.ownerId,
        ownerName: d.ownerName,
        name: d.name,
        stage: d.stage,
        amount: d.amount,
        quarter: d.quarter,
        closeDate: d.closeDate,
        isWon: d.isWon,
        confidenceScore: d.confidenceScore,
        riskScore: d.riskScore,
        riskFlags: d.riskFlags,
        forecastCategory: d.forecastCategory,
        probability: d.probability,
        dealType: d.dealType,
      },
    });
  }
  console.log(`✔ ${Q2_DEALS.length} Q2-2026 deals`);

  // Seed last-quarter deals (Q1-2026)
  for (const d of Q1_DEALS) {
    await prisma.deal.upsert({
      where: { id: d.id },
      update: {
        stage: d.stage,
        amount: d.amount,
        quarter: d.quarter,
        closeDate: d.closeDate,
        confidenceScore: d.confidenceScore,
        riskScore: d.riskScore,
        riskFlags: d.riskFlags,
        isWon: d.isWon,
        forecastCategory: d.forecastCategory,
        probability: d.probability,
        dealType: d.dealType,
        ownerName: d.ownerName,
      },
      create: {
        id: d.id,
        tenantid: TENANT_ID,
        accountId: d.accountId,
        ownerId: d.ownerId,
        ownerName: d.ownerName,
        name: d.name,
        stage: d.stage,
        amount: d.amount,
        quarter: d.quarter,
        closeDate: d.closeDate,
        isWon: d.isWon,
        confidenceScore: d.confidenceScore,
        riskScore: d.riskScore,
        riskFlags: d.riskFlags,
        forecastCategory: d.forecastCategory,
        probability: d.probability,
        dealType: d.dealType,
      },
    });
  }
  console.log(`✔ ${Q1_DEALS.length} Q1-2026 deals`);

  console.log('--- M07 seed completed ---');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
